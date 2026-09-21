/**
 * Model seed data — the released grid plus the near-term rumored/announced
 * entries. Pure data, no side effects: imported by `seed.ts` (dev DB reset)
 * and by `scripts/sync-models.ts` (upsert the released set into a live DB
 * without touching reports).
 *
 * See `seed.ts` for the provenance notes on how these were sourced.
 */
import type { NewModel } from "./schema";

/** Provider-published price; the one figure every lab states the same way. */
function price(perMtok: string) {
  return { pricePerMtok: perMtok, claimUpdatedAt: new Date() };
}

export const SEED: NewModel[] = [
  // ── February 2026 ────────────────────────────────────────────────────────
  {
    name: "Claude Opus 4.6",
    slug: "claude-opus-4-6",
    provider: "Anthropic",
    status: "released",
    actualDate: "2026-02-05",
    providerBlurb: "Reasoning-focused flagship aimed at long-running agent workflows.",
    ...price("15.000"),
  },
  // Two labs shipping the same day — different providers, one date marker.
  {
    name: "GLM-5",
    slug: "glm-5",
    provider: "Z.AI",
    status: "released",
    actualDate: "2026-02-15",
    providerBlurb: "Open-weights flagship from Z.AI, strong on tool use for its size.",
    ...price("0.600"),
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
    ...price("7.000"),
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
    ...price("10.000"),
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
    name: "Claude Opus 4.7",
    slug: "claude-opus-4-7",
    provider: "Anthropic",
    status: "released",
    actualDate: "2026-04-16",
    providerBlurb:
      "Improvement on Opus 4.6 in advanced software engineering, with the largest gains on the hardest tasks.",
    ...price("5.000"),
  },
  {
    name: "Kimi K2.6",
    slug: "kimi-k2-6",
    provider: "Moonshot AI",
    status: "released",
    actualDate: "2026-04-20",
    providerBlurb: "Agentic-focused release in the Kimi K2 line.",
  },
  {
    name: "MiMo-V2.5-Pro",
    slug: "mimo-v2-5-pro",
    provider: "Xiaomi",
    status: "released",
    actualDate: "2026-04-22",
    providerBlurb:
      "Open-weights 1T-parameter mixture-of-experts model, pitched at frontier-tier scores for a fraction of the cost.",
  },
  {
    name: "DeepSeek V4 Pro",
    slug: "deepseek-v4-pro",
    provider: "DeepSeek",
    status: "released",
    actualDate: "2026-04-24",
    providerBlurb: "Open-weights reasoning model at an aggressive price point.",
    ...price("0.900"),
  },
  {
    name: "DeepSeek V4 Flash",
    slug: "deepseek-v4-flash",
    provider: "DeepSeek",
    status: "released",
    actualDate: "2026-04-24",
    providerBlurb:
      "Smaller, faster sibling to V4 Pro — 284B total / 13B active, 1M context, thinking and non-thinking modes.",
  },
  // Flagship and its Pro tier, same day.
  {
    name: "GPT-5.5",
    slug: "gpt-5-5",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-04-24",
    providerBlurb: "Flagship update with a substantially larger context window.",
  },
  {
    name: "GPT-5.5 Pro",
    slug: "gpt-5-5-pro",
    provider: "OpenAI",
    status: "released",
    actualDate: "2026-04-24",
    providerBlurb: "Extended-reasoning tier of GPT-5.5.",
  },

  // ── May–June 2026 ────────────────────────────────────────────────────────
  {
    name: "Qwen3.7-Max",
    slug: "qwen3-7-max",
    provider: "Alibaba",
    status: "released",
    actualDate: "2026-05-17",
    providerBlurb:
      "Agent-focused flagship of the Qwen3.7 line, served through Alibaba Cloud Model Studio.",
  },
  {
    name: "Gemini 3.5 Flash",
    slug: "gemini-3-5-flash",
    provider: "Google DeepMind",
    status: "released",
    actualDate: "2026-05-19",
    providerBlurb:
      "First of the Gemini 3.5 family — flagship-level intelligence at Flash speed, built for agents.",
  },
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
    name: "Claude Fable 5",
    slug: "claude-fable-5",
    provider: "Anthropic",
    status: "released",
    actualDate: "2026-06-09",
    providerBlurb:
      "A Mythos-class model made safe for general use; state-of-the-art on nearly all tested capability benchmarks. Briefly suspended over export controls, redeployed 1 July.",
    ...price("10.000"),
  },
  {
    name: "Kimi K2.7-Code",
    slug: "kimi-k2-7-code",
    provider: "Moonshot AI",
    status: "released",
    actualDate: "2026-06-12",
    providerBlurb:
      "Open-weights coding model — around 30% fewer reasoning tokens than K2.6 at higher scores on Moonshot's own coding bench.",
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
    ...price("3.000"),
  },

  // ── July 2026 ────────────────────────────────────────────────────────────
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
  // Two labs, same day.
  {
    name: "Grok 4.5",
    slug: "grok-4-5",
    provider: "xAI",
    status: "released",
    actualDate: "2026-07-16",
    providerBlurb: "xAI's smartest model for coding, agentic tasks and knowledge work; trained alongside Cursor.",
    ...price("2.000"),
  },
  {
    name: "Kimi K3",
    slug: "kimi-k3",
    provider: "Moonshot AI",
    status: "released",
    actualDate: "2026-07-16",
    providerBlurb: "New generation of Moonshot's open-weights line.",
    ...price("0.500"),
  },
  // Google ships three Flash-class models together.
  {
    name: "Gemini 3.6 Flash",
    slug: "gemini-3-6-flash",
    provider: "Google DeepMind",
    status: "released",
    actualDate: "2026-07-21",
    providerBlurb:
      "Workhorse Flash model with better coding, knowledge work and multimodal performance.",
    ...price("1.500"),
  },
  {
    name: "Gemini 3.5 Flash-Lite",
    slug: "gemini-3-5-flash-lite",
    provider: "Google DeepMind",
    status: "released",
    actualDate: "2026-07-21",
    providerBlurb:
      "Fastest, most cost-effective 3.5-class model, serving around 350 output tokens per second.",
    ...price("0.300"),
  },
  {
    name: "Gemini 3.5 Flash Cyber",
    slug: "gemini-3-5-flash-cyber",
    provider: "Google DeepMind",
    status: "released",
    actualDate: "2026-07-21",
    providerBlurb:
      "Cybersecurity-tuned model deployed through the CodeMender agent in a limited government and partner pilot.",
  },
  {
    name: "Claude Opus 5",
    slug: "claude-opus-5",
    provider: "Anthropic",
    // The one entry with a verified per-model post and real published figures.
    announcementUrl: "https://www.anthropic.com/news/claude-opus-5",
    claimedBenchmarks: [
      { label: "SWE-bench Verified", value: "96.0%" },
      { label: "SWE-bench Pro", value: "79.2%" },
      { label: "Frontier-Bench v0.1", value: "43.3%" },
    ],
    status: "released",
    actualDate: "2026-07-24",
    providerBlurb:
      "Anthropic's flagship model, positioned for long-horizon agentic work and coding.",
    ...price("15.000"),
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
  {
    name: "Grok 4.6",
    slug: "grok-4-6",
    provider: "xAI",
    status: "released",
    actualDate: "2026-08-12",
    providerBlurb:
      "Builds on Grok 4.5 with a focus on long-running agents and more ambitious interactive and visual work.",
    ...price("2.000"),
  },
  {
    name: "Muse Spark 1.2",
    slug: "muse-spark-1-2",
    provider: "Meta",
    status: "released",
    actualDate: "2026-08-06",
    providerBlurb:
      "Meta Superintelligence Labs' flagship LLM and Llama successor; powers the Meta AI assistant.",
  },
  {
    name: "Gemini 3.7 Flash",
    slug: "gemini-3-7-flash",
    provider: "Google DeepMind",
    status: "released",
    actualDate: "2026-08-13",
    providerBlurb: "Cost-optimised Gemini tier with the full context window.",
    ...price("0.400"),
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
  {
    name: "DeepSeek V4 Flash Vision Exp",
    slug: "deepseek-v4-flash-vision-exp",
    provider: "DeepSeek",
    status: "released",
    actualDate: "2026-08-21",
    providerBlurb:
      "Experimental multimodal build of V4 Flash, adding vision input through the API.",
  },
  {
    name: "Qwen3.8-Flash-Next",
    slug: "qwen3-8-flash-next",
    provider: "Alibaba",
    status: "released",
    actualDate: "2026-08-26",
    providerBlurb:
      "Open-weights 125B mixture-of-experts model (6B active), an early preview of the Qwen4 architecture.",
  },
  {
    name: "GLM-5.3-Flash",
    slug: "glm-5-3-flash",
    provider: "Z.AI",
    status: "released",
    actualDate: "2026-08-26",
    providerBlurb:
      "First natively multimodal GLM-5 release — 320B total / 18B active, MIT-licensed, tested publicly as “Ox Alpha”.",
  },

  // ── September 2026 ───────────────────────────────────────────────────────
  {
    name: "Claude Fable 5.1",
    slug: "claude-fable-5-1",
    provider: "Anthropic",
    announcementUrl: "https://www.anthropic.com/claude-fable-and-mythos-5-1",
    claimedBenchmarks: [
      { label: "Terminal-Bench 4.0", value: "55.8%" },
      { label: "Terminal-Bench-Science 0.1", value: "52.6%" },
      { label: "OSWorld 2.0 (strict)", value: "41.7%" },
      { label: "Humanity's Last Exam (tools)", value: "65.0%" },
    ],
    status: "released",
    actualDate: "2026-09-01",
    providerBlurb:
      "Anthropic's most advanced model for coding and knowledge work, with the largest gains on terminal-based scientific and engineering work, computer use, and long-horizon agentic tasks. Around 25% cheaper than Fable 5 for typical workloads, with cache reads down 75%.",
    ...price("10.000"),
  },
  // Shipped the same day as Fable 5.1 and is the same underlying model — the
  // two differ only in their safeguard layers, which is why Mythos scores
  // higher on Terminal-Bench (Anthropic attributes the gap to "the cost of
  // safeguard interventions"). Tracked as released because it was, but the
  // blurb keeps Anthropic's own sentence about restricted access: a reader
  // should not come away thinking this is something they can go and use.
  {
    name: "Claude Mythos 5.1",
    slug: "claude-mythos-5-1",
    provider: "Anthropic",
    announcementUrl: "https://www.anthropic.com/claude-fable-and-mythos-5-1",
    claimedBenchmarks: [{ label: "Terminal-Bench 4.0", value: "60.9%" }],
    status: "released",
    actualDate: "2026-09-01",
    providerBlurb:
      "Newest Mythos-class model, with gains in cybersecurity and biology. The same underlying model as Fable 5.1 under a different safeguard layer; access remains limited to a small set of vetted organizations through Project Glasswing.",
    ...price("10.000"),
  },
  // The grid's first resolved prediction: carried as rumored GPT-6 against a
  // predicted 2026-11-15, and it landed on 2026-09-03 as GPT-6 Astra — ten
  // weeks early. `predictedDate` is kept alongside `actualDate` deliberately;
  // a prediction that came true is the record this grid exists to hold, and
  // dropping it would leave the row looking like it was never forecast.
  // Released on the day rollout began, which is what "released" has meant for
  // every staged rollout in this seed, even though general availability on the
  // paid tiers and the API trails it by about a week.
  {
    name: "GPT-6 Astra",
    slug: "gpt-6",
    provider: "OpenAI",
    announcementUrl: "https://openai.com/index/path-to-astra/",
    status: "released",
    predictedDate: "2026-11-15",
    actualDate: "2026-09-03",
    providerBlurb:
      "First model in the GPT-6 generation, which OpenAI describes as a new frontier on computer and browser use and its best model for software engineering to date, citing bug detection, terminal tasks and codebase analysis. It is also the first model OpenAI has designated as reaching the Critical cybersecurity threshold under its Preparedness Framework, and it ships under added safeguards, with the widest access limited at launch to vetted testers in the Daybreak program.",
    ...price("10.000"),
  },

  // ── Confirmed September releases missed by the original seed ───────────
  {
    name: "Gemini 3.8 Flash",
    slug: "gemini-3-8-flash",
    provider: "Google DeepMind",
    announcementUrl:
      "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
    status: "released",
    actualDate: "2026-09-02",
    providerBlurb:
      "Google's workhorse Gemini 3.8 model for coding, agentic tasks and multi-step reasoning, launched at the introductory price of $0.75 input and $3.75 output per million tokens.",
    ...price("3.750"),
  },
  {
    name: "Gemini 3.8 Flash Cyber",
    slug: "gemini-3-8-flash-cyber",
    provider: "Google DeepMind",
    announcementUrl:
      "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/",
    status: "released",
    actualDate: "2026-09-02",
    providerBlurb:
      "Cybersecurity-focused Gemini 3.8 variant for vulnerability discovery and automated patching, available to trusted defenders through Google's Fairwind Program.",
  },
  {
    name: "Muse Spark 1.3",
    slug: "muse-spark-1-3",
    provider: "Meta",
    announcementUrl: "https://ai.meta.com/events/",
    status: "released",
    actualDate: "2026-09-02",
    providerBlurb:
      "Meta's updated Muse Spark model, with improved coding, agentic workflows and native multimodal perception.",
  },
  {
    name: "GPT-Image-2.5 Flare",
    slug: "gpt-image-2-5-flare",
    provider: "OpenAI",
    announcementUrl: "https://openai.com/index/introducing-chatgpt-images-2-5/",
    status: "released",
    actualDate: "2026-09-08",
    providerBlurb:
      "The faster GPT-Image-2.5 API tier, with improvements to image quality, editing and generation speed.",
  },
  {
    name: "GPT-Image-2.5 Sunburst",
    slug: "gpt-image-2-5-sunburst",
    provider: "OpenAI",
    announcementUrl: "https://openai.com/index/introducing-chatgpt-images-2-5/",
    status: "released",
    actualDate: "2026-09-08",
    providerBlurb:
      "The higher-precision GPT-Image-2.5 API tier for detailed creative work, trading generation time for control and fidelity.",
  },
  {
    name: "DeepSeek V4.1 Flash",
    slug: "deepseek-v4-1-flash",
    provider: "DeepSeek",
    announcementUrl: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/",
    status: "released",
    actualDate: "2026-09-10",
    providerBlurb:
      "DeepSeek's faster V4.1 architecture, replacing V4 Pro traffic in the hosted API while adding native multimodal support.",
  },
  {
    name: "GPT-Live-1",
    slug: "gpt-live-1",
    provider: "OpenAI",
    announcementUrl: "https://openai.com/index/introducing-gpt-live-1-in-the-api/",
    status: "released",
    actualDate: "2026-09-10",
    providerBlurb:
      "Full-duplex voice model for the API that handles simultaneous listening and speaking while delegating deeper reasoning and tool calls to a backend model.",
  },
  {
    name: "Kimi K2.8 Preview",
    slug: "kimi-k2-8-preview",
    provider: "Moonshot AI",
    status: "released",
    actualDate: "2026-09-11",
    providerBlurb:
      "Kimi Code preview with more efficient reasoning, adjustable thinking effort and a 1M-token context window, served behind the existing kimi-for-coding model ID.",
  },
  {
    name: "Fugu Max",
    slug: "fugu-max",
    provider: "Sakana AI",
    announcementUrl: "https://sakana.ai/fugu-max-release/",
    status: "released",
    actualDate: "2026-09-11",
    providerBlurb:
      "Sakana's cost-oriented model-orchestration system, dynamically routing tasks across a larger pool of open and specialized models.",
  },
  {
    name: "Fugu Ultra v2",
    slug: "fugu-ultra-v2",
    provider: "Sakana AI",
    announcementUrl: "https://sakana.ai/fugu-max-release/",
    status: "released",
    actualDate: "2026-09-11",
    providerBlurb:
      "Second-generation Fugu Ultra orchestration system, aimed at raising peak capability without depending on a single frontier model.",
  },
  {
    name: "Gemini 3.8 Live",
    slug: "gemini-3-8-live",
    provider: "Google DeepMind",
    announcementUrl:
      "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
    status: "released",
    actualDate: "2026-09-15",
    providerBlurb:
      "Google's cost-efficient real-time dialogue model, combining fluid voice interaction, visual grounding and asynchronous function calling.",
  },
  {
    name: "Gemini 3.8 Live Extended Thinking",
    slug: "gemini-3-8-live-extended-thinking",
    provider: "Google DeepMind",
    announcementUrl:
      "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/",
    status: "released",
    actualDate: "2026-09-15",
    providerBlurb:
      "Higher-reasoning Gemini Live tier that can work through multi-step tasks while maintaining an uninterrupted spoken conversation.",
  },
  {
    name: "Qwen3.8 Omni Flash",
    slug: "qwen3-8-omni-flash",
    provider: "Alibaba",
    announcementUrl: "https://docs.qwencloud.com/changelog/models",
    status: "released",
    actualDate: "2026-09-18",
    providerBlurb:
      "Native omni-modal model accepting text, image, audio and video with up to 1M tokens of context, built on the Qwen3.8-Flash-Next architecture.",
  },

  // ── Unconfirmed: announced or rumored, not sourced claims ────────────────
  {
    name: "Qwen 4",
    slug: "qwen-4",
    provider: "Alibaba",
    status: "announced",
    providerBlurb: "Next Qwen generation. Timing unconfirmed.",
  },
  {
    name: "Kimi K3.1",
    slug: "kimi-k3-1",
    provider: "Moonshot AI",
    status: "rumored",
    providerBlurb: "Point update to Kimi K3. Rumored only.",
  },
  {
    name: "Claude Opus 6",
    slug: "claude-opus-6",
    provider: "Anthropic",
    status: "rumored",
    providerBlurb:
      "Unconfirmed next-generation Opus placeholder. Current chatter more often calls the nearer refresh Opus 5.5, and Anthropic has published no date.",
  },
];
