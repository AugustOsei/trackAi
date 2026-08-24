import { sourceStyle } from "@/lib/sources";
import type { Report } from "@/db/schema";

/**
 * Where a report came from, as a link back to it.
 *
 * The mark is tinted with the source's own colour rather than the tile
 * treatment used for provider badges — a report card already carries one
 * saturated tile, and a second would fight it for the eye.
 */
export function SourceTag({
  sourceType,
  sourceUrl,
}: {
  sourceType: Report["sourceType"];
  sourceUrl: string;
}) {
  const style = sourceStyle(sourceType, sourceUrl);

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="font-data inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-2.5 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
    >
      {style.logoPath ? (
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3 shrink-0"
          style={{ fill: style.color }}
          aria-hidden="true"
        >
          <path d={style.logoPath} />
        </svg>
      ) : (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: style.color }}
          aria-hidden="true"
        />
      )}
      {style.label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
