import { TASK_LABELS } from "@/lib/format";

export function TaskTag({ category }: { category: string }) {
  return (
    <span className="font-data inline-block border border-hairline px-1.5 py-0.5 text-[11px] uppercase tracking-wider text-ink-muted">
      {TASK_LABELS[category] ?? category}
    </span>
  );
}
