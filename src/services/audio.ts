import type { SkyPhase } from "../types/world";

/**
 * Sound.
 *
 * Nothing here plays from a recorded file. Both the ambient beds below and
 * the feedback chimes further down are synthesised live with the Web Audio
 * API, so there is no licensed content to source and no asset to ship —
 * immersion the specification asks for ("leaves moving, soft wind, birds
 * singing, water ripples, gentle rain, distant thunder, nighttime insects")
 * built entirely in code, drawn from one consistent, unhurried palette so it
 * always reads as one instrument rather than a pile of sound effects.
 *
 * Three rules govern all of it: audio never starts itself before a person
 * has interacted with the page, exactly one ambient bed plays at a time, and
 * turning it off is immediate and complete.
 */

let audioContext: AudioContext | null = null;

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

/* -------------------------------------------------------------------------
   Ambient soundscape
   ------------------------------------------------------------------------- */

export type AmbientBedId = "day" | "night" | "rain";

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

const FADE_SECONDS = 2.2;

let sharedNoiseBuffer: AudioBuffer | null = null;

/** A few seconds of white noise, looped and reshaped per-bed by filters. */
function getNoiseBuffer(context: AudioContext): AudioBuffer {
  if (sharedNoiseBuffer) return sharedNoiseBuffer;

  const seconds = 4;
  const frameCount = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  sharedNoiseBuffer = buffer;
  return buffer;
}

/** A single recurring background layer: filtered noise with a slow, breathing modulation. */
function buildNoiseLayer(
  context: AudioContext,
  options: {
    filterType: BiquadFilterType;
    cutoff: number;
    resonance: number;
    lfoRate: number;
    lfoDepth: number;
    level: number;
  },
): { output: AudioNode; dispose: () => void } {
  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer(context);
  source.loop = true;

  const filter = context.createBiquadFilter();
  filter.type = options.filterType;
  filter.frequency.value = options.cutoff;
  filter.Q.value = options.resonance;

  const lfo = context.createOscillator();
  lfo.frequency.value = options.lfoRate;
  const lfoGain = context.createGain();
  lfoGain.gain.value = options.lfoDepth;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const level = context.createGain();
  level.gain.value = options.level;

  source.connect(filter);
  filter.connect(level);

  source.start();
  lfo.start();

  return {
    output: level,
    dispose: () => {
      source.stop();
      lfo.stop();
      source.disconnect();
      filter.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
      level.disconnect();
    },
  };
}

/** Repeats `makeSound` at randomised intervals until disposed — birdsong, crickets, rain texture. */
function scheduleDetails(
  makeSound: () => void,
  minMs: number,
  maxMs: number,
): () => void {
  let alive = true;
  let timer: ReturnType<typeof window.setTimeout> | undefined;

  function tick(): void {
    if (!alive) return;
    makeSound();
    timer = window.setTimeout(tick, minMs + Math.random() * (maxMs - minMs));
  }

  timer = window.setTimeout(tick, minMs + Math.random() * (maxMs - minMs));

  return () => {
    alive = false;
    if (timer !== undefined) window.clearTimeout(timer);
  };
}

/** A short, soft, upward-lifting phrase — the suggestion of a bird, never a literal recording. */
function playBirdsong(context: AudioContext, destination: AudioNode): void {
  const now = context.currentTime;
  const notes = 2 + Math.floor(Math.random() * 2);
  let t = now;

  for (let i = 0; i < notes; i++) {
    const baseFrequency = 1900 + Math.random() * 1300;

    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(baseFrequency, t);
    oscillator.frequency.exponentialRampToValueAtTime(
      baseFrequency * (0.88 + Math.random() * 0.3),
      t + 0.09,
    );

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.055, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);

    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(t);
    oscillator.stop(t + 0.15);

    t += 0.1 + Math.random() * 0.06;
  }
}

/** A quick pulsing tone standing in for crickets, softer than the birdsong above. */
function playCrickets(context: AudioContext, destination: AudioNode): void {
  const now = context.currentTime;
  const pulses = 3 + Math.floor(Math.random() * 4);
  const frequency = 3600 + Math.random() * 700;
  let t = now;

  for (let i = 0; i < pulses; i++) {
    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.024, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(t);
    oscillator.stop(t + 0.06);

    t += 0.085;
  }
}

/** A distant, low rumble — rare enough to be a surprise, never loud enough to startle. */
function playThunder(context: AudioContext, destination: AudioNode): void {
  const now = context.currentTime;

  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer(context);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 110;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 1.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  source.start(now);
  source.stop(now + 4.6);
}

interface ActiveBed {
  id: AmbientBedId;
  gain: GainNode;
  dispose: () => void;
}

let masterAmbientGain: GainNode | null = null;

function getMasterAmbientGain(context: AudioContext): GainNode {
  if (!masterAmbientGain) {
    masterAmbientGain = context.createGain();
    masterAmbientGain.gain.value = 1;
    masterAmbientGain.connect(context.destination);
  }

  return masterAmbientGain;
}

function buildBed(context: AudioContext, id: AmbientBedId): ActiveBed {
  const gain = context.createGain();
  gain.gain.value = 0;

  const cleanups: Array<() => void> = [];

  if (id === "day") {
    const wind = buildNoiseLayer(context, {
      filterType: "lowpass",
      cutoff: 1600,
      resonance: 0.5,
      lfoRate: 0.14,
      lfoDepth: 260,
      level: 0.16,
    });
    wind.output.connect(gain);
    cleanups.push(wind.dispose);
    cleanups.push(scheduleDetails(() => playBirdsong(context, gain), 3800, 10500));
  } else if (id === "night") {
    const wind = buildNoiseLayer(context, {
      filterType: "lowpass",
      cutoff: 650,
      resonance: 0.4,
      lfoRate: 0.07,
      lfoDepth: 110,
      level: 0.12,
    });
    wind.output.connect(gain);
    cleanups.push(wind.dispose);
    cleanups.push(scheduleDetails(() => playCrickets(context, gain), 1300, 3400));
  } else {
    const hiss = buildNoiseLayer(context, {
      filterType: "bandpass",
      cutoff: 4200,
      resonance: 0.35,
      lfoRate: 0.5,
      lfoDepth: 900,
      level: 0.2,
    });
    hiss.output.connect(gain);
    cleanups.push(hiss.dispose);

    const body = buildNoiseLayer(context, {
      filterType: "lowpass",
      cutoff: 260,
      resonance: 0.3,
      lfoRate: 0.09,
      lfoDepth: 40,
      level: 0.09,
    });
    body.output.connect(gain);
    cleanups.push(body.dispose);

    cleanups.push(scheduleDetails(() => playThunder(context, gain), 42000, 95000));
  }

  return {
    id,
    gain,
    dispose: () => {
      gain.disconnect();
      for (const cleanup of cleanups) cleanup();
    },
  };
}

let activeBed: ActiveBed | null = null;
let targetVolume = 0.45;

/**
 * Cross-fade to a bed and begin playing it.
 *
 * Call only in response to a person's own action (opening the world,
 * changing a setting) — browsers block unprompted audio, and Same Sky should
 * not want to work around that even where it could.
 */
export function playAmbientBed(id: AmbientBedId, volume = targetVolume): void {
  targetVolume = volume;

  const context = getAudioContext();
  if (!context) return;

  void context.resume();

  if (activeBed?.id === id) {
    activeBed.gain.gain.cancelScheduledValues(context.currentTime);
    activeBed.gain.gain.setValueAtTime(activeBed.gain.gain.value, context.currentTime);
    activeBed.gain.gain.linearRampToValueAtTime(volume, context.currentTime + FADE_SECONDS);
    return;
  }

  const previous = activeBed;

  const next = buildBed(context, id);
  next.gain.connect(getMasterAmbientGain(context));
  next.gain.gain.setValueAtTime(0, context.currentTime);
  next.gain.gain.linearRampToValueAtTime(volume, context.currentTime + FADE_SECONDS);

  activeBed = next;

  if (previous) {
    previous.gain.gain.cancelScheduledValues(context.currentTime);
    previous.gain.gain.setValueAtTime(previous.gain.gain.value, context.currentTime);
    previous.gain.gain.linearRampToValueAtTime(0, context.currentTime + FADE_SECONDS);
    window.setTimeout(() => previous.dispose(), FADE_SECONDS * 1000 + 150);
  }
}

export function setAmbientVolume(volume: number): void {
  targetVolume = volume;

  const context = getAudioContext();
  if (!context || !activeBed) return;

  activeBed.gain.gain.cancelScheduledValues(context.currentTime);
  activeBed.gain.gain.setValueAtTime(activeBed.gain.gain.value, context.currentTime);
  activeBed.gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.6);
}

/**
 * Stop immediately. A person turning ambient audio off should hear silence
 * at once, not a lingering fade.
 */
export function stopAmbientAudio(): void {
  activeBed?.dispose();
  activeBed = null;
}

/* -------------------------------------------------------------------------
   Immediate feedback
   ------------------------------------------------------------------------- */

/**
 * The specification asks for a "small visual and audio response" on every
 * meaningful action — a gentle chime alongside a leaf's movement or a
 * flower's bloom: a handful of short, soft sine tones built with the Web
 * Audio API, all drawn from the same warm, unhurried palette so five
 * different actions still sound like one instrument rather than five
 * competing sound effects.
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

let chimesEnabled = true;
let chimeVolume = 0.45;

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
