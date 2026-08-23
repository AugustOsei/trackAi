// Placeholder data for local development, standing in for what the n8n
// benchmark-sync and reality-check workflows will populate in production.
import { db } from "./index";
import { models, reports } from "./schema";

async function seed() {
  console.log("Seeding trackai database...");

  await db.delete(reports);
  await db.delete(models);

  const [opus, gptNext, geminiNext] = await db
    .insert(models)
    .values([
      {
        name: "Opus 5",
        slug: "opus-5",
        provider: "Anthropic",
        status: "released",
        actualDate: "2026-06-15",
        providerBlurb:
          "Anthropic's flagship model, positioned for long-horizon agentic work and coding.",
        intelligenceIndex: "71.2",
        codingIndex: "78.4",
        pricePerMtok: "15.000",
        speedTps: "62.0",
        benchmarkSource: "Artificial Analysis",
        benchmarkUpdatedAt: new Date(),
      },
      {
        name: "GPT-5.2",
        slug: "gpt-5-2",
        provider: "OpenAI",
        status: "released",
        actualDate: "2026-08-20",
        providerBlurb:
          "Incremental update to GPT-5.1 with improved tool-use reliability.",
        intelligenceIndex: "69.8",
        codingIndex: "75.1",
        pricePerMtok: "10.000",
        speedTps: "84.0",
        benchmarkSource: "Artificial Analysis",
        benchmarkUpdatedAt: new Date(),
      },
      {
        name: "Gemini 3 Pro",
        slug: "gemini-3-pro",
        provider: "Google DeepMind",
        status: "released",
        actualDate: "2026-03-20",
        providerBlurb:
          "Native multimodal model with a 2M token context window.",
        intelligenceIndex: "68.5",
        codingIndex: "71.9",
        pricePerMtok: "7.000",
        speedTps: "110.0",
        benchmarkSource: "Artificial Analysis",
        benchmarkUpdatedAt: new Date(),
      },
      {
        name: "Grok 5",
        slug: "grok-5",
        provider: "xAI",
        status: "announced",
        predictedDate: "2026-09-30",
        providerBlurb:
          "xAI's next flagship, announced with claims of frontier reasoning performance.",
        benchmarkSource: null,
      },
      {
        name: "Llama 5",
        slug: "llama-5",
        provider: "Meta",
        status: "rumored",
        predictedDate: "2026-11-01",
        providerBlurb: "Rumored open-weights successor to the Llama 4 line.",
        benchmarkSource: null,
      },
    ])
    .returning();

  await db.insert(reports).values([
    {
      modelId: opus.id,
      taskCategory: "coding",
      takeaway:
        "Handled a multi-file refactor across an unfamiliar Rust codebase without breaking the build, but needed a second pass to fix a borrow-checker edge case.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000001",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: opus.id,
      taskCategory: "agentic",
      takeaway:
        "Ran a 40-step browser automation task end to end, but got stuck retrying a flaky selector instead of asking for help.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000002",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: gptNext.id,
      taskCategory: "writing",
      takeaway:
        "Matched the requested house style closely on the first try for a technical blog draft, less generic than the prior version.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000003",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: geminiNext.id,
      taskCategory: "vision",
      takeaway:
        "Correctly read a handwritten whiteboard photo end to end, including a crossed-out line most tools misread as included text.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000004",
      sourceType: "hn",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      modelId: gptNext.id,
      taskCategory: "coding",
      takeaway:
        "Under review: claimed to fix a race condition in a submitted snippet, reporter says the fix looks plausible but is still testing it under load.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000005",
      sourceType: "manual",
      status: "pending",
    },
    {
      modelId: opus.id,
      taskCategory: "other",
      takeaway:
        "Submitted report awaiting review — task category and takeaway not yet verified against the source.",
      sourceUrl: "https://news.ycombinator.com/item?id=41000006",
      sourceType: "manual",
      status: "pending",
    },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
