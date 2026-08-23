# trackai build log

Running notes for the build-in-public post on The August Dispatch. Decisions,
dead ends, and things that surprised me, in the order they happened.

## 2026-08-23 — Kickoff & scaffold

- Confirmed the brief's open questions before writing code:
  - **Vercel Hobby**: still a 10s function timeout, 100GB bandwidth, 1M
    invocations/month, hard caps rather than billed overages. Workable
    because the architecture keeps Next.js as a thin DB-reader — the slow
    external calls (HN fetch, Claude summarization, Artificial Analysis
    polling) all happen in n8n, off Vercel entirely.
  - **Neon free tier**: 100 CU-hours/project/month (doubled from 50 in Oct
    2025), 0.5GB storage/project — plenty for this.
  - **Artificial Analysis API**: free tier is 100 requests/24h, `x-api-key`
    header. A once-daily sync uses ~1 request/day — nowhere near the cap.
  - **HN Algolia API**: still current, no auth,
    `hn.algolia.com/api/v1/search_by_date`.
  - **WordPress.com DNS**: depends on where the domain's nameservers
    actually point — WP.com dashboard only manages DNS if NS records point
    there. Still need to confirm which case applies before the deploy
    phase.

- **Surprise**: `create-next-app` installed **Next.js 16.3.2**, not 15 as
  planned. Next 16 ships an `AGENTS.md` file that explicitly warns "this is
  NOT the Next.js you know" and points at bundled docs in
  `node_modules/next/dist/docs/` — good instinct on their part, since 16 has
  real breaking changes from what I'd otherwise assume:
  - `middleware.ts` is deprecated in favor of `proxy.ts` (same behavior, new
    name, and it's nodejs-runtime-only now — no more edge runtime for it).
  - `params`, `searchParams`, `cookies()`, `headers()` are fully async now
    (no sync compat mode left).
  - Turbopack is the default bundler for both `next dev` and `next build`.
  - `next lint` is gone; ESLint runs directly (scaffold already wires this
    up as `"lint": "eslint"`).
  - `revalidateTag` now requires a cache-life profile as a second argument;
    there's a new `updateTag` for read-your-writes semantics in Server
    Actions, which is a good fit for the admin approve/reject flow later.
  - Used `proxy.ts` (not `middleware.ts`) for the admin password gate as a
    result.

- **Decision**: package name had to be `trackai`, not `tackAi` — npm
  rejects capital letters in package names. Scaffolded into a temp
  directory and moved the files in rather than fighting `create-next-app`'s
  directory-name inference.

- **Decision**: Drizzle ORM (not Prisma) with the Neon HTTP driver
  (`@neondatabase/serverless` + `drizzle-orm/neon-http`) — no binary engine
  to cold-start on a serverless function, first-class Neon support, schema
  lives as plain TypeScript.

- **Decision**: no auth library for the admin queue. A single shared
  password, hashed with `scrypt` (Node's built-in `node:crypto`, no bcrypt
  dependency needed), stored as `salt:hash` in `ADMIN_PASSWORD_HASH`. A
  signed, timestamped cookie (HMAC-SHA256, also `node:crypto`) gates
  `/admin/*` in `proxy.ts`. This works cleanly *because* `proxy.ts` dropped
  edge-runtime support in Next 16 — it always runs on Node now, so
  `node:crypto` just works without reaching for a Web-Crypto-compatible
  library.

- Data model: `models` + `reports` tables, matching the brief's rough shape.
  Added a **unique index on `reports.source_url`** that wasn't in the
  original brief — this gives the n8n ingestion workflow a natural
  `ON CONFLICT DO NOTHING` dedup key instead of needing a separate
  select-then-insert check.
