import { Feather, Flame, Gem, Gift, Mail, type LucideIcon } from "lucide-react";

import type { NoteVessel } from "../../types/note";

/**
 * The object a note takes, and how it's drawn — shared between the composer
 * (`DailyNote.tsx`) and the note's presence inside the world itself
 * (`WorldScene.tsx`), so both always agree on what each vessel looks like.
 */
export const VESSELS: ReadonlyArray<{ id: NoteVessel; icon: LucideIcon; label: string }> = [
  { id: "letter", icon: Mail, label: "A letter" },
  { id: "gift", icon: Gift, label: "A gift" },
  { id: "lantern", icon: Flame, label: "A lantern" },
  { id: "feather", icon: Feather, label: "A feather" },
  { id: "stone", icon: Gem, label: "A stone" },
];
