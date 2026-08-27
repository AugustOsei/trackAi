"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { reports, reportModels, subscribers, MAX_MODELS_PER_REPORT } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { checkAndRecordSubmission, clientIpFrom } from "@/lib/rate-limit";
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { isValidModerationToken } from "@/lib/moderation-token";
import {
  createConfirmToken,
  verifyConfirmToken,
  verifyUnsubscribeToken,
} from "@/lib/subscribe-token";
import { publicBaseUrl } from "@/lib/env";
import { tweetIdFromUrl } from "@/lib/sources";

const submitSchema = z.object({
  modelIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Pick at least one model.")
    .max(MAX_MODELS_PER_REPORT)
    // De-dupe: the picker tries to prevent it, but a hand-crafted POST could
    // still send the same model twice.
    .transform((ids) => [...new Set(ids)]),
  taskCategory: z.enum(["coding", "agentic", "vision", "writing", "other"]),
  takeaway: z.string().trim().min(10, "Give a bit more detail.").max(400),
  sourceUrl: z.string().trim().url("Enter a valid URL."),
});

export type SubmitReportState = {
  error?: string;
  success?: boolean;
};

export async function submitReport(
  _prevState: SubmitReportState,
  formData: FormData,
): Promise<SubmitReportState> {
  // Honeypot: a field hidden from people but not from naive bots. Anything
  // that fills it gets a success response without a write, so the bot has no
  // signal that it was rejected.
  if (typeof formData.get("website") === "string" && formData.get("website") !== "") {
    return { success: true };
  }

  const parsed = submitSchema.safeParse({
    modelIds: formData.getAll("modelId"),
    taskCategory: formData.get("taskCategory"),
    takeaway: formData.get("takeaway"),
    sourceUrl: formData.get("sourceUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const limit = await checkAndRecordSubmission(clientIpFrom(await headers()));
  if (!limit.allowed) {
    return {
      error: `That's a lot of reports at once. Try again in about ${limit.retryAfterMinutes} minutes.`,
    };
  }

  try {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(reports)
        .values({
          taskCategory: parsed.data.taskCategory,
          takeaway: parsed.data.takeaway,
          sourceUrl: parsed.data.sourceUrl,
          sourceType: tweetIdFromUrl(parsed.data.sourceUrl) ? "twitter" : "manual",
          status: "pending",
        })
        .returning({ id: reports.id });

      await tx.insert(reportModels).values(
        parsed.data.modelIds.map((modelId) => ({ reportId: row!.id, modelId })),
      );
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("reports_source_url_idx")) {
      return { error: "That source URL has already been submitted." };
    }
    if (message.includes("report_models_model_id_models_id_fk")) {
      return { error: "One of those models isn't recognised. Refresh and try again." };
    }
    return { error: "Something went wrong saving your report. Try again." };
  }

  revalidatePath("/admin");
  return { success: true };
}

const loginSchema = z.object({ password: z.string().min(1) });

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: "Enter the password." };

  const hash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!hash || !secret) {
    return { error: "Admin auth isn't configured on the server yet." };
  }

  if (!verifyPassword(parsed.data.password, hash)) {
    return { error: "Wrong password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionCookieValue(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}

async function setReportStatus(id: number, status: "approved" | "rejected") {
  // Scoped to pending rows so a replayed link cannot resurrect or re-reject a
  // decision that was already made. Re-clicking is a no-op, not a change.
  await db
    .update(reports)
    .set({ status, approvedAt: status === "approved" ? new Date() : null })
    .where(and(eq(reports.id, id), eq(reports.status, "pending")));

  revalidatePath("/admin");
  if (status === "approved") {
    revalidatePath("/reports");
    revalidatePath("/");
  }
}

export async function approveReport(id: number) {
  await setReportStatus(id, "approved");
}

export async function rejectReport(id: number) {
  await setReportStatus(id, "rejected");
}

/**
 * Set the full list of models a report is about. Used from /admin to fix a
 * submission that landed on the wrong model — often because the right one
 * wasn't on the grid yet when it came in — or to attach the extra models a
 * bake-off actually covered. Gated the same way approve/reject are: the proxy
 * only lets an authenticated session reach any POST under /admin.
 */
export async function setReportModels(formData: FormData): Promise<void> {
  const reportId = Number(formData.get("reportId"));
  const modelIds = [
    ...new Set(
      formData
        .getAll("modelId")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ];

  if (!Number.isInteger(reportId) || reportId <= 0) return;
  // An empty set would orphan the report — leave it as-is rather than hide it.
  if (modelIds.length === 0 || modelIds.length > MAX_MODELS_PER_REPORT) return;

  const row = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
    columns: { status: true },
  });
  if (!row) return;

  await db.transaction(async (tx) => {
    await tx.delete(reportModels).where(eq(reportModels.reportId, reportId));
    await tx.insert(reportModels).values(modelIds.map((modelId) => ({ reportId, modelId })));
  });

  revalidatePath("/admin");
  // An approved report is live on model pages and the feed — refresh
  // everything it could be showing on. Pending reports touch none of that.
  if (row.status === "approved") {
    revalidatePath("/reports");
    revalidatePath("/");
    revalidatePath("/models/[slug]", "page");
  }
}

/**
 * Approve/reject from an emailed review link.
 *
 * The token is verified here, in the mutation itself, rather than only when
 * the page rendered — the page load and the button press are separate
 * requests, and only this one changes anything.
 */
async function moderateViaLink(
  token: string,
  id: number,
  status: "approved" | "rejected",
) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !isValidModerationToken(token, secret)) {
    redirect("/moderate/expired");
  }

  await setReportStatus(id, status);
  revalidatePath(`/moderate/${token}`);
}

export async function approveReportViaLink(token: string, id: number) {
  await moderateViaLink(token, id, "approved");
}

export async function rejectReportViaLink(token: string, id: number) {
  await moderateViaLink(token, id, "rejected");
}

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

export type SubscribeState = {
  error?: string;
  success?: boolean;
  alreadySubscribed?: boolean;
};

/**
 * Public release-alert signup. Double opt-in: this only ever creates a
 * `pending` row and asks n8n to send a confirmation email — nothing is
 * mailed on a schedule until the address itself clicks that link.
 */
export async function subscribe(
  _prevState: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  // Honeypot, same convention as the report form: a bot that fills this
  // gets a success response with no write and no email sent.
  if (typeof formData.get("website") === "string" && formData.get("website") !== "") {
    return { success: true };
  }

  const parsed = subscribeSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const limit = await checkAndRecordSubmission(clientIpFrom(await headers()));
  if (!limit.allowed) {
    return {
      error: `That's a lot of attempts. Try again in about ${limit.retryAfterMinutes} minutes.`,
    };
  }

  const email = parsed.data.email;
  const existing = await db.query.subscribers.findFirst({
    where: eq(subscribers.email, email),
  });

  if (existing?.status === "confirmed") {
    return { success: true, alreadySubscribed: true };
  }

  let subscriberId: number;
  if (existing) {
    // Covers both a re-submitted pending signup and someone who previously
    // unsubscribed and wants back in — either way they still have to click
    // the confirmation link, so this alone doesn't re-enroll anyone.
    await db.update(subscribers).set({ status: "pending" }).where(eq(subscribers.id, existing.id));
    subscriberId = existing.id;
  } else {
    const [row] = await db
      .insert(subscribers)
      .values({ email })
      .returning({ id: subscribers.id });
    subscriberId = row!.id;
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  const webhookUrl = process.env.N8N_SUBSCRIBE_CONFIRM_WEBHOOK_URL;
  const ingestToken = process.env.INGEST_API_TOKEN;
  if (!secret || !webhookUrl || !ingestToken) {
    console.error("[subscribe] missing config for confirmation email");
    return { error: "Something went wrong. Try again in a moment." };
  }

  const confirmUrl = `${publicBaseUrl()}/subscribe/confirm/${createConfirmToken(subscriberId, secret)}`;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${ingestToken}` },
      body: JSON.stringify({ email, confirmUrl }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
  } catch (err) {
    // The subscriber row exists either way — don't block the reader on mail
    // delivery. Worst case they resubmit the same email, which re-sends.
    console.error("[subscribe] confirmation email dispatch failed", err);
  }

  return { success: true };
}

/** Result of clicking a confirmation link — read by the /subscribe/confirm page. */
export async function confirmSubscription(token: string): Promise<"confirmed" | "invalid"> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return "invalid";

  const id = verifyConfirmToken(token, secret);
  if (id === null) return "invalid";

  const updated = await db
    .update(subscribers)
    .set({ status: "confirmed", confirmedAt: new Date() })
    .where(and(eq(subscribers.id, id), eq(subscribers.status, "pending")))
    .returning({ id: subscribers.id });

  if (updated.length > 0) return "confirmed";

  // No pending row matched — could mean an already-confirmed link was
  // clicked twice, which should still read as success, not an error.
  const row = await db.query.subscribers.findFirst({ where: eq(subscribers.id, id) });
  return row?.status === "confirmed" ? "confirmed" : "invalid";
}

/** Result of clicking an unsubscribe link — read by the /subscribe/unsubscribe page. */
export async function unsubscribeFromAlerts(token: string): Promise<"unsubscribed" | "invalid"> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return "invalid";

  const id = verifyUnsubscribeToken(token, secret);
  if (id === null) return "invalid";

  await db
    .update(subscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(eq(subscribers.id, id));

  return "unsubscribed";
}
