import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { StatusDot } from "@/components/status-dot";
import { NewBadge } from "@/components/new-badge";
import { providerStyle } from "@/lib/providers";
import { formatDate, formatIndex, formatPrice, isRecent } from "@/lib/format";
import type { Model } from "@/db/schema";

type TimelineModel = Model & { reports: { id: number }[] };

function modelDate(model: TimelineModel): Date | null {
  const raw = model.actualDate ?? model.predictedDate;
  return raw ? new Date(`${raw}T00:00:00Z`) : null;
}

export function MilestoneTimeline({ models }: { models: TimelineModel[] }) {
  const dated = models
    .map((m) => ({ model: m, date: modelDate(m) }))
    .filter((x): x is { model: TimelineModel; date: Date } => x.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (dated.length === 0) {
    return <p className="mt-10 text-sm text-ink-muted">Nothing matches those filters yet.</p>;
  }

  const now = new Date();
  // index of the first future entry — TODAY renders just before it.
  // -1 means every entry is already in the past, so TODAY renders last.
  const todayIndex = dated.findIndex((d) => d.date.getTime() > now.getTime());

  return (
    <div className="relative mt-10">
      <div className="absolute top-0 bottom-0 left-3.5 w-px bg-hairline sm:left-1/2" />

      <div className="flex flex-col gap-2">
        {dated.map(({ model, date }, i) => {
          const style = providerStyle(model.provider);
          const onLeft = i % 2 === 0;
          const isNew = model.status === "released" && isRecent(date);

          return (
            <div key={model.id}>
              {i === todayIndex && <TodayDivider />}

              <div className="grid grid-cols-[28px_1fr] items-center gap-x-4 sm:grid-cols-[1fr_28px_1fr] sm:gap-x-6">
                <div className="hidden sm:col-start-1 sm:block">
                  {onLeft && <Card model={model} date={date} style={style} align="right" isNew={isNew} />}
                </div>

                <div className="col-start-1 flex justify-center sm:col-start-2">
                  <span
                    className="z-10 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-bg"
                    style={{ backgroundColor: style.color }}
                  />
                </div>

                <div className={`col-start-2 sm:col-start-3 ${onLeft ? "sm:hidden" : ""}`}>
                  <Card model={model} date={date} style={style} align="left" isNew={isNew} />
                </div>
              </div>
            </div>
          );
        })}

        {todayIndex === -1 && <TodayDivider />}
      </div>
    </div>
  );
}

function TodayDivider() {
  return (
    <div className="my-2 grid grid-cols-[28px_1fr] items-center gap-x-4 sm:grid-cols-[1fr_28px_1fr] sm:gap-x-6">
      <div className="hidden h-px bg-gold/40 sm:col-start-1 sm:block" />
      <div className="col-start-1 flex justify-center sm:col-start-2">
        <span className="font-display whitespace-nowrap rounded-full bg-gold px-2.5 py-1 text-[10px] font-black tracking-wider text-gold-fg">
          TODAY
        </span>
      </div>
      <div className="col-start-2 h-px bg-gold/40 sm:col-start-3" />
    </div>
  );
}

function Card({
  model,
  date,
  style,
  align,
  isNew,
}: {
  model: TimelineModel;
  date: Date;
  style: { color: string };
  align: "left" | "right";
  isNew: boolean;
}) {
  const reportCount = model.reports.length;

  return (
    <Link
      href={`/models/${model.slug}`}
      className={`group flex gap-3 rounded-2xl bg-surface p-3.5 transition-colors hover:bg-surface-raised sm:max-w-sm ${
        align === "right" ? "sm:ml-auto sm:flex-row-reverse sm:text-right" : ""
      }`}
      style={{
        borderInlineStart: align === "left" ? `3px solid ${style.color}` : undefined,
        borderInlineEnd: align === "right" ? `3px solid ${style.color}` : undefined,
      }}
    >
      <ProviderBadge provider={model.provider} size="md" />
      <div className="min-w-0 flex-1">
        <div className={`flex flex-wrap items-center gap-1.5 ${align === "right" ? "sm:justify-end" : ""}`}>
          <span className="font-display text-base font-extrabold leading-tight text-ink group-hover:text-gold">
            {model.name}
          </span>
          <StatusDot status={model.status} />
          {isNew && <NewBadge />}
        </div>
        <p className="font-data mt-0.5 text-xs text-ink-muted">
          {model.provider} · {model.status === "released" ? formatDate(date) : `expected ${formatDate(date)}`}
        </p>

        {model.status === "released" ? (
          <p className="font-data mt-1.5 text-xs text-ink-muted" data-numeric>
            <span className="text-ink">{formatIndex(model.intelligenceIndex)}</span> intelligence ·{" "}
            {formatPrice(model.pricePerMtok)}/Mtok
          </p>
        ) : (
          <p className="font-data mt-1.5 text-xs text-ink-faint">benchmarks pending</p>
        )}

        <p className="font-display mt-1.5 text-xs font-bold text-ink-muted">
          {reportCount} {reportCount === 1 ? "report" : "reports"}
        </p>
      </div>
    </Link>
  );
}
