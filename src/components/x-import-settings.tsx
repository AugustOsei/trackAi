import { runXBookmarkImportNow, selectXBookmarkFolder } from "@/lib/actions";

type State = {
  connection: {
    username: string;
    folderId: string | null;
    folderName: string | null;
    connectedAt: Date;
    lastRunAt: Date | null;
    lastImportedCount: number | null;
    lastUnmatchedCount: number | null;
    lastError: string | null;
  } | null;
  folders: { id: string; name: string }[];
  configurationError: string | null;
};

function dateTime(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value)
    : "Not run yet";
}

export function XImportSettings({ state }: { state: State }) {
  return (
    <section className="mt-16 rounded-2xl border border-rule bg-paper-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-data text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">
            Automatic source
          </p>
          <h2 className="font-display mt-1 text-2xl font-black tracking-tight text-ink">
            X bookmark importer
          </h2>
          <p className="font-data mt-2 max-w-xl text-sm leading-6 text-ink-muted">
            Runs through n8n at 8:00 AM and 8:00 PM Mountain time. Confident model matches publish automatically;
            unmatched posts are held back and reported in the run summary.
          </p>
        </div>
        <a
          href="/admin/x/connect"
          className="font-display rounded-full border border-rule px-4 py-2 text-sm font-bold text-ink hover:border-ink"
        >
          {state.connection ? "Reconnect X" : "Connect X"}
        </a>
      </div>

      {state.connection && (
        <div className="mt-6 border-t border-rule pt-5">
          <p className="font-data text-sm text-ink">
            Connected as <strong>@{state.connection.username}</strong>
          </p>

          {state.folders.length > 0 && (
            <form action={selectXBookmarkFolder} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label className="font-data flex-1 text-xs font-bold uppercase tracking-wide text-ink-muted">
                Folder
                <select
                  name="folderId"
                  defaultValue={state.connection.folderId ?? ""}
                  className="mt-1 block w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm normal-case tracking-normal text-ink"
                  required
                >
                  <option value="" disabled>Select a bookmark folder</option>
                  {state.folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="font-display self-end rounded-lg bg-ink px-4 py-2 text-sm font-bold text-paper"
              >
                Save folder
              </button>
            </form>
          )}

          <div className="font-data mt-5 grid gap-2 text-sm text-ink-muted sm:grid-cols-3">
            <p><span className="block text-xs uppercase tracking-wide">Selected</span>{state.connection.folderName ?? "None"}</p>
            <p><span className="block text-xs uppercase tracking-wide">Last run</span>{dateTime(state.connection.lastRunAt)}</p>
            <p>
              <span className="block text-xs uppercase tracking-wide">Last result</span>
              {state.connection.lastRunAt
                ? `${state.connection.lastImportedCount ?? 0} published · ${state.connection.lastUnmatchedCount ?? 0} held`
                : "Waiting for first run"}
            </p>
          </div>

          {state.configurationError && (
            <p className="font-data mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {state.configurationError}
            </p>
          )}
          {state.connection.lastError && (
            <p className="font-data mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              Last run failed: {state.connection.lastError}
            </p>
          )}

          {state.connection.folderId && (
            <form action={runXBookmarkImportNow} className="mt-5">
              <button
                type="submit"
                className="font-display text-sm font-bold text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
              >
                Run import now
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
