export function NewBadge() {
  return (
    <span className="font-display inline-block rounded-full bg-gold px-2 py-0.5 text-[11px] font-black tracking-wide text-gold-fg">
      NEW
    </span>
  );
}

/**
 * The counterpart to NEW: a prediction whose date has come and gone with
 * nothing shipped. Deliberately quiet — outline rather than the filled gold
 * of NEW — because this marks an absence, not an event.
 */
export function OverdueBadge() {
  return (
    <span className="font-display inline-block rounded-full border border-hairline px-2 py-0.5 text-[11px] font-black tracking-wide text-ink-faint">
      OVERDUE
    </span>
  );
}
