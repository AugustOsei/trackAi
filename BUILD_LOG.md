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

- **Revised**: swapped the Neon HTTP driver (`@neondatabase/serverless`)
  for `postgres-js` (`drizzle-orm/postgres-js`). Neon's HTTP driver only
  talks to Neon's own edge proxy, so it's useless against a local Postgres
  — and since neither Vercel Hobby functions nor `proxy.ts` run on the edge
  runtime for this app (Next 16 dropped edge support for proxy entirely),
  there's no cold-start advantage to the HTTP driver here anyway. Standard
  TCP Postgres works identically against Neon in production and a local
  instance in development — one driver, no environment branching.
  Installed local Postgres 16 via Homebrew (no Docker on this machine) so
  every page in this build is checked against a real database, not mocks,
  without waiting on Neon account creation.

## 2026-08-23 — Design system & five pages

- Ran the design process properly (brainstorm → critique → build) instead
  of jumping to Tailwind defaults. The brief's dark data-console direction
  was already specific and good, so I kept it, but pushed one level further
  to avoid the "near-black + one neon accent" AI-tell the brief itself
  warned against: **deep navy** (not near-black) with a second charcoal
  surface tone for real layering, gold scoped to confidence states + one
  CTA rather than every interactive element, hairline rules with zero
  border-radius instead of shadows.

- **Signature element**: a torn-ticket perforation (dashed rule + two
  punched "eyelets") as the recurring divider between CLAIM and REALITY
  everywhere they meet — the timeline row, the model detail page, the
  report cards. It's not decoration; it's the brief's actual mechanism
  (claim vs. reality as two halves of one ticket) made visible.

- **Typography as provenance**: three faces, each with a rule, not just a
  look. **Big Shoulders** (display, headings) — a condensed face with a
  stamped-signage heritage that matches the ticket motif. **IBM Plex Sans**
  (body) — anything a human wrote (blurbs, takeaways, prose). **JetBrains
  Mono** (data) — anything sourced or verifiable (dates, indices, prices,
  status labels, source domains). The mono/sans split isn't just texture —
  it's a legend a reader can learn: mono means "check the source," sans
  means "someone's account."

- **Status confidence as fill-state, not color**: rather than a third
  traffic-light color for rumored/announced/released, the same gold dot
  fills progressively — hollow, half, solid. One accent color, three
  meanings, and it echoes the confirmed-vs-reviewed split that runs through
  the whole site.

- **Dead end**: `next/font/google` has no `Big_Shoulders_Display` export —
  Google merged Big Shoulders Display/Text into one variable family
  (`Big_Shoulders`, with an `opsz` axis) at some point after my training
  data. Two-minute fix once I checked the font's actual metadata in
  `node_modules`.

- **Dead end, more interesting**: screenshots taken via the browser tool
  *after* scrolling came back with a large blank gap and ghosted text,
  every time, regardless of whether the scroll was a simulated mouse wheel
  or `window.scrollTo()`. Spent a while suspecting my own CSS — first the
  SVG film-grain texture (`feTurbulence` on a fixed pseudo-element is
  genuinely expensive to repaint, so it was a reasonable first suspect;
  removed it anyway since it's a nice-to-have), then the `@view-transition`
  rule. Neither fixed it. Confirmed with `getBoundingClientRect()` in the
  console that the actual DOM layout was correct at every scroll position —
  it was the *screenshot capture* that was broken, not the page. Worked
  around it by resizing the viewport tall enough to capture full pages
  without scrolling. Filed away as a tool quirk, not a app bug.

- Verified end-to-end against the local Postgres instance: seeded data
  renders correctly on all five pages, the `/admin` proxy gate redirects
  correctly when logged out, login sets a valid session cookie, and
  approving a pending report in the queue immediately makes it live on
  `/reports` (confirms the `revalidatePath` calls in the server actions are
  wired correctly). Checked mobile width (375px) too — the nav overflowed
  off-screen on first pass since I hadn't planned for four links plus a
  wordmark at that width; fixed with `flex-wrap` rather than adding a
  hamburger menu, since four links wrapping to a second line is simpler
  and reads fine on a data-dense site like this.

- `npm run build` passes clean; data pages are correctly marked dynamic
  (`ƒ`), `/about` and `/admin/login` prerender as static (`○`).

## 2026-08-23 — Design pivot after seeing the actual reference

Showed the first pass to Augustine. Reaction: boring, reads as built for
techies only. Should have asked for a visual reference up front instead of
working from my own read of "dark data-console" — turns out the real
inspiration was [modelrumor.com](https://modelrumor.com), which I hadn't
seen. Went and looked at it properly before touching anything.

What's actually doing the work on that site: near-black background, but
every card carries a real brand-colored logo, so the page never reads as
monochrome; huge tight-tracked Geist headlines; chunky rounded pill buttons
and arrows; live engagement signals (view counts, "NEW" badges); and a
genuinely funny, human voice ("based entirely on stupid twitter rumors").
None of that is exotic — it's mostly confidence and color, not cleverness.

What I'd built leaned the opposite way: one restrained gold accent, hairline
rules, a printed-ticket motif, small mono type. Disciplined, but exactly the
"quiet, techy, unapproachable" thing Augustine was pushing back on. Rebuilt
the token system rather than patching it:

- **Near-black background**, not navy. I'd avoided true near-black because
  the frontend-design skill flags "near-black + one neon accent" as a
  generic AI-design tell — but modelrumor.com *is* near-black and doesn't
  read as generic, because the color comes from real content (the logos),
  not a single accent doing all the work. The lesson wasn't "avoid dark,"
  it was "don't make one accent color carry the whole page."
- **Provider color badges** — a colored monogram tile (real brand color,
  e.g. Anthropic's rust, OpenAI's teal, Google's blue) on every model row
  and report card. This is the direct substitute for modelrumor's product
  logos: I'm not reproducing anyone's trademarked logo, but every row now
  has a real, distinct color instead of relying on gold everywhere.
- **Onest** (heavy weight, tight tracking) replaced Big Shoulders for
  display type — bigger, punchier, closer to modelrumor's scale. Also
  dropped IBM Plex Sans and just use Onest at a lighter weight for body
  text too, so it's a two-face system (Onest + JetBrains Mono for data)
  instead of three — simpler, and the condensed "stamped ticket" face was
  part of what read as print-formal rather than approachable.
- **Rounded, chunky UI** — pill filter buttons and provider/task badges
  instead of terminal `[ bracket ]` toggles and square chips.
- **A "NEW" badge and a solid-pill report-count badge** instead of muted
  gray mono text, for the same live/current feeling as modelrumor's view
  counts.
- Kept monospace tabular numerals for benchmark data (dates, indices,
  prices) — that part wasn't the problem, and good data typography still
  matters for a tool with real numbers in it.
- Toned down the torn-ticket perforation motif rather than removing it —
  it's still the CLAIM/REALITY divider on the model detail page, where it
  actually carries meaning, but it's no longer repeated on every row, which
  was contributing to the dense/dry feeling.
- **Small bug caught in review**: my first pass at a "NEW" badge used the
  database row's `createdAt`, which meant every seeded model showed NEW
  simultaneously since they were all inserted today. Fixed to key off the
  model's actual/predicted release date instead — semantically correct
  either way, but it would have been a real bug once n8n starts inserting
  batches of historical models at once.

Re-verified all five pages plus the admin queue, desktop and mobile, after
the rebuild. `npm run build` clean, no lint/type errors.

## 2026-08-23 — Real logos and a horizontal calendar timeline

Second round of feedback on the same design pass: the provider badges still
read as "a letter in a colored square," and the vertical list-by-month
didn't feel like the "calendar/graph" Augustine had pictured — closer to
the modelrumor.com timeline mechanic (a horizontal ruler with cards
plotted along it) than a scrolling list. Two real changes, not polish:

**Real provider logos.** Installed `simple-icons` (MIT-licensed, the
standard open dataset used across the web for exactly this — nominative/
editorial identification of a brand, not an endorsement claim). It has
current marks for Anthropic, Google DeepMind, and Meta. It does **not**
have OpenAI or xAI, despite covering 3,400+ other brands — a real signal,
not an oversight, that those two are more protective of their marks. I
did not go find and embed those two logos from elsewhere (their own site,
a screenshot, etc.) — reproducing a trademark that a much larger,
long-running open-source project has chosen not to include is a worse
risk/reward trade than a well-designed monogram. So: real logos for three
providers, a refined initials badge (their real brand color, better
typography) for OpenAI and xAI. Flagged this gap to Augustine rather than
either quietly complying or quietly refusing.

**Horizontal calendar timeline**, replacing the vertical month-grouped
list entirely (`ModelRow` and the old month-grouping logic are gone —
dead code once nothing referenced them). Inspected modelrumor.com's actual
implementation directly (`getComputedStyle`, `getBoundingClientRect`) to
understand the mechanic rather than guessing from the screenshot: it's a
single very wide `<div>` (`.timeline-track`, tens of thousands of px)
moved with a CSS `transform`, with ~84px between daily tick marks and
labels every 7th tick.

Built an analogous but bounded version — trackai's dataset is a curated
handful of models, not modelrumor's hundreds, so an unbounded/virtualized
track isn't needed. Default window is 3 months back through Dec 31,
auto-expanded to include any model outside that window rather than
silently clipping data that falls outside the "expected" range. Native
`overflow-x: auto` instead of a transform-hijacked pan (simpler, and
native scroll already has momentum/touch support built in — no reason to
reinvent it). Cards alternate above/below a center axis line by
chronological index, each connected to its date by a short stem, which is
a standard trick for keeping adjacent-in-time cards from overlapping.

First pass at the scale (26px/day, matching what I measured on the
reference) put almost the entire page's content off-screen at once — only
one card fit in the viewport, because a "last 3 months to end of year"
window is ~7 months and the reference site's actual scale assumes an
unbounded, endlessly-scrollable pan, not a bounded overview. Compressed to
14px/day so 2–3 months are visible without scrolling, which is what
"calendar overview" actually implies.

Also added: full-height week gridlines (not just small ticks on the axis)
so empty stretches of the timeline still read as *a grid* rather than
blank space — directly answers "present like a grid," and matters more
than it sounds like for a dataset this small early on. And explicit
left/right arrow buttons, borrowed directly from modelrumor's own UI —
horizontal scroll on a page section is a real discoverability risk for
non-technical users who won't necessarily think to swipe sideways there
without a visible affordance telling them to.

**Debugging note**: verifying the arrow buttons hit a dead end that looked
like a real bug — clicking them via the browser tool's coordinate-based
and ref-based click did nothing, scroll position unchanged, no console
errors. Confirmed via `element.click()` in the JS console that the button
and its React handler work correctly (scroll position updated exactly as
expected). So the component is fine — this was a click-timing quirk in the
sandboxed browser tool itself, not app code, similar to the
screenshot-after-scroll artifact from the first design pass. Real
touch/mouse input in an actual browser isn't affected.

## 2026-08-23 — Third pass: a vertical milestone timeline, not horizontal

Third round on the same page. This time Augustine sent an actual reference
image instead of a URL — a stock "company milestones" infographic: a
single vertical spine down the center, alternating left/right content
blocks, a colored dot + connector per entry, year on the spine. Completely
different structure from what I'd built twice now (a horizontal
scroll/pan), and it's obviously the right call in hindsight: a vertical
alternating timeline is a genuinely well-established, instantly-legible
pattern (it's the standard "About Us / Our History" layout across
mainstream sites) precisely because it needs zero special interaction
knowledge — everything is visible on the page's normal vertical scroll.
The horizontal grid, even with visible arrows and gridlines, still asked
first-time visitors to discover a sideways-scrolling section, which is
exactly the kind of thing that reads as "clear" to someone who already
knows what they built and opaque to someone seeing it cold.

Rebuilt `MilestoneTimeline` from scratch replacing `TimelineGrid` entirely
(deleted `timeline-grid.tsx` and `timeline-math.ts` — no pixel-per-day
math needed anymore, just chronological sort order and a "does this date
come after now" check for where TODAY goes). Kept from the horizontal
version: real provider logos, the TODAY marker, "N reports" per model.
Changed the connector from a literal 3D triangle (too skeuomorphic for
this look) to a colored left/right border on each card matching its
provider's dot color — same "which entry belongs to which dot" job, flatter
execution.

One structural choice worth noting: colored each dot/card accent by
*provider brand color* rather than an arbitrary rainbow per entry like the
reference image. The reference's colors don't mean anything (milestone 1
is yellow because it's first, not because of what it represents) — ours do
(the dot is blue because that entry is from Google DeepMind), which is a
small thing but it's the same "structure should encode something true"
principle that's been a throughline all three passes.

Responsive approach: one component, not two. Mobile collapses to spine-on-
the-left with all cards on the right (a single `grid-cols-[28px_1fr] →
sm:grid-cols-[1fr_28px_1fr]` swap per row), rather than switching to some
separate mobile-only layout — same DOM, same data, just different column
placement at the breakpoint.

Verified desktop and mobile again. `npm run build` clean.

## 2026-08-23 — Month indicators, real motion, click-to-expand cards

Fourth round on the same page, same session. Three specific asks: no way
to tell what date range the timeline covers at a glance; the provider
badges were visually inert ("boring as an old woman" — fair); cards should
expand in place on click instead of only linking away.

**Date orientation.** Added a small divider row whenever the month changes
between consecutive entries (`MonthDivider`, reusing the same TODAY-divider
grid structure) — so scrolling down the page now reads MARCH 2026 → JUNE
2026 → AUGUST 2026 → TODAY → SEPTEMBER 2026 → NOVEMBER 2026 as a plain
sequence of labels, no guessing where you are.

**Motion, researched not guessed.** Went back to modelrumor.com and
actually inspected the icon tiles' `getComputedStyle` rather than assuming
what "small animated movement" meant. Their cards sit at a small resting
rotation (~-5°, via a transform matrix) and animate `left`/`top`/`width`/
`height` on a smooth cubic-bezier as they reposition — not a looping/pulsing
idle animation, interaction-driven motion. Adapted that to our layout
rather than copying the exact mechanic (their tilt is tied to a
single-focus carousel we deliberately moved away from last round): each
card now rests at a small alternating tilt (±1.5°, matching which side of
the spine it's on) that straightens to 0° when expanded, and the provider
badge itself gets a small scale-and-counter-rotate wobble on hover. Also
finally put the `.reveal-on-scroll` CSS (`animation-timeline: view()`,
written in the very first design pass and never actually used) to work —
cards now fade/rise in as they scroll into view, native CSS, no JS
animation library.

**Click-to-expand.** Cards are now buttons, not links — clicking toggles
an inline panel (provider blurb, up to 3 report previews with task tags,
"Read more →" to the full model page) using the CSS `grid-template-rows:
0fr → 1fr` technique for a smooth height animation without measuring
`scrollHeight` in JS. Needed a data change to support it: `getTimelineModels`
was only fetching report *counts* (`columns: { id: true }`) — bumped it to
also pull `taskCategory` and `takeaway` so the preview has something to
show. `MilestoneCard` split out into its own client component file since
it now owns real state; `MilestoneTimeline` stays a plain server component
around it.

**Real bug caught while verifying, not a tool artifact this time.**
Testing the expand toggle, `aria-expanded` on the clicked button correctly
flipped to `"true"` but nothing visibly changed. Traced it with
`getBoundingClientRect()` down the parent chain and found the clicked
button lived inside a `sm:hidden` wrapper — a leftover from how the
alternating-sides layout was built in round 3: each card was being
rendered *twice* (once for the desktop grid slot, once more wrapped in
`sm:hidden` as a mobile fallback), which was harmless when cards were
inert links but became a real bug the moment they got their own state,
since the two copies are fully independent component instances. Fixed by
rendering each model's card exactly once and giving it responsive
`grid-column`/alignment classes instead of duplicating the DOM — the kind
of thing that's obvious in hindsight but only showed up once the cards had
something to desync.

`npm run build` clean. Verified the expand interaction and the tilt on
both breakpoints after the fix.

## 2026-08-23 — Fifth pass: strip the card back, animate on load not click

Two more specific notes: the collapsed card was still showing too much
(provider text, benchmark line, report count) when modelrumor's actual
cards show just the icon and the model name; and the only motion that
existed — the hover wobble, the rotate-to-flat on expand — only ever
happened in response to an interaction, not automatically.

**Cut the collapsed card down to icon + name** (plus the small status dot
and NEW badge, since those are load-bearing signal, not decoration).
Everything else that was on the card before — provider, date, benchmark
snippet — moved into the expand panel, which already had the blurb and
report previews from last round. The collapsed state is now close to a
compact pill rather than an info card, closer to what was actually being
pointed at.

**Animation that plays on page load, verified, not assumed.** Split the
motion into two independently-timed CSS keyframe animations instead of
reusing the interaction-driven transitions from last round:
`timeline-card-enter` (fade + rise, on the card wrapper) and
`timeline-icon-pop` (a spring-overshoot scale+rotate, on the badge, delayed
~150ms after its card) — each with a per-index stagger
(`min(index * 70ms, 500ms)`) so cards arrive in a cascade down the page
rather than all at once. Deliberately plain `animation`, not
`animation-timeline: view()` this time — the scroll-linked version from
round 4 only plays once an element scrolls into view, which is exactly
the "click/scroll-gated" behavior being pushed back on; a normal
`animation` with a delay just plays when the element mounts, which for a
server-rendered page is effectively "on load."

Confirmed this actually fires without interaction using the Web Animations
API (`element.getAnimations()`) rather than trusting a screenshot: reloaded
and queried mid-flight, got `playState: "running"`, `currentTime: 0` on an
animation nobody had touched — real proof, not an assumption from how the
code reads.

Kept the two transform concerns on separate elements (entrance animation
on the outer wrapper, resting tilt + expand-to-flat on the inner card,
hover wobble on the icon) specifically to avoid the animation's held
end-state fighting the interaction-driven inline-style transform on the
same property — same class of bug as the duplicate-card issue from last
round, just avoided up front this time instead of hit and fixed.

`npm run build` clean. Verified both breakpoints; expand-to-reveal still
works with the trimmed-down collapsed state.
