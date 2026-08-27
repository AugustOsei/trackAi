import {
  getPendingReports,
  getRecentApprovedReports,
  getModelOptionsForSubmit,
  getAllModelsForAdmin,
} from "@/lib/queries";
import { approveReport, rejectReport, logout } from "@/lib/actions";
import { ReviewQueue } from "@/components/review-queue";
import { PublishedReport } from "@/components/published-report";
import { AdminModelList } from "@/components/admin-model-list";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage() {
  const [pending, approved, modelOptions, allModels] = await Promise.all([
    getPendingReports(),
    getRecentApprovedReports(),
    getModelOptionsForSubmit(),
    getAllModelsForAdmin(),
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
            Newest first. Change the models, edit the text, send one back to
            the queue, or delete it.
          </p>

          <div className="mt-6 space-y-4">
            {approved.map((report) => (
              <PublishedReport key={report.id} report={report} modelOptions={modelOptions} />
            ))}
          </div>
        </section>
      )}

      {allModels.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-black tracking-tight text-ink">Models</h2>
          <p className="font-data mt-1 text-sm text-ink-muted">
            Every tracked model, newest first. Delete junk rumor rows here —
            a model&rsquo;s report links go with it.
          </p>
          <AdminModelList models={allModels} />
        </section>
      )}
    </div>
  );
}
