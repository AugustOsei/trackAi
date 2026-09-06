/**
 * trackai's mascot, on the pun the whole site rests on: models *ship*.
 *
 * Drawn as line art in a single color rather than as a full-color
 * illustration. It has to sit on a near-black page beside hairline rules and
 * tabular dates without reading as clip art, and it has to survive being
 * scaled from hero size down to the ~40px it renders at in an empty state.
 * Everything is currentColor so callers pick the ink — gold in the hero,
 * faint grey where it's a placeholder — with no variant prop.
 *
 * Wind comes from astern on the left, so both sails belly to the right and
 * the bowsprit leads that way too. That gives the silhouette a direction,
 * which is what makes it read as sailing rather than parked.
 */
export function ShipMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Pennant, mast, bowsprit. The mast is drawn before the sails so it
          shows through them as rigging, and reads solid in the gaps above and
          between the yards. */}
      <path d="M49 7l14 4-14 4z" fill="currentColor" stroke="none" />
      <path d="M48 7v63" />
      <path d="M82 69l11-6" />

      {/* Two stacked square sails on their yards. Square rig rather than a
          triangular one on purpose: a jib-and-main silhouette is just the
          generic sailboat icon, and at this size the two triangles merge into
          one blob. Stacked squares stay separable and say "tall ship" at a
          glance. Each is wider at the foot than the head, with the foot
          curved, which is what makes it read as filled with wind. */}
      <path d="M31 22h34" />
      <path d="M33 23h30l3 16q-18 6-36 0z" fill="currentColor" fillOpacity="0.22" />
      <path d="M25 46h46" />
      <path d="M28 47h40l4 18q-24 7-48 0z" fill="currentColor" fillOpacity="0.22" />

      {/* Hull, solid — the only heavy mass in the mark, which keeps it
          anchored at small sizes where the rigging starts to disappear. Drawn
          last so it covers the foot of the lower sail, the way a bulwark
          would. */}
      <path d="M12 70h72l-8 14q-28 6-56 0z" fill="currentColor" stroke="none" />
    </svg>
  );
}
