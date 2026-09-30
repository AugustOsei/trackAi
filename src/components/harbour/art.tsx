import type { CSSProperties } from "react";
import { providerStyle } from "@/lib/providers";
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
  daysInYear,
  dayX,
  hash01,
  monthStartDay,
  type VesselType,
} from "./layout";

/**
 * Harbour illustrations, drawn flat and top-down in the style of the
 * references: teal water, cream decks, colourful cargo, a port on one bank
 * and grass and trees on the other. Every piece is plain SVG so provider
 * colours can be painted in at render time.
 *
 * Scenery (port, water life, bank, clouds) is drawn as tiles that repeat
 * every *_PERIOD px, so the harbour can stream them past the fleet forever
 * without a seam. Anything that carries a date is drawn once, across the
 * whole year, and never streams.
 */

const SHADOW = "rgba(6,64,74,.28)";
const NEUTRAL_CARGO = ["#e8d9bd", "#5f7f8a", "#f1b24a"];

/** Provider mark on a round pad, painted onto the deck like a helipad. */
function Pad({ provider, cx, cy, r }: { provider: string; cx: number; cy: number; r: number }) {
  const style = providerStyle(provider);
  const s = r * 1.2;
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={style.color} stroke="#fff" strokeWidth={1.4} />
      {style.logoPath ? (
        <svg x={cx - s / 2} y={cy - s / 2} width={s} height={s} viewBox="0 0 24 24">
          <path d={style.logoPath} fill={style.fg} />
        </svg>
      ) : (
        <text
          x={cx}
          y={cy + r * 0.38}
          textAnchor="middle"
          fontSize={r * 1.1}
          fontWeight={800}
          fill={style.fg}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {style.initials}
        </text>
      )}
    </>
  );
}

function Freighter({ provider, seed }: { provider: string; seed: number }) {
  const color = providerStyle(provider).color;
  const hull = "M6 1H66Q84 1 95 12Q84 23 66 23H6Q1 23 1 18V6Q1 1 6 1Z";
  const cargo = [];
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 2; row++) {
      const r = hash01(seed * 31 + col * 7 + row);
      if (r < 0.12) continue; // an empty bay, so decks don't all look identical
      const x = 24 + col * 7;
      const y = row === 0 ? 5 : 12.5;
      const fill = r < 0.62 ? color : NEUTRAL_CARGO[Math.floor(r * 97) % NEUTRAL_CARGO.length];
      cargo.push(
        <g key={`${col}-${row}`}>
          <rect x={x} y={y} width={6} height={6.5} rx={0.6} fill={fill} />
          {r < 0.36 && <rect x={x} y={y} width={6} height={6.5} rx={0.6} fill="rgba(0,0,0,.18)" />}
          <path d={`M${x + 0.8} ${y + 2.2}H${x + 5.2}M${x + 0.8} ${y + 4.3}H${x + 5.2}`} stroke="rgba(255,255,255,.3)" strokeWidth={0.5} />
        </g>,
      );
    }
  }
  return (
    <>
      <path d={hull} transform="translate(3 4)" fill={SHADOW} />
      <path d={hull} fill={color} />
      <path d="M7 3.5H65Q80 3.5 90 12Q80 20.5 65 20.5H7Q3.5 20.5 3.5 17V7Q3.5 3.5 7 3.5Z" fill="#f6efe0" />
      {cargo}
      <path d="M70 8.5V15.5L77 12Z" fill="#e3d2b3" />
      <circle cx={82} cy={12} r={1} fill="#c9b894" />
      <Pad provider={provider} cx={12.5} cy={12} r={7.5} />
    </>
  );
}

function Yacht({ provider }: { provider: string }) {
  const color = providerStyle(provider).color;
  const hull = "M5 1H48Q66 1 73 11Q66 21 48 21H5Q1 21 1 17V5Q1 1 5 1Z";
  return (
    <>
      <path d={hull} transform="translate(3 4)" fill={SHADOW} />
      <path d={hull} fill="#fbfaf6" stroke="#d9dfe0" strokeWidth={1} />
      <rect x={3.5} y={4} width={17} height={14} rx={2.5} fill="#c8935f" />
      <path d="M4 7.5H20M4 11H20M4 14.5H20" stroke="#a9774a" strokeWidth={0.6} />
      <rect x={22} y={3.5} width={30} height={15} rx={5} fill={color} />
      <rect x={45} y={5.5} width={6} height={11} rx={2.5} fill="rgba(20,50,60,.55)" />
      <path d="M58 7.5L66 11L58 14.5" fill="none" stroke="#d9dfe0" strokeWidth={1} />
      <Pad provider={provider} cx={34} cy={11} r={6} />
    </>
  );
}

function Speedboat({ provider }: { provider: string }) {
  const color = providerStyle(provider).color;
  const hull = "M4 1H36Q52 1 57 9Q52 17 36 17H4Q1 17 1 14V4Q1 1 4 1Z";
  return (
    <>
      <path d={hull} transform="translate(3 4)" fill={SHADOW} />
      <path d={hull} fill={color} />
      <path d="M5 3.5H35Q48 3.5 52 9Q48 14.5 35 14.5H5Q3.5 14.5 3.5 13V5Q3.5 3.5 5 3.5Z" fill="#fbfaf6" />
      <rect x={5} y={5} width={7} height={8} rx={2} fill="#e3d2b3" />
      <path d="M36 4.5Q40 9 36 13.5" fill="none" stroke="rgba(20,50,60,.5)" strokeWidth={1.6} />
      <Pad provider={provider} cx={23} cy={9} r={5.5} />
    </>
  );
}

/**
 * One vessel, bow pointing right (+x). The provider mark is painted onto the
 * deck inside the same drawing as the hull, so it moves with the ship rather
 * than floating above it.
 */
export function Ship({
  provider,
  seed,
  vessel,
  className,
}: {
  provider: string;
  seed: number;
  vessel: VesselType;
  className?: string;
}) {
  const { length, beam } = VESSELS[vessel];
  return (
    <svg viewBox={`0 0 ${length} ${beam}`} className={className} overflow="visible" aria-hidden="true">
      {vessel === "freighter" ? (
        <Freighter provider={provider} seed={seed} />
      ) : vessel === "yacht" ? (
        <Yacht provider={provider} />
      ) : (
        <Speedboat provider={provider} />
      )}
    </svg>
  );
}

const CARGO_YARD = ["#d9824f", "#e3b04b", "#4f8fa0", "#c85a4a", "#7aa36b", "#ece6d8"];

/** The port tile repeats every PORT_PERIOD px (a multiple of the road-dash
 *  period, 28, and the bollard spacing, 70, so neither jumps at the seam). */
export const PORT_PERIOD = 1120;
const YARD_BOTTOM = 54;
const ROAD = { top: 58, h: 30 };

/**
 * The port side: a container yard with a couple of warehouse roofs, the port
 * road, and a strip of apron with bollards at the water's edge. Pure scenery —
 * it streams past; the dates live on the timing rail below it.
 */
export function PortTile() {
  const sheds = [
    { x: 330, w: 150 },
    { x: 860, w: 120 },
  ];
  const stacks: { x: number; y: number; n: number; seed: number }[] = [];
  for (let i = 0, x = 12; x < PORT_PERIOD - 90; i++) {
    const r = hash01(i + 400);
    const n = 2 + (Math.floor(r * 10) % 3);
    const w = n * 25;
    const clash = sheds.some((s) => x + w > s.x - 10 && x < s.x + s.w + 10);
    if (!clash && r > 0.2) stacks.push({ x, y: r > 0.6 ? 8 : 28, n, seed: i });
    x += w + 16 + Math.round(hash01(i + 410) * 30);
  }

  return (
    <svg width={PORT_PERIOD} height={RAIL_TOP} viewBox={`0 0 ${PORT_PERIOD} ${RAIL_TOP}`} aria-hidden="true">
      <rect width={PORT_PERIOD} height={YARD_BOTTOM} fill="#9a9ea3" />
      {sheds.map((s) => (
        <g key={s.x}>
          <rect x={s.x + 4} y={10} width={s.w} height={40} rx={2} fill="rgba(0,0,0,.18)" />
          <rect x={s.x} y={6} width={s.w} height={40} rx={2} fill="#d4d7da" />
          <path
            d={Array.from({ length: Math.floor(s.w / 12) }, (_, k) => `M${s.x + 6 + k * 12} 8V44`).join("")}
            stroke="rgba(0,0,0,.08)"
            strokeWidth={2}
          />
          <rect x={s.x} y={24} width={s.w} height={4} fill="rgba(0,0,0,.08)" />
        </g>
      ))}
      {stacks.map((st) => (
        <g key={st.seed}>
          {Array.from({ length: st.n }, (_, k) => {
            const fill = CARGO_YARD[Math.floor(hash01(st.seed * 5 + k) * CARGO_YARD.length)];
            const x = st.x + k * 25;
            return (
              <g key={k}>
                <rect x={x} y={st.y + 2} width={23} height={14} rx={1} fill="rgba(0,0,0,.18)" />
                <rect x={x} y={st.y} width={23} height={14} rx={1} fill={fill} />
                <path
                  d={`M${x + 6} ${st.y + 2}V${st.y + 12}M${x + 11.5} ${st.y + 2}V${st.y + 12}M${x + 17} ${st.y + 2}V${st.y + 12}`}
                  stroke="rgba(255,255,255,.3)"
                  strokeWidth={0.8}
                />
              </g>
            );
          })}
        </g>
      ))}
      <rect y={ROAD.top} width={PORT_PERIOD} height={ROAD.h} fill="#6f757b" />
      <path
        d={`M0 ${ROAD.top + ROAD.h / 2}H${PORT_PERIOD}`}
        stroke="rgba(255,255,255,.55)"
        strokeWidth={1.5}
        strokeDasharray="16 12"
      />
      <rect y={ROAD.top + ROAD.h} width={PORT_PERIOD} height={RAIL_TOP - ROAD.top - ROAD.h} fill="#a6aaae" />
      {Array.from({ length: PORT_PERIOD / 70 }, (_, k) => (
        <circle key={k} cx={k * 70 + 35} cy={RAIL_TOP - 8} r={3} fill="#4b5157" />
      ))}
    </svg>
  );
}

/**
 * The timing rail: the one strip in the scene that doesn't stream. A day
 * number over every berth, a gold line and name at every month, a dot in the
 * provider's colour wherever something shipped, and today picked out — like
 * the timing board along the bottom of a race broadcast.
 */
export function TimingRail({
  year,
  width,
  todayDay,
  marks,
}: {
  year: number;
  width: number;
  todayDay: number;
  marks: { x: number; color: string; id: number }[];
}) {
  const days = daysInYear(year);
  const end = cellX(days);
  const h = QUAY_H - RAIL_TOP;
  const dates = [];
  for (let d = 0; d < days; d++) dates.push({ d, n: new Date(Date.UTC(year, 0, 1 + d)).getUTCDate() });

  return (
    <svg className="hb-rail" width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={{ top: RAIL_TOP }} aria-hidden="true">
      <rect width={width} height={h} fill="#17323a" />
      <rect x={cellX(todayDay)} width={DAY_W} height={h} fill="rgba(245,197,24,.22)" />
      <text x={LEAD - 20} y={24} textAnchor="end" className="hb-rail-label">
        {year} START →
      </text>
      {dates.map(({ d, n }) => (
        <g key={d}>
          <path d={`M${cellX(d)} ${h - 7}V${h}`} stroke="rgba(233,241,239,.35)" strokeWidth={1} />
          <text x={dayX(d)} y={h - 9} textAnchor="middle" className="hb-rail-day">
            {n}
          </text>
        </g>
      ))}
      {MONTHS.map((label, m) => {
        const x = cellX(monthStartDay(year, m));
        return (
          <g key={label}>
            <rect x={x - 1.5} width={3} height={h} fill="#f1c232" />
            <text x={x + 7} y={12} className="hb-rail-month">
              {label}
            </text>
          </g>
        );
      })}
      <rect x={end - 1.5} width={3} height={h} fill="#f1c232" />
      <text x={end + 10} y={24} className="hb-rail-label">
        END OF {year}
      </text>
      {marks.map((m) => (
        <circle key={m.id} cx={m.x} cy={h - 1} r={3.2} fill={m.color} stroke="#fff" strokeWidth={1.2} />
      ))}
    </svg>
  );
}

const GREENS = ["#7cc36b", "#6bb85f", "#8fcf74", "#5fae57"];

/** The bank tile repeats every BANK_PERIOD px. */
export const BANK_PERIOD = 1200;
/** Footpath centre line; starts and ends at the same height so tiles join. */
const PATH = "M0 82C200 64 400 102 600 82S1000 62 1200 82";

/**
 * The far bank: reeds at the water's edge, a verge of small trees, a winding
 * footpath, and a lawn of bigger trees below. Streams past with the water.
 */
export function BankTile() {
  const h = WORLD_H - RIVER_BOTTOM;
  const trees: { x: number; y: number; r: number; c: string; id: string }[] = [];
  const strips = [
    { top: 30, bottom: 56, step: 64, rMin: 7, rMax: 11 },
    { top: 112, bottom: h - 8, step: 44, rMin: 9, rMax: 20 },
  ];
  strips.forEach((st, si) => {
    for (let i = 0, x = 16; x < BANK_PERIOD - 16; i++) {
      const r = hash01(i * 13 + si * 1000);
      if (r > 0.25) {
        trees.push({
          id: `${si}-${i}`,
          x: Math.round(x),
          y: Math.round(st.top + hash01(i * 7 + si) * (st.bottom - st.top)),
          r: Math.round(st.rMin + r * (st.rMax - st.rMin)),
          c: GREENS[Math.floor(hash01(i + si * 50) * GREENS.length)],
        });
      }
      x += st.step * (0.6 + hash01(i * 5 + si * 3));
    }
  });
  const reeds = [];
  for (let i = 0, x = 20; x < BANK_PERIOD - 20; i++, x += 46 + Math.round(hash01(i + 60) * 60)) {
    reeds.push({ id: i, x });
  }

  return (
    <svg width={BANK_PERIOD} height={h} viewBox={`0 0 ${BANK_PERIOD} ${h}`} overflow="visible" aria-hidden="true">
      <path d={PATH} fill="none" stroke="#e3d3a4" strokeWidth={16} strokeLinecap="round" />
      <path d={PATH} fill="none" stroke="rgba(0,0,0,.05)" strokeWidth={16} strokeDasharray="2 26" />
      {reeds.map((r) => (
        <path
          key={r.id}
          d={`M${r.x} 22L${r.x - 4} 8M${r.x + 3} 22L${r.x + 3} 5M${r.x + 6} 22L${r.x + 10} 9`}
          stroke="#5f9e4a"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      <g fill="rgba(30,80,40,.22)">
        {trees.map((t) => (
          <circle key={`s${t.id}`} cx={t.x + 4} cy={t.y + 5} r={t.r} />
        ))}
      </g>
      {trees.map((t) => (
        <g key={t.id}>
          <circle cx={t.x} cy={t.y} r={t.r} fill={t.c} />
          <circle cx={t.x - t.r * 0.3} cy={t.y - t.r * 0.3} r={t.r * 0.55} fill="rgba(255,255,255,.14)" />
        </g>
      ))}
    </svg>
  );
}

const PUFFS = [
  [52, 58, 30],
  [86, 42, 36],
  [122, 58, 28],
  [70, 76, 26],
  [106, 78, 25],
  [34, 72, 20],
] as const;

/** Cloud with its shadow thrown down-right onto whatever is below it. */
export function Cloud() {
  return (
    <svg viewBox="0 0 220 150" overflow="visible" aria-hidden="true">
      <g transform="translate(34 48)" fill="#06404a" opacity={0.1}>
        {PUFFS.map(([cx, cy, r]) => <circle key={`s${cx}`} cx={cx} cy={cy} r={r} />)}
      </g>
      <g fill="#d3e9ef">
        {PUFFS.map(([cx, cy, r]) => <circle key={`b${cx}`} cx={cx} cy={cy + 4} r={r} />)}
      </g>
      <g fill="#ffffff">
        {PUFFS.map(([cx, cy, r]) => <circle key={`w${cx}`} cx={cx - 2} cy={cy - 3} r={r - 2} />)}
      </g>
    </svg>
  );
}

/** Near-white brand colours (xAI, Moonshot) need a dark ring to show on the marker. */
function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.8;
}

/**
 * Floating provider marker above a ship, like the badges over the cars in the
 * racing reference: a white disc with the provider's mark and a ring in its
 * colour. It opens into a pill with the model name on hover, and stays open
 * with a crown on the race leader.
 */
export function Marker({
  provider,
  name,
  date,
  lead,
}: {
  provider: string;
  name: string;
  date: string;
  lead: boolean;
}) {
  const style = providerStyle(provider);
  const light = isLight(style.color);
  return (
    <span
      className="hb-marker"
      style={
        {
          "--c": style.color,
          "--ring": light ? "#17323a" : style.color,
          "--fg": style.fg,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {lead && (
        <svg className="hb-crown" viewBox="0 0 20 12">
          <path d="M1 11L3 2L7.5 6.5L10 0.5L12.5 6.5L17 2L19 11Z" fill="#f5c518" stroke="#b07a1a" strokeWidth={1} />
        </svg>
      )}
      <span className="hb-marker-icon">
        {style.logoPath ? (
          <svg viewBox="0 0 24 24">
            <path d={style.logoPath} fill={light ? style.fg : style.color} />
          </svg>
        ) : (
          <b style={{ color: light ? style.fg : style.color }}>{style.initials}</b>
        )}
      </span>
      <span className="hb-marker-label">
        <strong>{name}</strong>
        <small>{date}</small>
      </span>
    </span>
  );
}

function Fish({ koi }: { koi: boolean }) {
  return (
    <svg viewBox="0 0 26 12" className="hb-fish-body" overflow="visible">
      {koi ? (
        <>
          <path d="M20 6L26 1.5V10.5Z" fill="#f08a4b" className="hb-fish-tail" />
          <ellipse cx={11} cy={6} rx={10} ry={4.6} fill="#f39a5a" />
          <ellipse cx={8} cy={5} rx={3.4} ry={2.4} fill="#fff4ea" />
          <ellipse cx={14.5} cy={7} rx={2.2} ry={1.6} fill="#fff4ea" />
        </>
      ) : (
        <>
          <path d="M20 6L26 1.5V10.5Z" fill="rgba(10,70,80,.3)" className="hb-fish-tail" />
          <ellipse cx={11} cy={6} rx={10} ry={4.4} fill="rgba(10,70,80,.3)" />
        </>
      )}
    </svg>
  );
}

/** The water-life tile repeats every LIFE_PERIOD px. */
export const LIFE_PERIOD = 1400;

/**
 * Life in the river, carried past the fleet by the current: fish under the
 * surface (mostly shadows, now and then a koi) that also swim on their own,
 * leaves turning as they float, rings where something rises, and glints.
 * Coordinates are relative to the river's top edge.
 */
export function WaterTile() {
  const span = RIVER_BOTTOM - QUAY_H - 40;
  const at = (seed: number) => Math.round(18 + hash01(seed) * span);
  const schools = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    x: 120 + i * 330 + Math.round(hash01(i + 700) * 120),
    y: at(i + 730),
    n: 1 + Math.floor(hash01(i + 720) * 3),
    koi: hash01(i + 710) < 0.35,
    right: hash01(i + 740) < 0.35,
    dur: Math.round(10 + hash01(i + 750) * 8),
    delay: -Math.round(hash01(i + 760) * 10),
  }));
  const leaves = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    x: 260 + i * 440 + Math.round(hash01(i + 800) * 120),
    y: at(i + 810),
    hue: hash01(i + 820) < 0.5 ? "#8cc152" : "#e6b84a",
    delay: -Math.round(hash01(i + 840) * 8),
  }));
  const ripples = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: 90 + i * 270 + Math.round(hash01(i + 900) * 100),
    y: at(i + 910),
    delay: -Math.round(hash01(i + 920) * 60) / 10,
  }));
  const glints = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: 40 + i * 230 + Math.round(hash01(i + 300) * 90),
    y: at(i + 310),
    delay: -Math.round(hash01(i + 320) * 40) / 10,
  }));

  return (
    <div className="hb-life" style={{ width: LIFE_PERIOD }} aria-hidden="true">
      {glints.map((g) => (
        <span key={`g${g.id}`} className="hb-sparkle" style={{ left: g.x, top: g.y, animationDelay: `${g.delay}s` }} />
      ))}
      {ripples.map((r) => (
        <span key={`r${r.id}`} className="hb-ripple" style={{ left: r.x, top: r.y, animationDelay: `${r.delay}s` }} />
      ))}
      {schools.map((s) => (
        <span
          key={`f${s.id}`}
          className={`hb-school${s.right ? " is-right" : ""}`}
          style={{ left: s.x, top: s.y, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
        >
          {Array.from({ length: s.n }, (_, k) => (
            <span
              key={k}
              className="hb-fish"
              style={{ left: k * 20, top: (k % 2) * 12 - 6, animationDelay: `${-k * 0.3}s` }}
            >
              <Fish koi={s.koi} />
            </span>
          ))}
        </span>
      ))}
      {leaves.map((l) => (
        <span key={`l${l.id}`} className="hb-leaf" style={{ left: l.x, top: l.y, animationDelay: `${l.delay}s` }}>
          <svg viewBox="0 0 16 10">
            <path d="M1 5Q8 -2 15 5Q8 12 1 5Z" fill={l.hue} />
            <path d="M2 5H14" stroke="rgba(0,0,0,.2)" strokeWidth={0.8} />
          </svg>
        </span>
      ))}
    </div>
  );
}
