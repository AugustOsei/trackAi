/**
 * Finding which tracked models a piece of free text (an X post) is about.
 * Pure string work with no database or server imports, so the importer and
 * one-off repair scripts share exactly the same rules.
 */

export type MatchableModel = { id: number; name: string; slug: string; provider: string };

/**
 * Lowercase, punctuation to single spaces, padded so aliases match whole
 * words — except a dot between two digits, which is a version number and
 * stays. Turning "Sonnet 5.5" into "sonnet 5 5" is what made the older
 * "sonnet 5" match inside it, and what made "Opus 5.5: $1.52" read as one
 * long version number.
 */
export function normalized(value: string) {
  const text = value
    .toLowerCase()
    .replace(/(\d)\.(?=\d)/g, "$1\u0000")
    .replace(/[^a-z0-9\u0000]+/g, " ")
    .replace(/\u0000/g, ".")
    .trim();
  return ` ${text} `;
}

export function modelAliases(model: Pick<MatchableModel, "name" | "slug" | "provider">) {
  const aliases = new Set([normalized(model.name), normalized(model.slug)]);
  const name = normalized(model.name).trim();
  if (name.startsWith("claude ")) aliases.add(` ${name.slice("claude ".length)} `);
  const provider = normalized(model.provider).trim();
  if (provider && name.startsWith(`${provider} `)) aliases.add(` ${name.slice(provider.length + 1)} `);
  return [...aliases].filter((alias) => alias.trim().length >= 2);
}

/**
 * Every tracked model the text mentions, longest name winning: a mention
 * only counts if it isn't wholly inside a longer mention of a different
 * model, so "GPT-6 Sol" doesn't also tag GPT-6, nor "GLM-5.3-Flash" GLM-5.3.
 * A post that genuinely names both ("Opus 5.5 is far better than Opus 5")
 * mentions the older one separately, and keeps both.
 */
export function matchModels<M extends MatchableModel>(text: string, candidates: M[], limit = Infinity): M[] {
  const haystack = normalized(text);
  const hits = candidates
    .map((model) => {
      const spans: [number, number][] = [];
      for (const alias of modelAliases(model)) {
        for (let i = haystack.indexOf(alias); i !== -1; i = haystack.indexOf(alias, i + 1)) {
          spans.push([i, i + alias.length]);
        }
      }
      return { model, spans };
    })
    .filter((hit) => hit.spans.length > 0);

  const coveredByLonger = (model: M, [start, end]: [number, number]) =>
    hits.some(
      (other) =>
        other.model.id !== model.id &&
        other.spans.some(([s, e]) => s <= start && end <= e && e - s > end - start),
    );

  return hits
    .filter((hit) => hit.spans.some((span) => !coveredByLonger(hit.model, span)))
    .map((hit) => hit.model)
    .slice(0, limit);
}
