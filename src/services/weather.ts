import type { WeatherCondition } from "../types/world";

/**
 * Real weather, where the viewer actually is.
 *
 * Uses Open-Meteo (free, no API key, CORS-enabled) for current conditions
 * and BigDataCloud's client-side reverse geocoder for a friendly place name.
 * Coordinates are rounded to two decimal places (about a kilometre) before
 * they leave the device; nothing is stored anywhere but this browser.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LiveWeather {
  condition: WeatherCondition;
  /** 0–1: drizzle is light, a downpour is heavy. Drives how much falls. */
  intensity: number;
  temperature: number;
  description: string;
  emoji: string;
  isDay: boolean;
  fetchedAt: number;
}

interface WeatherCodeInfo {
  condition: WeatherCondition;
  intensity: number;
  description: string;
  emoji: string;
}

/** WMO weather interpretation codes, as returned by Open-Meteo. */
function interpretCode(code: number, isDay: boolean): WeatherCodeInfo {
  const sun = isDay ? "☀️" : "🌙";

  if (code === 0) return { condition: "clear", intensity: 0, description: "Clear sky", emoji: sun };
  if (code === 1) return { condition: "clear", intensity: 0, description: "Mostly clear", emoji: isDay ? "🌤️" : "🌙" };
  if (code === 2) return { condition: "cloudy", intensity: 0.4, description: "Partly cloudy", emoji: "⛅" };
  if (code === 3) return { condition: "cloudy", intensity: 0.8, description: "Overcast", emoji: "☁️" };
  if (code === 45 || code === 48) return { condition: "fog", intensity: 0.7, description: "Foggy", emoji: "🌫️" };
  if (code >= 51 && code <= 57) return { condition: "rain", intensity: 0.3, description: "Drizzle", emoji: "🌦️" };
  if (code === 61 || code === 80) return { condition: "rain", intensity: 0.5, description: "Light rain", emoji: "🌧️" };
  if (code === 63 || code === 81 || code === 66) return { condition: "rain", intensity: 0.8, description: "Rain", emoji: "🌧️" };
  if (code === 65 || code === 82 || code === 67) return { condition: "rain", intensity: 1, description: "Heavy rain", emoji: "🌧️" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { condition: "snow", intensity: code === 75 || code === 86 ? 1 : 0.6, description: "Snow", emoji: "🌨️" };
  if (code >= 95) return { condition: "storm", intensity: 1, description: "Thunderstorm", emoji: "⛈️" };

  return { condition: "clear", intensity: 0, description: "Clear", emoji: sun };
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function roundCoordinates({ latitude, longitude }: Coordinates): Coordinates {
  return { latitude: round2(latitude), longitude: round2(longitude) };
}

export async function fetchLiveWeather(coords: Coordinates, signal?: AbortSignal): Promise<LiveWeather> {
  const { latitude, longitude } = roundCoordinates(coords);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,weather_code,is_day&timezone=auto";

  const response = await fetch(url, { signal });

  if (!response.ok) throw new Error(`Weather request failed (${response.status})`);

  const data = (await response.json()) as {
    current?: { temperature_2m: number; weather_code: number; is_day: number };
  };

  if (!data.current) throw new Error("Weather response had no current conditions");

  const isDay = data.current.is_day === 1;
  const info = interpretCode(data.current.weather_code, isDay);

  return {
    ...info,
    temperature: Math.round(data.current.temperature_2m),
    isDay,
    fetchedAt: Date.now(),
  };
}

/** "Pune", "Brooklyn"… or `null` if the lookup fails. Best-effort only. */
export async function fetchPlaceName(coords: Coordinates, signal?: AbortSignal): Promise<string | null> {
  const { latitude, longitude } = roundCoordinates(coords);

  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as { city?: string; locality?: string; principalSubdivision?: string };

    return data.city || data.locality || data.principalSubdivision || null;
  } catch {
    return null;
  }
}

/** Wraps the geolocation callback API in a promise. */
export function getBrowserPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(error),
      // A rough fix is all weather needs; accept a cached one up to 30 minutes old.
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 15000 },
    );
  });
}
