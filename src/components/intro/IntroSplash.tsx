import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionTemplate, useMotionValue } from "framer-motion";

import { APP_NAME, APP_TAGLINE } from "../../app/constants";
import { usePrefersStillness } from "../../hooks/useTheme";
import { audioIsUnlocked, playEnterSwoop, playIntroBloom } from "../../services/audio";
import { MeadowFriends, MeadowGround } from "./MeadowFriends";

/**
 * The opening moment.
 *
 * Plays once per browser session, over everything: two little friends lying
 * in the grass while the app gets ready, a soft bloom of sound as the meadow
 * appears, and a swoop as you're carried into your world.
 *
 * Browsers only allow sound after someone has interacted with the page, so
 * if audio is still locked when loading finishes we invite a tap (which both
 * enters and plays the swoop), and carry on quietly after a few seconds if
 * nobody taps. It never holds anyone at the door.
 */

const SEEN_KEY = "same-sky:intro-seen";
const MIN_MS = 3600;
const STILL_MIN_MS = 1200;
const AUTO_ENTER_MS = 6000;

const STAGES = ["Waking the meadow…", "Painting your sky…", "Opening your world…"] as const;

type Phase = "loading" | "invite" | "leaving" | "done";

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function IntroSplash({ ready }: { ready: boolean }) {
  const still = usePrefersStillness();
  const [phase, setPhase] = useState<Phase>(() => (alreadySeen() ? "done" : "loading"));
  const [minDone, setMinDone] = useState(false);
  const [stage, setStage] = useState(0);
  const wantsEnter = useRef(false);

  // The swoop: the meadow closes into a circle around the two friends. Driven
  // from JS (not a compositor animation) so every browser renders it the same.
  const radius = useMotionValue(150);
  const fade = useMotionValue(1);
  const clipPath = useMotionTemplate`circle(${radius}% at 50% 42%)`;

  const enter = useCallback((withSound: boolean) => {
    if (withSound) playEnterSwoop();

    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }

    setPhase("leaving");
  }, []);

  // Opening: bloom of sound (if allowed), stage labels, minimum on-screen time.
  useEffect(() => {
    if (phase !== "loading") return;

    void audioIsUnlocked().then((unlocked) => {
      if (unlocked) playIntroBloom();
    });

    const step = (still ? STILL_MIN_MS : MIN_MS) / STAGES.length;
    const timers = [
      setTimeout(() => setStage(1), step),
      setTimeout(() => setStage(2), step * 2),
      setTimeout(() => setMinDone(true), still ? STILL_MIN_MS : MIN_MS),
    ];

    return () => timers.forEach(clearTimeout);
    // Runs once for the opening; `phase` moving on must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading finished: swoop straight in if sound is allowed, otherwise invite a tap.
  useEffect(() => {
    if (phase !== "loading" || !minDone || !ready) return;

    let cancelled = false;

    void audioIsUnlocked().then((unlocked) => {
      if (cancelled) return;

      if (unlocked || wantsEnter.current || still) enter(unlocked);
      else setPhase("invite");
    });

    return () => {
      cancelled = true;
    };
  }, [phase, minDone, ready, still, enter]);

  // Nobody tapped: go in quietly.
  useEffect(() => {
    if (phase !== "invite") return;

    const timer = setTimeout(() => enter(false), AUTO_ENTER_MS);

    return () => clearTimeout(timer);
  }, [phase, enter]);

  useEffect(() => {
    if (phase !== "leaving") return;

    const controls = still
      ? animate(fade, 0, { duration: 0.4 })
      : animate(radius, 0, { duration: 0.95, ease: [0.65, 0, 0.35, 1] });

    void controls.then(() => setPhase("done"));

    return () => controls.stop();
  }, [phase, still, radius, fade]);

  // Keep the page behind from scrolling while the intro is up.
  useEffect(() => {
    if (phase === "done") return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  function handleTap() {
    if (phase === "invite") {
      enter(true);
    } else if (phase === "loading") {
      // A tap unlocks sound; enter with the swoop as soon as we're ready.
      wantsEnter.current = true;
      void audioIsUnlocked();
    }
  }

  return (
    <AnimatePresence>
      {phase !== "done" ? (
        <motion.div
          key="intro"
          role="dialog"
          aria-modal="true"
          aria-label={`${APP_NAME} is opening`}
          onClick={handleTap}
          className="fixed inset-0 z-[100] cursor-pointer overflow-hidden text-white select-none"
          style={{ clipPath, opacity: fade }}
        >
          <MeadowGround still={still} />

          {/* The two friends, swooping up and away as we leave */}
          <motion.div
            className="absolute inset-x-0 top-[14%] mx-auto w-[min(92vw,34rem)]"
            initial={still ? false : { opacity: 0, scale: 0.85, y: 30 }}
            animate={
              phase === "leaving" && !still
                ? { opacity: 1, scale: 1.5, y: -40, rotate: -6 }
                : { opacity: 1, scale: 1, y: 0, rotate: 0 }
            }
            transition={phase === "leaving" ? { duration: 0.95, ease: [0.65, 0, 0.35, 1] } : { duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <MeadowFriends still={still} className="w-full drop-shadow-[0_30px_40px_rgba(0,40,0,0.35)]" />
          </motion.div>

          {/* Title, status and progress, like a storybook's first page */}
          <div className="absolute inset-x-0 bottom-0 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10">
            <div className="mx-auto max-w-xl">
              <motion.h1
                className="font-display text-5xl font-bold tracking-tight drop-shadow-[0_4px_16px_rgba(0,50,0,0.5)] sm:text-6xl"
                initial={still ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {APP_NAME}
              </motion.h1>
              <motion.p
                className="mt-2 max-w-md text-lg font-semibold text-white/90 drop-shadow"
                initial={still ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {APP_TAGLINE}
              </motion.p>

              <div className="mt-6 h-6" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phase === "invite" ? "invite" : stage}
                    className="ss-hand text-2xl text-lime-100"
                    initial={{ opacity: 0, y: 8 }}
                    animate={phase === "invite" && !still ? { opacity: [0.6, 1, 0.6], y: 0 } : { opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={phase === "invite" ? { opacity: { duration: 1.8, repeat: Infinity }, y: { duration: 0.3 } } : { duration: 0.3 }}
                  >
                    {phase === "invite" ? "Tap anywhere to step into your world ✨" : STAGES[stage]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Three progress segments */}
              <div className="mt-4 flex gap-3" aria-hidden>
                {STAGES.map((label, index) => {
                  const segment = (still ? STILL_MIN_MS : MIN_MS) / STAGES.length / 1000;
                  const isLast = index === STAGES.length - 1;
                  const full = !isLast || (minDone && ready) || phase === "invite";

                  return (
                    <div key={label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
                      <motion.div
                        className="h-full rounded-full bg-white"
                        initial={{ width: "0%" }}
                        animate={{ width: full ? "100%" : "85%" }}
                        transition={{
                          duration: segment,
                          delay: full && isLast && minDone ? 0 : index * segment,
                          ease: "linear",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
