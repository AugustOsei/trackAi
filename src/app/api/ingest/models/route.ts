import { z } from "zod";
import { desc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { models, suppressedSlugs } from "@/db/schema";
import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";
import { canonicalModelIdentity } from "@/lib/model-normalization";

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
  // Optional because the claim-enrichment workflow updates an existing row
  // without making a status decision. A caller that explicitly supplies a
  // status is authoritative and may promote a rumor to released.
  status: z.enum(["rumored", "announced", "released"]).optional(),
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
  const normalized = parsed.data.models.map((m) => ({
    ...m,
    ...canonicalModelIdentity(m),
  }));
  const rows = normalized.map((m) => ({
    name: m.name,
    slug: m.slug,
    provider: m.provider,
    status: m.status ?? ("announced" as const),
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
    const explicitSlugs = new Set(
      normalized.filter((m) => m.status !== undefined).map((m) => m.slug),
    );
    const explicitRows = rows.filter((m) => explicitSlugs.has(m.slug));
    const enrichmentRows = rows.filter((m) => !explicitSlugs.has(m.slug));

    const result = await db.transaction(async (tx) => {
      const returned: { id: number; slug: string }[] = [];

      if (explicitRows.length) {
        returned.push(
          ...(await tx
            .insert(models)
            .values(explicitRows)
            .onConflictDoUpdate({
              target: models.slug,
              set: {
                name: sql`excluded.name`,
                provider: sql`excluded.provider`,
                status: sql`excluded.status`,
                predictedDate: sql`coalesce(excluded.predicted_date, ${models.predictedDate})`,
                actualDate: sql`coalesce(excluded.actual_date, ${models.actualDate})`,
                providerBlurb: sql`coalesce(excluded.provider_blurb, ${models.providerBlurb})`,
                announcementUrl: sql`coalesce(excluded.announcement_url, ${models.announcementUrl})`,
                claimedBenchmarks: sql`CASE WHEN jsonb_array_length(excluded.claimed_benchmarks) > 0 THEN excluded.claimed_benchmarks ELSE ${models.claimedBenchmarks} END`,
                pricePerMtok: sql`coalesce(excluded.price_per_mtok, ${models.pricePerMtok})`,
                summaryIsAutoDrafted: sql`excluded.summary_is_auto_drafted`,
                rumorSummary: sql`CASE WHEN excluded.status = 'released' THEN NULL ELSE ${models.rumorSummary} END`,
                rumorSourceUrl: sql`CASE WHEN excluded.status = 'released' THEN NULL ELSE ${models.rumorSourceUrl} END`,
                rumorConfidence: sql`CASE WHEN excluded.status = 'released' THEN NULL ELSE ${models.rumorConfidence} END`,
                rumorEvidenceType: sql`CASE WHEN excluded.status = 'released' THEN NULL ELSE ${models.rumorEvidenceType} END`,
                claimUpdatedAt: sql`excluded.claim_updated_at`,
              },
            })
            .returning({ id: models.id, slug: models.slug })),
        );

        // A verified official release overrides an old rumor tombstone. This
        // is the recovery path for a legitimate model that was suppressed
        // when it first appeared as noisy or repeatedly shifting chatter.
        const confirmedSlugs = normalized
          .filter((m) => m.status === "released")
          .map((m) => m.slug);
        if (confirmedSlugs.length) {
          await tx
            .delete(suppressedSlugs)
            .where(inArray(suppressedSlugs.slug, confirmedSlugs));
        }
      }

      if (enrichmentRows.length) {
        returned.push(
          ...(await tx
            .insert(models)
            .values(enrichmentRows)
            .onConflictDoUpdate({
              target: models.slug,
              set: {
                name: sql`excluded.name`,
                provider: sql`excluded.provider`,
                providerBlurb: sql`coalesce(excluded.provider_blurb, ${models.providerBlurb})`,
                announcementUrl: sql`coalesce(excluded.announcement_url, ${models.announcementUrl})`,
                claimedBenchmarks: sql`CASE WHEN jsonb_array_length(excluded.claimed_benchmarks) > 0 THEN excluded.claimed_benchmarks ELSE ${models.claimedBenchmarks} END`,
                pricePerMtok: sql`coalesce(excluded.price_per_mtok, ${models.pricePerMtok})`,
                summaryIsAutoDrafted: sql`excluded.summary_is_auto_drafted`,
                claimUpdatedAt: sql`excluded.claim_updated_at`,
              },
            })
            .returning({ id: models.id, slug: models.slug })),
        );
      }

      return returned;
    });

    return Response.json({ ok: true, upserted: result.length });
  } catch (err) {
    console.error("[ingest/models] insert failed", err);
    return Response.json({ error: "Database write failed" }, { status: 500 });
  }
}
