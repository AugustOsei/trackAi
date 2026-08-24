import Link from "next/link";
import type { Metadata } from "next";
import { unsubscribeFromAlerts } from "@/lib/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/**
 * Deliberately a plain page load, not a confirm-then-click flow — the
 * unsubscribe token itself is the one-step action CAN-SPAM expects. The
 * mail-scanner-prefetch risk that ruled this out for approving reports
 * doesn't apply here: the worst case is someone gets removed from a mailing
 * list they didn't explicitly ask to leave, not public content changing.
 */
export default async function UnsubscribePage({
  params,
}: PageProps<"/subscribe/unsubscribe/[token]">) {
  const { token } = await params;
  const result = await unsubscribeFromAlerts(token);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight text-ink">
        {result === "unsubscribed" ? "You're off the list" : "This link isn't valid"}
      </h1>
      <p className="mt-4 text-[15px] text-ink-muted">
        {result === "unsubscribed"
          ? "No more release alerts. You can always subscribe again from the homepage."
          : "It may already have been used, or the link is malformed."}
      </p>
      <Link
        href="/"
        className="font-display mt-8 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-gold-fg hover:opacity-90"
      >
        Back to the timeline
      </Link>
    </div>
  );
}
