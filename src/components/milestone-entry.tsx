"use client";

import { useState } from "react";
import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { StatusDot } from "@/components/status-dot";
import { NewBadge } from "@/components/new-badge";
import { TaskTag } from "@/components/task-tag";
import { formatDate, formatPrice, isRecent } from "@/lib/format";
import type { Model } from "@/db/schema";

type ReportPreview = { id: number; taskCategory: string; takeaway: string };
type TimelineModel = Model & { reports: ReportPreview[] };

// Offsets are expressed relative to the entry header's own box so the dot and
// trail line up with the icon's vertical centre no matter how tall the
// expanded panel below it grows.
const DOT_POS = {
  left: "left-[13px] sm:left-auto sm:-right-[39px]",
  right: "left-[13px] sm:-left-[39px]",
};

const TRAIL_POS = {
  left: "left-5 w-9 sm:left-auto sm:-right-8 sm:w-8",
  right: "left-5 w-9 sm:-left-8 sm:w-8",
};

export function MilestoneEntry({
  model,
  date,
  color,
  onLeft,
  showDot,
  index,
}: {
  model: TimelineModel;
  date: Date;
  color: string;
  onLeft: boolean;
  /** Only the first model of a shared date carries the axis dot; every model
   *  still gets its own trail so nothing floats unconnected. */
  showDot: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const reportCount = model.reports.length;
  const isNew = model.status === "released" && isRecent(date);
  const claims = model.claimedBenchmarks ?? [];
  const delay = Math.min(index * 70, 500);
  const side = onLeft ? "left" : "right";

  return (
    <div
      className="timeline-card-enter w-full sm:w-auto sm:max-w-xs"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="group block w-full text-left"
      >
        <span
          className={`relative flex items-center gap-3 py-1 pl-14 sm:pl-0 ${
            onLeft ? "sm:flex-row-reverse" : ""
          }`}
        >
          {showDot && (
            <span
              className={`absolute top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-full ${DOT_POS[side]}`}
              style={{
                backgroundColor: color,
                boxShadow: `0 0 0 4px var(--color-bg), 0 0 12px ${color}59`,
              }}
            />
          )}
          <span
            data-side={side}
            className={`timeline-trail absolute top-1/2 h-px -translate-y-1/2 ${TRAIL_POS[side]}`}
            style={
              {
                "--trail-color": color,
                animationDelay: `${delay + 120}ms`,
              } as React.CSSProperties
            }
          />

          <span className="shrink-0 transition-transform duration-300 ease-out group-hover:scale-110">
            <span
              className="timeline-icon-pop block"
              style={{ animationDelay: `${delay + 280}ms` }}
            >
              <span
                className="timeline-float block"
                style={{ animationDelay: `${900 + index * 240}ms` }}
              >
                <ProviderBadge
                  provider={model.provider}
                  size="md"
                  muted={model.status === "rumored"}
                />
              </span>
            </span>
          </span>

          <span
            className={`font-display flex min-w-0 items-center gap-1.5 text-lg font-extrabold leading-tight text-ink transition-colors group-hover:text-gold ${
              onLeft ? "sm:justify-end" : ""
            }`}
          >
            <span className="truncate">{model.name}</span>
            <StatusDot status={model.status} />
            {isNew && <NewBadge />}
          </span>
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className={`space-y-3 py-3 pl-14 sm:pl-0 ${onLeft ? "sm:text-right" : ""}`}
          >
            <p className="font-data text-xs text-ink-muted">
              {model.provider} ·{" "}
              {model.status === "released"
                ? formatDate(date)
                : `expected ${formatDate(date)}`}
            </p>

            {model.providerBlurb && <p className="text-sm text-ink">{model.providerBlurb}</p>}

            {/* Show whichever figures this lab actually published — the set
                differs per provider, so there's no fixed row to render. */}
            {(claims.length > 0 || model.pricePerMtok) && (
              <p className={`font-data flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted ${onLeft ? "sm:justify-end" : ""}`} data-numeric>
                {claims.slice(0, 2).map((c) => (
                  <span key={c.label}>
                    {c.label} <span className="text-ink">{c.value}</span>
                  </span>
                ))}
                {model.pricePerMtok && (
                  <span>
                    <span className="text-ink">{formatPrice(model.pricePerMtok)}</span>/Mtok
                  </span>
                )}
              </p>
            )}

            {reportCount > 0 ? (
              <ul className="space-y-2">
                {model.reports.slice(0, 3).map((r) => (
                  <li
                    key={r.id}
                    className={`flex items-start gap-2 text-xs text-ink-muted ${
                      onLeft ? "sm:flex-row-reverse" : ""
                    }`}
                  >
                    <TaskTag category={r.taskCategory} />
                    <span className="flex-1">{r.takeaway}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-faint">No reviewed reports yet.</p>
            )}

            <Link
              href={`/models/${model.slug}`}
              className="font-display inline-block text-sm font-bold text-gold hover:underline"
            >
              Read more →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
