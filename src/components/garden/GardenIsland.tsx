import { useId } from "react";
import { motion } from "framer-motion";

import type { DateKey } from "../../types/database";
import type { GardenPlot } from "../../types/garden";
import { GARDEN_PLOT_COUNT, SEEDS } from "../../types/garden";
import type { WorldDaySummary } from "../../types/world";
import { plantGrowth, plantStageLabel } from "../../services/plants";
import { PlantShape } from "./PlantArt";

/**
 * The garden as a little floating island, seen at an angle — a 3 × 3 lawn
 * of grass tiles on a block of soil, the way the Forest app shows its
 * overview. Each tile holds one sown plant (or an empty patch waiting for a
 * seed), drawn back-to-front so nearer trees overlap the ones behind.
 */

const SIZE = 3;
const HALF_W = 48;
const HALF_H = 24;
const ORIGIN_X = 180;
const ORIGIN_Y = 92;
const DEPTH = 34;
const PLANT_SCALE = 1.25;

/** The top corner of tile (row, col). */
function tileTop(row: number, col: number) {
  return { x: ORIGIN_X + (col - row) * HALF_W, y: ORIGIN_Y + (col + row) * HALF_H };
}

export interface GardenIslandProps {
  plots: Record<string, GardenPlot>;
  history: Record<DateKey, WorldDaySummary>;
  still: boolean;
  onSow: (plotId: string) => void;
  onInspect: (plotId: string) => void;
}

export function GardenIsland({ plots, history, still, onSow, onInspect }: GardenIslandProps) {
  const uid = useId().replace(/:/g, "");

  const tiles = Array.from({ length: GARDEN_PLOT_COUNT }, (_, index) => ({
    index,
    row: Math.floor(index / SIZE),
    col: index % SIZE,
  })).sort((a, b) => a.row + a.col - (b.row + b.col) || a.col - b.col);

  const top = tileTop(0, 0);
  const right = { x: ORIGIN_X + SIZE * HALF_W, y: ORIGIN_Y + SIZE * HALF_H };
  const bottom = { x: ORIGIN_X, y: ORIGIN_Y + 2 * SIZE * HALF_H };
  const left = { x: ORIGIN_X - SIZE * HALF_W, y: ORIGIN_Y + SIZE * HALF_H };

  return (
    <motion.svg
      viewBox="0 0 360 290"
      className="relative mx-auto block w-full max-w-xl"
      role="group"
      aria-label="Your garden island"
      style={{ overflow: "visible" }}
      animate={still ? undefined : { y: [0, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id={`${uid}-grass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9be35f" />
          <stop offset="100%" stopColor="#5cb83a" />
        </linearGradient>
        <linearGradient id={`${uid}-soilL`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8703f" />
          <stop offset="100%" stopColor="#6e4423" />
        </linearGradient>
        <linearGradient id={`${uid}-soilR`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5a31" />
          <stop offset="100%" stopColor="#56341a" />
        </linearGradient>
      </defs>

      {/* Soft shadow the island casts below it */}
      <ellipse cx={ORIGIN_X} cy={bottom.y + DEPTH + 20} rx={130} ry={14} fill="#000" opacity={0.14} />

      {/* Soil block: left and right faces, with a grass lip along the top */}
      <path d={`M${left.x},${left.y} L${bottom.x},${bottom.y} L${bottom.x},${bottom.y + DEPTH} L${left.x},${left.y + DEPTH} Z`} fill={`url(#${uid}-soilL)`} />
      <path d={`M${bottom.x},${bottom.y} L${right.x},${right.y} L${right.x},${right.y + DEPTH} L${bottom.x},${bottom.y + DEPTH} Z`} fill={`url(#${uid}-soilR)`} />
      <path
        d={`M${left.x},${left.y} L${bottom.x},${bottom.y} L${right.x},${right.y} L${right.x},${right.y + 8} Q${(bottom.x + right.x) / 2},${(bottom.y + right.y) / 2 + 13} ${bottom.x},${bottom.y + 9} Q${(left.x + bottom.x) / 2},${(left.y + bottom.y) / 2 + 13} ${left.x},${left.y + 8} Z`}
        fill="#4fa833"
      />
      {/* Pebbles and roots in the soil */}
      {[
        [70, 150, 3],
        [110, 172, 2],
        [240, 168, 2.6],
        [285, 150, 2],
        [150, 190, 1.8],
      ].map(([x, y, r], index) => (
        <ellipse key={index} cx={x} cy={y + 12} rx={r} ry={r * 0.7} fill="#c9a27a" opacity={0.55} />
      ))}
      <path d="M95,158 q8,8 4,16 M255,160 q-6,9 -2,16" stroke="#4a2b14" strokeWidth={1} fill="none" opacity={0.5} />

      {/* Lawn: the whole top, then each tile with a gentle checker */}
      <path d={`M${top.x},${top.y} L${right.x},${right.y} L${bottom.x},${bottom.y} L${left.x},${left.y} Z`} fill={`url(#${uid}-grass)`} />

      {tiles.map(({ index, row, col }) => {
        const t = tileTop(row, col);
        const plotId = String(index);
        const plot = plots[plotId];
        const seed = plot ? SEEDS.find((candidate) => candidate.id === plot.seedId) : undefined;
        const growth = plot ? plantGrowth(plot, history) : 0;
        const cx = t.x;
        const cy = t.y + HALF_H;
        const label = seed ? `${seed.name}, ${plantStageLabel(growth, seed.id)}` : `Empty plot ${index + 1}. Sow a seed`;
        const open = () => (seed ? onInspect(plotId) : onSow(plotId));

        return (
          <g
            key={plotId}
            role="button"
            tabIndex={0}
            aria-label={label}
            onClick={open}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
              }
            }}
            className="group cursor-pointer outline-none"
          >
            <title>{label}</title>
            <path
              d={`M${t.x},${t.y} L${t.x + HALF_W},${t.y + HALF_H} L${t.x},${t.y + 2 * HALF_H} L${t.x - HALF_W},${t.y + HALF_H} Z`}
              fill={(row + col) % 2 ? "#8fdc57" : "#7fd04b"}
              stroke="#ffffff"
              strokeOpacity={0.35}
              strokeWidth={0.8}
              className="transition-[fill] duration-200 group-hover:fill-[#a8ec72] group-focus-visible:fill-[#a8ec72]"
            />
            {/* A few grass tufts per tile */}
            {[
              [-22, 2],
              [18, -4],
              [6, 12],
            ].map(([dx, dy], tuft) => (
              <path
                key={tuft}
                d={`M${cx + dx},${cy + dy} l-1.5,-4 M${cx + dx + 1.5},${cy + dy} l0,-5 M${cx + dx + 3},${cy + dy} l1.5,-4`}
                stroke="#4f9e2f"
                strokeWidth={1}
                strokeLinecap="round"
              />
            ))}

            {seed && plot ? (
              <svg
                x={cx - 30 * PLANT_SCALE}
                y={cy + 4 - 76 * PLANT_SCALE}
                width={60 * PLANT_SCALE}
                height={80 * PLANT_SCALE}
                viewBox="0 0 60 80"
                overflow="visible"
                className="transition-transform duration-300 group-hover:-translate-y-1"
              >
                <PlantShape seedId={seed.id} growth={growth} still={still} />
              </svg>
            ) : (
              <g>
                <ellipse cx={cx} cy={cy + 2} rx={16} ry={7} fill="#8a5a31" />
                <ellipse cx={cx} cy={cy + 1} rx={12} ry={5} fill="#a8703f" />
                <g
                  className={still ? undefined : "motion-safe:animate-(--animate-float)"}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                >
                  <circle cx={cx} cy={cy - 14} r={9} fill="#ffffff" opacity={0.85} stroke="#5cb83a" strokeWidth={1.4} strokeDasharray="3 2" />
                  <path d={`M${cx - 4},${cy - 14} h8 M${cx},${cy - 18} v8`} stroke="#3f8f33" strokeWidth={1.8} strokeLinecap="round" />
                </g>
              </g>
            )}
          </g>
        );
      })}
    </motion.svg>
  );
}
