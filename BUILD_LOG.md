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

## 2026-08-23 — Sixth pass: stop wrapping everything in a card

Direct, correct criticism: every version of this timeline, across five
rounds of changes, wrapped each entry in a `bg-surface rounded-2xl` box.
Colors, tilt, motion, expand — all real changes — but the underlying shape
never moved past "rectangle with padding," which is close to the single
most recognizable generic-component default there is. modelrumor.com's
actual entries have no wrapping box at all: just the logo tile (which has
its own shape and color as a *logo*, not a card) and a text label sitting
directly on the page background. I'd been polishing the box instead of
questioning whether it should exist.

Removed it. `MilestoneCard` renamed to `MilestoneEntry` (the file too —
not just the styling, the concept) and rebuilt with no background, no
border, no hover-fill: just the provider badge and model name floating on
the page, connected to the spine by position alone. The provider-color
accent that used to live on the card's border is gone too — it was
redundant anyway, since the spine dot and the icon itself already carry
that color; a third copy of the same signal was in service of the box, not
the information. Expanded content (blurb, report previews, read more) now
appears as plain text below the icon+name, no card forming around it
either — just spacing and type hierarchy doing the work.

Worth noting for later: `ReportCard`, the model-detail benchmark panel,
and the admin queue all use the same `bg-surface` card pattern this
critique applies to. Left them alone this round since the actual complaint
was about the timeline specifically, but the same question — does this
need a box, or does spacing and hierarchy already do the job — is worth
asking there too before calling the rest of the site done.

`npm run build` clean.

## 2026-08-23 — Seventh pass: close the gap, draw a trail

Removing the card in round six fixed the "why does everything need a
card" problem but exposed a second, real one: without a box holding icon
and label together, and without anything connecting them to the spine,
left-side entries just... floated, disconnected, far from the axis. Not a
style note, an actual layout bug — I'd stripped the card's `sm:ml-auto`
class along with its background/border when I removed the card styling,
conflating "remove the decoration" with "remove the positioning," and
never re-added the thing that was pinning content against the spine.

Fixed the gap (re-added the alignment, entries now sit snug against the
axis on both sides) and, per the actual request, added something better
than a static line: an animated trail. Each entry now gets a short colored
line (matching its provider's color, same one on the spine dot) that
draws itself from the dot to the icon on load — `scaleX(0→1)` with
`transform-origin` pinned to the dot side, so it visibly travels outward
rather than just fading in. Timed so the trail finishes right as the icon
pop animation starts, reading as "the line arrives, then the icon appears"
rather than two unrelated things happening near each other.

Rebuilt the row as a single 5-column grid (`content | connector | dot |
connector | content`, collapsing to `dot | connector | content` on mobile)
with the dot always in the fixed center column regardless of which side
has content — same single-instance-per-model, responsive-column-only
approach as the round-3 duplicate-card fix, applied up front this time.

**Caught before it went out**: initially used `items-center` on the row,
which is right for a collapsed entry but wrong once one expands — grid
centers items against the *tallest* item in the row, so an expanded
entry's dot and connector line drifted down to the vertical middle of the
whole expanded block instead of staying pinned to the icon. Switched to
`items-start` with an explicit top offset matching the icon's own
vertical center, so the connector stays anchored to the header regardless
of how tall the expanded content underneath it gets.

`npm run build` clean. Verified both breakpoints, and the expand
interaction with the now-anchored connector.

## 2026-08-23 — Eighth pass: a real scroll region, gradient trails, drifting icons

Four issues raised at once, three of them real defects rather than taste:

**1. Trails were solid bars that didn't land on the icons.** The previous
round positioned the dot and connector as siblings in the row grid with a
hand-tuned `pt-[21px]` offset — which meant they were aligned to a guess
about where the icon's centre was, not to the icon itself. Rebuilt so the
dot and trail are absolutely positioned *inside the entry header*, which
is a `flex items-center` row whose height is set by the icon. `top-1/2`
on that box is therefore the icon's centre by construction, not by
arithmetic. Measured it afterwards rather than eyeballing: trail spans
616→640px with the spine at 640, icon edge at 616 — exact, on both sides.
Also swapped the flat fill for a gradient (`transparent → provider colour`)
so it emerges from the spine and lands solid on the icon, flipping
direction only at the breakpoint where entries actually sit left of the
spine.

**2. Icons were static.** Added a continuous `timeline-float` drift
(±4px, 4.5s, staggered per entry so they desync). It lives on its own
wrapper nested inside the pop-animation wrapper inside the hover-transform
wrapper — three elements, three transform concerns, none fighting each
other. That nesting is deliberate: an `animation-fill-mode: both` holds
its end-state transform, which would silently clobber a hover transform
on the same element.

**3. "How does this handle same-day releases?"** It didn't — and that's a
guaranteed real-world case, since labs routinely ship siblings together.
Now grouped by exact date: one dot and one trail per *date*, with all
models from that day stacked beside it. Added Sonnet 5.2 (same day as
GPT-5.2) and Gemini 3 Flash (one day later) to the seed specifically so
this path is exercised rather than assumed.

**4. The timeline needed to be a scroll region, not the whole page.** This
was the biggest structural change. The timeline now lives in its own
bordered frame with a fixed viewport height, and:
- generates a *continuous* month sequence (6 months back → 6 months
  forward, auto-widened to include any model outside that window), so
  empty months still render as markers and it reads as a calendar rather
  than a list that happens to be sorted
- opens centred on TODAY, computed via `offsetTop` rather than
  `scrollIntoView` — the latter would have yanked the whole page down too
- `overscroll-behavior: contain` so reaching the end of the inner scroll
  doesn't chain into scrolling the page; move the mouse outside the frame
  and the page scrolls normally, which is what was asked for
- click-drag panning (mouse only — touch already has native momentum),
  with a movement threshold so a drag that ends over an entry doesn't also
  toggle it open
- up/down page buttons that auto-disable at each end, and a Today button

**Verification note.** The browser automation's coordinate input silently
delivers nothing in this sandbox — I confirmed it by attaching a capture
listener for `pointerdown`/`mousedown` and watching a `left_click_drag`
and then a plain `left_click` produce *zero* events. So the drag was
verified by dispatching real `PointerEvent`s and asserting on scroll
position: drag up clamped correctly at max scroll, drag down moved exactly
-200px for a 200px gesture, and the drag-then-click suppression behaved
across all four states (plain click opens, drag+click stays closed, next
plain click opens again). Worth recording that an earlier version of that
same test looked like a regression purely because it read `aria-expanded`
synchronously after `.click()` — React hadn't re-rendered yet. The test
was wrong, not the code; re-running it with awaits showed all four states
correct.

`npm run build` clean.

## 2026-08-23 — Ninth pass: real dates on the axis, real data, real logos

Three things, one of which I should have caught two rounds earlier.

**Dates were missing from the timeline.** Fair and slightly embarrassing:
a timeline that shows only month headers and icons doesn't tell you when
anything shipped. The day had been pushed into the expand panel back when
the collapsed entry got stripped to icon+name. Fixed by putting the date
in the *facing* column — desktop puts it in the empty half of the axis
opposite the entry, which uses space that was doing nothing and reads like
the reference infographic (date one side, content the other); mobile has
no facing column, so it sits above the group. Future dates get an `EST.`
prefix so an unconfirmed rumour never looks like a shipped fact.

**Same-day releases, properly answered.** I had implemented grouping last
round but only the *first* model of a shared date got a trail, so the rest
floated unconnected — which is exactly why the question kept coming back.
Now every model on a date gets its own trail; only the axis dot is shared,
and the date label carries an "N releases" count. The three-way
2026-07-09 GPT-5.6 Luna/Sol/Terra group is the proof case, and it reads
unambiguously.

**Real data, including non-US labs.** Replaced the invented seed with real
release names and dates for Feb–Aug 2026 pulled from a public tracker
(llmgateway.io), covering 14 providers across the US, China (Z.AI,
MiniMax, Alibaba/Qwen, Moonshot, DeepSeek, ByteDance, Xiaomi), Japan
(Sakana AI) and France (Mistral, in the registry pending a dated release).
38 models total.

Two deliberate honesty constraints in that seed, both documented in the
file header:
- **Benchmark numbers are placeholders**, and `benchmarkSource` says so
  literally rather than crediting Artificial Analysis. Fabricated numbers
  attributed to a real source would be worse than no numbers. Most models
  carry no benchmark at all, which is also the true pre-sync state.
- **Rumoured/announced entries are flagged as unconfirmed** and are not
  presented as sourced claims about any lab's plans.

Simple Icons turned out to cover most international labs — DeepSeek, Qwen,
Moonshot, ByteDance, Xiaomi, MiniMax, Mistral all have real marks. It
still omits OpenAI, xAI, Z.AI and Sakana AI, which keep monograms.
Moonshot's brand colour is pure black, which would disappear on a
near-black page, so its tile is inverted to light with a dark mark — the
one place a real brand colour is overridden, and only for legibility.

**Consequence worth noting**: real data means 14 providers, and the filter
pill row went from one line to five on mobile, shoving the timeline below
the fold. Made it a single horizontally-scrollable snap row under `sm`
while keeping the wrap on desktop. A good example of realistic seed data
surfacing a layout problem that invented three-provider data never would
have.

`npm run build` clean.

## 2026-08-23 — Backend: migrations, ingest API, abuse protection

Front end paused; wiring the parts that have to exist before n8n can do
anything. Three real gaps were open: no migrations (only `db:push`), no
endpoint for n8n to call, and a **public form with zero abuse protection** —
anyone could have flooded the review queue.

**Changed from the plan: n8n posts to an API route, not straight to Neon.**
The original plan had n8n's Postgres node writing directly. Reasons for
switching, agreed with Augustine before building:
- Validation and schema live in one place (Zod + Drizzle) instead of raw
  INSERT statements duplicated inside n8n nodes, where a schema change
  breaks the workflow silently.
- n8n only holds an API token, never database credentials — smaller blast
  radius if the VM is compromised.
- The insert is milliseconds, nowhere near Vercel's 10s function limit, so
  the original performance argument for going direct doesn't apply.

**Migrations.** Moved off `db:push` to generated SQL in `drizzle/`. Validated
properly rather than assuming: dropped the local database, recreated it, and
ran `db:migrate` from empty — three tables, correct enums and indexes. A
migration that has only ever been "pushed" isn't a migration.

**Ingest API.** Two bearer-authed routes plus a health check. Design points:
- `POST /api/ingest/models` upserts on slug so the daily sync is idempotent,
  and `coalesce`s the blurb so a human-written description isn't wiped by a
  sync that sends none. Verified: two posts of the same slug → one row,
  benchmark updated, blurb preserved.
- `POST /api/ingest/reports` writes `status: 'pending'` unconditionally.
  There is deliberately no code path from this route to a published report —
  the review gate is structural, not a flag someone can pass.
- Reports key on model *slug*, not id, so n8n never learns database ids.
  Unknown slugs are skipped and returned rather than failing the batch, so
  one bad row doesn't lose a whole run.
- Token comparison is `timingSafeEqual` — a length-or-content shortcut leaks
  the token to a patient attacker.
- `/api/health` reports missing env vars **by name only**, never values, so
  it's safe to leave public.

**Abuse protection**, all three layers tested through the real server action
rather than by reading the code:
- Honeypot: a bot filling the hidden field gets a *success* response and no
  write — confirmed 0 rows written while the page showed "received". Giving
  a bot an error teaches it to retry differently.
- Rate limit: 5/hour per IP. Confirmed the 6th submission is refused *and*
  writes nothing.
- IPs are stored as a salted SHA-256 hash, never the address. Confirmed the
  column holds a digest. Enough to count repeats, useless if leaked.

**A guard that proved itself by getting in the way**: I tried to unit-test
the rate limiter with `tsx` and it threw — `server-only` refused the import
outside a server context. That's exactly its job, so rather than weaken it
I tested through the running app instead, which is the better test anyway.

**Verified rather than assumed**, since both were flagged as unknowns in the
original brief: the HN Algolia API still works exactly as the brief assumed
(no auth, documented fields). Switched the workflow from story search to
**comment** search — story titles are announcements, comments are where "I
tried X and it did Y" actually lives, which is the entire point of the
reality layer.

**n8n workflows** written to `n8n/*.json`. The summarisation step uses a
forced **strict tool call** rather than asking for JSON in prose, so the
response is schema-valid by construction. The prompt requires paraphrase,
explicitly forbids reproducing the comment's wording (per the brief), and
asks the model to mark anything that isn't a first-hand account as unusable.
Capped at 25 candidates per run so one busy news cycle can't run up a bill.

Model is `claude-opus-5` at `effort: low`. Flagged to Augustine that Haiku
4.5 would be much cheaper for a classification task at this volume — a cost
call that's his to make, not mine.

These workflows are the one thing here I could **not** test: they need the
Hetzner instance. Everything else was exercised end to end against the local
Postgres.

## 2026-08-23 — Dropping Artificial Analysis: a spec correction

Augustine pushed back on AA: *"where does the AA come into this again?"* — the
site is meant to report what providers announce, with a link out and a key
summary, set against real user reports.

AA was in the original brief (layer 1 named it explicitly, and it was in the
suggested stack), so this wasn't invented. But the pushback was right, and I
should have raised the tension myself instead of just implementing it:

**AA is a third category, and the site only has room for two.** The thesis is
*claim vs. reality*. AA is neither — it's an independent lab re-running
standardized tests. Which means the heading I'd shipped, "CLAIM —
PROVIDER-REPORTED BENCHMARKS", was **flatly wrong**: those numbers were not
provider-reported. I built a label that misdescribed its own data and didn't
notice until challenged.

**What replaced it.** The claim layer is now strictly first-party: the lab's
own summary, the figures that lab chose to publish, and a link to its
announcement.

**Schema consequence worth recording.** The AA design worked as four fixed
columns (intelligence, coding, price, speed) because AA measures every model
the same way. Provider claims can't work that way — Anthropic quotes
SWE-bench, someone else quotes GPQA or their own eval. So
`claimedBenchmarks` is a JSONB list of `{label, value}` pairs: whatever that
lab actually published, in their own naming. Fixed columns would have either
dropped most of what a lab said or sat permanently empty. Price survived as a
real column since it's the one figure every lab states identically.

Migration needed two steps: drizzle-kit hits an interactive "is this a rename
or a drop?" prompt when a generate both adds and removes columns, and there's
no TTY here. Split into an additive migration then a drop migration, each
unambiguous. Verified against the live column list rather than trusting the
"applied successfully" message — which, notably, printed alongside an error.

**The honest trade, stated to Augustine before building:** dropping AA loses
cross-model comparability entirely. Provider-quoted benchmarks are chosen to
flatter, and labs use different harnesses, so two model pages aren't really
comparable. That's a real loss, not a free simplification. It's the right call
for a claim-vs-reality site rather than a leaderboard — but the About page now
says so to readers rather than letting them assume the numbers line up.

**Auto-publishing, and what I did about the risk.** Augustine chose to
auto-publish the provider summaries (no review gate). That means machine-written
text about a real company going live unchecked, and the failure mode is
misstating a lab's claim in public. Rather than argue the choice, I built the
mitigation into the shape of the thing:
- the prompt is strictly *extractive* — provider's own page only, never a news
  article or aggregator; only figures printed on that page; never convert,
  average or infer; return `found: false` rather than guess;
- anything not confidently sourced is dropped, not published half-empty;
- `summaryIsAutoDrafted` is stored per row, and the page renders "Summarised
  automatically from that announcement" next to the source link — so a reader
  is always one click from checking it.

**Seed honesty, again.** Same principle as the earlier placeholder-benchmark
decision, and it bit harder this time: fabricating "SWE-bench 77%" and
rendering it under "WHAT ANTHROPIC SAYS" would be putting invented words in a
real company's mouth. So exactly one model — Claude Opus 5 — carries real
figures, web-searched from Anthropic's own announcement (96.0% SWE-bench
Verified, 79.2% Pro, 43.3% Frontier-Bench). Every other model has an empty
claim until the workflow sources one. The empty state renders fine, which is
the point.

## 2026-08-23 — Neon live, cost tuning, and a key I leaked

**Neon is up.** Migrations applied and verified against the live column list
(three tables, claim-layer columns present, AA columns gone, 3 migrations
recorded). Seeded with the 38 real models.

Worth recording: Augustine copied the **direct** endpoint rather than the
pooled one I'd asked for — which turned out to be the better mistake, since
migrations *should* run on the direct connection. Confirmed the pooled variant
also resolves, so Vercel's runtime has what it needs. Direct for DDL, pooled
for serverless request traffic.

**Cost tuning.** Estimated the reality workflow at ~$50/month as built (Opus 5,
every 6h, 25 comments/run) — not acceptable for a free app, and I should have
run that number *before* choosing the model rather than leaving it as "your
call". Now Haiku 4.5, once daily, 12 per run: roughly $1.50/month.

Two real API details that would have broken it:
- **`output_config.effort` returns a 400 on Haiku 4.5.** It's valid on Opus,
  not on Haiku. My first patch to remove it silently didn't match (I used a
  literal `\n` where the parsed JSON had a real newline), and the verification
  step caught it — a good argument for asserting on the result rather than
  trusting that an edit applied.
- The claim workflow stays on **Opus 5** deliberately. It's a one-time backfill
  of ~38 models then a handful monthly, so the recurring cost is nil, and it's
  the layer that **auto-publishes without review** — accuracy matters more
  where nobody is checking. It also uses the `web_search_20260209` tool variant,
  which requires Opus 4.6+/Sonnet 4.6+ and would need swapping for the older
  basic variant on Haiku.

**Placeholder URLs cleared.** The seed had been setting provider *news index*
pages as `announcementUrl`. Since the claim workflow only visits models with no
recorded announcement, that would have made it skip 37 of 38 models and never
fetch a single real announcement — the seed would have silently disabled the
workflow it was meant to feed. Now only Claude Opus 5 carries a URL (a real,
sourced one), and 37 models are correctly queued for the first run.

**Mistake worth logging: I leaked the n8n API key into the transcript.** While
hunting for why two env vars appeared missing, I ran `grep -in "n8n"` on the
env file and printed the full key. The vars had been there all along — my
earlier "masked" check used `[A-Z_]+` as the key pattern, which doesn't match
the digit in `N8N_*`, so a bug in my own verification sent me looking for a
problem that didn't exist, and the way I looked exposed the secret. Flagged it
immediately and asked for rotation; it matters more than usual here because
this build is being documented publicly. Two lessons: mask by construction
rather than by grepping for a name, and test the masking regex against the
actual key names.

## 2026-08-23 — Anthropic key live, and a bug the first real call caught

Key works. Verified not with a "hello world" but by sending the *actual*
request shape the workflow will send — real system prompt, real strict tool
schema, real comment. That choice immediately paid for itself.

**The bug:** the takeaway came back at **431 characters** against the ingest
API's 400-character limit. The workflow does `.slice(0, 400)` as a backstop,
so nothing would have errored — it would have silently published cards
truncated mid-word. The kind of failure that looks like a design problem for
weeks before anyone traces it to a prompt.

Second issue in the same response: the voice was wrong. It wrote *"User
reports using Claude Opus 5 as the primary driver for…"* — reportage, where
every existing card on the site reads as a direct finding ("Handled a
multi-file refactor across an unfamiliar Rust codebase…").

Fixed by tightening the prompt rather than leaning on the truncation: a hard
200-character instruction, an explicit ban on "User reports"/"The user"
openings, and a good/bad example pair. Re-tested against the prompt extracted
from the workflow file itself, so the test exercised what will actually run
rather than a hand-written approximation of it.

Result: 431 → **181 characters**, correct voice, and a second test case (pure
market speculation about pricing) was correctly classified `usable: false` and
dropped before reaching the review queue.

Two test calls cost about $0.003 total, which is a reasonable price for
catching a defect that would otherwise have shipped unattended.

## 2026-08-23 — Workflows imported into the live n8n instance

Both workflows are on `n8n.augustwheel.com`, **inactive**. The instance runs
Augustine's real business automations (FSKY order/subscribe, a photo-studio
receptionist), so: created only, nothing existing read, modified, or
activated — verified by listing all 12 workflows afterwards and confirming
the original 10 kept their exact active/inactive states.

**Dropped `$env` in favour of n8n credentials.** The workflows originally read
`ANTHROPIC_API_KEY` / `TRACKAI_INGEST_TOKEN` / `TRACKAI_BASE_URL` from the n8n
instance environment — which would have meant SSH-ing into the Hetzner box to
set them, i.e. root on a machine running unrelated production automations, to
configure two secrets.

Instead: both secrets are now n8n `httpHeaderAuth` credentials created over the
API (Anthropic as `x-api-key`, ingest as `Authorization: Bearer …`), and the
base URL is simply hardcoded to the eventual domain. Net effect — secrets live
in n8n's encrypted credential store rather than in workflow JSON or a shell
env file, the workflow export contains no secrets at all and is safe to commit,
and SSH access was never needed. Worth noting because the original plan
assumed SSH was required for this step; it wasn't.

**Still blocked on deployment, by design.** Every node runs *except* the two
that call `trackai.theaugustdispatch.com`, which doesn't exist yet. So the
Anthropic-facing halves can be tested now, and the ingest halves light up the
moment Vercel is live. No config change needed at that point — the URL is
already correct.

## 2026-08-23 — First deploy failed: a silent fallback I built in

Vercel deploy came back with `ECONNREFUSED 127.0.0.1:5432` on every page — the
deployed app trying to reach a Postgres on localhost.

Root cause was mine. `src/db/index.ts` read:

```ts
const client = postgres(process.env.DATABASE_URL!);
```

The `!` is a TypeScript assertion and does nothing at runtime. Given
`undefined`, the `postgres` driver quietly falls back to `localhost:5432`. So a
*missing environment variable* presented as a *database connectivity failure* —
pointing at Neon, or the network, or the pooler, when the real problem was
config. That's the worst kind of error: it lies about its own cause.

Worse, I'd written `src/lib/env.ts` specifically to catch this class of
mistake, and then never wired it into the one module that most needed it.

Fixed with an explicit runtime check that names the variable, says where to set
it locally vs. on Vercel, specifies the pooled endpoint, and — the part that
would actually have saved this deploy — notes that **Vercel only applies env
var changes to new deployments**, so setting them after a failed deploy does
nothing until you redeploy.

Deliberately did *not* import `@/lib/env` here: that module has
`import "server-only"`, which throws outside a Next server context and would
break `npm run db:seed`. Same trap as the rate-limiter earlier. The guard is
inlined instead.

Also added a non-fatal warning when the production connection string lacks
`-pooler`, since the direct endpoint works fine until serverless connection
churn exhausts it — a failure that would appear later and under load, i.e. the
hardest time to diagnose it.

## 2026-08-23 — Post-deploy audit, and approving without a password

Site is live on `trackai.theaugustdispatch.com`: CNAME resolving to Vercel,
health green, GitHub connected so a push to `main` redeploys in ~30s. The audit
turned up one thing that mattered and several that didn't: **both n8n workflows
were imported but never switched on**, so nothing would ever have updated.

- **Correction to my own note**: the README claimed the reality workflow ran
  `claude-opus-5` every 6 hours. Both were wrong — it had already been tuned to
  Haiku, and the trigger is daily. Fixed the doc rather than the code.

- **Timezones were implicit.** Neither workflow set one, so "Daily 06:00" meant
  06:00 in the n8n *host's* timezone (UTC), not mine. The trigger fires daily
  either way, which is exactly why this survives review: nothing looks broken,
  the hour is just quietly wrong. Both now carry `America/Denver` explicitly.

- **Claim sync moved to Haiku 4.5.** It only processes models with no recorded
  announcement, so once backfilled it's near-idle; the cost argument was thin
  either way, but the constraint that matters is in the prompt, not the model.

### Approving by email instead of by password

The review queue was reachable only by typing a shared password into `/admin`.
Replaced the daily path in with a signed link mailed each morning at 08:00 —
after the 07:00 ingest, so the queue already has that morning's haul. No email
is sent when nothing is pending; a daily email that's usually empty is how you
teach yourself to ignore it.

Three things I'd have got wrong without thinking about them:

- **The token key is *derived* from `ADMIN_SESSION_SECRET`, not equal to it.**
  A session cookie and a moderation token are both HMACs over a timestamp. Sign
  them with the same key and they're interchangeable — a review link forwarded
  out of an inbox could be replayed as an admin login. One `createHmac` with a
  domain string rules that out, and needs no new environment variable.

- **Opening the link must not change anything.** This is the one that would
  have bitten hardest. Mail clients and security scanners fetch every URL in an
  email *before* the recipient sees it. An approve-by-GET link would have let
  Gmail's own scanner publish the entire queue on delivery. So the link is a
  read-only page and approving is a separate POST — one extra tap, and the
  difference between a review queue and an auto-publisher.

- **Decisions must not replay.** The update is scoped to rows still `pending`,
  so clicking an old link twice is a no-op rather than a reversal.

The honest trade-off: for 72 hours the mailbox is part of the security
boundary. The blast radius is moderation only — no database, no settings,
nothing published that a person didn't click. Against a shared password that
never expires and gets typed into a form, that reads like a net gain.

`/admin` stays as the fallback, and both routes now render one shared
`ReviewQueue` component so they can't drift apart.

Also found: `.env.local.example` was being swallowed by the blanket `.env*`
gitignore rule, so the file the README tells you to `cp` was never in the repo.

## 2026-08-23 — A richer reports column, and one source that turned out to be dead

Augustine's ask: the reality layer only ever read Hacker News, which is one
community's blind spots wearing a claim of "how AI models actually perform."
Widen it, and make where each report came from visible — that visibility is
meant to be the thing that separates trackai from every other tracker, not a
footnote.

**Sources chosen by testing live, not by assumption.** Probed HN Algolia,
Reddit, Lobste.rs, several Discourse forums, GitHub search, Stack Exchange,
and the YouTube and X APIs before writing any collector:

- **Discourse forums** (Cursor, OpenAI community, Hugging Face) turned out to
  be the best signal of anything tested — people post there while actively
  using the model on their own work. `/search.json` is disallowed in all
  three `robots.txt` files, so the collector uses `/latest.json` + polling
  `/t/<id>.json` instead — more requests, fully compliant.
- **YouTube** — comments only. Transcripts aren't in the official Data API
  and scraping them breaks YouTube's terms, so this reads reactions to a
  video rather than what a reviewer says in it. Noisier than forums, still
  useful.
- **Rejected after testing, not by assumption**: X/Twitter ($200/month API
  floor), GitHub (`"opus" in:body` returns 340k results, dominated by
  dependency-bump PRs, not model reports), Stack Overflow (wrong kind of
  content — "how do I fix this code," not "how did this model perform").

**The classifier prompt moved into the app**, served by
`/api/ingest/classifier` and fetched by every collector at run time, rather
than living as four separate inline copies inside the n8n workflow JSON. Four
copies is exactly the kind of thing that drifts — and a drifted prompt would
mean "reviewed report" silently means something different depending on which
workflow happened to find it, which undermines the whole point of showing
source tags: they'd be comparing unlike bars, not just unlike places.
`?source=` tailors one paragraph on how much benefit of the doubt that source
has earned (a Cursor forum post starts with more trust than a YouTube
comment); the bar for *usable* stays identical across all four.

**A post must name the tracked model itself to become a candidate** —
inheriting the model from a thread's title would attribute every reply in a
busy thread to whatever the title happened to say, which is exactly the kind
of silent misattribution that would be invisible until someone checked a
source link and found it didn't match.

`source_type` widened from `hn | manual` to `hn | reddit | youtube | forum |
manual` via an additive migration. `forum` stays coarse rather than naming
each Discourse instance, because the specific forum is already recoverable
from `sourceUrl` — so a fifth Discourse forum needs no migration, just a
`FORUM_NAMES` entry for its display label.

### Reddit: built, then found to be structurally blocked

Wrote the collector assuming the normal path — register a Reddit "script" app
at `reddit.com/prefs/apps`, get a `client_id`/`client_secret`, done. Augustine
hit it first: the form accepts the reCAPTCHA, "creates" the app, and silently
reloads to the same blank form. Every browser, every attempt, no error text
anywhere — which reads exactly like a client-side bug and isn't one.

Reddit closed self-service API app creation in November 2025 under what they
call the "Responsible Builder Policy" — the same policy document the broken
form itself links to at the bottom of the page. Instead of retiring
`prefs/apps` cleanly, they left it running in a state that looks functional
and isn't: the captcha works, the submit works, there is simply no code path
left that successfully creates a new app. New API access now requires a
manual application Reddit may or may not approve, with reports of near-zero
approval for small non-commercial projects.

Net effect: **the Reddit collector is code-complete and imported into n8n,
but paused with no credential to attach and no self-serve way to get one.**
Nothing to fix on trackai's side — this is a platform closing a door, not a
bug. Decision: ship forums and YouTube now, leave Reddit inactive rather than
delete it. `source_type` already carries `reddit`; if Reddit's manual review
ever approves this project, activating it is a five-minute credential swap,
not a rebuild.

### Two things the audit caught before they shipped

- **The widening migration never ran against production.** It had been
  applied locally days ago but the `db:migrate` step against Neon was never
  actually run, and the deploying commit hadn't been pushed either — so the
  new code and the new schema were both sitting finished and both sitting
  undeployed. Would have surfaced as a 500 on the first `sourceType: 'forum'`
  write: the app-level Zod schema already accepted the value, but the
  Postgres enum itself didn't have it yet, so the request would validate and
  then fail at the database. Migrated production (additive only — new enum
  values, no data touched) before pushing.
- **This build log had gone three commits stale.** The schema, the
  collectors, and the classifier contract all shipped without an entry here
  — a gap that would have left this exact section of the post with nothing
  to draw from. Caught while reconstructing what had changed during a
  context-compaction gap in the session; logged as one entry covering all
  three rather than backfilling each commit separately.
