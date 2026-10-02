import { useEffect, useRef } from "react";

import type { SkyState, WeatherCondition } from "../types/world";
import {
  bedForSkyPhase,
  playAmbientBed,
  setAmbientVolume,
  stopAmbientAudio,
  type AmbientBedId,
} from "../services/audio";
import { useAppearanceControls } from "./useTheme";

/**
 * Which bed actually suits this moment: rain overrides the time of day,
 * since gentle rain and distant thunder belong at any hour.
 */
function resolveBed(phase: SkyState["phase"], weather: WeatherCondition): AmbientBedId {
  return weather === "rain" || weather === "storm" ? "rain" : bedForSkyPhase(phase);
}

/**
 * Let the world's ambient sound follow the sky, the weather and the
 * person's preference.
 *
 * Mounted once, from the world screen. Playback only ever begins from an
 * effect that runs after the screen has already been reached by a person's own
 * navigation — never on application start-up — which keeps it inside what
 * browsers allow without a direct interaction.
 */
export function useAmbientAudio(sky: SkyState, weather: WeatherCondition = "clear"): void {
  const { preferences } = useAppearanceControls();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!preferences.ambientAudio) {
      stopAmbientAudio();
      hasStarted.current = false;
      return;
    }

    playAmbientBed(resolveBed(sky.phase, weather), preferences.ambientVolume);
    hasStarted.current = true;
    // The sky phase and weather intentionally are not dependencies here:
    // crossing into a new phase should not restart the bed unless it maps to
    // a different one, which the effect below handles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.ambientAudio]);

  useEffect(() => {
    if (!hasStarted.current || !preferences.ambientAudio) return;

    playAmbientBed(resolveBed(sky.phase, weather), preferences.ambientVolume);
  }, [sky.phase, weather, preferences.ambientAudio, preferences.ambientVolume]);

  useEffect(() => {
    if (!hasStarted.current) return;

    setAmbientVolume(preferences.ambientVolume);
  }, [preferences.ambientVolume]);

  useEffect(() => {
    return () => {
      stopAmbientAudio();
    };
  }, []);
}
