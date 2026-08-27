"use client";

import { useActionState, useState } from "react";
import {
  editReport,
  unpublishReport,
  deleteReport,
  type EditReportState,
} from "@/lib/actions";
import { ReportModelsForm } from "@/components/report-models-form";
import { TaskTag } from "@/components/task-tag";
import { ProviderBadge } from "@/components/provider-badge";
import { formatDate } from "@/lib/format";
import type { ModelOption } from "@/components/model-multi-picker";

const TASK_CATEGORIES = [
  { value: "coding", label: "Coding" },
  { value: "agentic", label: "Agentic" },
  { value: "vision", label: "Vision" },
  { value: "writing", label: "Writing" },
  { value: "other", label: "Other" },
];

type ReportRow = {
  id: number;
  takeaway: string;
  taskCategory: string;
  sourceUrl: string;
  approvedAt: Date | string | null;
  models: { id: number; name: string; slug: string; provider: string }[];
};

const smallBtn =
  "font-display rounded-full bg-surface-raised px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink";
const smallField =
  "font-data rounded-lg bg-surface-raised px-2.5 py-1.5 text-xs text-ink outline-none ring-1 ring-transparent focus-visible:ring-gold";

/**
 * One published report on /admin, with the controls to change which models
 * it's about, edit it in place, send it back to the review queue, or delete
 * it outright.
 */
export function PublishedReport({
  report,
  modelOptions,
}: {
  report: ReportRow;
  modelOptions: ModelOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editState, editAction, editPending] = useActionState<EditReportState, FormData>(
    editReport,
    {},
  );

  return (
    <div className="rounded-2xl bg-surface p-5">
      <div className="flex items-start gap-3">
        {report.models[0] && <ProviderBadge provider={report.models[0].provider} size="md" />}
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-ink">
            {report.models.map((m) => m.name).join(" · ")}
          </p>
          {!editing && <p className="mt-1 text-[15px] text-ink">{report.takeaway}</p>}
        </div>
        {!editing && <TaskTag category={report.taskCategory} />}
      </div>

      {editing ? (
        <form action={editAction} className="mt-3 space-y-2">
          <input type="hidden" name="reportId" value={report.id} />
          <textarea
            name="takeaway"
            required
            minLength={10}
            maxLength={400}
            defaultValue={report.takeaway}
            rows={3}
            className="w-full rounded-xl bg-surface-raised px-3 py-2 text-[15px] text-ink outline-none ring-1 ring-transparent focus-visible:ring-gold"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select name="taskCategory" defaultValue={report.taskCategory} className={smallField}>
              {TASK_CATEGORIES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="url"
              name="sourceUrl"
              required
              defaultValue={report.sourceUrl}
              className={`min-w-[12rem] flex-1 ${smallField}`}
            />
          </div>
          {editState.error && (
            <p className="font-display text-xs font-semibold text-gold">{editState.error}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={editPending}
              className="font-display rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-gold-fg hover:opacity-90 disabled:opacity-50"
            >
              {editPending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={smallBtn}>
              {editState.ok ? "Close" : "Cancel"}
            </button>
            {editState.ok && !editPending && (
              <span className="font-data text-xs text-ink-muted">Saved.</span>
            )}
          </div>
        </form>
      ) : (
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
      )}

      <div className="mt-3 border-t border-hairline pt-3">
        <ReportModelsForm
          reportId={report.id}
          currentModelIds={report.models.map((m) => m.id)}
          models={modelOptions}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className={smallBtn}>
            Edit
          </button>
        )}
        <form action={unpublishReport}>
          <input type="hidden" name="reportId" value={report.id} />
          <button type="submit" className={smallBtn}>
            Send to queue
          </button>
        </form>
        {confirmingDelete ? (
          <form action={deleteReport} className="flex items-center gap-2">
            <input type="hidden" name="reportId" value={report.id} />
            <span className="font-data text-xs text-ink-muted">Delete for good?</span>
            <button
              type="submit"
              className="font-display rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-gold-fg hover:opacity-90"
            >
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)} className={smallBtn}>
              Keep
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="font-display rounded-full px-3 py-1.5 text-xs font-bold text-ink-faint hover:text-gold"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
