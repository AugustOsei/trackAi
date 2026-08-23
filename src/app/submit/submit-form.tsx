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

const fieldClass =
  "mt-2 w-full rounded-xl bg-surface px-4 py-3 text-ink outline-none placeholder:text-ink-faint ring-1 ring-transparent focus-visible:ring-gold";
const labelClass = "font-display text-xs font-bold uppercase tracking-wider text-ink-muted";

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
      <div className="mt-8 rounded-2xl bg-surface p-6">
        <p className="font-display text-xl font-bold text-ink">
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
      {/* Honeypot — hidden from people, tempting to naive bots. Not
          type="hidden", since bots skip those; visually removed instead. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="modelId" className={labelClass}>
          Model
        </label>
        <select
          id="modelId"
          name="modelId"
          required
          defaultValue={defaultModelId ?? ""}
          className={`font-data ${fieldClass}`}
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
        <label htmlFor="taskCategory" className={labelClass}>
          Task category
        </label>
        <select
          id="taskCategory"
          name="taskCategory"
          required
          defaultValue=""
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
          A post, thread, or write-up that backs this up — we link to it, we
          don’t reproduce it.
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
