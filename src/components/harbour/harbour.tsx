"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { providerStyle } from "@/lib/providers";
import {
  BANK_PERIOD,
  BankTile,
  Cloud,
  LIFE_PERIOD,
  Marker,
  PORT_PERIOD,
  PortTile,
  Ship,
  TimingRail,
  WaterTile,
} from "./art";
import {
  DAY_W,
  LEAD,
  MONTHS,
  QUAY_H,
  RAIL_TOP,
  RIVER_BOTTOM,
  VESSELS,
  WORLD_H,
  cellX,
  dayIndex,
  daysInYear,
  dayX,
  hash01,
  layoutHarbour,
  monthStartDay,
  worldWidth,
  type HarbourModel,
  type Placement,
} from "./layout";

/**
 * The homepage harbour, filmed like a race: the camera stays on the fleet and
 * the world streams past it.
 *
 * Two things move the scene, and they add together:
 *   - the camera (drag, swipe, month buttons) — which stretch of the year
 *     you're looking at;
 *   - the flow — how far the fleet has "sailed" since the page loaded. It
 *     starts fast while the ships race in, then eases to a steady cruise.
 *
 * Layers and what moves them:
 *   scenery (port, water, water life, bank)  camera + flow, wrapped per tile
 *   clouds                                   both at 1.35×: closer to the lens
 *   world (timing rail, ships, buoys)        camera only — it carries the dates,
 *                                            so it must never flow
 *
 * Every per-frame write goes straight to a transform through refs, so neither
 * dragging nor the flow ever re-renders React.
 */

const CAUSTIC_TILE = 240;
const CLOUD_PERIOD = 2600;
const TODAY_FRACTION = 0.84;
/** Cruising speed of the scenery, px/s, and the speed it starts at on load. */
const CRUISE = 70;
const LAUNCH = 1600;
/** How quickly the launch speed decays to cruise, in seconds. */
const BRAKE = 0.75;

/**
 * Every streaming layer: its period (for the wrap), how fast it moves
 * relative to the ground, and which band it sits in. The two water-pattern
 * layers run at different rates so the surface reads as having depth.
 */
const FLOWS = [
  { key: "port", period: PORT_PERIOD, rate: 1 },
  { key: "caustics", period: CAUSTIC_TILE, rate: 1 },
  { key: "shimmer", period: CAUSTIC_TILE, rate: 0.8 },
  { key: "current", period: CAUSTIC_TILE, rate: 1.3 },
  { key: "life", period: LIFE_PERIOD, rate: 1 },
  { key: "bank", period: BANK_PERIOD, rate: 1 },
  { key: "clouds", period: CLOUD_PERIOD, rate: 1.35 },
] as const;

/** Enough copies of a tile to cover any realistic viewport plus one period of slack. */
function copiesFor(period: number) {
  return Math.ceil(2800 / period) + 1;
}

function Repeat({ period, children }: { period: number; children: ReactNode }) {
  return (
    <>
      {Array.from({ length: copiesFor(period) }, (_, k) => (
        <div key={k} className="hb-tile" style={{ left: k * period, width: period }}>
          {children}
        </div>
      ))}
    </>
  );
}

type Drag = {
  pointerId: number;
  startX: number;
  camX: number;
  lastX: number;
  lastT: number;
  vel: number;
  moved: boolean;
};

function formatDate(iso: string | null) {
  if (!iso) return "No date yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${iso}T00:00:00Z`));
}

const STATUS_COPY: Record<Placement["kind"], string> = {
  sailing: "Released",
  inbound: "Announced",
  ghost: "Rumoured",
  uncharted: "No date yet",
};

function monthOfDay(day: number, year: number) {
  let m = 0;
  for (let i = 0; i < 12; i++) if (day >= monthStartDay(year, i)) m = i;
  return m;
}

/** Clouds in one repeating stretch: small ones over the port, bigger ones over the bank, never over the lanes. */
const CLOUDS = Array.from({ length: 4 }, (_, i) => {
  const r = hash01(i + 91);
  const overPort = i % 2 === 0;
  const scale = overPort ? 0.45 + r * 0.25 : 0.6 + r * 0.4;
  return {
    id: i,
    x: Math.round(i * (CLOUD_PERIOD / 4) + hash01(i + 5) * 300),
    y: Math.round(overPort ? -44 + hash01(i + 33) * 36 : RIVER_BOTTOM - 4 + hash01(i + 33) * 50),
    scale: Math.round(scale * 100) / 100,
    drift: Math.round(22 + r * 18),
    delay: -Math.round(r * 30),
  };
});

export function Harbour({ models, today }: { models: HarbourModel[]; today: string }) {
  const year = Number(today.slice(0, 4));
  const todayDay = dayIndex(today, year) ?? 0;
  const W = worldWidth(year);
  const { placements } = useMemo(() => layoutHarbour(models, year), [models, year]);
  // The race leader: the most recently released ship.
  const leadId = useMemo(
    () =>
      placements
        .filter((p) => p.kind === "sailing")
        .reduce<Placement | null>((best, p) => (!best || p.x > best.x ? p : best), null)?.model.id,
    [placements],
  );
  const marks = useMemo(
    () =>
      placements
        .filter((p) => p.kind === "sailing")
        .map((p) => ({ id: p.model.id, x: p.x, color: providerStyle(p.model.provider).color })),
    [placements],
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  /** The streaming layers, found by their data-flow attribute once mounted. */
  const flowEls = useRef<{ el: HTMLElement; period: number; rate: number }[]>([]);
  const cam = useRef({ x: 0, vw: 1 });
  /** Distance the fleet has "sailed" since load, px — drives the scenery. */
  const flow = useRef(0);
  const frame = useRef<number | null>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const monthRef = useRef(-1);
  const reduceMotion = useRef(false);

  const [ready, setReady] = useState(false);
  // True for the first few seconds after load, while the fleet races in from
  // off the left edge to its positions.
  const [entering, setEntering] = useState(true);
  const [month, setMonth] = useState(() => monthOfDay(todayDay, year));
  const [selected, setSelected] = useState<Placement | null>(null);

  const paintScenery = useCallback(() => {
    const base = cam.current.x + flow.current;
    for (const f of flowEls.current) {
      f.el.style.transform = `translate3d(${-((base * f.rate) % f.period)}px,0,0)`;
    }
  }, []);

  const apply = useCallback(
    (x: number) => {
      const { vw } = cam.current;
      const cx = Math.min(Math.max(0, W - vw), Math.max(0, x));
      cam.current.x = cx;
      if (worldRef.current) worldRef.current.style.transform = `translate3d(${-cx}px,0,0)`;
      paintScenery();
      if (windowRef.current) {
        windowRef.current.style.left = `${(cx / W) * 100}%`;
        windowRef.current.style.width = `${(Math.min(vw, W) / W) * 100}%`;
      }
      const centreDay = Math.floor((cx + vw / 2 - LEAD) / DAY_W);
      const m = monthOfDay(Math.min(daysInYear(year) - 1, Math.max(0, centreDay)), year);
      if (m !== monthRef.current) {
        monthRef.current = m;
        setMonth(m);
      }
    },
    [W, year, paintScenery],
  );

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const glideTo = useCallback(
    (target: number) => {
      stop();
      const from = cam.current.x;
      const to = Math.min(Math.max(0, W - cam.current.vw), Math.max(0, target));
      if (reduceMotion.current || Math.abs(to - from) < 1) return apply(to);
      // Longer trips take longer, but never so long that a jump from January
      // to September feels like waiting.
      const duration = Math.min(1400, Math.max(380, Math.abs(to - from) / 5));
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        apply(from + (to - from) * e);
        frame.current = t < 1 ? requestAnimationFrame(step) : null;
      };
      frame.current = requestAnimationFrame(step);
    },
    [W, apply, stop],
  );

  const glideToMonth = useCallback(
    (m: number) => glideTo(cellX(monthStartDay(year, Math.min(11, Math.max(0, m)))) - 40),
    [glideTo, year],
  );
  const glideToToday = useCallback(
    () => glideTo(dayX(todayDay) - cam.current.vw * TODAY_FRACTION),
    [glideTo, todayDay],
  );

  // Collect the streaming layers. Declared before the effect below so the
  // first camera placement already paints them.
  useEffect(() => {
    const els = viewportRef.current?.querySelectorAll<HTMLElement>("[data-flow]") ?? [];
    flowEls.current = [...els].flatMap((el) => {
      const f = FLOWS.find((x) => x.key === el.dataset.flow);
      return f ? [{ el, period: f.period, rate: f.rate }] : [];
    });
  }, []);

  // Measure, open on today, and keep the camera valid when the window resizes.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cam.current.vw = el.clientWidth;
    apply(dayX(todayDay) - el.clientWidth * TODAY_FRACTION);
    // Far enough back that every ship on screen starts past the left edge.
    el.style.setProperty("--enter-from", `${-(el.clientWidth + 160)}px`);
    setReady(true);
    const done = setTimeout(() => setEntering(false), reduceMotion.current ? 0 : 3600);
    const ro = new ResizeObserver(() => {
      cam.current.vw = el.clientWidth;
      apply(cam.current.x);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(done);
    };
  }, [apply, todayDay]);

  // The flow: scenery streams past at LAUNCH speed on load and brakes to a
  // steady cruise while the ships arrive. Paused whenever the harbour is off
  // screen or the tab is hidden, and never started for reduced motion.
  useEffect(() => {
    const el = viewportRef.current;
    if (!ready || !el || reduceMotion.current) return;
    let raf: number | null = null;
    let visible = true;
    let last = performance.now();
    const start = last;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const t = (now - start) / 1000;
      flow.current += (CRUISE + (LAUNCH - CRUISE) * Math.exp(-t / BRAKE)) * dt;
      paintScenery();
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : null;
    };
    const resume = () => {
      if (raf === null && visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", resume);
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [ready, paintScenery]);

  // Horizontal trackpad swipes (and shift + wheel) sail the harbour. Plain
  // vertical wheel is left alone so the page still scrolls past it.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!d) return;
      e.preventDefault();
      stop();
      apply(cam.current.x + d);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [apply, stop]);

  useEffect(() => stop, [stop]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    stop();
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      camX: cam.current.x,
      lastX: e.clientX,
      lastT: performance.now(),
      vel: 0,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      // Only claim the pointer once it's clearly a drag, so a plain tap on a
      // ship still lands on the ship.
      d.moved = true;
      viewportRef.current?.setPointerCapture(e.pointerId);
      viewportRef.current?.classList.add("is-dragging");
    }
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.vel = 0.8 * ((e.clientX - d.lastX) / dt) + 0.2 * d.vel;
    d.lastX = e.clientX;
    d.lastT = now;
    apply(d.camX - dx);
  }

  function endDrag(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    viewportRef.current?.classList.remove("is-dragging");
    if (!d.moved) return;
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 0);
    // Coast to a stop, the way a hull keeps drifting after the push.
    // Capped so a hard flick coasts a couple of weeks, not half the year.
    let v = performance.now() - d.lastT > 80 ? 0 : Math.max(-2.5, Math.min(2.5, -d.vel));
    if (reduceMotion.current || Math.abs(v) < 0.05) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      apply(cam.current.x + v * dt);
      v *= Math.pow(0.94, dt / 16);
      frame.current = Math.abs(v) > 0.02 ? requestAnimationFrame(step) : null;
    };
    frame.current = requestAnimationFrame(step);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const week = DAY_W * 7;
    if (e.key === "ArrowRight") glideTo(cam.current.x + week);
    else if (e.key === "ArrowLeft") glideTo(cam.current.x - week);
    else if (e.key === "Home") glideToMonth(0);
    else if (e.key === "End") glideToToday();
    else if (e.key === "Escape") setSelected(null);
    else return;
    e.preventDefault();
  }

  function select(p: Placement) {
    if (suppressClick.current) return;
    setSelected(p);
    const wide = cam.current.vw >= 768;
    // Leave room for the log panel on the right when there is one.
    glideTo(p.x - cam.current.vw * (wide ? 0.38 : 0.5));
  }

  // Minimap: click to glide, drag to scrub.
  const scrub = useRef<{ id: number; moved: boolean; startX: number } | null>(null);
  function minimapTarget(e: React.PointerEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    return f * W - cam.current.vw / 2;
  }
  function onMapDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    scrub.current = { id: e.pointerId, moved: false, startX: e.clientX };
  }
  function onMapMove(e: React.PointerEvent) {
    const s = scrub.current;
    if (!s || s.id !== e.pointerId) return;
    if (!s.moved && Math.abs(e.clientX - s.startX) < 4) return;
    s.moved = true;
    stop();
    apply(minimapTarget(e));
  }
  function onMapUp(e: React.PointerEvent) {
    const s = scrub.current;
    if (!s || s.id !== e.pointerId) return;
    scrub.current = null;
    if (!s.moved) glideTo(minimapTarget(e));
  }

  const monthCounts = useMemo(() => {
    const counts = Array(12).fill(0);
    for (const p of placements) {
      const d = p.model.date ? dayIndex(p.model.date, year) : null;
      if (d !== null) counts[monthOfDay(d, year)]++;
    }
    return counts;
  }, [placements, year]);

  const sel = selected?.model;

  return (
    <section className="hb" aria-label={`Model releases in ${year}, laid out along a harbour`}>
      <div
        ref={viewportRef}
        className="hb-viewport"
        data-ready={ready}
        data-entering={ready && entering ? "" : undefined}
        tabIndex={0}
        aria-roledescription="scrollable map"
        aria-label="Harbour. Drag, swipe sideways, or use the arrow keys to move through the year."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        onKeyDown={onKeyDown}
        style={{ height: WORLD_H }}
      >
        {/* Scenery: streams past the fleet. */}
        <div data-flow="port" className="hb-flow" style={{ top: 0, height: RAIL_TOP }} aria-hidden="true">
          <Repeat period={PORT_PERIOD}>
            <PortTile />
          </Repeat>
        </div>
        <div className="hb-river" style={{ top: QUAY_H, height: RIVER_BOTTOM - QUAY_H }} aria-hidden="true">
          <div data-flow="caustics" className="hb-flow hb-caustics" />
          <div data-flow="shimmer" className="hb-flow hb-caustics hb-caustics-shimmer" />
          <div data-flow="current" className="hb-flow hb-current" />
          <div data-flow="life" className="hb-flow" style={{ inset: 0 }}>
            <Repeat period={LIFE_PERIOD}>
              <WaterTile />
            </Repeat>
          </div>
        </div>
        <div
          data-flow="bank"
          className="hb-flow"
          style={{ top: RIVER_BOTTOM, height: WORLD_H - RIVER_BOTTOM }}
          aria-hidden="true"
        >
          <Repeat period={BANK_PERIOD}>
            <BankTile />
          </Repeat>
        </div>

        {/* The world: moves only with the camera, because it carries the dates. */}
        <div ref={worldRef} className="hb-world" style={{ width: W, height: WORLD_H }}>
          <div className="hb-fog" style={{ left: cellX(daysInYear(year)) + 40 }} aria-hidden="true">
            <span>No date yet</span>
          </div>

          {/* A line of buoys across the river just ahead of today: the front
              of the race. Everything past it hasn't shipped yet. */}
          <span
            className="hb-buoys"
            style={{ left: cellX(todayDay + 1) - 5, top: QUAY_H + 10, height: RIVER_BOTTOM - QUAY_H - 20 }}
            aria-hidden="true"
          />

          <TimingRail year={year} width={W} todayDay={todayDay} marks={marks} />
          <span className="hb-today-chip" style={{ left: dayX(todayDay), top: RAIL_TOP - 30 }} aria-hidden="true">
            Today · {formatDate(today)}
          </span>

          {placements.map((p) => {
            const isSel = selected?.model.id === p.model.id;
            const isLead = p.model.id === leadId;
            const { length, beam } = VESSELS[p.vessel];
            const r = hash01(p.model.id + 500);
            return (
              <button
                key={p.model.id}
                type="button"
                className={`hb-ship is-${p.kind}`}
                data-selected={isSel}
                data-lead={isLead || undefined}
                style={
                  {
                    left: p.x - length,
                    top: p.y - beam / 2,
                    width: length,
                    height: beam,
                    "--bob-delay": `${-Math.round(hash01(p.model.id) * 60) / 10}s`,
                    // Race-in: each ship starts a different distance behind
                    // the left edge and takes its own time, so they arrive
                    // like a finish rather than sliding in as one block. The
                    // leader is quickest.
                    "--enter-extra": `${Math.round(r * 320)}px`,
                    "--enter-dur": `${isLead ? 1.5 : Math.round((1.7 + r * 0.9) * 10) / 10}s`,
                    "--enter-delay": `${Math.round(hash01(p.model.id + 9) * 4) / 10}s`,
                  } as CSSProperties
                }
                onClick={() => select(p)}
                aria-label={`${p.model.name} by ${p.model.provider}, ${STATUS_COPY[p.kind]}, ${formatDate(p.model.date)}`}
              >
                {(p.kind === "sailing" || p.kind === "inbound") && (
                  <span className="hb-wake" aria-hidden="true">
                    <i />
                    <i />
                    <b />
                  </span>
                )}
                {/* Line from the bow up to its day on the timing rail; shown
                    on hover and for the selected ship. */}
                <span className="hb-tether" style={{ height: p.y - beam / 2 - QUAY_H }} aria-hidden="true" />
                <span className="hb-hull">
                  <Ship provider={p.model.provider} seed={p.model.id} vessel={p.vessel} />
                  {(p.kind === "sailing" || p.kind === "inbound") && <span className="hb-bow" aria-hidden="true" />}
                </span>
                <Marker provider={p.model.provider} name={p.model.name} date={formatDate(p.model.date)} lead={isLead} />
              </button>
            );
          })}
        </div>

        <div data-flow="clouds" className="hb-flow hb-clouds" style={{ top: 0, height: WORLD_H }} aria-hidden="true">
          {Array.from({ length: copiesFor(CLOUD_PERIOD) }, (_, k) =>
            CLOUDS.map((c) => (
              <span
                key={`${k}-${c.id}`}
                className="hb-cloud"
                style={
                  {
                    left: k * CLOUD_PERIOD + c.x,
                    top: c.y,
                    "--scale": c.scale,
                    animationDuration: `${c.drift}s`,
                    animationDelay: `${c.delay}s`,
                  } as CSSProperties
                }
              >
                <Cloud />
              </span>
            )),
          )}
        </div>

        {sel && selected && (
          <aside className="hb-log" onPointerDown={(e) => e.stopPropagation()} aria-label={`${sel.name} details`}>
            <div className="hb-log-head">
              <span>{STATUS_COPY[selected.kind]} · {formatDate(sel.date)}</span>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="hb-log-title">
              <ProviderBadge provider={sel.provider} size="md" muted={sel.status !== "released"} />
              <div>
                <p>{sel.provider}</p>
                <h2>{sel.name}</h2>
              </div>
            </div>
            {sel.providerBlurb && <p className="hb-log-blurb">{sel.providerBlurb}</p>}
            <div className="hb-log-reports">
              <span>
                {sel.reportCount === 0
                  ? "No field reports yet"
                  : `${sel.reportCount} field ${sel.reportCount === 1 ? "report" : "reports"}`}
              </span>
              {sel.topReport && <p>“{sel.topReport}”</p>}
            </div>
            <Link href={`/models/${sel.slug}`} className="hb-log-link">
              Open model record →
            </Link>
          </aside>
        )}

        <nav className="hb-nav" onPointerDown={(e) => e.stopPropagation()} aria-label="Move through the year">
          <button
            type="button"
            className="hb-nav-step"
            onClick={() => glideToMonth(month - 1)}
            disabled={month === 0}
            aria-label="Previous month"
          >
            ←
          </button>
          <div
            className="hb-map"
            onPointerDown={onMapDown}
            onPointerMove={onMapMove}
            onPointerUp={onMapUp}
            onPointerCancel={() => (scrub.current = null)}
          >
            {MONTHS.map((label, m) => {
              const start = cellX(monthStartDay(year, m));
              const end = cellX(m === 11 ? daysInYear(year) : monthStartDay(year, m + 1));
              return (
                <span
                  key={label}
                  className="hb-map-month"
                  data-active={m === month}
                  style={{ left: `${(start / W) * 100}%`, width: `${((end - start) / W) * 100}%` }}
                  title={`${label}: ${monthCounts[m]} ${monthCounts[m] === 1 ? "model" : "models"}`}
                >
                  {label.charAt(0)}
                  <span className="hb-map-full">{label}</span>
                </span>
              );
            })}
            {placements.map((p) => (
              <i
                key={p.model.id}
                className={`hb-map-dot is-${p.kind}`}
                style={
                  {
                    left: `${(p.x / W) * 100}%`,
                    background: providerStyle(p.model.provider).color,
                  } as CSSProperties
                }
              />
            ))}
            <b className="hb-map-today" style={{ left: `${(dayX(todayDay) / W) * 100}%` }} />
            <div ref={windowRef} className="hb-map-window" />
          </div>
          <button
            type="button"
            className="hb-nav-step"
            onClick={() => glideToMonth(month + 1)}
            disabled={month === 11}
            aria-label="Next month"
          >
            →
          </button>
          <button type="button" className="hb-nav-today" onClick={glideToToday}>
            Today
          </button>
        </nav>
      </div>
    </section>
  );
}
