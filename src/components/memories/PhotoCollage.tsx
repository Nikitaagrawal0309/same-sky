import type { ReactNode } from "react";

import { cx } from "../../utils/helpers";

/**
 * A faded wall of polaroids behind the Memories page.
 *
 * Little illustrated snapshots (a couple holding hands, friends at the
 * beach, a picnic, a group jumping on a hill, a selfie, a night on a bench),
 * washed out and scattered like photos pinned to a wall. It hints at what the
 * page is for before any real photo has been added. Drawn in SVG, so nothing
 * needs downloading and nothing looks like a stranger's photo.
 */

const SKIN = ["#f3c9a5", "#d9a17c", "#a8714f", "#7a4b32", "#f6d7bd"];
const HAIR = ["#2b1d14", "#5a3a22", "#c58b3c", "#1a1a1a", "#8a4b2a"];

interface PersonProps {
  x: number;
  y: number;
  skin: number;
  hair: number;
  shirt: string;
  long?: boolean;
  /** Raised arm: waving or holding something up. */
  wave?: "left" | "right";
  scale?: number;
  skirt?: boolean;
}

/** A small, smiling, rounded person standing at (x, y) = feet. */
function Person({ x, y, skin, hair, shirt, long = false, wave, scale = 1, skirt = false }: PersonProps) {
  const skinColour = SKIN[skin % SKIN.length];
  const hairColour = HAIR[hair % HAIR.length];

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Legs */}
      <path d="M-4,-14 L-5,0 M4,-14 L5,0" stroke="#3b3b5c" strokeWidth={3.4} strokeLinecap="round" />
      {/* Body */}
      {skirt ? (
        <path d="M-8,-30 Q0,-34 8,-30 L12,-12 L-12,-12 Z" fill={shirt} />
      ) : (
        <rect x={-8} y={-31} width={16} height={19} rx={6} fill={shirt} />
      )}
      {/* Arms */}
      <path
        d={wave === "left" ? "M-7,-27 L-14,-40" : "M-7,-27 L-11,-15"}
        stroke={skinColour}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d={wave === "right" ? "M7,-27 L14,-40" : "M7,-27 L11,-15"}
        stroke={skinColour}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Long hair sits behind the head */}
      {long ? <path d="M-8,-40 Q-10,-28 -7,-26 L7,-26 Q10,-28 8,-40 Z" fill={hairColour} /> : null}
      {/* Head */}
      <circle cy={-40} r={7} fill={skinColour} />
      <path d="M-7,-41 Q-6,-49 0,-49 Q6,-49 7,-41 Q3,-45 -7,-41 Z" fill={hairColour} />
      {/* Face */}
      <circle cx={-2.4} cy={-40.5} r={0.9} fill="#2b1d14" />
      <circle cx={2.4} cy={-40.5} r={0.9} fill="#2b1d14" />
      <path d="M-2.4,-37.5 Q0,-35.5 2.4,-37.5" stroke="#2b1d14" strokeWidth={0.8} fill="none" strokeLinecap="round" />
      <circle cx={-4} cy={-38} r={1.1} fill="#ff8fab" opacity={0.6} />
      <circle cx={4} cy={-38} r={1.1} fill="#ff8fab" opacity={0.6} />
    </g>
  );
}

function Polaroid({ children, caption, className, rotate }: { children: ReactNode; caption: string; className: string; rotate: number }) {
  return (
    <div
      className={cx("absolute rounded-sm bg-white p-2.5 pb-9 shadow-[0_8px_24px_rgba(0,0,0,0.18)]", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* A bit of tape holding it to the wall */}
      <span className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 rotate-2 bg-amber-100/80" />
      <svg viewBox="0 0 120 100" className="block aspect-[6/5] w-full">
        {children}
      </svg>
      <p className="ss-hand absolute inset-x-0 bottom-1.5 text-center text-lg text-slate-600">{caption}</p>
    </div>
  );
}

export function PhotoCollage({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cx("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 opacity-[0.22] saturate-[0.75] dark:opacity-[0.12]">
        {/* Couple at sunset, heart balloon */}
        <Polaroid caption="us ♥" rotate={-8} className="top-4 -left-6 w-52 sm:left-2 sm:w-60">
          <rect width={120} height={100} fill="#ffcf9e" />
          <circle cx={88} cy={62} r={20} fill="#ff9f5a" />
          <rect y={72} width={120} height={28} fill="#7cc47f" />
          <Person x={50} y={92} skin={0} hair={2} shirt="#ff6b8b" long skirt />
          <Person x={68} y={92} skin={2} hair={0} shirt="#4dabf7" />
          <path d="M57,63 Q59,58 61,63" stroke="#f3c9a5" strokeWidth={3} fill="none" />
          <path d="M76,58 L84,30" stroke="#888" strokeWidth={0.6} />
          <path d="M84,30 c-4,-6 -12,-1 -6,6 l6,6 l6,-6 c6,-7 -2,-12 -6,-6 Z" fill="#ff4d6d" />
        </Polaroid>

        {/* Friends at the beach */}
        <Polaroid caption="beach day!" rotate={6} className="top-10 -right-8 w-56 sm:right-4 sm:w-64">
          <rect width={120} height={100} fill="#a5dcff" />
          <rect y={55} width={120} height={20} fill="#4dabf7" />
          <rect y={75} width={120} height={25} fill="#ffe3a3" />
          <circle cx={20} cy={18} r={8} fill="#ffe066" />
          <Person x={28} y={95} skin={1} hair={1} shirt="#ffd43b" wave="left" />
          <Person x={50} y={95} skin={4} hair={2} shirt="#ff8787" long skirt />
          <Person x={72} y={95} skin={3} hair={3} shirt="#69db7c" wave="right" />
          <Person x={94} y={95} skin={0} hair={4} shirt="#b197fc" long />
        </Polaroid>

        {/* Picnic under a tree */}
        <Polaroid caption="picnic ☀" rotate={4} className="top-[38%] -left-10 w-52 sm:left-6 sm:w-56">
          <rect width={120} height={100} fill="#d3f0ff" />
          <rect y={60} width={120} height={40} fill="#8fd16a" />
          <rect x={90} y={30} width={6} height={35} fill="#7a4b2a" />
          <circle cx={93} cy={28} r={20} fill="#5cb84a" />
          <path d="M18,88 L80,88 L72,76 L26,76 Z" fill="#ff6b6b" />
          <path d="M30,76 L34,88 M46,76 L46,88 M62,76 L58,88" stroke="#fff" strokeWidth={2} />
          <Person x={36} y={82} skin={2} hair={4} shirt="#ffa94d" scale={0.9} long skirt />
          <Person x={60} y={82} skin={0} hair={1} shirt="#74c0fc" scale={0.9} />
        </Polaroid>

        {/* Jumping on a hilltop */}
        <Polaroid caption="best friends" rotate={-5} className="top-[42%] -right-10 w-56 sm:right-8 sm:w-60">
          <rect width={120} height={100} fill="#fff0c2" />
          <path d="M0,78 Q60,52 120,78 L120,100 L0,100 Z" fill="#69db7c" />
          <Person x={36} y={66} skin={3} hair={0} shirt="#ff922b" wave="left" />
          <Person x={60} y={60} skin={1} hair={2} shirt="#f783ac" wave="right" long skirt />
          <Person x={84} y={66} skin={4} hair={3} shirt="#4dabf7" wave="right" />
        </Polaroid>

        {/* A selfie */}
        <Polaroid caption="silly selfie" rotate={9} className="top-[70%] left-[8%] hidden w-48 sm:block">
          <rect width={120} height={100} fill="#ffd8e4" />
          <circle cx={20} cy={20} r={5} fill="#fff" opacity={0.7} />
          <circle cx={100} cy={30} r={4} fill="#fff" opacity={0.7} />
          <Person x={46} y={112} skin={0} hair={2} shirt="#845ef7" scale={1.6} long />
          <Person x={76} y={112} skin={2} hair={0} shirt="#20c997" scale={1.6} wave="right" />
        </Polaroid>

        {/* Stargazing on a bench */}
        <Polaroid caption="stargazing" rotate={-7} className="top-[74%] right-[6%] w-52 sm:w-56">
          <rect width={120} height={100} fill="#25306b" />
          {[
            [15, 15],
            [40, 25],
            [70, 12],
            [100, 22],
            [90, 40],
            [25, 42],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} fill="#fff" />
          ))}
          <circle cx={96} cy={14} r={7} fill="#fff7d6" />
          <rect y={80} width={120} height={20} fill="#2f6b3a" />
          <rect x={30} y={74} width={60} height={4} rx={2} fill="#a0522d" />
          <Person x={50} y={92} skin={4} hair={1} shirt="#ffd43b" long skirt />
          <Person x={70} y={92} skin={1} hair={3} shirt="#ff8787" />
        </Polaroid>
      </div>

      {/* Soft wash so content always reads clearly on top */}
      <div className="absolute inset-0 bg-linear-to-b from-canvas/30 via-canvas/10 to-canvas/40" />
    </div>
  );
}
