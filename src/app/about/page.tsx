import { StatusDot } from "@/components/status-dot";
import { Perforation } from "@/components/perforation";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description: "How trackai sources, reviews, and publishes model claims and reality checks.",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-ink">
        Claims are easy. Reality is the hard part.
      </h1>
      <p className="mt-4 text-lg text-ink-muted">
        Every AI lab publishes benchmark numbers when it ships a model. Most
        of those numbers are accurate. Few of them tell you what the model is
        actually like to use. trackai tracks both, side by side, and treats
        them differently — because they come from different places and
        deserve different levels of trust.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">
          Two layers of data
        </h2>

        <div className="mt-6">
          <h3 className="font-display text-xs font-black tracking-[0.15em] text-gold">
            CLAIM — WHAT THE PROVIDER SAYS
          </h3>
          <p className="mt-2 text-ink">
            For each model we record what the lab itself announced: a short
            summary of what shipped, whichever benchmark figures that lab chose
            to publish, and a link straight to its announcement. Nothing here
            is independently verified — it is the provider&rsquo;s own account
            of its own product, presented as exactly that.
          </p>
          <p className="mt-2 text-ink">
            Two things worth knowing when you read these numbers. Labs quote
            the benchmarks that flatter them, so the figures on one model page
            are rarely directly comparable to another&rsquo;s. And where a
            summary was drafted automatically from the announcement, the page
            says so and links the source, so you can check it in one click.
          </p>
        </div>

        <Perforation className="my-8" />

        <div>
          <h3 className="font-display text-xs font-black tracking-[0.15em] text-gold">
            REALITY — REAL-WORLD TESTS
          </h3>
          <p className="mt-2 text-ink">
            A report is a real test: someone putting a model to work on an
            actual task and showing what came out. Most come from X, where
            people share what they&rsquo;ve built with a new model. Those
            posts are hand-picked &mdash; each one is read and saved to a
            dedicated bookmark folder, which trackai imports automatically
            &mdash; and they appear exactly as posted, with the author&rsquo;s
            own attribution and a link back.
          </p>
          <p className="mt-2 text-ink">
            The rest are shared by readers through this site: a one-line
            takeaway, a task tag and a link to the source. Nothing here is
            confirmed information the way a release date is; each report is
            one person&rsquo;s account, and it&rsquo;s presented that way.
          </p>
        </div>
      </section>

      <section id="review" className="mt-12 scroll-mt-6">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">
          How reports are chosen
        </h2>
        <p className="mt-2 text-ink">
          Every report on trackai has been picked by a person. Posts from X
          are chosen at the source: one is only imported after it&rsquo;s
          been read and bookmarked as a genuine test, so choosing it is the
          review. Reports shared by readers wait in a review queue until
          they&rsquo;re approved, and rejected ones never appear.
        </p>
        <p className="mt-2 text-ink">
          Posts that only talk about a model &mdash; opinions, hype,
          launch-day reactions &mdash; are left out; a report has to show the
          model being used. There&rsquo;s no algorithmic ranking or voting
          behind what&rsquo;s published.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">
          Reading the status marker
        </h2>
        <p className="mt-2 text-ink">
          The dot next to a model’s name on the timeline shows how confirmed
          it is:
        </p>
        <ul className="font-data mt-4 space-y-3 text-sm text-ink-muted">
          <li className="flex items-center gap-3">
            <StatusDot status="rumored" /> Rumored — talked about, nothing
            official yet. Sourced from public tech coverage, not the
            provider, and re-checked daily — a predicted date or summary can
            change, or the model can simply vanish if the chatter dies down.
            Replaced entirely the moment a real announcement is found.
          </li>
          <li className="flex items-center gap-3">
            <StatusDot status="announced" /> Announced — the provider has
            confirmed it’s coming.
          </li>
          <li className="flex items-center gap-3">
            <StatusDot status="released" /> Released — shipped, with
            benchmark data attached.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">
          Submit a report
        </h2>
        <p className="mt-2 text-ink">
          If you’ve tried a model on a real task and it’s not reflected here
          yet,{" "}
          <a href="/submit" className="text-gold hover:underline">
            submit a report
          </a>
          . One line on what happened, a link to back it up, and the task
          category it falls under.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">
          Who&rsquo;s behind this
        </h2>
        <p className="mt-2 text-ink">
          trackai is a concept by{" "}
          <a
            href="https://www.linkedin.com/in/augustineosei/"
            className="text-gold hover:underline"
          >
            Augustine Osei
          </a>
          , built by{" "}
          <a href="https://www.augustengine.com/" className="text-gold hover:underline">
            August Engine
          </a>
          , and documented in public on{" "}
          <a
            href="https://www.theaugustdispatch.com"
            className="text-gold hover:underline"
          >
            The August Dispatch
          </a>{" "}
          — a blog documenting the decisions, dead ends, and rewrites behind
          it as they happen, not a polished writeup after the fact.
        </p>
      </section>
    </div>
  );
}
