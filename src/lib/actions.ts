"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { checkAndRecordSubmission, clientIpFrom } from "@/lib/rate-limit";
import {
  createSessionCookieValue,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

const submitSchema = z.object({
  modelId: z.coerce.number().int().positive(),
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
    modelId: formData.get("modelId"),
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
    await db.insert(reports).values({
      modelId: parsed.data.modelId,
      taskCategory: parsed.data.taskCategory,
      takeaway: parsed.data.takeaway,
      sourceUrl: parsed.data.sourceUrl,
      sourceType: "manual",
      status: "pending",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("reports_source_url_idx")) {
      return { error: "That source URL has already been submitted." };
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

export async function approveReport(id: number) {
  await db
    .update(reports)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(reports.id, id));
  revalidatePath("/admin");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function rejectReport(id: number) {
  await db.update(reports).set({ status: "rejected" }).where(eq(reports.id, id));
  revalidatePath("/admin");
}
