import { Howl } from "howler";

import type { SkyPhase } from "../types/world";

/**
 * Ambient sound.
 *
 * The specification asks for immersion that never becomes repetitive or
 * distracting, with a person always in control of it. In practice that means
 * three rules: audio never starts itself before a person has interacted with
 * the page, exactly one bed plays at a time, and turning it off is immediate
 * and complete.
 *
 * No audio assets ship with the repository yet — recording or licensing them
 * is a content decision outside this engineering pass. This module is the
 * complete seam a designer can drop files into: add a file under
 * `public/audio/` and list it in `AMBIENT_BEDS` below, and it plays.
 */

export type AmbientBedId = "day" | "night" | "rain";

interface AmbientBed {
  id: AmbientBedId;
  src: string;
  label: string;
}

const AMBIENT_BEDS: readonly AmbientBed[] = [
  { id: "day", src: "/audio/day.mp3", label: "Birdsong and a soft breeze" },
  { id: "night", src: "/audio/night.mp3", label: "Crickets and a quiet wind" },
  { id: "rain", src: "/audio/rain.mp3", label: "Gentle rain" },
];

const PHASE_TO_BED: Record<SkyPhase, AmbientBedId> = {
  "deep-night": "night",
  dawn: "day",
  morning: "day",
  day: "day",
  golden: "day",
  dusk: "night",
  night: "night",
};

/** Which ambient bed suits a given moment in the sky. */
export function bedForSkyPhase(phase: SkyPhase): AmbientBedId {
  return PHASE_TO_BED[phase];
}

const FADE_MS = 2200;

let currentHowl: Howl | null = null;
let currentBed: AmbientBedId | null = null;
let targetVolume = 0.45;

function loadBed(id: AmbientBedId): Howl {
  const bed = AMBIENT_BEDS.find((entry) => entry.id === id);

  if (!bed) {
    throw new Error(`Unknown ambient bed: ${id}`);
  }

  return new Howl({
    src: [bed.src],
    loop: true,
    volume: 0,
    html5: true,
    onloaderror: () => {
      // Audio assets are optional content. A missing file must never surface
      // as a broken experience — it simply stays quiet.
      console.warn(`Ambient audio "${id}" is not available yet.`);
    },
  });
}

/**
 * Cross-fade to a bed and begin playing it.
 *
 * Call only in response to a person's own action (opening the world,
 * changing a setting) — browsers block unprompted audio, and Same Sky should
 * not want to work around that even where it could.
 */
export function playAmbientBed(id: AmbientBedId, volume = targetVolume): void {
  targetVolume = volume;

  if (currentBed === id && currentHowl) {
    currentHowl.fade(currentHowl.volume(), volume, FADE_MS);
    return;
  }

  const previous = currentHowl;

  const next = loadBed(id);
  next.play();
  next.fade(0, volume, FADE_MS);

  currentHowl = next;
  currentBed = id;

  if (previous) {
    previous.fade(previous.volume(), 0, FADE_MS);
    window.setTimeout(() => previous.unload(), FADE_MS + 100);
  }
}

export function setAmbientVolume(volume: number): void {
  targetVolume = volume;
  currentHowl?.fade(currentHowl.volume(), volume, 600);
}

/**
 * Stop immediately. A person turning ambient audio off should hear silence
 * at once, not a lingering fade.
 */
export function stopAmbientAudio(): void {
  currentHowl?.stop();
  currentHowl?.unload();
  currentHowl = null;
  currentBed = null;
}
