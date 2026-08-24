import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";
import {
  CANDIDATES_PER_RUN,
  CLASSIFIER_MODEL,
  CLASSIFIER_TOOL,
  classifierSystemPrompt,
} from "@/lib/classifier-prompt";

export const dynamic = "force-dynamic";

/**
 * The shared classification contract, fetched by every collector workflow at
 * run time so all four judge candidates identically.
 *
 * `?source=` tailors one paragraph of the prompt to where the text came from —
 * a YouTube comment and a Cursor forum post deserve different priors — while
 * the bar for what counts as a usable report stays the same.
 */
export async function GET(request: Request) {
  if (!isAuthorizedIngest(request)) return unauthorized();

  const sourceType = new URL(request.url).searchParams.get("source") ?? "hn";

  return Response.json({
    ok: true,
    model: CLASSIFIER_MODEL,
    maxTokens: 1024,
    candidatesPerRun: CANDIDATES_PER_RUN,
    system: classifierSystemPrompt(sourceType),
    tool: CLASSIFIER_TOOL,
  });
}
