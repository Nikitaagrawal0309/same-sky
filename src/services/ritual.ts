import { setData } from "./database";
import { updateWorldFromRitual } from "./world";

export type RitualType =
  | "water"
  | "walk"
  | "read";

export interface RitualCompletion {
  ritualType: RitualType;

  completedBy: string;

  completedAt: number;
}

function todayKey() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

export async function completeRitual({
  worldId,
  userId,
  ritualType,
}: {
  worldId: string;
  userId: string;
  ritualType: RitualType;
}) {
  const ritual: RitualCompletion = {
    ritualType,
    completedBy: userId,
    completedAt: Date.now(),
  };

  await setData(
    `rituals/${worldId}/${todayKey()}/${ritualType}/${userId}`,
    ritual
  );

  await updateWorldFromRitual(worldId);
}