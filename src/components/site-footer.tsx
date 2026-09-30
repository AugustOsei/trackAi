export function SiteFooter() {
  return (
    <footer className="site-footer mt-auto border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-10 pb-8 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-data">
          trackai — claim vs. reality, tracked daily.
        </p>
        <p className="font-data">
          Claims link to the provider. Community reports are reviewed before publishing.
        </p>
      </div>
    </footer>
  );
}
