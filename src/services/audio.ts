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

/**
 * A small songbird's chirrup — two or three quick, rising whistles.
 *
 * Synthesised like everything else here: a sine voice swept upward with a
 * fast vibrato, so it reads as a bird rather than a tone. Follows the same
 * preference as the chimes, and like them is only ever called from something
 * a person did (tapping a bird) or while ambient sound is already on.
 */
export function playBirdChirp(pitch = 1): void {
  if (!chimesEnabled) return;

  const context = getAudioContext();

  if (!context) return;

  void context.resume();

  const now = context.currentTime;
  const notes = 2 + Math.floor(Math.random() * 2);
  const base = 2600 * pitch;

  for (let index = 0; index < notes; index += 1) {
    const startAt = now + index * 0.11;
    const duration = 0.075 + Math.random() * 0.03;

    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(base * (0.85 + Math.random() * 0.1), startAt);
    oscillator.frequency.exponentialRampToValueAtTime(base * (1.35 + index * 0.08), startAt + duration);

    const vibrato = context.createOscillator();
    vibrato.frequency.setValueAtTime(42, startAt);
    const vibratoDepth = context.createGain();
    vibratoDepth.gain.setValueAtTime(base * 0.04, startAt);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(oscillator.frequency);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.07 * chimeVolume, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startAt);
    vibrato.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
    vibrato.stop(startAt + duration + 0.02);
  }
}

/* -------------------------------------------------------------------------
   Opening intro
   ------------------------------------------------------------------------- */

/**
 * Whether sound can play right now without a fresh gesture. Browsers keep a
 * new audio context suspended until someone has interacted with the page.
 */
export async function audioIsUnlocked(): Promise<boolean> {
  const context = getAudioContext();

  if (!context) return false;

  try {
    await Promise.race([context.resume(), new Promise((resolve) => setTimeout(resolve, 250))]);
  } catch {
    return false;
  }

  return context.state === "running";
}

/** A soft voice: one sine note with a gentle attack and long tail. */
function softNote(context: AudioContext, frequency: number, startAt: number, duration: number, peak: number): void {
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.05);
}

/**
 * The meadow waking up: a warm low pad swelling in under a few high,
 * glassy sparkles, like light catching dew. Quiet and over in two seconds.
 */
export function playIntroBloom(): void {
  if (!chimesEnabled) return;

  const context = getAudioContext();

  if (!context || context.state !== "running") return;

  const now = context.currentTime;
  const volume = 0.12 * chimeVolume;

  // Pad: C4 + G4, slow swell.
  for (const frequency of [261.63, 392]) {
    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 2.5);
  }

  // Dew sparkles: E6, G6, C7.
  [1318.5, 1568, 2093].forEach((frequency, index) => {
    softNote(context, frequency, now + 0.35 + index * 0.16, 0.9, volume * 0.55);
  });
}

/**
 * Stepping into the world: an airy whoosh that rises like a breeze lifting
 * you up, landing on the "Same Sky" signature, two bright notes a fourth
 * apart (G5 → C6) with a soft shimmer above.
 */
export function playEnterSwoop(): void {
  if (!chimesEnabled) return;

  const context = getAudioContext();

  if (!context) return;

  void context.resume();

  const now = context.currentTime;
  const volume = chimeVolume;

  // The whoosh: band-passed noise sweeping upward, swelling then gone.
  const noise = context.createBufferSource();
  noise.buffer = getNoiseBuffer(context);

  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.Q.setValueAtTime(1.2, now);
  band.frequency.setValueAtTime(250, now);
  band.frequency.exponentialRampToValueAtTime(3200, now + 0.55);

  const whoosh = context.createGain();
  whoosh.gain.setValueAtTime(0.0001, now);
  whoosh.gain.exponentialRampToValueAtTime(0.22 * volume, now + 0.32);
  whoosh.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

  noise.connect(band);
  band.connect(whoosh);
  whoosh.connect(context.destination);
  noise.start(now);
  noise.stop(now + 0.75);

  // A sine gliding up underneath, giving the swoop its lift.
  const glide = context.createOscillator();
  glide.type = "sine";
  glide.frequency.setValueAtTime(330, now);
  glide.frequency.exponentialRampToValueAtTime(990, now + 0.45);

  const glideGain = context.createGain();
  glideGain.gain.setValueAtTime(0.0001, now);
  glideGain.gain.exponentialRampToValueAtTime(0.06 * volume, now + 0.2);
  glideGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  glide.connect(glideGain);
  glideGain.connect(context.destination);
  glide.start(now);
  glide.stop(now + 0.55);

  // The signature landing: "Same … Sky".
  softNote(context, 783.99, now + 0.42, 0.7, 0.13 * volume);
  softNote(context, 1046.5, now + 0.58, 1.3, 0.15 * volume);
  softNote(context, 2093, now + 0.6, 0.9, 0.035 * volume);
}

/* -------------------------------------------------------------------------
   Night wind chimes
   ------------------------------------------------------------------------- */

/** A pentatonic set, so any handful of notes always sounds gentle together. */
const CHIME_NOTES_HZ = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093];

/**
 * A breath of night wind stirring a wind chime: a soft swell of air, then
 * three to five bell-like notes with long, shimmering tails. Follows the same
 * sound preference as everything else.
 */
export function playWindChime(): void {
  if (!chimesEnabled) return;

  const context = getAudioContext();

  if (!context || context.state !== "running") return;

  const now = context.currentTime;
  const volume = chimeVolume;

  // The breeze: low-passed noise swelling in and out.
  const noise = context.createBufferSource();
  noise.buffer = getNoiseBuffer(context);
  const air = context.createBiquadFilter();
  air.type = "lowpass";
  air.frequency.setValueAtTime(500, now);
  air.frequency.linearRampToValueAtTime(900, now + 1.4);
  const airGain = context.createGain();
  airGain.gain.setValueAtTime(0.0001, now);
  airGain.gain.exponentialRampToValueAtTime(0.05 * volume, now + 1.2);
  airGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
  noise.connect(air);
  air.connect(airGain);
  airGain.connect(context.destination);
  noise.start(now);
  noise.stop(now + 3.3);

  // The chimes: struck metal is a sine plus a quieter, slightly sharp partial.
  const strikes = 3 + Math.floor(Math.random() * 3);

  for (let index = 0; index < strikes; index += 1) {
    const startAt = now + 0.5 + index * (0.18 + Math.random() * 0.35);
    const frequency = CHIME_NOTES_HZ[Math.floor(Math.random() * CHIME_NOTES_HZ.length)];

    for (const [ratio, level] of [
      [1, 1],
      [2.76, 0.25],
    ] as const) {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency * ratio, startAt);

      const gain = context.createGain();
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.045 * volume * level, startAt + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 2.6 / ratio);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 2.7);
    }
  }
}
