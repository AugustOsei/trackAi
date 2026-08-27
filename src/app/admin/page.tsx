import {
  getPendingReports,
  getRecentApprovedReports,
  getModelOptionsForSubmit,
} from "@/lib/queries";
import { approveReport, rejectReport, logout } from "@/lib/actions";
import { ReviewQueue } from "@/components/review-queue";
import { ReportModelsForm } from "@/components/report-models-form";
import { TaskTag } from "@/components/task-tag";
import { ProviderBadge } from "@/components/provider-badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage() {
  const [pending, approved, modelOptions] = await Promise.all([
    getPendingReports(),
    getRecentApprovedReports(),
    getModelOptionsForSubmit(),
  ]);

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

      <ReviewQueue
        pending={pending}
        approve={(id) => approveReport.bind(null, id)}
        reject={(id) => rejectReport.bind(null, id)}
        modelOptions={modelOptions}
      />

      {approved.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-black tracking-tight text-ink">
            Published reports
          </h2>
          <p className="font-data mt-1 text-sm text-ink-muted">
            Newest first. Use the model picker to move one that was filed
            against the wrong model.
          </p>

          <div className="mt-6 space-y-4">
            {approved.map((report) => (
              <div key={report.id} className="rounded-2xl bg-surface p-5">
                <div className="flex items-start gap-3">
                  {report.models[0] && (
                    <ProviderBadge provider={report.models[0].provider} size="md" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold text-ink">
                      {report.models.map((m) => m.name).join(" · ")}
                    </p>
                    <p className="mt-1 text-[15px] text-ink">{report.takeaway}</p>
                  </div>
                  <TaskTag category={report.taskCategory} />
                </div>

                <div className="font-data mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                  <a
                    href={report.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="hover:text-ink"
                  >
                    source ↗
                  </a>
                  {report.approvedAt && <span>approved {formatDate(report.approvedAt)}</span>}
                </div>

                <div className="mt-3 border-t border-hairline pt-3">
                  <ReportModelsForm
                    reportId={report.id}
                    currentModelIds={report.models.map((m) => m.id)}
                    models={modelOptions}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
