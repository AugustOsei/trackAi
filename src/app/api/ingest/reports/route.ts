import { z } from "zod";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { models, reports } from "@/db/schema";
import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";

export const dynamic = "force-dynamic";

/**
 * Reality-check ingestion target for the n8n Hacker News workflow.
 *
 * This is the lower-confidence REALITY layer, so everything written here
 * lands as `pending` and is invisible until approved in /admin — the route
 * has no way to publish directly, by design.
 *
 * Reports arrive keyed by model *slug* rather than id, since n8n has no
 * reason to know database ids. Unknown slugs are skipped and reported back
 * rather than failing the whole batch, so one bad row doesn't lose a run.
 */
const reportSchema = z.object({
  modelSlug: z.string().trim().min(1).max(200),
  taskCategory: z.enum(["coding", "agentic", "vision", "writing", "other"]),
  takeaway: z.string().trim().min(10).max(400),
  sourceUrl: z.string().trim().url(),
  sourceType: z.enum(["hn", "manual"]).default("hn"),
});

const payloadSchema = z.object({
  reports: z.array(reportSchema).min(1).max(100),
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

  try {
    const slugs = [...new Set(parsed.data.reports.map((r) => r.modelSlug))];
    const known = await db
      .select({ id: models.id, slug: models.slug })
      .from(models)
      .where(inArray(models.slug, slugs));

    const idBySlug = new Map(known.map((m) => [m.slug, m.id]));

    const unknownSlugs: string[] = [];
    const rows = [];
    for (const r of parsed.data.reports) {
      const modelId = idBySlug.get(r.modelSlug);
      if (!modelId) {
        unknownSlugs.push(r.modelSlug);
        continue;
      }
      rows.push({
        modelId,
        taskCategory: r.taskCategory,
        takeaway: r.takeaway,
        sourceUrl: r.sourceUrl,
        sourceType: r.sourceType,
        status: "pending" as const,
      });
    }

    let inserted = 0;
    if (rows.length) {
      // The unique index on source_url makes re-running a scrape a no-op
      // for anything already seen, so the workflow needs no cursor state.
      const result = await db
        .insert(reports)
        .values(rows)
        .onConflictDoNothing({ target: reports.sourceUrl })
        .returning({ id: reports.id });
      inserted = result.length;
    }

    return Response.json({
      ok: true,
      inserted,
      duplicatesSkipped: rows.length - inserted,
      unknownSlugs,
    });
  } catch (err) {
    console.error("[ingest/reports] insert failed", err);
    return Response.json({ error: "Database write failed" }, { status: 500 });
  }
}
