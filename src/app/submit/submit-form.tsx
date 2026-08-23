"use client";

import { useActionState } from "react";
import { submitReport, type SubmitReportState } from "@/lib/actions";

const TASK_CATEGORIES = [
  { value: "coding", label: "Coding" },
  { value: "agentic", label: "Agentic" },
  { value: "vision", label: "Vision" },
  { value: "writing", label: "Writing" },
  { value: "other", label: "Other" },
];

const initialState: SubmitReportState = {};

export function SubmitForm({
  models,
  defaultModelId,
}: {
  models: { id: number; name: string; provider: string }[];
  defaultModelId?: number;
}) {
  const [state, formAction, pending] = useActionState(submitReport, initialState);

  if (state.success) {
    return (
      <div className="border border-hairline bg-surface p-6">
        <p className="font-display text-xl font-semibold text-ink">
          Report received.
        </p>
        <p className="mt-2 text-ink-muted">
          It’s in the review queue now — it’ll appear on the site once
          approved.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div>
        <label htmlFor="modelId" className="font-data text-xs uppercase tracking-wider text-ink-muted">
          Model
        </label>
        <select
          id="modelId"
          name="modelId"
          required
          defaultValue={defaultModelId ?? ""}
          className="font-data mt-2 w-full border border-hairline bg-transparent px-3 py-2 text-ink outline-none focus-visible:border-gold"
        >
          <option value="" disabled>
            Select a model
          </option>
          {models.map((m) => (
            <option key={m.id} value={m.id} className="bg-surface">
              {m.name} — {m.provider}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="taskCategory" className="font-data text-xs uppercase tracking-wider text-ink-muted">
          Task category
        </label>
        <select
          id="taskCategory"
          name="taskCategory"
          required
          defaultValue=""
          className="font-data mt-2 w-full border border-hairline bg-transparent px-3 py-2 text-ink outline-none focus-visible:border-gold"
        >
          <option value="" disabled>
            What kind of task was this?
          </option>
          {TASK_CATEGORIES.map((t) => (
            <option key={t.value} value={t.value} className="bg-surface">
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="takeaway" className="font-data text-xs uppercase tracking-wider text-ink-muted">
          What happened
        </label>
        <textarea
          id="takeaway"
          name="takeaway"
          required
          rows={4}
          maxLength={400}
          placeholder="One or two sentences on what you tried and how it went."
          className="mt-2 w-full border border-hairline bg-transparent px-3 py-2 text-ink outline-none placeholder:text-ink-faint focus-visible:border-gold"
        />
      </div>

      <div>
        <label htmlFor="sourceUrl" className="font-data text-xs uppercase tracking-wider text-ink-muted">
          Source link
        </label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          required
          placeholder="https://…"
          className="font-data mt-2 w-full border border-hairline bg-transparent px-3 py-2 text-ink outline-none placeholder:text-ink-faint focus-visible:border-gold"
        />
        <p className="mt-1 text-xs text-ink-faint">
          A post, thread, or write-up that backs this up — we link to it, we
          don’t reproduce it.
        </p>
      </div>

      {state.error && (
        <p className="font-data text-sm text-gold" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-display bg-gold px-6 py-3 text-lg font-bold tracking-wide text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "SUBMITTING…" : "SUBMIT REPORT"}
      </button>
    </form>
  );
}
