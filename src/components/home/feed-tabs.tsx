"use client";

import { useState, type ReactNode } from "react";
import { TASK_LABELS } from "@/lib/format";

/**
 * Category tabs over the builder-test feed, X-style. The posts themselves are
 * rendered on the server and handed in whole; this only decides which are
 * shown, so switching tabs is instant and never refetches.
 */
export function FeedTabs({ posts }: { posts: { id: number; task: string; node: ReactNode }[] }) {
  const [tab, setTab] = useState("all");
  const counts = new Map<string, number>();
  for (const p of posts) counts.set(p.task, (counts.get(p.task) ?? 0) + 1);
  const tabs = [
    { value: "all", label: "All tests" },
    ...Object.keys(TASK_LABELS)
      .filter((t) => counts.has(t))
      .map((t) => ({ value: t, label: TASK_LABELS[t] })),
  ];
  const visible = tab === "all" ? posts : posts.filter((p) => p.task === tab);

  return (
    <>
      <div role="tablist" aria-label="Filter tests by task" className="feed-tabs">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className="feed-tab"
          >
            {t.label}
          </button>
        ))}
      </div>
      <ol>
        {visible.map((p) => (
          <li key={p.id}>{p.node}</li>
        ))}
      </ol>
    </>
  );
}
