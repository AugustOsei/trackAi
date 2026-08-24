import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";

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
 */
const rumorSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens"),
  provider: z.string().trim().min(1).max(120),
  predictedDate: z.string().date().nullish(),
  summary: z.string().trim().min(10).max(500),
  sourceUrl: z.string().trim().url().max(2000),
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
  const rows = parsed.data.rumors.map((r) => ({
    name: r.name,
    slug: r.slug,
    provider: r.provider,
    status: "rumored" as const,
    predictedDate: r.predictedDate ?? null,
    rumorSummary: r.summary,
    rumorSourceUrl: r.sourceUrl,
    claimUpdatedAt: now,
  }));

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
          claimUpdatedAt: sql`excluded.claim_updated_at`,
        },
        // Never touches a model that already has a real announcement or has
        // shipped — see the module comment above.
        setWhere: sql`${models.announcementUrl} IS NULL AND ${models.status} != 'released'`,
      })
      .returning({ id: models.id, slug: models.slug });

    return Response.json({ ok: true, upserted: result.length });
  } catch (err) {
    console.error("[ingest/rumors] insert failed", err);
    return Response.json({ error: "Database write failed" }, { status: 500 });
  }
}
