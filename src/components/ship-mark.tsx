/**
 * trackai's mascot, on the pun the whole site rests on: models *ship*.
 *
 * A square-rigged tall ship drawn as a filled silhouette — three masts, eight
 * courses, a headsail, gunports along the wale. Not an outlined icon: a
 * uniform stroke with round caps is what makes a mark read as a toy, and a
 * two-sail boat is a dinghy, not a ship. The rig is deliberately mostly
 * empty space above a shallow hull, because a tall ship is mostly rig — give
 * the hull real depth and it turns into a boat with masts stuck on it.
 *
 * No two sails overlap. They would on a real vessel seen from abeam, but
 * overlapping shapes in one flat color merge into a single blob the moment
 * the mark is small, and this has to survive down to ~40px in the timeline's
 * empty state.
 *
 * Everything is currentColor, so callers pick the ink — gold in the hero,
 * faint grey where it's a placeholder. The one exception is the wale and
 * gunports, which are knocked out in the page background: this mark expects
 * to sit on --color-bg, not on a raised surface.
 */
export function ShipMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 180" className={className} aria-hidden="true">
      {/* Standing rigging. Only the forestay run — backstays down to the hull
          draw a big triangular roof across the whole mark. */}
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M120 20 170 36M170 36 228 98" />
        <path d="M120 24 108 50M120 24 132 50" />
        <path d="M170 40 160 64M170 40 180 64" />
        <path d="M70 48 62 70M70 48 78 70" />
      </g>

      {/* Masts and bowsprit, drawn before the sails so they read as rigging
          through the gaps and stay solid above the topmost yard. */}
      <g fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M120 18v114M170 40v92M70 48v84" />
        <path d="M198 120 230 100" />
      </g>

      {/* Courses. Each is wider at the foot than the head with a curved foot —
          that is what reads as canvas holding wind rather than a trapezoid. */}
      <g fill="currentColor">
        <path d="M107 32h26l3 20q-16 4-32 0z" />
        <path d="M101 58h38l4 24q-23 5-46 0z" />
        <path d="M96 88h48l3 24q-27 6-54 0z" />

        <path d="M159 46h22l3 17q-14 3-28 0z" />
        <path d="M154 69h32l3 21q-19 4-38 0z" />
        <path d="M150 96h40l2 20q-22 5-44 0z" />

        <path d="M58 56h24l3 20q-15 4-30 0z" />
        <path d="M53 82h34l3 22q-20 5-40 0z" />

        {/* Headsail, set clear of the fore course so the two don't merge. */}
        <path d="M198 74 221 97 200 103z" />
      </g>

      <g fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M104 31h32M97 57h46M92 87h56" />
        <path d="M156 45h28M150 68h40M146 95h48" />
        <path d="M55 55h30M50 81h40" />
      </g>

      {/* Hull, drawn over the sail feet the way a bulwark would sit. It runs
          well below the waterline the hero clips at, so there is always hull
          to cut rather than a gap. */}
      <path
        fill="currentColor"
        d="M32 122Q75 133 120 134Q168 134 201 120L204 129Q199 148 190 162L50 162Q38 142 32 122Z"
      />

      {/* Wale and gunports. Kept above the hero's waterline so they never end
          up half-submerged. */}
      <g fill="var(--color-bg)">
        <rect x="54" y="130" width="132" height="1.6" />
        <rect x="64" y="135.5" width="6" height="4.2" />
        <rect x="80" y="136.5" width="6" height="4.2" />
        <rect x="96" y="137" width="6" height="4.2" />
        <rect x="112" y="137.2" width="6" height="4.2" />
        <rect x="128" y="137" width="6" height="4.2" />
        <rect x="144" y="136.5" width="6" height="4.2" />
        <rect x="160" y="135.5" width="6" height="4.2" />
        <rect x="176" y="134" width="6" height="4.2" />
      </g>

      <path fill="currentColor" d="M121 17l18 5-18 5z" />
    </svg>
  );
}
