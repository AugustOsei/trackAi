import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPendingReports } from "@/lib/queries";
import { approveReportViaLink, rejectReportViaLink } from "@/lib/actions";
import { ReviewQueue } from "@/components/review-queue";
import { isValidModerationToken } from "@/lib/moderation-token";

export const dynamic = "force-dynamic";

// A signed link is a credential. Keep it out of search indexes and out of
// referrer headers on the outbound source links.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * The review queue, reached from the daily email instead of a password.
 *
 * This page only *reads*. Approving is a separate POST from the buttons below,
 * which matters because mail clients and link scanners fetch URLs in emails
 * before anyone clicks them — a GET that approved a report would let Gmail's
 * scanner publish the whole queue on delivery.
 */
export default async function ModeratePage({ params }: PageProps<"/moderate/[token]">) {
  const { token } = await params;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !isValidModerationToken(token, secret)) {
    redirect("/moderate/expired");
  }

  const pending = await getPendingReports();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight text-ink">Review queue</h1>
      <p className="font-data mt-1 text-sm text-ink-muted">
        {pending.length} pending · signed link, no login needed
      </p>

      <ReviewQueue
        pending={pending}
        approve={(id) => approveReportViaLink.bind(null, token, id)}
        reject={(id) => rejectReportViaLink.bind(null, token, id)}
      />
    </div>
  );
}
