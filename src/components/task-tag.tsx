import { TASK_LABELS } from "@/lib/format";

export function TaskTag({ category }: { category: string }) {
  return (
    <span className="font-display inline-block shrink-0 rounded-full bg-surface-raised px-3 py-1 text-xs font-bold text-ink-muted">
      {TASK_LABELS[category] ?? category}
    </span>
  );
}
