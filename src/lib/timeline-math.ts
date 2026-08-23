const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function startOfUTCDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addMonthsUTC(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

export function shortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })
    .format(date)
    .toUpperCase();
}

/** Month segments (start date + day-width) fully covering [rangeStart, rangeEnd]. */
export function monthSegments(
  rangeStart: Date,
  rangeEnd: Date,
): { start: Date; days: number; label: string }[] {
  const segments: { start: Date; days: number; label: string }[] = [];
  let cursor = startOfMonthUTC(rangeStart);

  while (cursor < rangeEnd) {
    const next = addMonthsUTC(cursor, 1);
    const segStart = cursor > rangeStart ? cursor : rangeStart;
    const segEnd = next < rangeEnd ? next : rangeEnd;
    segments.push({
      start: cursor,
      days: daysBetween(segStart, segEnd),
      label: shortMonthLabel(cursor),
    });
    cursor = next;
  }

  return segments;
}
