"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets?: { load?: (el?: HTMLElement) => void };
    };
  }
}

const WIDGETS_SRC = "https://platform.twitter.com/widgets.js";

/**
 * The actual post, embedded via X's own public widget — not a screenshot,
 * not reproduced text, the real thing rendered by X's own script. This is
 * the one place on the site that shows a source's original wording, and
 * that's deliberate: it's X's embed, carrying X's own attribution and
 * styling, not trackai presenting someone's words as its own paraphrase.
 *
 * Renders a plain link first so there's always something usable if the
 * widget script is blocked or slow — the blockquote below is what X's
 * script looks for and replaces once it loads.
 */
export function TweetEmbed({ tweetId, url }: { tweetId: string; url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGETS_SRC}"]`);

    const load = () => window.twttr?.widgets?.load?.(ref.current ?? undefined);

    if (window.twttr?.widgets) {
      load();
      return;
    }
    if (existing) {
      existing.addEventListener("load", load, { once: true });
      return () => existing.removeEventListener("load", load);
    }

    const script = document.createElement("script");
    script.src = WIDGETS_SRC;
    script.async = true;
    script.addEventListener("load", load, { once: true });
    document.body.appendChild(script);
  }, [tweetId]);

  return (
    <div ref={ref} className="mt-3 max-w-full overflow-hidden rounded-xl">
      <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true">
        <a href={url} target="_blank" rel="noopener noreferrer">
          View post on X ↗
        </a>
      </blockquote>
    </div>
  );
}
