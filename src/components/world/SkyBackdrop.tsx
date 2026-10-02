import { useMemo } from "react";
import { motion } from "framer-motion";

import type { SkyState, WeatherCondition } from "../../types/world";
import { usePrefersStillness } from "../../hooks/useTheme";
import { clamp01, cx, mixColors, progressBetween, seededSequence } from "../../utils/helpers";

/**
 * The sky.
 *
 * This is the one part of the shared world that is not shared. It always shows
 * the real hour where the person looking at it is standing, which means two
 * partners tend one world under two different skies. That is the whole idea
 * the product is named for, and it is rendered here.
 *
 * The sky does not step between times of day; it moves through them. Colours
 * are interpolated between keyframes, so the light at twenty to six genuinely
 * sits between five o'clock and half past six rather than snapping from one
 * preset to the next.
 *
 * Each time the sky opens it plays a short intro: in daylight the sun climbs
 * out of the horizon to where it really is; at night the last of the sun
 * sinks away in a warm glow before the moon rises.
 */

interface SkyKeyframe {
  /** Position through the local day, 0–1. */
  at: number;
  top: string;
  middle: string;
  horizon: string;
}

const KEYFRAMES: readonly SkyKeyframe[] = [
  { at: 0, top: "#05070f", middle: "#0a0f22", horizon: "#10162f" },
  { at: 0.21, top: "#0b1330", middle: "#1e2a52", horizon: "#4a3a63" },
  { at: 0.26, top: "#274270", middle: "#7b6b93", horizon: "#f2a77a" },
  { at: 0.33, top: "#4f9be0", middle: "#a8d4f2", horizon: "#fde1b8" },
  { at: 0.5, top: "#2f8fe0", middle: "#7cc6f2", horizon: "#d4eefc" },
  { at: 0.71, top: "#3d95d8", middle: "#93c9ec", horizon: "#f6cf98" },
  { at: 0.77, top: "#2a4d86", middle: "#c4706a", horizon: "#ffa35c" },
  { at: 0.83, top: "#16224b", middle: "#5a3a7b", horizon: "#c45c78" },
  { at: 0.9, top: "#0a1028", middle: "#141d42", horizon: "#23264f" },
  { at: 1, top: "#05070f", middle: "#0a0f22", horizon: "#10162f" },
];

interface SkyColours {
  top: string;
  middle: string;
  horizon: string;
}

function resolveColours(progress: number): SkyColours {
  const at = clamp01(progress);

  let previous = KEYFRAMES[0];
  let next = KEYFRAMES[KEYFRAMES.length - 1];

  for (let index = 0; index < KEYFRAMES.length - 1; index += 1) {
    if (at >= KEYFRAMES[index].at && at <= KEYFRAMES[index + 1].at) {
      previous = KEYFRAMES[index];
      next = KEYFRAMES[index + 1];
      break;
    }
  }

  const t = progressBetween(at, previous.at, next.at);

  return {
    top: mixColors(previous.top, next.top, t),
    middle: mixColors(previous.middle, next.middle, t),
    horizon: mixColors(previous.horizon, next.horizon, t),
  };
}

/** How each kind of weather dresses the sky. */
const WEATHER_LOOK: Record<
  WeatherCondition,
  { clouds: number; cloudDay: string; cloudNight: string; overlay: string | null; sun: number }
> = {
  clear: { clouds: 4, cloudDay: "rgb(255 255 255 / 0.88)", cloudNight: "rgb(170 180 210 / 0.16)", overlay: null, sun: 1 },
  cloudy: { clouds: 9, cloudDay: "rgb(236 240 245 / 0.95)", cloudNight: "rgb(150 160 185 / 0.3)", overlay: "bg-slate-400/15", sun: 0.65 },
  fog: { clouds: 5, cloudDay: "rgb(235 238 240 / 0.9)", cloudNight: "rgb(150 160 175 / 0.3)", overlay: "bg-slate-200/40", sun: 0.45 },
  rain: { clouds: 8, cloudDay: "rgb(118 128 144 / 0.92)", cloudNight: "rgb(90 100 120 / 0.5)", overlay: "bg-slate-700/35", sun: 0.35 },
  storm: { clouds: 10, cloudDay: "rgb(70 78 95 / 0.95)", cloudNight: "rgb(50 56 72 / 0.7)", overlay: "bg-slate-800/50", sun: 0.2 },
  snow: { clouds: 8, cloudDay: "rgb(205 212 222 / 0.95)", cloudNight: "rgb(140 150 170 / 0.45)", overlay: "bg-slate-300/30", sun: 0.4 },
};

/** Roughly sunrise and sunset, as fractions of the local day. */
const SUNRISE = 0.25;
const SUNSET = 0.79;

const STAR_COUNT = 70;

/** Seconds the sunrise / sunset intro takes when the sky first opens. */
const INTRO_SECONDS = 4.2;

export interface SkyBackdropProps {
  sky: SkyState;

  /** The real weather: clouds thicken and grey, fog hazes, storms flash. */
  weather?: WeatherCondition;

  /** Renders the sun, moon and stars. Disable for a plain wash of colour. */
  showCelestialBodies?: boolean;

  className?: string;
}

export function SkyBackdrop({
  sky,
  weather = "clear",
  showCelestialBodies = true,
  className,
}: SkyBackdropProps) {
  const still = usePrefersStillness();
  const colours = useMemo(() => resolveColours(sky.dayProgress), [sky.dayProgress]);
  const rainy = weather === "rain" || weather === "storm" || weather === "snow";
  const look = WEATHER_LOOK[weather];

  /*
    Star positions are derived from a fixed seed rather than randomised, so the
    constellations are the same every night. A sky that rearranges itself each
    time it is opened is a sky nobody can grow fond of.
  */
  const stars = useMemo(() => {
    const values = seededSequence("same-sky:stars", STAR_COUNT * 3);

    return Array.from({ length: STAR_COUNT }, (_, index) => ({
      left: values[index * 3] * 100,
      // Kept out of the lowest quarter, where the horizon glow would drown them.
      top: values[index * 3 + 1] * 74,
      size: 1 + values[index * 3 + 2] * 1.6,
      delay: values[index * 3 + 2] * 6,
    }));
  }, []);

  const clouds = useMemo(() => {
    const count = look.clouds;
    const values = seededSequence(`same-sky:clouds:${count}`, count * 4);

    return Array.from({ length: count }, (_, index) => ({
      top: 3 + values[index * 4] * 30,
      scale: 0.6 + values[index * 4 + 1] * 0.9,
      duration: 70 + values[index * 4 + 2] * 80,
      // Negative delays scatter them across the sky from the very first frame.
      delay: -values[index * 4 + 3] * 140,
      restingX: values[index * 4 + 3] * 90,
    }));
  }, [look.clouds]);

  const isDaylight = sky.dayProgress > SUNRISE && sky.dayProgress < SUNSET;

  // Both bodies travel the same arc; only one of them is above the horizon.
  const sunTravel = progressBetween(sky.dayProgress, SUNRISE, SUNSET);
  const sunX = sunTravel * 100;
  const sunY = 46 - Math.sin(sunTravel * Math.PI) * 34;

  const moonTravel =
    sky.dayProgress >= SUNSET
      ? progressBetween(sky.dayProgress, SUNSET, 1) * 0.5
      : 0.5 + progressBetween(sky.dayProgress, 0, SUNRISE) * 0.5;

  const moonX = moonTravel * 100;
  const moonY = 46 - Math.sin(moonTravel * Math.PI) * 32;

  const starOpacity = sky.starsVisible ? clamp01(-sky.sunAltitude * 1.4) : 0;

  // A low sun (early morning or evening) glows warmer.
  const lowSun = isDaylight && (sunTravel < 0.18 || sunTravel > 0.82);

  const cloudTint = isDaylight ? look.cloudDay : look.cloudNight;

  return (
    <div
      aria-hidden
      className={cx("pointer-events-none overflow-hidden", className)}
      style={{
        background: `linear-gradient(to bottom, ${colours.top} 0%, ${colours.middle} 52%, ${colours.horizon} 100%)`,
        transition: "background 2s var(--ease-calm)",
      }}
    >
      {showCelestialBodies ? (
        <>
          {starOpacity > 0.02 ? (
            <motion.div
              className="absolute inset-0"
              initial={still ? false : { opacity: 0 }}
              animate={{ opacity: starOpacity }}
              transition={{ duration: 3, delay: still ? 0 : INTRO_SECONDS * 0.7 }}
            >
              {stars.map((star, index) => (
                <span
                  key={index}
                  className="absolute rounded-full bg-white motion-safe:animate-(--animate-shimmer)"
                  style={{
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    width: star.size,
                    height: star.size,
                    animationDelay: `${star.delay}s`,
                  }}
                />
              ))}
            </motion.div>
          ) : null}

          {isDaylight ? (
            // Sunrise: the sun climbs out of the horizon to where it really is.
            <motion.div
              className="absolute"
              style={{ left: `${sunX}%`, x: "-50%", y: "-50%" }}
              initial={still ? false : { top: "78%", opacity: 0.8 }}
              animate={{ top: `${sunY}%`, opacity: look.sun }}
              transition={{ duration: INTRO_SECONDS, ease: [0.16, 1, 0.3, 1] }}
            >
              <Sun low={lowSun} still={still} />
            </motion.div>
          ) : (
            <>
              {/* Sunset: the last of the sun slips under the western horizon. */}
              {!still ? (
                <>
                  <motion.div
                    className="absolute inset-x-0 bottom-0 h-3/4"
                    style={{
                      background:
                        "radial-gradient(ellipse at 85% 100%, rgb(255 150 80 / 0.8), rgb(236 96 128 / 0.4) 38%, transparent 72%)",
                    }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: INTRO_SECONDS * 1.5, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute"
                    style={{ left: "85%", x: "-50%", y: "-50%" }}
                    initial={{ top: "36%", opacity: 1 }}
                    animate={{ top: "80%", opacity: 0.3 }}
                    transition={{ duration: INTRO_SECONDS, ease: [0.45, 0, 0.55, 1] }}
                  >
                    <Sun low still={still} />
                  </motion.div>
                </>
              ) : null}

              <motion.div
                className="absolute size-16 rounded-full"
                style={{
                  left: `${moonX}%`,
                  x: "-50%",
                  y: "-50%",
                  /*
                    The lit fraction comes from the real lunar cycle, so the moon
                    in Same Sky is the moon outside the window.
                  */
                  background: `radial-gradient(circle at ${30 + sky.moonPhase * 40}% 42%, rgb(255 253 245 / ${0.45 + sky.moonPhase * 0.55}) 0%, rgb(226 232 240 / ${0.16 + sky.moonPhase * 0.3}) 46%, rgb(226 232 240 / 0) 70%)`,
                  boxShadow: `0 0 60px 12px rgb(220 230 255 / ${0.06 + sky.moonPhase * 0.12})`,
                }}
                initial={still ? false : { top: "70%", opacity: 0 }}
                animate={{ top: `${moonY}%`, opacity: 1 }}
                transition={{
                  duration: INTRO_SECONDS,
                  delay: still ? 0 : INTRO_SECONDS * 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </>
          )}

          {/* Clouds drift slowly across, greyer and thicker on a rainy day. */}
          {clouds.map((cloud, index) => (
            <div
              key={index}
              className="absolute left-0"
              style={{
                top: `${cloud.top}%`,
                animation: still ? undefined : `cloud-drift ${cloud.duration}s linear infinite`,
                animationDelay: `${cloud.delay}s`,
                transform: still ? `translateX(${cloud.restingX}vw)` : undefined,
              }}
            >
              <Cloud scale={cloud.scale} tint={cloudTint} />
            </div>
          ))}

          {look.overlay ? <div className={cx("absolute inset-0", look.overlay)} style={{ transition: "background-color 2s ease" }} /> : null}

          {/* Thunderstorms: the odd flash of lightning lighting the whole sky. */}
          {weather === "storm" && !still ? (
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.75, 0.1, 0.6, 0, 0] }}
              transition={{ duration: 9, repeat: Infinity, times: [0, 0.6, 0.62, 0.64, 0.66, 0.7, 1], ease: "linear" }}
            />
          ) : null}

          {/* A soft bloom sitting on the horizon, strongest at dawn and dusk. */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/5"
            style={{
              background: `linear-gradient(to top, ${colours.horizon}, transparent)`,
              opacity: rainy ? 0.4 : 0.85,
            }}
          />
        </>
      ) : null}
    </div>
  );
}

/** The sun: a bright disc, a wide glow and a slowly turning ring of rays. */
function Sun({ low = false, still }: { low?: boolean; still: boolean }) {
  const glow = low ? "rgb(255 140 60 / 0.55)" : "rgb(255 225 120 / 0.55)";

  return (
    <div className="relative grid size-40 place-items-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 68%)` }}
      />
      <svg
        viewBox="-50 -50 100 100"
        className={cx("absolute size-36", !still && "animate-(--animate-sun-rays)")}
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <rect
            key={index}
            x={-1.4}
            y={-46}
            width={2.8}
            height={11}
            rx={1.4}
            fill={low ? "#ffcf8a" : "#fff1a8"}
            opacity={0.7}
            transform={`rotate(${index * 30})`}
          />
        ))}
      </svg>
      <div
        className="relative size-16 rounded-full"
        style={{
          background: `radial-gradient(circle at 38% 35%, #fffdf0 0%, ${low ? "#ffb347" : "#fff3b0"} 55%, ${low ? "#ff8c42" : "#ffd75e"} 100%)`,
          boxShadow: `0 0 40px 12px ${glow}`,
        }}
      />
    </div>
  );
}

function Cloud({ scale, tint }: { scale: number; tint: string }) {
  return (
    <svg width={180 * scale} height={70 * scale} viewBox="0 0 180 70" style={{ filter: "blur(0.6px)" }}>
      <g fill={tint}>
        <ellipse cx="50" cy="48" rx="42" ry="20" />
        <ellipse cx="88" cy="34" rx="36" ry="28" />
        <ellipse cx="126" cy="46" rx="40" ry="20" />
        <ellipse cx="70" cy="30" rx="24" ry="20" />
      </g>
    </svg>
  );
}
