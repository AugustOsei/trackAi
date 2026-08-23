import { getPendingReports } from "@/lib/queries";
import { approveReport, rejectReport, logout } from "@/lib/actions";
import { ProviderBadge } from "@/components/provider-badge";
import { TaskTag } from "@/components/task-tag";
import { formatDate, sourceDomain } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage() {
  const pending = await getPendingReports();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-black tracking-tight text-ink">Review queue</h1>
          <p className="font-data mt-1 text-sm text-ink-muted">
            {pending.length} pending
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="font-display text-sm font-bold text-ink-muted hover:text-ink">
            Log out
          </button>
        </form>
      </div>

      {pending.length === 0 ? (
        <p className="font-data mt-10 text-sm text-ink-muted">Queue is empty.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {pending.map((report) => (
            <div key={report.id} className="rounded-2xl bg-surface p-5">
              <div className="flex items-start gap-3">
                <ProviderBadge provider={report.model.provider} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-ink">{report.model.name}</p>
                  <p className="mt-1 text-[15px] text-ink">{report.takeaway}</p>
                </div>
                <TaskTag category={report.taskCategory} />
              </div>

              <div className="font-data mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                <a
                  href={report.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:text-gold"
                >
                  {sourceDomain(report.sourceUrl)} ↗
                </a>
                <span>{report.sourceType}</span>
                <span>submitted {formatDate(report.submittedAt)}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <form action={approveReport.bind(null, report.id)}>
                  <button
                    type="submit"
                    className="font-display rounded-full bg-gold px-4 py-2 text-sm font-bold text-gold-fg hover:opacity-90"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectReport.bind(null, report.id)}>
                  <button
                    type="submit"
                    className="font-display rounded-full bg-surface-raised px-4 py-2 text-sm font-bold text-ink-muted hover:text-ink"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
