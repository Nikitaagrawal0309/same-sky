import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bird,
  Bug,
  CircleDot,
  Feather,
  MoonStar,
  Rabbit,
  Sparkles,
  Squirrel,
  Turtle,
  type LucideIcon,
} from "lucide-react";

import type { Season, WeatherCondition, WildlifePresence, WorldSnapshot } from "../../types/world";
import { usePrefersStillness } from "../../hooks/useTheme";
import { clamp01, cx, seededSequence } from "../../utils/helpers";

/**
 * The shared world, drawn.
 *
 * Everything in this component is shared between both partners — unlike the
 * sky behind it, which is personal. The tree, garden, pond and any wildlife
 * present are computed once by `deriveWorld` and rendered here exactly as
 * given; nothing about growth is decided in this file.
 *
 * Positions for flowers and wildlife are derived from `world.worldId` rather
 * than randomised, so the scene is stable between renders — a garden that
 * rearranges its flowers on every visit would never come to feel like a real
 * place.
 */

const WILDLIFE_ICONS: Record<WildlifePresence["species"], LucideIcon> = {
  butterflies: Sparkles,
  bees: Bug,
  dragonflies: Feather,
  songbirds: Bird,
  fireflies: CircleDot,
  frogs: Turtle,
  rabbits: Rabbit,
  deer: Squirrel,
  owl: MoonStar,
};

/**
 * Seasonal environments.
 *
 * `sky.season` was already being derived and used to gate which wildlife can
 * appear, but the scene itself — ground, tree, flowers, weather — never
 * answered to it, so a world looked identical in January and July. Every
 * colour below is drawn from the existing palette scale already used
 * elsewhere (moss, ember, bloom, bark, paper) rather than introducing new
 * ones, the same discipline the Timeline's event colours followed.
 */
interface SeasonPalette {
  groundFrom: string;
  groundTo: string;
  undergrowth: string;
  /** The tree canopy's three overlapping circles, back to front. */
  canopy: readonly [string, string, string];
  /** Winter's canopy reads as sparser branches rather than full leaf cover. */
  canopyScale: number;
  canopyOpacity: number;
  flowers: readonly [string, string, string];
}

const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    groundFrom: "var(--palette-moss-400)",
    groundTo: "var(--palette-moss-600)",
    undergrowth: "var(--palette-moss-700)",
    canopy: ["var(--palette-moss-400)", "var(--palette-moss-500)", "var(--palette-bloom-300)"],
    canopyScale: 1,
    canopyOpacity: 1,
    flowers: ["var(--palette-bloom-300)", "var(--palette-bloom-400)", "var(--palette-paper-0)"],
  },
  summer: {
    groundFrom: "var(--palette-moss-500)",
    groundTo: "var(--palette-moss-700)",
    undergrowth: "var(--palette-moss-800)",
    canopy: ["var(--palette-moss-500)", "var(--palette-moss-600)", "var(--palette-moss-400)"],
    canopyScale: 1,
    canopyOpacity: 1,
    flowers: ["var(--palette-bloom-400)", "var(--palette-ember-300)", "var(--palette-paper-0)"],
  },
  autumn: {
    groundFrom: "var(--palette-moss-600)",
    groundTo: "var(--palette-ember-800)",
    undergrowth: "var(--palette-ember-900)",
    canopy: ["var(--palette-ember-400)", "var(--palette-ember-600)", "var(--palette-ember-300)"],
    canopyScale: 1,
    canopyOpacity: 1,
    flowers: ["var(--palette-ember-300)", "var(--palette-ember-500)", "var(--palette-bloom-300)"],
  },
  winter: {
    groundFrom: "var(--palette-bark-400)",
    groundTo: "var(--palette-bark-600)",
    undergrowth: "var(--palette-bark-700)",
    canopy: ["var(--palette-bark-400)", "var(--palette-bark-500)", "var(--palette-paper-100)"],
    canopyScale: 0.74,
    canopyOpacity: 0.6,
    flowers: ["var(--palette-paper-100)", "var(--palette-bark-300)", "var(--palette-water-200)"],
  },
};

export interface WorldSceneProps {
  worldId: string;
  snapshot: WorldSnapshot;
  className?: string;

  /** Today's weather over this world. Purely atmospheric — see `deriveWeather`. */
  weather?: WeatherCondition;

  /** The viewer's current season — see `deriveSky`. Reshapes ground, tree and flower colour. */
  season?: Season;

  /**
   * Bumped by the caller each time a ritual is newly honoured, so the pond
   * can answer with a ripple — the specification's own example of immediate
   * feedback for a meaningful action.
   */
  pulseSignal?: number;
}

export function WorldScene({
  worldId,
  snapshot,
  className,
  weather = "clear",
  season = "summer",
  pulseSignal,
}: WorldSceneProps) {
  const prefersStillness = usePrefersStillness();
  const { tree, garden, pond, wildlife } = snapshot;
  const palette = SEASON_PALETTES[season];

  const raindrops = useMemo(() => {
    if (weather !== "rain" || season === "winter") return [];

    const count = 26;
    const values = seededSequence(`${worldId}:rain`, count * 3);

    return Array.from({ length: count }, (_, index) => ({
      x: values[index * 3] * 100,
      duration: 0.7 + values[index * 3 + 1] * 0.6,
      delay: values[index * 3 + 2] * 2,
    }));
  }, [worldId, weather, season]);

  // Winter's precipitation reads as snow rather than rain — same seeded
  // stability, a slower and gentler fall.
  const snowflakes = useMemo(() => {
    if (weather !== "rain" || season !== "winter") return [];

    const count = 22;
    const values = seededSequence(`${worldId}:snow`, count * 3);

    return Array.from({ length: count }, (_, index) => ({
      x: values[index * 3] * 100,
      duration: 4.5 + values[index * 3 + 1] * 3.5,
      delay: values[index * 3 + 2] * 5,
    }));
  }, [worldId, weather, season]);

  // A handful of leaves drifting down on a calm autumn day — ambient rather
  // than a weather condition, so it only shows on days with no rain of its
  // own to compete with.
  const leaves = useMemo(() => {
    if (season !== "autumn" || weather === "rain") return [];

    const count = 9;
    const values = seededSequence(`${worldId}:leaves`, count * 3);

    return Array.from({ length: count }, (_, index) => ({
      x: values[index * 3] * 100,
      duration: 6 + values[index * 3 + 1] * 4,
      delay: values[index * 3 + 2] * 8,
    }));
  }, [worldId, weather, season]);

  const flowers = useMemo(() => {
    const values = seededSequence(`${worldId}:flowers`, garden.flowers * 3);

    return Array.from({ length: garden.flowers }, (_, index) => ({
      x: 8 + values[index * 3] * 84,
      // Kept below the horizon line and out of the pond's footprint.
      y: 62 + values[index * 3 + 1] * 22,
      scale: 0.7 + values[index * 3 + 2] * 0.6,
      hue: index % 3,
    }));
  }, [worldId, garden.flowers]);

  const wildlifePositions = useMemo(() => {
    return wildlife.map((presence, presenceIndex) => {
      const values = seededSequence(
        `${worldId}:wildlife:${presence.species}`,
        presence.count * 2,
      );

      return Array.from({ length: presence.count }, (_, index) => ({
        x: 6 + values[index * 2] * 88,
        y: 8 + values[index * 2 + 1] * 40 + presenceIndex * 2,
      }));
    });
  }, [worldId, wildlife]);

  return (
    <div
      className={cx(
        "relative aspect-[16/11] w-full overflow-hidden rounded-3xl sm:aspect-[16/9]",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 size-full"
        role="img"
        aria-label="Your shared world"
      >
        <defs>
          <linearGradient id="ss-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.groundFrom} />
            <stop offset="100%" stopColor={palette.groundTo} />
          </linearGradient>

          <radialGradient id="ss-pond" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="var(--palette-water-300)" />
            <stop offset="100%" stopColor="var(--palette-water-600)" />
          </radialGradient>
        </defs>

        {/* Ground — recolours with the season (see `SEASON_PALETTES`). */}
        <path
          d="M0,68 C18,60 34,63 50,65 C66,67 82,60 100,64 L100,100 L0,100 Z"
          fill="url(#ss-ground)"
        />

        {/* Undergrowth density, purely textural. */}
        {garden.undergrowth > 0.15 ? (
          <path
            d="M0,72 C20,66 36,70 52,71 C68,72 84,66 100,70 L100,100 L0,100 Z"
            fill={palette.undergrowth}
            opacity={clamp01(garden.undergrowth * 0.5)}
          />
        ) : null}

        {/* Pond */}
        <g opacity={0.35 + pond.level * 0.65} className="cursor-default">
          <title>The pond. Peace and balance, not achievement — it answers to how together your growth has been.</title>

          <ellipse
            cx={76}
            cy={84}
            rx={16 + pond.level * 6}
            ry={5 + pond.level * 2.4}
            fill="url(#ss-pond)"
            opacity={0.3 + pond.clarity * 0.5}
          />

          {Array.from({ length: pond.lilies }).map((_, index) => (
            <ellipse
              key={index}
              cx={68 + index * 3.4}
              cy={82.5 + (index % 2) * 2.2}
              rx={1.6}
              ry={0.9}
              fill="var(--palette-moss-400)"
              opacity={0.8}
            />
          ))}

          {/* A ripple, once, each time a ritual is newly honoured — the
              specification's own example of an immediate response. */}
          <AnimatePresence>
            {pulseSignal && !prefersStillness ? (
              <motion.ellipse
                key={pulseSignal}
                cx={76}
                cy={84}
                rx={4}
                ry={1.6}
                fill="none"
                stroke="var(--palette-water-200)"
                strokeWidth={0.4}
                initial={{ opacity: 0.6, scale: 0.6 }}
                animate={{ opacity: 0, scale: 3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.22, 0.61, 0.36, 1] }}
                style={{ transformOrigin: "76px 84px" }}
              />
            ) : null}
          </AnimatePresence>
        </g>

        {/* Tree */}
        <TreeGlyph
          fullness={tree.fullness}
          stageIndex={tree.stage.index}
          label={tree.stage.label}
          meaning={tree.stage.meaning}
          still={prefersStillness}
          canopyColours={palette.canopy}
          canopyScale={palette.canopyScale}
          canopyOpacity={palette.canopyOpacity}
        />

        {/* Garden */}
        <g className="cursor-default">
          <title>The garden. Grown by the combined consistency of both of you.</title>

          {flowers.map((flower, index) => (
            <FlowerGlyph key={index} {...flower} still={prefersStillness} colours={palette.flowers} />
          ))}
        </g>
      </svg>

      {/* Wildlife renders as HTML rather than SVG so each creature can use a
          crisp vector icon and its own gentle motion. */}
      <div className="absolute inset-0">
        {wildlife.map((presence, presenceIndex) => {
          const Icon = WILDLIFE_ICONS[presence.species];
          const positions = wildlifePositions[presenceIndex] ?? [];

          return positions.map((position, index) => (
            <motion.span
              key={`${presence.species}-${index}`}
              className="absolute text-ink/70 drop-shadow-sm"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              title={presence.label}
              animate={
                prefersStillness
                  ? undefined
                  : { y: [0, -3, 0], x: [0, index % 2 === 0 ? 2 : -2, 0] }
              }
              transition={{
                duration: 5 + (index % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.4,
              }}
            >
              <Icon aria-hidden className="size-3.5 sm:size-4" strokeWidth={1.5} />
            </motion.span>
          ));
        })}
      </div>

      {weather === "rain" && season !== "winter" ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {prefersStillness ? (
            // Motion is off — a soft wash reads as "rain" without any movement.
            <div className="absolute inset-0 bg-water/10" />
          ) : (
            raindrops.map((drop, index) => (
              <span
                key={index}
                className="absolute top-0 h-10 w-px bg-linear-to-b from-transparent via-water/50 to-transparent"
                style={{
                  left: `${drop.x}%`,
                  animation: `rainfall ${drop.duration}s linear infinite`,
                  animationDelay: `${drop.delay}s`,
                }}
              />
            ))
          )}
        </div>
      ) : null}

      {/* Winter's rain reads as snow instead — same condition, a season apart. */}
      {weather === "rain" && season === "winter" ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {prefersStillness ? (
            <div className="absolute inset-0 bg-white/10" />
          ) : (
            snowflakes.map((flake, index) => (
              <span
                key={index}
                className="absolute top-0 size-1.5 rounded-full bg-white/70"
                style={{
                  left: `${flake.x}%`,
                  animation: `fall-drift ${flake.duration}s ease-in-out infinite`,
                  animationDelay: `${flake.delay}s`,
                }}
              />
            ))
          )}
        </div>
      ) : null}

      {/* A quiet handful of leaves, only on a calm autumn day with no rain of its own. */}
      {leaves.length > 0 && !prefersStillness ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {leaves.map((leaf, index) => (
            <span
              key={index}
              className="absolute top-0 size-1.5 rounded-full opacity-70"
              style={{
                left: `${leaf.x}%`,
                backgroundColor:
                  index % 2 === 0 ? "var(--palette-ember-400)" : "var(--palette-ember-600)",
                animation: `fall-drift ${leaf.duration}s ease-in-out infinite`,
                animationDelay: `${leaf.delay}s`,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface TreeGlyphProps {
  fullness: number;
  stageIndex: number;
  label: string;
  meaning: string;
  still: boolean;
  canopyColours: readonly [string, string, string];
  canopyScale: number;
  canopyOpacity: number;
}

/**
 * The tree is drawn from a small number of continuous parameters rather than
 * switched between illustrations per stage, so its growth reads as one long,
 * gradual transformation instead of eight discrete jumps.
 *
 * The specification calls the tree "one of the strongest emotional symbols"
 * in the product, so it is the one part of the scene that answers to a
 * hover: a native `<title>` names its stage and what that stage means, and
 * (motion permitting) it settles slightly toward the viewer, the same small
 * acknowledgement `whileTap` gives a pressed button elsewhere.
 *
 * Its colour and canopy fullness also answer to the season — winter's
 * `canopyScale`/`canopyOpacity` read as branches thinned rather than a full
 * leaf canopy, without needing a second illustration.
 */
function TreeGlyph({
  fullness,
  stageIndex,
  label,
  meaning,
  still,
  canopyColours,
  canopyScale,
  canopyOpacity,
}: TreeGlyphProps) {
  const height = 8 + fullness * 30;
  const canopyRadius = (4 + fullness * 13) * canopyScale;
  const trunkWidth = 1 + fullness * 2.2;
  const baseX = 32;
  const baseY = 68;

  const tooltip = `${label}. ${meaning}`;

  if (stageIndex === 0) {
    // A seed is not yet a tree — just a small mound of turned earth.
    return (
      <g className="cursor-default">
        <title>{tooltip}</title>
        <ellipse cx={baseX} cy={baseY} rx={2.4} ry={1} fill="var(--palette-bark-700)" />
      </g>
    );
  }

  return (
    <motion.g
      className="cursor-default"
      whileHover={still ? undefined : { scale: 1.025 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ transformOrigin: `${baseX}px ${baseY}px` }}
    >
      <title>{tooltip}</title>

      <rect
        x={baseX - trunkWidth / 2}
        y={baseY - height}
        width={trunkWidth}
        height={height}
        rx={trunkWidth / 2}
        fill="var(--palette-bark-600)"
      />

      <g opacity={canopyOpacity}>
        <circle
          cx={baseX}
          cy={baseY - height - canopyRadius * 0.55}
          r={canopyRadius}
          fill={canopyColours[0]}
        />
        <circle
          cx={baseX - canopyRadius * 0.55}
          cy={baseY - height - canopyRadius * 0.15}
          r={canopyRadius * 0.72}
          fill={canopyColours[1]}
        />
        <circle
          cx={baseX + canopyRadius * 0.6}
          cy={baseY - height - canopyRadius * 0.1}
          r={canopyRadius * 0.68}
          fill={canopyColours[2]}
        />
      </g>
    </motion.g>
  );
}

interface FlowerGlyphProps {
  x: number;
  y: number;
  scale: number;
  hue: number;
  still: boolean;
  colours: readonly [string, string, string];
}

function FlowerGlyph({ x, y, scale, hue, still, colours }: FlowerGlyphProps) {
  const size = 0.9 * scale;

  return (
    <g
      transform={`translate(${x} ${y}) scale(${size})`}
      className={still ? undefined : "motion-safe:animate-(--animate-breathe)"}
      style={{ transformOrigin: "center", transformBox: "fill-box" }}
    >
      <circle r={0.9} fill={colours[hue]} opacity={0.9} />
      <circle r={0.35} fill="var(--palette-ember-500)" />
    </g>
  );
}
