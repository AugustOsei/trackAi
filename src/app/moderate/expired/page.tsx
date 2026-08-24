import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link expired",
  robots: { index: false, follow: false },
};

export default function ModerateExpiredPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight text-ink">
        This review link has expired
      </h1>
      <p className="mt-4 text-[15px] text-ink-muted">
        Review links last 72 hours, so an older digest email stops working once
        a newer one has arrived. Nothing was changed.
      </p>
      <p className="mt-4 text-[15px] text-ink-muted">
        Open the most recent trackai digest email for a working link, or sign in
        with the admin password.
      </p>
      <Link
        href="/admin/login"
        className="font-display mt-8 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-gold-fg hover:opacity-90"
      >
        Sign in instead
      </Link>
    </div>
  );
}
