import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Shovel } from "lucide-react";

import { useBadges, useGarden } from "../../hooks/useGarden";
import { usePrefersStillness } from "../../hooks/useTheme";
import { badgeUnlocking } from "../../services/badges";
import { plantGrowth, plantStageLabel } from "../../services/plants";
import type { GardenWeatherId, SeedDefinition } from "../../types/garden";
import { GARDEN_WEATHERS, SEEDS } from "../../types/garden";
import { formatDayAndMonth } from "../../utils/date";
import { cx } from "../../utils/helpers";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { GardenIsland } from "./GardenIsland";
import { PlantArt } from "./PlantArt";

/**
 * The seed garden.
 *
 * Six shared plots you sow by choice. Three seeds are available from the
 * start; the rest unlock with badges earned on the Timeline. A sown plant
 * grows with every ritual either of you honours after the day it was sown,
 * so fruit trees take real, steady care to bear fruit.
 */
export function SeedGarden() {
  const still = usePrefersStillness();
  const { plots, weather, sow, uproot, setWeather, local } = useGarden();
  const { unlockedSeeds, unlockedWeathers, history } = useBadges();

  const [sowingPlot, setSowingPlot] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState<string | null>(null);

  const inspected = inspecting ? plots[inspecting] : undefined;
  const inspectedSeed = inspected ? SEEDS.find((seed) => seed.id === inspected.seedId) : undefined;
  const activeWeather = unlockedWeathers.has(weather) ? weather : "clear";

  return (
    <div className="rounded-3xl bg-white/70 p-4 shadow-soft backdrop-blur-sm dark:bg-white/5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <div>
          <h3 className="text-lg font-semibold text-ink">Your seed garden</h3>
          <p className="text-sm text-ink-faint">
            Pick what to sow. Everything grows as the two of you keep showing up.
          </p>
        </div>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {unlockedSeeds.size} of {SEEDS.length} seeds unlocked
        </p>
      </div>

      {/* Garden weather, unlocked with weather badges */}
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-1" role="radiogroup" aria-label="Garden weather">
        {GARDEN_WEATHERS.map((option) => {
          const unlocked = unlockedWeathers.has(option.id);
          const badge = badgeUnlocking({ weatherId: option.id });

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={activeWeather === option.id}
              disabled={!unlocked}
              onClick={() => void setWeather(option.id)}
              title={unlocked ? option.name : `Earn the ${badge?.name ?? ""} badge to unlock`}
              className={cx(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold whitespace-nowrap transition-all",
                activeWeather === option.id
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
                  : "border-transparent bg-white/80 text-ink-soft hover:border-emerald-200 dark:bg-white/10",
                !unlocked && "cursor-not-allowed opacity-45",
              )}
            >
              <span aria-hidden>{option.emoji}</span>
              {option.name}
              {!unlocked ? <Lock aria-hidden className="size-3" /> : null}
            </button>
          );
        })}
      </div>

      {/* The island: nine plots on a floating patch of meadow */}
      <div className="relative mt-4 overflow-hidden rounded-3xl px-2 pt-8 pb-3 sm:px-6">
        <GardenSky weather={activeWeather} still={still} />
        <div className="relative">
          <GardenIsland
            plots={plots}
            history={history}
            still={still}
            onSow={(plotId) => setSowingPlot(plotId)}
            onInspect={(plotId) => setInspecting(plotId)}
          />
        </div>
        <p className="relative mt-1 text-center text-xs font-semibold text-white drop-shadow">
          Tap an empty patch to sow, or a plant to see how it's growing
        </p>
      </div>

      {local ? (
        <p className="mt-2 px-1 text-xs text-ink-faint">
          Your garden is being saved on this device for now. It will sync between you once sharing is switched on.
        </p>
      ) : null}

      {/* The seed shed */}
      <div className="mt-4 px-1">
        <p className="text-sm font-semibold text-ink-soft">The seed shed</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {SEEDS.map((seed) => (
            <SeedPacket key={seed.id} seed={seed} unlocked={unlockedSeeds.has(seed.id)} />
          ))}
        </div>
      </div>

      {/* Choose a seed for an empty plot */}
      <Dialog
        open={sowingPlot !== null}
        onClose={() => setSowingPlot(null)}
        title="What would you like to sow?"
        description="Earn badges on the Timeline to unlock more seeds."
        size="lg"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SEEDS.map((seed) => {
            const unlocked = unlockedSeeds.has(seed.id);

            return (
              <SeedPacket
                key={seed.id}
                seed={seed}
                unlocked={unlocked}
                large
                onPick={
                  unlocked && sowingPlot !== null
                    ? () => {
                        void sow(sowingPlot, seed.id);
                        setSowingPlot(null);
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </Dialog>

      {/* Look at a growing plant */}
      <Dialog
        open={Boolean(inspected && inspectedSeed)}
        onClose={() => setInspecting(null)}
        title={inspectedSeed ? `${inspectedSeed.emoji} ${inspectedSeed.name}` : ""}
        description={inspected ? `Sown ${formatDayAndMonth(inspected.plantedOn)}` : undefined}
        footer={
          <>
            <Button
              variant="danger"
              onClick={() => {
                if (inspecting) void uproot(inspecting);
                setInspecting(null);
              }}
            >
              <Shovel aria-hidden className="size-4" />
              Clear this plot
            </Button>
            <Button onClick={() => setInspecting(null)}>Lovely</Button>
          </>
        }
      >
        {inspected && inspectedSeed ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
            <PlantArt seedId={inspectedSeed.id} growth={plantGrowth(inspected, history)} still={still} className="h-44 w-36 shrink-0" />
            <div>
              <p className="ss-hand text-2xl text-emerald-600 dark:text-emerald-300">
                {plantStageLabel(plantGrowth(inspected, history), inspectedSeed.id)}
              </p>
              <p className="text-ink-soft">{inspectedSeed.blurb}</p>
              <p className="mt-2 text-sm text-ink-faint">
                Fully grown after about {inspectedSeed.maturesAfter} rituals from either of you.
              </p>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

const KIND_LABEL: Record<SeedDefinition["kind"], string> = {
  flower: "Flower",
  bush: "Bush",
  tree: "Tree",
  "fruit-tree": "Fruit tree",
};

const PACKET_COLOURS = ["bg-amber-100", "bg-pink-100", "bg-lime-100", "bg-sky-100", "bg-orange-100", "bg-rose-100"];

function SeedPacket({
  seed,
  unlocked,
  large = false,
  onPick,
}: {
  seed: SeedDefinition;
  unlocked: boolean;
  large?: boolean;
  onPick?: () => void;
}) {
  const badge = badgeUnlocking({ seedId: seed.id });
  const colour = PACKET_COLOURS[SEEDS.indexOf(seed) % PACKET_COLOURS.length];
  const Element = onPick ? "button" : "div";

  return (
    <Element
      {...(onPick ? { type: "button" as const, onClick: onPick } : {})}
      className={cx(
        "relative flex shrink-0 flex-col items-center rounded-2xl border-2 border-white text-center shadow-soft transition-transform",
        large ? "p-4" : "w-24 p-2.5",
        unlocked ? colour : "bg-slate-100 dark:bg-slate-800",
        onPick && "hover:-translate-y-1 hover:rotate-1",
        !unlocked && "opacity-70",
      )}
    >
      {/* Packet fold */}
      <span aria-hidden className="absolute inset-x-3 top-1.5 h-1 rounded-full bg-black/10" />
      <span className={cx(large ? "mt-2 text-4xl" : "mt-1 text-2xl", !unlocked && "opacity-40 grayscale")}>{seed.emoji}</span>
      <span className={cx("mt-1 font-display font-semibold text-ink", large ? "text-base" : "text-xs")}>{seed.name}</span>
      <span className="text-[0.65rem] font-bold tracking-wide text-ink-faint uppercase">{KIND_LABEL[seed.kind]}</span>
      {unlocked ? (
        large ? <span className="mt-1 text-xs text-ink-soft">{seed.blurb}</span> : null
      ) : (
        <span className="mt-1 inline-flex items-center gap-1 text-[0.65rem] font-semibold text-ink-soft">
          <Lock aria-hidden className="size-3" />
          {badge ? `${badge.emoji} ${badge.name} badge` : "Locked"}
        </span>
      )}
    </Element>
  );
}

/** The sky behind the plots, styled by the chosen garden weather. */
function GardenSky({ weather, still }: { weather: GardenWeatherId; still: boolean }) {
  const backgrounds: Record<GardenWeatherId, string> = {
    clear: "linear-gradient(to bottom, #8fd3fe 0%, #c9ecff 45%, #9be07a 70%, #5cb84a 100%)",
    sunshine: "linear-gradient(to bottom, #ffd36e 0%, #ffeab0 45%, #a8e07a 70%, #5cb84a 100%)",
    rainbow: "linear-gradient(to bottom, #9ed8ff 0%, #e2f4ff 45%, #9be07a 70%, #5cb84a 100%)",
    starry: "linear-gradient(to bottom, #0b1240 0%, #26306b 45%, #2f6b3a 70%, #1f4f2a 100%)",
    aurora: "linear-gradient(to bottom, #061a2e 0%, #10324a 45%, #2f6b3a 70%, #1f4f2a 100%)",
  };

  return (
    <div aria-hidden className="absolute inset-0" style={{ background: backgrounds[weather], transition: "background 1s ease" }}>
      {/* Soil bed */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-amber-700/0 via-amber-800/50 to-amber-900/80" />

      {weather === "sunshine" ? (
        <div className={cx("absolute -top-16 left-1/2 size-56 -translate-x-1/2 rounded-full", !still && "animate-(--animate-breathe)")}
          style={{ background: "radial-gradient(circle, rgb(255 240 170) 0%, rgb(255 210 90 / 0.5) 35%, transparent 70%)" }}
        />
      ) : null}

      {weather === "rainbow" ? (
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-x-0 top-2 h-28 w-full opacity-80">
          {["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7", "#9775fa"].map((colour, index) => (
            <path key={colour} d={`M${20 + index * 8},120 A${180 - index * 8},${110 - index * 8} 0 0 1 ${380 - index * 8},120`} stroke={colour} strokeWidth={7} fill="none" />
          ))}
        </svg>
      ) : null}

      {weather === "starry" || weather === "aurora" ? (
        <>
          {Array.from({ length: 40 }).map((_, index) => (
            <span
              key={index}
              className="absolute rounded-full bg-white motion-safe:animate-(--animate-shimmer)"
              style={{
                left: `${(index * 37) % 100}%`,
                top: `${(index * 53) % 45}%`,
                width: index % 5 === 0 ? 3 : 1.5,
                height: index % 5 === 0 ? 3 : 1.5,
                animationDelay: `${(index % 7) * 0.4}s`,
              }}
            />
          ))}
          <span className="absolute top-4 right-8 size-8 rounded-full bg-yellow-50 shadow-[0_0_24px_6px_rgba(255,250,220,0.5)]" />
        </>
      ) : null}

      {weather === "aurora" ? (
        <motion.div
          className="absolute inset-x-0 top-0 h-1/2 opacity-70 blur-xl"
          style={{ background: "linear-gradient(100deg, transparent 5%, #34d399 30%, #22d3ee 50%, #f472b6 70%, transparent 95%)" }}
          animate={still ? undefined : { x: ["-10%", "10%", "-10%"], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  );
}
