/**
 * Harbour geometry. One continuous world where the x axis IS the calendar:
 * every day of the year is a fixed-width cell along the quay, and each ship's
 * bow sits on its release date. The fleet sails left to right, so the newest
 * releases lead and everything older trails behind. Everything that carries
 * a date (timing rail, lanes, buoy line, minimap) reads from these numbers so
 * the scene can never drift out of agreement with the dates it claims to show.
 *
 * Bands, top to bottom:
 *   port    0 … RAIL_TOP              containers, warehouses, road — scenery
 *   rail    RAIL_TOP … QUAY_H         the timing rail: days, months, today
 *   river   QUAY_H … RIVER_BOTTOM     the fleet
 *   bank    RIVER_BOTTOM … WORLD_H    reeds, trees, a footpath — scenery
 *
 * Scenery streams past continuously (see harbour.tsx); the rail and the
 * ships don't, because they're what says which day is which.
 */

export type HarbourModel = {
  id: number;
  name: string;
  slug: string;
  provider: string;
  status: "rumored" | "announced" | "released";
  date: string | null;
  providerBlurb: string | null;
  reportCount: number;
  topReport: string | null;
};

export const DAY_W = 56;
export const QUAY_H = 140;
export const RIVER_BOTTOM = 444;
export const WORLD_H = 640;
/** Top of the timing rail; the rail runs down to QUAY_H, the river's edge. */
export const RAIL_TOP = 104;

// Six wide lanes rather than eight tight ones: each ship carries a floating
// provider marker above it, and the extra height is what keeps a marker from
// landing on the ship in the lane above.
const LANES = 6;
const LANE_H = 48;
const FIRST_LANE = QUAY_H + 46;
/** Clear water kept between one ship's bow and the next ship's stern in a lane. */
const LANE_GAP = 18;

/** Open water before Jan 1 and after Dec 31 (the "no date yet" fog bank). */
export const LEAD = 360;
export const TAIL = 760;

export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export type VesselType = "freighter" | "yacht" | "speedboat";

export const VESSELS: Record<VesselType, { length: number; beam: number }> = {
  freighter: { length: 96, beam: 24 },
  yacht: { length: 74, beam: 22 },
  speedboat: { length: 58, beam: 18 },
};

export function daysInYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
}

/** Day of year, 0-based, for an ISO date string. Null if outside `year`. */
export function dayIndex(iso: string, year: number) {
  if (!iso.startsWith(String(year))) return null;
  const t = Date.UTC(year, Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  return Math.round((t - Date.UTC(year, 0, 1)) / 86_400_000);
}

export function monthStartDay(year: number, month: number) {
  return Math.round((Date.UTC(year, month, 1) - Date.UTC(year, 0, 1)) / 86_400_000);
}

/** Left edge of a day's cell. */
export function cellX(day: number) {
  return LEAD + day * DAY_W;
}

/** Centre of a day's cell — where a ship released that day has its bow. */
export function dayX(day: number) {
  return cellX(day) + DAY_W / 2;
}

export function worldWidth(year: number) {
  return LEAD + daysInYear(year) * DAY_W + TAIL;
}

/** Deterministic pseudo-random in [0, 1) so art varies per ship without changing between renders. */
export function hash01(seed: number) {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function vesselFor(id: number): VesselType {
  const r = hash01(id * 3 + 1);
  return r < 0.5 ? "freighter" : r < 0.8 ? "yacht" : "speedboat";
}

export type Placement = {
  model: HarbourModel;
  vessel: VesselType;
  /** Bow tip x — the release date. */
  x: number;
  /** Centre line y of the lane. */
  y: number;
  kind: "sailing" | "inbound" | "ghost" | "uncharted";
};

export function layoutHarbour(models: HarbourModel[], year: number) {
  const placements: Placement[] = [];
  const dated: { model: HarbourModel; x: number }[] = [];
  const uncharted: HarbourModel[] = [];

  for (const model of models) {
    const day = model.date ? dayIndex(model.date, year) : null;
    if (model.date && day === null) continue; // another year's release
    if (day === null) uncharted.push(model);
    else dated.push({ model, x: dayX(day) });
  }

  // Convoy packing: walk the fleet oldest to newest and put each ship in a
  // lane whose previous ship has already cleared its stern. Among the free
  // lanes the choice is scattered (but stable per model) so the fleet reads as
  // a loose flotilla rather than a single-file queue. If every lane is busy —
  // a very crowded few days — take the one that frees up soonest.
  dated.sort((a, b) => a.x - b.x || a.model.provider.localeCompare(b.model.provider) || a.model.id - b.model.id);
  const laneEnd = Array<number>(LANES).fill(-Infinity);
  for (const { model, x } of dated) {
    const vessel = vesselFor(model.id);
    const stern = x - VESSELS[vessel].length;
    const free = laneEnd.map((end, i) => (end + LANE_GAP <= stern ? i : -1)).filter((i) => i >= 0);
    const lane = free.length
      ? free[Math.floor(hash01(model.id + 7) * free.length)]
      : laneEnd.indexOf(Math.min(...laneEnd));
    laneEnd[lane] = x;
    placements.push({
      model,
      vessel,
      x,
      y: FIRST_LANE + lane * LANE_H,
      kind:
        model.status === "released" ? "sailing" : model.status === "announced" ? "inbound" : "ghost",
    });
  }

  // Undated models wait in the fog past Dec 31.
  const endOfYear = cellX(daysInYear(year));
  uncharted.forEach((model, k) => {
    placements.push({
      model,
      vessel: vesselFor(model.id),
      x: endOfYear + 260 + (k % 3) * 150,
      y: FIRST_LANE + ((k * 3) % LANES) * LANE_H,
      kind: "uncharted",
    });
  });

  return { placements };
}
