# PROJECT_STATUS.md

# Same Sky
## Live Project Status

Last Updated: 2026-08-03

Current Phase:
Core Product Complete → Reflection & Planning Systems Next

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
- ✅ `DashboardPage` ("Growth") — 14-day energy chart, harmony/vitality/
  lifetime stats, non-competitive per-partner contribution comparison

### Daily Notes, Journal, Memories

- ✅ Daily Notes — one note per person per local day, five vessel types,
  idempotent "opened" tracking, embedded in the World screen
- ✅ Shared Journal — shared reading, author-only editing (enforced in the
  service layer), five non-evaluative moods, full page with composer
- ✅ Memories — title/story/date/kind, optional photo (downscaled + JPEG-
  encoded client-side to a data URL — see Known Issues), grid page
- ✅ Routing + navigation extended to include Journal and Memories

---

## Partially Implemented

- 🟡 `DashboardPage` shows real recent-history data but has no weekly/monthly
  reflection text yet, and no planning UI — that is the next phase
- 🟡 Memories are not yet reflected onto the world's permanent timeline
  (`WorldEvent`/timeline type exists; nothing currently writes to it)

---

## Not Yet Implemented

- Weekly Planning / Monthly Planning (types exist in `types/planning.ts`;
  no service or UI yet)
- Weekly Reflection / Monthly Reflection generation (types exist; no
  generation logic yet)
- Historical Timeline screen (`ROUTES` reserves the path; no service or page)
- AI Reflection (deliberately deferred — see Known Issues)
- Notifications / daily invitation delivery
- Offline support
- Automated tests
- Production analytics/error monitoring
- Ambient audio assets (day/night/rain beds — content, not code)

---

# Current Engineering Goal

Build the Reflection & Planning layer on top of the now-complete ritual and
world-progression foundation: weekly/monthly intentions, generated
reflections from stored history, and the historical timeline.

---

# Immediate Next Priority

1. `services/planning.ts` — create/read weekly & monthly plans (intentions)
2. Reflection generation — pure function over `WorldDaySummary` history,
   mirroring the "derive, don't store computed state" pattern already used
   by `services/world.ts`
3. `ProgressSeries` / `DomainShare` charts (types already defined in
   `types/planning.ts`) on the Growth page
4. Historical Timeline page, fed by `WorldEvent` — and start actually writing
   to `timeline/{worldId}` from rituals, notes, journal entries and memories
5. Reflect saved Memories onto the timeline (currently isolated)

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

---

# Known Issues

- **No ambient audio assets.** The playback/cross-fade engine
  (`services/audio.ts`) is complete and silently no-ops if a file is
  missing; recording or licensing `day.mp3` / `night.mp3` / `rain.mp3` under
  `public/audio/` is a content decision for the project owner, not something
  this pass should invent.
- **Memory photos are stored as inline data URLs in Realtime Database**,
  downscaled to at most 1400px and JPEG-encoded client-side
  (`services/storage.ts`). This was a deliberate choice to avoid introducing
  Firebase Storage (a paid/credentialed service change) without approval. It
  is fine for a meaningful handful of photos; if photo volume grows, moving
  to object storage is a product/infra decision that needs sign-off, not a
  silent architecture change.
- `npm audit` reports 2 high-severity advisories in transitive dependencies;
  not yet triaged.

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
- Verified via `npm run build`, `npm run lint`, and a headless-browser smoke
  test of the unauthenticated golden path (landing → sign-in), with a
  console-error check. Authenticated screens (World, Pair, Journal,
  Memories, Growth) are verified by type-checking and lint only — visual
  verification requires a real Google sign-in this environment cannot
  perform.

Next Session:

- Build Planning (weekly/monthly intentions) and Reflection generation
- Build the Historical Timeline and start writing to it
- Add progress charts (`ProgressSeries`/`DomainShare`) to Growth
- Personalization, accessibility pass, performance pass, then production
  polish

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
