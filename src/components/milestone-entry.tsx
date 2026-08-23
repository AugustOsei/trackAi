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

export function MilestoneEntry({
  model,
  date,
  onLeft,
  tiltDeg,
  index,
}: {
  model: TimelineModel;
  date: Date;
  onLeft: boolean;
  tiltDeg: number;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const reportCount = model.reports.length;
  const isNew = model.status === "released" && isRecent(date);
  const cardDelay = Math.min(index * 70, 500);

  return (
    <div className="timeline-card-enter sm:max-w-xs" style={{ animationDelay: `${cardDelay}ms` }}>
      <div
        className="transition-transform duration-300 ease-out"
        style={{ transform: expanded ? "rotate(0deg)" : `rotate(${tiltDeg}deg)` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className={`group flex w-full items-center gap-3 py-1 text-left ${
            onLeft ? "sm:flex-row-reverse sm:text-right" : ""
          }`}
        >
          <span
            className="timeline-icon-pop shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:[transform:rotate(-6deg)_scale(1.1)]"
            style={{ animationDelay: `${cardDelay + 150}ms` }}
          >
            <ProviderBadge provider={model.provider} size="md" />
          </span>
          <span
            className={`font-display flex min-w-0 items-center gap-1.5 text-lg font-extrabold leading-tight text-ink group-hover:text-gold ${
              onLeft ? "sm:justify-end" : ""
            }`}
          >
            <span className="truncate">{model.name}</span>
            <StatusDot status={model.status} />
            {isNew && <NewBadge />}
          </span>
        </button>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className={`space-y-3 py-3 ${onLeft ? "sm:text-right" : ""}`}>
              <p className="font-data text-xs text-ink-muted">
                {model.provider} ·{" "}
                {model.status === "released" ? formatDate(date) : `expected ${formatDate(date)}`}
              </p>

              {model.status === "released" && (
                <p className="font-data text-xs text-ink-muted" data-numeric>
                  <span className="text-ink">{formatIndex(model.intelligenceIndex)}</span> intelligence
                  · {formatPrice(model.pricePerMtok)}/Mtok
                </p>
              )}

              {model.providerBlurb && <p className="text-sm text-ink">{model.providerBlurb}</p>}

              {reportCount > 0 ? (
                <ul className="space-y-2">
                  {model.reports.slice(0, 3).map((r) => (
                    <li
                      key={r.id}
                      className={`flex items-start gap-2 text-xs text-ink-muted ${onLeft ? "sm:flex-row-reverse" : ""}`}
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
                onClick={(e) => e.stopPropagation()}
                className="font-display inline-block text-sm font-bold text-gold hover:underline"
              >
                Read more →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
