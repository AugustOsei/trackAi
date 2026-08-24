import Link from "next/link";
import type { Metadata } from "next";
import { confirmSubscription } from "@/lib/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm subscription",
  robots: { index: false, follow: false },
};

export default async function ConfirmSubscriptionPage({
  params,
}: PageProps<"/subscribe/confirm/[token]">) {
  const { token } = await params;
  const result = await confirmSubscription(token);

  if (result === "invalid") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <h1 className="font-display text-4xl font-black tracking-tight text-ink">
          This link isn&rsquo;t valid
        </h1>
        <p className="mt-4 text-[15px] text-ink-muted">
          It may have expired — confirmation links last 72 hours — or already
          been used.
        </p>
        <Link
          href="/"
          className="font-display mt-8 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-gold-fg hover:opacity-90"
        >
          Try subscribing again
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight text-ink">
        You&rsquo;re subscribed
      </h1>
      <p className="mt-4 text-[15px] text-ink-muted">
        You&rsquo;ll get an email whenever a new model shows up on the
        timeline — rumored, announced, or released.
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
