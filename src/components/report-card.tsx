import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { TaskTag } from "@/components/task-tag";
import { formatDate, sourceDomain } from "@/lib/format";
import type { Model, Report } from "@/db/schema";

export function ReportCard({
  report,
  model,
  showModel = true,
}: {
  report: Report;
  model?: Pick<Model, "name" | "slug" | "provider">;
  showModel?: boolean;
}) {
  return (
    <article className="reveal-on-scroll rounded-2xl bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {showModel && model && <ProviderBadge provider={model.provider} size="md" />}
        <div className="min-w-0 flex-1">
          {showModel && model && (
            <Link
              href={`/models/${model.slug}`}
              className="font-display block text-lg font-bold leading-tight text-ink hover:text-gold"
            >
              {model.name}
            </Link>
          )}
          <p className="mt-1 text-[15px] leading-relaxed text-ink">
            {report.takeaway}
          </p>
        </div>
        <TaskTag category={report.taskCategory} />
      </div>

      <div className="font-data mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3 text-xs text-ink-muted">
        <a
          href={report.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="hover:text-gold"
        >
          source: {sourceDomain(report.sourceUrl)} ↗
        </a>
        <span data-numeric>
          {report.approvedAt ? formatDate(report.approvedAt) : formatDate(report.submittedAt)}
        </span>
      </div>
    </article>
  );
}
