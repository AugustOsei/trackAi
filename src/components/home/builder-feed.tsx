import Image from "next/image";
import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { TaskTag } from "@/components/task-tag";
import { formatRelative } from "@/lib/format";
import { sourceStyle } from "@/lib/sources";
import { getTweetMediaPreview, type TweetMediaPreview } from "@/lib/tweet-media";
import type { Model, Report } from "@/db/schema";
import { FeedTabs } from "./feed-tabs";

export type BuilderTest = Pick<
  Report,
  "id" | "takeaway" | "taskCategory" | "sourceUrl" | "sourceType" | "approvedAt" | "submittedAt"
> & {
  models: Pick<Model, "name" | "slug" | "provider">[];
  /** When the original post was made — see reportPostedAt. */
  postedAt: Date;
};

/** X's mark is near-white for the dark theme; on paper it needs to be ink. */
function markColour(colour: string) {
  return colour.toLowerCase() === "#f7f7f5" ? "var(--color-ink)" : colour;
}

function Post({ test, media, now }: { test: BuilderTest; media: TweetMediaPreview | null; now: number }) {
  const source = sourceStyle(test.sourceType, test.sourceUrl);
  const at = test.postedAt;

  return (
    <article className="feed-post">
      <header className="flex items-center gap-2 text-[13px] text-ink-muted">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-raised" aria-hidden="true">
          {source.logoPath ? (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" style={{ fill: markColour(source.color) }}>
              <path d={source.logoPath} />
            </svg>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: source.color }} />
          )}
        </span>
        <span className="font-semibold text-ink">{source.label}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={at.toISOString()} title={at.toUTCString()}>
          {formatRelative(at, now)}
        </time>
        <span className="ml-auto">
          <TaskTag category={test.taskCategory} />
        </span>
      </header>

      <h3 className="mt-2 text-[17px] leading-snug font-bold text-ink">
        <a href={test.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="hover:underline">
          {test.takeaway}
        </a>
      </h3>

      {media && (
        <a
          href={test.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="relative mt-3 block aspect-[16/9] max-h-[420px] overflow-hidden rounded-2xl border border-hairline bg-surface-raised"
        >
          <Image src={media.imageUrl} alt="" fill sizes="(max-width: 767px) 100vw, 620px" className="object-cover" />
          {media.isVideo && (
            <span className="absolute top-1/2 left-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white">
              ▶
            </span>
          )}
        </a>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        {test.models.map((m) => (
          <Link key={m.slug} href={`/models/${m.slug}`} className="feed-pill">
            <ProviderBadge provider={m.provider} size="sm" />
            {m.name}
          </Link>
        ))}
        <a href={test.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="feed-pill">
          Original post ↗
        </a>
      </footer>
    </article>
  );
}

/**
 * The main column: builder tests only, newest first, as a continuous feed —
 * rows divided by hairlines rather than a stack of separate cards. Opens
 * with an X-style "what did you find?" prompt that leads to /submit.
 */
export async function BuilderFeed({ tests, now }: { tests: BuilderTest[]; now: number }) {
  const media = await Promise.all(tests.map((t) => getTweetMediaPreview(t.sourceUrl)));

  return (
    <section aria-labelledby="feed-heading" className="feed-column">
      <h2 id="feed-heading" className="sr-only">
        Builder tests
      </h2>

      <Link href="/submit" className="feed-compose">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-raised text-lg" aria-hidden="true">
          ✎
        </span>
        <span className="flex-1 text-[15px] text-ink-faint">Tried a model on something real? Share what you found…</span>
        <span className="rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-gold-fg">Post</span>
      </Link>

      {tests.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-muted">No builder tests yet — be the first.</p>
      ) : (
        <FeedTabs
          posts={tests.map((test, i) => ({
            id: test.id,
            task: test.taskCategory,
            node: <Post test={test} media={media[i]} now={now} />,
          }))}
        />
      )}

      <Link href="/reports" className="block px-5 py-4 text-center text-sm font-semibold text-ink-muted hover:text-ink">
        See every builder test →
      </Link>
    </section>
  );
}
