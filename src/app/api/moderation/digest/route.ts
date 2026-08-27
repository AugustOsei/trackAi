import { getPendingReports } from "@/lib/queries";
import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";
import { createModerationToken, MODERATION_TOKEN_TTL_SECONDS } from "@/lib/moderation-token";
import { env, publicBaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Everything the daily digest email needs, in one call: what is waiting, and a
 * freshly signed link to review it.
 *
 * The token is minted here rather than in n8n so the signing secret never
 * leaves Vercel — n8n only ever handles the finished URL. A new token is
 * issued per run, so the newest email always works and older ones lapse on
 * their own.
 *
 * Uses the same bearer token as the ingest routes; it is read-only and returns
 * only what the email is about to display anyway.
 */
export async function GET(request: Request) {
  if (!isAuthorizedIngest(request)) return unauthorized();

  const pending = await getPendingReports();
  const reviewUrl = `${publicBaseUrl()}/moderate/${createModerationToken(env.adminSessionSecret)}`;

  return Response.json({
    ok: true,
    pendingCount: pending.length,
    reviewUrl,
    linkExpiresInHours: MODERATION_TOKEN_TTL_SECONDS / 3600,
    reports: pending.map((report) => ({
      id: report.id,
      // `model`/`provider` stay as the first model so the existing email
      // template keeps working; `models` carries the full list.
      model: report.models.map((m) => m.name).join(" · "),
      provider: report.models[0]?.provider ?? "",
      models: report.models.map((m) => ({ name: m.name, provider: m.provider })),
      taskCategory: report.taskCategory,
      takeaway: report.takeaway,
      sourceUrl: report.sourceUrl,
      sourceType: report.sourceType,
      submittedAt: report.submittedAt,
    })),
  });
}
