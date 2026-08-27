import Link from "next/link";
import { getTimelineModels, getProviders } from "@/lib/queries";
import { MilestoneTimeline } from "@/components/milestone-timeline";
import { HowItWorks } from "@/components/how-it-works";
import type { Model } from "@/db/schema";

export const dynamic = "force-dynamic";

const STATUSES: { value: Model["status"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "released", label: "Released" },
  { value: "announced", label: "Announced" },
  { value: "rumored", label: "Rumored" },
];

export default async function TimelinePage({
  searchParams,
}: PageProps<"/">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "all";
  const provider = typeof params.provider === "string" ? params.provider : undefined;

  const [models, providers] = await Promise.all([
    getTimelineModels({
      status: status === "all" ? undefined : (status as Model["status"]),
      provider,
    }),
    getProviders(),
  ]);

  function hrefFor(nextStatus: string, nextProvider?: string) {
    const sp = new URLSearchParams();
    if (nextStatus !== "all") sp.set("status", nextStatus);
    if (nextProvider) sp.set("provider", nextProvider);
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="max-w-4xl">
        <h1 className="font-display text-4xl font-black leading-[0.95] tracking-tight text-ink sm:text-[2.75rem] lg:text-5xl">
          Track AI model releases
          <br />
          <span className="font-display mr-2.5 inline-block -rotate-3 rounded-xl bg-gold px-3 py-0.5 align-middle text-2xl tracking-wide text-gold-fg shadow-[0_3px_0_rgba(0,0,0,0.35)] sm:text-3xl">
            AND
          </span>
          see how they hold up in real use.
        </h1>
      </div>

      <MilestoneTimeline models={models} />

      {/* Filters sit below the grid, not above it — most visitors want the
          timeline itself first, and most filter combinations narrow the
          grid down to little or nothing anyway. One scrollable row on small
          screens: with a dozen-plus providers, wrapping pills would push
          things too far down the page. */}
      <div className="timeline-scroll -mx-4 mt-6 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={hrefFor(s.value, provider)}
            className={`font-display shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              status === s.value
                ? "bg-gold text-gold-fg"
                : "bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {s.label}
          </Link>
        ))}
        <span className="mx-1 h-6 w-px shrink-0 bg-hairline" />
        <Link
          href={hrefFor(status)}
          className={`font-display shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            !provider ? "bg-surface-raised text-ink" : "bg-surface text-ink-muted hover:text-ink"
          }`}
        >
          All providers
        </Link>
        {providers.map((p) => (
          <Link
            key={p}
            href={hrefFor(status, p)}
            className={`font-display shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              provider === p ? "bg-surface-raised text-ink" : "bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {p}
          </Link>
        ))}
      </div>

      <HowItWorks />
    </div>
  );
}
