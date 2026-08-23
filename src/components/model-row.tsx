import Link from "next/link";
import { StatusDot } from "@/components/status-dot";
import { Perforation } from "@/components/perforation";
import { formatDate, formatIndex, formatPrice } from "@/lib/format";
import type { Model } from "@/db/schema";

export function ModelRow({
  model,
}: {
  model: Model & { reports: { id: number }[] };
}) {
  const date = model.actualDate ?? model.predictedDate;
  const reportCount = model.reports.length;

  return (
    <Link
      href={`/models/${model.slug}`}
      className="group grid grid-cols-[1fr_auto] items-center gap-4 py-4 sm:grid-cols-[1.5fr_auto_auto]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <StatusDot status={model.status} />
          <span className="font-display truncate text-xl font-semibold text-ink group-hover:text-gold">
            {model.name}
          </span>
        </div>
        <p className="font-data mt-0.5 text-xs text-ink-muted">
          {model.provider} · {model.status === "released" ? formatDate(date) : `expected ${formatDate(date)}`}
        </p>
      </div>

      <div className="font-data hidden text-right text-sm text-ink-muted sm:block" data-numeric>
        {model.status === "released" ? (
          <>
            <span className="text-ink">{formatIndex(model.intelligenceIndex)}</span>
            {" / "}
            {formatIndex(model.codingIndex)}
            <span className="mx-2 text-hairline">|</span>
            {formatPrice(model.pricePerMtok)}
          </>
        ) : (
          <span className="text-ink-faint">benchmarks pending</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Perforation className="hidden w-8 sm:flex" />
        <span className="font-data whitespace-nowrap text-sm text-ink-muted group-hover:text-gold">
          {reportCount} {reportCount === 1 ? "report" : "reports"}
        </span>
      </div>
    </Link>
  );
}
