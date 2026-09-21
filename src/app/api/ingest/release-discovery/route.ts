import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";
import {
  RELEASE_DISCOVERY_MODEL,
  RELEASE_DISCOVERY_TOOL,
  releaseDiscoverySystemPrompt,
} from "@/lib/release-discovery-prompt";
import { getTrackedModelIdentities } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Shared contract for the official release-discovery workflow. */
export async function GET(request: Request) {
  if (!isAuthorizedIngest(request)) return unauthorized();

  const tracked = await getTrackedModelIdentities();
  return Response.json({
    ok: true,
    model: RELEASE_DISCOVERY_MODEL,
    maxTokens: 4096,
    system: releaseDiscoverySystemPrompt(tracked),
    tool: RELEASE_DISCOVERY_TOOL,
  });
}
