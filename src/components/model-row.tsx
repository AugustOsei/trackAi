import Link from "next/link";
import { StatusDot } from "@/components/status-dot";
import { ProviderBadge } from "@/components/provider-badge";
import { NewBadge } from "@/components/new-badge";
import { formatDate, formatIndex, formatPrice, isRecent } from "@/lib/format";
import type { Model } from "@/db/schema";

export function ModelRow({
  model,
}: {
  model: Model & { reports: { id: number }[] };
}) {
  const date = model.actualDate ?? model.predictedDate;
  const reportCount = model.reports.length;
  const isNew = model.status === "released" && date ? isRecent(new Date(date)) : false;

  return (
    <Link
      href={`/models/${model.slug}`}
      className="group flex items-center gap-4 rounded-2xl px-3 py-4 transition-colors hover:bg-surface sm:gap-5 sm:px-4"
    >
      <ProviderBadge provider={model.provider} size="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display truncate text-2xl font-extrabold tracking-tight text-ink group-hover:text-gold">
            {model.name}
          </span>
          <StatusDot status={model.status} />
          {isNew && <NewBadge />}
        </div>
        <p className="font-data mt-1 text-xs text-ink-muted">
          {model.provider} · {model.status === "released" ? formatDate(date) : `expected ${formatDate(date)}`}
        </p>
      </div>

      <div className="font-data hidden shrink-0 text-right text-sm text-ink-muted sm:block" data-numeric>
        {model.status === "released" ? (
          <>
            <span className="text-ink">{formatIndex(model.intelligenceIndex)}</span>
            {" / "}
            {formatIndex(model.codingIndex)}
            <span className="mx-2 text-ink-faint">·</span>
            {formatPrice(model.pricePerMtok)}
          </>
        ) : (
          <span className="text-ink-faint">benchmarks pending</span>
        )}
      </div>

      <span className="font-display shrink-0 rounded-full bg-surface-raised px-3 py-1.5 text-sm font-bold text-ink-muted group-hover:bg-gold group-hover:text-gold-fg">
        {reportCount}
      </span>
    </Link>
  );
}
