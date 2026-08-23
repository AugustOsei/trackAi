import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { models, reports } from "@/db/schema";
import type { Model } from "@/db/schema";

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

export async function getApprovedReportsFeed() {
  return db.query.reports.findMany({
    where: eq(reports.status, "approved"),
    orderBy: [desc(reports.approvedAt)],
    with: { model: true },
  });
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
