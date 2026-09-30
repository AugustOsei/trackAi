import Link from "next/link";
import { LogoDots } from "@/components/logo-dots";
import { FooterScene } from "@/components/footer/footer-scene";
import { getNewestReleases } from "@/lib/queries";

const COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/", label: "Harbour" },
      { href: "/timeline", label: "Release timeline" },
      { href: "/reports", label: "Builder tests" },
    ],
  },
  {
    title: "Contribute",
    links: [
      { href: "/submit", label: "Share a test" },
      { href: "/#subscribe", label: "Email alerts" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "About trackai" },
      { href: "/about#review", label: "How tests are reviewed" },
      { href: "/privacy", label: "Privacy" },
      { href: "https://www.theaugustdispatch.com", label: "The August Dispatch", external: true },
    ],
  },
];

/**
 * Site footer: what trackai is, where to go next, and who made it — then the
 * sea the page ends in, with a tug hauling the newest releases across it.
 *
 * The footer renders on every page, so the cargo lookup can never be allowed
 * to take a page down: if it fails, the barge sails with plain containers.
 */
export async function SiteFooter() {
  const cargo = await getNewestReleases(3).catch(() => []);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 pt-16 pb-6 sm:grid-cols-3 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="col-span-2 sm:col-span-3 md:col-span-1">
          <Link href="/" className="font-display text-2xl font-black tracking-tight text-ink">
            trackai
            <LogoDots />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
            Every AI model release, and how it actually performs — what the labs claim, next to what
            people built with it.
          </p>
          {cargo.length > 0 && (
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-ink-faint">
              Newest arrivals:{" "}
              {cargo.map((m, i) => (
                <span key={m.slug}>
                  {i > 0 && ", "}
                  <Link href={`/models/${m.slug}`} className="font-semibold text-ink-muted hover:text-ink">
                    {m.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-display text-sm font-black text-ink">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label} ↗
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <FooterScene cargo={cargo} />

      <div className="ft-credits">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {year} trackai · Part of{" "}
            <a href="https://www.theaugustdispatch.com" target="_blank" rel="noopener noreferrer">
              The August Dispatch
            </a>
          </p>
          <p>
            Built by{" "}
            <a href="https://www.augustengine.com/" target="_blank" rel="noopener noreferrer">
              August Engine
            </a>{" "}
            · Concept by{" "}
            <a href="https://www.linkedin.com/in/augustineosei/" target="_blank" rel="noopener noreferrer">
              Augustine Osei
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
