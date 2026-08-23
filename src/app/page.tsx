import Link from "next/link";
import { getTimelineModels, getProviders } from "@/lib/queries";
import { formatMonthLabel } from "@/lib/format";
import { ModelRow } from "@/components/model-row";
import { Perforation } from "@/components/perforation";
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
        <h1 className="font-display text-4xl font-bold leading-[0.95] text-ink sm:text-5xl">
          Every release.
          <br />
          <span className="text-gold">Every claim, tested.</span>
        </h1>
        <p className="mt-4 text-ink-muted">
          A timeline of AI model releases, each paired against independently
          sourced reports of how the model actually performed.
        </p>
      </div>

      <div className="font-data mt-10 flex flex-wrap items-center gap-x-1 gap-y-2 border-y border-hairline py-3 text-sm">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={hrefFor(s.value, provider)}
            className={`px-2 py-1 ${
              status === s.value ? "bg-gold text-bg" : "text-ink-muted hover:text-ink"
            }`}
          >
            [ {s.label.toLowerCase()} ]
          </Link>
        ))}
        <span className="mx-2 text-hairline">·</span>
        <span className="text-ink-faint">provider:</span>
        <Link
          href={hrefFor(status)}
          className={`px-2 py-1 ${!provider ? "text-gold" : "text-ink-muted hover:text-ink"}`}
        >
          all
        </Link>
        {providers.map((p) => (
          <Link
            key={p}
            href={hrefFor(status, p)}
            className={`px-2 py-1 ${provider === p ? "text-gold" : "text-ink-muted hover:text-ink"}`}
          >
            {p}
          </Link>
        ))}
      </div>

      {models.length === 0 ? (
        <p className="font-data mt-10 text-sm text-ink-muted">
          Nothing matches those filters yet.
        </p>
      ) : (
        Array.from(groups.entries()).map(([month, monthModels]) => (
          <section key={month} className="mt-8">
            <h2 className="font-data text-xs font-semibold tracking-[0.15em] text-gold">
              {month}
            </h2>
            <Perforation className="mt-2" />
            <div className="divide-y divide-hairline">
              {monthModels.map((model) => (
                <ModelRow key={model.id} model={model} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
