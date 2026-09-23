import Image from "next/image";
import Link from "next/link";
import { ProviderBadge } from "@/components/provider-badge";
import { SourceTag } from "@/components/source-tag";
import { TaskTag } from "@/components/task-tag";
import { formatDate } from "@/lib/format";
import { providerStyle } from "@/lib/providers";
import { getTweetMediaPreview, type TweetMediaPreview } from "@/lib/tweet-media";
import type { Model, Report } from "@/db/schema";

type ModelRef = Pick<Model, "name" | "slug" | "provider">;
type FieldNote = Pick<
  Report,
  "id" | "takeaway" | "taskCategory" | "sourceUrl" | "sourceType" | "approvedAt" | "submittedAt"
> & { models: ModelRef[] };

function noteDate(note: FieldNote) {
  return formatDate(note.approvedAt ?? note.submittedAt).replace(/, \d{4}$/, "");
}

function ModelLinks({ models }: { models: ModelRef[] }) {
  return (
    <span>
      {models.map((model, index) => (
        <span key={model.slug}>
          {index > 0 && <span className="text-ink-faint"> · </span>}
          <Link href={`/models/${model.slug}`} className="font-bold text-ink hover:text-gold">
            {model.name}
          </Link>
        </span>
      ))}
    </span>
  );
}

function ActivityArtwork({ note, media }: { note: FieldNote; media: TweetMediaPreview | null }) {
  const model = note.models[0];
  if (!model || !media) return null;

  return (
    <a
      href={note.sourceUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`Open the original ${model.name} test`}
      className="group/art relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-bg sm:h-24 sm:w-28"
    >
      <Image
        src={media.imageUrl}
        alt=""
        fill
        sizes="(max-width: 639px) 80px, 112px"
        className="object-cover transition duration-300 group-hover/art:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      {media.isVideo && (
        <span className="absolute top-1/2 left-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-[10px] text-white backdrop-blur-sm">
          ▶
        </span>
      )}
      <span className="absolute right-2 bottom-2 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-[10px] text-white transition-transform group-hover/art:scale-110">
        ↗
      </span>
    </a>
  );
}

export async function FieldNotesFeed({ notes }: { notes: FieldNote[] }) {
  if (notes.length === 0) return null;
  const media = await Promise.all(notes.map((note) => getTweetMediaPreview(note.sourceUrl)));

  return (
    <section
      aria-labelledby="field-notes-heading"
      className="mt-12 border-t border-hairline pt-8 sm:mt-16 sm:pt-10"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-data text-sm text-ink-faint" aria-hidden="true">↕</span>
          <div>
            <p className="font-data text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase">
              Live from the field
            </p>
            <h2 id="field-notes-heading" className="sr-only">Recent AI model tests</h2>
          </div>
          <span className="text-xs text-ink-faint" aria-hidden="true">⌄</span>
        </div>
        <Link href="/reports" className="font-data text-[11px] text-ink-muted hover:text-gold">
          VIEW ALL →
        </Link>
      </div>

      <div className="space-y-3">
        {notes.map((note, index) => {
          const model = note.models[0];
          const color = providerStyle(model?.provider ?? "").color;

          return (
            <article
              key={note.id}
              className="reveal-on-scroll group relative overflow-hidden rounded-2xl border border-hairline bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:bg-surface-raised sm:p-5"
              style={{ animationDelay: `${Math.min(index * 45, 180)}ms` }}
            >
              <span
                className="absolute inset-y-0 left-0 w-0.5 opacity-70"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />

              <div className="flex gap-4 sm:gap-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {model && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-bg/55 py-1 pr-2.5 pl-1">
                        <ProviderBadge provider={model.provider} size="sm" />
                        <span className="font-display text-xs font-bold text-ink">{model.provider}</span>
                      </span>
                    )}
                    <TaskTag category={note.taskCategory} />
                  </div>

                  <h3 className="font-display mt-3 text-xl leading-tight font-black tracking-tight text-ink transition-colors group-hover:text-gold sm:text-2xl">
                    <a href={note.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                      {note.takeaway}
                    </a>
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
                    Tested on <ModelLinks models={note.models} />. Open the original post to see the prompt, output, and builder’s full context.
                  </p>

                  <div className="font-data mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-faint">
                    <SourceTag sourceType={note.sourceType} sourceUrl={note.sourceUrl} />
                    <span data-numeric>{noteDate(note)}</span>
                    {model && (
                      <Link href={`/models/${model.slug}`} className="ml-auto text-ink-muted hover:text-ink">
                        MODEL PAGE →
                      </Link>
                    )}
                  </div>
                </div>

                <ActivityArtwork note={note} media={media[index]} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
