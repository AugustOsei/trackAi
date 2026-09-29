import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";
import { importXBookmarkFolder } from "@/lib/x-bookmarks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * n8n's twice-daily X bookmark job calls this endpoint with the same scoped
 * ingest credential used by the other TrackAI automations. OAuth refresh
 * tokens never leave the app; n8n only starts the import and receives counts.
 */
export async function POST(request: Request) {
  if (!isAuthorizedIngest(request)) return unauthorized();
  try {
    return Response.json({ ok: true, ...(await importXBookmarkFolder()) });
  } catch (cause) {
    console.error("[ingest/x-bookmarks] import failed", cause);
    return Response.json({ error: "X bookmark import failed" }, { status: 500 });
  }
}
