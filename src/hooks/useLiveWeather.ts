import { useCallback, useEffect, useState } from "react";

import { STORAGE_KEYS } from "../app/constants";
import {
  fetchLiveWeather,
  fetchPlaceName,
  getBrowserPosition,
  roundCoordinates,
  type Coordinates,
  type LiveWeather,
} from "../services/weather";

/**
 * The real weather where the viewer is, kept fresh.
 *
 * Asks for location once (browsers remember the answer), then refreshes the
 * conditions every 15 minutes. The last reading and the rounded location are
 * cached in localStorage so a returning visit paints the right sky
 * immediately instead of flashing clear first.
 *
 * Without a location the world simply stays clear. It never invents rain.
 */

export type LiveWeatherStatus = "locating" | "ready" | "denied" | "unavailable";

export interface LiveWeatherState {
  status: LiveWeatherStatus;
  weather: LiveWeather | null;
  place: string | null;
  /** Ask for location again, e.g. after the person allows it. */
  retry: () => void;
}

const REFRESH_MS = 15 * 60 * 1000;
const CACHE_MAX_AGE_MS = 45 * 60 * 1000;

interface Cached {
  coords: Coordinates;
  place: string | null;
  weather: LiveWeather | null;
}

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.liveWeather);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

function writeCache(value: Cached): void {
  try {
    localStorage.setItem(STORAGE_KEYS.liveWeather, JSON.stringify(value));
  } catch {
    /* Storage blocked. */
  }
}

export function useLiveWeather(): LiveWeatherState {
  // Read once: the cache, and whether its reading is recent enough to show straight away.
  const [{ cached, fresh }] = useState(() => {
    const value = readCache();
    const isFresh = Boolean(value?.weather && Date.now() - value.weather.fetchedAt < CACHE_MAX_AGE_MS);

    return { cached: value, fresh: isFresh ? value : null };
  });

  const [status, setStatus] = useState<LiveWeatherStatus>(fresh ? "ready" : "locating");
  const [weather, setWeather] = useState<LiveWeather | null>(fresh?.weather ?? null);
  const [place, setPlace] = useState<string | null>(cached?.place ?? null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setInterval> | undefined;

    const load = async (coords: Coordinates, knownPlace: string | null) => {
      try {
        const [nextWeather, nextPlace] = await Promise.all([
          fetchLiveWeather(coords, controller.signal),
          knownPlace ? Promise.resolve(knownPlace) : fetchPlaceName(coords, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        setWeather(nextWeather);
        setPlace(nextPlace);
        setStatus("ready");
        writeCache({ coords: roundCoordinates(coords), place: nextPlace, weather: nextWeather });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("[Same Sky] Live weather unavailable:", error);
        setStatus((current) => (current === "ready" ? current : "unavailable"));
      }
    };

    void getBrowserPosition()
      .then((coords) => {
        if (controller.signal.aborted) return;

        const rounded = roundCoordinates(coords);
        const samePlace =
          cached && cached.coords.latitude === rounded.latitude && cached.coords.longitude === rounded.longitude;

        void load(coords, samePlace ? cached.place : null);
        timer = setInterval(() => void load(coords, samePlace ? cached.place : null), REFRESH_MS);
      })
      .catch((error: GeolocationPositionError | Error) => {
        if (controller.signal.aborted) return;

        // Permission denied: fall back to the last known spot if we have one.
        if (cached?.coords) {
          void load(cached.coords, cached.place);
          return;
        }

        setStatus("code" in error && error.code === 1 ? "denied" : "unavailable");
      });

    return () => {
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, [attempt, cached]);

  const retry = useCallback(() => {
    setStatus("locating");
    setAttempt((value) => value + 1);
  }, []);

  return { status, weather, place, retry };
}
