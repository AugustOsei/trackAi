import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { TaskTag } from "@/components/task-tag";
import { SourceTag } from "@/components/source-tag";
import { TweetEmbed } from "@/components/tweet-embed";
import { formatDate } from "@/lib/format";
import { tweetIdFromUrl } from "@/lib/sources";
import type { Model, Report } from "@/db/schema";

type ModelRef = Pick<Model, "name" | "slug" | "provider">;

export function ReportCard({
  report,
  models,
  showModel = true,
  alsoTestedOn,
}: {
  report: Pick<Report, "takeaway" | "taskCategory" | "sourceUrl" | "sourceType" | "approvedAt" | "submittedAt">;
  /** The models this report is about — shown as linked names when `showModel`. */
  models?: ModelRef[];
  showModel?: boolean;
  /** On a single model's page: the other models this same test run covered. */
  alsoTestedOn?: Pick<Model, "name" | "slug">[];
}) {
  const tweetId = tweetIdFromUrl(report.sourceUrl);
  const list = models ?? [];

  return (
    <article className="reveal-on-scroll rounded-2xl bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {showModel && list[0] && <ProviderBadge provider={list[0].provider} size="md" />}
        <div className="min-w-0 flex-1">
          {showModel && list.length > 0 && (
            <p className="font-display text-lg font-bold leading-tight text-ink">
              {list.map((m, i) => (
                <span key={m.slug}>
                  {i > 0 && <span className="text-ink-faint"> · </span>}
                  <Link href={`/models/${m.slug}`} className="hover:text-gold">
                    {m.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <p className="mt-1 text-[15px] leading-relaxed text-ink">
            {report.takeaway}
          </p>
          {alsoTestedOn && alsoTestedOn.length > 0 && (
            <p className="font-data mt-2 text-xs text-ink-faint">
              also tested on{" "}
              {alsoTestedOn.map((m, i) => (
                <span key={m.slug}>
                  {i > 0 && ", "}
                  <Link href={`/models/${m.slug}`} className="text-ink-muted hover:text-ink">
                    {m.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
        <TaskTag category={report.taskCategory} />
      </div>

      {tweetId && <TweetEmbed tweetId={tweetId} url={report.sourceUrl} />}

      <div className="font-data mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3 text-xs text-ink-muted">
        <SourceTag sourceType={report.sourceType} sourceUrl={report.sourceUrl} />
        <span data-numeric>
          {report.approvedAt ? formatDate(report.approvedAt) : formatDate(report.submittedAt)}
        </span>
      </div>
    </article>
  );
}
