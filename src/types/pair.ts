export type PairStatus = "pending" | "active";

export interface Pair {
  id: string;

  inviteCode: string;

  partnerA: string;

  partnerB: string | null;

  status: PairStatus;

  createdAt: number;
}

export interface PairInvite {
  inviteCode: string;

  ownerUid: string;

  pairId: string;

  used: boolean;

  createdAt: number;
}

export interface PairLookupResult {
  isPaired: boolean;

  pairId: string | null;
}

export interface CreatePairPayload {
  ownerUid: string;
}

export interface JoinPairPayload {
  inviteCode: string;

  joiningUid: string;
}