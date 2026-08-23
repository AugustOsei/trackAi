"use client";

import { useState } from "react";
import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { StatusDot } from "@/components/status-dot";
import { NewBadge } from "@/components/new-badge";
import { TaskTag } from "@/components/task-tag";
import { formatDate, formatIndex, formatPrice, isRecent } from "@/lib/format";
import type { Model } from "@/db/schema";

type ReportPreview = { id: number; taskCategory: string; takeaway: string };
type TimelineModel = Model & { reports: ReportPreview[] };

export function MilestoneCard({
  model,
  date,
  color,
  onLeft,
  tiltDeg,
}: {
  model: TimelineModel;
  date: Date;
  color: string;
  onLeft: boolean;
  tiltDeg: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const reportCount = model.reports.length;
  const isNew = model.status === "released" && isRecent(date);

  return (
    <div
      className={`reveal-on-scroll rounded-2xl bg-surface transition-transform duration-300 ease-out sm:max-w-sm ${
        onLeft ? "sm:ml-auto" : ""
      }`}
      style={{
        borderInlineStart: !onLeft ? `3px solid ${color}` : undefined,
        borderInlineEnd: onLeft ? `3px solid ${color}` : undefined,
        transform: expanded ? "rotate(0deg)" : `rotate(${tiltDeg}deg)`,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className={`group flex w-full gap-3 p-3.5 text-left transition-colors hover:bg-surface-raised ${
          onLeft ? "sm:flex-row-reverse sm:text-right" : ""
        }`}
      >
        <span className="shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:[transform:rotate(-6deg)_scale(1.1)]">
          <ProviderBadge provider={model.provider} size="md" />
        </span>
        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-center gap-1.5 ${onLeft ? "sm:justify-end" : ""}`}>
            <span className="font-display text-base font-extrabold leading-tight text-ink group-hover:text-gold">
              {model.name}
            </span>
            <StatusDot status={model.status} />
            {isNew && <NewBadge />}
          </div>
          <p className="font-data mt-0.5 text-xs text-ink-muted">
            {model.provider} ·{" "}
            {model.status === "released" ? formatDate(date) : `expected ${formatDate(date)}`}
          </p>

          {model.status === "released" ? (
            <p className="font-data mt-1.5 text-xs text-ink-muted" data-numeric>
              <span className="text-ink">{formatIndex(model.intelligenceIndex)}</span> intelligence ·{" "}
              {formatPrice(model.pricePerMtok)}/Mtok
            </p>
          ) : (
            <p className="font-data mt-1.5 text-xs text-ink-faint">benchmarks pending</p>
          )}

          <div className={`mt-1.5 flex items-center gap-1.5 ${onLeft ? "sm:justify-end" : ""}`}>
            <span className="font-display text-xs font-bold text-ink-muted">
              {reportCount} {reportCount === 1 ? "report" : "reports"}
            </span>
            <svg
              viewBox="0 0 24 24"
              className={`h-3 w-3 text-ink-faint transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-hairline p-3.5 pt-3">
            {model.providerBlurb && (
              <p className="text-sm text-ink">{model.providerBlurb}</p>
            )}

            {reportCount > 0 ? (
              <ul className="space-y-2">
                {model.reports.slice(0, 3).map((r) => (
                  <li key={r.id} className="flex items-start gap-2 text-xs text-ink-muted">
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
              onClick={(e) => e.stopPropagation()}
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
