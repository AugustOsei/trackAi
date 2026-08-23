"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { StatusDot } from "@/components/status-dot";
import { NewBadge } from "@/components/new-badge";
import { formatDate, isRecent } from "@/lib/format";
import { daysBetween, addDays, monthSegments, startOfUTCDate } from "@/lib/timeline-math";
import type { Model } from "@/db/schema";

const PX_PER_DAY = 14;
const CARD_WIDTH = 168;
const TRACK_PADDING_DAYS = 10;

type TimelineModel = Model & { reports: { id: number }[] };

function modelDate(model: TimelineModel): Date | null {
  const raw = model.actualDate ?? model.predictedDate;
  return raw ? startOfUTCDate(new Date(`${raw}T00:00:00Z`)) : null;
}

function ScrollButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll timeline earlier" : "Scroll timeline later"}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-raised text-ink shadow-lg transition-transform hover:scale-105 hover:bg-gold hover:text-gold-fg ${
        direction === "left" ? "left-0 sm:-left-4" : "right-0 sm:-right-4"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
        {direction === "left" ? (
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

export function TimelineGrid({ models }: { models: TimelineModel[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const dated = useMemo(
    () =>
      models
        .map((m) => ({ model: m, date: modelDate(m) }))
        .filter((x): x is { model: TimelineModel; date: Date } => x.date !== null)
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [models],
  );

  const { rangeStart, rangeEnd, today } = useMemo(() => {
    const now = startOfUTCDate(new Date());
    const defaultStart = addDays(now, -90);
    const defaultEnd = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
    const dates = dated.map((d) => d.date);
    const earliest = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : defaultStart;
    const latest = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : defaultEnd;
    return {
      today: now,
      rangeStart: addDays(earliest < defaultStart ? earliest : defaultStart, -TRACK_PADDING_DAYS),
      rangeEnd: addDays(latest > defaultEnd ? latest : defaultEnd, TRACK_PADDING_DAYS),
    };
  }, [dated]);

  const totalDays = daysBetween(rangeStart, rangeEnd);
  const trackWidth = totalDays * PX_PER_DAY;
  const months = useMemo(() => monthSegments(rangeStart, rangeEnd), [rangeStart, rangeEnd]);
  const todayX = daysBetween(rangeStart, today) * PX_PER_DAY;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, todayX - el.clientWidth * 0.3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.75, behavior: "smooth" });
  }

  if (dated.length === 0) {
    return <p className="mt-10 text-sm text-ink-muted">Nothing matches those filters yet.</p>;
  }

  return (
    <div className="relative mt-8">
      <ScrollButton direction="left" onClick={() => scrollByPage(-1)} />
      <ScrollButton direction="right" onClick={() => scrollByPage(1)} />

      <div ref={scrollRef} className="overflow-x-auto pb-4 [scrollbar-width:thin]">
        <div className="relative" style={{ width: trackWidth + CARD_WIDTH, height: 380 }}>
          {/* Week grid — spans full track height so empty stretches still read as a grid */}
          {Array.from({ length: Math.floor(totalDays / 7) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-8 bottom-0 w-px bg-hairline opacity-60"
              style={{ left: CARD_WIDTH / 2 + i * 7 * PX_PER_DAY }}
            />
          ))}

          {/* Month ruler */}
          <div className="absolute top-0 left-0 flex h-8" style={{ width: trackWidth }}>
            {months.map((seg, i) => (
              <div
                key={i}
                className="font-display shrink-0 border-l border-hairline pl-2 text-xs font-black tracking-wider text-ink-faint"
                style={{ width: seg.days * PX_PER_DAY }}
              >
                {seg.label}
              </div>
            ))}
          </div>

          {/* Axis line */}
          <div
            className="absolute top-1/2 h-px bg-hairline"
            style={{ width: trackWidth, left: CARD_WIDTH / 2 }}
          />

          {/* Today marker */}
          {todayX >= 0 && todayX <= trackWidth && (
            <div
              className="absolute top-8 bottom-0 w-px bg-gold"
              style={{ left: CARD_WIDTH / 2 + todayX }}
            >
              <span className="font-display absolute -top-6 -translate-x-1/2 whitespace-nowrap text-[11px] font-black text-gold">
                TODAY
              </span>
            </div>
          )}

          {/* Model markers */}
          {dated.map(({ model, date }, i) => {
            const x = CARD_WIDTH / 2 + daysBetween(rangeStart, date) * PX_PER_DAY;
            const above = i % 2 === 0;
            const isNew = model.status === "released" && isRecent(date);

            return (
              <div
                key={model.id}
                className="absolute flex flex-col items-center"
                style={{
                  left: x - CARD_WIDTH / 2,
                  width: CARD_WIDTH,
                  ...(above
                    ? { bottom: "calc(50% + 4px)", alignItems: "center" }
                    : { top: "calc(50% + 4px)", alignItems: "center" }),
                }}
              >
                <div className={`flex flex-col items-center gap-1.5 ${above ? "order-1" : "order-2"}`}>
                  <Link
                    href={`/models/${model.slug}`}
                    className="group flex w-full flex-col items-center gap-1 rounded-2xl bg-surface p-2.5 text-center transition-colors hover:bg-surface-raised"
                  >
                    <ProviderBadge provider={model.provider} size="sm" />
                    <span className="font-display flex items-center gap-1 text-xs font-extrabold leading-tight text-ink group-hover:text-gold">
                      {model.name}
                      <StatusDot status={model.status} />
                    </span>
                    <span className="font-data text-[10px] text-ink-muted">{formatDate(date)}</span>
                    {isNew && <NewBadge />}
                  </Link>
                </div>
                <div className={`h-4 w-px bg-hairline ${above ? "order-2" : "order-1"}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
