import Link from "next/link";
import { SubscribeForm } from "@/components/subscribe-form";

const PIPELINE = [
  {
    title: "Releases are found automatically",
    body: "Scheduled workflows watch provider announcements; Claude reads each one and records what the lab claims.",
  },
  {
    title: "Rumours are kept separate",
    body: "Leaks and reports of upcoming models are tracked as rumours until a provider confirms them.",
  },
  {
    title: "Real tests are gathered",
    body: "Hacker News, Reddit, YouTube, developer forums and X are scanned for people actually using each model.",
  },
  {
    title: "A person reviews every test",
    body: "Nothing is published automatically — each test is checked before it appears here.",
  },
];

const STACK = ["Next.js", "Neon Postgres", "n8n", "Claude"];

/**
 * Right-hand rail: an easy way in for contributors, what's running behind the
 * site, and the email ask.
 */
export function HowItWorks() {
  return (
    <aside className="space-y-4" aria-label="About trackai">
      <section className="side-panel p-4">
        <h2 className="font-display text-base font-black text-ink">Tested a model?</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          Tell us what happened on a real task — what worked, what broke. It takes two minutes.
        </p>
        <Link
          href="/submit"
          className="mt-3 block rounded-full bg-gold px-4 py-2 text-center text-sm font-bold text-gold-fg hover:opacity-90"
        >
          Share a test
        </Link>
      </section>

      <section className="side-panel p-4">
        <h2 className="font-display text-base font-black text-ink">How trackai runs</h2>
        <ol className="mt-3 space-y-3">
          {PIPELINE.map((p, i) => (
            <li key={p.title} className="flex gap-3">
              <span
                className="font-data mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-raised text-[10px] font-semibold text-ink"
                data-numeric
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-ink">{p.title}</h3>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex flex-wrap gap-1.5 border-t border-hairline pt-3">
          {STACK.map((s) => (
            <span key={s} className="font-data rounded-full bg-surface-raised px-2 py-0.5 text-[11px] text-ink-muted">
              {s}
            </span>
          ))}
        </p>
      </section>

      <section className="side-panel p-4">
        <h2 className="font-display text-base font-black text-ink">Get an email when a model launches</h2>
        <p className="mt-1 text-sm text-ink-muted">One short email per new model.</p>
        <div className="mt-3">
          <SubscribeForm />
        </div>
      </section>
    </aside>
  );
}
