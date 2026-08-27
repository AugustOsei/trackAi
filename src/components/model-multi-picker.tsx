"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ModelOption = { id: number; name: string; provider: string };

const inputClass =
  "font-data w-full rounded-xl bg-surface px-4 py-3 text-ink outline-none ring-1 ring-transparent focus-visible:ring-gold placeholder:text-ink-faint";

/**
 * Pick one or more models for a report. Type to filter, click (or Enter) to
 * add; picked models sit above the box as removable chips. Each pick emits a
 * hidden `<input name={name}>`, so the surrounding form still posts one
 * `name` value per model and the server reads them with `formData.getAll(name)`.
 *
 * `initialIds` seeds the selection on mount only; remount (via a `key`) to
 * reset. `onChange` reports the current selection so a parent can carry it
 * across a remount.
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
  const byId = useMemo(() => new Map(models.map((m) => [String(m.id), m])), [models]);
  const [selected, setSelected] = useState<string[]>(() =>
    initialIds.map(String).filter((id) => byId.has(id)),
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onChange?.(selected);
    // onChange identity isn't stable across parent renders; the selection is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const atMax = selected.length >= max;
  const q = query.trim().toLowerCase();

  const matches = useMemo(() => {
    const chosen = new Set(selected);
    return models
      .filter((m) => !chosen.has(String(m.id)))
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q),
      )
      .sort(
        (a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name),
      )
      .slice(0, 80);
  }, [models, selected, q]);

  const add = (id: string) => {
    setSelected((s) => (s.includes(id) || s.length >= max ? s : [...s, id]));
    setQuery("");
    setHighlight(0);
  };
  const remove = (id: string) => setSelected((s) => s.filter((x) => x !== id));

  return (
    <div ref={rootRef} className="space-y-2">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const m = byId.get(id);
            return (
              <li
                key={id}
                className="font-data flex items-center gap-1.5 rounded-lg bg-surface-raised py-1.5 pl-2.5 pr-1.5 text-xs text-ink"
              >
                {m ? `${m.name} — ${m.provider}` : id}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove ${m?.name ?? id}`}
                  className="rounded px-1 text-ink-faint hover:text-ink"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      {!atMax && (
        <div className="relative">
          <input
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="model-picker-list"
            autoComplete="off"
            required={selected.length === 0}
            value={query}
            placeholder={selected.length === 0 ? "Search models…" : "Add another model…"}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setHighlight((h) => Math.min(h + 1, matches.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter" && matches[highlight]) {
                e.preventDefault();
                add(String(matches[highlight].id));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className={inputClass}
          />

          {open && matches.length > 0 && (
            <ul
              id="model-picker-list"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-hairline bg-surface-raised py-1 shadow-xl"
            >
              {matches.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => add(String(m.id))}
                    className={`font-data flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                      i === highlight ? "bg-gold text-gold-fg" : "text-ink hover:bg-surface"
                    }`}
                  >
                    <span className="truncate">{m.name}</span>
                    <span
                      className={`shrink-0 text-xs ${
                        i === highlight ? "text-gold-fg/80" : "text-ink-faint"
                      }`}
                    >
                      {m.provider}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {open && q && matches.length === 0 && (
            <div className="font-data absolute z-20 mt-1 w-full rounded-xl border border-hairline bg-surface-raised px-3 py-2 text-sm text-ink-faint">
              No models match “{query}”.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
