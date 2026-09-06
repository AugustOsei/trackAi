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

function WaveLine({ className, halo = false }: { className: string; halo?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 240 20" preserveAspectRatio="none" aria-hidden="true">
      {/* The near wave carries a wider stroke of the page background beneath
          the gold one. Invisible against the page, but where the wave passes
          over the hull it knocks a dark band through it — which is the only
          thing that actually reads as a waterline. Gold-on-gold, the crossing
          was invisible and the ship looked parked on top of the line. */}
      {halo && (
        <path d={WAVE_PATH} fill="none" stroke="var(--color-bg)" strokeWidth="8" />
      )}
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

      {/* Draw order is the waterline: the near wave paints over the hull it
          crosses, which is what puts the ship *in* the water rather than on
          top of a line. */}
      <div className="hero-horizon" aria-hidden="true">
        <WaveLine className="hero-wave hero-wave-back" />
        <div className="hero-ship-well">
          <div className="hero-ship">
            <div className="hero-ship-rock">
              <ShipMark className="h-full w-full" />
            </div>
          </div>
        </div>
        <WaveLine className="hero-wave hero-wave-front" halo />
      </div>
    </section>
  );
}
