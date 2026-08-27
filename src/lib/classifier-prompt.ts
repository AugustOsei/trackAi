import "server-only";

/**
 * The one definition of what counts as a usable reality-check report.
 *
 * This lives in the app rather than inside the n8n workflows because there are
 * now four collectors (Hacker News, Discourse forums, Reddit, YouTube) and they
 * must judge identically — otherwise "reviewed report" means something
 * different depending on which workflow happened to find it, and the source
 * tags on the site would be comparing unlike things. Each workflow fetches this
 * at run time, so editing the prompt is a code change with a git history rather
 * than four hand-edits in a web UI that can silently drift apart.
 */

/** How much benefit of the doubt each source has earned, in the prompt's words. */
const SOURCE_NOTES: Record<string, string> = {
  hn: "A Hacker News comment. Usually technical and often first-hand, but frequently opinion about a company rather than a report about a model.",
  forum:
    "A post on a developer tool's support forum (Cursor's forum, Hugging Face's forum). At its best, people post there mid-task and say what they were doing. But most traffic is support and grievance: outages and downtime, rate-limit and quota and billing problems, API errors and integration bugs, 'is anyone else seeing this', feature requests, and general dissatisfaction with pricing or a product decision. A model name in one of those is still not a report. Accept a post only when the person describes a concrete task they ran and what the model actually produced.",
  reddit:
    "A Reddit comment or post. Wide range: genuine detailed benchmarks of someone's own workload alongside speculation, jokes, and hype. Judge on specifics, not tone.",
  youtube:
    "A comment on a YouTube video. The noisiest source. Most are reactions to the video rather than accounts of using the model. Accept one only when it clearly describes the commenter's own hands-on use.",
};

export function classifierSystemPrompt(sourceType: string): string {
  const note = SOURCE_NOTES[sourceType] ?? SOURCE_NOTES.hn;

  return `You classify public comments for trackai, a tracker that pairs AI model benchmark claims against real-world reports.

You will be given one piece of text that mentions a named model. Decide whether it is a FIRST-HAND account of someone actually using that model on a real task.

About this source: ${note}

Mark usable=false when the text is any of: speculation; pricing or business chat; a complaint about the company, its pricing, or a product decision; a benchmark score quoted secondhand; a bug report, API error, integration problem, or support request; an outage, downtime, latency, or rate-limit / quota / billing report; a feature request or "is anyone else seeing this"; a reaction to a video or article rather than to using the model; or only a passing mention. A model name does not rescue any of these — a rate-limit rant that says "GPT-5.6" is still a rate-limit rant, not a report.

To be usable the text must clear BOTH bars: it names a concrete task the person actually ran (not "I use it for coding" — an actual thing they did), AND it says what the model produced or how it behaved on that task. If either is missing, usable=false.

The bar is the same regardless of source. A vague Cursor forum post is not more usable than a specific YouTube comment — specificity about a real task is what counts, not where it was posted.

If usable, write the takeaway as ONE sentence of AT MOST 200 CHARACTERS. This is a hard limit; longer text gets truncated mid-word on the site.

Write it as a finding, not as reportage. Start with what the model did. Never begin with 'User reports', 'The user', 'Someone', or 'This comment'.

Good: 'Ported a 40k-line Django app to FastAPI with routing right first pass, but kept assuming an async DB driver and needed three corrections.'
Bad: 'User reports that they used the model to convert a large Django application...'

Paraphrase only — never quote or reuse the original wording. Be specific and neutral, and keep the limitation or failure if there was one; do not make it sound more positive than it was.`;
}

/** Forced tool call, so the response is schema-valid JSON rather than prose. */
export const CLASSIFIER_TOOL = {
  name: "record_reality_check",
  description:
    "Record whether this text is a usable first-hand report, and if so summarise it.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      usable: {
        type: "boolean",
        description:
          "True only for a first-hand account of using the model on a real task.",
      },
      taskCategory: {
        type: "string",
        enum: ["coding", "agentic", "vision", "writing", "other"],
      },
      takeaway: {
        type: "string",
        description:
          "One sentence, 10-200 chars, paraphrased, no reportage preamble. Empty string when usable is false.",
      },
    },
    required: ["usable", "taskCategory", "takeaway"],
    additionalProperties: false,
  },
} as const;

/** Model used by every collector. Small, constrained, run at volume. */
export const CLASSIFIER_MODEL = "claude-haiku-4-5";

/** Per-run candidate cap, so one busy news cycle cannot run up a bill. */
export const CANDIDATES_PER_RUN = 12;
