import { useEffect, useId, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { playBirdChirp } from "../../services/audio";
import { BirdGlyph } from "./Birds";
import { PLUMAGE, type Perch } from "./birdData";

/**
 * A lush old oak by the pond, and the birds that visit it.
 *
 * Drawn in the scene's own SVG coordinates (the caller places it), with
 * layered, sunlit foliage clumps and a couple of branches reaching out of
 * the canopy. During the day birds fly in from the sky, land on a branch,
 * fold their wings, bob and chirp for a while, then fly off again.
 */

const swayStyle = (still: boolean, duration: number, delay = 0): CSSProperties => ({
  transformBox: "fill-box",
  transformOrigin: "50% 100%",
  animation: still
    ? undefined
    : `var(--sway-name, sway) calc(${duration}s * var(--sway-speed, 1)) cubic-bezier(0.45,0,0.55,1) ${delay}s infinite`,
});

export function MeadowOak({ x, y, still, colours }: { x: number; y: number; still: boolean; colours: readonly [string, string, string] }) {
  const uid = useId().replace(/:/g, "");
  const [light, mid, dark] = colours;

  const clumps = [
    { dx: -7, dy: -20, r: 7.5 },
    { dx: 7.5, dy: -21, r: 7.5 },
    { dx: 0, dy: -27, r: 9 },
    { dx: -4.5, dy: -32, r: 5.5 },
    { dx: 5, dy: -31.5, r: 5.5 },
    { dx: 0, dy: -18, r: 6 },
  ];

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-leaf`} cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <linearGradient id={`${uid}-bark`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a8704a" />
          <stop offset="55%" stopColor="#7a4b2a" />
          <stop offset="100%" stopColor="#4e2e17" />
        </linearGradient>
      </defs>

      <ellipse cx={x + 2} cy={y + 0.6} rx={13} ry={1.8} fill="#000" opacity={0.18} />

      {/* Trunk with root flare */}
      <path
        d={`M${x - 3.4},${y} Q${x - 2.6},${y - 1.5} ${x - 1.8},${y - 4} C${x - 1.4},${y - 10} ${x - 1.2},${y - 16} ${x - 0.8},${y - 20} L${x + 0.8},${y - 20} C${x + 1.2},${y - 16} ${x + 1.4},${y - 10} ${x + 1.8},${y - 4} Q${x + 2.6},${y - 1.5} ${x + 3.4},${y} Z`}
        fill={`url(#${uid}-bark)`}
      />
      <path d={`M${x - 0.6},${y - 3} l0,-9`} stroke="#3d2412" strokeWidth={0.25} opacity={0.6} />

      <g style={swayStyle(still, 9)}>
        {/* Branches reaching out of the canopy: the perches */}
        <path d={`M${x},${y - 13} q7,-3 15,-5`} stroke="#6b4426" strokeWidth={1.1} strokeLinecap="round" fill="none" />
        <path d={`M${x},${y - 12} q-6,-2 -13,-3.6`} stroke="#6b4426" strokeWidth={1} strokeLinecap="round" fill="none" />
        <path d={`M${x + 13},${y - 18} l1.5,-1.6 M${x - 11.5},${y - 15.4} l-1,-1.6`} stroke="#6b4426" strokeWidth={0.5} strokeLinecap="round" />

        {clumps.map((clump, index) => (
          <circle key={index} cx={x + clump.dx} cy={y + clump.dy} r={clump.r} fill={`url(#${uid}-leaf)`} />
        ))}
        {/* Shade under the canopy, sun on top, and a few leaf specks */}
        <ellipse cx={x} cy={y - 15} rx={11} ry={2.6} fill={dark} opacity={0.35} />
        <ellipse cx={x - 3} cy={y - 34} rx={3.4} ry={1.6} fill="#fff" opacity={0.28} />
        {[
          [-6, -24],
          [4, -27],
          [-1, -31],
          [7, -21],
          [-3, -19],
        ].map(([dx, dy], index) => (
          <ellipse key={index} cx={x + dx} cy={y + dy} rx={0.9} ry={0.5} fill={light} opacity={0.65} transform={`rotate(${index * 37} ${x + dx} ${y + dy})`} />
        ))}
      </g>
    </g>
  );
}

type Phase = "away" | "arriving" | "perched" | "leaving";

/**
 * One bird's visits to a perch, on a loop: fly in, sit, chirp, fly off,
 * rest out of sight, come back.
 */
function VisitingBird({ perch, index, still }: { perch: Perch; index: number; still: boolean }) {
  const [phase, setPhase] = useState<Phase>("away");
  const [chirp, setChirp] = useState(0);
  const fromLeft = index % 2 === 0;
  const plumage = PLUMAGE[(index + 1) % PLUMAGE.length];

  // Glyph is 9 × 6.5 units; offset so its feet rest on the perch.
  const sit = { x: perch.x - 4.5, y: perch.y - 6.2 };
  const entry = { x: fromLeft ? -50 : 250, y: 8 + index * 6 };
  const exit = { x: fromLeft ? 250 : -50, y: 4 + index * 4 };

  useEffect(() => {
    if (still) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    if (phase === "away") {
      timer = setTimeout(() => setPhase("arriving"), 4000 + index * 6000 + Math.random() * 6000);
    } else if (phase === "perched") {
      timer = setTimeout(() => setPhase("leaving"), 6000 + Math.random() * 5000);
    }

    return () => clearTimeout(timer);
  }, [phase, index, still]);

  // A chirp or two while perched.
  useEffect(() => {
    if (phase !== "perched") return;

    const first = setTimeout(() => {
      setChirp((value) => value + 1);
      playBirdChirp(0.9 + index * 0.15);
    }, 900);
    const second = setTimeout(() => setChirp((value) => value + 1), 3600);

    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [phase, index]);

  if (still) return null;

  const target = phase === "away" ? entry : phase === "leaving" ? exit : sit;
  // Birds from the left face right the whole visit, and vice versa.
  const flyingRight = fromLeft;
  const duration = phase === "arriving" ? 3.4 : phase === "leaving" ? 3 : 0;

  return (
    <motion.g
      initial={entry}
      animate={target}
      transition={{ duration, ease: phase === "arriving" ? [0.22, 0.8, 0.3, 1] : [0.6, 0, 0.9, 0.6] }}
      onAnimationComplete={() => {
        if (phase === "arriving") setPhase("perched");
        else if (phase === "leaving") setPhase("away");
      }}
    >
      {/* A gentle bob while sitting */}
      <motion.g
        animate={phase === "perched" ? { y: [0, -0.6, 0, -0.3, 0], rotate: [0, -4, 0] } : { y: 0, rotate: 0 }}
        transition={phase === "perched" ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        <g transform={flyingRight ? undefined : "translate(9 0) scale(-1 1)"}>
          <BirdGlyph size={9} flip={false} plumage={plumage} still={false} index={index} flapping={phase !== "perched"} />
        </g>
      </motion.g>

      <AnimatePresence>
        {phase === "perched" && chirp > 0 ? (
          <motion.text
            key={chirp}
            x={6}
            y={-1}
            fontSize={4}
            fill="#ffffff"
            stroke="#334155"
            strokeWidth={0.3}
            paintOrder="stroke"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          >
            ♪
          </motion.text>
        ) : null}
      </AnimatePresence>
    </motion.g>
  );
}

export function PerchingBirds({ perches, still }: { perches: Perch[]; still: boolean }) {
  return (
    <g>
      {perches.slice(0, 2).map((perch, index) => (
        <VisitingBird key={index} perch={perch} index={index} still={still} />
      ))}
    </g>
  );
}
