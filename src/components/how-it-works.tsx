import { SubscribeForm } from "@/components/subscribe-form";

const PILLARS = [
  {
    label: "TRACK WHAT'S COMING",
    body: "Every model we know about, plotted on the timeline before it ships — rumored, confirmed, or already out.",
  },
  {
    label: "SEE THE CLAIM",
    body: "What the provider itself announced, and whichever benchmark figures it chose to publish — linked straight to the source.",
  },
  {
    label: "READ THE REALITY",
    body: "Reviewed reports from real usage — Hacker News, developer forums, Reddit, YouTube — never published without a human pass first.",
  },
];

/**
 * The hero headline covers claim-vs-reality; this section names the third
 * thing the timeline is doing that the headline doesn't say out loud —
 * tracking what's coming before it's confirmed. Hairline dividers, not
 * card chrome — the punched-ticket motif above is reserved for the
 * claim/reality split, so it isn't reused here for an unrelated 3-way list.
 */
export function HowItWorks() {
  return (
    <section className="mt-14 border-t border-hairline pt-12">
      <div className="grid gap-8 sm:grid-cols-3 sm:divide-x sm:divide-hairline">
        {PILLARS.map((p) => (
          <div key={p.label} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
            <h3 className="font-display text-xs font-black tracking-[0.15em] text-gold">
              {p.label}
            </h3>
            <p className="mt-2 text-[15px] text-ink-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-hairline pt-8">
        <h3 className="font-display text-xs font-black tracking-[0.15em] text-gold">
          GET NOTIFIED
        </h3>
        <p className="mt-2 max-w-md text-[15px] text-ink-muted">
          One email whenever a new model lands on the timeline — rumored,
          announced, or released.
        </p>
        <div className="mt-4 max-w-md">
          <SubscribeForm />
        </div>
      </div>
    </section>
  );
}
