"use client";

import { useEffect, useState } from "react";

export type ModelOption = { id: number; name: string; provider: string };

const selectClass =
  "font-data w-full rounded-xl bg-surface px-4 py-3 text-ink outline-none ring-1 ring-transparent focus-visible:ring-gold";

/**
 * Pick one or more models for a report. Starts as a single dropdown; an
 * "add another model" link adds a row, up to `max`. Each row emits an
 * `<option>`-less hidden state through a real `<select name={name}>`, so the
 * surrounding form posts one `name` value per chosen model — the server reads
 * them with `formData.getAll(name)`.
 *
 * `initialIds` seeds the rows on mount only; remount (via a `key`) to reset.
 * `onChange` reports the current selection so a parent can carry it across a
 * remount.
 */
export function ModelMultiPicker({
  models,
  name = "modelId",
  initialIds = [],
  max = 5,
  onChange,
}: {
  models: ModelOption[];
  name?: string;
  initialIds?: number[];
  max?: number;
  onChange?: (ids: string[]) => void;
}) {
  const [rows, setRows] = useState<string[]>(
    initialIds.length ? initialIds.map(String) : [""],
  );

  useEffect(() => {
    onChange?.(rows.filter(Boolean));
    // onChange identity isn't stable across parent renders; the rows are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const chosen = new Set(rows.filter(Boolean));
  const update = (i: number, value: string) =>
    setRows((r) => r.map((x, j) => (j === i ? value : x)));
  const add = () => setRows((r) => (r.length < max ? [...r, ""] : r));
  const removeRow = (i: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : r));

  return (
    <div className="space-y-2">
      {rows.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            name={name}
            required
            value={value}
            onChange={(e) => update(i, e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              {i === 0 ? "Select a model" : "Select another model"}
            </option>
            {models.map((m) => (
              <option
                key={m.id}
                value={m.id}
                // Grey out models already picked in another row.
                disabled={chosen.has(String(m.id)) && String(m.id) !== value}
                className="bg-surface"
              >
                {m.name} — {m.provider}
              </option>
            ))}
          </select>
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Remove this model"
              className="font-display shrink-0 rounded-full bg-surface-raised px-3 py-2 text-sm font-bold text-ink-muted hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {rows.length < max && (
        <button
          type="button"
          onClick={add}
          className="font-display text-sm font-bold text-gold hover:underline"
        >
          + add another model
        </button>
      )}
    </div>
  );
}
