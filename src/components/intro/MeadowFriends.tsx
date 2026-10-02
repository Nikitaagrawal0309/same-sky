import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { seededSequence } from "../../utils/helpers";

/**
 * Two little friends lying in the grass, looking up at the same sky.
 *
 * Seen from above, like the meadow is the camera's floor: Sprout (leafy cap,
 * sunny belly) and Bloom (petal cap, peach belly) hold hands and breathe
 * together. Every few seconds one of them peeks at the other, and a tiny
 * heart floats up from their hands. Shaded with soft gradients, rim light
 * and contact shadows for a rounded, animated-film feel.
 */

interface CreatureLook {
  id: string;
  capLight: string;
  capBase: string;
  capShade: string;
  bellyLight: string;
  bellyBase: string;
  bellyShade: string;
  limb: string;
}

const SPROUT: CreatureLook = {
  id: "sprout",
  capLight: "#e4ff6b",
  capBase: "#9bdc1f",
  capShade: "#4f9a12",
  bellyLight: "#fff6b0",
  bellyBase: "#ffc93c",
  bellyShade: "#e2931c",
  limb: "#ffcf4d",
};

const BLOOM: CreatureLook = {
  id: "bloom",
  capLight: "#ffd6ea",
  capBase: "#ff8cc0",
  capShade: "#d4558f",
  bellyLight: "#fff1e6",
  bellyBase: "#ffc6a8",
  bellyShade: "#e8957a",
  limb: "#ffcbb0",
};

/** The scalloped edge where cap meets belly, in the creature's 200×220 box. */
const CAP_PATH =
  "M10,0 L190,0 L190,112 Q172,132 152,112 Q134,132 114,112 Q100,128 86,112 Q66,132 48,112 Q28,132 10,112 Z";

function Creature({ look, peeking, still }: { look: CreatureLook; peeking: boolean; still: boolean }) {
  const g = (name: string) => `${look.id}-${name}`;

  return (
    <g>
      <defs>
        <radialGradient id={g("belly")} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={look.bellyLight} />
          <stop offset="55%" stopColor={look.bellyBase} />
          <stop offset="100%" stopColor={look.bellyShade} />
        </radialGradient>
        <radialGradient id={g("cap")} cx="32%" cy="25%" r="85%">
          <stop offset="0%" stopColor={look.capLight} />
          <stop offset="55%" stopColor={look.capBase} />
          <stop offset="100%" stopColor={look.capShade} />
        </radialGradient>
        <clipPath id={g("body")}>
          <circle cx={100} cy={115} r={80} />
        </clipPath>
        <filter id={g("soft")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={g("glow")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Contact shadow on the grass */}
      <ellipse cx={116} cy={132} rx={86} ry={84} fill="#0b3d0b" opacity={0.45} filter={`url(#${g("soft")})`} />

      {/* Feet */}
      <g fill={look.limb}>
        <rect x={58} y={176} width={30} height={40} rx={15} />
        <rect x={112} y={176} width={30} height={40} rx={15} />
      </g>
      <g fill={look.bellyShade} opacity={0.5}>
        <rect x={64} y={200} width={20} height={14} rx={7} />
        <rect x={118} y={200} width={20} height={14} rx={7} />
      </g>

      {/* Arms */}
      <circle cx={20} cy={124} r={19} fill={look.limb} />
      <circle cx={180} cy={124} r={19} fill={look.limb} />

      {/* Body, breathing */}
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "50% 60%" }}
        animate={still ? undefined : { scale: [1, 1.035, 1] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx={100} cy={115} r={80} fill={`url(#${g("belly")})`} />
        <g clipPath={`url(#${g("body")})`}>
          <path d={CAP_PATH} fill={`url(#${g("cap")})`} />
          {/* Soft occlusion under the scallops */}
          <path d={CAP_PATH} fill="none" stroke="#000" strokeOpacity={0.12} strokeWidth={6} transform="translate(0 4)" />
          {/* Shade on the far side */}
          <ellipse cx={160} cy={150} rx={60} ry={90} fill="#000" opacity={0.12} filter={`url(#${g("soft")})`} />
        </g>
        {/* Rim light */}
        <path d="M38,80 A80,80 0 0 1 120,37" stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.55} filter={`url(#${g("glow")})`} />

        {/* Face */}
        <AnimatePresence initial={false} mode="wait">
          {peeking ? (
            <motion.g key="open" initial={{ scaleY: 0.2 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0.2 }} transition={{ duration: 0.12 }} style={{ transformOrigin: "100px 74px" }}>
              <ellipse cx={76} cy={74} rx={6.5} ry={8.5} fill="#2a1d14" />
              <ellipse cx={124} cy={74} rx={6.5} ry={8.5} fill="#2a1d14" />
              <circle cx={78.5} cy={70.5} r={2.4} fill="#fff" />
              <circle cx={126.5} cy={70.5} r={2.4} fill="#fff" />
            </motion.g>
          ) : (
            <motion.g key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <path d="M66,74 Q76,82 86,74" stroke="#2a3d10" strokeWidth={4} strokeLinecap="round" fill="none" />
              <path d="M114,74 Q124,82 134,74" stroke="#2a3d10" strokeWidth={4} strokeLinecap="round" fill="none" />
            </motion.g>
          )}
        </AnimatePresence>
        <path d="M92,92 Q100,99 108,92" stroke="#2a3d10" strokeWidth={3.6} strokeLinecap="round" fill="none" />
        <ellipse cx={62} cy={90} rx={9} ry={5.5} fill="#ff6f91" opacity={0.4} />
        <ellipse cx={138} cy={90} rx={9} ry={5.5} fill="#ff6f91" opacity={0.4} />
      </motion.g>

      {/* Head topper */}
      {look.id === "sprout" ? (
        <g>
          <path d="M100,38 L100,26" stroke="#3d7d0e" strokeWidth={4} strokeLinecap="round" />
          <path d="M100,28 C82,4 58,12 62,26 C72,36 90,34 100,28 Z" fill="#3f9a12" stroke="#2f7a0c" strokeWidth={1.5} />
          <path d="M100,26 C118,0 144,8 140,24 C130,35 110,33 100,26 Z" fill="#5cb81a" stroke="#2f7a0c" strokeWidth={1.5} />
          <path d="M100,28 C88,20 76,20 66,24" stroke="#c6f04a" strokeWidth={1.6} fill="none" opacity={0.8} />
          <path d="M100,26 C112,18 124,17 136,21" stroke="#c6f04a" strokeWidth={1.6} fill="none" opacity={0.8} />
        </g>
      ) : (
        <g transform="translate(100 38)">
          {Array.from({ length: 5 }).map((_, index) => (
            <ellipse key={index} cy={-10} rx={7.5} ry={11} fill="#fff" stroke="#ffd1e3" strokeWidth={1} transform={`rotate(${index * 72})`} />
          ))}
          <circle r={7} fill="#ffcf3f" />
          <circle r={3} cx={-2} cy={-2} fill="#fff3b0" />
        </g>
      )}
    </g>
  );
}

export function MeadowFriends({ still = false, className }: { still?: boolean; className?: string }) {
  const [peek, setPeek] = useState<"none" | "sprout" | "bloom">("none");
  const [hearts, setHearts] = useState<number[]>([]);

  // Take turns peeking at each other, and send up a little heart.
  useEffect(() => {
    if (still) return;

    let turn = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const interval = setInterval(() => {
      const who = turn % 2 === 0 ? "bloom" : "sprout";
      turn += 1;
      setPeek(who);
      setHearts((current) => [...current.slice(-3), Date.now()]);
      timers.push(setTimeout(() => setPeek("none"), 900));
    }, 2600);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, [still]);

  return (
    <svg viewBox="0 0 460 300" className={className} role="img" aria-label="Two little friends lying in the grass, holding hands">
      <g transform="translate(14 44) rotate(-10 100 110)">
        <Creature look={SPROUT} peeking={peek === "sprout"} still={still} />
      </g>
      <g transform="translate(222 44) rotate(10 100 110)">
        <Creature look={BLOOM} peeking={peek === "bloom"} still={still} />
      </g>

      {/* Hands held in the middle */}
      <circle cx={222} cy={170} r={17} fill="#ffcf4d" />
      <circle cx={238} cy={170} r={17} fill="#ffcbb0" />
      <path d="M226,160 Q230,170 226,180" stroke="#e2931c" strokeOpacity={0.35} strokeWidth={2} fill="none" />

      {/* Hearts floating up from their hands */}
      <AnimatePresence>
        {hearts.map((id) => (
          <motion.path
            key={id}
            d="M0,4 C-6,-3 -12,2 -6,8 L0,13 L6,8 C12,2 6,-3 0,4 Z"
            fill="#ff5c8a"
            initial={{ x: 230, y: 158, opacity: 0, scale: 0.4 }}
            animate={{ x: [230, 224, 236, 230], y: [158, 120, 90, 60], opacity: [0, 1, 1, 0], scale: [0.4, 1, 1.1, 0.9] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </svg>
  );
}

/** The lawn around them: dappled light, grass, daisies, a ladybug, butterflies and petals. */
export function MeadowGround({ still = false }: { still?: boolean }) {
  const grass = useMemo(() => {
    // Separate sequences per axis, so blades scatter instead of lining up in streaks.
    const xs = seededSequence("intro:grass:x", 160);
    const ys = seededSequence("intro:grass:y", 160);
    const angles = seededSequence("intro:grass:angle", 160);

    return xs.map((x, index) => ({ x: x * 100, y: ys[index] * 100, angle: -40 + angles[index] * 80 }));
  }, []);

  const daisies = useMemo(() => {
    const xs = seededSequence("intro:daisies:x", 18);
    const ys = seededSequence("intro:daisies:y", 18);

    return xs.map((x, index) => ({ x: x * 100, y: ys[index] * 100 }));
  }, []);

  const petals = useMemo(() => {
    const values = seededSequence("intro:petals", 10 * 3);

    return Array.from({ length: 10 }, (_, index) => ({
      x: values[index * 3] * 100,
      delay: values[index * 3 + 1] * 6,
      duration: 8 + values[index * 3 + 2] * 6,
    }));
  }, []);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 30% 20%, #3fd13f 0%, #13a51f 45%, #087515 75%, #04500d 100%)" }}
      />

      {/* Grass blades */}
      <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {grass.map((blade, index) => (
          <line
            key={index}
            x1={blade.x}
            y1={blade.y}
            x2={blade.x + Math.sin((blade.angle * Math.PI) / 180) * 1.4}
            y2={blade.y - Math.cos((blade.angle * Math.PI) / 180) * 2}
            stroke={index % 3 ? "#0b6e14" : "#36c23a"}
            strokeWidth={0.35}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 3 }}
            opacity={0.55}
          />
        ))}
      </svg>

      {/* Daisies, from above */}
      {daisies.map((daisy, index) => (
        <svg key={index} viewBox="-10 -10 20 20" className="absolute size-5 opacity-80" style={{ left: `${daisy.x}%`, top: `${daisy.y}%` }}>
          {Array.from({ length: 6 }).map((_, petal) => (
            <ellipse key={petal} cy={-5} rx={2.6} ry={4.4} fill={index % 4 === 0 ? "#ffd1e3" : "#ffffff"} transform={`rotate(${petal * 60})`} />
          ))}
          <circle r={2.6} fill="#ffcf3f" />
        </svg>
      ))}

      {/* Dappled leaf shadows drifting over the lawn */}
      {[
        { left: "62%", top: "8%", size: 340, duration: 16 },
        { left: "-10%", top: "62%", size: 420, duration: 20 },
        { left: "70%", top: "70%", size: 300, duration: 18 },
      ].map((shadow, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-[#033d0a] blur-3xl"
          style={{ left: shadow.left, top: shadow.top, width: shadow.size, height: shadow.size * 0.7, opacity: 0.45 }}
          animate={still ? undefined : { x: [0, 30, -10, 0], y: [0, -16, 12, 0] }}
          transition={{ duration: shadow.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Warm sunlight pooling top-left */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(60% 45% at 18% 8%, rgb(255 250 180 / 0.45), transparent 70%)" }}
      />

      {/* A ladybug on a little walk */}
      <motion.div
        className="absolute"
        style={{ left: "78%", top: "58%" }}
        animate={still ? undefined : { x: [0, -18, -30, -14, 0], y: [0, 14, 2, -12, 0], rotate: [200, 160, 100, 20, 200] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="-10 -12 20 24" className="size-7 drop-shadow">
          <ellipse cy={-8} rx={4.5} ry={3.5} fill="#1f1a17" />
          <ellipse rx={8} ry={9} fill="#e8392b" />
          <path d="M0,-9 L0,9" stroke="#1f1a17" strokeWidth={1.2} />
          {[
            [-4, -3],
            [4, -3],
            [-4.5, 3.5],
            [4.5, 3.5],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={1.6} fill="#1f1a17" />
          ))}
          <ellipse cx={-3} cy={-4} rx={2} ry={1.2} fill="#fff" opacity={0.45} />
        </svg>
      </motion.div>

      {/* Butterflies fluttering over */}
      {[
        { top: "18%", colour: "#ffd43b", duration: 11, delay: 0 },
        { top: "30%", colour: "#74c0fc", duration: 14, delay: 3 },
      ].map((butterfly, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{ top: butterfly.top, left: "-8%" }}
          animate={still ? undefined : { left: ["-8%", "108%"], y: [0, -24, 10, -18, 0] }}
          transition={{ duration: butterfly.duration, delay: butterfly.delay, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="-12 -10 24 20" className="size-8 drop-shadow">
            {[-1, 1].map((side) => (
              <motion.g
                key={side}
                animate={still ? undefined : { scaleX: [1, 0.25, 1] }}
                transition={{ duration: 0.28, repeat: Infinity }}
                style={{ transformOrigin: "0px 0px" }}
              >
                <ellipse cx={side * 5.5} cy={-3} rx={5.5} ry={5} fill={butterfly.colour} />
                <ellipse cx={side * 4} cy={4} rx={3.5} ry={3.5} fill={butterfly.colour} opacity={0.85} />
              </motion.g>
            ))}
            <rect x={-0.8} y={-6} width={1.6} height={12} rx={0.8} fill="#2a1d14" />
          </svg>
        </motion.div>
      ))}

      {/* Petals drifting across */}
      {!still
        ? petals.map((petal, index) => (
            <motion.span
              key={index}
              className="absolute top-0 block h-2.5 w-3.5 rounded-[60%_40%] bg-[#ffd1e3] shadow-sm"
              style={{ left: `${petal.x}%` }}
              animate={{ y: ["-5vh", "105vh"], x: [0, 40, -20, 30], rotate: [0, 180, 360] }}
              transition={{ duration: petal.duration, delay: petal.delay, repeat: Infinity, ease: "linear" }}
            />
          ))
        : null}
    </div>
  );
}
