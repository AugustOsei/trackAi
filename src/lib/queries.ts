import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { models, reports, reportModels, subscribers } from "@/db/schema";
import type { Model, Report } from "@/db/schema";

/** A model as it appears attached to a report. */
export type ReportModelRef = { id: number; name: string; slug: string; provider: string };

export async function getTimelineModels(filters: {
  status?: Model["status"];
  provider?: string;
}) {
  const conditions = [
    filters.status ? eq(models.status, filters.status) : undefined,
    filters.provider ? eq(models.provider, filters.provider) : undefined,
  ].filter(Boolean);

  const rows = await db.query.models.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(sql`coalesce(${models.actualDate}, ${models.predictedDate})`)],
  });

  // Approved reports for these models, one round trip, stitched in JS — the
  // relation include can't filter by report status through the join table.
  const modelIds = rows.map((m) => m.id);
  const links = modelIds.length
    ? await db.query.reportModels.findMany({
        where: inArray(reportModels.modelId, modelIds),
        with: {
          report: {
            columns: {
              id: true,
              taskCategory: true,
              takeaway: true,
              status: true,
              approvedAt: true,
            },
          },
        },
      })
    : [];

  const byModel = new Map<number, { id: number; taskCategory: string; takeaway: string }[]>();
  const approvedAt = new Map<number, number>();
  for (const link of links) {
    if (link.report.status !== "approved") continue;
    const list = byModel.get(link.modelId) ?? [];
    list.push({
      id: link.report.id,
      taskCategory: link.report.taskCategory,
      takeaway: link.report.takeaway,
    });
    byModel.set(link.modelId, list);
    approvedAt.set(link.report.id, link.report.approvedAt?.getTime() ?? 0);
  }
  for (const list of byModel.values()) {
    list.sort((a, b) => (approvedAt.get(b.id) ?? 0) - (approvedAt.get(a.id) ?? 0));
  }

  return rows.map((m) => ({ ...m, reports: byModel.get(m.id) ?? [] }));
}

export async function getProviders() {
  const rows = await db
    .selectDistinct({ provider: models.provider })
    .from(models)
    .orderBy(models.provider);
  return rows.map((r) => r.provider);
}

export async function getModelBySlug(slug: string) {
  const model = await db.query.models.findFirst({ where: eq(models.slug, slug) });
  if (!model) return undefined;

  const links = await db.query.reportModels.findMany({
    where: eq(reportModels.modelId, model.id),
    with: {
      report: {
        with: {
          reportModels: {
            with: { model: { columns: { id: true, name: true, slug: true, provider: true } } },
          },
        },
      },
    },
  });

  const reports = links
    .map((l) => l.report)
    .filter((r) => r.status === "approved")
    .sort((a, b) => (b.approvedAt?.getTime() ?? 0) - (a.approvedAt?.getTime() ?? 0))
    .map((r) => ({
      id: r.id,
      taskCategory: r.taskCategory,
      takeaway: r.takeaway,
      sourceUrl: r.sourceUrl,
      sourceType: r.sourceType,
      status: r.status,
      submittedAt: r.submittedAt,
      approvedAt: r.approvedAt,
      // The other models this same test run covered — drives the
      // "also tested on" line on the model page.
      otherModels: r.reportModels
        .map((rm) => rm.model)
        .filter((mm) => mm.slug !== slug),
    }));

  return { ...model, reports };
}

/** Shape reports coming back from a `reports`-side query into `{ ...report, models }`. */
type ReportWithLinks = Report & { reportModels: { model: ReportModelRef }[] };
function withModels<T extends ReportWithLinks>(rows: T[]) {
  return rows.map(({ reportModels: links, ...report }) => ({
    ...report,
    models: links.map((l) => l.model),
  }));
}

export async function getApprovedReportsFeed(sourceType?: Report["sourceType"]) {
  const rows = await db.query.reports.findMany({
    where: sourceType
      ? and(eq(reports.status, "approved"), eq(reports.sourceType, sourceType))
      : eq(reports.status, "approved"),
    orderBy: [desc(reports.approvedAt)],
    with: {
      reportModels: {
        with: { model: { columns: { id: true, name: true, slug: true, provider: true } } },
      },
    },
  });
  return withModels(rows);
}

/**
 * How many approved reports each source has produced. Drives the filter row,
 * which only shows a source once it has something behind it — an empty chip
 * for a source that has never landed a report advertises a gap rather than a
 * feature.
 */
export async function getApprovedSourceCounts() {
  const rows = await db
    .select({ sourceType: reports.sourceType, count: sql<number>`count(*)::int` })
    .from(reports)
    .where(eq(reports.status, "approved"))
    .groupBy(reports.sourceType);

  return new Map(rows.map((r) => [r.sourceType, r.count]));
}

export async function getPendingReports() {
  const rows = await db.query.reports.findMany({
    where: eq(reports.status, "pending"),
    orderBy: [desc(reports.submittedAt)],
    with: {
      reportModels: {
        with: { model: { columns: { id: true, name: true, slug: true, provider: true } } },
      },
    },
  });
  return withModels(rows);
}

/**
 * Recently approved reports, newest first — the /admin list for fixing a
 * report that was published against the wrong model.
 */
export async function getRecentApprovedReports(limit = 40) {
  const rows = await db.query.reports.findMany({
    where: eq(reports.status, "approved"),
    orderBy: [desc(reports.approvedAt)],
    limit,
    with: {
      reportModels: {
        with: { model: { columns: { id: true, name: true, slug: true, provider: true } } },
      },
    },
  });
  return withModels(rows);
}

export async function getModelOptionsForSubmit() {
  return db
    .select({ id: models.id, name: models.name, provider: models.provider })
    .from(models)
    .orderBy(models.name);
}

/** Models that haven't appeared in a release-alert digest yet. */
export async function getUnalertedModels() {
  return db.query.models.findMany({
    where: isNull(models.alertedAt),
    orderBy: [desc(models.createdAt)],
  });
}

export async function getConfirmedSubscribers() {
  return db
    .select({ id: subscribers.id, email: subscribers.email })
    .from(subscribers)
    .where(eq(subscribers.status, "confirmed"));
}

/** Every model's slug and last claim update, for the sitemap. */
export async function getAllModelSlugsForSitemap() {
  return db
    .select({ slug: models.slug, claimUpdatedAt: models.claimUpdatedAt })
    .from(models);
}

/** Name/slug only, for the rumor classifier to match a mention to an existing model. */
export async function getTrackedModelIdentities() {
  return db.select({ slug: models.slug, name: models.name }).from(models);
}
