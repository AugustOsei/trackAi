import type { Model } from "@/db/schema";

const LABELS: Record<Model["status"], string> = {
  rumored: "Rumored",
  announced: "Announced",
  released: "Released",
};

/**
 * Fill-state encodes confidence, echoing the confirmed-vs-reviewed split
 * that runs through the whole product: hollow = unconfirmed, half = confirmed
 * timing only, solid = shipped and benchmarked.
 */
export function StatusDot({
  status,
  showLabel = false,
}: {
  status: Model["status"];
  showLabel?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5" title={LABELS[status]}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
        <circle
          cx="5"
          cy="5"
          r="4"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="1.25"
        />
        {status !== "rumored" && (
          <path
            d={status === "released" ? "M5 1 A4 4 0 1 1 4.999 1 Z" : "M5 1 A4 4 0 0 1 5 9 Z"}
            fill="var(--color-gold)"
          />
        )}
      </svg>
      {showLabel && (
        <span className="font-data text-xs uppercase tracking-wider text-ink-muted">
          {LABELS[status]}
        </span>
      )}
    </span>
  );
}
