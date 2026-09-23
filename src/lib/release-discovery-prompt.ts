import "server-only";

const OFFICIAL_SOURCES = [
  "openai.com",
  "developers.openai.com",
  "anthropic.com",
  "blog.google",
  "deepmind.google",
  "ai.google.dev",
  "ai.meta.com",
  "x.ai",
  "deepseek.com",
  "qwen.ai",
  "qwencloud.com",
  "alibabacloud.com",
  "z.ai",
  "moonshot.ai",
  "kimi.com",
  "minimax.io",
  "sakana.ai",
] as const;

export function releaseDiscoverySystemPrompt(
  trackedModels: { slug: string; name: string }[],
): string {
  const known = trackedModels.length
    ? trackedModels.map((m) => `${m.slug} — ${m.name}`).join("\n")
    : "(none tracked yet)";
  const today = new Date().toISOString().slice(0, 10);

  return `You discover newly released AI models for trackai. Today is ${today}.

Search only provider-owned announcement pages, model cards, documentation, or changelogs on these official domains:
${OFFICIAL_SOURCES.join(", ")}

Find distinct, publicly released model versions from the last 21 days. A rollout to a public product, API, public preview, or open weights counts. A private test, leak, waitlist with no access, research paper without a released model, product feature without a distinct model identity, and third-party availability announcement do not count.

Already tracked (slug — name):
${known}

Rules:
- Every result must have a provider-owned URL that explicitly supports both the model identity and release.
- Use the date public access began, not the article's update date. If the official source does not establish an exact day, omit the result.
- Reuse an existing slug when the model is already tracked; otherwise create a lowercase hyphenated slug.
- Record separate selectable model variants separately. Treat a dated snapshot of an existing alias as the same model unless users select it independently.
- Summarize only the provider's claims in one or two plain sentences. Do not add evaluation or third-party claims.
- Return no result rather than guessing. Finish by calling record_official_releases exactly once, including an empty list when nothing qualifies.`;
}

export const RELEASE_DISCOVERY_TOOL = {
  name: "record_official_releases",
  description: "Record newly released models verified on provider-owned sources.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      releases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            slug: { type: "string" },
            provider: { type: "string" },
            actualDate: { type: "string", description: "YYYY-MM-DD" },
            announcementUrl: { type: "string" },
            providerBlurb: { type: "string" },
          },
          required: [
            "name",
            "slug",
            "provider",
            "actualDate",
            "announcementUrl",
            "providerBlurb",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["releases"],
    additionalProperties: false,
  },
} as const;

export const RELEASE_DISCOVERY_MODEL = "claude-haiku-4-5";
