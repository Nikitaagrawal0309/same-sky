/**
 * The shared type surface of Same Sky.
 *
 * Import from `../types` rather than reaching into individual files. Doing so
 * keeps call sites stable when a domain grows large enough to be split, and
 * makes the full vocabulary of the product visible in one place.
 */

export type { AuthError, AuthSession, AuthStatus } from "./auth";

export type { DatabaseRoot, DatabaseSchema, DateKey, MonthKey, WeekKey } from "./database";

export type { JournalEntry, JournalMood, JournalMoodDefinition } from "./journal";
export { JOURNAL_MOODS } from "./journal";

export type { Memory, MemoryImage, MemoryKind, MemoryKindDefinition } from "./memory";
export { MEMORY_IMAGE_MAX_EDGE, MEMORY_KINDS } from "./memory";

export type { DailyNote, NoteVessel } from "./note";
export { NOTE_MAX_LENGTH } from "./note";

export type {
  CreatePairPayload,
  JoinPairPayload,
  Pair,
  PairInvite,
  PairLookupResult,
  PairStatus,
} from "./pair";

export type {
  DomainShare,
  PartnerPeriodSummary,
  Plan,
  PlanIntention,
  PlanPeriod,
  ProgressPoint,
  ProgressSeries,
  Reflection,
  ReflectionObservation,
  ReflectionSummary,
  ReflectionTone,
} from "./planning";

export type {
  DailyRitualLedger,
  DailyRitualRecord,
  RitualAccent,
  RitualCadence,
  RitualDefinition,
  RitualDomain,
  RitualEntry,
  RitualIconName,
  RitualId,
  RitualPlan,
  RitualStatus,
} from "./ritual";

export type {
  Hemisphere,
  MotionPreference,
  PartnerSummary,
  ThemePreference,
  UserPreferences,
  UserProfile,
} from "./user";
export { DEFAULT_USER_PREFERENCES } from "./user";

export type {
  GardenState,
  PartnerContribution,
  PondState,
  Season,
  SkyPhase,
  SkyState,
  TreeStage,
  TreeStageId,
  TreeState,
  WildlifePresence,
  WildlifeSpecies,
  WorldDaySummary,
  WorldEvent,
  WorldEventType,
  WorldSnapshot,
  WorldState,
} from "./world";
