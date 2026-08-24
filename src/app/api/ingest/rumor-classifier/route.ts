import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";
import {
  RUMOR_CANDIDATES_PER_RUN,
  RUMOR_MODEL,
  RUMOR_TOOL,
  rumorSystemPrompt,
} from "@/lib/rumor-prompt";
import { getTrackedModelIdentities } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * The shared rumor-discovery contract, fetched by every news-feed collector
 * at run time. Needs the current tracked-model list baked into the prompt
 * itself (not just handed to the workflow separately) so the model doing the
 * classifying is the one deciding slug reuse vs. a new one — the workflow
 * only relays text, it doesn't judge it.
 */
export async function GET(request: Request) {
  if (!isAuthorizedIngest(request)) return unauthorized();

  const tracked = await getTrackedModelIdentities();

  return Response.json({
    ok: true,
    model: RUMOR_MODEL,
    maxTokens: 1024,
    candidatesPerRun: RUMOR_CANDIDATES_PER_RUN,
    system: rumorSystemPrompt(tracked),
    tool: RUMOR_TOOL,
  });
}
