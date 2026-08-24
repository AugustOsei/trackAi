import type { Metadata } from "next";

const SITE_NAME = "trackai";
const DEFAULT_DESCRIPTION =
  "An AI model release tracker that pairs every benchmark claim against independently sourced reality-check reports.";

/**
 * Composes a page's title/description into full Open Graph and Twitter Card
 * metadata.
 *
 * Next merges metadata shallowly per top-level key: a page that sets its own
 * `openGraph` object entirely replaces the root layout's rather than merging
 * into it, so `siteName`/`type`/`card` would silently vanish from any page
 * that set `openGraph.title` without repeating them. Centralized here so
 * that never has to be remembered per page.
 */
export function pageMetadata({
  title,
  description,
}: {
  title: string;
  description?: string | null;
}): Metadata {
  const fullTitle = `${title} · trackai`;
  const desc = description ?? DEFAULT_DESCRIPTION;

  return {
    title,
    description: desc,
    openGraph: {
      title: fullTitle,
      description: desc,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
  };
}
