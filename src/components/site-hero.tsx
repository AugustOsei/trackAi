import { ShipMark } from "@/components/ship-mark";

/**
 * One wave line. The path holds four identical periods across a 240-unit
 * viewBox, and the element is rendered at 200% of its container, so drifting
 * it by exactly one period (-25% of its own width) loops seamlessly and no
 * one can see the seam. preserveAspectRatio="none" lets it stretch to any
 * container width; non-scaling-stroke (set in CSS) is what stops that stretch
 * from smearing the stroke into an uneven thickness.
 */
const WAVE_PATH = "M0 10Q15 3 30 10T60 10T90 10T120 10T150 10T180 10T210 10T240 10";

/** The far line: a bare stroke, drawn behind the ship. */
function WaveLine({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 240 20" preserveAspectRatio="none" aria-hidden="true">
      <path d={WAVE_PATH} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * The near line, and the water itself. Everything below the wave is filled in
 * the page background, so the hull is occluded exactly the way water occludes
 * it — along the wave's own curve, and wherever the wave happens to be at that
 * moment. Drawn after the ship, so the ship rises and sinks through it.
 *
 * This replaced a straight CSS clip plus a background-colored stroke faking
 * the waterline. That worked at hero size and fell apart at the smaller mobile
 * size, where a fixed-width stroke ate most of a much shorter hull and left
 * the keel stranded below it as a loose sliver.
 */
function WaterLine({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden="true">
      <path className="hero-water-fill" d={`${WAVE_PATH}L240 40L0 40Z`} stroke="none" />
      <path d={WAVE_PATH} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Homepage hero. Stays a server component — every bit of motion here is CSS,
 * so the top of the page ships no JavaScript and doesn't fight the timeline
 * below it for hydration.
 *
 * The horizon is two gold hairlines, not a filled sea: the same one-pixel
 * gold rule the timeline spine and the TODAY marker are already built from,
 * so the mascot arrives as part of the existing system rather than as an
 * illustration pasted over it.
 */
export function SiteHero() {
  return (
    <section>
      <div className="max-w-4xl">
        <h1 className="font-display text-4xl font-black leading-[0.95] tracking-tight text-ink sm:text-[2.75rem] lg:text-5xl">
          <span className="block">Track AI model releases</span>
          {/* Scroll-linked, but never hidden — see .hero-reveal in globals.css
              for why this starts legible rather than at zero opacity. The line
              as a whole carries the rise; only the text carries the fade, so
              the gold badge stays crisp gold instead of dimming to olive. */}
          <span className="hero-reveal block">
            <span className="font-display mr-2.5 inline-block -rotate-3 rounded-xl bg-gold px-3 py-0.5 align-middle text-2xl tracking-wide text-gold-fg shadow-[0_3px_0_rgba(0,0,0,0.35)] sm:text-3xl">
              AND
            </span>
            <span className="hero-reveal-text">see how they hold up in real use.</span>
          </span>
        </h1>
      </div>

      {/* Draw order is the waterline: far line, then the ship, then the water,
          which paints over everything below its own curve. */}
      <div className="hero-horizon" aria-hidden="true">
        <WaveLine className="hero-wave hero-wave-back" />
        <div className="hero-ship">
          <div className="hero-ship-rock">
            <ShipMark className="h-full w-full" />
          </div>
        </div>
        <WaterLine className="hero-wave hero-wave-front" />
      </div>
    </section>
  );
}
