import { useMemo } from "react";

import type { SkyState } from "../../types/world";
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
  { at: 0.26, top: "#274270", middle: "#7b6b93", horizon: "#e6a37e" },
  { at: 0.33, top: "#5b9ad6", middle: "#a8cdec", horizon: "#f7d9b5" },
  { at: 0.5, top: "#2f86d4", middle: "#7cbcea", horizon: "#cfe8f8" },
  { at: 0.71, top: "#3d8fd0", middle: "#93c4e6", horizon: "#f0cc9a" },
  { at: 0.77, top: "#2a4d86", middle: "#b06f5f", horizon: "#f0a463" },
  { at: 0.83, top: "#16224b", middle: "#4a3a6b", horizon: "#a35c6a" },
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

/** Roughly sunrise and sunset, as fractions of the local day. */
const SUNRISE = 0.25;
const SUNSET = 0.79;

const STAR_COUNT = 70;

export interface SkyBackdropProps {
  sky: SkyState;

  /** Renders the sun, moon and stars. Disable for a plain wash of colour. */
  showCelestialBodies?: boolean;

  className?: string;
}

export function SkyBackdrop({
  sky,
  showCelestialBodies = true,
  className,
}: SkyBackdropProps) {
  const colours = useMemo(() => resolveColours(sky.dayProgress), [sky.dayProgress]);

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

  const isDaylight = sky.dayProgress > SUNRISE && sky.dayProgress < SUNSET;

  // Both bodies travel the same arc; only one of them is above the horizon.
  const sunTravel = progressBetween(sky.dayProgress, SUNRISE, SUNSET);
  const sunX = sunTravel * 100;
  const sunY = 88 - Math.sin(sunTravel * Math.PI) * 74;

  const moonTravel =
    sky.dayProgress >= SUNSET
      ? progressBetween(sky.dayProgress, SUNSET, 1) * 0.5
      : 0.5 + progressBetween(sky.dayProgress, 0, SUNRISE) * 0.5;

  const moonX = moonTravel * 100;
  const moonY = 88 - Math.sin(moonTravel * Math.PI) * 68;

  const starOpacity = sky.starsVisible ? clamp01(-sky.sunAltitude * 1.4) : 0;

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
            <div
              className="absolute inset-0"
              style={{ opacity: starOpacity, transition: "opacity 3s var(--ease-calm)" }}
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
            </div>
          ) : null}

          {isDaylight ? (
            <div
              className="absolute size-28 rounded-full"
              style={{
                left: `${sunX}%`,
                top: `${sunY}%`,
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, rgb(255 250 235) 0%, rgb(255 236 190 / 0.9) 38%, rgb(255 220 160 / 0) 72%)",
                transition: "left 2s var(--ease-calm), top 2s var(--ease-calm)",
              }}
            />
          ) : (
            <div
              className="absolute size-16 rounded-full"
              style={{
                left: `${moonX}%`,
                top: `${moonY}%`,
                transform: "translate(-50%, -50%)",
                /*
                  The lit fraction comes from the real lunar cycle, so the moon
                  in Same Sky is the moon outside the window.
                */
                background: `radial-gradient(circle at ${30 + sky.moonPhase * 40}% 42%, rgb(255 253 245 / ${0.35 + sky.moonPhase * 0.6}) 0%, rgb(226 232 240 / ${0.12 + sky.moonPhase * 0.3}) 46%, rgb(226 232 240 / 0) 70%)`,
                transition: "left 2s var(--ease-calm), top 2s var(--ease-calm)",
              }}
            />
          )}

          {/* A soft bloom sitting on the horizon, strongest at dawn and dusk. */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/5"
            style={{
              background: `linear-gradient(to top, ${colours.horizon}, transparent)`,
              opacity: 0.85,
            }}
          />
        </>
      ) : null}
    </div>
  );
}
