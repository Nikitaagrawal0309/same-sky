import { useEffect, useRef } from "react";

import type { SkyState } from "../types/world";
import { bedForSkyPhase, playAmbientBed, setAmbientVolume, stopAmbientAudio } from "../services/audio";
import { useAppearanceControls } from "./useTheme";

/**
 * Let the world's ambient sound follow the sky and the person's preference.
 *
 * Mounted once, from the world screen. Playback only ever begins from an
 * effect that runs after the screen has already been reached by a person's own
 * navigation — never on application start-up — which keeps it inside what
 * browsers allow without a direct interaction.
 */
export function useAmbientAudio(sky: SkyState): void {
  const { preferences } = useAppearanceControls();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!preferences.ambientAudio) {
      stopAmbientAudio();
      hasStarted.current = false;
      return;
    }

    playAmbientBed(bedForSkyPhase(sky.phase), preferences.ambientVolume);
    hasStarted.current = true;
    // The sky phase intentionally is not a dependency: crossing into a new
    // phase should not restart the bed unless the phase actually maps to a
    // different one, which the effect below handles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.ambientAudio]);

  useEffect(() => {
    if (!hasStarted.current || !preferences.ambientAudio) return;

    playAmbientBed(bedForSkyPhase(sky.phase), preferences.ambientVolume);
  }, [sky.phase, preferences.ambientAudio, preferences.ambientVolume]);

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
