import { Suspense } from "react";
import Link from "next/link";
import { getTimelineModels, getLatestBuilderTests } from "@/lib/queries";
import { HowItWorks } from "@/components/how-it-works";
import { BuilderFeed } from "@/components/home/builder-feed";
import { ReleasePanel, type PanelModel } from "@/components/home/release-panel";
import { Harbour } from "@/components/harbour/harbour";
import type { HarbourModel } from "@/components/harbour/layout";

export const dynamic = "force-dynamic";

const SITE_URL = "https://trackai.theaugustdispatch.com";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "trackai",
  url: SITE_URL,
  description:
    "Track every AI model release — shipped, announced or rumoured — with release dates and real tests from people building with each model.",
  creator: {
    "@type": "Person",
    name: "Augustine Osei",
    url: "https://www.linkedin.com/in/augustineosei/",
  },
  publisher: { "@type": "Organization", name: "August Engine", url: "https://www.augustengine.com/" },
  isPartOf: { "@type": "WebSite", name: "The August Dispatch", url: "https://www.theaugustdispatch.com" },
};

export default async function HomePage() {
  const [models, tests] = await Promise.all([getTimelineModels({}), getLatestBuilderTests(20)]);

  // Only what the scene draws crosses into the client bundle — not every
  // claim, rumour source and admin timestamp.
  const harbourModels: HarbourModel[] = models.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    provider: m.provider,
    status: m.status,
    date: m.actualDate ?? m.predictedDate,
    providerBlurb: m.providerBlurb,
    reportCount: m.reports.length,
    topReport: m.reports[0]?.takeaway ?? null,
  }));

  const panelModels: PanelModel[] = models.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    provider: m.provider,
    status: m.status,
    actualDate: m.actualDate,
    predictedDate: m.predictedDate,
    reportCount: m.reports.length,
  }));

  const now = new Date().getTime();
  const today = new Date(now).toISOString().slice(0, 10);

  return (
    // Opts the whole document into the light harbour theme (see globals.css).
    <div className="theme-harbour">
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6 sm:pt-12">
        <script
          type="application/ld+json"
          // Structured data for search and answer engines: what the site is
          // and who made it. Static, so there's nothing user-supplied in it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <h1 className="font-display max-w-4xl text-3xl leading-[1.05] font-black tracking-tight text-ink sm:text-5xl">
          Track every AI model release, and what people build with it.
        </h1>
        {/* The first sentence is the plain definition answer engines quote. */}
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink sm:text-lg">
          trackai is an AI model release tracker. It logs every model the labs ship, plus the ones
          announced or rumoured, and collects real tests from people building with them, so you can see
          how each model holds up beyond its launch benchmarks.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">
          Each ship is a model, sitting on its release date on the calendar strip. The newest lead the
          fleet; faded ships haven&rsquo;t launched yet. Drag the harbour or use the month bar below it
          to move through the year, and click a ship to see its tests.
        </p>
      </div>

      <Harbour models={harbourModels} today={today} />
      <Shore />

      <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <p className="font-data text-right text-[11px] text-ink-faint">
          Prefer a list?{" "}
          <Link href="/timeline" className="text-ink-muted hover:text-gold">
            Open the timeline →
          </Link>
        </p>

        {/* Three columns on wide screens (releases | tests feed | about),
            two on laptops (the release rail moves above the about rail), and
            one on phones in reading order: releases, feed, about. */}
        <div className="home-columns mt-6">
          <div className="home-releases">
            <ReleasePanel models={panelModels} now={now} />
          </div>
          <div className="home-feed min-w-0">
            {/* The feed looks up image previews for X posts from a third-party
                service; streaming it means the harbour never waits on that. */}
            <Suspense fallback={<FeedSkeleton />}>
              <BuilderFeed tests={tests} now={now} />
            </Suspense>
          </div>
          <div className="home-about">
            <HowItWorks />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Placeholder rows in the feed's shape while it streams in. */
function FeedSkeleton() {
  return (
    <div className="feed-column" aria-busy="true" aria-label="Loading builder tests">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="feed-post animate-pulse">
          <div className="h-3 w-40 rounded-full bg-surface-raised" />
          <div className="mt-3 h-4 w-full rounded-full bg-surface-raised" />
          <div className="mt-2 h-4 w-2/3 rounded-full bg-surface-raised" />
        </div>
      ))}
    </div>
  );
}

/**
 * The harbour's far bank running down onto a strip of sand and then the
 * page, so the scene ends in the ground the rest of the page sits on rather
 * than at a hard edge.
 */
function Shore() {
  return (
    <svg
      className="block h-14 w-full"
      viewBox="0 0 1440 56"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect width="1440" height="56" fill="#9bd27f" />
      <path d="M0 18C180 32 360 6 540 20S900 34 1080 16S1320 8 1440 20V56H0Z" fill="#e9d9b0" />
      <path d="M0 36C200 48 380 26 600 38S1000 50 1200 34S1380 32 1440 38V56H0Z" fill="#f4ecdc" />
    </svg>
  );
}
