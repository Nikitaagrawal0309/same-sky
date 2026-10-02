/**
 * Attack tests for the Realtime Database security rules.
 *
 * Runs against the local Firebase emulator (needs Java + firebase-tools):
 *   npm run test:rules
 *
 * Cast:
 *   alice, bob   — a paired couple sharing world "w1"
 *   carol        — a signed-in stranger (any Google account)
 *   dave         — has his own pending world "w2"
 *   (anon)       — not signed in at all
 *
 * Every "assertFails" is an attack that must be blocked; every
 * "assertSucceeds" is something the real app does and must keep working.
 */
import { after, before, beforeEach, describe, test } from "node:test";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { get, ref, remove, set, update } from "firebase/database";

const NOW = Date.now();
const HOURS = 60 * 60 * 1000;

let env;

const db = (uid) => (uid ? env.authenticatedContext(uid).database() : env.unauthenticatedContext().database());

const profile = (uid, pairId = null) => ({
  uid,
  displayName: uid,
  email: `${uid}@example.com`,
  photoURL: null,
  ...(pairId ? { pairId } : {}),
  createdAt: NOW,
  lastSeen: NOW,
});

const pair = (id, partnerA, partnerB, inviteCode) => ({
  id,
  inviteCode,
  partnerA,
  ...(partnerB ? { partnerB } : {}),
  status: partnerB ? "active" : "pending",
  worldId: id,
  createdAt: NOW,
});

const world = (id, uids) => ({
  worldId: id,
  pairId: id,
  createdAt: NOW,
  updatedAt: NOW,
  contributions: Object.fromEntries(uids.map((uid) => [uid, { uid, energy: 0, rituals: 0, activeDays: 0 }])),
  totalEnergy: 0,
  totalRituals: 0,
  activeDays: 0,
  sharedDays: 0,
});

const journalEntry = (id, authorUid, extra = {}) => ({
  id,
  worldId: "w1",
  authorUid,
  date: "2026-10-01",
  title: "A day",
  body: "Words",
  createdAt: NOW,
  updatedAt: NOW,
  ...extra,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-same-sky",
    database: { rules: readFileSync(new URL("../../database.rules.json", import.meta.url), "utf8") },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (context) => {
    const admin = context.database();
    await set(ref(admin), {
      users: {
        alice: profile("alice", "w1"),
        bob: profile("bob", "w1"),
        carol: profile("carol"),
        dave: profile("dave", "w2"),
      },
      pairs: {
        w1: pair("w1", "alice", "bob", "ALICE2"),
        w2: pair("w2", "dave", null, "DAVE22"),
      },
      inviteCodes: {
        ALICE2: { inviteCode: "ALICE2", ownerUid: "alice", pairId: "w1", used: true, createdAt: NOW },
        DAVE22: { inviteCode: "DAVE22", ownerUid: "dave", pairId: "w2", used: false, createdAt: NOW },
      },
      worlds: { w1: world("w1", ["alice", "bob"]), w2: world("w2", ["dave"]) },
      journal: { w1: { j1: journalEntry("j1", "alice") } },
      notes: {
        w1: {
          "2026-10-01": {
            alice: { id: "n1", worldId: "w1", authorUid: "alice", date: "2026-10-01", body: "hi", vessel: "letter", createdAt: NOW },
          },
        },
      },
      timeline: { w1: { t1: { id: "t1", worldId: "w1", type: "milestone", title: "Began", date: "2026-10-01", createdAt: NOW } } },
    });
  });
});

/* ------------------------------------------------------------------ */
describe("signed-out visitors", () => {
  for (const path of ["users/alice", "pairs/w1", "worlds/w1", "journal/w1", "memories/w1", "notes/w1", "moods/w1", "gardens/w1", "timeline/w1", "inviteCodes/DAVE22"]) {
    test(`cannot read ${path}`, async () => {
      await assertFails(get(ref(db(null), path)));
    });
  }

  test("cannot write anything", async () => {
    await assertFails(set(ref(db(null), "users/mallory"), profile("mallory")));
    await assertFails(set(ref(db(null), "journal/w1/x"), journalEntry("x", "mallory")));
  });
});

describe("a signed-in stranger", () => {
  for (const path of ["users/alice", "pairs/w1", "worlds/w1", "worldHistory/w1", "rituals/w1", "journal/w1", "memories/w1", "notes/w1", "plans/w1", "moods/w1", "gardens/w1", "timeline/w1"]) {
    test(`cannot read ${path}`, async () => {
      await assertFails(get(ref(db("carol"), path)));
    });
  }

  test("cannot list every user, pair or invite code", async () => {
    await assertFails(get(ref(db("carol"), "users")));
    await assertFails(get(ref(db("carol"), "pairs")));
    await assertFails(get(ref(db("carol"), "inviteCodes")));
    await assertFails(get(ref(db("carol"))));
  });

  test("cannot write into someone else's world", async () => {
    await assertFails(set(ref(db("carol"), "journal/w1/evil"), journalEntry("evil", "carol")));
    await assertFails(update(ref(db("carol"), "worlds/w1"), { totalEnergy: 999999 }));
    await assertFails(set(ref(db("carol"), "moods/w1/2026-10-01/carol"), { mood: "happy", at: NOW }));
    await assertFails(set(ref(db("carol"), "gardens/w1/weather"), "rainbow"));
  });

  test("cannot edit someone else's profile", async () => {
    await assertFails(update(ref(db("carol"), "users/alice"), { displayName: "hacked" }));
  });

  test("cannot point their profile at a world they aren't in", async () => {
    await assertFails(update(ref(db("carol"), "users/carol"), { pairId: "w1" }));
  });

  test("cannot take over a full pair or add themselves as a partner", async () => {
    await assertFails(update(ref(db("carol"), "pairs/w1"), { partnerB: "carol" }));
    await assertFails(update(ref(db("carol"), "pairs/w1"), { partnerA: "carol" }));
  });

  test("cannot reach a partner profile by faking their own pairId", async () => {
    // Even if carol somehow had pairId w1 on her profile, she isn't on pair w1.
    await env.withSecurityRulesDisabled((context) => update(ref(context.database(), "users/carol"), { pairId: "w1" }));
    await assertFails(get(ref(db("carol"), "users/alice")));
  });
});

/* ------------------------------------------------------------------ */
describe("pairing", () => {
  test("a stranger can join a pending pair with a valid, fresh code", async () => {
    await assertSucceeds(set(ref(db("carol"), "pairs/w2"), { ...pair("w2", "dave", "carol", "DAVE22"), status: "active" }));
    await assertSucceeds(update(ref(db("carol"), "inviteCodes/DAVE22"), { used: true }));
    await assertSucceeds(update(ref(db("carol"), "users/carol"), { pairId: "w2" }));
  });

  test("an expired code cannot be used to join", async () => {
    await env.withSecurityRulesDisabled((context) =>
      update(ref(context.database(), "inviteCodes/DAVE22"), { createdAt: NOW - 49 * HOURS }),
    );
    await assertFails(set(ref(db("carol"), "pairs/w2"), { ...pair("w2", "dave", "carol", "DAVE22"), status: "active" }));
  });

  test("a used code cannot be used to join", async () => {
    await env.withSecurityRulesDisabled((context) => update(ref(context.database(), "inviteCodes/DAVE22"), { used: true }));
    await assertFails(set(ref(db("carol"), "pairs/w2"), { ...pair("w2", "dave", "carol", "DAVE22"), status: "active" }));
  });

  test("nobody can join as someone else", async () => {
    await assertFails(set(ref(db("carol"), "pairs/w2"), { ...pair("w2", "dave", "mallory", "DAVE22"), status: "active" }));
  });

  test("a joiner cannot swap the invite code for one they control", async () => {
    await assertFails(set(ref(db("carol"), "pairs/w2"), { ...pair("w2", "dave", "carol", "CAROL2"), status: "active" }));
  });

  test("an invite can't be created for someone else's pair, or post-dated", async () => {
    await assertFails(set(ref(db("carol"), "inviteCodes/EVIL22"), { inviteCode: "EVIL22", ownerUid: "carol", pairId: "w2", used: false, createdAt: NOW }));
    await assertFails(set(ref(db("dave"), "inviteCodes/LATE22"), { inviteCode: "LATE22", ownerUid: "dave", pairId: "w2", used: false, createdAt: NOW + 30 * 24 * HOURS }));
  });

  test("only the joined partner can mark an invite used, and not delete it", async () => {
    await assertFails(update(ref(db("carol"), "inviteCodes/DAVE22"), { used: true }));
    await assertFails(remove(ref(db("dave"), "inviteCodes/DAVE22")));
  });

  test("the owner can refresh a pending pair's code", async () => {
    await assertSucceeds(set(ref(db("dave"), "inviteCodes/NEWC22"), { inviteCode: "NEWC22", ownerUid: "dave", pairId: "w2", used: false, createdAt: NOW }));
    await assertSucceeds(update(ref(db("dave"), "pairs/w2"), { inviteCode: "NEWC22" }));
  });

  test("a new person can start their own pair", async () => {
    await assertSucceeds(set(ref(db("carol"), "pairs/w3"), pair("w3", "carol", null, "CARE22")));
    await assertSucceeds(set(ref(db("carol"), "inviteCodes/CARE22"), { inviteCode: "CARE22", ownerUid: "carol", pairId: "w3", used: false, createdAt: NOW }));
  });
});

/* ------------------------------------------------------------------ */
describe("the couple", () => {
  test("both can read their shared world", async () => {
    for (const uid of ["alice", "bob"]) {
      for (const path of ["worlds/w1", "journal/w1", "notes/w1", "timeline/w1", "pairs/w1"]) {
        await assertSucceeds(get(ref(db(uid), path)));
      }
    }
  });

  test("each can read the other's profile", async () => {
    await assertSucceeds(get(ref(db("alice"), "users/bob")));
    await assertSucceeds(get(ref(db("bob"), "users/alice")));
  });

  test("bob cannot edit or delete alice's journal page", async () => {
    await assertFails(update(ref(db("bob"), "journal/w1/j1"), { body: "changed" }));
    await assertFails(remove(ref(db("bob"), "journal/w1/j1")));
  });

  test("bob cannot write a journal page in alice's name", async () => {
    await assertFails(set(ref(db("bob"), "journal/w1/j2"), journalEntry("j2", "alice")));
  });

  test("alice can edit her own page; bob can add his own", async () => {
    await assertSucceeds(update(ref(db("alice"), "journal/w1/j1"), { body: "edited", updatedAt: NOW }));
    await assertSucceeds(set(ref(db("bob"), "journal/w1/j3"), journalEntry("j3", "bob")));
  });

  test("bob may mark alice's note opened once, but never change it", async () => {
    await assertSucceeds(update(ref(db("bob"), "notes/w1/2026-10-01/alice"), { openedAt: NOW }));
    await assertFails(update(ref(db("bob"), "notes/w1/2026-10-01/alice"), { openedAt: NOW + 1 }));
    await assertFails(update(ref(db("bob"), "notes/w1/2026-10-01/alice"), { body: "forged" }));
  });

  test("bob cannot honour rituals in alice's slot", async () => {
    const entry = { ritualId: "water", uid: "alice", date: "2026-10-01", honouredAt: NOW, energy: 1 };
    await assertFails(set(ref(db("bob"), "rituals/w1/2026-10-01/alice/water"), entry));
    await assertSucceeds(set(ref(db("bob"), "rituals/w1/2026-10-01/bob/water"), { ...entry, uid: "bob" }));
  });

  test("the timeline is append-only", async () => {
    await assertFails(update(ref(db("alice"), "timeline/w1/t1"), { title: "rewritten" }));
    await assertFails(remove(ref(db("alice"), "timeline/w1/t1")));
  });

  test("bob cannot set alice's mood; moods must be real options", async () => {
    await assertFails(set(ref(db("bob"), "moods/w1/2026-10-01/alice"), { mood: "happy", at: NOW }));
    await assertFails(set(ref(db("bob"), "moods/w1/2026-10-01/bob"), { mood: "<script>", at: NOW }));
    await assertSucceeds(set(ref(db("bob"), "moods/w1/2026-10-01/bob"), { mood: "loved", at: NOW }));
  });

  test("memories only accept real, size-capped images", async () => {
    const memory = { id: "m1", worldId: "w1", authorUid: "alice", title: "Beach", date: "2026-10-01", kind: "moment", createdAt: NOW, updatedAt: NOW };
    await assertFails(set(ref(db("alice"), "memories/w1/m1"), { ...memory, image: { data: "javascript:alert(1)", width: 10, height: 10, bytes: 1 } }));
    await assertFails(set(ref(db("alice"), "memories/w1/m1"), { ...memory, image: { data: `data:image/jpeg;base64,${"A".repeat(1_600_000)}`, width: 10, height: 10, bytes: 1 } }));
    await assertSucceeds(set(ref(db("alice"), "memories/w1/m1"), { ...memory, image: { data: "data:image/jpeg;base64,AAAA", width: 10, height: 10, bytes: 3 } }));
  });

  test("unknown fields and oversized text are rejected", async () => {
    await assertFails(set(ref(db("alice"), "journal/w1/j9"), journalEntry("j9", "alice", { isAdmin: true })));
    await assertFails(set(ref(db("alice"), "journal/w1/j9"), journalEntry("j9", "alice", { body: "x".repeat(20001) })));
    await assertFails(update(ref(db("alice"), "users/alice"), { role: "admin" }));
  });

  test("a partner from another world gets nothing", async () => {
    await assertFails(get(ref(db("dave"), "journal/w1")));
    await assertFails(get(ref(db("dave"), "users/alice")));
  });
});
