import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { models, reports, subscribers } from "@/db/schema";
import type { Model, Report } from "@/db/schema";

export async function getTimelineModels(filters: {
  status?: Model["status"];
  provider?: string;
}) {
  const conditions = [
    filters.status ? eq(models.status, filters.status) : undefined,
    filters.provider ? eq(models.provider, filters.provider) : undefined,
  ].filter(Boolean);

  return db.query.models.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(sql`coalesce(${models.actualDate}, ${models.predictedDate})`)],
    with: {
      reports: {
        where: eq(reports.status, "approved"),
        orderBy: [desc(reports.approvedAt)],
        columns: { id: true, taskCategory: true, takeaway: true },
      },
    },
  });
}

export async function getProviders() {
  const rows = await db
    .selectDistinct({ provider: models.provider })
    .from(models)
    .orderBy(models.provider);
  return rows.map((r) => r.provider);
}

export async function getModelBySlug(slug: string) {
  return db.query.models.findFirst({
    where: eq(models.slug, slug),
    with: {
      reports: {
        where: eq(reports.status, "approved"),
        orderBy: [desc(reports.approvedAt)],
      },
    },
  });
}

export async function getApprovedReportsFeed(sourceType?: Report["sourceType"]) {
  return db.query.reports.findMany({
    where: sourceType
      ? and(eq(reports.status, "approved"), eq(reports.sourceType, sourceType))
      : eq(reports.status, "approved"),
    orderBy: [desc(reports.approvedAt)],
    with: { model: true },
  });
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
  return db.query.reports.findMany({
    where: eq(reports.status, "pending"),
    orderBy: [desc(reports.submittedAt)],
    with: { model: true },
  });
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
