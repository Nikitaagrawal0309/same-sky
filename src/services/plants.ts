import type { DateKey } from "../types/database";
import type { GardenPlot, SeedId } from "../types/garden";
import { SEEDS } from "../types/garden";
import type { WorldDaySummary } from "../types/world";

/**
 * How far a sown plant has grown, 0–1: the rituals either of you honoured
 * from the day it was sown, against what that kind of plant needs.
 */
export function plantGrowth(plot: GardenPlot, history: Record<DateKey, WorldDaySummary>): number {
  const seed = SEEDS.find((candidate) => candidate.id === plot.seedId);

  if (!seed) return 0;

  let rituals = 0;

  for (const [date, day] of Object.entries(history)) {
    if (date >= plot.plantedOn) rituals += day.rituals;
  }

  // Freshly sown seeds show a hint of green straight away.
  return Math.min(1, 0.05 + rituals / seed.maturesAfter);
}

export function plantStageLabel(growth: number, seedId: SeedId): string {
  const kind = SEEDS.find((seed) => seed.id === seedId)?.kind;

  if (growth < 0.1) return "Just sown";
  if (growth < 0.35) return "Sprouting";
  if (growth < 0.75) return "Growing";
  if (growth < 1) return kind === "fruit-tree" ? "Blossoming" : "Budding";
  return kind === "fruit-tree" ? "Fruiting!" : kind === "bush" ? "In full bloom" : "Blooming!";
}
