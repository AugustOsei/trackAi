import type { Metadata } from "next";
import { StatusDot } from "@/components/status-dot";
import { Perforation } from "@/components/perforation";

export const metadata: Metadata = {
  title: "About",
  description: "How trackai sources, reviews, and publishes model claims and reality checks.",
};

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
            REALITY — REVIEWED REPORTS
          </h3>
          <p className="mt-2 text-ink">
            Reports start as posts on Hacker News, developer forums, and
            YouTube, or as submissions from readers, describing what happened
            when someone actually used a model on a real task. Each one is
            summarized into a short takeaway and a task tag — never a copy
            of the original text —
            with a link back to the source. Nothing here is confirmed
            information the way a release date is; it’s one person’s
            account, and it’s presented that way.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">
          Review, before anything is public
        </h2>
        <p className="mt-2 text-ink">
          Because reality-check reports are lower-confidence than confirmed
          releases, nothing from that layer goes live automatically. Every
          report — sourced from Hacker News, developer forums, YouTube, or
          submitted directly — sits in a review queue until it’s approved.
          Rejected reports never appear
          on the site. There’s no algorithmic ranking or voting behind what
          gets published; it’s a single editorial pass.
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
            official yet.
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
    </div>
  );
}
