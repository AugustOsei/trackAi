import { getPendingReports } from "@/lib/queries";
import { approveReport, rejectReport, logout } from "@/lib/actions";
import { ReviewQueue } from "@/components/review-queue";

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

      <ReviewQueue
        pending={pending}
        approve={(id) => approveReport.bind(null, id)}
        reject={(id) => rejectReport.bind(null, id)}
      />
    </div>
  );
}
