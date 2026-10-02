import { useId, type CSSProperties } from "react";

import type { SeedId } from "../../types/garden";
import { SEEDS } from "../../types/garden";

/**
 * Every plant you can sow, drawn at any point in its growth.
 *
 * `growth` runs 0 → 1: a seed in the soil, a sprout, a young plant, then
 * full bloom — bushes carry roses or berries, fruit trees blossom and then
 * bear fruit. Drawn in a 60×80 box with the soil line at y = 76.
 *
 * Foliage is built from several overlapping clumps, each lit from the top
 * left with a soft gradient and a darker underside, so canopies read as
 * rounded and full rather than flat circles. Each tree has its own
 * silhouette and its own small motion: willow strands sway one by one,
 * maple and cherry trees let go of a leaf or a petal now and then, and the
 * moonlit tree's moon glows.
 */

export interface PlantArtProps {
  seedId: SeedId;
  growth: number;
  still?: boolean;
  className?: string;
}

/** A standalone plant, in its own little SVG. */
export function PlantArt({ seedId, growth, still, className }: PlantArtProps) {
  return (
    <svg viewBox="0 0 60 80" className={className} aria-hidden style={{ overflow: "visible" }}>
      <PlantShape seedId={seedId} growth={growth} still={still} />
    </svg>
  );
}

const SOIL = 76;

function sway(still: boolean | undefined, duration: number, delay = 0): CSSProperties {
  return {
    transformBox: "fill-box",
    transformOrigin: "50% 100%",
    animation: still ? undefined : `sway ${duration}s cubic-bezier(0.45,0,0.55,1) ${delay}s infinite`,
  };
}

/**
 * The plant itself, as SVG content in the 60×80 coordinate box — so it can
 * also be placed directly inside a larger drawing (the garden island).
 */
export function PlantShape({
  seedId,
  growth,
  still,
  soil = true,
}: {
  seedId: SeedId;
  growth: number;
  still?: boolean;
  soil?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const g = Math.max(0, Math.min(1, growth));
  const kind = SEEDS.find((seed) => seed.id === seedId)?.kind ?? "flower";

  return (
    <g>
      {soil ? (
        <>
          <ellipse cx={30} cy={SOIL + 1} rx={15} ry={3.2} fill="#6b4426" />
          <ellipse cx={30} cy={SOIL} rx={11} ry={2} fill="#9a6b45" />
        </>
      ) : null}

      {g < 0.1 ? (
        <g>
          <ellipse cx={30} cy={SOIL - 1.5} rx={3} ry={2} fill="#c08a4f" />
          <path d="M30,73 q1,-3 0,-5" stroke="#86d160" strokeWidth={1.4} fill="none" opacity={Math.max(0.3, g * 10)} />
        </g>
      ) : g < 0.35 ? (
        <Sprout g={g} still={still} />
      ) : kind === "flower" ? (
        <Flower seedId={seedId} g={g} still={still} />
      ) : kind === "bush" ? (
        <Bush seedId={seedId} g={g} still={still} uid={uid} />
      ) : (
        <Tree seedId={seedId} g={g} still={still} uid={uid} />
      )}
    </g>
  );
}

function Sprout({ g, still }: { g: number; still?: boolean }) {
  const h = 6 + g * 30;

  return (
    <g style={sway(still, 3.5)}>
      <path d={`M30,${SOIL} q1.5,${-h / 2} 0,${-h}`} stroke="#3f8f33" strokeWidth={1.8} fill="none" />
      <path d={`M30,${SOIL - h + 2} c-3,-4 -9,-3 -8,1 c2,2 6,2 8,-1 Z`} fill="#6cc04a" />
      <path d={`M30,${SOIL - h + 3} c3,-5 10,-4 9,0 c-2,3 -7,3 -9,0 Z`} fill="#86d160" />
    </g>
  );
}

/* -------------------------------------------------------------------------
   Flowers
   ------------------------------------------------------------------------- */

function Flower({ seedId, g, still }: { seedId: SeedId; g: number; still?: boolean }) {
  const h = 22 + g * 30;
  const top = SOIL - h;
  const bloom = g >= 0.75 ? Math.min(1, (g - 0.6) / 0.4) : 0.35;

  return (
    <g style={sway(still, 4)}>
      <path d={`M30,${SOIL} q2,${-h / 2} 0,${-h}`} stroke="#3f8f33" strokeWidth={2} fill="none" />
      <path d={`M30,${SOIL - h * 0.35} c-4,-3 -10,-2 -10,1 c3,2 7,2 10,-1 Z`} fill="#5ab83d" />
      <path d={`M30,${SOIL - h * 0.55} c4,-3 10,-2 10,1 c-3,2 -7,2 -10,-1 Z`} fill="#86d160" />

      <g transform={`translate(30 ${top}) scale(${bloom})`}>
        {seedId === "sunflower" ? (
          <>
            {Array.from({ length: 16 }).map((_, index) => (
              <ellipse key={index} cy={-9} rx={2.8} ry={6.2} fill={index % 2 ? "#ffd23f" : "#ffbf1f"} transform={`rotate(${index * 22.5})`} />
            ))}
            <circle r={6.5} fill="#7a4b2a" />
            <circle r={4.5} fill="#5c3a21" />
            <circle r={2} cx={-1.5} cy={-1.5} fill="#8a5a33" />
          </>
        ) : seedId === "daisy" ? (
          <>
            {Array.from({ length: 12 }).map((_, index) => (
              <ellipse key={index} cy={-6.5} rx={2} ry={5} fill="#ffffff" stroke="#f1f1f1" strokeWidth={0.3} transform={`rotate(${index * 30})`} />
            ))}
            <circle r={3.6} fill="#ffc300" />
            <circle r={1.4} cx={-1} cy={-1} fill="#ffe27a" />
          </>
        ) : seedId === "tulip" ? (
          <>
            <path d="M-8,-1 Q-9,-15 -4,-12 L0,-6 L4,-12 Q9,-15 8,-1 Q0,7 -8,-1 Z" fill="#ff5d8f" />
            <path d="M-3,-11 L0,-6 L3,-11 Q2,-1 0,2 Q-2,-1 -3,-11 Z" fill="#ff8fb1" />
          </>
        ) : (
          Array.from({ length: 9 }).map((_, index) => (
            <ellipse key={index} cx={index % 2 ? 2 : -2} cy={10 - index * 3.4} rx={2.8} ry={2.2} fill={index % 3 ? "#a78bfa" : "#8b5cf6"} />
          ))
        )}
      </g>
    </g>
  );
}

/* -------------------------------------------------------------------------
   Bushes
   ------------------------------------------------------------------------- */

function Bush({ seedId, g, still, uid }: { seedId: SeedId; g: number; still?: boolean; uid: string }) {
  const s = 0.55 + g * 0.45;
  const fruit = g >= 1 ? 1 : g >= 0.75 ? 0.5 : 0;
  const isRose = seedId === "rose-bush";
  const leaf = `${uid}-bush`;

  const spots = [
    [-9, -14],
    [6, -18],
    [12, -9],
    [-3, -24],
    [-13, -6],
    [2, -10],
    [9, -26],
  ];

  return (
    <g transform={`translate(30 ${SOIL}) scale(${s})`}>
      <defs>
        <radialGradient id={leaf} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#8fdc6a" />
          <stop offset="55%" stopColor="#4caf3a" />
          <stop offset="100%" stopColor="#2d7a26" />
        </radialGradient>
      </defs>
      <g style={sway(still, 6)}>
        <ellipse cx={0} cy={-2} rx={17} ry={4} fill="#000" opacity={0.15} />
        <ellipse cx={-10} cy={-10} rx={11} ry={10} fill={`url(#${leaf})`} />
        <ellipse cx={10} cy={-11} rx={12} ry={11} fill={`url(#${leaf})`} />
        <ellipse cx={0} cy={-20} rx={13} ry={12} fill={`url(#${leaf})`} />
        <ellipse cx={0} cy={-5} rx={15} ry={4} fill="#1f5c1c" opacity={0.25} />
        <ellipse cx={-5} cy={-25} rx={5} ry={3} fill="#c8f59a" opacity={0.5} />
        {fruit > 0
          ? spots.slice(0, Math.round(spots.length * fruit)).map(([x, y], index) =>
              isRose ? (
                <g key={index} transform={`translate(${x} ${y})`}>
                  <circle r={3.4} fill="#e63946" />
                  <path d="M-2,0 A2,2 0 0 1 2,0" stroke="#a4161a" strokeWidth={0.8} fill="none" />
                  <circle r={1.3} fill="#c1121f" />
                  <circle r={0.7} cx={-1.2} cy={-1.2} fill="#ff8080" />
                </g>
              ) : (
                <g key={index} transform={`translate(${x} ${y})`}>
                  <circle cx={-1.6} r={2} fill="#3b5bdb" />
                  <circle cx={1.6} cy={0.6} r={2} fill="#4263eb" />
                  <circle cx={0} cy={-1.6} r={2} fill="#364fc7" />
                  <circle cx={-0.6} cy={-2.2} r={0.6} fill="#c5d0ff" />
                </g>
              ),
            )
          : null}
      </g>
    </g>
  );
}

/* -------------------------------------------------------------------------
   Trees
   ------------------------------------------------------------------------- */

interface TreeLook {
  light: string;
  mid: string;
  dark: string;
  shape: "round" | "pine" | "willow";
  fruit?: string;
  fruitShine?: string;
  blossom?: string;
  /** Leaves or petals that drift down now and then. */
  falling?: string;
  moon?: boolean;
}

const TREE_LOOKS: Partial<Record<SeedId, TreeLook>> = {
  "cherry-tree": { light: "#fff0f6", mid: "#ffb3d3", dark: "#e17aa6", shape: "round", falling: "#ffc2dc" },
  "apple-tree": { light: "#a6e38a", mid: "#55b443", dark: "#2c7a2a", shape: "round", fruit: "#e63946", fruitShine: "#ffb3b3", blossom: "#ffe4ec" },
  "orange-tree": { light: "#9be07a", mid: "#46a843", dark: "#24722b", shape: "round", fruit: "#ff8c1a", fruitShine: "#ffd29e", blossom: "#ffffff" },
  "mango-tree": { light: "#94d873", mid: "#3e9d40", dark: "#1f6a2a", shape: "round", fruit: "#ffb627", fruitShine: "#fff1b8", blossom: "#fff3c4" },
  "lemon-tree": { light: "#b2e88a", mid: "#5fb84a", dark: "#2f7f2e", shape: "round", fruit: "#ffe03a", fruitShine: "#fffbd1", blossom: "#ffffff" },
  "peach-tree": { light: "#a9e08a", mid: "#58b04a", dark: "#2d762e", shape: "round", fruit: "#ff9e7a", fruitShine: "#ffe0d1", blossom: "#ffd1e3" },
  "maple-tree": { light: "#ffd27a", mid: "#f26b2a", dark: "#b0321a", shape: "round", falling: "#f26b2a" },
  "moon-tree": { light: "#7fb2ff", mid: "#3768d6", dark: "#1a2f78", shape: "round", moon: true },
  "pine-tree": { light: "#6fca7a", mid: "#2f8f4a", dark: "#165c33", shape: "pine" },
  "willow-tree": { light: "#c4ec8c", mid: "#7cbf52", dark: "#3f7f34", shape: "willow" },
};

const FRUIT_SPOTS = [
  [-0.55, -0.15],
  [0.45, -0.6],
  [0.62, 0.12],
  [-0.2, -0.82],
  [-0.72, -0.55],
  [0.12, 0.08],
  [0.28, -1.05],
  [-0.38, 0.18],
];

function Trunk({ uid, g, top, width }: { uid: string; g: number; top: number; width: number }) {
  const bark = `${uid}-bark`;

  return (
    <g>
      <defs>
        <linearGradient id={bark} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a8704a" />
          <stop offset="55%" stopColor="#7a4b2a" />
          <stop offset="100%" stopColor="#4e2e17" />
        </linearGradient>
      </defs>
      <path
        d={`M${30 - width - 2},${SOIL} Q${30 - width},${SOIL - 3} ${30 - width * 0.7},${SOIL - 8} C${30 - width * 0.45},${SOIL - (SOIL - top) * 0.55} ${30 - width * 0.3},${top + 3} ${30 - 0.7},${top} L${30 + 0.7},${top} C${30 + width * 0.3},${top + 3} ${30 + width * 0.45},${SOIL - (SOIL - top) * 0.55} ${30 + width * 0.7},${SOIL - 8} Q${30 + width},${SOIL - 3} ${30 + width + 2},${SOIL} Z`}
        fill={`url(#${bark})`}
      />
      {g > 0.5 ? (
        <>
          <path d={`M30,${top + (SOIL - top) * 0.35} q-5,-3 -9,-9`} stroke="#6b4426" strokeWidth={width * 0.4} strokeLinecap="round" fill="none" />
          <path d={`M30,${top + (SOIL - top) * 0.25} q5,-3 8,-8`} stroke="#6b4426" strokeWidth={width * 0.35} strokeLinecap="round" fill="none" />
        </>
      ) : null}
      <path d={`M${30 - width * 0.2},${SOIL - 6} l0,-${(SOIL - top) * 0.4}`} stroke="#3d2412" strokeWidth={0.5} opacity={0.5} />
    </g>
  );
}

function Tree({ seedId, g, still, uid }: { seedId: SeedId; g: number; still?: boolean; uid: string }) {
  const look = TREE_LOOKS[seedId] ?? TREE_LOOKS["apple-tree"]!;
  const h = 14 + g * 32;
  const r = 8 + g * 14;
  const top = SOIL - h;
  const trunkWidth = 1.6 + g * 2.6;
  const leaf = `${uid}-leaf`;
  const showBlossom = Boolean(look.blossom) && g >= 0.75 && g < 1;
  const showFruit = Boolean(look.fruit) && g >= 1;

  return (
    <g>
      <defs>
        <radialGradient id={leaf} cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor={look.light} />
          <stop offset="55%" stopColor={look.mid} />
          <stop offset="100%" stopColor={look.dark} />
        </radialGradient>
        {look.moon ? (
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0%" stopColor="#fff6b0" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#fff6b0" stopOpacity={0} />
          </radialGradient>
        ) : null}
      </defs>

      {/* Contact shadow */}
      <ellipse cx={32} cy={SOIL} rx={r * 0.95} ry={2.6} fill="#000" opacity={0.18} />

      {look.shape === "pine" ? (
        <>
          <Trunk uid={uid} g={g} top={SOIL - h * 0.35} width={trunkWidth * 0.8} />
          <g style={sway(still, 9)}>
            {[0, 1, 2, 3].map((tier) => {
              const y = SOIL - h * 0.3 - tier * (h * 0.22);
              const w = r * (1.15 - tier * 0.22);
              const tierH = h * 0.36;

              return (
                <g key={tier}>
                  <path d={`M${30 - w},${y} Q30,${y + 3} ${30 + w},${y} L30,${y - tierH} Z`} fill={`url(#${leaf})`} />
                  <path d={`M30,${y - tierH} L${30 + w},${y} Q${30 + w * 0.5},${y + 2} 30,${y + 1.5} Z`} fill={look.dark} opacity={0.35} />
                </g>
              );
            })}
          </g>
        </>
      ) : look.shape === "willow" ? (
        <>
          <Trunk uid={uid} g={g} top={top} width={trunkWidth} />
          <g style={sway(still, 10)}>
            <ellipse cx={30} cy={top - r * 0.2} rx={r * 1.05} ry={r * 0.7} fill={`url(#${leaf})`} />
            {Array.from({ length: 11 }).map((_, index) => {
              const x = 30 - r + (index * (2 * r)) / 10;
              const length = r * (0.9 + ((index * 7) % 5) * 0.12);

              return (
                <path
                  key={index}
                  d={`M${x},${top - r * 0.1} q${index % 2 ? 2 : -2},${length * 0.5} ${index % 2 ? 1 : -1},${length}`}
                  stroke={index % 3 ? look.mid : look.light}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  fill="none"
                  style={sway(still, 3 + (index % 4) * 0.6, -index * 0.3)}
                />
              );
            })}
          </g>
        </>
      ) : (
        <>
          <Trunk uid={uid} g={g} top={top} width={trunkWidth} />
          <g style={sway(still, 8)}>
            <circle cx={30 - r * 0.62} cy={top + r * 0.02} r={r * 0.64} fill={`url(#${leaf})`} />
            <circle cx={30 + r * 0.62} cy={top + r * 0.08} r={r * 0.62} fill={`url(#${leaf})`} />
            <circle cx={30} cy={top - r * 0.5} r={r * 0.88} fill={`url(#${leaf})`} />
            <circle cx={30 - r * 0.3} cy={top - r * 1.0} r={r * 0.5} fill={`url(#${leaf})`} />
            <circle cx={30 + r * 0.35} cy={top - r * 0.95} r={r * 0.46} fill={`url(#${leaf})`} />
            {/* Shade under the canopy and a little sunlight on top */}
            <ellipse cx={30} cy={top + r * 0.42} rx={r * 1.05} ry={r * 0.22} fill={look.dark} opacity={0.35} />
            <ellipse cx={30 - r * 0.4} cy={top - r * 1.15} rx={r * 0.32} ry={r * 0.18} fill="#ffffff" opacity={0.3} />
            {/* Leaf specks */}
            {[
              [-0.7, -0.2],
              [0.5, -0.4],
              [-0.1, -0.9],
              [0.7, 0.1],
              [-0.4, -0.55],
            ].map(([dx, dy], index) => (
              <ellipse key={index} cx={30 + dx * r} cy={top + dy * r} rx={1.2} ry={0.7} fill={look.light} opacity={0.6} transform={`rotate(${index * 40} ${30 + dx * r} ${top + dy * r})`} />
            ))}

            {look.moon && g >= 0.75 ? (
              <g>
                <circle cx={30} cy={top - r * 0.5} r={r * 0.75} fill={`url(#${uid}-glow)`} className={still ? undefined : "motion-safe:animate-(--animate-shimmer)"} />
                <path
                  d={`M${30 + r * 0.05},${top - r * 0.85} a${r * 0.36},${r * 0.36} 0 1 0 ${r * 0.18},${r * 0.68} a${r * 0.28},${r * 0.28} 0 1 1 ${-r * 0.18},${-r * 0.68} Z`}
                  fill="#ffe26a"
                />
                {[
                  [-0.6, -0.9],
                  [0.65, -0.7],
                  [0.5, 0.15],
                ].map(([dx, dy], index) => (
                  <circle key={index} cx={30 + dx * r} cy={top + dy * r} r={0.8} fill="#fffbe0" className={still ? undefined : "motion-safe:animate-(--animate-shimmer)"} style={{ animationDelay: `${index * 0.7}s` }} />
                ))}
              </g>
            ) : null}

            {showBlossom
              ? FRUIT_SPOTS.map(([dx, dy], index) => (
                  <g key={index} transform={`translate(${30 + dx * r} ${top + dy * r})`}>
                    {Array.from({ length: 5 }).map((_, petal) => (
                      <ellipse key={petal} cy={-1} rx={0.8} ry={1.2} fill={look.blossom} transform={`rotate(${petal * 72})`} />
                    ))}
                    <circle r={0.5} fill="#ffcf3f" />
                  </g>
                ))
              : null}

            {showFruit
              ? FRUIT_SPOTS.map(([dx, dy], index) => (
                  <g key={index} transform={`translate(${30 + dx * r} ${top + dy * r + 1})`}>
                    <path d="M0,-2.4 q0.8,-1.5 2,-1.6" stroke="#5c3a21" strokeWidth={0.5} fill="none" />
                    {seedId === "lemon-tree" || seedId === "mango-tree" ? (
                      <ellipse rx={2.2} ry={2.8} fill={look.fruit} transform="rotate(20)" />
                    ) : (
                      <circle r={2.5} fill={look.fruit} />
                    )}
                    <circle cx={-0.8} cy={-0.9} r={0.8} fill={look.fruitShine} opacity={0.85} />
                  </g>
                ))
              : null}
          </g>
        </>
      )}

      {/* A leaf or a petal drifting down now and then */}
      {look.falling && g >= 0.6 && !still
        ? [0, 1].map((index) => (
            <ellipse
              key={index}
              cx={30 + (index ? r * 0.5 : -r * 0.6)}
              cy={top}
              rx={1.1}
              ry={0.7}
              fill={look.falling}
              style={{
                animation: `leaf-fall ${4 + index * 1.5}s ease-in ${index * 2.2}s infinite`,
                transformBox: "fill-box",
              }}
            />
          ))
        : null}
    </g>
  );
}
