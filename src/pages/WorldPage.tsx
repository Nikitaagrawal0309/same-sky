import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { useProfile } from "../hooks/useAuth";
import {
  useHasPartner,
  useNow,
  usePartner,
  useSky,
  useTodayRituals,
  useTreeStageCelebration,
  useWorldSnapshot,
  useWorldState,
  useWorldStatus,
} from "../hooks/useWorld";
import { useWorldStore } from "../store/worldStore";
import { useUiStore } from "../store/uiStore";
import { useAmbientAudio } from "../hooks/useAmbientAudio";
import { RITUAL_CATALOGUE } from "../services/ritual";
import { deriveWeather } from "../services/world";
import { Button } from "../components/ui/Button";
import { Card, EmptyState, SectionHeading } from "../components/ui/Card";
import { AvatarPair } from "../components/ui/Avatar";
import { Spinner } from "../components/ui/Icon";
import { DailyNoteCard } from "../components/world/DailyNote";
import { MilestoneToast } from "../components/world/MilestoneToast";
import { RitualCard } from "../components/world/RitualCard";
import { RitualPicker } from "../components/world/RitualPicker";
import { SkyBackdrop } from "../components/world/SkyBackdrop";
import { WorldScene } from "../components/world/WorldScene";
import { WorldSummary } from "../components/world/WorldSummary";
import { firstNameOf } from "../utils/helpers";

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
  const now = useNow();
  const hemisphere = useUiStore((state) => state.hemisphere);
  const world = useWorldState();
  const snapshot = useWorldSnapshot();
  const status = useWorldStatus();
  const error = useWorldStore((state) => state.error);

  const { statuses, honour, release } = useTodayRituals();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pulseSignal, setPulseSignal] = useState(0);
  const updatePractice = useWorldStore((state) => state.updatePractice);
  const { celebration, dismiss } = useTreeStageCelebration(world?.worldId, snapshot?.tree.stage);

  const weather = useMemo(
    () => (world ? deriveWeather(world.worldId, now, hemisphere) : "clear"),
    [world, now, hemisphere],
  );

  useAmbientAudio(sky, weather);

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
      <div className="relative h-[46svh] min-h-80 w-full overflow-hidden sm:h-[54svh]">
        <SkyBackdrop sky={sky} className="absolute inset-0" />
        <WorldScene
          worldId={world.worldId}
          snapshot={snapshot}
          weather={weather}
          pulseSignal={pulseSignal}
          className="absolute inset-0 rounded-none"
        />

        {/* The ground beneath is dark enough on its own most of the time,
            but a bright midday sky can still show through near the top of
            this label on a short hero — this guarantees the text stays
            legible regardless. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent"
        />

        <div className="ss-container absolute inset-x-0 bottom-0 pb-8">
          <p className="text-sm font-medium tracking-[0.18em] text-white/75 uppercase">
            {sky.label}
            {firstName ? ` · ${firstName}` : ""}
          </p>

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

      <div className="ss-container mt-10 space-y-12">
        <WorldSummary world={world} snapshot={snapshot} />

        {hasPartner ? (
          <DailyNoteCard />
        ) : (
          <Card tone="sunken" padding="md">
            <p className="text-[0.95rem] leading-relaxed text-ink-soft">
              Your world is open and already growing. It will feel different the
              day your person joins — until then, everything you tend to here is
              waiting for them too.
            </p>
          </Card>
        )}

        <section>
          <SectionHeading
            title="Today"
            description="No amount is owed here. Honour whatever fits the day you're actually having."
            action={
              <Button variant="quiet" size="sm" onClick={() => setPickerOpen(true)}>
                Your practice
              </Button>
            }
          />

          <div className="mt-6">
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
        </section>
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
