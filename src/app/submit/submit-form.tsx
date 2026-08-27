"use client";

import { useState } from "react";
import { useActionState } from "react";
import { submitReport, type SubmitReportState } from "@/lib/actions";
import { ModelMultiPicker, type ModelOption } from "@/components/model-multi-picker";

const TASK_CATEGORIES = [
  { value: "coding", label: "Coding" },
  { value: "agentic", label: "Agentic" },
  { value: "vision", label: "Vision" },
  { value: "writing", label: "Writing" },
  { value: "other", label: "Other" },
];

const initialState: SubmitReportState = {};

const fieldClass =
  "mt-2 w-full rounded-xl bg-surface px-4 py-3 text-ink outline-none placeholder:text-ink-faint ring-1 ring-transparent focus-visible:ring-gold";
const labelClass = "font-display text-xs font-bold uppercase tracking-wider text-ink-muted";

export function SubmitForm({
  models,
  defaultModelId,
}: {
  models: ModelOption[];
  defaultModelId?: number;
}) {
  // The model(s) and task carry over to the next report — submitting several
  // links for the same model, or the same bake-off, is the common case.
  // `formKey` remounts the inner form to clear the takeaway and source fields
  // and reset the action state after an "Add another".
  const [formKey, setFormKey] = useState(0);
  const [modelIds, setModelIds] = useState<string[]>(
    defaultModelId ? [String(defaultModelId)] : [],
  );
  const [taskCategory, setTaskCategory] = useState("");

  return (
    <ReportForm
      key={formKey}
      models={models}
      modelIds={modelIds}
      onModelIds={setModelIds}
      taskCategory={taskCategory}
      onTaskCategory={setTaskCategory}
      onAddAnother={() => setFormKey((k) => k + 1)}
    />
  );
}

function ReportForm({
  models,
  modelIds,
  onModelIds,
  taskCategory,
  onTaskCategory,
  onAddAnother,
}: {
  models: ModelOption[];
  modelIds: string[];
  onModelIds: (ids: string[]) => void;
  taskCategory: string;
  onTaskCategory: (value: string) => void;
  onAddAnother: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitReport, initialState);

  if (state.success) {
    return (
      <div className="mt-8 rounded-2xl bg-surface p-6">
        <p className="font-display text-xl font-bold text-ink">Report received.</p>
        <p className="mt-2 text-ink-muted">
          It’s in the review queue now — it’ll appear on the site once
          approved.
        </p>
        <button
          type="button"
          onClick={onAddAnother}
          className="font-display mt-5 rounded-full bg-gold px-5 py-2.5 text-sm font-black tracking-tight text-gold-fg transition-opacity hover:opacity-90"
        >
          Add another report
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {/* Honeypot — hidden from people, tempting to naive bots. Not
          type="hidden", since bots skip those; visually removed instead. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <span className={labelClass}>Model(s)</span>
        <p className="mt-1 text-xs text-ink-faint">
          Add more than one if the same prompt was run across several models.
        </p>
        <div className="mt-2">
          <ModelMultiPicker
            models={models}
            initialIds={modelIds.map(Number).filter((n) => n > 0)}
            onChange={onModelIds}
          />
        </div>
      </div>

      <div>
        <label htmlFor="taskCategory" className={labelClass}>
          Task category
        </label>
        <select
          id="taskCategory"
          name="taskCategory"
          required
          value={taskCategory}
          onChange={(e) => onTaskCategory(e.target.value)}
          className={`font-data ${fieldClass}`}
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
        <label htmlFor="takeaway" className={labelClass}>
          What happened
        </label>
        <textarea
          id="takeaway"
          name="takeaway"
          required
          rows={4}
          maxLength={400}
          placeholder="One or two sentences on what you tried and how it went."
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="sourceUrl" className={labelClass}>
          Source link
        </label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          required
          placeholder="https://…"
          className={`font-data ${fieldClass}`}
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          A post, thread, or write-up that backs this up. We link to it, and
          if it&rsquo;s a post on X, it shows up right on the page too.
        </p>
      </div>

      {state.error && (
        <p className="font-display text-sm font-semibold text-gold" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-display rounded-full bg-gold px-7 py-3.5 text-lg font-black tracking-tight text-gold-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
