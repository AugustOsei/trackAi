"use client";

import { useState } from "react";
import { AdminModelRow } from "@/components/admin-model-row";

type ModelRowData = {
  id: number;
  name: string;
  provider: string;
  status: string;
  reportCount: number;
};

export function AdminModelList({ models }: { models: ModelRowData[] }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(needle) ||
          m.provider.toLowerCase().includes(needle),
      )
    : models;

  return (
    <div className="mt-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter models…"
        className="font-data w-full rounded-xl bg-surface px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-transparent focus-visible:ring-gold placeholder:text-ink-faint"
      />
      <div className="mt-3 max-h-[32rem] space-y-1.5 overflow-y-auto pr-1">
        {shown.map((m) => (
          <AdminModelRow key={m.id} model={m} />
        ))}
        {shown.length === 0 && (
          <p className="font-data text-sm text-ink-faint">No models match.</p>
        )}
      </div>
    </div>
  );
}
