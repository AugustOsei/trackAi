import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelBySlug } from "@/lib/queries";
import { StatusDot } from "@/components/status-dot";
import { ProviderBadge } from "@/components/provider-badge";
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
      <Link href="/" className="font-display text-sm font-bold text-ink-muted hover:text-ink">
        ← Timeline
      </Link>

      <header className="mt-4 flex items-start gap-4 sm:gap-5">
        <ProviderBadge provider={model.provider} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot status={model.status} showLabel />
          </div>
          <h1 className="font-display mt-1 text-4xl font-black tracking-tight text-ink sm:text-5xl">
            {model.name}
          </h1>
          <p className="font-data mt-1 text-sm text-ink-muted">
            {model.provider} ·{" "}
            {model.status === "released"
              ? `released ${formatDate(model.actualDate)}`
              : `expected ${formatDate(model.predictedDate)}`}
          </p>
        </div>
      </header>

      {model.providerBlurb && (
        <p className="mt-6 max-w-2xl text-lg text-ink">{model.providerBlurb}</p>
      )}

      <section className="mt-10 rounded-2xl bg-surface p-5 sm:p-6">
        <h2 className="font-display text-xs font-black tracking-[0.15em] text-gold">
          CLAIM — PROVIDER-REPORTED BENCHMARKS
        </h2>

        {model.status === "released" ? (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.key}>
                  <dt className="font-display text-xs font-semibold text-ink-muted">{stat.label}</dt>
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
          <p className="font-data mt-4 text-sm text-ink-faint">
            Not yet released — no benchmark data to report.
          </p>
        )}
      </section>

      <Perforation className="my-2" />

      <section className="mt-8">
        <h2 className="font-display text-xs font-black tracking-[0.15em] text-gold">
          REALITY — {model.reports.length} INDEPENDENT{" "}
          {model.reports.length === 1 ? "REPORT" : "REPORTS"}
        </h2>

        {model.reports.length === 0 ? (
          <p className="mt-5 text-sm text-ink-muted">
            No reviewed reports yet.{" "}
            <Link href={`/submit?model=${model.id}`} className="text-gold hover:underline">
              Be the first to submit one ↗
            </Link>
          </p>
        ) : (
          <div className="mt-5 space-y-8">
            {Array.from(grouped.entries()).map(([category, categoryReports]) => (
              <div key={category}>
                <h3 className="font-display mb-3 text-xs font-bold uppercase tracking-wider text-ink-muted">
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
              className="font-display inline-block rounded-full bg-surface-raised px-5 py-2.5 text-sm font-bold text-ink-muted hover:text-gold"
            >
              + Submit a report for {model.name}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
