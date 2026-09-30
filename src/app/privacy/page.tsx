import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy",
  description: "What trackai collects, why, where it's kept, and how to get it removed.",
});

/**
 * Plain-language privacy notice. Every statement here is checked against
 * what the code actually does — the subscribers and submission_attempts
 * tables, the Google Analytics tag in the root layout, the Gmail-sending n8n
 * workflows — so update it whenever any of those change.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-ink">Privacy</h1>
      <p className="mt-4 text-lg text-ink-muted">
        trackai collects very little: an email address if you ask for alerts, the test you share if you
        share one, and standard website analytics. Here&rsquo;s exactly what, and why.
      </p>
      <p className="mt-2 text-sm text-ink-faint">Last updated September 29, 2026.</p>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">Email alerts</h2>
        <p className="mt-2 text-ink">
          If you sign up for alerts, trackai stores your email address, whether you&rsquo;ve confirmed it, and
          when you subscribed, confirmed or unsubscribed. Nothing is sent until you click the link in the
          confirmation email. Every alert includes a link to unsubscribe, which takes effect straight away.
        </p>
        <p className="mt-2 text-ink">
          The emails are sent from a Gmail account by trackai&rsquo;s automation server. Your address is used
          for these alerts and nothing else.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">Sharing a test</h2>
        <p className="mt-2 text-ink">
          When you share a test, trackai keeps what you entered: the model or models, the kind of task, your
          one-line takeaway, and the link to your post. It doesn&rsquo;t ask for your name or email.
        </p>
        <p className="mt-2 text-ink">
          To stop spam, it also records a one-way scrambled fingerprint of your IP address with the time you
          submitted, so it can tell when the same connection submits too often. Your actual IP address is not
          stored, and the fingerprint can&rsquo;t be turned back into it.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">Analytics</h2>
        <p className="mt-2 text-ink">
          trackai uses Google Analytics to see how many people visit and which pages they read. It sets
          cookies in your browser, and what Google collects is covered by{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Google&rsquo;s privacy policy
          </a>
          . You can opt out with Google&rsquo;s{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            opt-out browser add-on
          </a>{" "}
          or any tracker blocker.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">Where it&rsquo;s kept</h2>
        <p className="mt-2 text-ink">
          The site runs on Vercel, its data is stored in a Neon Postgres database, and its scheduled jobs and
          emails run on a self-hosted n8n server. trackai doesn&rsquo;t sell your information or share it with
          anyone beyond the services it runs on.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">Getting it removed</h2>
        <p className="mt-2 text-ink">
          To have your email or a test you shared removed, message{" "}
          <a
            href="https://www.linkedin.com/in/augustineosei/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Augustine Osei on LinkedIn
          </a>
          . To stop alerts, the unsubscribe link in any email is quickest. See{" "}
          <Link href="/about" className="text-gold hover:underline">
            About
          </Link>{" "}
          for how the rest of the site works.
        </p>
      </section>
    </div>
  );
}
