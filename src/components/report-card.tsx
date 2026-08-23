import Link from "next/link";
import { Perforation } from "@/components/perforation";
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
    <article className="reveal-on-scroll border border-hairline bg-surface">
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          {showModel && model && (
            <Link
              href={`/models/${model.slug}`}
              className="font-display block text-lg font-semibold leading-tight text-ink hover:text-gold"
            >
              {model.name}
              <span className="font-data ml-2 text-xs font-normal text-ink-muted">
                {model.provider}
              </span>
            </Link>
          )}
          <p className="mt-2 text-[15px] leading-relaxed text-ink">
            {report.takeaway}
          </p>
        </div>
        <TaskTag category={report.taskCategory} />
      </div>

      <Perforation className="px-4 sm:px-5" />

      <div className="font-data flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-ink-muted sm:px-5">
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
