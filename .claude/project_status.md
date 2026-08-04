# PROJECT_STATUS.md

# Same Sky
## Live Project Status

Last Updated: 2026-08-04

Current Phase:
Core Pages Finished (World, Growth, Journal, Memories, Timeline) →
Personalization Scope & Content Decisions Next

Project Status:
Active Development

---

# Engineering Handoff (Read This First)

Session 5 closed here because of an approaching context limit, not because
the work ran out. The repository is in a clean, verified, committed state —
`git status` is empty, `npm run build` and `npm run lint` both pass, and a
real signed-in browser session was observed live in the dev server log
during closing verification, hitting `WorldPage` repeatedly with zero
errors (only the expected, already-documented "ambient audio not available"
warning). Everything below this section is full historical detail; this
section is the complete summary a new session needs to continue without
reading the rest first.

## Features completed

Every system named in `overview_and_specification.md` is implemented and
wired end to end: authentication/pairing, the Ritual Engine (23 categories),
the World Progression Engine (tree/garden/pond/wildlife/sky/weather),
immediate feedback (synthesised chimes + visual responses), Daily Notes,
Shared Journal, Memories (including a detail view for a memory's story —
added this session), Planning, Reflection, the Historical Timeline (with
real timeline visual language — added this session), and progress
visualization at daily/weekly/monthly/yearly timescales (the yearly view,
`YearChart`, was the one missing timescale and was added this session). See
"Overall Progress" below for the full itemised list by area.

## Features partially completed

- **Ambient audio.** The full engine — cross-fade playback, per-time-of-day
  and per-weather bed selection, volume control, a hero-level quick toggle —
  is complete. The three `.mp3` files it plays (`day`, `night`, `rain`)
  do not exist in `public/audio/`. This is a content decision, covered
  under "Remaining ambient audio implementation" below.
- **Memories storage.** Fully functional (save, view, detail dialog) using
  client-downscaled data URLs in Realtime Database. This works today and
  needs no further engineering; it is "partial" only in the sense that it
  has a known scaling ceiling — see "Known Issues".
- **AI Reflection.** The specification's five behavioural requirements
  (summarise, organise, reflect, identify positive patterns, encourage
  growth) are met by a deterministic pattern-analysis engine
  (`generateReflection` in `services/planning.ts`). No actual model/LLM is
  wired in — see "Remaining features".

## Remaining features

- AI Reflection using an actual model (needs API credentials this pass
  cannot add unilaterally)
- Notifications / daily invitation delivery (needs push infrastructure and
  a service worker; also sits close to the philosophy's "never feel
  pressured" boundary — worth a product conversation before building)
- Personalization beyond theme/motion/hemisphere/ambient audio (scope
  undefined in the spec — see "Product Decisions Needed")
- Offline support
- Automated tests (none exist yet — see "Technical debt")
- Production analytics/error monitoring

## Remaining engineering tasks

- `GrowthPeriod` and `useReflection` each independently subscribe to the
  same plan path (`usePlan` is called in both) — one screen opens two live
  listeners on one path instead of one. Not a correctness bug, easy fix.
- `npm audit` reports 2 high-severity advisories in transitive dependencies;
  not yet triaged (run `npm audit` for current detail — versions may have
  shifted since this was last checked).
- No automated tests at any level (unit, integration, or end-to-end).

## Remaining UI work

- No dedicated "view all memories" pagination/filter — fine at current
  scale, worth revisiting if a pair accumulates hundreds of memories.
- No web app manifest (`public/` has `favicon.svg`/`icons.svg` but no
  `manifest.json`) — add-to-homescreen is not currently supported.
- Nothing else identified as missing UI; every page in the priority list
  (World, Growth, Journal, Memories, Timeline) was audited and finished
  this session.

## Remaining UX improvements

- Personalization scope (see "Product Decisions Needed")
- A gentle, opt-in daily-invitation mechanism was considered and explicitly
  deferred — see "Remaining features" (Notifications)

## Remaining animations

- No cross-fade/transition **between routes** — navigating from, say,
  World to Growth is instant with no shared transition. Every individual
  page now has its own entrance fade-in (added this session), but there is
  no route-to-route choreography. Worth considering with `framer-motion`'s
  `AnimatePresence` keyed on route path, kept subtle, if it's judged worth
  the added complexity — not currently a gap anyone has flagged.
- Everything else animation-related identified during this session's pass
  (immediate-feedback sparkle/ripple/toast, tree hover, weather, entrance
  transitions) is implemented.

## Remaining ambient audio implementation

Engineering is complete (see "Features partially completed" above). What's
missing is content: `public/audio/day.mp3`, `night.mp3`, `rain.mp3`. This
is explicitly a project-owner decision, not something for an engineering
pass to invent — see "Product Decisions Needed".

## Remaining accessibility work

- Real contrast fixes were made this project (see "Bug Fixes" — three WCAG
  AA failures found by computing actual ratios, all fixed) and keyboard tab
  order was verified in a headless browser. **Not yet done:** a pass with
  an actual screen reader (VoiceOver/NVDA/JAWS) rather than heuristic
  review of ARIA attributes; automated accessibility testing (e.g.
  `axe-core`) is not integrated into the build or CI.
- Everything authenticated (World, Growth, Journal, Memories, Timeline) has
  never been accessibility-tested in a real browser by a human, for the
  same reason nothing authenticated has been visually verified — see
  "Known Issues".

## Remaining performance improvements

- No Lighthouse audit has been run — bundle-size improvements (route-level
  code splitting, main chunk 168 KB → 84 KB gzipped) were verified by build
  output and a headless browser, not by a full Lighthouse pass.
- Memory photos are downscaled client-side but not further optimised
  (no AVIF/WebP conversion, no responsive `srcset`).
- Font loading already uses `&display=swap` — checked this session, no
  change needed.

## Remaining production polish

- No cross-browser testing beyond Chromium (this environment's only
  available browser for headless verification).
- No real-device testing (mobile viewport sizes were spot-checked in a
  headless browser, not on actual hardware).
- Dark mode has been built with real contrast math but never visually
  QA'd by a human in a live session.

## Known issues

See the full "Known Issues" section below for detail. Summary: no ambient
audio assets; Memories storage will eventually need Firebase Storage if
photo volume grows; `GrowthPeriod`/`useReflection` double-subscribe to one
plan path; 2 untriaged `npm audit` advisories.

## Technical debt

- Zero automated tests at any level — the single largest piece of technical
  debt at this point, given the size of the codebase (23 rituals, 8 tree
  stages, 9 wildlife species, 10 timeline event types, full CRUD across 5
  content types). Recommended as the next priority after the standing
  product decisions are resolved.
- The double-subscription in `GrowthPeriod`/`useReflection` (see "Remaining
  engineering tasks").
- No CI pipeline — `npm run build`/`npm run lint` are run manually each
  session, not automatically on push.

## Important implementation decisions made this session

- **Memories: added a detail view, not just polish.** Reading the page
  during the finishing pass surfaced that a memory's `story` field was
  captured on save and then permanently unreachable — `MemoryTile` never
  displayed it. This was treated as a bug fix within the Memories task,
  not a new feature request, since it made an existing field pointless.
- **Journal: deliberately did not colour-code mood by tone.** Considered
  mapping each of the five moods to a distinct accent colour for visual
  hierarchy, decided against it — a colour gradient across moods would
  quietly imply some are better than others, which the product philosophy
  explicitly rules out ("users should never feel judged"). All five moods
  keep equal visual weight.
- **Growth: `useYearlyOverview` is a one-time read, not a subscription.**
  A year of history changes slowly enough that a live listener would cost
  far more than it is ever worth — consistent with the existing "realtime
  listeners only where live sync provides real value" rule.
- **Timeline: event-type colour tokens reuse the five existing ritual
  accent tones** (`accent`/`water`/`ember`/`bloom`/`dusk`) rather than
  introducing new palette values, keeping the "avoid excessive colours"
  constraint intact while still making a year's shape scannable.

## Files modified this session (Session 5 commit `07e60b5`)

```
.claude/project_status.md
src/components/world/GrowthPeriod.tsx
src/components/world/WorldScene.tsx
src/components/world/YearChart.tsx        (new)
src/hooks/usePlanning.ts
src/pages/DashboardPage.tsx
src/pages/JournalPage.tsx
src/pages/MemoriesPage.tsx
src/pages/TimelinePage.tsx
src/pages/WorldPage.tsx
```

Previous session (Session 4, commit `c5c8c97` — production polish: chimes,
weather, accessibility, code splitting) touched 29 files; see that commit
directly for its full list if needed.

## Recommended implementation order

1. Project owner confirms this session's and the prior session's work in a
   real signed-in browser session (nothing authenticated has been seen
   firsthand by a human from inside this tool — see "Known Issues")
2. Resolve the three standing "Product Decisions Needed" (ambient audio
   content, Memories storage at scale, personalization scope)
3. Automated tests — start with the highest-risk pure logic:
   `services/world.ts` (world derivation), `services/ritual.ts`
   (honour/release idempotency), `services/planning.ts` (reflection
   generation)
4. Fix the `GrowthPeriod`/`useReflection` double-subscription
5. Triage the 2 `npm audit` advisories
6. Then: whichever of Notifications / deeper Personalization / AI
   Reflection-with-a-model the resolved product decisions point toward

## Exact next priority

**Confirm the application in a real signed-in session.** Every fix and
every feature built across Sessions 3, 4 and 5 has been verified by build
output, lint, and headless-browser checks of what can be reached without
authentication — nothing authenticated has been confirmed working by a
human. This is not a suspicion of a bug; it is a genuine gap in this
environment's ability to verify its own work, and it is the one thing a
human needs to do that no amount of further engineering substitutes for.

---

# Overall Progress

## Completed

### Foundation

- ✅ Repository structure established, Vite starter remnants removed
- ✅ React + TypeScript + Vite configured
- ✅ Tailwind CSS v4 wired (`@tailwindcss/vite`, `@theme inline` token layer)
- ✅ Full design system: palette, typography (Fraunces/Inter), radii, shadows,
  motion tokens, light/dark theme, `prefers-reduced-motion` support
- ✅ Application routing configured (public / signed-in / paired tiers)
- ✅ Protected routing (`ProtectedRoute`, `AuthGate`) with correct
  resolving/signed-out/signed-in states — no false redirects on reload
- ✅ Global authentication state (Zustand), single session source of truth
- ✅ Firebase Authentication integrated, Google Sign-In, persistent sessions
  (IndexedDB, falls back to localStorage)
- ✅ User profile creation, profile fields owned correctly (auth-owned fields
  refresh on sign-in; `pairId` never overwritten by an auth event)
- ✅ Firebase Realtime Database connected, full path-builder abstraction
  (`PATHS` in `app/constants.ts`), transactional writes for concurrent edits
- ✅ Canonical type layer (`src/types/*`) — one definition per domain concept,
  no duplicate `WorldState`/`UserProfile` shapes
- ✅ Pairing: create, invite generation (crypto-random, ambiguous-character
  free), invite validation, join, specific per-case error messaging
- ✅ Shared world initialization tied correctly to pairing (world path bug
  fixed: `worlds/{worldId}`, previously mismatched `world/`)
- ✅ Reusable UI primitives: `Button`, `Card`, `Dialog` (focus trap, portal,
  escape-to-close), `Field` (`TextField`, `TextAreaField`, `Toggle`), `Avatar`,
  `Icon`
- ✅ App shell layouts: `MainLayout`, `AuthLayout`, `DashboardLayout` with
  header + responsive navigation (top bar / bottom bar)

### Ritual Engine & World Progression

- ✅ Full ritual catalogue — all 23 categories from the specification, each
  with an icon, domain, cadence and warm, non-prescriptive description
- ✅ Per-partner ritual plans (each person curates their own practice)
- ✅ Honour / release a ritual, idempotent, with note support
- ✅ World Progression Engine (`services/world.ts`): stored facts vs. derived
  snapshot cleanly separated; tree (8 stages, gated by both energy and real
  elapsed days), garden, pond, wildlife (9 species, time-of-day and
  season-aware, foundation-gated), harmony, vitality
- ✅ "Together bonus" — growing together adds, growing alone never subtracts
- ✅ Personal sky derived from real local time + real lunar phase +
  meteorological season (hemisphere-aware)
- ✅ Live world store (`worldStore`) — one attach point in `DashboardLayout`,
  every subscription opened/closed correctly, local-day rollover handled

### Shared World UI

- ✅ `SkyBackdrop` — continuous colour interpolation across the day, real sun/
  moon position and lunar illumination, seeded stars (stable across renders)
- ✅ `WorldScene` — SVG tree/garden/pond + HTML wildlife layer, seeded flower
  and creature placement (stable, not re-randomised per render)
- ✅ `WorldPage` — sky + scene hero, world summary, ritual grid, ritual
  picker dialog, daily note card, partner-aware empty states
- ✅ Ambient audio service (Howler-based cross-fade, day/night/rain beds) —
  seam is complete; **no audio assets are included** (content decision, not
  engineering — see Known Issues)
- ✅ `SettingsPage` (theme, motion, hemisphere, ambient audio + volume, sign
  out) and `ProfilePage` rebuilt on real data

### Daily Notes, Journal, Memories

- ✅ Daily Notes — one note per person per local day, five vessel types,
  idempotent "opened" tracking, embedded in the World screen
- ✅ Shared Journal — shared reading, author-only editing (enforced in the
  service layer), five non-evaluative moods, full page with composer
- ✅ Memories — title/story/date/kind, optional photo (downscaled + JPEG-
  encoded client-side to a data URL — see Known Issues), grid page

### Planning, Reflection & Timeline

- ✅ `services/planning.ts` — weekly & monthly plans (intentions), each
  removable only by its own author
- ✅ Reflection generation (`generateReflection`) — pure function over ritual
  history, exactly mirroring the "derive, don't store computed state"
  pattern in `services/world.ts`; nothing about a reflection is persisted, so
  any past week or month can be regenerated on demand
- ✅ `GrowthPeriod` component — week/month switcher, live intentions list +
  composer, generated observations (toned, never judgemental) and a single
  open-ended invitation
- ✅ `CompletionChart` — the viewer's own daily completion against their
  chosen practice, as a percentage (the spec's explicit "chart form, on
  percentage of completion basis" requirement)
- ✅ `DomainShareBars` — how recent rituals have spread across body / mind /
  craft / together
- ✅ Historical Timeline (`services/timeline.ts`, `TimelinePage`) — a
  permanent, year-grouped record. Deliberately **not** a log of every ritual
  (that would be noise); it records world milestones (world created, tree
  stage crossed — detected by comparing the derived tree stage before/after
  each ritual write, without storing the stage itself), memories saved, and
  journal entries written
- ✅ Routing + navigation extended to include Journal, Memories and Timeline
  (five destinations total, matching the pre-existing "five and no more"
  navigation constraint)

### Production Polish (Session 4)

- ✅ **Immediate feedback system** — the specification's explicit requirement
  that "every meaningful action" produce "a small visual and audio response"
  is now implemented, not just the ambient layer: a synthesised chime
  service (`services/audio.ts`, Web Audio API, no external assets) plays a
  distinct short phrase for honouring a ritual, releasing one, sending a
  note, opening one, saving a memory, saving a journal entry, and reaching a
  tree-stage milestone — all drawn from one consonant scale so they read as
  one instrument. Paired with real visual responses: a sparkle burst on a
  newly honoured `RitualCard`, a pond ripple in `WorldScene` on any honour,
  and a dismissible `MilestoneToast` the first time a device sees a new tree
  stage (tracked client-side; the stage itself is still never stored,
  matching the derive-don't-store rule elsewhere)
- ✅ **Dynamic weather** (`deriveWeather` in `services/world.ts`) — the
  Future Systems item that had no implementation at all. Seeded by world id
  and local day (stable for the day, private to each world, no location
  permission or external weather API), it renders gentle falling rain in
  `WorldScene` and — tying sound and sight together — makes the "rain"
  ambient bed override the time-of-day bed in `useAmbientAudio` regardless
  of hour, matching the specification's "gentle rain, distant thunder"
  belonging to any time of day
- ✅ Google's own "G" mark added to both sign-in buttons (their branding
  guidelines expect it; a generic button was a small trust gap)
- ✅ Copy pass: replaced "energy" (gamification-adjacent internal jargon) and
  a bare unlabelled number in the Growth stat grid with legible, warm
  language consistent with the "tend to" vocabulary used everywhere else
- ✅ **Real accessibility fixes, not just an audit**: found and fixed a WCAG
  AA contrast failure (white hero text over a bright midday sky measured as
  low as 1.27:1 against the required 4.5:1) by adding a scrim to every
  screen that overlays text on `SkyBackdrop`; found and fixed two more
  failing colour tokens by computing actual contrast ratios for every
  text/background pair in both themes (`--ss-ink-faint` in light mode was
  3.71–3.94:1, `--ss-ember` — every error message in the product — was
  4.04:1); found and fixed two icon-only controls with no accessible name
  (the note-vessel picker, and the memory photo button once a photo is
  chosen); verified keyboard tab order and visible focus rings in a real
  browser
- ✅ **Real performance work, not just a plan**: route-level code splitting
  via `React.lazy` for every page except the eagerly-loaded landing page,
  with a shared `RouteSuspense` boundary per layout so the header and
  navigation stay mounted during a route's chunk load instead of
  flickering. Verified in a real headless browser and by build output: the
  main JS chunk dropped from 168 KB to 84 KB gzipped, with each page now a
  separate 1–22 KB chunk fetched only when visited
- ✅ Responsive spot-check at 375px/768px/1280px — no horizontal overflow
  found on any checked page

### World Page — final pass (Session 5)

- ✅ Quick-access ambient sound toggle in the hero itself (`Volume2`/
  `VolumeX`), so the control the specification requires ("always have the
  ability to adjust or disable environmental sounds") is reachable from
  where a person is actually hearing the sound, not only buried in Settings
- ✅ Discoverable hover interaction on the tree, garden and pond: each now
  carries a native SVG `<title>` (a real tooltip, and a real accessible
  name for assistive technology) and the tree settles very slightly toward
  the viewer on hover (motion permitting) — the specification calls the
  tree "one of the strongest emotional symbols" in the product, so it is
  the one part of the scene that visibly answers to attention
- ✅ Gentle entrance transition (`--animate-fade-in`) on the content below
  the hero, so the page arrives rather than snapping into place — the sky
  and world scene render instantly (first paint should never wait), only
  the summary/rituals section beneath fades in
- ✅ Build clean, lint clean, verified in a headless browser (unauthenticated
  flow + full lazy-route flow, zero console errors) after this pass

### Growth Page — final pass (Session 5)

- ✅ **`YearChart` / `useYearlyOverview`** — the missing progress-visualization
  timescale. Everything else on Growth looks at the last two to four weeks;
  the specification explicitly asks for growth to be visible "at multiple
  timescales" up through "yearly: major world evolution", and nothing on the
  page showed that until now. A one-time read (`getWorldHistory`, not a
  subscription — a year of history does not need a live listener) aggregates
  the trailing 12 months into a bar per month, styled to match the existing
  `EnergyChart`/`CompletionChart` language rather than introducing a new one
- ✅ `GrowthPeriod`'s intentions list had no empty state — an empty `<ul>`
  with nothing in it if no intentions had been written yet. Added a plain-
  language message ("Nothing written down for this week yet…") instead of
  silence
- ✅ Same gentle entrance transition as World
- ✅ Build clean, lint clean (including a `react-hooks/set-state-in-effect`
  violation in the new hook, fixed with the same derived-loading-state
  pattern already used by `useReflection` rather than an imperative reset),
  verified in a headless browser after this pass

### Journal Page — final pass (Session 5)

- ✅ Gentle entrance transition, matching World and Growth
- ✅ Tactile press feedback (`active:scale`) added to the mood picker and the
  edit button — previously only colour/border changed on interaction, no
  motion at all
- ✅ Deliberately did **not** colour-code mood by tone (e.g. red for
  "heavy"). Considered it for visual hierarchy, decided against it: the
  product philosophy is explicit that a person should never feel judged,
  and a colour gradient across moods quietly implies some are better than
  others in exactly the way "heavy" is written not to be. All five moods
  keep equal visual weight
- ✅ Build clean, lint clean, verified in a headless browser after this pass

### Memories Page — final pass (Session 5)

- ✅ **Fixed a real missing feature, not just polish**: a memory's story was
  captured on save and then had nowhere to ever be read again — `MemoryTile`
  only ever showed title, kind and date. Added a `MemoryDetail` dialog:
  clicking a tile now opens the full photo and story. Without this, writing
  a story while saving a memory was pointless — it was written once and
  permanently invisible afterward
- ✅ Made the grid tiles feel like the interactive, openable things they now
  are: a hover lift, a press-down on tap, and a shadow that lifts on hover
  (previously flat cards with no affordance that they did anything)
- ✅ `lg:grid-cols-4` added so the grid uses wide-screen space better instead
  of stopping at 3 columns
- ✅ Same tactile press feedback added to the memory-kind picker as Journal's
  mood picker, for consistency
- ✅ Gentle entrance transition, matching every other page this session
- ✅ Build clean, lint clean, verified in a headless browser after this pass

### Timeline Page — final pass (Session 5)

- ✅ Actual timeline visual language, not just a plain list: a connecting
  thread runs behind each year's entries (a hairline between markers, only
  visible in the gaps between cards since the cards' own background covers
  it where they sit — the years now read as one continuous line through
  time rather than a stack of unrelated cards)
- ✅ Colour-differentiated event markers: each of the ten event types now
  gets one of the same five accent tones already used for ritual domains
  elsewhere (nothing new added to the palette) — makes a year's shape
  scannable at a glance (how much growth, how many kept moments, how much
  was written down) instead of every icon sitting on identical grey
- ✅ Gentle entrance transition, matching every other page this session
- ✅ Build clean, lint clean, verified in a headless browser after this pass

---

## Not Yet Implemented

- AI Reflection using an actual model (deliberately deferred — no API
  credentials to add unilaterally; the deterministic pattern-analysis
  reflection engine already built already satisfies the specification's
  five AI bullet points — summarise, organise, reflect, identify positive
  patterns, encourage growth — without one; see Known Issues)
- Notifications / daily invitation delivery (would need push infrastructure
  and a service worker; also sits close to the philosophy's "never feel
  pressured" boundary and deserves a product conversation, not a silent
  build)
- Personalization beyond theme/motion/hemisphere/ambient audio (no per-user
  accent colour, no custom vessel/mood sets, etc. — scope still needs
  product input, per the standing note below)
- Offline support
- Automated tests
- Production analytics/error monitoring
- Ambient *audio assets* — the day/night/rain bed engine is complete and has
  been since Session 2; the `.mp3` files themselves are a content decision,
  not an engineering one (see Known Issues)

---

# Current Engineering Goal

Every system named in the specification is implemented, wired end to end,
and has had a real production-polish pass: immediate feedback (audio +
visual), dynamic weather, a verified accessibility pass with real contrast
and labelling fixes, and a verified performance pass with real code
splitting. What remains is either a product decision this pass should not
make silently, or a content asset (audio recordings) this pass cannot create.

---

# Immediate Next Priority

0. **Confirm every fix and Session 5 addition in a real signed-in session** —
   this environment cannot complete Google OAuth, so nothing authenticated
   has been seen firsthand by a human yet. Worth specifically checking: the
   World hero's sound toggle actually mutes/unmutes; hovering the tree shows
   its tooltip and settles slightly; Growth's new "The last year" card
   renders a sensible 12-month bar chart; clicking a Memories tile opens the
   new detail dialog with its story; Timeline's connecting line and coloured
   markers render correctly; honour a ritual and listen/watch for the chime
   and sparkle; on a rainy day for that world, confirm rain renders and the
   ambient bed switches.
1. Resolve the "Product Decisions Needed" below with the project owner —
   none of them block further engineering, but this pass should not guess
   at them
2. Personalization scope, once decided
3. Automated tests — the product has none yet; worth prioritizing before the
   codebase grows much larger
4. Offline support, production analytics/error monitoring

---

# Product Decisions Needed

These are not engineering blockers — the code paths are ready — but they are
product calls this pass should not make silently:

- **Ambient audio content.** `services/audio.ts` is complete; it needs
  `public/audio/day.mp3`, `night.mp3`, `rain.mp3` (or a decision to ship
  without sound).
- **Memory photo storage at scale.** Currently client-downscaled data URLs in
  Realtime Database (no new paid service). If photo volume grows meaningfully,
  moving to Firebase Storage is a credentialed/billing decision for the
  project owner.
- **What "Personalization" means beyond appearance.** The spec lists it as a
  future system without much detail — worth a short conversation before
  building it further.

---

# Known Constraints

Stable — extend, do not redesign, without strong justification:

- Authentication, routing, Firebase integration, pairing
- Global state management (`authStore`, `uiStore`, `worldStore`)
- Service architecture (`services/*` is the only Firebase touch-point)
- Database abstraction (`PATHS` builders, `services/database.ts`)
- The design token layer in `src/index.css`
- The ritual catalogue shape and the world derivation pattern in
  `services/world.ts` (facts stored, snapshot derived)
- The reflection/timeline pattern in `services/planning.ts` /
  `services/timeline.ts`: reflections are always generated, never stored;
  timeline events are written only for genuinely meaningful moments, never
  per-ritual

---

# Known Issues

- **No ambient audio assets.** The playback/cross-fade engine
  (`services/audio.ts`) is complete and silently no-ops if a file is
  missing; recording or licensing the three beds is a content decision for
  the project owner, not something this pass should invent.
- **Memory photos are stored as inline data URLs in Realtime Database**,
  downscaled to at most 1400px and JPEG-encoded client-side
  (`services/storage.ts`). Deliberate, to avoid introducing Firebase Storage
  (a paid/credentialed service change) without approval. Fine for a
  meaningful handful of photos; revisit if volume grows.
- `npm audit` reports 2 high-severity advisories in transitive dependencies;
  not yet triaged.
- `GrowthPeriod` and `useReflection` each independently subscribe to the same
  plan path (`usePlan` is called in both), so a period screen opens two live
  listeners on one path instead of one. Not a correctness bug, just an easy
  future simplification.
- No `public/audio/*` files exist yet, matching the point above.

---

# Bug Fixes

## 2026-08-04 — Growth page infinite render loop

**Symptom:** Opening the Growth page crashed the app with "Maximum update
depth exceeded" and "The result of getSnapshot should be cached to avoid an
infinite loop," originating at `DashboardPage.tsx` (around line 27) and
propagating through `router.tsx`.

**Root cause:** `DashboardPage.tsx` selected from the Zustand world store
with:

```ts
const practiceRitualIds = useWorldStore((state) => state.ritualPlan?.ritualIds ?? []);
```

Zustand v5 selectors run through React's `useSyncExternalStore`, which
compares consecutive `getSnapshot()` results with `Object.is` to decide
whether a re-render is needed. `state.ritualPlan` is `null` until the
person's ritual plan has loaded from Firebase — and for as long as it is
`null`, the `?? []` fallback evaluates on every single call, producing a
**new array reference every time**. `useSyncExternalStore` saw a
"different" snapshot on every check, forced a re-render, which called the
selector again, which produced yet another new array — an infinite loop
that only a `null` (or otherwise referentially stable) fallback would have
avoided.

This is a general Zustand/`useSyncExternalStore` trap: a selector's fallback
must be either a primitive (`null`, `0`, `""`) or a reference held outside
the selector. It is not specific to ritual plans — any selector of the form
`store((s) => s.x ?? [])` or `s.x ?? {}` has the same failure mode.

**Fix:** Introduced a module-level constant in `DashboardPage.tsx`:

```ts
const EMPTY_RITUAL_IDS: RitualId[] = [];
```

and used it as the fallback instead of an inline `[]`. The constant is
created once when the module loads, so the selector now returns the exact
same reference on every call while `ritualPlan` is `null`, and
`getSnapshot` stabilises correctly.

**Verification performed:**

- Audited every `useAuthStore` / `useUiStore` / `useWorldStore` selector in
  the codebase (`grep` across `src/`) for the same pattern (inline `?? []`
  / `?? {}` / object or array literals returned directly from a selector).
  This was the only instance; the one other `?? null` fallback
  (`useAuth.ts`, `state.user?.uid ?? null`) is safe because `null` is a
  primitive and always referentially equal to itself.
- `npm run build` — passes.
- `npm run lint` — passes.
- `npm run dev` — starts cleanly on port 5173.
- Headless-browser smoke test of the unauthenticated golden path
  (landing → sign-in) with a 2-second settle and a console-error check —
  clean, no errors.
- Code-level review of loading states on World, Growth, Journal, Memories
  and Timeline: World and Growth gate on `useWorldStore`'s `status` /
  `world`/`snapshot` fields (all stable, real store values, not inline
  fallbacks) and resolve once the world subscription reports `"ready"`.
  Journal, Memories and Timeline have no loading gate at all — they render
  from a `useState([])` that Firebase's realtime listener fills in, so
  there is no state that could get stuck.
- **Not independently re-verified in a real signed-in session** — this
  environment cannot complete Google OAuth, so the actual authenticated
  Growth page render (where the bug was originally reported) was not
  re-observed firsthand. The fix is verified by root-cause analysis, a
  full-codebase audit for the same defect class, and clean build/lint/dev
  output; a real sign-in check by the project owner is the remaining step.

## 2026-08-04 — World and Growth stuck on an infinite loading spinner

**Symptom:** After the render-loop fix above, the render crash was gone and
the console was clean, but World and Growth both stayed on their loading
spinner indefinitely — never resolving to either the real content or an
error.

**Investigation:** Traced the complete lifecycle: `DashboardLayout` calls
`useWorldStore().attach(pairId, uid)` once `pairId`/`uid` are known →
`attach` subscribes to `pairs/{pairId}` → on receiving a pair, subscribes to
`worlds/{worldId}` → that callback is the *only* place `status` is ever set
to `"ready"`. Both `WorldPage` and `DashboardPage` gate their spinner on
`status === "loading" || !world`.

Two real defects were found in that chain, plus one repaired data problem:

1. **`services/database.ts`'s `subscribe()` and `subscribeToRange()` had no
   error handling.** `onValue(ref, successCallback)` was called with no
   third (cancel/error) argument. If a listener is ever cancelled — a
   security-rules rejection being the most common cause — the success
   callback simply never fires again, and nothing downstream is told
   anything went wrong. Any screen waiting on that first callback to flip a
   loading flag would wait forever. **Fixed** by adding an `onError`
   parameter throughout the subscription chain
   (`subscribe` → `subscribeToRange` → `subscribeToPair` /
   `subscribeToWorld` / `subscribeToRecentHistory` / `subscribeToRitualPlan`
   / `subscribeToDayLedger`) that logs clearly
   (`console.error("[Same Sky] Realtime read failed at ...")`) and lets
   `worldStore` react.
2. **`worldStore.attach()` had no fallback if neither the pair nor the world
   subscription ever called back at all** (a stalled connection that
   resolves neither successfully nor with an error). **Fixed** with a
   15-second safety timer: if `status` is still `"loading"` when it fires,
   it force-sets `status: "error"` with a clear message. Combined with (1),
   `status` can now only ever end up as `"ready"` or `"error"` — never stuck.
   `DashboardPage` (which previously had no error branch at all, only a
   spinner-or-content check) now handles `status === "error"` the same way
   `WorldPage` already did.
3. **The actual data-flow problem in this session's case:** ruled out
   security rules directly — an unauthenticated shallow read of the database
   root correctly returned `"Permission denied"` (rules are in effect and
   working as intended), and the dev server's terminal (which proxies
   client console output) showed real browser activity from a signed-in
   session — including a `console.warn` from `useAmbientAudio`, which only
   runs once `WorldPage` has mounted — with **zero** permission or read
   errors anywhere in the log, before or after the fixes in this entry. An
   error-free, permanently-null `world` is exactly what you get when
   `subscribeToWorld` is listening at a path that has no data — most
   plausibly a pair whose world was written under the *old*, pre-fix
   `world/{worldId}` path (see the first bug fix in this project's history)
   and never migrated to the current `worlds/{worldId}`. **Fixed** by making
   world creation self-healing: when the world subscription reports
   `world === null` for an otherwise-valid pair, `worldStore` now calls
   `ensureWorld(pair.worldId, pair.id, getPartnerUids(pair))` — the same
   idempotent function pairing already uses, which only ever creates what is
   missing and never overwrites existing data — and the same listener then
   receives the newly created world automatically.

**Diagnostic logging added** (kept, not stripped — these are exactly the
breadcrumbs the next occurrence of this class of bug needs, and they are
`console.info`/`console.warn`/`console.error`, all visible under Chrome
DevTools' default console filter, unlike `console.debug` which is hidden
under "Verbose" by default): `worldStore.attach()` now logs when it attaches,
every pair snapshot received, every world snapshot received (and whether it
existed), every subscription error, and every self-heal attempt.

**Verification performed:**

- `npm run build` — passes.
- `npm run lint` — passes.
- `npm run dev` — restarted cleanly on port 5173 (Zustand store modules
  don't hot-reload their singleton state correctly, so a full restart was
  used rather than relying on HMR).
- Headless-browser smoke test of the unauthenticated golden path — clean,
  no console errors.
- Inspected the running dev server's own terminal log (which mirrors client
  console output) for the several hours it had been running: real signed-in
  browser activity is visible in it, and it contains zero permission or
  Firebase errors at any point, which is what directed the fix toward a
  missing/stale world document rather than a security-rules problem.
- **Still not independently confirmed in a real signed-in session.** This
  environment cannot complete Google OAuth. The fix is verified by tracing
  the complete lifecycle, closing every path that could leave `status`
  permanently `"loading"`, and reasoning from the real (error-free) log
  output captured from an actual browser session against this exact code.
  The project owner reloading World and Growth is the remaining
  confirmation step. If a world was self-healed, the console will show the
  `"No world exists at ... Creating it now"` warning — worth checking for
  once, since it points at exactly which pair had the stale data.

## 2026-08-04 — Three WCAG AA contrast failures, found by computing real ratios

**Symptom:** None reported — found during a self-directed production-polish
pass by computing actual WCAG contrast ratios for the design tokens rather
than eyeballing them, after noticing the landing page's hero text is fixed
white over a backdrop (`SkyBackdrop`) that ranges from near-black to bright
midday blue.

**What was actually failing**, computed against the real hex values in
`index.css`:

1. White hero text on `HomePage`, `PairPage` and the `WorldPage` hero label
   over a bright-day sky: as low as **1.27:1** (horizon colour) and **2.05:1**
   (mid-sky colour) against the required 4.5:1 for normal text. Night skies
   were always fine; only the brighter hours failed, which is exactly the
   kind of bug that is easy to never notice if you only ever look at the
   screenshot you happened to take at one time of day.
2. `--ss-ink-faint` (light theme) — used for every caption, hint and
   timestamp in the product — measured 3.71:1 against `--palette-paper-0`
   and 3.94:1 against `--palette-paper-50`, both under 4.5:1.
3. `--ss-ember` — used for every validation and error message in the
   product (`text-ember`, `border-ember` in `Field.tsx`, the `role="alert"`
   paragraphs on `LoginPage`/`RegisterPage`/`PairPage`) — measured 4.04:1.

**Fix:**

1. Added a scrim behind the text on all three affected screens: a uniform
   `bg-black/50` on `HomePage` and `PairPage` (both show text over open
   sky), a bottom `gradient-to-t from-black/55` on `WorldPage` (text sits
   only at the bottom of its hero, over the world scene's darker ground).
   Verified the night appearance is visually unaffected (already dark
   enough that the scrim is barely perceptible) and confirmed by
   recomputing the worst-case ratio afterward.
2. Added `--palette-bark-450` (`#6f755e`), a new shade between the existing
   400 and 500, and pointed light-theme `--ss-ink-faint` at it — 4.79:1
   against white, 4.52:1 against canvas. Dark theme's `--ss-ink-faint`
   already passed (4.79:1) and was left alone.
3. Changed light-theme `--ss-ember` from `--palette-ember-500` to
   `--palette-ember-600` — 5.89:1 against white. Checked every direct use of
   the base `ember` token first (`grep`) to confirm the only consumers are
   error/validation states, so darkening it has no decorative side effect
   elsewhere (the one purely decorative use, a flower centre in
   `WorldScene`, references a raw palette value directly and was untouched).

**Also fixed in the same pass, same root cause (missing accessible name):**

- The daily-note vessel picker's five icon-only buttons had only a `title`
  attribute — added `aria-label` alongside it.
- The memory-photo picker button loses all its visible text once a photo is
  chosen (its content becomes just `<img alt="">`), leaving it with no
  accessible name at all — added a conditional `aria-label="Change photo"`.

**Verification performed:** contrast ratios recomputed with the WCAG
relative-luminance formula for every fix above (not estimated); `npm run
build` and `npm run lint` clean after each change; a headless-browser
keyboard-tab-order check confirmed visible focus rings and correct order on
the landing page; a fresh screenshot confirmed the night-time appearance is
unchanged. **The daytime scrim was not visually re-verified** — this
environment cannot change system time, and the screenshots taken during this
session were all captured at night; the fix is verified by the contrast math
alone. Worth a look at midday in a real session.

---

# Definition of Success

The project is complete when Same Sky delivers:

- A premium user experience
- A persistent shared world
- Meaningful long-term progression
- Calm, beautiful interactions
- Stable, production-ready architecture
- Excellent accessibility and performance

The objective is to build a polished, emotionally meaningful product rather
than simply implementing features.

---

# Session Log

## Session 1

Completed: Authentication, Firebase integration, pairing system, protected
routes, initial project architecture, project documentation.

## Session 2

Completed:

- Repaired a non-building repository (Tailwind never wired, `AppBootstrap`
  calling a non-existent store method, `loading`/`isPaired` logic bugs, a
  world-path mismatch that silently orphaned every new world)
- Full design system and reusable UI primitive layer
- Canonical type layer across the whole domain
- Complete Ritual Engine (23 rituals) and World Progression Engine (tree,
  garden, pond, wildlife, sky, harmony, vitality)
- Premium Shared World screen, Settings, Profile, Growth (dashboard) pages
- Daily Notes, Shared Journal, Memories — services, hooks and pages
- Planning (weekly/monthly intentions) and Reflection generation
- `CompletionChart` and `DomainShareBars` progress charts on Growth
- Historical Timeline — service, page, and event writes wired from pairing
  (world created), the world progression engine (tree stage milestones,
  detected without storing the stage), journal entries and memories
- Verified via `npm run build`, `npm run lint`, and repeated headless-browser
  smoke tests of the unauthenticated golden path (landing → sign-in) after
  every batch, with a console-error check each time. Authenticated screens
  (World, Pair, Journal, Memories, Growth, Timeline) are verified by
  type-checking and lint only — visual verification requires a real Google
  sign-in this environment cannot perform.
- Committed as a single checkpoint (`Phase: Foundation, Shared World &
  Connection Features`); Planning/Reflection/Timeline work is staged for
  this session's closing commit.

Next Session:

- Accessibility audit (keyboard, screen reader, contrast)
- Performance pass (route-level code splitting, Lighthouse)
- Resolve the two open product decisions above (ambient audio content,
  Memories storage at scale) with the project owner before building further
  in those areas
- Personalization, once its scope is clarified

## Session 3

A regression report came in from a real signed-in session: the Growth page
caused an infinite render loop ("Maximum update depth exceeded" /
"getSnapshot should be cached"). No new feature work was done this session
per the report's own instruction — this was a stop-and-fix.

Completed:

- Found and fixed the root cause: an unstable Zustand selector fallback
  (`state.ritualPlan?.ritualIds ?? []`) in `DashboardPage.tsx` that produced
  a new array reference on every call while `ritualPlan` was still `null`.
  Full write-up under "Bug Fixes" above.
- Audited every store selector in the codebase for the same defect class;
  no other instances found.
- Verified via `npm run build`, `npm run lint`, `npm run dev` (starts
  cleanly on port 5173), and a headless-browser smoke test of the
  unauthenticated golden path with a settle delay and console-error check.
- Reviewed loading-state logic on World, Growth, Journal, Memories and
  Timeline at the code level; none has a path that can get stuck.
- Could not re-observe the original crash firsthand or confirm the fix in a
  real signed-in session — this environment has no way to complete Google
  OAuth. The project owner should reload the Growth page in their own
  session to confirm before this is considered fully closed.

**Continued, same session:** a follow-up report — console now clean, but
World and Growth both stuck on an infinite loading spinner. Treated as a
loading/data-flow bug, not a render bug, per the report's framing. No new
feature work done here either.

Completed:

- Traced the full loading lifecycle from `DashboardLayout`'s `attach()` call
  through `pairs/{pairId}` → `worlds/{worldId}` subscriptions to the
  `status` field both pages gate on.
- Found and fixed two real defects that could each independently cause a
  permanent hang: no error handling anywhere in the `subscribe()` /
  `subscribeToRange()` chain, and no fallback in `worldStore.attach()` if a
  subscription never called back at all (success or failure). Added a
  15-second safety timeout as a hard backstop.
- Found the specific data problem in this case by inspecting the running
  dev server's own log (which mirrors real browser console output): no
  permission errors anywhere, ruling out security rules, pointing instead
  at a world document that genuinely does not exist at the path being read
  — almost certainly stale data from before this project's very first
  `world/` → `worlds/` path fix. Made world creation self-healing in
  `worldStore` rather than leaving that pair's data permanently orphaned.
- Gave `DashboardPage` a proper error state — it previously had none.
- Added `console.info`/`warn`/`error` diagnostics through the whole
  lifecycle (deliberately not `console.debug`, which Chrome hides by
  default) and left them in place rather than stripping them.
- Verified via `npm run build`, `npm run lint`, a full dev server restart
  (Zustand store singletons don't survive HMR cleanly), and another
  headless-browser smoke test of the unauthenticated path.
- Full write-up under "Bug Fixes" above.
- Again could not confirm in a real signed-in session for the same reason
  as above.

Next Session:

- Project owner to confirm both fixes in a real signed-in session — reload
  World and Growth, confirm they render (or show a clear error rather than
  hang), and check the console for the self-heal warning
- Then resume where Session 2 left off: accessibility audit, performance
  pass, the two open product decisions, personalization scope

## Session 4

Switched from bug-fixing back to production implementation, per instruction:
audit every page against the specification, implement everything missing,
and do a real polish pass — not a plan for one — across UX, copy, animation,
audio, accessibility and performance. Explicitly told to keep going across
every page rather than stop after one.

Completed:

- Audited every page against `overview_and_specification.md` and
  `project_status.md` and prioritized the gap list before writing code
- Built the immediate-feedback system the specification explicitly requires
  and the product did not yet have: a synthesised chime service (Web Audio
  API, no external assets — `services/audio.ts`) for honouring/releasing a
  ritual, sending/opening a note, saving a memory, saving a journal entry,
  and reaching a tree-stage milestone; paired with real visual responses —
  a sparkle burst on `RitualCard`, a pond ripple in `WorldScene`, and a
  dismissible `MilestoneToast`
- Built dynamic weather (`deriveWeather`) — the one Future Systems item with
  no implementation at all — seeded per world per local day, rendered as
  gentle rain in `WorldScene`, and tied into ambient audio so the rain bed
  overrides time-of-day regardless of hour
- Added Google's own sign-in mark to both auth buttons
- Copy pass: removed gamification-adjacent "energy" language and a bare
  unlabelled number from the Growth page, replacing both with the product's
  established "tend to" vocabulary
- Ran a real accessibility pass, not just an audit: computed actual WCAG
  contrast ratios for every text/background token pair in both themes
  (rather than eyeballing them) and found three real failures — white hero
  text over a bright sky as low as 1.27:1, light-mode `--ss-ink-faint` at
  3.71–3.94:1, light-mode `--ss-ember` (every error message in the product)
  at 4.04:1 — fixed all three and recomputed to confirm. Also found and
  fixed two icon-only controls with no accessible name. Verified keyboard
  tab order and focus rings in a real headless browser
- Ran a real performance pass, not just a plan: route-level `React.lazy`
  code splitting for every page but the landing page, with a shared
  `RouteSuspense` per layout so chrome (header/nav) stays mounted during a
  route's chunk load. Verified in a real browser (all lazy routes load with
  zero console errors) and by build output — main JS chunk dropped from
  168 KB to 84 KB gzipped
- Spot-checked responsive behaviour at 375px/768px/1280px — no horizontal
  overflow found
- Verified via `npm run build` and `npm run lint` after every change in this
  session (all clean), and repeated headless-browser checks: the
  unauthenticated golden path, a full lazy-route flow (landing → login →
  register → 404, each a separate chunk), a mobile/tablet screenshot pass,
  and a keyboard-navigation tab-order check
- Full write-ups for the three contrast/accessibility fixes under "Bug
  Fixes" above, since they are genuine defects even though nobody reported
  them

Not done, and why:

- AI Reflection using an actual model — no credentials to add one
  unilaterally; the existing deterministic reflection engine already
  satisfies the specification's five AI bullet points without one
- Notifications, deeper personalization, Firebase Storage for Memories,
  ambient audio *assets* — every one of these was already correctly
  identified in an earlier session as needing a product decision or content
  this pass cannot create, and that has not changed; see "Product Decisions
  Needed"
- Automated tests, offline support, production monitoring — real gaps,
  not yet started

Next Session:

- Project owner to confirm this session's work in a real signed-in session,
  starting with the items under "Immediate Next Priority" item 0 — in
  particular the daytime hero-text scrim, which was verified only by
  contrast math, never seen at an actual bright hour
- Resolve the standing "Product Decisions Needed" list
- Automated tests are worth prioritizing next, ahead of further features,
  now that the surface area is this large

## Session 5

Instructed to stop auditing and continue implementing production features
continuously, page by page, in a fixed priority order: World, then Growth,
then Journal, then Memories, then Timeline — running a build and a browser
check after each one and updating this file immediately, without stopping
after a single page.

Completed, one page at a time, each verified with `npm run build` +
`npm run lint` (clean every time) + a headless-browser check immediately
after that page before moving to the next:

- **World**: a quick-access ambient-sound toggle in the hero itself (the
  specification's audio-control requirement was previously reachable only
  through Settings); native-tooltip hover interaction on the tree, garden
  and pond, with the tree settling slightly toward the viewer; a gentle
  entrance transition on the content below the hero
- **Growth**: `YearChart`/`useYearlyOverview` — a trailing-12-month bar
  chart, the "yearly: major world evolution" timescale the specification
  asks for that nothing on the page showed until now (a one-time read, not
  a subscription); an empty-state message for `GrowthPeriod`'s intentions
  list, which previously rendered nothing at all when empty; matching
  entrance transition
- **Journal**: tactile press feedback on the mood picker and edit button;
  deliberately did *not* colour-code mood by tone after considering it, to
  avoid quietly implying some moods are better than others; matching
  entrance transition
- **Memories**: found and fixed a real missing feature while reading the
  page, not just polish — a memory's story was captured on save and then
  permanently unreachable, since `MemoryTile` only ever showed title/kind/
  date. Added a `MemoryDetail` dialog opened by clicking a tile. Also gave
  the grid tiles hover/press affordance they previously lacked entirely,
  added `lg:grid-cols-4`, and matched the entrance transition
- **Timeline**: real timeline visual language instead of a plain list — a
  connecting thread behind each year's markers, and colour-differentiated
  event icons drawn from the same five tones already used for ritual
  domains (nothing new added to the palette); matching entrance transition

This file was updated after each individual page, not only at the end, per
the session's instruction.

Not done, and why: everything under "Not Yet Implemented" below is
unchanged from Session 4 — none of it was in scope for this session's fixed
priority list, and the reasons already on record (credentials, product
decisions, content this pass cannot create) still hold.

Next Session:

- Project owner to confirm all of Session 5's additions in a real signed-in
  session — see the updated "Immediate Next Priority" item 0 for the
  specific things worth checking
- Resolve the standing "Product Decisions Needed" list
- Automated tests remain the next priority once product decisions are
  resolved

---

# Instructions for Claude

At the end of every engineering session, update this file.

Always update:

- Last Updated
- Current Phase
- Completed work
- Current progress
- Immediate Next Priority
- Session Log

This file should always represent the current state of the repository and
allow a future engineering session to continue immediately without requiring
additional explanation.
