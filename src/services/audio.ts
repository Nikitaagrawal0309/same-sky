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

/* -------------------------------------------------------------------------
   Immediate feedback
   ------------------------------------------------------------------------- */

/**
 * The specification asks for a "small visual and audio response" on every
 * meaningful action — a gentle chime alongside a leaf's movement or a
 * flower's bloom. That cannot wait on licensed recordings the way the
 * ambient beds above do, so it is synthesised instead: a handful of short,
 * soft sine tones built with the Web Audio API, all drawn from the same
 * warm, unhurried palette so five different actions still sound like one
 * instrument rather than five competing sound effects.
 *
 * Every chime is quiet by design — closer to a wind chime stirring than a
 * notification sound — and every one respects the same ambient-audio
 * preference as the environmental beds, so turning sound off in Settings
 * silences both at once.
 */
export type ChimeKind =
  | "ritual-honoured"
  | "ritual-released"
  | "note-sent"
  | "note-opened"
  | "memory-saved"
  | "journal-saved"
  | "milestone";

/** A short musical phrase: each note as [semitones from the root, start offset in seconds, duration in seconds]. */
type ChimePhrase = ReadonlyArray<[number, number, number]>;

/**
 * Semitone offsets from a shared root, so every chime lives in one gentle,
 * consonant scale rather than risking a dissonant combination.
 */
const CHIME_PHRASES: Record<ChimeKind, ChimePhrase> = {
  // A small, warm two-note rise — the sound of something being added.
  "ritual-honoured": [
    [0, 0, 0.5],
    [7, 0.09, 0.6],
  ],
  // The same interval in reverse, softer and shorter — undoing, not failing.
  "ritual-released": [[7, 0, 0.28]],
  // A gentle three-note arpeggio, like a small object being set down with care.
  "note-sent": [
    [0, 0, 0.4],
    [4, 0.1, 0.4],
    [11, 0.2, 0.55],
  ],
  "note-opened": [
    [12, 0, 0.35],
    [7, 0.08, 0.45],
  ],
  // A slightly fuller two-note phrase — a keepsake being placed somewhere safe.
  "memory-saved": [
    [0, 0, 0.45],
    [12, 0.12, 0.6],
  ],
  "journal-saved": [[4, 0, 0.4]],
  // The rarest event in the product gets the fullest phrase — four notes,
  // longer decay, still never louder than a whisper.
  milestone: [
    [0, 0, 0.6],
    [4, 0.14, 0.6],
    [7, 0.28, 0.6],
    [12, 0.42, 1.1],
  ],
};

const CHIME_ROOT_HZ = 523.25; // C5 — high enough to read as light, not alarming.

let audioContext: AudioContext | null = null;
let chimesEnabled = true;
let chimeVolume = 0.45;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) return null;

  audioContext ??= new AudioContextClass();

  return audioContext;
}

/** Mirrors the ambient-audio preference, so one setting governs all sound. */
export function setChimesEnabled(enabled: boolean): void {
  chimesEnabled = enabled;
}

export function setChimeVolume(volume: number): void {
  chimeVolume = volume;
}

/**
 * Play a short, soft chime.
 *
 * Call only from direct consequences of something a person just did — never
 * from a background sync or a listener catching up on history, or the sound
 * stops meaning anything.
 */
export function playChime(kind: ChimeKind): void {
  if (!chimesEnabled) return;

  const context = getAudioContext();

  if (!context) return;

  // A context created before any gesture starts "suspended"; resuming is
  // harmless if it is already running.
  void context.resume();

  const now = context.currentTime;
  const peakGain = 0.16 * chimeVolume;

  for (const [semitones, offset, duration] of CHIME_PHRASES[kind]) {
    const frequency = CHIME_ROOT_HZ * Math.pow(2, semitones / 12);
    const startAt = now + offset;

    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, startAt);
    // A soft attack and a slow exponential release — nothing here should
    // ever sound like a notification demanding attention.
    gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
  }
}
