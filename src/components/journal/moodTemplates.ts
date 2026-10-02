import type { JournalMood } from "../../types/journal";

/**
 * A page template for each journal mood: its paper, ink, handwriting,
 * washi tape and stickers. Choosing how a day felt dresses the page to match.
 */
export interface MoodTemplate {
  name: string;
  emoji: string;
  paper: string;
  /** Ruled lines or dots drawn on the paper. */
  pattern: string;
  ink: string;
  accent: string;
  tape: string;
  titleFont: string;
  bodyFont: string;
  stickers: readonly [string, string];
}

const lines = (colour: string) =>
  `repeating-linear-gradient(to bottom, transparent 0, transparent 27px, ${colour} 27px, ${colour} 28px)`;
const dots = (colour: string) => `radial-gradient(${colour} 1.2px, transparent 1.4px) 0 0 / 18px 18px`;

export const MOOD_TEMPLATES: Record<JournalMood, MoodTemplate> = {
  bright: {
    name: "Sunny side up",
    emoji: "😄",
    paper: "#fff7d1",
    pattern: dots("#f5d76e"),
    ink: "#6b4300",
    accent: "#f59f00",
    tape: "#ffd43b",
    titleFont: "'Gaegu', var(--font-hand)",
    bodyFont: "'Patrick Hand', var(--font-sans)",
    stickers: ["☀️", "🌻"],
  },
  warm: {
    name: "Love letter",
    emoji: "🥰",
    paper: "#ffe8ef",
    pattern: dots("#ffb3c7"),
    ink: "#7f1d45",
    accent: "#e64980",
    tape: "#ff8fab",
    titleFont: "'Caveat', var(--font-hand)",
    bodyFont: "'Patrick Hand', var(--font-sans)",
    stickers: ["💗", "🌷"],
  },
  steady: {
    name: "Meadow notebook",
    emoji: "😌",
    paper: "#eaf7ec",
    pattern: lines("#bfe3c6"),
    ink: "#1d4f2c",
    accent: "#2f9e44",
    tape: "#8ce99a",
    titleFont: "'Patrick Hand', var(--font-sans)",
    bodyFont: "'Patrick Hand', var(--font-sans)",
    stickers: ["🍃", "🐌"],
  },
  tender: {
    name: "Peach & moonlight",
    emoji: "🥺",
    paper: "#fff0e6",
    pattern: dots("#ffc9a8"),
    ink: "#7a3410",
    accent: "#e8590c",
    tape: "#ffb38a",
    titleFont: "'Indie Flower', var(--font-hand)",
    bodyFont: "'Indie Flower', var(--font-sans)",
    stickers: ["🌙", "🫶"],
  },
  heavy: {
    name: "Rainy window",
    emoji: "😔",
    paper: "#e8f1f8",
    pattern: lines("#c3d9ec"),
    ink: "#1f3b57",
    accent: "#1c7ed6",
    tape: "#9cc3e6",
    titleFont: "'Shadows Into Light', var(--font-hand)",
    bodyFont: "'Patrick Hand', var(--font-sans)",
    stickers: ["🌧️", "☕"],
  },
};

/** Entries written without a mood use a plain cream page. */
export const DEFAULT_TEMPLATE: MoodTemplate = {
  name: "Plain page",
  emoji: "📝",
  paper: "#fffbf2",
  pattern: lines("#efe4cc"),
  ink: "#3d3020",
  accent: "#b08968",
  tape: "#e9d8b4",
  titleFont: "'Patrick Hand', var(--font-sans)",
  bodyFont: "'Patrick Hand', var(--font-sans)",
  stickers: ["✏️", "📎"],
};

export function templateFor(mood: JournalMood | null | undefined): MoodTemplate {
  return mood ? MOOD_TEMPLATES[mood] : DEFAULT_TEMPLATE;
}
