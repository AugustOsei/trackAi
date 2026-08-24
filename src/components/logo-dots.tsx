/**
 * The single gold dot after "trackai" splits into three, holds, and merges
 * back — a small "scanning" motif for a site whose whole premise is tracking
 * what's actually happening. Pure CSS (three keyframe-animated dots sharing
 * one timeline), so it needs no client JS and costs nothing on the server
 * render.
 *
 * The dots are `aria-hidden`; a visually-hidden "." keeps the link's
 * accessible name identical to what it was before ("trackai.").
 */
export function LogoDots() {
  return (
    <>
      <span className="logo-dots" aria-hidden="true">
        <span className="logo-dot logo-dot-mid" />
        <span className="logo-dot logo-dot-left" />
        <span className="logo-dot logo-dot-right" />
      </span>
      <span className="sr-only">.</span>
    </>
  );
}
