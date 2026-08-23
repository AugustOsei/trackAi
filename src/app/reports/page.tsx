import type { Metadata } from "next";
import { getApprovedReportsFeed } from "@/lib/queries";
import { ReportCard } from "@/components/report-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports",
  description:
    "Every reviewed reality-check report, newest first — how AI models actually perform on real tasks.",
};

export default async function ReportsFeedPage() {
  const feed = await getApprovedReportsFeed();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl font-black tracking-tight text-ink">Reports</h1>
      <p className="mt-3 text-lg text-ink-muted">
        Every reviewed report, across every model, newest first. This is
        where the claims meet the record.
      </p>

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
