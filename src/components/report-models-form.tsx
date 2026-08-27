import { setReportModels } from "@/lib/actions";
import { ModelMultiPicker, type ModelOption } from "@/components/model-multi-picker";
import { MAX_MODELS_PER_REPORT } from "@/db/schema";

/**
 * The /admin control for setting which models a report is about — fix a
 * wrong assignment, or add the other models a bake-off covered. Posts the
 * full list to `setReportModels`, which replaces what's there.
 */
export function ReportModelsForm({
  reportId,
  currentModelIds,
  models,
}: {
  reportId: number;
  currentModelIds: number[];
  models: ModelOption[];
}) {
  return (
    <form action={setReportModels} className="space-y-2">
      <input type="hidden" name="reportId" value={reportId} />
      <ModelMultiPicker
        // Remount when the assignment actually changes, so the rows reflect
        // the new set after a save.
        key={currentModelIds.join("-")}
        models={models}
        initialIds={currentModelIds}
        max={MAX_MODELS_PER_REPORT}
      />
      <button
        type="submit"
        className="font-display rounded-full bg-surface-raised px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink"
      >
        Save models
      </button>
    </form>
  );
}
