import Link from "next/link";
import { LogoDots } from "@/components/logo-dots";

const LINKS = [
  { href: "/", label: "Timeline" },
  { href: "/reports", label: "Reports" },
  { href: "/submit", label: "Submit" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-2xl font-black tracking-tight text-ink"
        >
          trackai
          <LogoDots />
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display rounded-full px-3.5 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
