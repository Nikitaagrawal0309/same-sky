# PROJECT_STATUS.md

# Same Sky
## Live Project Status

Last Updated: 2026-08-04

Current Phase:
Production Polish Complete → Personalization Scope & Content Decisions Next

Project Status:
Active Development

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

0. **Confirm every fix in "Bug Fixes" below in a real signed-in session** —
   this environment cannot complete Google OAuth, so nothing authenticated
   (World, Growth, the contrast fixes, the new chime/weather/celebration
   features) has been seen firsthand by a human yet. Load World and Growth;
   honour a ritual and listen/watch for the chime and sparkle; check the
   Growth stat grid reads "X rituals" rather than a bare number; on a rainy
   day for that world, confirm rain renders and the ambient bed switches.
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
