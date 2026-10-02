import { useMemo, type CSSProperties } from "react";
import { motion } from "framer-motion";

import type { DateKey } from "../../types/database";
import type { DomainShare } from "../../types/planning";
import type { RitualDomain } from "../../types/ritual";
import type { WorldDaySummary, WorldSnapshot } from "../../types/world";
import { TREE_STAGES } from "../../services/world";
import { usePrefersStillness } from "../../hooks/useTheme";
import { addDaysToKey, fromDateKey, startOfWeek, toDateKey } from "../../utils/date";
import { cx, formatPercent } from "../../utils/helpers";
import { NaturePanel } from "../ui/NaturePanel";
import { SeedGarden } from "../garden/SeedGarden";

/**
 * The living garden.
 *
 * Growth shown as nature rather than numbers, in four parts:
 *
 *   1. The journey: every stage of the shared tree from seed to ancient,
 *      laid out along a path. Stages you've reached are in full colour, the
 *      next one is coming into leaf, later ones are still faint outlines.
 *   2. The seed garden: plots you sow yourselves, with seeds unlocked by
 *      badges (see `SeedGarden`).
 *   3. The weekly bed: one plant for each of the last 12 weeks, grown as
 *      tall as that week's rituals. A quiet week leaves a seed, not a gap.
 *   4. The flower border: one kind of flower per area of life (body, mind,
 *      craft, together), blooming larger the more you've tended to it.
 */

export interface GrowthGardenProps {
  snapshot: WorldSnapshot;
  history: Record<DateKey, WorldDaySummary>;
  domainShares: DomainShare[];
}

function sway(still: boolean, duration: number, delay = 0): CSSProperties {
  return {
    transformBox: "fill-box",
    transformOrigin: "50% 100%",
    animation: still ? undefined : `sway ${duration}s cubic-bezier(0.45,0,0.55,1) ${delay}s infinite`,
  };
}

export function GrowthGarden({ snapshot, history, domainShares }: GrowthGardenProps) {
  const still = usePrefersStillness();
  const { tree } = snapshot;

  const weeks = useMemo(() => {
    const monday = toDateKey(startOfWeek(new Date()));

    return Array.from({ length: 12 }, (_, index) => {
      const start = addDaysToKey(monday, -7 * (11 - index));
      const rituals = Array.from({ length: 7 }, (_, day) => history[addDaysToKey(start, day)]?.rituals ?? 0).reduce(
        (sum, value) => sum + value,
        0,
      );

      return {
        start,
        rituals,
        label: fromDateKey(start).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      };
    });
  }, [history]);

  const maxWeek = Math.max(1, ...weeks.map((week) => week.rituals));
  const nextStage = tree.next;

  return (
    <NaturePanel
      theme="meadow"
      eyebrow="you grow, it grows"
      title="Your living garden"
      description="Everything you tend to in life shows up here as something green and growing."
    >
      {/* 1. The journey from seed to ancient tree */}
      <div className="overflow-hidden rounded-3xl bg-linear-to-b from-sky-200 via-sky-100 to-lime-100 p-4 shadow-soft dark:from-sky-950 dark:via-slate-900 dark:to-emerald-950">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">From seed to ancient tree</h3>
          <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80">
            {nextStage
              ? `${formatPercent(tree.progress)} of the way to ${nextStage.label.toLowerCase()}`
              : "Fully grown. Ancient and sheltering."}
          </p>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <svg viewBox="0 0 320 122" className="mt-2 w-full min-w-[34rem] sm:min-w-0" role="img" aria-label={`Your tree is at the ${tree.stage.label} stage`}>
          <defs>
            <linearGradient id="gg-soil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8fd16a" />
              <stop offset="100%" stopColor="#4f9a3c" />
            </linearGradient>
          </defs>

          <circle cx={30} cy={22} r={11} fill="#ffd75e" />
          <circle cx={30} cy={22} r={17} fill="#ffd75e" opacity={0.25} />

          <path d="M0,98 C60,92 120,96 180,94 C240,92 280,95 320,93 L320,120 L0,120 Z" fill="url(#gg-soil)" />
          {/* Stepping-stone path linking the stages */}
          <path d="M10,104 C80,100 160,108 240,102 C270,100 300,104 315,103" stroke="#c49a6c" strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray="6 7" opacity={0.7} />

          {TREE_STAGES.map((stage) => {
            const x = 22 + stage.index * 39;
            const reached = stage.index <= tree.stage.index;
            const isCurrent = stage.index === tree.stage.index;
            const isNext = stage.index === tree.stage.index + 1;
            const growth = stage.index / (TREE_STAGES.length - 1);

            return (
              <g key={stage.id} opacity={reached ? 1 : isNext ? 0.55 : 0.22}>
                <title>{`${stage.label}. ${stage.meaning}`}</title>
                <StagePlant x={x} y={97} growth={growth} index={stage.index} still={still || !reached} />
                {isCurrent ? (
                  <motion.g
                    animate={still ? undefined : { y: [0, -3, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <path d={`M${x - 4},${30 - growth * 14} l4,5 l4,-5 Z`} fill="#ec4899" />
                  </motion.g>
                ) : null}
                <text
                  x={x}
                  y={stage.label.split(" ").length > 2 ? 109 : 112}
                  textAnchor="middle"
                  fontSize={5.2}
                  fontWeight={isCurrent ? 800 : 600}
                  fill={isCurrent ? "#be185d" : "#365314"}
                  fontFamily="var(--font-sans)"
                >
                  {/* "A flourishing tree" → "flourishing / tree", so neighbours never collide. */}
                  {stage.label
                    .replace(/^(A|An)\s+/, "")
                    .split(" ")
                    .map((word, line) => (
                      <tspan key={line} x={x} dy={line === 0 ? 0 : 5.6}>
                        {word}
                      </tspan>
                    ))}
                </text>
              </g>
            );
          })}
        </svg>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-lime-400 via-emerald-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${((tree.stage.index + tree.progress) / (TREE_STAGES.length - 1)) * 100}%` }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <p className="mt-2 px-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
          <span className="ss-hand text-lg text-pink-600 dark:text-pink-300">{tree.stage.label}:</span>{" "}
          {tree.stage.meaning}
        </p>
      </div>

      {/* 2. The seed garden: plots you sow yourselves */}
      <div className="mt-6">
        <SeedGarden />
      </div>

      {/* 3. The weekly bed */}
      <div className="mt-6 rounded-3xl bg-white/70 p-4 shadow-soft backdrop-blur-sm dark:bg-white/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h3 className="text-lg font-semibold text-ink">One plant for every week</h3>
          <p className="text-sm text-ink-faint">The more you show up in a week, the taller it grows</p>
        </div>

        <div className="relative mt-3">
          <div className="absolute inset-x-0 bottom-5 h-6 rounded-full bg-linear-to-b from-amber-700 to-amber-900 opacity-80" />
          <div className="relative grid grid-cols-12 items-end gap-0.5 sm:gap-1">
            {weeks.map((week, index) => (
              <div key={week.start} className="group relative flex flex-col items-center" tabIndex={0}>
                <span className="pointer-events-none absolute -top-8 z-10 rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {week.rituals} {week.rituals === 1 ? "ritual" : "rituals"}
                </span>
                <WeekPlant level={week.rituals / maxWeek} hasAny={week.rituals > 0} index={index} still={still} />
                <span className="mt-1 text-[0.6rem] text-ink-faint tabular-nums sm:text-[0.65rem]">{index % 2 === 1 || index === 11 ? week.label : " "}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. The flower border, one flower per area of life */}
      {domainShares.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {domainShares.map((share, index) => (
            <DomainFlower key={share.domain} share={share} index={index} still={still} />
          ))}
        </div>
      ) : null}
    </NaturePanel>
  );
}

/** One stage along the journey: seed, sprout, ... ancient tree. */
function StagePlant({ x, y, growth, index, still }: { x: number; y: number; growth: number; index: number; still: boolean }) {
  if (index === 0) {
    return (
      <g>
        <ellipse cx={x} cy={y} rx={7} ry={2.4} fill="#7d5333" />
        <ellipse cx={x} cy={y - 1.5} rx={2.4} ry={1.7} fill="#c08a4f" />
      </g>
    );
  }

  if (index <= 2) {
    const h = 8 + index * 6;

    return (
      <g style={sway(still, 3.5, -index)}>
        <ellipse cx={x} cy={y} rx={6} ry={1.8} fill="#7d5333" />
        <path d={`M${x},${y} q1,${-h / 2} 0,${-h}`} stroke="#3f8f33" strokeWidth={1.4} fill="none" />
        <ellipse cx={x - 3} cy={y - h + 2} rx={3.4} ry={1.6} fill="#6cc04a" transform={`rotate(-25 ${x - 3} ${y - h + 2})`} />
        <ellipse cx={x + 3} cy={y - h + 3} rx={3.4} ry={1.6} fill="#86d160" transform={`rotate(25 ${x + 3} ${y - h + 3})`} />
        {index === 2 ? <ellipse cx={x + 2.5} cy={y - h / 2} rx={2.6} ry={1.2} fill="#5ab83d" transform={`rotate(20 ${x + 2.5} ${y - h / 2})`} /> : null}
      </g>
    );
  }

  const trunkH = 14 + growth * 34;
  const r = 6 + growth * 12;
  const top = y - trunkH;

  return (
    <g>
      <ellipse cx={x} cy={y + 0.5} rx={r * 0.8} ry={1.8} fill="#000" opacity={0.12} />
      <path d={`M${x - 1.5 - growth},${y} L${x - 0.6},${top} L${x + 0.6},${top} L${x + 1.5 + growth},${y} Z`} fill="#7a4b2a" />
      <g style={sway(still, 7, -index)}>
        <circle cx={x - r * 0.55} cy={top + 1} r={r * 0.65} fill="#3f9a35" />
        <circle cx={x + r * 0.55} cy={top + 1.5} r={r * 0.62} fill="#3f9a35" />
        <circle cx={x} cy={top - r * 0.45} r={r * 0.85} fill="#5cb84a" />
        <circle cx={x - r * 0.25} cy={top - r * 0.7} r={r * 0.4} fill="#86d160" />
        {index >= 5
          ? [
              [-0.4, -0.3],
              [0.35, -0.75],
              [0.5, 0.1],
            ].map(([dx, dy], fruit) => (
              <circle key={fruit} cx={x + dx * r} cy={top + dy * r} r={1.4} fill={fruit % 2 ? "#ffd23f" : "#ff6b8b"} />
            ))
          : null}
      </g>
    </g>
  );
}

const WEEK_PLANT_COLOURS = ["#ff6b8b", "#ffd23f", "#c39bff", "#7cc8ff", "#ff9f43"];

/** A plant for one week, from a resting seed to a tall flowering stem. */
function WeekPlant({ level, hasAny, index, still }: { level: number; hasAny: boolean; index: number; still: boolean }) {
  const height = hasAny ? 30 + level * 90 : 18;
  const bloom = WEEK_PLANT_COLOURS[index % WEEK_PLANT_COLOURS.length];

  return (
    <motion.svg
      viewBox={`0 0 30 ${height}`}
      className="w-full max-w-10"
      style={{ height }}
      initial={still ? false : { scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ duration: 0.8, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      {hasAny ? (
        <g style={sway(still, 3.5 + (index % 3), -index * 0.3)}>
          <path d={`M15,${height} q2,${-(height - 12) / 2} 0,${-(height - 12)}`} stroke="#3f8f33" strokeWidth={2.6} fill="none" />
          {Array.from({ length: Math.max(1, Math.round(level * 4)) }).map((_, leaf) => {
            const ly = height - 10 - leaf * ((height - 24) / 4);

            return (
              <ellipse
                key={leaf}
                cx={leaf % 2 ? 20 : 10}
                cy={ly}
                rx={6.5}
                ry={2.8}
                fill={leaf % 2 ? "#6cc04a" : "#86d160"}
                transform={`rotate(${leaf % 2 ? 25 : -25} ${leaf % 2 ? 20 : 10} ${ly})`}
              />
            );
          })}
          {level > 0.3 ? (
            <g transform="translate(15 10)">
              {Array.from({ length: 6 }).map((_, petal) => (
                <ellipse key={petal} cy={-5} rx={3.4} ry={5} fill={bloom} transform={`rotate(${petal * 60})`} />
              ))}
              <circle r={3.2} fill="#ffb703" />
            </g>
          ) : (
            <ellipse cx={15} cy={10} rx={3} ry={4} fill={bloom} opacity={0.8} />
          )}
        </g>
      ) : (
        <g>
          <ellipse cx={15} cy={height - 6} rx={3} ry={2.2} fill="#c08a4f" />
          <path d={`M15,${height - 8} q1,-3 0,-5`} stroke="#86d160" strokeWidth={1.2} fill="none" />
        </g>
      )}
    </motion.svg>
  );
}

const DOMAIN_FLOWERS: Record<RitualDomain, { name: string; petal: string; centre: string; card: string }> = {
  body: { name: "Sunflower", petal: "#ffc93c", centre: "#7a4b2a", card: "from-amber-100 to-yellow-50 dark:from-amber-950 dark:to-yellow-950/60" },
  mind: { name: "Lavender", petal: "#a78bfa", centre: "#6d28d9", card: "from-violet-100 to-purple-50 dark:from-violet-950 dark:to-purple-950/60" },
  craft: { name: "Tulip", petal: "#fb7185", centre: "#be123c", card: "from-rose-100 to-pink-50 dark:from-rose-950 dark:to-pink-950/60" },
  together: { name: "Forget-me-not", petal: "#60a5fa", centre: "#facc15", card: "from-sky-100 to-blue-50 dark:from-sky-950 dark:to-blue-950/60" },
};

function DomainFlower({ share, index, still }: { share: DomainShare; index: number; still: boolean }) {
  const flower = DOMAIN_FLOWERS[share.domain];
  const scale = 0.55 + share.share * 0.9;

  return (
    <div className={cx("flex flex-col items-center rounded-3xl bg-linear-to-b p-4 text-center shadow-soft", flower.card)}>
      <svg viewBox="0 0 60 70" className="h-20 w-16">
        <g style={sway(still, 4 + index * 0.5, -index)}>
          <path d="M30,70 q3,-18 0,-36" stroke="#3f8f33" strokeWidth={2.4} fill="none" />
          <ellipse cx={22} cy={54} rx={7} ry={2.8} fill="#6cc04a" transform="rotate(-30 22 54)" />
          <ellipse cx={38} cy={48} rx={7} ry={2.8} fill="#86d160" transform="rotate(30 38 48)" />
          <g transform={`translate(30 26) scale(${scale})`}>
            {share.domain === "mind" ? (
              Array.from({ length: 7 }).map((_, bud) => (
                <ellipse key={bud} cx={bud % 2 ? 3 : -3} cy={14 - bud * 4.5} rx={3.4} ry={2.6} fill={flower.petal} />
              ))
            ) : share.domain === "craft" ? (
              <path d="M-11,-2 Q-12,-18 -5,-15 L0,-8 L5,-15 Q12,-18 11,-2 Q0,9 -11,-2 Z" fill={flower.petal} />
            ) : (
              <>
                {Array.from({ length: share.domain === "body" ? 12 : 5 }).map((_, petal, all) => (
                  <ellipse
                    key={petal}
                    cy={share.domain === "body" ? -12 : -8}
                    rx={share.domain === "body" ? 3.6 : 5}
                    ry={share.domain === "body" ? 8 : 6.5}
                    fill={flower.petal}
                    transform={`rotate(${(petal * 360) / all.length})`}
                  />
                ))}
                <circle r={share.domain === "body" ? 7 : 3.6} fill={flower.centre} />
              </>
            )}
          </g>
        </g>
      </svg>
      <p className="mt-1 font-display text-base font-semibold text-ink">{share.label}</p>
      <p className="text-xs text-ink-soft">
        {flower.name} · {share.count} {share.count === 1 ? "ritual" : "rituals"} · {formatPercent(share.share)}
      </p>
    </div>
  );
}
