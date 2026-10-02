import { useMemo, type CSSProperties } from "react";
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

import type { NoteVessel } from "../../types/note";
import type { Season, WeatherCondition, WildlifePresence, WorldSnapshot } from "../../types/world";
import { usePrefersStillness } from "../../hooks/useTheme";
import { clamp01, cx, seededSequence } from "../../utils/helpers";
import { Birds } from "./Birds";
import { PrecipitationCanvas } from "./PrecipitationCanvas";
import { VESSELS } from "./vessels";

/**
 * The shared world, drawn.
 *
 * Everything in this component is shared between both partners — unlike the
 * sky behind it, which is personal. The tree, garden, pond and any wildlife
 * present are computed once by `deriveWorld` and rendered here exactly as
 * given; nothing about growth is decided in this file.
 *
 * Positions for flowers, grass, leaves and wildlife are derived from
 * `world.worldId` rather than randomised, so the scene is stable between
 * renders — a garden that rearranges itself on every visit would never come
 * to feel like a real place.
 *
 * The drawing uses a wide viewBox (x −30…230, y 0…100) anchored to the bottom
 * edge, so a wide screen shows plenty of sky above the hills while a phone
 * keeps the middle of the meadow (x ≈ 55–145) in frame. Everything important
 * lives in that band; the outer edges are only hills and grass.
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

/** Seasonal colouring for every layer of the meadow. */
interface SeasonPalette {
  farHill: string;
  midHill: string;
  groundFrom: string;
  groundTo: string;
  grass: readonly [string, string, string];
  /** Tree canopy clusters, back to front. */
  canopy: readonly [string, string, string];
  /** Winter's canopy reads as sparser branches rather than full leaf cover. */
  canopyScale: number;
  canopyOpacity: number;
  flowers: readonly [string, string, string, string];
  /** Leaves lying on the ground (petals in spring). */
  fallen: readonly string[];
  /** How many leaves are scattered on the ground. */
  fallenCount: number;
}

const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    farHill: "#a9d9b8",
    midHill: "#7cc47f",
    groundFrom: "#8fd16a",
    groundTo: "#4f9a3c",
    grass: ["#6cc04a", "#4ea33a", "#9ad65f"],
    canopy: ["#7fcf6a", "#5bb04a", "#ffb3c8"],
    canopyScale: 1,
    canopyOpacity: 1,
    flowers: ["#ff8fb1", "#ffd166", "#ffffff", "#c39bff"],
    fallen: ["#ffc4d6", "#ffd9e4", "#a5d67a"],
    fallenCount: 18,
  },
  summer: {
    farHill: "#9fd3b6",
    midHill: "#6dbb6a",
    groundFrom: "#7ccf55",
    groundTo: "#3e8a2f",
    grass: ["#5ab83d", "#3f9a2e", "#86cf4f"],
    canopy: ["#5cb84a", "#3f9a35", "#86d160"],
    canopyScale: 1,
    canopyOpacity: 1,
    flowers: ["#ff6b8b", "#ffd23f", "#ffffff", "#7cc8ff"],
    fallen: ["#c9a227", "#9b7a3e", "#7bb04a"],
    fallenCount: 14,
  },
  autumn: {
    farHill: "#dcc79e",
    midHill: "#c9a45c",
    groundFrom: "#b5a248",
    groundTo: "#7a5a2a",
    grass: ["#b59a3c", "#8f7a2e", "#d1b04f"],
    canopy: ["#f28c38", "#d9531e", "#ffc145"],
    canopyScale: 1,
    canopyOpacity: 1,
    flowers: ["#ff9f43", "#e8603c", "#ffd166", "#c06c84"],
    fallen: ["#f28c38", "#d9531e", "#ffc145", "#a0522d"],
    fallenCount: 44,
  },
  winter: {
    farHill: "#e1eaf1",
    midHill: "#cbd8e2",
    groundFrom: "#eaf1f5",
    groundTo: "#b9c8d2",
    grass: ["#a7b8a0", "#8fa38a", "#c5d1c0"],
    canopy: ["#cfdbe3", "#b4c3cc", "#ffffff"],
    canopyScale: 0.74,
    canopyOpacity: 0.75,
    flowers: ["#ffffff", "#b9d7ff", "#e0c3ff", "#ffd6e0"],
    fallen: ["#a0522d", "#8a6d3b", "#c9a227"],
    fallenCount: 10,
  },
};

const MUD = { light: "#9a6b45", base: "#7d5333", dark: "#5c3a21" };

/** The pond's centre in viewBox units. */
const POND = { cx: 138, cy: 87 };

/** The tree's base in viewBox units. */
const TREE = { x: 76, y: 78 };

/** A shared bottom-anchored sway, applied to grass, reeds and flowers. */
function swayStyle(still: boolean, duration: number, delay: number): CSSProperties {
  return {
    transformBox: "fill-box",
    transformOrigin: "50% 100%",
    animation: still ? undefined : `sway ${duration}s cubic-bezier(0.45,0,0.55,1) ${delay}s infinite`,
  };
}

export interface WorldSceneProps {
  worldId: string;
  snapshot: WorldSnapshot;
  className?: string;

  /** The real weather where the viewer is — see `services/weather.ts`. */
  weather?: WeatherCondition;

  /** 0–1: how hard it's raining or snowing. Drizzle is light, a downpour heavy. */
  weatherIntensity?: number;

  /** The viewer's current season — see `deriveSky`. Reshapes every colour in the meadow. */
  season?: Season;

  /**
   * How much daylight is falling on the meadow, 0 (night) – 1 (full day).
   * The scene dims and fireflies come out as it falls.
   */
  daylight?: number;

  /**
   * Bumped by the caller each time a ritual is newly honoured, so the pond
   * can answer with a ripple — the specification's own example of immediate
   * feedback for a meaningful action.
   */
  pulseSignal?: number;

  /**
   * Today's note from a partner, if one exists — the note's own vessel
   * (same taxonomy `DailyNoteCard` uses) and whether it is still unopened.
   * `null`/`undefined` when nothing has been left today.
   */
  noteFromPartner?: { vessel: NoteVessel; waiting: boolean } | null;

  /** Opens the note — same reveal dialog the card below used to trigger directly. */
  onNoteClick?: () => void;

  /**
   * Fill the positioned parent instead of keeping a fixed aspect ratio. An
   * aspect ratio would otherwise win over `inset-0` and make the scene far
   * taller than the hero it sits in.
   */
  fill?: boolean;
}

export function WorldScene({
  worldId,
  snapshot,
  className,
  weather = "clear",
  weatherIntensity = 0.7,
  season = "summer",
  daylight = 1,
  pulseSignal,
  noteFromPartner,
  onNoteClick,
  fill = false,
}: WorldSceneProps) {
  const still = usePrefersStillness();
  const { tree, garden, pond, wildlife } = snapshot;
  const palette = SEASON_PALETTES[season];
  // Wet ground (darker grass, shiny puddles, busy pond) for rain and storms.
  const rainy = weather === "rain" || weather === "storm";
  const falling = rainy || weather === "snow";
  const night = daylight < 0.35;

  const farTrees = useMemo(() => {
    const count = 22;
    const values = seededSequence(`${worldId}:far-trees`, count * 3);

    return Array.from({ length: count }, (_, index) => ({
      x: -26 + index * 11.5 + values[index * 3] * 9,
      y: 57.5 + values[index * 3 + 2] * 3,
      r: 1.2 + values[index * 3 + 1] * 1.6,
      pine: values[index * 3 + 2] > 0.55,
    }));
  }, [worldId]);

  const grass = useMemo(() => {
    const count = 120;
    const values = seededSequence(`${worldId}:grass`, count * 4);

    return Array.from({ length: count }, (_, index) => ({
      x: -30 + values[index * 4] * 260,
      y: 75 + values[index * 4 + 1] * 25,
      height: 1.6 + values[index * 4 + 2] * 2.4,
      shade: index % 3,
      duration: 3 + values[index * 4 + 3] * 3,
      delay: -values[index * 4 + 3] * 4,
    })).filter((blade) => !inPond(blade.x, blade.y, 2));
  }, [worldId]);

  const fallenLeaves = useMemo(() => {
    const count = palette.fallenCount;
    const values = seededSequence(`${worldId}:fallen:${season}`, count * 4);

    return Array.from({ length: count }, (_, index) => ({
      x: 20 + values[index * 4] * 160,
      y: 77 + values[index * 4 + 1] * 22,
      rotate: values[index * 4 + 2] * 360,
      scale: 0.6 + values[index * 4 + 3] * 0.7,
      colour: palette.fallen[index % palette.fallen.length],
    })).filter((leaf) => !inPond(leaf.x, leaf.y, 1));
  }, [worldId, season, palette]);

  const flowers = useMemo(() => {
    const total = Math.max(garden.flowers, 3);
    const values = seededSequence(`${worldId}:flowers`, total * 4);

    return Array.from({ length: total }, (_, index) => {
      let x = 42 + values[index * 4] * 116;
      const y = 79 + values[index * 4 + 1] * 18;

      // Step out of the pond's footprint rather than drawing on the water.
      if (inPond(x, y, 3)) x -= 30;

      return {
        x,
        y,
        scale: 0.75 + values[index * 4 + 2] * 0.6,
        kind: index % 3,
        colour: palette.flowers[index % palette.flowers.length],
        delay: -values[index * 4 + 3] * 4,
        // Below three real flowers the garden shows buds, not blooms.
        bud: index >= garden.flowers,
      };
    });
  }, [worldId, garden.flowers, palette]);

  const fireflies = useMemo(() => {
    const values = seededSequence(`${worldId}:fireflies`, 14 * 3);

    return Array.from({ length: 14 }, (_, index) => ({
      x: 10 + values[index * 3] * 80,
      y: 52 + values[index * 3 + 1] * 40,
      delay: values[index * 3 + 2] * 5,
    }));
  }, [worldId]);

  const driftingLeaves = useMemo(() => {
    if (falling || weather === "fog") return [];

    const count = season === "autumn" ? 10 : 4;
    const values = seededSequence(`${worldId}:leaves`, count * 3);

    return Array.from({ length: count }, (_, index) => ({
      x: values[index * 3] * 100,
      duration: 7 + values[index * 3 + 1] * 5,
      delay: values[index * 3 + 2] * 9,
    }));
  }, [worldId, falling, weather, season]);

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

  const pondRx = 20 + pond.level * 6;
  const pondRy = 6 + pond.level * 2;

  return (
    <div
      className={cx(
        fill
          ? "absolute inset-0 overflow-hidden"
          : "relative aspect-[16/11] w-full overflow-hidden rounded-3xl sm:aspect-[16/9]",
        className,
      )}
    >
      <svg
        viewBox="-30 0 260 100"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 size-full"
        role="img"
        aria-label="Your shared world: a meadow with a tree, a garden and a pond"
      >
        <defs>
          <linearGradient id="ss-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.groundFrom} />
            <stop offset="100%" stopColor={palette.groundTo} />
          </linearGradient>

          <radialGradient id="ss-pond" cx="45%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#9be3f0" />
            <stop offset="55%" stopColor="#4bb3cf" />
            <stop offset="100%" stopColor="#23758f" />
          </radialGradient>

          <linearGradient id="ss-mud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MUD.light} />
            <stop offset="100%" stopColor={MUD.dark} />
          </linearGradient>

          <radialGradient id="ss-canopy-light" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Far hills, hazy with distance, dotted with little trees. */}
        <path
          d="M-30,60 C-10,56 5,58 20,58 C45,55 50,60 70,57 C95,54 120,51 150,56 C170,59 185,55 200,57 C215,58 225,55 230,56 L230,100 L-30,100 Z"
          fill={palette.farHill}
        />
        {farTrees.map((farTree, index) => (
          <g key={index} opacity={0.5}>
            <rect x={farTree.x - 0.2} y={farTree.y - farTree.r} width={0.4} height={farTree.r + 1.5} fill="#4d6c3c" />
            {farTree.pine ? (
              <path
                d={`M${farTree.x - farTree.r},${farTree.y} L${farTree.x},${farTree.y - farTree.r * 3} L${farTree.x + farTree.r},${farTree.y} Z`}
                fill={palette.midHill}
              />
            ) : (
              <circle cx={farTree.x} cy={farTree.y - farTree.r} r={farTree.r} fill={palette.midHill} />
            )}
          </g>
        ))}

        {/* Rolling middle hills. */}
        <path
          d="M-30,67 C-10,64 10,66 30,64 C55,67 60,66 85,65 C115,63 140,60 170,64 C185,66 195,64 210,65 C220,66 226,64 230,65 L230,100 L-30,100 Z"
          fill={palette.midHill}
        />

        {/* The meadow itself. */}
        <path
          d="M-30,74 C-5,72 10,73 30,73 C60,74 70,74 100,73 C140,72 170,70 200,73 C215,74 225,72 230,73 L230,100 L-30,100 Z"
          fill="url(#ss-ground)"
        />

        {/* Sunlit patches and undergrowth, purely textural. */}
        <ellipse cx={60} cy={82} rx={22} ry={3} fill="#ffffff" opacity={0.07} />
        <ellipse cx={160} cy={78} rx={18} ry={2.4} fill="#ffffff" opacity={0.07} />
        {garden.undergrowth > 0.15 ? (
          <path
            d="M-30,86 C-10,84 10,86 30,85 C50,84 40,86 60,85 C90,84 120,88 150,86 C175,85 190,87 230,86 L230,100 L-30,100 Z"
            fill={palette.grass[1]}
            opacity={clamp01(garden.undergrowth * 0.45)}
          />
        ) : null}

        {/* A muddy footpath winding up to the tree, and patches of mud. */}
        <path
          d="M90,100 C92,93 82,87 77,79.5 L81,79.5 C88,86 104,92 114,100 Z"
          fill="url(#ss-mud)"
          opacity={0.9}
        />
        <path d="M95,100 C95,94 88,89 80,81" stroke={MUD.dark} strokeWidth={0.35} fill="none" opacity={0.45} strokeDasharray="0.8 1.6" />
        <MudPatch x={56} y={92} rx={7} ry={1.8} rainy={rainy} />
        <MudPatch x={118} y={96} rx={6} ry={1.5} rainy={rainy} />
        <MudPatch x={168} y={80} rx={5} ry={1.2} rainy={rainy} />
        <MudPatch x={40} y={80} rx={4} ry={1} rainy={rainy} />

        {/* Pond, with a muddy bank. */}
        <g opacity={0.45 + pond.level * 0.55}>
          <title>The pond. Peace and balance, not achievement — it answers to how together your growth has been.</title>

          <ellipse cx={POND.cx} cy={POND.cy + 0.6} rx={pondRx + 2.4} ry={pondRy + 1.6} fill={MUD.base} />
          <ellipse cx={POND.cx} cy={POND.cy} rx={pondRx + 1} ry={pondRy + 0.8} fill={MUD.light} opacity={0.8} />
          <ellipse
            cx={POND.cx}
            cy={POND.cy}
            rx={pondRx}
            ry={pondRy}
            fill="url(#ss-pond)"
            opacity={0.55 + pond.clarity * 0.45}
          />
          {/* Sky reflected on the surface. */}
          <ellipse cx={POND.cx - 4} cy={POND.cy - pondRy * 0.4} rx={pondRx * 0.6} ry={pondRy * 0.3} fill="#ffffff" opacity={0.22} />

          {/* Glints dancing on the water. */}
          {[-9, 2, 10, -3].map((offset, index) => (
            <rect
              key={index}
              x={POND.cx + offset}
              y={POND.cy - 1 + (index % 2) * 2.4}
              width={3}
              height={0.3}
              rx={0.15}
              fill="#ffffff"
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: still ? undefined : `glint ${2.4 + index * 0.7}s ease-in-out ${index * 0.6}s infinite`,
              }}
              opacity={still ? 0.4 : undefined}
            />
          ))}

          {/* Gentle rings spreading across the water — more when it rains. */}
          {!still
            ? Array.from({ length: rainy ? 6 : 2 }).map((_, index) => {
                const cx = POND.cx + ((index * 37) % 24) - 12;
                const cy = POND.cy + ((index * 13) % 6) - 2;

                return (
                  <ellipse key={index} cx={cx} cy={cy} rx={0.5} ry={0.2} fill="none" stroke="#e6f7ff" strokeWidth={0.25}>
                    <animate attributeName="rx" values="0.5;5" dur={rainy ? "1.6s" : "4s"} begin={`${index * 0.7}s`} repeatCount="indefinite" />
                    <animate attributeName="ry" values="0.2;1.6" dur={rainy ? "1.6s" : "4s"} begin={`${index * 0.7}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur={rainy ? "1.6s" : "4s"} begin={`${index * 0.7}s`} repeatCount="indefinite" />
                  </ellipse>
                );
              })
            : null}

          {/* Lily pads, a couple of them flowering. */}
          {Array.from({ length: Math.max(2, pond.lilies) }).map((_, index) => {
            const x = POND.cx - 10 + index * 5.6;
            const y = POND.cy - 1.4 + (index % 2) * 3;

            return (
              <g key={index} transform={`translate(${x} ${y})`}>
                <ellipse rx={1.5} ry={0.6} fill="#3f9a45" />
                <ellipse rx={1.1} ry={0.4} cy={-0.08} fill="#6cc96a" />
                <path d="M0,0 L1.6,-0.35 L1.6,0.35 Z" fill="#4bb3cf" />
                {index % 2 === 0 ? (
                  <g transform="translate(-0.3 -0.5) scale(0.8)">
                    <ellipse rx={0.5} ry={0.9} fill="#ffb6cf" transform="rotate(-30)" />
                    <ellipse rx={0.5} ry={0.9} fill="#ffb6cf" transform="rotate(30)" />
                    <ellipse rx={0.45} ry={0.8} fill="#ff8fb5" />
                    <circle r={0.28} cy={0.2} fill="#ffd23f" />
                  </g>
                ) : null}
              </g>
            );
          })}

          {/* A ripple, once, each time a ritual is newly honoured. */}
          <AnimatePresence>
            {pulseSignal && !still ? (
              <motion.ellipse
                key={pulseSignal}
                cx={POND.cx}
                cy={POND.cy}
                rx={4}
                ry={1.3}
                fill="none"
                stroke="#e6f7ff"
                strokeWidth={0.45}
                initial={{ opacity: 0.8, scale: 0.6 }}
                animate={{ opacity: 0, scale: 3.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.22, 0.61, 0.36, 1] }}
                style={{ transformOrigin: `${POND.cx}px ${POND.cy}px` }}
              />
            ) : null}
          </AnimatePresence>
        </g>

        {/* Reeds and cattails along the pond's edges. */}
        {[
          { x: POND.cx - pondRx - 1, y: POND.cy + 1 },
          { x: POND.cx - pondRx + 2, y: POND.cy + 2.5 },
          { x: POND.cx + pondRx - 1, y: POND.cy },
          { x: POND.cx + pondRx + 1.5, y: POND.cy + 1.5 },
        ].map((reed, index) => (
          <g key={index} style={swayStyle(still, 4 + index * 0.6, -index)}>
            <path d={`M${reed.x},${reed.y} q-0.6,-5 0.2,-9`} stroke="#4f8a3a" strokeWidth={0.35} fill="none" />
            <path d={`M${reed.x + 0.8},${reed.y} q0.8,-4 2,-6`} stroke="#6aa84f" strokeWidth={0.3} fill="none" />
            <rect x={reed.x - 0.2} y={reed.y - 9.6} width={0.9} height={2.6} rx={0.45} fill="#7a4b26" />
          </g>
        ))}

        {/* Stones by the water. */}
        <ellipse cx={POND.cx - pondRx + 4} cy={POND.cy + pondRy + 1} rx={2} ry={1.1} fill="#9aa3a8" />
        <ellipse cx={POND.cx - pondRx + 3.4} cy={POND.cy + pondRy + 0.6} rx={1} ry={0.4} fill="#c9d0d4" />
        <ellipse cx={POND.cx + pondRx - 2} cy={POND.cy + pondRy + 1.4} rx={1.4} ry={0.8} fill="#8b9499" />

        {/* Leaves lying in the grass. */}
        {fallenLeaves.map((leaf, index) => (
          <path
            key={index}
            d="M0,0 C0.9,-1.1 2.5,-1 3,0 C2.5,1 0.9,1.1 0,0 Z M0,0 L3,0"
            fill={leaf.colour}
            stroke="#00000022"
            strokeWidth={0.1}
            transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}
            opacity={0.9}
          />
        ))}

        {/* Bushes, ferns and mushrooms at the meadow's edges. */}
        <Bush x={44} y={78} colours={palette.grass} berries={season === "summer" || season === "autumn"} />
        <Bush x={110} y={75.5} colours={palette.grass} berries={false} small />
        <Bush x={166} y={77} colours={palette.grass} berries={season !== "winter"} />
        <Fern x={58} y={80} colour={palette.grass[0]} still={still} />
        <Fern x={98} y={78} colour={palette.grass[2]} still={still} />
        <Fern x={155} y={94} colour={palette.grass[0]} still={still} />
        <Mushroom x={49} y={82} />
        <Mushroom x={52} y={83} small />
        <Mushroom x={171} y={81} small />

        {/* Tree */}
        <TreeGlyph
          fullness={tree.fullness}
          stageIndex={tree.stage.index}
          label={tree.stage.label}
          meaning={tree.stage.meaning}
          still={still}
          canopyColours={palette.canopy}
          canopyScale={palette.canopyScale}
          canopyOpacity={palette.canopyOpacity}
        />

        {/* Grass blades bending in the breeze. */}
        {grass.map((blade, index) => (
          <path
            key={index}
            d={`M${blade.x},${blade.y} q-0.5,${-blade.height * 0.6} -0.9,${-blade.height} M${blade.x + 0.4},${blade.y} q0.3,${-blade.height * 0.7} 0.2,${-blade.height * 1.2} M${blade.x + 0.8},${blade.y} q0.7,${-blade.height * 0.5} 1.3,${-blade.height * 0.85}`}
            stroke={palette.grass[blade.shade]}
            strokeWidth={0.32}
            strokeLinecap="round"
            fill="none"
            style={swayStyle(still, blade.duration, blade.delay)}
          />
        ))}

        {/* Garden */}
        <g>
          <title>The garden. Grown by the combined consistency of both of you.</title>

          {flowers.map((flower, index) => (
            <FlowerGlyph key={index} {...flower} still={still} />
          ))}
        </g>

        {/* Rain darkens and wets everything; overcast skies dim it a touch. */}
        {rainy ? <rect x={-30} y={0} width={260} height={100} fill="#1e2b3a" opacity={weather === "storm" ? 0.28 : 0.18} /> : null}
        {weather === "cloudy" ? <rect x={-30} y={0} width={260} height={100} fill="#334155" opacity={0.08} /> : null}
        {/* Snow settles evenly over the hills and meadow. */}
        {weather === "snow" ? (
          <path
            d="M-30,60 C-10,56 5,58 20,58 C45,55 50,60 70,57 C95,54 120,51 150,56 C170,59 185,55 200,57 C215,58 225,55 230,56 L230,100 L-30,100 Z"
            fill="#f8fbff"
            opacity={0.38}
          />
        ) : null}

        {/* Night falls over the meadow too, not just the sky. */}
        {daylight < 1 ? (
          <rect
            x={-30}
            y={0}
            width={260}
            height={100}
            fill="#0b1640"
            opacity={(1 - daylight) * 0.55}
            style={{ transition: "opacity 2s ease" }}
          />
        ) : null}
      </svg>

      {/* Fireflies after dark. */}
      {night && !still ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {fireflies.map((fly, index) => (
            <motion.span
              key={index}
              className="absolute size-1.5 rounded-full bg-yellow-200"
              style={{ left: `${fly.x}%`, top: `${fly.y}%`, boxShadow: "0 0 8px 3px rgb(253 230 138 / 0.7)" }}
              animate={{ opacity: [0, 1, 0], x: [0, 10, -6], y: [0, -8, 4] }}
              transition={{ duration: 4 + (index % 4), repeat: Infinity, delay: fly.delay, ease: "easeInOut" }}
            />
          ))}
        </div>
      ) : null}

      {/* Wildlife renders as HTML rather than SVG so each creature can use a
          crisp vector icon and its own gentle motion. */}
      <div className="absolute inset-0">
        <Birds seed={worldId} count={night ? 1 : 3} still={still} />

        {wildlife.map((presence, presenceIndex) => {
          const Icon = WILDLIFE_ICONS[presence.species];
          const positions = wildlifePositions[presenceIndex] ?? [];

          return positions.map((position, index) => (
            <motion.span
              key={`${presence.species}-${index}`}
              className="absolute text-white/85 drop-shadow"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              title={presence.label}
              animate={
                still
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

        {/* The day's note from a partner, kept as a small object in the
            world rather than a card beside it. Its vessel matches the icon
            its author chose in `DailyNoteCard`. */}
        {noteFromPartner ? (
          <button
            type="button"
            onClick={onNoteClick}
            title={noteFromPartner.waiting ? "A note is waiting for you" : "Today's note, already read"}
            aria-label={
              noteFromPartner.waiting
                ? "A note is waiting for you — open it"
                : "Today's note, already read — open it"
            }
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-md transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none"
            style={{ left: "50%", top: "86%" }}
          >
            <motion.span
              className="block"
              animate={
                noteFromPartner.waiting && !still
                  ? { y: [0, -3, 0], scale: [1, 1.1, 1] }
                  : undefined
              }
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <NoteVesselIcon
                vessel={noteFromPartner.vessel}
                aria-hidden
                className={cx("size-4 sm:size-5", noteFromPartner.waiting ? "text-ember" : "text-ink/55")}
                strokeWidth={1.8}
              />
            </motion.span>
          </button>
        ) : null}
      </div>

      {falling ? (
        still ? (
          <div aria-hidden className={cx("pointer-events-none absolute inset-0", weather === "snow" ? "bg-white/10" : "bg-slate-500/15")} />
        ) : (
          <>
            <PrecipitationCanvas
              kind={weather === "snow" ? "snow" : "rain"}
              intensity={weather === "storm" ? 1.4 : Math.max(0.25, weatherIntensity)}
              groundFrom={0.62}
            />
            {/* A low mist hanging over the wet ground. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-slate-200/20 to-transparent"
            />
          </>
        )
      ) : null}

      {/* Fog: soft banks of mist rolling slowly across the meadow. */}
      {weather === "fog" ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-white/25" />
          {[0, 1, 2].map((band) => (
            <motion.div
              key={band}
              className="absolute -inset-x-1/4 h-1/3 rounded-full bg-white/45 blur-2xl"
              style={{ top: `${30 + band * 22}%` }}
              animate={still ? undefined : { x: band % 2 ? ["-8%", "8%", "-8%"] : ["8%", "-8%", "8%"] }}
              transition={{ duration: 30 + band * 8, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
      ) : null}

      {/* A few leaves drifting down on a calm day — many more in autumn. */}
      {driftingLeaves.length > 0 && !still ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {driftingLeaves.map((leaf, index) => (
            <span
              key={index}
              className="absolute top-0 block"
              style={{
                left: `${leaf.x}%`,
                animation: `fall-drift ${leaf.duration}s ease-in-out infinite`,
                animationDelay: `${leaf.delay}s`,
                height: "100%",
              }}
            >
              <svg width="12" height="8" viewBox="0 0 3 2" className="animate-(--animate-wiggle)">
                <path d="M0,1 C0.9,-0.1 2.5,0 3,1 C2.5,2 0.9,2.1 0,1 Z" fill={palette.fallen[index % palette.fallen.length]} />
              </svg>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Whether a point (viewBox units) falls on the pond, with some margin. */
function inPond(x: number, y: number, margin: number): boolean {
  const dx = (x - POND.cx) / (28 + margin);
  const dy = (y - POND.cy) / (9 + margin);

  return dx * dx + dy * dy < 1;
}

function MudPatch({ x, y, rx, ry, rainy }: { x: number; y: number; rx: number; ry: number; rainy: boolean }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={MUD.base} opacity={0.85} />
      <ellipse cx={x - rx * 0.2} cy={y - ry * 0.15} rx={rx * 0.6} ry={ry * 0.5} fill={MUD.dark} opacity={0.5} />
      <circle cx={x + rx * 0.5} cy={y} r={0.25} fill={MUD.dark} />
      <circle cx={x - rx * 0.6} cy={y + ry * 0.3} r={0.2} fill={MUD.light} />
      {/* After rain the mud holds a shiny puddle. */}
      {rainy ? (
        <ellipse cx={x} cy={y} rx={rx * 0.55} ry={ry * 0.45} fill="#a9c7da" opacity={0.6} />
      ) : null}
    </g>
  );
}

function Bush({
  x,
  y,
  colours,
  berries,
  small = false,
}: {
  x: number;
  y: number;
  colours: readonly [string, string, string];
  berries: boolean;
  small?: boolean;
}) {
  const s = small ? 0.7 : 1;

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0.4} rx={6} ry={1} fill="#000" opacity={0.12} />
      <circle cx={-3} cy={-2} r={3} fill={colours[1]} />
      <circle cx={2.5} cy={-2.2} r={3.2} fill={colours[1]} />
      <circle cx={0} cy={-4} r={3.6} fill={colours[0]} />
      <circle cx={-1} cy={-5} r={1.6} fill={colours[2]} opacity={0.6} />
      {berries ? (
        <>
          <circle cx={-2} cy={-3} r={0.5} fill="#e63946" />
          <circle cx={1.5} cy={-4.5} r={0.5} fill="#e63946" />
          <circle cx={3} cy={-2} r={0.5} fill="#e63946" />
        </>
      ) : null}
    </g>
  );
}

function Fern({ x, y, colour, still }: { x: number; y: number; colour: string; still: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g style={swayStyle(still, 5, -x % 3)}>
        {[-40, -15, 15, 40].map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <path d="M0,0 Q0.5,-3 0,-6" stroke={colour} strokeWidth={0.3} fill="none" />
            {[1.5, 2.8, 4, 5].map((step) => (
              <g key={step}>
                <ellipse cx={-0.7} cy={-step} rx={0.7} ry={0.3} fill={colour} transform={`rotate(-25 -0.7 ${-step})`} />
                <ellipse cx={0.8} cy={-step} rx={0.7} ry={0.3} fill={colour} transform={`rotate(25 0.8 ${-step})`} />
              </g>
            ))}
          </g>
        ))}
      </g>
    </g>
  );
}

function Mushroom({ x, y, small = false }: { x: number; y: number; small?: boolean }) {
  const s = small ? 0.65 : 1;

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-0.5} y={-2} width={1} height={2} rx={0.4} fill="#fff4e0" />
      <path d="M-2,-1.8 Q0,-4.4 2,-1.8 Z" fill="#e63946" />
      <circle cx={-0.8} cy={-2.6} r={0.3} fill="#fff" />
      <circle cx={0.6} cy={-3} r={0.35} fill="#fff" />
      <circle cx={1.2} cy={-2.2} r={0.22} fill="#fff" />
    </g>
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
 * A native `<title>` names its stage and what that stage means, and (motion
 * permitting) its canopy sways a little and it settles slightly toward the
 * viewer on hover.
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
  const height = 6 + fullness * 22;
  const r = (3.5 + fullness * 10) * canopyScale;
  const trunk = 0.9 + fullness * 1.8;
  const { x, y } = TREE;
  const top = y - height;

  const tooltip = `${label}. ${meaning}`;

  if (stageIndex === 0) {
    // A seed is not yet a tree — a small mound of turned earth with a hint of green.
    return (
      <g>
        <title>{tooltip}</title>
        <ellipse cx={x} cy={y} rx={3} ry={1.1} fill={MUD.base} />
        <ellipse cx={x - 0.6} cy={y - 0.3} rx={1.4} ry={0.4} fill={MUD.light} />
        <g style={swayStyle(still, 3.5, 0)}>
          <path d={`M${x},${y - 0.6} q0.2,-1.4 0,-2.4`} stroke="#5ab83d" strokeWidth={0.3} fill="none" />
          <ellipse cx={x + 0.7} cy={y - 2.6} rx={0.8} ry={0.4} fill="#7bd36f" transform={`rotate(-25 ${x + 0.7} ${y - 2.6})`} />
        </g>
      </g>
    );
  }

  return (
    <motion.g
      whileHover={still ? undefined : { scale: 1.03 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <title>{tooltip}</title>

      {/* Soft shadow on the grass. */}
      <ellipse cx={x + 2} cy={y + 0.5} rx={r * 0.9} ry={1.4} fill="#000" opacity={0.15} />

      {/* Trunk and two branches, tapered. */}
      <path
        d={`M${x - trunk},${y} C${x - trunk * 0.6},${y - height * 0.5} ${x - trunk * 0.4},${top + 2} ${x - trunk * 0.25},${top} L${x + trunk * 0.25},${top} C${x + trunk * 0.4},${top + 2} ${x + trunk * 0.6},${y - height * 0.5} ${x + trunk},${y} Z`}
        fill="#7a4b2a"
      />
      <path
        d={`M${x},${y - height * 0.55} q${-r * 0.35},${-height * 0.15} ${-r * 0.55},${-height * 0.35}`}
        stroke="#7a4b2a"
        strokeWidth={trunk * 0.45}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${x},${y - height * 0.7} q${r * 0.3},${-height * 0.1} ${r * 0.5},${-height * 0.3}`}
        stroke="#7a4b2a"
        strokeWidth={trunk * 0.4}
        strokeLinecap="round"
        fill="none"
      />
      <path d={`M${x - trunk * 0.3},${y - 1} l0,${-height * 0.4}`} stroke="#5c3a21" strokeWidth={0.2} opacity={0.6} />

      <g
        opacity={canopyOpacity}
        style={{
          transformBox: "fill-box",
          transformOrigin: "50% 100%",
          animation: still ? undefined : "sway 9s cubic-bezier(0.45,0,0.55,1) infinite",
        }}
      >
        <circle cx={x - r * 0.7} cy={top - r * 0.1} r={r * 0.7} fill={canopyColours[1]} />
        <circle cx={x + r * 0.75} cy={top} r={r * 0.68} fill={canopyColours[1]} />
        <circle cx={x} cy={top - r * 0.6} r={r} fill={canopyColours[0]} />
        <circle cx={x - r * 0.45} cy={top - r * 0.95} r={r * 0.55} fill={canopyColours[0]} />
        <circle cx={x + r * 0.5} cy={top - r * 0.85} r={r * 0.6} fill={canopyColours[2]} opacity={0.9} />
        <circle cx={x} cy={top - r * 0.6} r={r * 1.05} fill="url(#ss-canopy-light)" />
        {/* A few blossoms or fruit as the tree matures. */}
        {fullness > 0.35
          ? [
              [-0.5, -0.4],
              [0.3, -1.1],
              [0.7, -0.3],
              [-0.2, -0.9],
              [-0.8, 0],
            ].map(([dx, dy], index) => (
              <circle key={index} cx={x + dx * r} cy={top + dy * r} r={0.45 + fullness * 0.3} fill={index % 2 ? "#ff6b8b" : "#ffd23f"} />
            ))
          : null}
      </g>
    </motion.g>
  );
}

interface FlowerGlyphProps {
  x: number;
  y: number;
  scale: number;
  kind: number;
  colour: string;
  delay: number;
  bud: boolean;
  still: boolean;
}

/** A flower with a stem and leaves: a daisy, a tulip, or a round bloom. */
function FlowerGlyph({ x, y, scale, kind, colour, delay, bud, still }: FlowerGlyphProps) {
  const stem = 3.2;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g style={swayStyle(still, 4 + kind, delay)}>
        <path d={`M0,0 q0.4,${-stem / 2} 0,${-stem}`} stroke="#3f8f33" strokeWidth={0.3} fill="none" />
        <ellipse cx={0.6} cy={-1.2} rx={0.7} ry={0.28} fill="#5ab83d" transform="rotate(-30 0.6 -1.2)" />
        <g transform={`translate(0 ${-stem})`}>
          {bud ? (
            <ellipse rx={0.45} ry={0.7} fill={colour} opacity={0.85} />
          ) : kind === 0 ? (
            <>
              {Array.from({ length: 6 }).map((_, index) => (
                <ellipse key={index} cy={-0.75} rx={0.38} ry={0.7} fill={colour} transform={`rotate(${index * 60})`} />
              ))}
              <circle r={0.45} fill="#ffb703" />
            </>
          ) : kind === 1 ? (
            <path d="M-0.9,-0.2 Q-1,-1.6 -0.45,-1.4 L0,-0.8 L0.45,-1.4 Q1,-1.6 0.9,-0.2 Q0,0.7 -0.9,-0.2 Z" fill={colour} />
          ) : (
            <>
              <circle r={0.95} fill={colour} />
              <circle r={0.55} fill="#ffffff" opacity={0.35} />
              <circle r={0.25} fill="#e85d04" />
            </>
          )}
        </g>
      </g>
    </g>
  );
}

interface NoteVesselIconProps {
  vessel: NoteVessel;
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}

/** Resolves a note's vessel to the same icon `DailyNoteCard`'s composer uses. */
function NoteVesselIcon({ vessel, ...iconProps }: NoteVesselIconProps) {
  const entry = VESSELS.find((candidate) => candidate.id === vessel) ?? VESSELS[0];
  const Icon = entry.icon;

  return <Icon {...iconProps} />;
}
