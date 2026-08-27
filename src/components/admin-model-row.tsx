"use client";

import { useState } from "react";
import { deleteModel } from "@/lib/actions";

type ModelRowData = {
  id: number;
  name: string;
  provider: string;
  status: string;
  reportCount: number;
};

/** One model on the /admin Models list, with a two-click delete. */
export function AdminModelRow({ model }: { model: ModelRowData }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-surface px-3 py-2">
      <div className="min-w-0 flex-1">
        <span className="font-display text-sm font-bold text-ink">{model.name}</span>
        <span className="font-data ml-2 text-xs text-ink-faint">{model.provider}</span>
      </div>
      <span className="font-data text-xs text-ink-muted">{model.status}</span>
      <span className="font-data text-xs text-ink-faint">
        {model.reportCount} {model.reportCount === 1 ? "report" : "reports"}
      </span>
      {confirming ? (
        <form action={deleteModel} className="flex items-center gap-2">
          <input type="hidden" name="modelId" value={model.id} />
          <span className="font-data text-xs text-ink-muted">
            {model.reportCount > 0
              ? `Delete — ${model.reportCount} report(s) lose this model?`
              : "Delete for good?"}
          </span>
          <button
            type="submit"
            className="font-display rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-fg hover:opacity-90"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="font-display rounded-full bg-surface-raised px-3 py-1 text-xs font-bold text-ink-muted hover:text-ink"
          >
            Keep
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="font-display rounded-full px-3 py-1 text-xs font-bold text-ink-faint hover:text-gold"
        >
          Delete
        </button>
      )}
    </div>
  );
}
