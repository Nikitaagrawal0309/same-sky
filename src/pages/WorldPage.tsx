import { useState } from "react";
import { Sparkles, Volume2, VolumeX } from "lucide-react";

import { useProfile } from "../hooks/useAuth";
import {
  useHasPartner,
  usePartner,
  useSky,
  useTodayRituals,
  useTreeStageCelebration,
  useWorldSnapshot,
  useWorldState,
  useWorldStatus,
} from "../hooks/useWorld";
import { useWorldStore } from "../store/worldStore";
import { useAmbientAudio } from "../hooks/useAmbientAudio";
import { useLiveWeather } from "../hooks/useLiveWeather";
import { useNightChimes } from "../hooks/useNightChimes";
import { useAppearanceControls } from "../hooks/useTheme";
import { useTodayNotes } from "../hooks/useNotes";
import { RITUAL_CATALOGUE } from "../services/ritual";
import { playChime } from "../services/audio";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/Card";
import { NaturePanel } from "../components/ui/NaturePanel";
import { AvatarPair } from "../components/ui/Avatar";
import { Spinner } from "../components/ui/Icon";
import { DailyNoteCard } from "../components/world/DailyNote";
import { JournalHistory } from "../components/world/JournalHistory";
import { LiveClock } from "../components/world/LiveClock";
import { ProgressCharts } from "../components/world/ProgressCharts";
import { TrackersPanel } from "../components/trackers/TrackersPanel";
import { MilestoneToast } from "../components/world/MilestoneToast";
import { RitualCard } from "../components/world/RitualCard";
import { RitualPicker } from "../components/world/RitualPicker";
import { SkyBackdrop } from "../components/world/SkyBackdrop";
import { WorldScene } from "../components/world/WorldScene";
import { WorldSummary } from "../components/world/WorldSummary";
import { clamp01, firstNameOf } from "../utils/helpers";

/**
 * The shared world.
 *
 * Everything else in the product exists to support what happens on this
 * screen: a real sky overhead, a garden and a tree that answer to what two
 * people actually did, and today's small, unhurried invitations to add to it.
 */
export default function WorldPage() {
  const profile = useProfile();
  const partner = usePartner();
  const hasPartner = useHasPartner();

  const sky = useSky();
  const world = useWorldState();
  const snapshot = useWorldSnapshot();
  const status = useWorldStatus();
  const error = useWorldStore((state) => state.error);

  const { statuses, honour, release } = useTodayRituals();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pulseSignal, setPulseSignal] = useState(0);
  const updatePractice = useWorldStore((state) => state.updatePractice);
  const { celebration, dismiss } = useTreeStageCelebration(world?.worldId, snapshot?.tree.stage);
  const { preferences, update: updatePreferences } = useAppearanceControls();

  const { mine: myNote, fromPartner: noteFromPartner, send: sendNote, open: openNote } = useTodayNotes();
  const [noteRevealOpen, setNoteRevealOpen] = useState(false);
  const noteWaiting = noteFromPartner !== null && noteFromPartner.openedAt === null;

  // The real weather where this person is; clear until (or unless) we know it.
  const live = useLiveWeather();
  const weather = live.weather?.condition ?? "clear";

  useAmbientAudio(sky, weather);

  // After dark: no birds, just the breeze and the odd wind chime.
  const daylight = clamp01((sky.sunAltitude + 0.2) * 2.5);
  useNightChimes(daylight < 0.35);

  async function handleRevealNote(): Promise<void> {
    setNoteRevealOpen(true);

    if (noteWaiting) {
      playChime("note-opened");
    }

    await openNote();
  }

  async function handleHonour(ritualId: Parameters<typeof honour>[0]): Promise<boolean> {
    const created = await honour(ritualId);

    if (created) {
      setPulseSignal((tick) => tick + 1);
    }

    return created;
  }

  const firstName = profile ? firstNameOf(profile.displayName) : null;
  const partnerFirstName = partner ? firstNameOf(partner.displayName) : undefined;

  if (status === "error") {
    return (
      <div className="ss-container py-16">
        <EmptyState
          title="Your world didn't open"
          description={error ?? "Something interrupted the connection. Refreshing usually helps."}
        />
      </div>
    );
  }

  if (status === "idle" || status === "loading" || !world || !snapshot) {
    return (
      <div className="grid min-h-[60svh] place-items-center">
        <Spinner label="Opening your world" />
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="relative h-[54svh] min-h-96 w-full overflow-hidden">
        <SkyBackdrop sky={sky} weather={weather} className="absolute inset-0" />
        <WorldScene
          worldId={world.worldId}
          snapshot={snapshot}
          weather={weather}
          weatherIntensity={live.weather?.intensity}
          season={sky.season}
          daylight={daylight}
          pulseSignal={pulseSignal}
          noteFromPartner={
            hasPartner && noteFromPartner
              ? { vessel: noteFromPartner.vessel, waiting: noteWaiting }
              : null
          }
          onNoteClick={() => void handleRevealNote()}
          fill
        />

        {/* The ground beneath is dark enough on its own most of the time,
            but a bright midday sky can still show through near the top of
            this label on a short hero — this guarantees the text stays
            legible regardless. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent"
        />

        <div className="ss-container absolute inset-x-0 top-4 z-20 sm:top-6">
          <div className="flex items-start justify-between gap-3">
            <LiveClock live={live} />

            <button
              type="button"
              onClick={() => void updatePreferences({ ambientAudio: !preferences.ambientAudio })}
              aria-pressed={preferences.ambientAudio}
              aria-label={preferences.ambientAudio ? "Turn off ambient sound" : "Turn on ambient sound"}
              title={preferences.ambientAudio ? "Turn off ambient sound" : "Turn on ambient sound"}
              className="grid size-10 place-items-center rounded-full bg-black/30 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/45 hover:text-white"
            >
              {preferences.ambientAudio ? (
                <Volume2 aria-hidden className="size-4.5" strokeWidth={1.6} />
              ) : (
                <VolumeX aria-hidden className="size-4.5" strokeWidth={1.6} />
              )}
            </button>
          </div>
        </div>

        <div className="ss-container absolute inset-x-0 bottom-0 pb-5 sm:pb-8">
          <p className="ss-hand text-xl text-amber-200 drop-shadow sm:text-3xl">{sky.label}</p>
          <h1 className="font-display text-[1.9rem] leading-tight font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:text-5xl">
            {greetingFor(sky.phase)}
            {firstName ? `, ${firstName}` : ""}!
          </h1>

          {partner ? (
            <div className="mt-3 flex items-center gap-3">
              <AvatarPair
                people={[
                  { name: profile?.displayName ?? "You", photoURL: profile?.photoURL },
                  { name: partner.displayName, photoURL: partner.photoURL },
                ]}
              />
              <span className="text-sm text-white/70">
                You and {partnerFirstName}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="ss-container mt-6 space-y-5 sm:mt-10 sm:space-y-8 motion-safe:animate-(--animate-fade-in)">
        <WorldSummary world={world} snapshot={snapshot} />

        {hasPartner ? (
          <DailyNoteCard
            mine={myNote}
            fromPartner={noteFromPartner}
            send={sendNote}
            revealOpen={noteRevealOpen}
            onCloseReveal={() => setNoteRevealOpen(false)}
          />
        ) : (
          <NaturePanel theme="blossom" eyebrow="saving a spot" title="Waiting for your person">
            <p className="max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
              Your world is open and already growing. It will feel different the
              day your person joins. Until then, everything you grow here is
              waiting for them too.
            </p>
          </NaturePanel>
        )}

        <NaturePanel
          theme="lake"
          eyebrow="little things, every day"
          title="Today"
          description="No amount is owed here. Honour whatever fits the day you're actually having."
          action={
            <Button variant="quiet" size="sm" onClick={() => setPickerOpen(true)}>
              Your practice
            </Button>
          }
        >
          <div>
            {statuses.length === 0 ? (
              <EmptyState
                icon={<Sparkles aria-hidden className="size-8" strokeWidth={1.3} />}
                title="No rituals chosen yet"
                description="Choose a few small things worth returning to. You can change them any time."
                action={
                  <Button onClick={() => setPickerOpen(true)}>Choose your practice</Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {statuses.map((ritualStatus) => (
                  <RitualCard
                    key={ritualStatus.definition.id}
                    status={ritualStatus}
                    partnerName={partnerFirstName}
                    onHonour={() => handleHonour(ritualStatus.definition.id)}
                    onRelease={() => release(ritualStatus.definition.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </NaturePanel>

        <TrackersPanel partnerName={partnerFirstName ?? null} />

        <ProgressCharts />

        <JournalHistory />
      </div>

      <RitualPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedIds={statuses.map((status) => status.definition.id)}
        onSave={updatePractice}
      />

      <p className="sr-only">{RITUAL_CATALOGUE.length} rituals exist across the practice.</p>

      <MilestoneToast stage={celebration} onDismiss={dismiss} />
    </div>
  );
}

/** A cheerful hello that follows the viewer's own sky. */
function greetingFor(phase: ReturnType<typeof useSky>["phase"]): string {
  switch (phase) {
    case "dawn":
    case "morning":
      return "Good morning";
    case "day":
      return "Hello there";
    case "golden":
      return "Good afternoon";
    case "dusk":
      return "Good evening";
    default:
      return "Sweet dreams";
  }
}
