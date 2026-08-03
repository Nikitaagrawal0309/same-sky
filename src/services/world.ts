import { getData, updateData } from "./database";

export interface WorldState {
  gardenXp: number;
  treeXp: number;
  pondXp: number;

  totalRituals: number;

  lastUpdated: number;
}

const DEFAULT_WORLD: WorldState = {
  gardenXp: 0,
  treeXp: 0,
  pondXp: 0,
  totalRituals: 0,
  lastUpdated: Date.now(),
};

export async function getWorld(
  worldId: string
): Promise<WorldState> {
  const world = await getData<WorldState>(
    `worlds/${worldId}`
  );

  if (!world) {
    return DEFAULT_WORLD;
  }

  return world;
}

export async function updateWorldFromRitual(
  worldId: string
): Promise<void> {
  const world = await getWorld(worldId);

  await updateData<WorldState>(
    `worlds/${worldId}`,
    {
      gardenXp: world.gardenXp + 1,
      treeXp: world.treeXp + 1,
      pondXp: world.pondXp + 1,
      totalRituals: world.totalRituals + 1,
      lastUpdated: Date.now(),
    }
  );
}