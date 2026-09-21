/**
 * Canonical public identities for providers and the small set of model aliases
 * that repeatedly arrive from feeds in more than one form.
 *
 * Keep this deliberately conservative. A fuzzy matcher here could merge two
 * genuinely different snapshots; exact aliases only fix identities we know
 * refer to the same model.
 */

const PROVIDER_ALIASES = new Map<string, string>([
  ["alibaba", "Alibaba"],
  ["alibaba cloud", "Alibaba"],
  ["anthropic", "Anthropic"],
  ["deepseek", "DeepSeek"],
  ["deepseek ai", "DeepSeek"],
  ["google", "Google DeepMind"],
  ["google deepmind", "Google DeepMind"],
  ["meta", "Meta"],
  ["meta ai", "Meta"],
  ["minimax", "MiniMax"],
  ["moonshot", "Moonshot AI"],
  ["moonshot ai", "Moonshot AI"],
  ["open ai", "OpenAI"],
  ["openai", "OpenAI"],
  ["sakana", "Sakana AI"],
  ["sakana ai", "Sakana AI"],
  ["xai", "xAI"],
  ["z ai", "Z.AI"],
  ["z.ai", "Z.AI"],
  ["zhipu", "Z.AI"],
  ["zhipu ai", "Z.AI"],
]);

const MODEL_ALIASES = new Map<string, { name: string; slug: string }>([
  ["opus-6", { name: "Claude Opus 6", slug: "claude-opus-6" }],
]);

function lookupKey(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function canonicalProvider(provider: string): string {
  return PROVIDER_ALIASES.get(lookupKey(provider)) ?? provider.trim();
}

export function canonicalModelIdentity(input: {
  name: string;
  slug: string;
  provider: string;
}) {
  const alias = MODEL_ALIASES.get(input.slug.trim().toLowerCase());
  return {
    name: alias?.name ?? input.name.trim(),
    slug: alias?.slug ?? input.slug.trim().toLowerCase(),
    provider: canonicalProvider(input.provider),
  };
}
