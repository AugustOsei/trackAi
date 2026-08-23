export function formatDate(value: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : value;
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(d)
    .toUpperCase();
}

export function formatIndex(value: string | null): string {
  if (value === null) return "—";
  return Number(value).toFixed(1);
}

export function formatPrice(value: string | null): string {
  if (value === null) return "—";
  return `$${Number(value).toFixed(2)}`;
}

export function formatSpeed(value: string | null): string {
  if (value === null) return "—";
  return `${Number(value).toFixed(0)} t/s`;
}

export function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isRecent(value: Date, days = 10): boolean {
  const ageMs = Date.now() - new Date(value).getTime();
  return ageMs >= 0 && ageMs < days * 24 * 60 * 60 * 1000;
}

export const TASK_LABELS: Record<string, string> = {
  coding: "Coding",
  agentic: "Agentic",
  vision: "Vision",
  writing: "Writing",
  other: "Other",
};
