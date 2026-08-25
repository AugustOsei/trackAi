import Link from "next/link";
import { getApprovedReportsFeed, getApprovedSourceCounts } from "@/lib/queries";
import { ReportCard } from "@/components/report-card";
import { SOURCE_FILTERS } from "@/lib/sources";
import { pageMetadata } from "@/lib/seo";
import type { Report } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Reports",
  description:
    "Every reviewed reality-check report, newest first. How AI models actually perform on real tasks, sourced from Hacker News, developer forums, YouTube, and X.",
});

export default async function ReportsFeedPage({ searchParams }: PageProps<"/reports">) {
  const params = await searchParams;
  const requested = typeof params.source === "string" ? params.source : undefined;

  const counts = await getApprovedSourceCounts();

  // Only treat the parameter as a filter if it is a real source that has
  // reports behind it — otherwise ?source=nonsense would render an empty page
  // with no filter visibly active, which reads as "no reports exist".
  const source =
    requested && counts.has(requested as Report["sourceType"])
      ? (requested as Report["sourceType"])
      : undefined;

  const feed = await getApprovedReportsFeed(source);
  const available = SOURCE_FILTERS.filter((f) => counts.has(f.value));
  const total = [...counts.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl font-black tracking-tight text-ink">Reports</h1>
      <p className="mt-3 text-lg text-ink-muted">
        Every reviewed report, across every model, newest first. This is
        where the claims meet the record.
      </p>

      {/* Shown only once more than one source has landed something — with a
          single source this is a row of one chip that filters nothing. */}
      {available.length > 1 && (
        <div className="-mx-4 mt-8 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <Link
            href="/reports"
            className={`font-display shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              !source ? "bg-gold text-gold-fg" : "bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            All sources <span className="opacity-60">{total}</span>
          </Link>
          {available.map((f) => (
            <Link
              key={f.value}
              href={`/reports?source=${f.value}`}
              className={`font-display shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                source === f.value
                  ? "bg-gold text-gold-fg"
                  : "bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {f.label} <span className="opacity-60">{counts.get(f.value)}</span>
            </Link>
          ))}
        </div>
      )}

      {feed.length === 0 ? (
        <p className="font-data mt-10 text-sm text-ink-muted">
          No reports published yet — check back soon, or{" "}
          <a href="/submit" className="text-gold hover:underline">
            submit one
          </a>
          .
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {feed.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              model={report.model}
            />
          ))}
        </div>
      )}
    </div>
  );
}
