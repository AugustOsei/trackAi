/**
 * Development seed.
 *
 * Release names and dates for shipped models are real. They were reconciled
 * against each provider's own announcement page in August 2026 — Anthropic,
 * OpenAI, Google DeepMind, xAI, DeepSeek, Alibaba, Z.AI, Moonshot and Xiaomi
 * newsrooms — rather than a third-party aggregator. A handful of older point
 * releases (some GLM and Qwen minor versions, a few OpenAI size tiers) could
 * not be pinned to a primary source and are kept at their best-known date;
 * the claim workflow replaces all of this once it runs.
 *
 * Scope is language / reasoning models only. Image and video generators
 * (Seedance, Muse Image, Muse Video, Grok Imagine, Qwen Image, Gemini Omni)
 * are deliberately out, even when the same lab also ships an LLM.
 *
 * The CLAIM layer is strictly what each provider published about its own
 * model. Only Claude Opus 5 carries real, sourced figures here (taken from
 * Anthropic's own announcement); every other model has no claimed benchmarks
 * until the n8n claim workflow reads its announcement page. Inventing
 * benchmark numbers and attributing them to a real company would be worse
 * than showing none.
 *
 * `announcementUrl` is left empty on purpose. The claim workflow only visits
 * models that have none, so seeding placeholder links would make it skip
 * everything and never fetch the real announcements.
 *
 * Entries with status `announced` / `rumored` are unconfirmed by definition —
 * they exercise the speculative layer of the product and are not sourced
 * claims about any lab's actual plans.
 */
import { db } from "./index";
import { models, reports, reportModels } from "./schema";
import { SEED } from "./seed-data";

/** Report specs, keyed by model slug(s) — resolved to ids after models insert. */
type SeedReport = {
  modelSlugs: string[];
  taskCategory: "coding" | "agentic" | "vision" | "writing" | "other";
  takeaway: string;
  sourceUrl: string;
  sourceType: "hn" | "reddit" | "youtube" | "forum" | "twitter" | "manual";
  status: "approved" | "pending";
};

const SEED_REPORTS: SeedReport[] = [
  {
    modelSlugs: ["claude-opus-5"],
    taskCategory: "coding",
    takeaway:
      "Handled a multi-file refactor across an unfamiliar Rust codebase without breaking the build, but needed a second pass to fix a borrow-checker edge case.",
    sourceUrl: "https://news.ycombinator.com/item?id=41000001",
    sourceType: "hn",
    status: "approved",
  },
  {
    modelSlugs: ["claude-opus-5"],
    taskCategory: "agentic",
    takeaway:
      "Ran a 40-step browser automation task end to end, but got stuck retrying a flaky selector instead of asking for help.",
    sourceUrl: "https://news.ycombinator.com/item?id=41000002",
    sourceType: "hn",
    status: "approved",
  },
  {
    modelSlugs: ["deepseek-v4-pro"],
    taskCategory: "coding",
    takeaway:
      "Matched a much pricier model on a LeetCode-style set, but degraded noticeably once the prompt exceeded ~60k tokens.",
    sourceUrl: "https://news.ycombinator.com/item?id=41000003",
    sourceType: "hn",
    status: "approved",
  },
  {
    modelSlugs: ["gemini-3-7-flash"],
    taskCategory: "vision",
    takeaway:
      "Correctly read a handwritten whiteboard photo end to end, including a crossed-out line most tools misread as included text.",
    sourceUrl: "https://news.ycombinator.com/item?id=41000004",
    sourceType: "hn",
    status: "approved",
  },
  {
    modelSlugs: ["kimi-k3"],
    taskCategory: "writing",
    takeaway:
      "Held a consistent house style across a 12-section document without re-prompting, which the previous version could not do.",
    sourceUrl: "https://news.ycombinator.com/item?id=41000005",
    sourceType: "hn",
    status: "approved",
  },
  {
    modelSlugs: ["glm-5-3"],
    taskCategory: "agentic",
    takeaway:
      "Ran an overnight scraping agent on a single GPU without falling over, though it silently skipped two failed pages.",
    sourceUrl: "https://news.ycombinator.com/item?id=41000006",
    sourceType: "hn",
    status: "approved",
  },
  // One prompt across three models — exercises the multi-model report path.
  {
    modelSlugs: ["claude-opus-5", "gpt-5-6-sol", "gemini-3-5-flash"],
    taskCategory: "coding",
    takeaway:
      "Same 'port this service to async' prompt on all three: Opus 5 shipped it in one pass, GPT-5.6 Sol needed a nudge on error handling, Gemini 3.5 Flash was fastest but left two TODOs.",
    sourceUrl: "https://news.ycombinator.com/item?id=41000009",
    sourceType: "hn",
    status: "approved",
  },
  {
    modelSlugs: ["gpt-5-6-terra"],
    taskCategory: "coding",
    takeaway:
      "Under review: claimed to fix a race condition in a submitted snippet, reporter says the fix looks plausible but is still testing it under load.",
    sourceUrl: "https://news.ycombinator.com/item?id=41000007",
    sourceType: "manual",
    status: "pending",
  },
  {
    modelSlugs: ["qwen3-8-max"],
    taskCategory: "other",
    takeaway:
      "Submitted report awaiting review — task category and takeaway not yet verified against the source.",
    sourceUrl: "https://news.ycombinator.com/item?id=41000008",
    sourceType: "manual",
    status: "pending",
  },
];

async function seed() {
  console.log("Seeding trackai database...");

  await db.delete(reportModels);
  await db.delete(reports);
  await db.delete(models);

  const inserted = await db.insert(models).values(SEED).returning();
  const bySlug = new Map(inserted.map((m) => [m.slug, m]));
  const id = (slug: string) => {
    const m = bySlug.get(slug);
    if (!m) throw new Error(`seed: unknown slug ${slug}`);
    return m.id;
  };

  for (const spec of SEED_REPORTS) {
    const [row] = await db
      .insert(reports)
      .values({
        taskCategory: spec.taskCategory,
        takeaway: spec.takeaway,
        sourceUrl: spec.sourceUrl,
        sourceType: spec.sourceType,
        status: spec.status,
        approvedAt: spec.status === "approved" ? new Date() : null,
      })
      .returning({ id: reports.id });

    await db
      .insert(reportModels)
      .values(spec.modelSlugs.map((slug) => ({ reportId: row!.id, modelId: id(slug) })));
  }

  console.log(
    `Seed complete: ${inserted.length} models, ${SEED_REPORTS.length} reports.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
