import { z } from "zod";
import { inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { models, suppressedSlugs } from "@/db/schema";
import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";
import { canonicalModelIdentity } from "@/lib/model-normalization";

export const dynamic = "force-dynamic";

/**
 * Rumor-discovery ingest target for the n8n news-feed workflow.
 *
 * Distinct from `/api/ingest/models`: that route is strictly extractive from
 * a provider's own page. This one is explicitly speculative — public chatter
 * about a model no lab has confirmed — so it writes to different columns
 * (`rumorSourceUrl`, never `announcementUrl`) and every new row lands as
 * `rumored`, never anything more confident.
 *
 * A genuinely new slug is inserted as rumored. An already-tracked slug is
 * refreshed — that's the "updated daily as new information appears" half of
 * this — but only while the model is still unconfirmed. The `setWhere`
 * guard makes that a single upsert rather than a read-then-branch: once a
 * model has a real announcement or has actually shipped, this route's
 * updates silently no-op against it instead of overwriting real data with
 * yesterday's chatter.
 *
 * A slug in `suppressedSlugs` is dropped before either branch runs, so a
 * rumor removed in /admin stays removed rather than reappearing on the next
 * scrape.
 */
const rumorSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens"),
  // Guards against a placeholder value ("Unknown", "<UNKNOWN>", "N/A")
  // rather than trusting the classifier's instruction to skip those rows —
  // this field feeds provider badges and filters everywhere on the site, so
  // a placeholder here is worse than one bad row silently dropped.
  provider: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .refine((v) => !/^(unknown|n\/?a|none|tbd|<.*>)$/i.test(v), "provider looks like a placeholder"),
  predictedDate: z.string().date().nullish(),
  summary: z.string().trim().min(10).max(500),
  sourceUrl: z.string().trim().url().max(2000),
  // Older workflow exports omitted these fields. Defaults preserve backwards
  // compatibility while the shared classifier contract moves collectors to
  // explicit evidence grading.
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  evidenceType: z
    .enum([
      "provider_statement",
      "credible_reporting",
      "leak",
      "community_speculation",
    ])
    .default("credible_reporting"),
});

const payloadSchema = z.object({
  rumors: z.array(rumorSchema).min(1).max(50),
});

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

  // Drop anything deliberately removed before, so a deletion sticks. Without
  // this the upsert below treats a suppressed slug as brand new and inserts
  // it again on the very next run — see `suppressedSlugs` in the schema.
  // Filtered here rather than in the upsert's `setWhere`, because that guard
  // only narrows the UPDATE branch; the INSERT is the branch that resurrects.
  const suppressed = new Set(
    (await db.select({ slug: suppressedSlugs.slug }).from(suppressedSlugs)).map((r) => r.slug),
  );
  const normalized = parsed.data.rumors.map((r) => ({
    ...r,
    ...canonicalModelIdentity(r),
  }));
  const accepted = normalized.filter((r) => !suppressed.has(r.slug));
  const skipped = normalized.length - accepted.length;

  if (!accepted.length) {
    return Response.json({ ok: true, upserted: 0, skipped });
  }

  const existing = await db.query.models.findMany({
    where: inArray(models.slug, accepted.map((r) => r.slug)),
    columns: { slug: true, rumorSources: true },
  });
  const existingSources = new Map(existing.map((m) => [m.slug, m.rumorSources ?? []]));

  const rows = accepted.map((r) => {
    const observation = {
      url: r.sourceUrl,
      summary: r.summary,
      observedAt: now.toISOString(),
      predictedDate: r.predictedDate ?? null,
      confidence: r.confidence,
      evidenceType: r.evidenceType,
    };
    const history = existingSources.get(r.slug) ?? [];
    const withoutSameUrl = history.filter((source) => source.url !== r.sourceUrl);
    return {
      name: r.name,
      slug: r.slug,
      provider: r.provider,
      status: "rumored" as const,
      predictedDate: r.predictedDate ?? null,
      rumorSummary: r.summary,
      rumorSourceUrl: r.sourceUrl,
      rumorConfidence: r.confidence,
      rumorEvidenceType: r.evidenceType,
      rumorSources: [...withoutSameUrl, observation].slice(-12),
      claimUpdatedAt: now,
    };
  });

  try {
    const result = await db
      .insert(models)
      .values(rows)
      .onConflictDoUpdate({
        target: models.slug,
        set: {
          predictedDate: sql`excluded.predicted_date`,
          rumorSummary: sql`excluded.rumor_summary`,
          rumorSourceUrl: sql`excluded.rumor_source_url`,
          rumorConfidence: sql`excluded.rumor_confidence`,
          rumorEvidenceType: sql`excluded.rumor_evidence_type`,
          rumorSources: sql`excluded.rumor_sources`,
          claimUpdatedAt: sql`excluded.claim_updated_at`,
        },
        // Never touches a model that already has a real announcement or has
        // shipped — see the module comment above.
        setWhere: sql`${models.announcementUrl} IS NULL AND ${models.status} != 'released'`,
      })
      .returning({ id: models.id, slug: models.slug });

    return Response.json({ ok: true, upserted: result.length, skipped });
  } catch (err) {
    console.error("[ingest/rumors] insert failed", err);
    return Response.json({ error: "Database write failed" }, { status: 500 });
  }
}
