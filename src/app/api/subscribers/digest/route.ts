import { isAuthorizedIngest, unauthorized } from "@/lib/ingest-auth";
import { getUnalertedModels, getConfirmedSubscribers } from "@/lib/queries";
import { createUnsubscribeToken } from "@/lib/subscribe-token";
import { env, publicBaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Everything the release-alert digest workflow needs: which models haven't
 * been announced to subscribers yet, and a freshly signed unsubscribe link
 * per subscriber.
 *
 * Read-only. Marking models as sent is a separate call
 * (`POST .../digest/sent`), made only after the emails actually go out —
 * so a failed send doesn't silently drop those models from tomorrow's run.
 */
export async function GET(request: Request) {
  if (!isAuthorizedIngest(request)) return unauthorized();

  const [newModels, subs] = await Promise.all([
    getUnalertedModels(),
    getConfirmedSubscribers(),
  ]);

  return Response.json({
    ok: true,
    newModels: newModels.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      status: m.status,
      slug: m.slug,
      providerBlurb: m.providerBlurb,
    })),
    subscribers: subs.map((s) => ({
      email: s.email,
      unsubscribeUrl: `${publicBaseUrl()}/subscribe/unsubscribe/${createUnsubscribeToken(s.id, env.adminSessionSecret)}`,
    })),
  });
}
