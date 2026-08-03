import { PATHS } from "../app/constants";
import type {
  CreatePairPayload,
  JoinPairPayload,
  Pair,
  PairInvite,
} from "../types/pair";
import type { UserProfile } from "../types/user";
import { INVITE_CODE_LENGTH, normaliseInviteCode } from "../utils/validators";
import { getData, reserveChildKey, setData, subscribe, updateData } from "./database";
import { recordEvent } from "./timeline";
import { ensureWorld } from "./world";

/**
 * Pairing.
 *
 * Same Sky is built for exactly two people, and pairing is what creates
 * ownership of a shared world. A pair is permanent by design: there is no
 * flow here for dissolving one, because the world and the history attached to
 * it are the archive the product exists to keep.
 */

/**
 * Excludes I, O, 0 and 1 — the characters people reliably misread when passing
 * a code to someone by voice or by hand.
 */
const INVITE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Uses the platform's cryptographic generator rather than `Math.random`, and
 * rejects the tail of the byte range so every character stays equally likely.
 */
function generateInviteCode(length = INVITE_CODE_LENGTH): string {
  const limit = 256 - (256 % INVITE_CHARACTERS.length);
  let code = "";

  while (code.length < length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);

    for (const byte of bytes) {
      if (code.length === length) break;
      if (byte >= limit) continue;

      code += INVITE_CHARACTERS[byte % INVITE_CHARACTERS.length];
    }
  }

  return code;
}

/**
 * A code nobody else is holding.
 *
 * Collisions are vanishingly unlikely at this scale, but a person handed a
 * code that silently belongs to a different pair would be a hard failure to
 * explain, so the cheap check is worth making.
 */
async function reserveInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateInviteCode();
    const existing = await getData<PairInvite>(PATHS.inviteCode(code));

    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to reserve a Sky Link. Please try again.");
}

/* -------------------------------------------------------------------------
   Creating and joining
   ------------------------------------------------------------------------- */

/**
 * Open a pair and its shared world, then hand back the code to share.
 *
 * The world is created here rather than on joining, so the person who invites
 * can begin tending it immediately instead of waiting in an empty room. When
 * their partner arrives, that same world is simply extended to hold them both.
 */
export async function createPair({ ownerUid }: CreatePairPayload): Promise<Pair> {
  const existingProfile = await getData<UserProfile>(PATHS.user(ownerUid));

  // Re-entering the pairing screen must never orphan an existing world.
  if (existingProfile?.pairId) {
    const existingPair = await getData<Pair>(PATHS.pair(existingProfile.pairId));

    if (existingPair) {
      return existingPair;
    }
  }

  const inviteCode = await reserveInviteCode();
  const pairId = reserveChildKey("pairs");

  const pair: Pair = {
    id: pairId,
    inviteCode,
    partnerA: ownerUid,
    partnerB: null,
    status: "pending",
    // A pair and its world share an identifier: there is exactly one world per
    // pair, for as long as the pair exists.
    worldId: pairId,
    createdAt: Date.now(),
  };

  await setData(PATHS.pair(pairId), pair);

  const invite: PairInvite = {
    inviteCode,
    ownerUid,
    pairId,
    used: false,
    createdAt: Date.now(),
  };

  await setData(PATHS.inviteCode(inviteCode), invite);

  await ensureWorld(pair.worldId, pairId, [ownerUid]);

  await updateData<UserProfile>(PATHS.user(ownerUid), { pairId });

  await recordEvent({
    worldId: pair.worldId,
    type: "world-created",
    uid: ownerUid,
    title: "Your world began",
    detail: null,
  });

  return pair;
}

export async function getInvite(inviteCode: string): Promise<PairInvite | null> {
  return getData<PairInvite>(PATHS.inviteCode(normaliseInviteCode(inviteCode)));
}

/**
 * Why a join did or did not succeed.
 *
 * Returned rather than thrown so the interface can say something specific and
 * kind about each case — "that is your own link" reads very differently from
 * "invalid code".
 */
export type JoinPairOutcome =
  | { status: "joined"; pair: Pair }
  | { status: "unknown-code" }
  | { status: "already-used" }
  | { status: "own-code" }
  | { status: "already-paired" };

/**
 * Accept an invitation and step into the shared world.
 */
export async function joinPair({
  inviteCode,
  joiningUid,
}: JoinPairPayload): Promise<JoinPairOutcome> {
  const code = normaliseInviteCode(inviteCode);
  const invite = await getInvite(code);

  if (!invite) {
    return { status: "unknown-code" };
  }

  if (invite.ownerUid === joiningUid) {
    return { status: "own-code" };
  }

  const joiningProfile = await getData<UserProfile>(PATHS.user(joiningUid));

  if (joiningProfile?.pairId && joiningProfile.pairId !== invite.pairId) {
    return { status: "already-paired" };
  }

  const pair = await getData<Pair>(PATHS.pair(invite.pairId));

  if (!pair) {
    return { status: "unknown-code" };
  }

  // Someone rejoining their own pair — for instance after reinstalling — is
  // welcomed back rather than turned away.
  if (pair.partnerB && pair.partnerB !== joiningUid) {
    return { status: "already-used" };
  }

  if (invite.used && pair.partnerB !== joiningUid) {
    return { status: "already-used" };
  }

  const joined: Pair = { ...pair, partnerB: joiningUid, status: "active" };

  await setData(PATHS.pair(pair.id), joined);

  await updateData<PairInvite>(PATHS.inviteCode(code), { used: true });

  // Extends the existing world rather than replacing it: whatever the first
  // partner grew while waiting is still standing.
  await ensureWorld(joined.worldId, joined.id, [joined.partnerA, joiningUid]);

  await updateData<UserProfile>(PATHS.user(joiningUid), { pairId: joined.id });

  return { status: "joined", pair: joined };
}

/* -------------------------------------------------------------------------
   Reading a pair
   ------------------------------------------------------------------------- */

export async function getPair(pairId: string): Promise<Pair | null> {
  return getData<Pair>(PATHS.pair(pairId));
}

/**
 * A live listener earns its place here: the moment a partner accepts an
 * invitation, the person who sent it should see the world open rather than
 * having to reload the page they have been staring at.
 */
export function subscribeToPair(
  pairId: string,
  callback: (pair: Pair | null) => void,
): () => void {
  return subscribe<Pair>(PATHS.pair(pairId), callback);
}

/**
 * The other person, or `null` while a pair is still waiting to be joined.
 */
export function getPartnerUid(pair: Pair, selfUid: string): string | null {
  if (pair.partnerA === selfUid) return pair.partnerB;
  if (pair.partnerB === selfUid) return pair.partnerA;

  return null;
}

/**
 * Both members of a pair, in a stable order. Contains one uid while a pair is
 * still pending.
 */
export function getPartnerUids(pair: Pair): string[] {
  return pair.partnerB ? [pair.partnerA, pair.partnerB] : [pair.partnerA];
}
