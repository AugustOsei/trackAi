import Link from "next/link";
import { getTimelineModels, getProviders } from "@/lib/queries";
import { formatMonthLabel } from "@/lib/format";
import { ModelRow } from "@/components/model-row";
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

  const groups = new Map<string, typeof models>();
  for (const model of models) {
    const date = model.actualDate ?? model.predictedDate ?? model.createdAt;
    const key = formatMonthLabel(date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(model);
  }

  function hrefFor(nextStatus: string, nextProvider?: string) {
    const sp = new URLSearchParams();
    if (nextStatus !== "all") sp.set("status", nextStatus);
    if (nextProvider) sp.set("provider", nextProvider);
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-5xl font-black leading-[0.92] tracking-tight text-ink sm:text-6xl">
          Every release.
          <br />
          <span className="text-gold">Every claim, tested.</span>
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Providers publish the benchmark. We publish what happened when
          someone actually tried it.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={hrefFor(s.value, provider)}
            className={`font-display rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              status === s.value
                ? "bg-gold text-gold-fg"
                : "bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {s.label}
          </Link>
        ))}
        <span className="mx-1 h-6 w-px bg-hairline" />
        <Link
          href={hrefFor(status)}
          className={`font-display rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            !provider ? "bg-surface-raised text-ink" : "bg-surface text-ink-muted hover:text-ink"
          }`}
        >
          All providers
        </Link>
        {providers.map((p) => (
          <Link
            key={p}
            href={hrefFor(status, p)}
            className={`font-display rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              provider === p ? "bg-surface-raised text-ink" : "bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {p}
          </Link>
        ))}
      </div>

      {models.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">
          Nothing matches those filters yet.
        </p>
      ) : (
        Array.from(groups.entries()).map(([month, monthModels]) => (
          <section key={month} className="mt-10">
            <h2 className="font-display px-3 text-xs font-black tracking-[0.15em] text-ink-faint sm:px-4">
              {month}
            </h2>
            <div className="mt-2 border-t border-hairline">
              {monthModels.map((model) => (
                <div key={model.id} className="border-b border-hairline">
                  <ModelRow model={model} />
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
