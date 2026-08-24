import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";

export const dynamic = "force-dynamic";

/**
 * CLAIM-layer sync target for the n8n provider-announcement workflow.
 *
 * Everything written here is what a provider said about its own model —
 * a summary of its announcement, the figures that announcement quoted, and
 * a link back to it. This layer publishes without review, so the workflow
 * is constrained to be extractive: it may only restate what the page says.
 *
 * Upserts on `slug`, so re-running the sync refreshes a claim rather than
 * duplicating the model.
 */
const modelSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens"),
  provider: z.string().trim().min(1).max(120),
  status: z.enum(["rumored", "announced", "released"]).default("released"),
  predictedDate: z.string().date().nullish(),
  actualDate: z.string().date().nullish(),
  providerBlurb: z.string().trim().max(2000).nullish(),
  announcementUrl: z.string().trim().url().max(2000).nullish(),
  // Free-form because every lab quotes a different set of tests.
  claimedBenchmarks: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(120),
        value: z.string().trim().min(1).max(60),
      }),
    )
    .max(12)
    .nullish(),
  pricePerMtok: z.number().nullish(),
  summaryIsAutoDrafted: z.boolean().default(false),
});

const payloadSchema = z.object({
  models: z.array(modelSchema).min(1).max(500),
});

const num = (v: number | null | undefined) => (v === null || v === undefined ? null : String(v));

/**
 * The reality-check workflow needs to know what to search Hacker News for.
 * Returns the searchable identity of each tracked model — no benchmark data,
 * nothing the public pages don't already show.
 */
export async function GET(request: Request) {
  if (!isAuthorizedIngest(request)) return unauthorized();

  const rows = await db
    .select({
      slug: models.slug,
      name: models.name,
      provider: models.provider,
      // Lets the claim workflow skip models whose announcement is already
      // recorded, instead of re-researching every model every night.
      announcementUrl: models.announcementUrl,
    })
    .from(models)
    .orderBy(desc(models.createdAt));

  return Response.json({ ok: true, count: rows.length, models: rows });
}

export async function POST(request: Request) {
  if (!isAuthorizedIngest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues.slice(0, 10) },
      { status: 422 },
    );
  }

  const now = new Date();
  const rows = parsed.data.models.map((m) => ({
    name: m.name,
    slug: m.slug,
    provider: m.provider,
    status: m.status,
    predictedDate: m.predictedDate ?? null,
    actualDate: m.actualDate ?? null,
    providerBlurb: m.providerBlurb ?? null,
    announcementUrl: m.announcementUrl ?? null,
    claimedBenchmarks: m.claimedBenchmarks ?? [],
    pricePerMtok: num(m.pricePerMtok),
    summaryIsAutoDrafted: m.summaryIsAutoDrafted,
    claimUpdatedAt: now,
  }));

  try {
    const result = await db
      .insert(models)
      .values(rows)
      .onConflictDoUpdate({
        target: models.slug,
        set: {
          name: sql`excluded.name`,
          provider: sql`excluded.provider`,
          // `status` is deliberately absent from this SET clause. The claim
          // workflow's payload never includes one — filtered out by Zod's
          // `.default("released")` — so this used to fire on every existing
          // model that workflow touched, silently flipping a merely
          // *announced* model to *released* the moment its announcement
          // page was found, whether or not it had actually shipped. Status
          // transitions need their own deliberate signal; enriching a claim
          // isn't one.
          predictedDate: sql`excluded.predicted_date`,
          actualDate: sql`excluded.actual_date`,
          // Keep an existing human-written blurb if the sync sends nothing.
          providerBlurb: sql`coalesce(excluded.provider_blurb, ${models.providerBlurb})`,
          announcementUrl: sql`coalesce(excluded.announcement_url, ${models.announcementUrl})`,
          claimedBenchmarks: sql`excluded.claimed_benchmarks`,
          pricePerMtok: sql`excluded.price_per_mtok`,
          summaryIsAutoDrafted: sql`excluded.summary_is_auto_drafted`,
          claimUpdatedAt: sql`excluded.claim_updated_at`,
        },
      })
      .returning({ id: models.id, slug: models.slug });

    return Response.json({ ok: true, upserted: result.length });
  } catch (err) {
    console.error("[ingest/models] insert failed", err);
    return Response.json({ error: "Database write failed" }, { status: 500 });
  }
}
