import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { playBirdChirp } from "../../services/audio";
import { seededSequence } from "../../utils/helpers";
import { PLUMAGE } from "./birdData";

/**
 * Little birds that fly across the sky, flapping and smiling.
 *
 * Every so often one of them chirps: a speech bubble pops up and, if ambient
 * sound is on, a short synthesised chirrup plays. Tapping a bird makes it
 * chirp straight away. Paths, colours and timings are seeded, so the same
 * flock comes back each visit.
 */



const CHIRPS = ["tweet!", "chirp ♪", "tweet tweet!", "♪ ♫", "hello!", "cheep!"];

export interface BirdsProps {
  /** How many birds are in the air. */
  count?: number;
  seed: string;
  still?: boolean;
}

export function Birds({ count = 3, seed, still = false }: BirdsProps) {
  const flock = useMemo(() => {
    const values = seededSequence(`${seed}:birds`, count * 5);

    return Array.from({ length: count }, (_, index) => ({
      top: 6 + values[index * 5] * 24,
      duration: 16 + values[index * 5 + 1] * 12,
      delay: index * 2.5 + values[index * 5 + 2] * 1.5,
      size: 46 + values[index * 5 + 3] * 18,
      leftward: values[index * 5 + 4] > 0.6,
      plumage: PLUMAGE[index % PLUMAGE.length],
      pitch: 0.85 + values[index * 5 + 3] * 0.4,
    }));
  }, [seed, count]);

  return (
    <>
      {flock.map((bird, index) => (
        <FlyingBird key={index} index={index} still={still} {...bird} />
      ))}
    </>
  );
}

interface FlyingBirdProps {
  index: number;
  top: number;
  duration: number;
  delay: number;
  size: number;
  leftward: boolean;
  plumage: (typeof PLUMAGE)[number];
  pitch: number;
  still: boolean;
}

function FlyingBird({
  index,
  top,
  duration,
  delay,
  size,
  leftward,
  plumage,
  pitch,
  still,
}: FlyingBirdProps) {
  const [chirp, setChirp] = useState<string | null>(null);

  // Chirp on a loose, staggered rhythm.
  useEffect(() => {
    if (still) return;

    let timeout: ReturnType<typeof setTimeout>;
    let clear: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timeout = setTimeout(
        () => {
          setChirp(CHIRPS[Math.floor(Math.random() * CHIRPS.length)]);
          playBirdChirp(pitch);
          clear = setTimeout(() => setChirp(null), 1600);
          schedule();
        },
        5000 + Math.random() * 9000 + index * 1500,
      );
    };

    schedule();

    return () => {
      clearTimeout(timeout);
      clearTimeout(clear);
    };
  }, [still, index, pitch]);

  function handleTap() {
    setChirp(CHIRPS[Math.floor(Math.random() * CHIRPS.length)]);
    playBirdChirp(pitch);
    setTimeout(() => setChirp(null), 1600);
  }

  const from = leftward ? "112%" : "-12%";
  const to = leftward ? "-12%" : "112%";

  return (
    <motion.div
      className="absolute z-10"
      style={{ top: `${top}%`, left: still ? `${20 + index * 25}%` : from }}
      animate={still ? undefined : { left: [from, to] }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: 4 + index * 2, ease: "linear" }}
    >
      <motion.button
        type="button"
        onClick={handleTap}
        aria-label="A little bird — tap to hear it chirp"
        title="Tap me!"
        className="relative block cursor-pointer rounded-full focus-visible:outline-none"
        animate={still ? undefined : { y: [0, -10, 0, 6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
      >
        <BirdGlyph size={size} flip={leftward} plumage={plumage} still={still} index={index} />

        <AnimatePresence>
          {chirp ? (
            <motion.span
              key={chirp}
              className="ss-hand pointer-events-none absolute -top-7 left-1/2 rounded-full bg-white/95 px-2.5 py-0.5 text-base whitespace-nowrap text-slate-700 shadow-md"
              initial={{ opacity: 0, y: 6, scale: 0.6, x: "-50%" }}
              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
              exit={{ opacity: 0, y: -8, scale: 0.8, x: "-50%" }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
            >
              {chirp}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

interface BirdGlyphProps {
  size: number;
  flip: boolean;
  plumage: (typeof PLUMAGE)[number];
  still: boolean;
  index: number;
  /** `false` for a bird sitting on a branch: wings folded, no flapping. */
  flapping?: boolean;
}

/** A round, happy little bird facing right (flipped when flying left). */
export function BirdGlyph({ size, flip, plumage, still, index, flapping = true }: BirdGlyphProps) {
  const flap = still || !flapping ? undefined : `wing-flap 0.32s ease-in-out ${index * 0.07}s infinite`;

  return (
    <svg
      width={size}
      height={size * 0.72}
      viewBox="0 0 60 44"
      style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}
      className="drop-shadow-[0_3px_4px_rgba(0,0,0,0.18)]"
    >
      {/* Tail */}
      <path d="M14 22 L2 16 L5 24 L1 30 L15 27 Z" fill={plumage.wing} />
      {/* Far wing (behind the body), only visible in flight */}
      {flapping ? (
        <path
          d="M24 20 Q20 4 34 6 Q32 14 32 20 Z"
          fill={plumage.wing}
          opacity={0.6}
          style={{
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
            animation: flap,
          }}
        />
      ) : null}
      {/* Body */}
      <ellipse cx="28" cy="25" rx="16" ry="12.5" fill={plumage.body} />
      <ellipse cx="31" cy="29" rx="10" ry="7.5" fill={plumage.belly} />
      {/* Head */}
      <circle cx="41" cy="17" r="10" fill={plumage.body} />
      {/* Eye, with a sparkle */}
      <circle cx="44" cy="14.5" r="2.4" fill="#1f2937" />
      <circle cx="44.8" cy="13.7" r="0.85" fill="#fff" />
      {/* Rosy cheek */}
      <circle cx="44.5" cy="20" r="2" fill="#ff7aa2" opacity={0.65} />
      {/* Smile */}
      <path
        d="M40.5 20.5 Q43 23.5 46.5 21"
        fill="none"
        stroke="#1f2937"
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      {/* Beak */}
      <path d="M49.5 15.5 L56 17.6 L49.5 19.8 Z" fill="#ff9f1c" />
      {/* Near wing: flapping in flight, folded along the body when perched */}
      <path
        d={flapping ? "M20 22 Q24 2 40 8 Q34 16 34 24 Z" : "M14 24 Q24 14 38 20 Q30 28 18 28 Z"}
        fill={plumage.wing}
        style={{
          transformBox: "fill-box",
          transformOrigin: "50% 100%",
          animation: flap,
        }}
      />
      {/* Tiny feet */}
      <path d="M26 37 l-1 4 M31 37 l1 4" stroke="#ff9f1c" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}
