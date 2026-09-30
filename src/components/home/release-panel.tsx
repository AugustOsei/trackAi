import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { formatRelative } from "@/lib/format";
import type { Model } from "@/db/schema";

export type PanelModel = Pick<Model, "id" | "name" | "slug" | "provider" | "status" | "actualDate" | "predictedDate"> & {
  reportCount: number;
};

function Row({ model, meta, faded = false }: { model: PanelModel; meta: string; faded?: boolean }) {
  return (
    <li>
      <Link href={`/models/${model.slug}`} className="panel-row">
        <ProviderBadge provider={model.provider} size="sm" muted={faded} />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-bold ${faded ? "text-ink-muted" : "text-ink"}`}>{model.name}</span>
          <span className="block truncate text-xs text-ink-faint">{meta}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * Side panel of model releases, newest first — the Reddit "recent posts"
 * rail. Below it, what's expected next, so the panel answers both "what
 * just shipped" and "what's coming".
 */
export function ReleasePanel({ models, now }: { models: PanelModel[]; now: number }) {
  const released = models
    .filter((m) => m.status === "released" && m.actualDate)
    .sort((a, b) => b.actualDate!.localeCompare(a.actualDate!))
    .slice(0, 8);
  const upcoming = models
    .filter((m) => m.status !== "released")
    .sort((a, b) => (a.predictedDate ?? "9999").localeCompare(b.predictedDate ?? "9999"))
    .slice(0, 4);

  return (
    <aside className="side-panel" aria-labelledby="releases-heading">
      <h2 id="releases-heading" className="side-panel-title">
        New model releases
      </h2>
      <ol>
        {released.map((m) => (
          <Row
            key={m.id}
            model={m}
            meta={`${m.provider} · ${formatRelative(m.actualDate!, now)} · ${
              m.reportCount === 0 ? "no tests yet" : `${m.reportCount} ${m.reportCount === 1 ? "test" : "tests"}`
            }`}
          />
        ))}
      </ol>

      {upcoming.length > 0 && (
        <>
          <h3 className="side-panel-title mt-2 border-t border-hairline pt-4">On the horizon</h3>
          <ol>
            {upcoming.map((m) => (
              <Row
                key={m.id}
                model={m}
                faded
                meta={`${m.provider} · ${m.status === "rumored" ? "Rumoured" : "Announced"}${
                  m.predictedDate
                    ? ` · expected ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(Date.parse(`${m.predictedDate}T00:00:00Z`))}`
                    : ""
                }`}
              />
            ))}
          </ol>
        </>
      )}

      <Link href="/timeline" className="block px-4 pt-2 pb-4 text-sm font-semibold text-ink-muted hover:text-ink">
        Full release timeline →
      </Link>
    </aside>
  );
}
