import { getPendingReports } from "@/lib/queries";
import { approveReport, rejectReport, logout } from "@/lib/actions";
import { TaskTag } from "@/components/task-tag";
import { formatDate, sourceDomain } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage() {
  const pending = await getPendingReports();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Review queue</h1>
          <p className="font-data mt-1 text-sm text-ink-muted">
            {pending.length} pending
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="font-data text-sm text-ink-muted hover:text-ink">
            log out
          </button>
        </form>
      </div>

      {pending.length === 0 ? (
        <p className="font-data mt-10 text-sm text-ink-muted">Queue is empty.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {pending.map((report) => (
            <div key={report.id} className="border border-hairline bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">
                    {report.model.name}
                    <span className="font-data ml-2 text-xs font-normal text-ink-muted">
                      {report.model.provider}
                    </span>
                  </p>
                  <p className="mt-2 text-[15px] text-ink">{report.takeaway}</p>
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

              <div className="mt-4 flex gap-3">
                <form action={approveReport.bind(null, report.id)}>
                  <button
                    type="submit"
                    className="font-data border border-gold px-4 py-1.5 text-sm text-gold hover:bg-gold hover:text-bg"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectReport.bind(null, report.id)}>
                  <button
                    type="submit"
                    className="font-data border border-hairline px-4 py-1.5 text-sm text-ink-muted hover:border-ink-muted hover:text-ink"
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
