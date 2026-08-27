import { ProviderBadge } from "@/components/provider-badge";
import { TaskTag } from "@/components/task-tag";
import { SourceTag } from "@/components/source-tag";
import { TweetEmbed } from "@/components/tweet-embed";
import { ReportModelsForm } from "@/components/report-models-form";
import { formatDate } from "@/lib/format";
import { tweetIdFromUrl } from "@/lib/sources";
import type { getPendingReports } from "@/lib/queries";

type PendingReport = Awaited<ReturnType<typeof getPendingReports>>[number];
type ModelOption = { id: number; name: string; provider: string };

/**
 * The review queue itself, shared by the password-gated /admin page and the
 * token-gated /moderate page so the two can never drift apart. The caller
 * supplies the already-bound approve/reject actions, which is what differs
 * between them — the password route trusts the session cookie, the link route
 * re-verifies its token inside the action.
 */
export function ReviewQueue({
  pending,
  approve,
  reject,
  modelOptions,
}: {
  pending: PendingReport[];
  approve: (id: number) => () => Promise<void>;
  reject: (id: number) => () => Promise<void>;
  /** When set, each card gets a control to change which models the report is about. */
  modelOptions?: ModelOption[];
}) {
  if (pending.length === 0) {
    return <p className="font-data mt-10 text-sm text-ink-muted">Queue is empty.</p>;
  }

  return (
    <div className="mt-8 space-y-4">
      {pending.map((report) => {
        const tweetId = tweetIdFromUrl(report.sourceUrl);
        const primary = report.models[0];
        return (
        <div key={report.id} className="rounded-2xl bg-surface p-5">
          <div className="flex items-start gap-3">
            {primary && <ProviderBadge provider={primary.provider} size="md" />}
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-ink">
                {report.models.map((m) => m.name).join(" · ")}
              </p>
              <p className="mt-1 text-[15px] text-ink">{report.takeaway}</p>
            </div>
            <TaskTag category={report.taskCategory} />
          </div>

          {/* The real post, so a decision isn't made from the paraphrase
              alone — worth the most exactly here, before approving. */}
          {tweetId && <TweetEmbed tweetId={tweetId} url={report.sourceUrl} />}

          <div className="font-data mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <SourceTag sourceType={report.sourceType} sourceUrl={report.sourceUrl} />
            <span>submitted {formatDate(report.submittedAt)}</span>
          </div>

          <div className="mt-4 flex gap-2">
            <form action={approve(report.id)}>
              <button
                type="submit"
                className="font-display rounded-full bg-gold px-4 py-2 text-sm font-bold text-gold-fg hover:opacity-90"
              >
                Approve
              </button>
            </form>
            <form action={reject(report.id)}>
              <button
                type="submit"
                className="font-display rounded-full bg-surface-raised px-4 py-2 text-sm font-bold text-ink-muted hover:text-ink"
              >
                Reject
              </button>
            </form>
          </div>

          {modelOptions && (
            <div className="mt-3 border-t border-hairline pt-3">
              <ReportModelsForm
                reportId={report.id}
                currentModelIds={report.models.map((m) => m.id)}
                models={modelOptions}
              />
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
