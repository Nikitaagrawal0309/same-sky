import type {
  CreatePairPayload,
  JoinPairPayload,
  Pair,
  PairInvite,
} from "../types/pair";

import {
  createChild,
  getData,
  setData,
  updateData,
} from "./database";

const INVITE_CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 6): string {
  let code = "";

  for (let i = 0; i < length; i++) {
    code +=
      INVITE_CHARACTERS[
        Math.floor(
          Math.random() * INVITE_CHARACTERS.length
        )
      ];
  }

  return code;
}

export async function createPair({
  ownerUid,
}: CreatePairPayload): Promise<Pair> {
  const inviteCode = generateInviteCode();

  const pairId = await createChild("pairs", {
    placeholder: true,
  });

  const worldId = pairId;

  const pair: Pair = {
    id: pairId,
    inviteCode,
    partnerA: ownerUid,
    partnerB: null,
    status: "pending",
    worldId,
    createdAt: Date.now(),
  };

  await setData(`pairs/${pairId}`, pair);

  const invite: PairInvite = {
    inviteCode,
    ownerUid,
    pairId,
    used: false,
    createdAt: Date.now(),
  };

  await setData(
    `inviteCodes/${inviteCode}`,
    invite
  );

  await updateData(`users/${ownerUid}`, {
    pairId,
  });

  return pair;
}

export async function getInvite(
  inviteCode: string
): Promise<PairInvite | null> {
  return getData<PairInvite>(
    `inviteCodes/${inviteCode}`
  );
}

export async function joinPair({
  inviteCode,
  joiningUid,
}: JoinPairPayload): Promise<boolean> {
  const invite = await getInvite(inviteCode);

  if (!invite) return false;

  if (invite.used) return false;

  if (invite.ownerUid === joiningUid) {
  throw new Error(
    "You cannot use your own Sky Link."
  );
}

  const pair = await getData<Pair>(
    `pairs/${invite.pairId}`
  );

  if (!pair) return false;

  if (pair.partnerB) {
    return false;
  }

  pair.partnerB = joiningUid;
  pair.status = "active";

  await setData(
    `pairs/${invite.pairId}`,
    pair
  );

  await updateData(
    `inviteCodes/${inviteCode}`,
    {
      used: true,
    }
  );

  await updateData(
    `users/${joiningUid}`,
    {
      pairId: invite.pairId,
    }
  );

  await setData(
    `world/${pair.worldId}`,
    {
      tree: {
        stage: 0,
      },

      garden: {
        flowers: 0,
      },

      pond: {
        level: 0,
      },

      butterflies: 0,

      worldScore: 0,

      updatedAt: Date.now(),
    }
  );

  return true;
}