import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelBySlug } from "@/lib/queries";
import { StatusDot } from "@/components/status-dot";
import { Perforation } from "@/components/perforation";
import { ReportCard } from "@/components/report-card";
import { TASK_LABELS, formatDate, formatIndex, formatPrice, formatSpeed } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/models/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  if (!model) return {};
  return {
    title: `${model.name} — claim vs. reality`,
    description: model.providerBlurb ?? undefined,
  };
}

const STATS: { key: "intelligenceIndex" | "codingIndex" | "pricePerMtok" | "speedTps"; label: string; format: (v: string | null) => string }[] = [
  { key: "intelligenceIndex", label: "Intelligence index", format: formatIndex },
  { key: "codingIndex", label: "Coding index", format: formatIndex },
  { key: "pricePerMtok", label: "Price / Mtok", format: formatPrice },
  { key: "speedTps", label: "Output speed", format: formatSpeed },
];

export default async function ModelDetailPage({
  params,
}: PageProps<"/models/[slug]">) {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  if (!model) notFound();

  const grouped = new Map<string, typeof model.reports>();
  for (const report of model.reports) {
    if (!grouped.has(report.taskCategory)) grouped.set(report.taskCategory, []);
    grouped.get(report.taskCategory)!.push(report);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/" className="font-data text-sm text-ink-muted hover:text-ink">
        ← timeline
      </Link>

      <header className="mt-4">
        <div className="flex items-center gap-3">
          <StatusDot status={model.status} showLabel />
        </div>
        <h1 className="font-display mt-2 text-4xl font-bold text-ink sm:text-5xl">
          {model.name}
        </h1>
        <p className="font-data mt-1 text-sm text-ink-muted">
          {model.provider} ·{" "}
          {model.status === "released"
            ? `released ${formatDate(model.actualDate)}`
            : `expected ${formatDate(model.predictedDate)}`}
        </p>
        {model.providerBlurb && (
          <p className="mt-4 max-w-2xl text-ink">{model.providerBlurb}</p>
        )}
      </header>

      <section className="mt-10">
        <h2 className="font-data text-xs font-semibold tracking-[0.15em] text-gold">
          CLAIM — PROVIDER-REPORTED BENCHMARKS
        </h2>
        <Perforation className="mt-2" />

        {model.status === "released" ? (
          <>
            <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.key}>
                  <dt className="font-data text-xs text-ink-muted">{stat.label}</dt>
                  <dd className="font-data mt-1 text-2xl text-ink" data-numeric>
                    {stat.format(model[stat.key])}
                  </dd>
                </div>
              ))}
            </dl>
            {model.benchmarkSource && (
              <p className="font-data mt-4 text-xs text-ink-faint">
                Source: {model.benchmarkSource}
                {model.benchmarkUpdatedAt &&
                  ` · updated ${formatDate(model.benchmarkUpdatedAt)}`}
              </p>
            )}
          </>
        ) : (
          <p className="font-data mt-6 text-sm text-ink-faint">
            Not yet released — no benchmark data to report.
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-data text-xs font-semibold tracking-[0.15em] text-gold">
          REALITY — {model.reports.length} INDEPENDENT{" "}
          {model.reports.length === 1 ? "REPORT" : "REPORTS"}
        </h2>
        <Perforation className="mt-2" />

        {model.reports.length === 0 ? (
          <p className="mt-6 text-sm text-ink-muted">
            No reviewed reports yet.{" "}
            <Link href={`/submit?model=${model.id}`} className="text-gold hover:underline">
              Be the first to submit one ↗
            </Link>
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            {Array.from(grouped.entries()).map(([category, categoryReports]) => (
              <div key={category}>
                <h3 className="font-data mb-3 text-xs uppercase tracking-wider text-ink-muted">
                  {TASK_LABELS[category] ?? category}
                </h3>
                <div className="space-y-3">
                  {categoryReports.map((report) => (
                    <ReportCard key={report.id} report={report} showModel={false} />
                  ))}
                </div>
              </div>
            ))}
            <Link
              href={`/submit?model=${model.id}`}
              className="font-data inline-block border border-dashed border-hairline px-4 py-2 text-sm text-ink-muted hover:border-gold hover:text-gold"
            >
              + submit a report for {model.name}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
