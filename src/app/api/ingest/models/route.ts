import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";

export const dynamic = "force-dynamic";

/**
 * Benchmark sync target for the n8n Artificial Analysis workflow.
 *
 * This is the CLAIM layer: high-confidence, provider-reported data that
 * publishes without review. It upserts on `slug`, so the daily sync is
 * idempotent — re-running it refreshes benchmarks rather than duplicating
 * models.
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
  intelligenceIndex: z.number().nullish(),
  codingIndex: z.number().nullish(),
  pricePerMtok: z.number().nullish(),
  speedTps: z.number().nullish(),
  benchmarkSource: z.string().trim().max(120).nullish(),
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
    .select({ slug: models.slug, name: models.name, provider: models.provider })
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
    intelligenceIndex: num(m.intelligenceIndex),
    codingIndex: num(m.codingIndex),
    pricePerMtok: num(m.pricePerMtok),
    speedTps: num(m.speedTps),
    benchmarkSource: m.benchmarkSource ?? null,
    benchmarkUpdatedAt: now,
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
          status: sql`excluded.status`,
          predictedDate: sql`excluded.predicted_date`,
          actualDate: sql`excluded.actual_date`,
          // Keep an existing human-written blurb if the sync sends nothing.
          providerBlurb: sql`coalesce(excluded.provider_blurb, ${models.providerBlurb})`,
          intelligenceIndex: sql`excluded.intelligence_index`,
          codingIndex: sql`excluded.coding_index`,
          pricePerMtok: sql`excluded.price_per_mtok`,
          speedTps: sql`excluded.speed_tps`,
          benchmarkSource: sql`excluded.benchmark_source`,
          benchmarkUpdatedAt: sql`excluded.benchmark_updated_at`,
        },
      })
      .returning({ id: models.id, slug: models.slug });

    return Response.json({ ok: true, upserted: result.length });
  } catch (err) {
    console.error("[ingest/models] insert failed", err);
    return Response.json({ error: "Database write failed" }, { status: 500 });
  }
}
