import type { ReactNode } from "react";

import { cx } from "../../utils/helpers";

/**
 * A colourful section panel with a soft nature scene painted behind it.
 *
 * Each theme pairs a gradient wash with an illustration (meadow, lake,
 * sunset hills, blossoms, forest, starry dusk) so every section further
 * down the page has its own mood instead of all being plain white.
 */

export type NatureTheme = "meadow" | "lake" | "sunset" | "blossom" | "forest" | "dusk";

const THEMES: Record<NatureTheme, { panel: string; eyebrow: string; title: string }> = {
  meadow: {
    panel:
      "from-lime-100 via-emerald-50 to-teal-100 dark:from-emerald-950 dark:via-emerald-900/60 dark:to-teal-950",
    eyebrow: "text-emerald-600 dark:text-emerald-300",
    title: "text-emerald-900 dark:text-emerald-100",
  },
  lake: {
    panel: "from-sky-100 via-cyan-50 to-blue-100 dark:from-sky-950 dark:via-cyan-950 dark:to-blue-950",
    eyebrow: "text-sky-600 dark:text-sky-300",
    title: "text-sky-900 dark:text-sky-100",
  },
  sunset: {
    panel:
      "from-amber-100 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950/70 dark:to-rose-950",
    eyebrow: "text-orange-600 dark:text-orange-300",
    title: "text-orange-950 dark:text-orange-100",
  },
  blossom: {
    panel: "from-pink-100 via-rose-50 to-fuchsia-100 dark:from-pink-950 dark:via-rose-950 dark:to-fuchsia-950",
    eyebrow: "text-pink-600 dark:text-pink-300",
    title: "text-pink-950 dark:text-pink-100",
  },
  forest: {
    panel: "from-green-100 via-lime-50 to-yellow-100 dark:from-green-950 dark:via-lime-950/60 dark:to-yellow-950/70",
    eyebrow: "text-green-700 dark:text-green-300",
    title: "text-green-950 dark:text-green-100",
  },
  dusk: {
    panel: "from-violet-100 via-indigo-50 to-sky-100 dark:from-violet-950 dark:via-indigo-950 dark:to-sky-950",
    eyebrow: "text-violet-600 dark:text-violet-300",
    title: "text-violet-950 dark:text-violet-100",
  },
};

export interface NaturePanelProps {
  theme: NatureTheme;
  title?: string;
  /** A short, handwritten line above the title. */
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  /** Heading level for the title, so each screen keeps an honest outline. */
  level?: 2 | 3;
  className?: string;
}

export function NaturePanel({
  theme,
  title,
  eyebrow,
  description,
  action,
  children,
  level = 2,
  className,
}: NaturePanelProps) {
  const styles = THEMES[theme];
  const Heading = level === 2 ? "h2" : "h3";

  return (
    <section
      className={cx(
        "relative isolate overflow-hidden rounded-[1.6rem] border-2 border-white/70 bg-linear-to-br p-4 shadow-lifted sm:rounded-[2rem] sm:p-8 dark:border-white/10",
        "motion-safe:animate-(--animate-pop-in)",
        styles.panel,
        className,
      )}
    >
      <NatureArt theme={theme} className="pointer-events-none absolute right-0 bottom-0 -z-10 h-full w-full" />

      {title || eyebrow || action ? (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            {eyebrow ? <p className={cx("ss-hand text-xl", styles.eyebrow)}>{eyebrow}</p> : null}
            {title ? (
              <Heading className={cx("text-[1.6rem] leading-tight font-semibold sm:text-3xl", styles.title)}>{title}</Heading>
            ) : null}
            {description ? (
              <p className="mt-1.5 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      {children ? <div className={title || eyebrow ? "mt-5 sm:mt-6" : undefined}>{children}</div> : null}
    </section>
  );
}

/**
 * The soft painted scene in the panel's lower corner. Drawn as SVG so it
 * stays crisp, themes cleanly in dark mode, and needs no image downloads.
 */
export function NatureArt({ theme, className }: { theme: NatureTheme; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 200"
      preserveAspectRatio="xMaxYMax slice"
      className={cx("opacity-35 sm:opacity-60 dark:opacity-25 sm:dark:opacity-35", className)}
    >
      {theme === "meadow" ? <Meadow /> : null}
      {theme === "lake" ? <Lake /> : null}
      {theme === "sunset" ? <SunsetHills /> : null}
      {theme === "blossom" ? <Blossoms /> : null}
      {theme === "forest" ? <Forest /> : null}
      {theme === "dusk" ? <Dusk /> : null}
    </svg>
  );
}

function Meadow() {
  return (
    <g>
      <path d="M180,200 C220,160 280,150 400,155 L400,200 Z" fill="#a7e08a" />
      <path d="M240,200 C280,175 330,172 400,178 L400,200 Z" fill="#6cc04a" />
      {[260, 290, 318, 345, 372, 300, 335].map((x, index) => (
        <g key={index} transform={`translate(${x} ${180 + (index % 3) * 6})`}>
          <path d="M0,0 q2,-10 0,-18" stroke="#3f8f33" strokeWidth={1.5} fill="none" />
          {Array.from({ length: 5 }).map((_, petal) => (
            <ellipse
              key={petal}
              cy={-22}
              rx={2.4}
              ry={4.2}
              fill={["#ff8fb1", "#ffd166", "#ffffff", "#c39bff"][index % 4]}
              transform={`rotate(${petal * 72} 0 -18)`}
            />
          ))}
          <circle cy={-18} r={2.2} fill="#ffb703" />
        </g>
      ))}
      <circle cx={360} cy={50} r={22} fill="#ffe27a" opacity={0.8} />
    </g>
  );
}

function Lake() {
  return (
    <g>
      <path d="M150,150 L215,80 L270,140 L320,70 L400,150 Z" fill="#9fc6e8" />
      <path d="M305,85 L320,70 L335,85 L328,90 L320,84 L312,90 Z" fill="#ffffff" opacity={0.8} />
      <path d="M150,150 L400,150 L400,200 L150,200 Z" fill="#7cc6e6" />
      <path d="M150,150 C220,145 330,155 400,150" stroke="#ffffff" strokeWidth={2} opacity={0.6} fill="none" />
      {[170, 210, 260, 320, 360].map((x, index) => (
        <rect key={index} x={x} y={165 + (index % 2) * 12} width={26} height={2} rx={1} fill="#ffffff" opacity={0.6} />
      ))}
      <g transform="translate(345 150)">
        <path d="M0,0 q-2,-24 2,-40" stroke="#4f8a3a" strokeWidth={2} fill="none" />
        <rect x={-1} y={-46} width={6} height={14} rx={3} fill="#7a4b26" />
      </g>
    </g>
  );
}

function SunsetHills() {
  return (
    <g>
      <circle cx={330} cy={120} r={42} fill="#ffb347" opacity={0.85} />
      <path d="M140,200 C200,130 260,140 320,150 C360,155 380,140 400,135 L400,200 Z" fill="#f4a261" opacity={0.7} />
      <path d="M200,200 C250,160 320,165 400,170 L400,200 Z" fill="#e76f51" opacity={0.7} />
      {[250, 268, 286].map((x, index) => (
        <path key={index} d={`M${x},60 q6,-6 12,0 q6,-6 12,0`} stroke="#7a4b2a" strokeWidth={2} fill="none" opacity={0.6} />
      ))}
    </g>
  );
}

function Blossoms() {
  return (
    <g>
      <path d="M400,20 C340,40 300,80 260,140" stroke="#8a5a3a" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M330,55 C320,80 330,100 340,120" stroke="#8a5a3a" strokeWidth={3} fill="none" strokeLinecap="round" />
      {[
        [300, 95],
        [280, 125],
        [330, 60],
        [360, 40],
        [340, 115],
        [265, 145],
        [315, 80],
        [385, 30],
      ].map(([x, y], index) => (
        <g key={index} transform={`translate(${x} ${y})`}>
          {Array.from({ length: 5 }).map((_, petal) => (
            <ellipse key={petal} cy={-6} rx={4} ry={6} fill={index % 2 ? "#ffb6cf" : "#ff8fb5"} transform={`rotate(${petal * 72})`} />
          ))}
          <circle r={2.5} fill="#ffd23f" />
        </g>
      ))}
    </g>
  );
}

function Forest() {
  return (
    <g>
      <path d="M150,200 C220,170 300,165 400,170 L400,200 Z" fill="#8fd16a" />
      {[
        [230, 1],
        [270, 1.4],
        [310, 1.1],
        [350, 1.6],
        [385, 1.2],
      ].map(([x, s], index) => (
        <g key={index} transform={`translate(${x} ${185}) scale(${s})`}>
          <rect x={-2} y={-8} width={4} height={10} fill="#7a4b2a" />
          <path d="M-16,-8 L0,-38 L16,-8 Z" fill={index % 2 ? "#3f9a35" : "#5cb84a"} />
          <path d="M-12,-24 L0,-50 L12,-24 Z" fill={index % 2 ? "#5cb84a" : "#3f9a35"} />
        </g>
      ))}
    </g>
  );
}

function Dusk() {
  return (
    <g>
      <circle cx={340} cy={55} r={24} fill="#fff7d6" opacity={0.9} />
      <circle cx={352} cy={48} r={22} fill="#c4b5fd" opacity={0.6} />
      {[
        [220, 40],
        [260, 80],
        [300, 30],
        [380, 100],
        [240, 120],
        [390, 20],
      ].map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r={1.8} fill="#ffffff" />
      ))}
      <path d="M160,200 C220,160 300,150 400,160 L400,200 Z" fill="#8b7fd6" opacity={0.6} />
    </g>
  );
}
