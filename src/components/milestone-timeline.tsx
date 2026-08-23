import { MilestoneEntry } from "@/components/milestone-entry";
import { providerStyle } from "@/lib/providers";
import { formatMonthYear } from "@/lib/format";
import type { Model } from "@/db/schema";

type ReportPreview = { id: number; taskCategory: string; takeaway: string };
type TimelineModel = Model & { reports: ReportPreview[] };

function modelDate(model: TimelineModel): Date | null {
  const raw = model.actualDate ?? model.predictedDate;
  return raw ? new Date(`${raw}T00:00:00Z`) : null;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
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
          const isNewMonth = i === 0 || monthKey(date) !== monthKey(dated[i - 1].date);

          return (
            <div key={model.id}>
              {isNewMonth && <MonthDivider date={date} />}
              {i === todayIndex && <TodayDivider />}

              <div className="grid grid-cols-[28px_1fr] items-center gap-x-4 sm:grid-cols-[1fr_28px_1fr] sm:gap-x-6">
                <div className="col-start-1 flex justify-center sm:col-start-2">
                  <span
                    className="z-10 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-bg"
                    style={{ backgroundColor: style.color }}
                  />
                </div>

                <div className={`col-start-2 ${onLeft ? "sm:col-start-1" : "sm:col-start-3"}`}>
                  <MilestoneEntry
                    model={model}
                    date={date}
                    onLeft={onLeft}
                    tiltDeg={onLeft ? -1.5 : 1.5}
                    index={i}
                  />
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

function MonthDivider({ date }: { date: Date }) {
  return (
    <div className="grid grid-cols-[28px_1fr] items-center gap-x-4 py-3 sm:grid-cols-[1fr_28px_1fr] sm:gap-x-6">
      <div className="hidden sm:col-start-1 sm:block" />
      <div className="col-start-1 flex justify-center sm:col-start-2">
        <span className="h-2 w-2 rounded-full bg-ink-faint" />
      </div>
      <div className="col-start-2 sm:col-start-3">
        <span className="font-display text-xs font-black tracking-[0.15em] text-ink-faint">
          {formatMonthYear(date)}
        </span>
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
