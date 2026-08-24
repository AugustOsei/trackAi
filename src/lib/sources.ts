import type { Report } from "@/db/schema";

/**
 * Source identity for the REALITY layer.
 *
 * The point of showing this at all: a reader weighs "someone on the Cursor
 * forum hit this while pair-programming" differently from "someone said this
 * in a YouTube comment", and every other tracker throws that distinction away.
 * Making provenance visible is the column's whole argument.
 *
 * Marks are Simple Icons (MIT), same source as the provider badges. Discourse
 * instances share one mark because the enum stores the *kind* of place; the
 * specific forum is derived from the URL below.
 */
export type SourceStyle = {
  label: string;
  color: string;
  logoPath?: string;
};

const MARKS = {
  hn: {"hex": "#F0652F", "path": "M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896h-1.88z"},
  reddit: {"hex": "#FF4500", "path": "M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z"},
  youtube: {"hex": "#FF0000", "path": "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"},
  discourse: {"hex": "#000000", "path": "M12.103 0C18.666 0 24 5.485 24 11.997c0 6.51-5.33 11.99-11.9 11.99L0 24V11.79C0 5.28 5.532 0 12.103 0zm.116 4.563c-2.593-.003-4.996 1.352-6.337 3.57-1.33 2.208-1.387 4.957-.148 7.22L4.4 19.61l4.794-1.074c2.745 1.225 5.965.676 8.136-1.39 2.17-2.054 2.86-5.228 1.737-7.997-1.135-2.778-3.84-4.59-6.84-4.585h-.008z"},
} as const;

/**
 * Discourse hosts worth naming. An unlisted forum still renders — it falls
 * back to its hostname — so adding a source to the workflows never requires
 * touching this file first.
 */
const FORUM_NAMES: Record<string, string> = {
  "forum.cursor.com": "Cursor forum",
  "community.openai.com": "OpenAI forum",
  "discuss.huggingface.co": "Hugging Face",
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function sourceStyle(
  sourceType: Report["sourceType"],
  sourceUrl: string,
): SourceStyle {
  switch (sourceType) {
    case "hn":
      return { label: "Hacker News", color: MARKS.hn.hex, logoPath: MARKS.hn.path };
    case "reddit": {
      // Keep the subreddit — "r/LocalLLaMA" carries more than "Reddit" does.
      const sub = sourceUrl.match(/reddit\.com\/(r\/[A-Za-z0-9_]+)/)?.[1];
      return {
        label: sub ?? "Reddit",
        color: MARKS.reddit.hex,
        logoPath: MARKS.reddit.path,
      };
    }
    case "youtube":
      return { label: "YouTube", color: MARKS.youtube.hex, logoPath: MARKS.youtube.path };
    case "forum": {
      const host = hostOf(sourceUrl);
      return {
        label: FORUM_NAMES[host] ?? host ?? "Forum",
        color: "#8B9DC3",
        logoPath: MARKS.discourse.path,
      };
    }
    case "manual":
    default:
      // Reader-submitted. Gold is the site's own accent — this one came from us.
      return { label: "Submitted", color: "#f5c518" };
  }
}

/** Filter chips on /reports, in the order they should appear. */
export const SOURCE_FILTERS: { value: Report["sourceType"]; label: string }[] = [
  { value: "hn", label: "Hacker News" },
  { value: "reddit", label: "Reddit" },
  { value: "youtube", label: "YouTube" },
  { value: "forum", label: "Forums" },
  { value: "manual", label: "Submitted" },
];
