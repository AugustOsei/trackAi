import "server-only";

/**
 * The rumor-discovery contract, shared by every news-feed collector the same
 * way `classifier-prompt.ts` is shared by every reality-check collector —
 * one definition of "usable," fetched at run time so it can change without a
 * workflow edit.
 *
 * This is a different judgment from the reality classifier. That one asks
 * "did someone actually use this model." This one asks "does this article
 * name a specific unreleased model" — a much easier bar to clear honestly,
 * and a much easier one to get wrong by inventing a model that was never
 * actually named in the source text.
 */

export function rumorSystemPrompt(trackedModels: { slug: string; name: string }[]): string {
  const known = trackedModels.length
    ? trackedModels.map((m) => `${m.slug} — ${m.name}`).join("\n")
    : "(none tracked yet)";

  return `You read one news article and decide whether it names a specific, unreleased AI model — for trackai, a tracker whose "rumored" tier is explicitly unconfirmed public chatter, refreshed daily, never treated as fact.

Already-tracked models (slug — name), so you reuse a slug instead of creating a near-duplicate:
${known}

For each model the article NAMES BY NAME (not "OpenAI's next model" — an actual name or version, e.g. "GPT-6", "Qwen4", "Claude Opus 6"):

- If it matches an already-tracked model, reuse that exact slug.
- If it's genuinely new, invent a slug: lowercase, hyphens only, matching the style of the existing ones above (e.g. "gpt-6", "qwen-4").
- Only include models the article describes as NOT YET RELEASED — upcoming, rumored, in testing, expected. Skip anything the article treats as already shipped; that belongs to the confirmed CLAIM layer, sourced from the provider directly, not to chatter.
- A predicted date only if the article states or clearly implies one (e.g. "expected next month" relative to the article's own date, printed below). Never invent a date the text doesn't support — omit it rather than guess.
- A one-sentence summary of what's being said, in your own words. Never quote the article.
- Skip pure speculation with no named model ("OpenAI is definitely working on something big").

If the article names no qualifying unreleased model, return an empty list. Most articles will — that is the expected, normal result, not a failure.`;
}

export const RUMOR_TOOL = {
  name: "record_model_rumors",
  description: "Record every specific, unreleased, named AI model this article mentions.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      rumors: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            slug: { type: "string" },
            name: { type: "string" },
            provider: { type: "string" },
            predictedDate: {
              type: "string",
              description: "YYYY-MM-DD, or an empty string if not clearly stated or implied.",
            },
            summary: {
              type: "string",
              description: "One sentence, paraphrased, 10-300 chars.",
            },
          },
          required: ["slug", "name", "provider", "predictedDate", "summary"],
          additionalProperties: false,
        },
      },
    },
    required: ["rumors"],
    additionalProperties: false,
  },
} as const;

export const RUMOR_MODEL = "claude-haiku-4-5";
export const RUMOR_CANDIDATES_PER_RUN = 15;
