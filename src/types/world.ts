export interface TreeState {
  stage: number;
}

export interface GardenState {
  flowers: number;
}

export interface PondState {
  level: number;
}

export interface WorldState {
  pairId: string;

  tree: TreeState;

  garden: GardenState;

  pond: PondState;

  butterflies: number;

  worldScore: number;

  updatedAt: number;
}

export interface WorldEvent {
  type:
    | "WAKE_UP"
    | "DRINK_WATER"
    | "MEDITATION"
    | "READING"
    | "JOURNAL"
    | "NOTE";

  pairId: string;

  userId: string;

  createdAt: number;
}