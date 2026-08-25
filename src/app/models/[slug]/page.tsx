import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelBySlug } from "@/lib/queries";
import { StatusDot } from "@/components/status-dot";
import { ProviderBadge } from "@/components/provider-badge";
import { Perforation } from "@/components/perforation";
import { ReportCard } from "@/components/report-card";
import { TASK_LABELS, formatDate, formatPrice } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/models/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  if (!model) return {};
  return pageMetadata({
    title: `${model.name} — claim vs. reality`,
    description: model.providerBlurb,
  });
}

export default async function ModelDetailPage({
  params,
}: PageProps<"/models/[slug]">) {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  if (!model) notFound();

  const claims = model.claimedBenchmarks ?? [];

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
        <ProviderBadge provider={model.provider} size="lg" muted={model.status === "rumored"} />
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

      <section className="mt-10 rounded-2xl bg-surface p-5 sm:p-6">
        <h2 className="font-display text-xs font-black tracking-[0.15em] text-gold">
          {model.announcementUrl
            ? `CLAIM — WHAT ${model.provider.toUpperCase()} SAYS`
            : model.rumorSummary
              ? "RUMORED — WHAT'S BEING SAID"
              : `CLAIM — WHAT ${model.provider.toUpperCase()} SAYS`}
        </h2>

        {model.announcementUrl ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink">
            {model.providerBlurb}
          </p>
        ) : model.rumorSummary ? (
          <>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
              {model.rumorSummary}
            </p>
            <p className="font-data mt-3 text-xs text-ink-faint">
              Unconfirmed — based on public chatter, not {model.provider}&rsquo;s own
              word. Refreshed daily as new information appears, and replaced
              entirely the moment a real announcement is found.
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-ink-faint">
            No summary recorded yet.
          </p>
        )}

        {claims.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {claims.map((c) => (
              <div key={c.label}>
                <dt className="font-display text-xs font-semibold text-ink-muted">{c.label}</dt>
                <dd className="font-data mt-1 text-2xl text-ink" data-numeric>
                  {c.value}
                </dd>
              </div>
            ))}
            {model.pricePerMtok && (
              <div>
                <dt className="font-display text-xs font-semibold text-ink-muted">Price / Mtok</dt>
                <dd className="font-data mt-1 text-2xl text-ink" data-numeric>
                  {formatPrice(model.pricePerMtok)}
                </dd>
              </div>
            )}
          </dl>
        )}

        {/* Provenance sits with the claim, not in a footnote — these are the
            provider's own figures, and the reader should be one click from
            checking them. */}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline pt-4">
          {model.announcementUrl ? (
            <a
              href={model.announcementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-sm font-bold text-gold hover:underline"
            >
              Read {model.provider}&rsquo;s announcement ↗
            </a>
          ) : model.rumorSourceUrl ? (
            <a
              href={model.rumorSourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-data text-xs font-semibold text-ink-muted hover:text-ink"
            >
              Where this rumor came from ↗
            </a>
          ) : (
            <span className="font-data text-xs text-ink-faint">
              No announcement link recorded yet.
            </span>
          )}
          {model.summaryIsAutoDrafted && (
            <span className="font-data text-[11px] text-ink-faint">
              Summarised automatically from that announcement.
            </span>
          )}
        </div>
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
