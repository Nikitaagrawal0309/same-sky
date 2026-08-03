# PROJECT_STATUS.md

# Same Sky
## Live Project Status

Last Updated: 2026-08-03

Current Phase:
Core Product Complete → Personalization, Accessibility & Production Polish Next

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

---

## Not Yet Implemented

- AI Reflection (deliberately deferred — see Known Issues)
- Notifications / daily invitation delivery
- Personalization beyond theme/motion/hemisphere/ambient audio (no per-user
  accent colour, no custom vessel/mood sets, etc.)
- A dedicated accessibility pass beyond what was built in as each component
  was written (focus management, labels, `aria-live`, reduced motion are all
  already in place; a systematic audit has not been run)
- A dedicated performance pass (route-level code splitting, image lazy
  loading beyond `loading="lazy"` on avatars/memories, bundle analysis)
- Offline support
- Automated tests
- Production analytics/error monitoring
- Ambient audio assets (day/night/rain beds — content, not code)

---

# Current Engineering Goal

Personalization, accessibility, performance and production polish on top of
a now feature-complete product: every system named in the specification
(shared world, rituals, notes, journal, memories, planning, reflection,
timeline, progress charts) exists and is wired end to end.

---

# Immediate Next Priority

1. Accessibility audit — keyboard-only pass through every flow, screen
   reader spot-check, colour contrast check against the design tokens in
   `index.css` (light and dark)
2. Performance pass — route-level `React.lazy`/code splitting (the bundle is
   currently one chunk per vendor, not per route), Lighthouse pass
3. Personalization — worth product input before building further (see
   "Product Decisions Needed" below)
4. Decide on and source ambient audio assets, or explicitly decide the
   product ships silent for now
5. Decide on Firebase Storage vs. continuing with inline data-URL images for
   Memories once real photo volume is understood

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
