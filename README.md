# trackai

An AI model release tracker that pairs each model's **claim** (what the lab
itself announced) against its **reality** (reports from people who actually
used it).

Deploys to `trackai.theaugustdispatch.com`.

## How the two layers differ

| | CLAIM | REALITY |
| --- | --- | --- |
| Source | The provider's own announcement | Hacker News, Reddit, YouTube, developer forums + public submissions |
| What it is | What the lab says about its own model, plus the figures it chose to publish, plus a link to the post | What someone found when they actually used it |
| Publishing | Automatic | **Never** auto-published; every report waits for review |

There is deliberately no independent-benchmark layer. trackai is not a
leaderboard — it sets what a lab claims against what users report, and a
third-party score is neither of those. The trade-off is that claimed figures
are **not comparable between labs**: each one quotes the benchmarks that
flatter it. The About page says so to readers.

The ingest endpoint for reports has no way to publish directly — it writes
`status: 'pending'` unconditionally. Approval happens either from the daily
digest email or in `/admin`.

## Stack

- **Next.js 16** (App Router, Turbopack) on Vercel
- **Neon** serverless Postgres via **Drizzle ORM** (`postgres-js` driver)
- **n8n** (self-hosted, Hetzner) for scheduled ingestion
- **Anthropic API** for reading provider announcements and summarising reports

## Local development

Requires Node 20.9+ and a local Postgres.

```bash
npm install
cp .env.local.example .env.local     # then fill in the values
createdb trackai_dev
npm run db:migrate                   # apply SQL migrations
npm run db:seed                      # load sample data
npm run dev
```

Generate the two secrets and the admin hash:

```bash
npm run hash-password "your-admin-password"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Reset and reseed sample data (destructive) |
| `npm run db:studio` | Drizzle Studio |
| `npm run hash-password` | Hash an admin password |

**Use `db:migrate`, not `db:push`.** `db:push` diffs the schema straight onto
the database with no migration history — fine while iterating locally, wrong
for production. Every schema change should be committed as SQL in `drizzle/`.

## API

Public pages are server-rendered. Three JSON endpoints exist:

### `GET /api/health`

Unauthenticated. Reports database reachability and any missing environment
variables **by name only** — never values. Returns 503 when unhealthy.

### `POST /api/ingest/models` — CLAIM layer

Bearer auth (`INGEST_API_TOKEN`). Upserts on `slug`, so the sync is
idempotent. `claimedBenchmarks` is a free-form list rather than fixed columns,
because every lab quotes a different set of tests. A human-written
`providerBlurb` or `announcementUrl` is preserved when the sync sends none.

```bash
curl -X POST "$BASE/api/ingest/models" \
  -H "Authorization: Bearer $INGEST_API_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"models":[{"name":"Example 1","slug":"example-1","provider":"OpenAI","status":"released","actualDate":"2026-08-01","providerBlurb":"What the provider says shipped.","announcementUrl":"https://openai.com/news/example","claimedBenchmarks":[{"label":"SWE-bench Verified","value":"74.9%"}],"summaryIsAutoDrafted":true}]}'
```

### `GET /api/ingest/models`

Bearer auth. Returns `{slug, name, provider, announcementUrl}` for every
tracked model — the Hacker News workflow uses it to know what to search for,
and the claim workflow uses `announcementUrl` to skip models already done.

### `POST /api/ingest/reports` — REALITY layer

Bearer auth. Reports are keyed by model **slug**, not id, so n8n never needs to
know database ids. Behaviour worth knowing:

- Everything lands as `pending`. There is no way to publish through this route.
- Duplicate `sourceUrl`s are skipped via a unique index, so re-scraping the
  same window is a no-op and the workflow needs no cursor state.
- An unknown slug is skipped and returned in `unknownSlugs` — one bad row
  doesn't fail the batch.

```bash
curl -X POST "$BASE/api/ingest/reports" \
  -H "Authorization: Bearer $INGEST_API_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"reports":[{"modelSlug":"claude-opus-5","taskCategory":"coding","takeaway":"Refactored a large module cleanly but invented a config flag that does not exist.","sourceUrl":"https://news.ycombinator.com/item?id=1"}]}'
```

## Abuse protection on the public form

`/submit` is open to anyone, so it has three layers:

1. **Zod validation** on every field.
2. **Honeypot** — a field hidden from people. Anything that fills it gets a
   success response with no write, so a bot gets no signal it was caught.
3. **Rate limit** — 5 submissions per IP per hour, tracked as a *salted hash*
   of the IP rather than the address itself. Enough to count repeats, not
   enough to identify anyone or be worth stealing.

## n8n workflows

Importable JSON lives in `n8n/`. Both read their config from the n8n instance's
environment (`TRACKAI_BASE_URL`, `TRACKAI_INGEST_TOKEN`, `ANTHROPIC_API_KEY`).

**`01-provider-claim-sync.json`** — daily. For each model with no recorded
announcement, Claude uses web search to find the provider's *own* post, then
records a summary, the figures that post quotes, and the link.

This layer **auto-publishes**, so the prompt is deliberately constrained: use
only the provider's own page (never a news article or aggregator), quote only
figures printed there, never convert or infer a number, and set `found: false`
rather than guess. Anything not confidently sourced is dropped instead of
published. The page then labels the text as auto-summarised and links the
source, so a reader can check any claim in one click.

Only models missing an announcement are processed — a launch claim doesn't
change after the fact, so re-reading every page nightly would just spend
tokens rewriting identical text.

### Where reality reports come from

Four collectors, staggered through the morning so they don't collide, each
tagged so a reader can see the provenance and filter by it. Breadth here is the
point: a tracker that only reads one forum inherits that forum's blind spots.

| Workflow | Source | Runs | Credential |
| --- | --- | --- | --- |
| `02-reality-check-ingest` | Hacker News | 07:00 | none |
| `04-forum-ingest` | Cursor forum, OpenAI community, Hugging Face | 07:15 | none |
| `05-reddit-ingest` | r/LocalLLaMA, r/ClaudeAI, r/OpenAI, r/singularity, r/ChatGPTCoding | 07:30 | Reddit app (Basic Auth) |
| `06-youtube-ingest` | Comments on model review videos | 07:45 | YouTube Data API key (Query Auth) |

**Forums use `/latest.json` and `/t/<id>.json`, never `/search.json`** — every
one of these Discourse instances disallows `/search` in `robots.txt`. Recent
topics are pulled, then model names are matched locally in the post bodies. A
post only becomes a candidate if it names a tracked model *itself*; inheriting
the model from the thread title would attribute every reply in a busy thread to
whatever the title happened to say.

**YouTube is comments only.** Transcripts are not in the official Data API and
scraping them breaks YouTube's terms, so what lands here is what commenters
report, not what the reviewer says. It is the noisiest source and the prompt
tells the classifier so. Quota: a search costs 100 units against a 10,000/day
free allowance and pulling 100 comments costs 1, so only models from the last 45
days are searched — searching all 38 tracked models daily would spend a third of
the budget re-finding videos nobody is still watching.

**Deliberately not used:** X/Twitter (API starts at $200/month), GitHub (tested —
`"opus" in:body` returns 340k results dominated by unrelated dependency bumps),
Stack Overflow (it answers "how do I fix this code", not "how did this model
perform").

### The shared classifier

All four collectors fetch `GET /api/ingest/classifier?source=<type>` at run time
rather than carrying their own copy of the prompt. Four hand-copies in a web UI
drift, and when they drift "reviewed report" quietly means something different
depending on which workflow found it — which would make the source tags on the
site compare unlike things. The prompt lives in `src/lib/classifier-prompt.ts`,
so changing it is a code change with a git history.

The `?source=` parameter tailors one paragraph — how much benefit of the doubt
that source has earned — while the bar for a usable report stays identical. A
vague Cursor forum post is not more usable than a specific YouTube comment.

**`02-reality-check-ingest.json`** — daily at 07:00. Tracked models → Hacker
News *comment* search (comments carry first-hand usage; story titles rarely do)
→ Claude → `POST /api/ingest/reports`. Notes:

- Capped at 25 candidates per run so one busy news cycle can't run up a bill.
- Only comments from the last 30 days and over 180 characters are considered.
- Summarisation uses a **forced strict tool call**, so the response is
  schema-valid JSON rather than prose that needs parsing.
- The prompt requires paraphrase and explicitly forbids reproducing the
  original comment's wording, and asks the model to mark anything that isn't a
  genuine first-hand account as `usable: false`.

Both workflows run on `claude-haiku-4-5`. These are small, tightly-constrained
extraction tasks run at volume, and the schema is enforced by a forced tool
call rather than by the model's judgement.

Both carry an explicit `America/Denver` timezone. Without it a schedule runs in
whatever timezone the n8n host happens to have, which is UTC by default — the
trigger still fires daily, just not at the hour it appears to say.

## Approving reports

Nothing in the REALITY layer reaches the site until a person approves it. There
are two ways in, and they authorise differently.

**The daily digest email** (`03-review-digest-email.json`, 08:00 — after the
07:00 ingest, so the morning's haul is already in the queue). n8n calls
`GET /api/moderation/digest`, which returns what is pending plus a freshly
signed review link, and mails it. One button opens the queue with no password.
If nothing is pending, no email is sent — an empty daily email is how you learn
to ignore the ones that matter.

**`/admin`**, behind the shared password, unchanged. It is the fallback for
when email breaks, and the two share one `ReviewQueue` component so they cannot
drift apart.

### Why the link is safe to email

- **Signed, not guessable.** HMAC-SHA256 over the expiry, using a key *derived*
  from `ADMIN_SESSION_SECRET` with a domain separator rather than the secret
  itself. Without that separation, a moderation token and a session cookie are
  both HMACs over a timestamp, and a leaked link could be replayed as a login.
- **Expires in 72 hours**, carried inside the signed payload — long enough that
  a Friday email still works on Monday, short enough that an old inbox is not a
  standing key.
- **Scoped to the queue.** It can approve or reject pending reports. It is not
  a login and grants nothing else.
- **Opening the link changes nothing.** The link is a GET that only renders;
  approving is a separate POST. This is the point that matters — mail clients
  and security scanners fetch links in emails before anyone clicks, so a GET
  that approved a report would let a scanner publish the whole queue on
  delivery.
- **Decisions do not replay.** The update is scoped to rows still `pending`, so
  re-clicking an old link is a no-op rather than a reversal.

The honest trade-off: anyone holding the link can moderate reports for 72
hours, so the mailbox is now part of the security boundary. The blast radius is
moderation only — no database access, no settings, nothing published that a
person did not click.

## Deployment

1. Create the Neon project; copy the **pooled** connection string.
2. Create the Vercel project from the repo.
3. Set `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`,
   `INGEST_API_TOKEN`, `PUBLIC_BASE_URL` in Vercel.
4. Run `npm run db:migrate` against the Neon URL.
5. Check `GET /api/health` returns `{"ok":true}`.
6. Add a `CNAME` for `trackai` pointing at Vercel, wherever
   `theaugustdispatch.com`'s nameservers actually resolve — WordPress.com only
   manages DNS if the nameservers point there.
7. Import the three workflows into n8n and attach the credentials.
