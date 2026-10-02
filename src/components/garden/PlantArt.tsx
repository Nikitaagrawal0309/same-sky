import type { CSSProperties } from "react";

import type { SeedId } from "../../types/garden";
import { SEEDS } from "../../types/garden";

/**
 * Every plant you can sow, drawn at any point in its growth.
 *
 * `growth` runs 0 → 1. Below 0.1 it is a seed in the soil, then a sprout,
 * then a young plant; at 1 flowers are in full bloom, bushes carry roses or
 * berries, and fruit trees bear fruit. Drawn in a 60×80 box with the soil
 * line at y = 76.
 */

export interface PlantArtProps {
  seedId: SeedId;
  growth: number;
  still?: boolean;
  className?: string;
}

function sway(still: boolean | undefined, duration: number): CSSProperties {
  return {
    transformBox: "fill-box",
    transformOrigin: "50% 100%",
    animation: still ? undefined : `sway ${duration}s cubic-bezier(0.45,0,0.55,1) infinite`,
  };
}

const SOIL = 76;

export function PlantArt({ seedId, growth, still, className }: PlantArtProps) {
  const g = Math.max(0, Math.min(1, growth));
  const kind = SEEDS.find((seed) => seed.id === seedId)?.kind ?? "flower";

  return (
    <svg viewBox="0 0 60 80" className={className} aria-hidden style={{ overflow: "visible" }}>
      <ellipse cx={30} cy={SOIL + 1} rx={16} ry={3} fill="#7d5333" />
      <ellipse cx={30} cy={SOIL} rx={12} ry={1.8} fill="#9a6b45" />

      {g < 0.1 ? (
        <g>
          <ellipse cx={30} cy={SOIL - 1.5} rx={3} ry={2} fill="#c08a4f" />
          <path d="M30,73 q1,-3 0,-5" stroke="#86d160" strokeWidth={1.4} fill="none" opacity={g * 10} />
        </g>
      ) : g < 0.35 ? (
        <Sprout g={g} still={still} />
      ) : kind === "flower" ? (
        <Flower seedId={seedId} g={g} still={still} />
      ) : kind === "bush" ? (
        <Bush seedId={seedId} g={g} still={still} />
      ) : (
        <Tree seedId={seedId} g={g} still={still} />
      )}
    </svg>
  );
}

function Sprout({ g, still }: { g: number; still?: boolean }) {
  const h = 6 + g * 30;

  return (
    <g style={sway(still, 3.5)}>
      <path d={`M30,${SOIL} q1.5,${-h / 2} 0,${-h}`} stroke="#3f8f33" strokeWidth={1.8} fill="none" />
      <ellipse cx={26} cy={SOIL - h + 2} rx={4.5} ry={2} fill="#6cc04a" transform={`rotate(-25 26 ${SOIL - h + 2})`} />
      <ellipse cx={34} cy={SOIL - h + 3} rx={4.5} ry={2} fill="#86d160" transform={`rotate(25 34 ${SOIL - h + 3})`} />
    </g>
  );
}

function Flower({ seedId, g, still }: { seedId: SeedId; g: number; still?: boolean }) {
  const h = 22 + g * 30;
  const top = SOIL - h;
  const bloom = g >= 0.75 ? Math.min(1, (g - 0.6) / 0.4) : 0.35;

  return (
    <g style={sway(still, 4)}>
      <path d={`M30,${SOIL} q2,${-h / 2} 0,${-h}`} stroke="#3f8f33" strokeWidth={2} fill="none" />
      <ellipse cx={24} cy={SOIL - h * 0.35} rx={6} ry={2.4} fill="#6cc04a" transform={`rotate(-30 24 ${SOIL - h * 0.35})`} />
      <ellipse cx={36} cy={SOIL - h * 0.55} rx={6} ry={2.4} fill="#86d160" transform={`rotate(30 36 ${SOIL - h * 0.55})`} />

      <g transform={`translate(30 ${top}) scale(${bloom})`}>
        {seedId === "sunflower" ? (
          <>
            {Array.from({ length: 14 }).map((_, index) => (
              <ellipse key={index} cy={-9} rx={2.8} ry={6} fill="#ffc93c" transform={`rotate(${index * (360 / 14)})`} />
            ))}
            <circle r={6.5} fill="#7a4b2a" />
            <circle r={4} fill="#5c3a21" />
          </>
        ) : seedId === "daisy" ? (
          <>
            {Array.from({ length: 10 }).map((_, index) => (
              <ellipse key={index} cy={-6.5} rx={2.2} ry={5} fill="#ffffff" stroke="#eee" strokeWidth={0.3} transform={`rotate(${index * 36})`} />
            ))}
            <circle r={3.6} fill="#ffc300" />
          </>
        ) : seedId === "tulip" ? (
          <path d="M-8,-1 Q-9,-15 -4,-12 L0,-6 L4,-12 Q9,-15 8,-1 Q0,7 -8,-1 Z" fill="#ff5d8f" />
        ) : (
          // Lavender: a tall spike of little purple buds
          Array.from({ length: 8 }).map((_, index) => (
            <ellipse key={index} cx={index % 2 ? 2 : -2} cy={10 - index * 3.6} rx={2.8} ry={2.2} fill={index % 3 ? "#a78bfa" : "#8b5cf6"} />
          ))
        )}
      </g>
    </g>
  );
}

function Bush({ seedId, g, still }: { seedId: SeedId; g: number; still?: boolean }) {
  const s = 0.55 + g * 0.45;
  const fruit = g >= 1 ? 1 : g >= 0.75 ? 0.5 : 0;
  const isRose = seedId === "rose-bush";

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
      <g style={sway(still, 6)}>
        <ellipse cx={-10} cy={-10} rx={11} ry={10} fill="#3f9a35" />
        <ellipse cx={10} cy={-11} rx={12} ry={11} fill="#3f9a35" />
        <ellipse cx={0} cy={-20} rx={13} ry={12} fill="#5cb84a" />
        <ellipse cx={-4} cy={-24} rx={6} ry={4} fill="#86d160" opacity={0.7} />
        {fruit > 0
          ? spots.slice(0, Math.round(spots.length * fruit)).map(([x, y], index) =>
              isRose ? (
                <g key={index} transform={`translate(${x} ${y})`}>
                  <circle r={3.4} fill="#e63946" />
                  <circle r={2} fill="#c1121f" />
                  <circle r={0.8} fill="#ff6b6b" />
                </g>
              ) : (
                <g key={index} transform={`translate(${x} ${y})`}>
                  <circle cx={-1.6} r={2} fill="#3b5bdb" />
                  <circle cx={1.6} cy={0.6} r={2} fill="#4263eb" />
                  <circle cx={0} cy={-1.6} r={2} fill="#364fc7" />
                </g>
              ),
            )
          : null}
      </g>
    </g>
  );
}

const CANOPY: Record<string, { back: string; front: string; light: string; fruit?: string; blossom: string }> = {
  "cherry-tree": { back: "#f9a8d4", front: "#fbcfe8", light: "#fff0f6", blossom: "#ffffff" },
  "apple-tree": { back: "#3f9a35", front: "#5cb84a", light: "#86d160", fruit: "#e63946", blossom: "#ffe4ec" },
  "orange-tree": { back: "#2f8a3a", front: "#4caf50", light: "#7bd36f", fruit: "#ff8c1a", blossom: "#ffffff" },
  "mango-tree": { back: "#2d7a34", front: "#43a047", light: "#76c96b", fruit: "#ffb627", blossom: "#fff3c4" },
};

function Tree({ seedId, g, still }: { seedId: SeedId; g: number; still?: boolean }) {
  const colours = CANOPY[seedId] ?? CANOPY["apple-tree"];
  const h = 14 + g * 34;
  const r = 8 + g * 14;
  const top = SOIL - h;
  const trunk = 1.6 + g * 2.4;
  const showBlossom = g >= 0.75 && (g < 1 || !colours.fruit);
  const showFruit = g >= 1 && colours.fruit;

  const spots = [
    [-0.55, -0.1],
    [0.45, -0.55],
    [0.6, 0.15],
    [-0.2, -0.75],
    [-0.7, -0.5],
    [0.1, 0.1],
    [0.25, -0.95],
  ];

  return (
    <g>
      <path
        d={`M${30 - trunk},${SOIL} C${30 - trunk * 0.6},${SOIL - h * 0.5} ${30 - trunk * 0.4},${top + 3} ${30 - 0.6},${top} L${30 + 0.6},${top} C${30 + trunk * 0.4},${top + 3} ${30 + trunk * 0.6},${SOIL - h * 0.5} ${30 + trunk},${SOIL} Z`}
        fill="#7a4b2a"
      />
      <g style={sway(still, 8)}>
        <circle cx={30 - r * 0.6} cy={top} r={r * 0.68} fill={colours.back} />
        <circle cx={30 + r * 0.6} cy={top + 1} r={r * 0.66} fill={colours.back} />
        <circle cx={30} cy={top - r * 0.5} r={r * 0.9} fill={colours.front} />
        <circle cx={30 - r * 0.3} cy={top - r * 0.85} r={r * 0.4} fill={colours.light} />
        {showBlossom
          ? spots.map(([dx, dy], index) => (
              <circle key={index} cx={30 + dx * r} cy={top + dy * r} r={1.6} fill={colours.blossom} />
            ))
          : null}
        {showFruit
          ? spots.map(([dx, dy], index) => (
              <g key={index}>
                <circle cx={30 + dx * r} cy={top + dy * r + 1} r={seedId === "mango-tree" ? 2.6 : 2.4} fill={colours.fruit} />
                <circle cx={30 + dx * r - 0.8} cy={top + dy * r} r={0.7} fill="#ffffff" opacity={0.6} />
              </g>
            ))
          : null}
      </g>
    </g>
  );
}
