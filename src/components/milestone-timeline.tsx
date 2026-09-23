"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MilestoneEntry } from "@/components/milestone-entry";
import { ShipMark } from "@/components/ship-mark";
import { providerStyle } from "@/lib/providers";
import { formatDate, formatDayMonth, formatMonthYear, formatMonthYearShort } from "@/lib/format";
import type { Model } from "@/db/schema";

type ReportPreview = { id: number; taskCategory: string; takeaway: string };
type TimelineModel = Model & { reports: ReportPreview[] };

/** Months of past/future context shown even when nothing shipped in them. */
const CONTEXT_MONTHS = 6;

function modelDate(model: TimelineModel): Date | null {
  const raw = model.actualDate ?? model.predictedDate;
  return raw ? new Date(`${raw}T00:00:00Z`) : null;
}

function startOfUTCDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function startOfUTCMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function addUTCMonths(d: Date, n: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

type Row =
  | { kind: "month"; key: string; date: Date }
  | { kind: "today"; key: string }
  | { kind: "group"; key: string; date: Date; models: TimelineModel[] };

export function MilestoneTimeline({ models }: { models: TimelineModel[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rolling, setRolling] = useState(false);
  // First-visit nudge toward the Roll button: a one-time "click to roll
  // again" callout, and a subtle idle wiggle that stops for good the first
  // time someone actually clicks it. Not a recurring nag — the point is to
  // be noticed once, not to pester a returning visitor forever.
  const [showRollHint, setShowRollHint] = useState(false);
  const [hasManuallyRolled, setHasManuallyRolled] = useState(false);
  const hintShownRef = useRef(false);
  const rollFrame = useRef<number | null>(null);
  const [edge, setEdge] = useState({ top: true, bottom: false });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState("");
  const [scrubbing, setScrubbing] = useState(false);
  const faderRef = useRef<HTMLDivElement>(null);

  // Computed once per mount, not per render — the marker shouldn't drift to
  // a new day mid-session just because something else caused a re-render.
  const today = useMemo(() => startOfUTCDay(new Date()), []);

  const { rows, rangeLabel } = useMemo(() => {
    const dated = models
      .map((m) => ({ model: m, date: modelDate(m) }))
      .filter((x): x is { model: TimelineModel; date: Date } => x.date !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Always show a window of context around today, widened to fit any model
    // that falls outside it rather than silently clipping it.
    let start = addUTCMonths(startOfUTCMonth(today), -CONTEXT_MONTHS);
    let end = addUTCMonths(startOfUTCMonth(today), CONTEXT_MONTHS);
    if (dated.length) {
      const first = startOfUTCMonth(dated[0].date);
      const last = startOfUTCMonth(dated[dated.length - 1].date);
      if (first < start) start = first;
      if (last > end) end = last;
    }

    // date -> models released that day (so same-day launches share one marker)
    const byDay = new Map<string, TimelineModel[]>();
    for (const { model, date } of dated) {
      const k = dayKey(date);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k)!.push(model);
    }

    const out: Row[] = [];
    let todayPlaced = false;

    for (let cur = start; cur <= end; cur = addUTCMonths(cur, 1)) {
      out.push({ kind: "month", key: `m-${cur.toISOString()}`, date: cur });

      const inMonth = dated.filter(
        (d) =>
          d.date.getUTCFullYear() === cur.getUTCFullYear() &&
          d.date.getUTCMonth() === cur.getUTCMonth(),
      );

      const seen = new Set<string>();
      const isTodayMonth =
        cur.getUTCFullYear() === today.getUTCFullYear() &&
        cur.getUTCMonth() === today.getUTCMonth();

      for (const { date } of inMonth) {
        const k = dayKey(date);
        if (seen.has(k)) continue;
        seen.add(k);

        if (!todayPlaced && date.getTime() > today.getTime()) {
          out.push({ kind: "today", key: "today" });
          todayPlaced = true;
        }
        out.push({ kind: "group", key: `g-${k}`, date, models: byDay.get(k)! });
      }

      if (!todayPlaced && isTodayMonth) {
        out.push({ kind: "today", key: "today" });
        todayPlaced = true;
      }
    }

    if (!todayPlaced) out.push({ kind: "today", key: "today" });

    return {
      rows: out,
      rangeLabel: `${formatMonthYearShort(start)} — ${formatMonthYearShort(end)}`,
    };
  }, [models, today]);

  const syncEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    setEdge({
      top: el.scrollTop <= 4,
      bottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 4,
    });
    setScrollProgress(maxScroll > 0 ? el.scrollTop / maxScroll : 0);

    const viewportMiddle = el.scrollTop + el.clientHeight / 2;
    let nearest: { distance: number; label: string } | null = null;
    for (const marker of el.querySelectorAll<HTMLElement>("[data-timeline-period]")) {
      const label = marker.dataset.timelinePeriod;
      if (!label) continue;
      const distance = Math.abs(marker.offsetTop - viewportMiddle);
      if (!nearest || distance < nearest.distance) nearest = { distance, label };
    }
    if (nearest) setCurrentPeriod(nearest.label);
  }, []);

  const scrollToProgress = useCallback((progress: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.min(1, Math.max(0, progress));
    el.scrollTop = (el.scrollHeight - el.clientHeight) * clamped;
    syncEdges();
  }, [syncEdges]);

  const updateFaderFromPointer = useCallback((clientY: number) => {
    const rail = faderRef.current;
    if (!rail) return;
    const bounds = rail.getBoundingClientRect();
    scrollToProgress((clientY - bounds.top) / bounds.height);
  }, [scrollToProgress]);

  const onFaderKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (rolling) return;
    let next = scrollProgress;
    if (e.key === "ArrowUp") next -= 0.04;
    else if (e.key === "ArrowDown") next += 0.04;
    else if (e.key === "PageUp") next -= 0.18;
    else if (e.key === "PageDown") next += 0.18;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 1;
    else return;
    e.preventDefault();
    scrollToProgress(next);
  }, [rolling, scrollProgress, scrollToProgress]);

  // Slot-machine settle: starts from the oldest entry in view and spins down
  // to today, decelerating with a slight mechanical overshoot rather than
  // gliding to a stop. `startTop` lets the mount effect and the Roll button
  // share one implementation — mount always starts from 0, the button
  // rewinds to 0 first so a replay always reads the same "past to present"
  // motion rather than animating from wherever the reader had scrolled to.
  const roll = useCallback((startTop: number, animate = true) => {
    const el = scrollRef.current;
    const marker = todayRef.current;
    const content = contentRef.current;
    if (!el || !marker) return;
    if (rollFrame.current !== null) return; // already rolling

    const target = Math.max(0, marker.offsetTop - el.clientHeight / 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    el.scrollTop = startTop;

    if (reduced || !animate) {
      el.scrollTop = target;
      syncEdges();
      return;
    }

    // Deferred via rAF rather than called directly: this function can run
    // synchronously from the mount effect, and setState belongs in an actual
    // async platform callback, not the effect body itself.
    requestAnimationFrame(() => setRolling(true));
    const duration = 1700;
    const startTime = performance.now();
    let prevTop = startTop;

    // Mild overshoot-then-settle, the signature of a mechanical reel rather
    // than a scroll that simply glides to a stop.
    const easeOutBack = (x: number) => {
      const c1 = 1.15;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = progress < 1 ? easeOutBack(progress) : 1;
      const top = startTop + (target - startTop) * eased;
      el.scrollTop = top;

      // Blur tracks actual per-frame speed, so it reads as motion blur on a
      // spinning reel and fades on its own as the roll slows toward target —
      // no separate easing curve to keep in sync with the scroll one.
      if (content) {
        const speed = Math.abs(top - prevTop);
        content.style.filter = speed > 0.5 ? `blur(${Math.min(3, speed * 0.12)}px)` : "";
      }
      prevTop = top;

      if (progress < 1) {
        rollFrame.current = requestAnimationFrame(tick);
      } else {
        el.scrollTop = target;
        if (content) content.style.filter = "";
        rollFrame.current = null;
        setRolling(false);
        syncEdges();

        // Only the very first roll to ever finish triggers the hint —
        // whichever that is, mount's auto-roll or a fast manual click.
        if (!hintShownRef.current) {
          hintShownRef.current = true;
          setShowRollHint(true);
          setTimeout(() => setShowRollHint(false), 3500);
        }
      }
    };

    rollFrame.current = requestAnimationFrame(tick);
  }, [syncEdges]);

  // Plays once on every arrival at the homepage — not gated behind scroll or
  // interaction, same as the site's other entrance choreography. On phones,
  // position at today immediately: the timeline is usually below the fold,
  // and relying on an off-screen animation leaves mobile browsers vulnerable
  // to rAF throttling. The Roll button still uses the full animation later.
  useLayoutEffect(() => {
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    roll(0, !mobile);
    if (viewportRef.current) viewportRef.current.style.opacity = "1";
    return () => {
      // Reset the ref, not just cancel the frame — otherwise React Strict
      // Mode's dev-only double-invoke (mount, cleanup, mount again) leaves
      // rollFrame.current non-null from the cancelled first attempt, and the
      // in-progress guard at the top of roll() blocks the second mount's
      // call from ever starting.
      if (rollFrame.current !== null) {
        cancelAnimationFrame(rollFrame.current);
        rollFrame.current = null;
      }
      setRolling(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const observer = new ResizeObserver(syncEdges);
    observer.observe(scroller);
    observer.observe(content);
    return () => observer.disconnect();
  }, [syncEdges]);

  const scrollByPage = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: dir * el.clientHeight * 0.75, behavior: "smooth" });
  }, []);

  // Grab-and-drag panning, mouse only — touch already has native momentum.
  const drag = useRef({ startY: 0, startTop: 0, moved: false });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (rollFrame.current !== null) return; // don't fight an in-progress roll
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { startY: e.clientY, startTop: el.scrollTop, moved: false };
    setDragging(true);

    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - drag.current.startY;
      if (Math.abs(dy) > 4) drag.current.moved = true;
      if (drag.current.moved) el.scrollTop = drag.current.startTop - dy;
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  // A drag that ends over an entry shouldn't also toggle it open.
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }, []);

  if (!models.length) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 py-10 text-center">
        <ShipMark className="h-9 w-12 text-ink-faint/60" />
        <p className="text-sm text-ink-muted">Nothing matches those filters yet.</p>
      </div>
    );
  }

  let groupIndex = 0;

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-hairline">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5 sm:px-6">
        <span className="font-data text-[11px] tracking-wider whitespace-nowrap text-ink-faint">
          {rangeLabel}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            {showRollHint && (
              <span
                role="presentation"
                className="font-display roll-hint-callout pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold text-gold-fg"
              >
                Click to roll again
                <span className="absolute top-full left-1/2 -ml-1 h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-gold" />
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setHasManuallyRolled(true);
                setShowRollHint(false);
                roll(0);
              }}
              disabled={rolling}
              className={`font-display rounded-full bg-surface px-3 py-1.5 text-[11px] font-bold text-ink-muted transition-colors hover:bg-gold hover:text-gold-fg disabled:opacity-50 disabled:hover:bg-surface disabled:hover:text-ink-muted ${
                !hasManuallyRolled && !rolling ? "roll-hint-wiggle" : ""
              }`}
            >
              Roll
            </button>
          </div>
          <NavButton dir="up" disabled={edge.top || rolling} onClick={() => scrollByPage(-1)} />
          <NavButton dir="down" disabled={edge.bottom || rolling} onClick={() => scrollByPage(1)} />
        </div>
      </div>

      <div ref={viewportRef} className="relative opacity-0">
        <div
          ref={scrollRef}
          onScroll={syncEdges}
          onPointerDown={onPointerDown}
          onClickCapture={onClickCapture}
          className={`timeline-scroll h-[62vh] max-h-[680px] min-h-[420px] touch-pan-y overflow-y-hidden overscroll-auto py-0 pr-12 pl-4 sm:overflow-y-auto sm:overscroll-contain sm:px-6 ${
            rolling ? "pointer-events-none" : dragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
        >
          <div ref={contentRef} className="relative py-6">
            <div className="absolute top-0 bottom-0 left-5 w-px bg-hairline sm:left-1/2" />

            <div className="flex flex-col">
              {rows.map((row) => {
                if (row.kind === "month") {
                  return <MonthMarker key={row.key} date={row.date} />;
                }
                if (row.kind === "today") {
                  return <TodayMarker key={row.key} ref={todayRef} date={today} />;
                }

                const onLeft = groupIndex % 2 === 0;
                const i = groupIndex;
                groupIndex += 1;

                const shipped = row.models.filter((m) => m.status === "released");
                const expected = row.models.filter((m) => m.status !== "released");
                const unreleased = shipped.length === 0;
                // A day can hold both a real release and a prediction that
                // named the same date. The date column is shared by the whole
                // group, so its EST. prefix only applies when nothing in the
                // group shipped — a mixed day marks its estimates per entry
                // instead, otherwise a rumor inherits a bare date and reads
                // exactly like the release beside it.
                const mixed = shipped.length > 0 && expected.length > 0;
                // A prediction whose date has come and gone. Worth calling
                // out because the timeline is strictly chronological: an
                // unfulfilled estimate sits above the TODAY marker among
                // real releases, where it otherwise reads as history.
                const overdue = unreleased && row.date.getTime() < today.getTime();

                return (
                  <div key={row.key} className="grid py-2 sm:grid-cols-2 sm:gap-x-16">
                    {/* Date sits in the facing column, using the empty half of
                        the axis rather than crowding the entry. */}
                    <div
                      className={`mb-1 pl-14 sm:mb-0 sm:pt-[17px] sm:pl-0 ${
                        onLeft
                          ? "sm:col-start-2 sm:row-start-1 sm:text-left"
                          : "sm:col-start-1 sm:row-start-1 sm:text-right"
                      }`}
                    >
                      <span className="font-data text-[11px] tracking-wider whitespace-nowrap text-ink-muted">
                        {unreleased && <span className="text-ink-faint">EST. </span>}
                        <span className={overdue ? "text-ink-faint line-through" : ""}>
                          {formatDayMonth(row.date)}
                        </span>
                      </span>
                      {row.models.length > 1 && (
                        <span className="font-data ml-2 text-[10px] text-ink-faint">
                          {shipped.length > 0 && `${shipped.length} release${shipped.length > 1 ? "s" : ""}`}
                          {mixed && " · "}
                          {expected.length > 0 && `${expected.length} expected`}
                        </span>
                      )}
                    </div>

                    <div
                      className={
                        onLeft
                          ? "sm:col-start-1 sm:row-start-1 sm:flex sm:justify-end"
                          : "sm:col-start-2 sm:row-start-1"
                      }
                    >
                      <div className="flex w-full flex-col gap-1 sm:w-auto sm:max-w-xs">
                        {row.models.map((m, n) => (
                          <MilestoneEntry
                            key={m.id}
                            model={m}
                            date={row.date}
                            color={providerStyle(m.provider).color}
                            onLeft={onLeft}
                            showDot={n === 0}
                            estimated={mixed && m.status !== "released"}
                            overdue={overdue && m.status !== "released"}
                            index={i}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-y-12 right-1 z-20 w-11 transition-opacity sm:hidden ${
            rolling ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <div
            ref={faderRef}
            role="slider"
            tabIndex={0}
            aria-label="Browse release timeline"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(scrollProgress * 100)}
            aria-valuetext={currentPeriod || `${Math.round(scrollProgress * 100)}% through timeline`}
            aria-disabled={rolling}
            onKeyDown={onFaderKeyDown}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setScrubbing(true);
              updateFaderFromPointer(e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                updateFaderFromPointer(e.clientY);
              }
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
              setScrubbing(false);
            }}
            onPointerCancel={() => setScrubbing(false)}
            className="absolute inset-y-5 left-0 w-full touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
          >
            <span className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-hairline" />
            {[0, 0.25, 0.5, 0.75, 1].map((position) => (
              <span
                key={position}
                className="absolute left-1/2 h-px w-3 -translate-x-1/2 bg-ink-faint/45"
                style={{ top: `${position * 100}%` }}
              />
            ))}

            {scrubbing && currentPeriod && (
              <span
                className="font-data pointer-events-none absolute right-full mr-1 -translate-y-1/2 rounded-md border border-hairline bg-bg/95 px-2 py-1 text-[10px] whitespace-nowrap text-ink shadow-lg backdrop-blur-sm"
                style={{ top: `${scrollProgress * 100}%` }}
              >
                {currentPeriod}
              </span>
            )}

            <span
              className={`pointer-events-none absolute left-1/2 h-10 w-7 -translate-x-1/2 -translate-y-1/2 rounded-[9px] border border-white/15 shadow-[0_5px_14px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] ${
                scrubbing ? "scale-105" : "transition-[top,transform] duration-200 ease-out"
              }`}
              style={{
                top: `${scrollProgress * 100}%`,
                background: "linear-gradient(90deg, #17191d 0%, #343942 48%, #111318 100%)",
              }}
            >
              <span className="absolute top-1/2 right-1.5 left-1.5 h-px bg-white/25" />
              <span className="absolute top-1/2 right-2 left-2 h-px -translate-y-1.5 bg-black/70" />
              <span className="absolute top-1/2 right-2 left-2 h-px translate-y-1.5 bg-black/70" />
              <span className="absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-gold shadow-[0_0_8px_rgba(244,196,48,0.65)]" />
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-bg to-transparent" />
      </div>
    </section>
  );
}

function NavButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "up" | "down";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "up" ? "Scroll to earlier releases" : "Scroll to later releases"}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-30 disabled:hover:bg-surface disabled:hover:text-ink-muted"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
        <path
          d={dir === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function MonthMarker({ date }: { date: Date }) {
  return (
    <div
      className="grid py-2 sm:grid-cols-2 sm:gap-x-16"
      data-timeline-period={formatMonthYearShort(date)}
    >
      <div className="relative pl-14 sm:col-start-2 sm:pl-0">
        <span className="absolute top-1/2 left-[16px] h-2 w-2 -translate-y-1/2 rounded-full bg-ink-faint/60 sm:-left-[28px]" />
        <span className="font-display text-[11px] font-black tracking-[0.18em] text-ink-faint">
          {formatMonthYear(date)}
        </span>
      </div>
    </div>
  );
}

const TodayMarker = function TodayMarker({
  ref,
  date,
}: {
  ref: React.Ref<HTMLDivElement>;
  date: Date;
}) {
  return (
    <div ref={ref} className="relative my-3 flex items-center">
      <div className="hidden h-px flex-1 bg-gold/30 sm:block" />
      <span className="font-display absolute left-5 -translate-x-1/2 rounded-full bg-gold px-2.5 py-1 text-[10px] font-black tracking-wider whitespace-nowrap text-gold-fg sm:static sm:translate-x-0">
        TODAY <span className="font-data font-bold opacity-70">· {formatDate(date)}</span>
      </span>
      <div className="ml-14 h-px flex-1 bg-gold/30 sm:ml-0" />
    </div>
  );
};
