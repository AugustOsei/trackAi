import Link from "next/link";
import { getTimelineModels, getProviders } from "@/lib/queries";
import { MilestoneTimeline } from "@/components/milestone-timeline";
import type { Model } from "@/db/schema";

export const dynamic = "force-dynamic";

const STATUSES: { value: Model["status"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "released", label: "Released" },
  { value: "announced", label: "Announced" },
  { value: "rumored", label: "Rumored" },
];

export default async function TimelinePage({ searchParams }: PageProps<"/timeline">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "all";
  const provider = typeof params.provider === "string" ? params.provider : undefined;

  const [models, providers] = await Promise.all([
    getTimelineModels({ status: status === "all" ? undefined : (status as Model["status"]), provider }),
    getProviders(),
  ]);

  function hrefFor(nextStatus: string, nextProvider?: string) {
    const sp = new URLSearchParams();
    if (nextStatus !== "all") sp.set("status", nextStatus);
    if (nextProvider) sp.set("provider", nextProvider);
    const qs = sp.toString();
    return qs ? `/timeline?${qs}` : "/timeline";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-data text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">Release archive</p>
          <h1 className="font-display mt-3 text-5xl leading-none font-black tracking-[-0.05em] text-ink uppercase sm:text-7xl">The timeline.</h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-ink-muted">Every model we track—released, announced or still a signal on the horizon.</p>
      </div>

      <MilestoneTimeline models={models} />

      <div className="timeline-scroll -mx-4 mt-6 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {STATUSES.map((s) => (
          <Link key={s.value} href={hrefFor(s.value, provider)} className={`font-display shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold transition-colors ${status === s.value ? "bg-gold text-gold-fg" : "bg-surface text-ink-muted hover:text-ink"}`}>
            {s.label}
          </Link>
        ))}
        <span className="mx-1 h-6 w-px shrink-0 bg-hairline" />
        <Link href={hrefFor(status)} className={`font-display shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold transition-colors ${!provider ? "bg-surface-raised text-ink" : "bg-surface text-ink-muted hover:text-ink"}`}>
          All providers
        </Link>
        {providers.map((item) => (
          <Link key={item} href={hrefFor(status, item)} className={`font-display shrink-0 snap-start rounded-full px-4 py-2 text-sm font-bold transition-colors ${provider === item ? "bg-surface-raised text-ink" : "bg-surface text-ink-muted hover:text-ink"}`}>
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}
