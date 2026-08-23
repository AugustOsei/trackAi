import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  date,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const modelStatusEnum = pgEnum("model_status", [
  "rumored",
  "announced",
  "released",
]);

export const taskCategoryEnum = pgEnum("task_category", [
  "coding",
  "agentic",
  "vision",
  "writing",
  "other",
]);

export const sourceTypeEnum = pgEnum("source_type", ["hn", "manual"]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "approved",
  "rejected",
]);

export const models = pgTable(
  "models",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    provider: varchar("provider", { length: 120 }).notNull(),
    status: modelStatusEnum("status").notNull().default("announced"),
    predictedDate: date("predicted_date"),
    actualDate: date("actual_date"),
    /**
     * The CLAIM layer — strictly what the provider itself says.
     *
     * Deliberately not a fixed set of benchmark columns: every lab quotes
     * different tests (SWE-bench, GPQA, AIME, their own evals) so a rigid
     * schema would either drop most of what a lab reported or leave columns
     * permanently empty. Stored as an ordered list of exactly the figures
     * that lab chose to publish.
     */
    providerBlurb: text("provider_blurb"),
    announcementUrl: text("announcement_url"),
    claimedBenchmarks: jsonb("claimed_benchmarks")
      .$type<{ label: string; value: string }[]>()
      .default([]),
    /** Provider-published list price; the one figure every lab states the same way. */
    pricePerMtok: numeric("price_per_mtok", { precision: 10, scale: 3 }),
    /** Set when the blurb was machine-drafted, so the page can say so. */
    summaryIsAutoDrafted: boolean("summary_is_auto_drafted").notNull().default(false),
    claimUpdatedAt: timestamp("claim_updated_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("models_status_idx").on(table.status),
    index("models_provider_idx").on(table.provider),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    modelId: integer("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "cascade" }),
    taskCategory: taskCategoryEnum("task_category").notNull(),
    takeaway: text("takeaway").notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceType: sourceTypeEnum("source_type").notNull().default("manual"),
    status: reportStatusEnum("status").notNull().default("pending"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
  },
  (table) => [
    index("reports_model_status_idx").on(table.modelId, table.status),
    index("reports_status_submitted_idx").on(table.status, table.submittedAt),
    uniqueIndex("reports_source_url_idx").on(table.sourceUrl),
  ],
);

/**
 * Abuse throttling for the public submit form. Stores a salted hash of the
 * client IP, never the address itself — enough to count repeat submissions
 * in a window, not enough to identify anyone or be useful if leaked.
 * Rows are pruned opportunistically on write.
 */
export const submissionAttempts = pgTable(
  "submission_attempts",
  {
    id: serial("id").primaryKey(),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("submission_attempts_ip_time_idx").on(table.ipHash, table.createdAt)],
);

export const modelsRelations = relations(models, ({ many }) => ({
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  model: one(models, {
    fields: [reports.modelId],
    references: [models.id],
  }),
}));

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
