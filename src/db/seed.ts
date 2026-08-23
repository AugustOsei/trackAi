/**
 * Development seed.
 *
 * Release names and dates for shipped models are real, taken from a public
 * release tracker (llmgateway.io) covering Feb–Aug 2026. They are aggregated
 * third-party data, not verified against each lab's own announcement — good
 * enough to build against, and replaced by the Artificial Analysis sync in
 * production.
 *
 * Benchmark numbers here are PLACEHOLDERS. They are labelled as such in
 * `benchmarkSource` rather than attributed to Artificial Analysis, so nothing
 * fabricated is ever shown as sourced. Most models deliberately carry no
 * benchmark at all, which is also the real state before a sync runs.
 *
 * Entries with status `announced` / `rumored` are unconfirmed by definition —
 * they exercise the speculative layer of the product and are not sourced
 * claims about any lab's actual plans.
 */
import { db } from "./index";
import { models, reports } from "./schema";
import type { NewModel } from "./schema";

const PLACEHOLDER = "Seed placeholder (pending Artificial Analysis sync)";

function bench(intelligence: string, coding: string, price: string, speed: string) {
  return {
    intelligenceIndex: intelligence,
    codingIndex: coding,
    pricePerMtok: price,
    speedTps: speed,
    benchmarkSource: PLACEHOLDER,
    benchmarkUpdatedAt: new Date(),
  };
}

const SEED: NewModel[] = [
  // ── February 2026 ────────────────────────────────────────────────────────
  {
    name: "Claude Opus 4.6",
    slug: "claude-opus-4-6",
    provider: "Anthropic",
    status: "released",
    actualDate: "2026-02-05",
    providerBlurb: "Reasoning-focused flagship aimed at long-running agent workflows.",
    ...bench("70.1", "76.9", "15.000", "58.0"),
  },
  // Two labs shipping the same day — different providers, one date marker.
  {
    name: "GLM-5",
    slug: "glm-5",
    provider: "Z.AI",
    status: "released",
    actualDate: "2026-02-15",
    providerBlurb: "Open-weights flagship from Z.AI, strong on tool use for its size.",
    ...bench("64.8", "69.2", "0.600", "96.0"),
  },
  {
    name: "MiniMax M2.5",
    slug: "minimax-m2-5",
    provider: "MiniMax",
    status: "released",
    actualDate: "2026-02-15",
    providerBlurb: "Long-context model with an emphasis on cost per token.",
  },
  {
    name: "Qwen3.5 397B A17B",
    slug: "qwen3-5-397b-a17b",
    provider: "Alibaba",
    status: "released",
    actualDate: "2026-02-16",
    providerBlurb: "Sparse mixture-of-experts release in the Qwen3.5 line.",
  },
  {
    name: "Gemini 3.1 Pro",
    slug: "gemini-3-1-pro",
    provider: "Google DeepMind",
    status: "released",
    actualDate: "2026-02-19",
    providerBlurb: "Native multimodal model with a very large context window.",
    ...bench("68.5", "71.9", "7.000", "110.0"),
  },
  {
    name: "GPT-5.3 Codex",
    slug: "gpt-5-3-codex",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-02-24",
    providerBlurb: "Code-specialised variant tuned for repository-scale edits.",
  },

  // ── March 2026 ───────────────────────────────────────────────────────────
  {
    name: "GPT-5.4",
    slug: "gpt-5-4",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-03-06",
    providerBlurb: "General-purpose update with improved tool-use reliability.",
    ...bench("69.8", "75.1", "10.000", "84.0"),
  },
  // Same provider, same day — a paired small/large launch.
  {
    name: "GPT-5.4 Mini",
    slug: "gpt-5-4-mini",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-03-17",
    providerBlurb: "Smaller, cheaper sibling to GPT-5.4.",
  },
  {
    name: "GPT-5.4 Nano",
    slug: "gpt-5-4-nano",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-03-17",
    providerBlurb: "Smallest GPT-5.4 tier, aimed at high-volume classification.",
  },
  {
    name: "MiniMax M2.7",
    slug: "minimax-m2-7",
    provider: "MiniMax",
    status: "released",
    actualDate: "2026-03-18",
    providerBlurb: "Incremental update to the M2 line.",
  },
  {
    name: "MiMo V2 Pro",
    slug: "mimo-v2-pro",
    provider: "Xiaomi",
    status: "released",
    actualDate: "2026-03-18",
    providerBlurb: "Xiaomi's multimodal model, positioned for on-device work.",
  },

  // ── April 2026 ───────────────────────────────────────────────────────────
  {
    name: "GLM-5.1",
    slug: "glm-5-1",
    provider: "Z.AI",
    status: "released",
    actualDate: "2026-04-07",
    providerBlurb: "Point update to GLM-5 with a longer context window.",
  },
  {
    name: "Seedance 2.0",
    slug: "seedance-2-0",
    provider: "ByteDance",
    status: "released",
    actualDate: "2026-04-14",
    providerBlurb: "Video generation model from ByteDance's Seed group.",
  },
  {
    name: "Kimi K2.6",
    slug: "kimi-k2-6",
    provider: "Moonshot AI",
    status: "released",
    actualDate: "2026-04-20",
    providerBlurb: "Agentic-focused release in the Kimi K2 line.",
  },
  // Flagship and its Pro tier, same day.
  {
    name: "GPT-5.5",
    slug: "gpt-5-5",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-04-23",
    providerBlurb: "Flagship update with a substantially larger context window.",
  },
  {
    name: "GPT-5.5 Pro",
    slug: "gpt-5-5-pro",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-04-23",
    providerBlurb: "Extended-reasoning tier of GPT-5.5.",
  },
  {
    name: "DeepSeek V4 Pro",
    slug: "deepseek-v4-pro",
    provider: "DeepSeek",
    status: "released",
    actualDate: "2026-04-24",
    providerBlurb: "Open-weights reasoning model at an aggressive price point.",
    ...bench("67.2", "73.4", "0.900", "72.0"),
  },

  // ── May–June 2026 ────────────────────────────────────────────────────────
  {
    name: "Claude Opus 4.8",
    slug: "claude-opus-4-8",
    provider: "Anthropic",
    status: "released",
    actualDate: "2026-05-28",
    providerBlurb: "Further reasoning gains over Opus 4.6 on long-horizon tasks.",
  },
  {
    name: "MiniMax M3",
    slug: "minimax-m3",
    provider: "MiniMax",
    status: "released",
    actualDate: "2026-06-01",
    providerBlurb: "New generation of the MiniMax line.",
  },
  {
    name: "GLM-5.2",
    slug: "glm-5-2",
    provider: "Z.AI",
    status: "released",
    actualDate: "2026-06-13",
    providerBlurb: "Second point release in the GLM-5 series.",
  },
  {
    name: "Fugu Ultra",
    slug: "fugu-ultra",
    provider: "Sakana AI",
    status: "released",
    actualDate: "2026-06-23",
    providerBlurb: "Sakana AI's frontier model, developed in Tokyo.",
  },
  {
    name: "Claude Sonnet 5",
    slug: "claude-sonnet-5",
    provider: "Anthropic",
    status: "released",
    actualDate: "2026-06-30",
    providerBlurb: "Mid-tier sibling to Opus, tuned for latency-sensitive production work.",
    ...bench("66.4", "72.8", "3.000", "138.0"),
  },

  // ── July 2026 ────────────────────────────────────────────────────────────
  {
    name: "Grok 4.5",
    slug: "grok-4-5",
    provider: "xAI",
    status: "released",
    actualDate: "2026-07-08",
    providerBlurb: "Reasoning update to the Grok 4 line.",
  },
  // Three models, one day — the densest same-day case in the seed.
  {
    name: "GPT-5.6 Luna",
    slug: "gpt-5-6-luna",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-07-09",
    providerBlurb: "Conversational tier of the GPT-5.6 family.",
  },
  {
    name: "GPT-5.6 Terra",
    slug: "gpt-5-6-terra",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-07-09",
    providerBlurb: "Agentic tier of the GPT-5.6 family.",
  },
  {
    name: "GPT-5.6 Sol",
    slug: "gpt-5-6-sol",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-07-09",
    providerBlurb: "Reasoning tier of the GPT-5.6 family.",
  },
  {
    name: "Kimi K3",
    slug: "kimi-k3",
    provider: "Moonshot AI",
    status: "released",
    actualDate: "2026-07-16",
    providerBlurb: "New generation of Moonshot's open-weights line.",
    ...bench("65.9", "70.3", "0.500", "104.0"),
  },
  {
    name: "Claude Opus 5",
    slug: "claude-opus-5",
    provider: "Anthropic",
    status: "released",
    actualDate: "2026-07-24",
    providerBlurb:
      "Anthropic's flagship model, positioned for long-horizon agentic work and coding.",
    ...bench("71.2", "78.4", "15.000", "62.0"),
  },

  // ── August 2026 ──────────────────────────────────────────────────────────
  {
    name: "Qwen3.8 Max",
    slug: "qwen3-8-max",
    provider: "Alibaba",
    status: "released",
    actualDate: "2026-08-02",
    providerBlurb: "Largest tier of the Qwen3.8 series.",
  },
  // Two US labs, same day.
  {
    name: "Grok 4.6",
    slug: "grok-4-6",
    provider: "xAI",
    status: "released",
    actualDate: "2026-08-06",
    providerBlurb: "Latest Grok 4 point release.",
  },
  {
    name: "Muse Spark 1.2",
    slug: "muse-spark-1-2",
    provider: "Meta",
    status: "released",
    actualDate: "2026-08-06",
    providerBlurb: "Meta's creative generation model.",
  },
  {
    name: "Gemini 3.7 Flash",
    slug: "gemini-3-7-flash",
    provider: "Google DeepMind",
    status: "released",
    actualDate: "2026-08-13",
    providerBlurb: "Cost-optimised Gemini tier with the full context window.",
    ...bench("61.0", "64.2", "0.400", "220.0"),
  },
  {
    name: "GLM-5.3",
    slug: "glm-5-3",
    provider: "Z.AI",
    status: "released",
    actualDate: "2026-08-14",
    providerBlurb: "Third point release in the GLM-5 series.",
  },
  {
    name: "GLM-5.2 Turbo",
    slug: "glm-5-2-turbo",
    provider: "Z.AI",
    status: "released",
    actualDate: "2026-08-17",
    providerBlurb: "Throughput-optimised variant of GLM-5.2.",
  },

  // ── Unconfirmed: announced or rumored, not sourced claims ────────────────
  {
    name: "Qwen 4",
    slug: "qwen-4",
    provider: "Alibaba",
    status: "announced",
    predictedDate: "2026-09-30",
    providerBlurb: "Next Qwen generation. Timing unconfirmed.",
  },
  {
    name: "Kimi K3.1",
    slug: "kimi-k3-1",
    provider: "Moonshot AI",
    status: "rumored",
    predictedDate: "2026-10-15",
    providerBlurb: "Point update to Kimi K3. Rumored only.",
  },
  {
    name: "GPT-6",
    slug: "gpt-6",
    provider: "OpenAI",
    status: "rumored",
    predictedDate: "2026-11-15",
    providerBlurb: "Next major GPT generation. Rumored only, no confirmed date.",
  },
  {
    name: "Claude Opus 6",
    slug: "claude-opus-6",
    provider: "Anthropic",
    status: "rumored",
    predictedDate: "2026-12-01",
    providerBlurb: "Next Opus generation. Rumored only.",
  },
];

async function seed() {
  console.log("Seeding trackai database...");

  await db.delete(reports);
  await db.delete(models);

  const inserted = await db.insert(models).values(SEED).returning();
  const bySlug = new Map(inserted.map((m) => [m.slug, m]));
  const id = (slug: string) => {
    const m = bySlug.get(slug);
    if (!m) throw new Error(`seed: unknown slug ${slug}`);
    return m.id;
  };

  await db.insert(reports).values([
    {
      modelId: id("claude-opus-5"),
      taskCategory: "coding",
      takeaway:
        "Handled a multi-file refactor across an unfamiliar Rust codebase without breaking the build, but needed a second pass to fix a borrow-checker edge case.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000001",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: id("claude-opus-5"),
      taskCategory: "agentic",
      takeaway:
        "Ran a 40-step browser automation task end to end, but got stuck retrying a flaky selector instead of asking for help.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000002",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: id("deepseek-v4-pro"),
      taskCategory: "coding",
      takeaway:
        "Matched a much pricier model on a LeetCode-style set, but degraded noticeably once the prompt exceeded ~60k tokens.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000003",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: id("gemini-3-7-flash"),
      taskCategory: "vision",
      takeaway:
        "Correctly read a handwritten whiteboard photo end to end, including a crossed-out line most tools misread as included text.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000004",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: id("kimi-k3"),
      taskCategory: "writing",
      takeaway:
        "Held a consistent house style across a 12-section document without re-prompting, which the previous version could not do.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000005",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: id("glm-5-3"),
      taskCategory: "agentic",
      takeaway:
        "Ran an overnight scraping agent on a single GPU without falling over, though it silently skipped two failed pages.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000006",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: id("gpt-5-6-terra"),
      taskCategory: "coding",
      takeaway:
        "Under review: claimed to fix a race condition in a submitted snippet, reporter says the fix looks plausible but is still testing it under load.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000007",
      sourceType: "manual",
      status: "pending",
    },
    {
      modelId: id("qwen3-8-max"),
      taskCategory: "other",
      takeaway:
        "Submitted report awaiting review — task category and takeaway not yet verified against the source.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000008",
      sourceType: "manual",
      status: "pending",
    },
  ]);

  console.log(`Seed complete: ${inserted.length} models.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
