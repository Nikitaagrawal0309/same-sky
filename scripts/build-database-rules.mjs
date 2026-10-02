/**
 * Generates `database.rules.json`, the Realtime Database security rules.
 *
 * The rules are the only real protection the data has: anything the app
 * checks in the browser can be bypassed by someone talking to the database
 * directly. They are generated from this file (rather than hand-edited JSON)
 * so every world-scoped path uses the exact same membership check and nothing
 * drifts between copies.
 *
 * Principles:
 *   - Deny by default. Nothing is readable or writable unless a rule below
 *     says so, and there are no top-level collection reads (no listing all
 *     users, pairs or invite codes).
 *   - A world (`worldId` === `pairId`) belongs only to the two uids recorded
 *     on `pairs/{pairId}`. Every world-scoped path checks that, server-side.
 *   - People write only their own records; shared records are writable by
 *     both members; authored records (journal, memories, notes) only by
 *     their author.
 *   - Every field is type- and size-checked, and unknown fields are rejected.
 *
 * Run: `npm run rules:build`, then deploy with
 * `npx firebase-tools deploy --only database`.
 */
import { writeFileSync } from "node:fs";

/** Is the signed-in user one of the two people in pair/world `w`? */
const member = (w) =>
  `auth != null && (root.child('pairs').child(${w}).child('partnerA').val() === auth.uid || root.child('pairs').child(${w}).child('partnerB').val() === auth.uid)`;

/** Is uid expression `u` one of the two people in pair/world `w`? */
const uidInPair = (w, u) =>
  `(root.child('pairs').child(${w}).child('partnerA').val() === ${u} || root.child('pairs').child(${w}).child('partnerB').val() === ${u})`;

const str = (max) => `newData.isString() && newData.val().length <= ${max}`;
const optStr = (max) => `!newData.exists() || (${str(max)})`;
const num = "newData.isNumber()";
const nonNeg = "newData.isNumber() && newData.val() >= 0";
const bool = "newData.isBoolean()";
const DATE = "/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/";
const dateStr = `newData.isString() && newData.val().matches(${DATE})`;
const CLOCK = "/^([01][0-9]|2[0-3]):[0-5][0-9]$/";
const oneOf = (values) => `newData.isString() && newData.val().matches(/^(${values.join("|")})$/)`;
const deny = { ".validate": false };

/**
 * A creation timestamp that isn't in the future (allowing an hour of clock
 * drift), so nobody can post-date an invite to stretch its 48-hour life.
 */
const notFuture = (path) => `${path}.isNumber() && ${path}.val() <= now + 3600000`;

const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

const rules = {
  rules: {
    ".read": false,
    ".write": false,

    /* ---------------------------------------------------------------- */
    users: {
      $uid: {
        // Yourself, or the partner you share a pair with (both must be on it).
        ".read": `auth != null && (auth.uid === $uid || (root.child('users').child(auth.uid).child('pairId').isString() && ${uidInPair(
          "root.child('users').child(auth.uid).child('pairId').val()",
          "$uid",
        )} && ${uidInPair("root.child('users').child(auth.uid).child('pairId').val()", "auth.uid")}))`,
        ".write": "auth != null && auth.uid === $uid && newData.exists()",
        ".validate": "newData.hasChildren(['uid', 'displayName', 'createdAt'])",
        uid: { ".validate": "newData.val() === $uid" },
        displayName: { ".validate": str(100) },
        email: { ".validate": str(320) },
        photoURL: { ".validate": optStr(2048) },
        // You can only point your profile at a pair you are actually in.
        pairId: {
          ".validate": `newData.isString() && ${uidInPair("newData.val()", "auth.uid")}`,
        },
        createdAt: { ".validate": num },
        lastSeen: { ".validate": num },
        preferences: {
          theme: { ".validate": oneOf(["light", "dark", "system"]) },
          motion: { ".validate": oneOf(["system", "reduced"]) },
          hemisphere: { ".validate": oneOf(["northern", "southern"]) },
          ambientAudio: { ".validate": bool },
          ambientVolume: { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 1" },
          $other: deny,
        },
        $other: deny,
      },
    },

    /* ---------------------------------------------------------------- */
    inviteCodes: {
      $code: {
        // Readable by code only (needed to join); the collection can't be listed.
        ".read": "auth != null",
        ".write": `auth != null && newData.exists() && (
          (!data.exists() && newData.child('ownerUid').val() === auth.uid && newData.child('pairId').isString() && root.child('pairs').child(newData.child('pairId').val()).child('partnerA').val() === auth.uid && newData.child('used').val() === false && ${notFuture("newData.child('createdAt')")})
          || (data.exists() && root.child('pairs').child(data.child('pairId').val()).child('partnerB').val() === auth.uid && newData.child('used').val() === true && newData.child('ownerUid').val() === data.child('ownerUid').val() && newData.child('pairId').val() === data.child('pairId').val() && newData.child('createdAt').val() === data.child('createdAt').val())
        )`.replace(/\s+/g, " "),
        ".validate": "newData.hasChildren(['inviteCode', 'ownerUid', 'pairId', 'used', 'createdAt']) && $code.matches(/^[A-HJ-NP-Z2-9]{6}$/)",
        inviteCode: { ".validate": "newData.val() === $code" },
        ownerUid: { ".validate": str(128) },
        pairId: { ".validate": str(128) },
        used: { ".validate": bool },
        createdAt: { ".validate": num },
        $other: deny,
      },
    },

    /* ---------------------------------------------------------------- */
    pairs: {
      $pairId: {
        // Members always; anyone signed in may read a pair still waiting for
        // its second person (the join flow needs it, and its id is only
        // reachable through a valid invite code).
        ".read": "auth != null && (data.child('partnerA').val() === auth.uid || data.child('partnerB').val() === auth.uid || !data.child('partnerB').exists())",
        ".write": `auth != null && newData.exists() && (
          (!data.exists() && newData.child('partnerA').val() === auth.uid && !newData.child('partnerB').exists())
          || (data.exists() && (data.child('partnerA').val() === auth.uid || data.child('partnerB').val() === auth.uid) && newData.child('partnerA').val() === data.child('partnerA').val() && newData.child('partnerB').val() === data.child('partnerB').val())
          || (data.exists() && !data.child('partnerB').exists() && data.child('partnerA').val() !== auth.uid && newData.child('partnerB').val() === auth.uid && newData.child('partnerA').val() === data.child('partnerA').val() && newData.child('inviteCode').val() === data.child('inviteCode').val() && root.child('inviteCodes').child(data.child('inviteCode').val()).child('used').val() === false && root.child('inviteCodes').child(data.child('inviteCode').val()).child('pairId').val() === $pairId && root.child('inviteCodes').child(data.child('inviteCode').val()).child('createdAt').val() > now - ${INVITE_TTL_MS})
        )`.replace(/\s+/g, " "),
        ".validate": "newData.hasChildren(['id', 'inviteCode', 'partnerA', 'status', 'worldId', 'createdAt']) && (!data.exists() || newData.child('createdAt').val() === data.child('createdAt').val())",
        id: { ".validate": "newData.val() === $pairId" },
        worldId: { ".validate": "newData.val() === $pairId" },
        inviteCode: { ".validate": "newData.isString() && newData.val().matches(/^[A-HJ-NP-Z2-9]{6}$/)" },
        partnerA: { ".validate": str(128) },
        partnerB: { ".validate": str(128) },
        status: { ".validate": oneOf(["pending", "active"]) },
        createdAt: { ".validate": num },
        $other: deny,
      },
    },

    /* ---------------------------------------------------------------- */
    worlds: {
      $worldId: {
        ".read": member("$worldId"),
        ".write": `${member("$worldId")} && newData.exists()`,
        ".validate": "newData.hasChildren(['worldId', 'pairId', 'createdAt', 'totalEnergy', 'totalRituals', 'activeDays', 'sharedDays'])",
        worldId: { ".validate": "newData.val() === $worldId" },
        pairId: { ".validate": "newData.val() === $worldId" },
        createdAt: { ".validate": num },
        updatedAt: { ".validate": num },
        totalEnergy: { ".validate": nonNeg },
        totalRituals: { ".validate": nonNeg },
        activeDays: { ".validate": nonNeg },
        sharedDays: { ".validate": nonNeg },
        lastActiveDate: { ".validate": dateStr },
        contributions: {
          $uid: {
            ".validate": `${uidInPair("$worldId", "$uid")} && newData.hasChildren(['uid', 'energy', 'rituals', 'activeDays'])`,
            uid: { ".validate": "newData.val() === $uid" },
            energy: { ".validate": nonNeg },
            rituals: { ".validate": nonNeg },
            activeDays: { ".validate": nonNeg },
            lastActiveDate: { ".validate": dateStr },
            $other: deny,
          },
        },
        $other: deny,
      },
    },

    worldHistory: {
      $worldId: {
        ".read": member("$worldId"),
        $date: {
          ".write": member("$worldId"),
          ".validate": `$date.matches(${DATE})`,
          date: { ".validate": "newData.val() === $date" },
          energy: { ".validate": nonNeg },
          rituals: { ".validate": nonNeg },
          byPartner: { $uid: { ".validate": `${nonNeg} && ${uidInPair("$worldId", "$uid")}` } },
          ritualIds: { $index: { ".validate": str(64) } },
          $other: deny,
        },
      },
    },

    /* ---------------------------------------------------------------- */
    rituals: {
      $worldId: {
        ".read": member("$worldId"),
        $date: {
          $uid: {
            ".write": `${member("$worldId")} && auth.uid === $uid`,
            $ritualId: {
              ".validate": "newData.hasChildren(['ritualId', 'uid', 'date', 'honouredAt', 'energy'])",
              ritualId: { ".validate": "newData.val() === $ritualId" },
              uid: { ".validate": "newData.val() === $uid" },
              date: { ".validate": "newData.val() === $date" },
              honouredAt: { ".validate": num },
              energy: { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 100" },
              note: { ".validate": optStr(500) },
              $other: deny,
            },
          },
        },
      },
    },

    ritualPlans: {
      $worldId: {
        ".read": member("$worldId"),
        $uid: {
          ".write": `${member("$worldId")} && auth.uid === $uid`,
          uid: { ".validate": "newData.val() === $uid" },
          ritualIds: { $index: { ".validate": str(64) } },
          updatedAt: { ".validate": num },
          $other: deny,
        },
      },
    },

    /* ---------------------------------------------------------------- */
    notes: {
      $worldId: {
        ".read": member("$worldId"),
        $date: {
          $uid: {
            // Only the author writes their note…
            ".write": `${member("$worldId")} && auth.uid === $uid`,
            ".validate": "newData.hasChildren(['id', 'authorUid', 'body', 'vessel', 'createdAt'])",
            id: { ".validate": str(128) },
            worldId: { ".validate": "newData.val() === $worldId" },
            authorUid: { ".validate": "newData.val() === $uid" },
            date: { ".validate": "newData.val() === $date" },
            body: { ".validate": str(280) },
            vessel: { ".validate": oneOf(["letter", "gift", "lantern", "feather", "stone"]) },
            createdAt: { ".validate": num },
            // …except that the recipient marks it opened, once.
            openedAt: {
              ".write": `${member("$worldId")} && auth.uid !== $uid && !data.exists() && newData.isNumber()`,
              ".validate": num,
            },
            $other: deny,
          },
        },
      },
    },

    journal: {
      $worldId: {
        ".read": member("$worldId"),
        $entryId: {
          // Write a new page as yourself; edit or remove only your own.
          ".write": `${member("$worldId")} && (data.exists() ? data.child('authorUid').val() === auth.uid : newData.child('authorUid').val() === auth.uid)`,
          ".validate": "newData.hasChildren(['id', 'authorUid', 'date', 'body', 'createdAt']) && newData.child('authorUid').val() === auth.uid",
          id: { ".validate": "newData.val() === $entryId" },
          worldId: { ".validate": "newData.val() === $worldId" },
          authorUid: { ".validate": str(128) },
          date: { ".validate": dateStr },
          title: { ".validate": optStr(120) },
          body: { ".validate": str(20000) },
          mood: { ".validate": oneOf(["bright", "warm", "steady", "tender", "heavy"]) },
          createdAt: { ".validate": num },
          updatedAt: { ".validate": num },
          $other: deny,
        },
      },
    },

    memories: {
      $worldId: {
        ".read": member("$worldId"),
        $memoryId: {
          ".write": `${member("$worldId")} && (data.exists() ? data.child('authorUid').val() === auth.uid : newData.child('authorUid').val() === auth.uid)`,
          ".validate": "newData.hasChildren(['id', 'authorUid', 'title', 'date', 'kind', 'createdAt']) && newData.child('authorUid').val() === auth.uid",
          id: { ".validate": "newData.val() === $memoryId" },
          worldId: { ".validate": "newData.val() === $worldId" },
          authorUid: { ".validate": str(128) },
          title: { ".validate": str(120) },
          story: { ".validate": optStr(5000) },
          date: { ".validate": dateStr },
          kind: { ".validate": str(32) },
          image: {
            // Only a real, size-capped image may be stored.
            data: { ".validate": "newData.isString() && newData.val().beginsWith('data:image/') && newData.val().length <= 1500000" },
            width: { ".validate": "newData.isNumber() && newData.val() > 0 && newData.val() <= 4000" },
            height: { ".validate": "newData.isNumber() && newData.val() > 0 && newData.val() <= 4000" },
            bytes: { ".validate": nonNeg },
            $other: deny,
          },
          createdAt: { ".validate": num },
          updatedAt: { ".validate": num },
          $other: deny,
        },
      },
    },

    /* ---------------------------------------------------------------- */
    plans: {
      $worldId: {
        ".read": member("$worldId"),
        $periodKey: {
          ".write": member("$worldId"),
          intentions: {
            $intentionId: {
              // A new intention can only be added in your own name.
              ".validate": "newData.hasChildren(['id', 'text', 'authorUid', 'createdAt']) && (data.exists() ? newData.child('authorUid').val() === data.child('authorUid').val() : newData.child('authorUid').val() === auth.uid)",
              text: { ".validate": str(160) },
            },
          },
        },
      },
    },

    timeline: {
      $worldId: {
        ".read": member("$worldId"),
        $eventId: {
          // Append-only: events are never edited or deleted.
          ".write": `${member("$worldId")} && !data.exists() && newData.exists()`,
          ".validate": "newData.hasChildren(['id', 'type', 'title', 'date', 'createdAt']) && (!newData.child('uid').exists() || newData.child('uid').val() === auth.uid)",
          id: { ".validate": "newData.val() === $eventId" },
          worldId: { ".validate": "newData.val() === $worldId" },
          type: { ".validate": str(40) },
          uid: { ".validate": str(128) },
          title: { ".validate": str(200) },
          detail: { ".validate": optStr(500) },
          date: { ".validate": dateStr },
          createdAt: { ".validate": num },
          $other: deny,
        },
      },
    },

    moods: {
      $worldId: {
        ".read": member("$worldId"),
        $date: {
          ".validate": `$date.matches(${DATE})`,
          $uid: {
            ".write": `${member("$worldId")} && auth.uid === $uid`,
            ".validate": "newData.hasChildren(['mood', 'at'])",
            mood: { ".validate": oneOf(["happy", "loved", "calm", "tender", "sleepy", "low"]) },
            at: { ".validate": num },
            $other: deny,
          },
        },
      },
    },

    /* ---------------------------------------------------------------- */
    measures: {
      $worldId: {
        ".read": member("$worldId"),
        $date: {
          ".validate": `$date.matches(${DATE})`,
          $uid: {
            ".write": `${member("$worldId")} && auth.uid === $uid`,
            water: { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 30" },
            steps: { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 100000" },
            wakeAt: { ".validate": num },
            wakeTime: { ".validate": `newData.isString() && newData.val().matches(${CLOCK})` },
            sleepAt: { ".validate": num },
            sleepTime: { ".validate": `newData.isString() && newData.val().matches(${CLOCK})` },
            focusMinutes: { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 1440" },
            focusSessions: { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 100" },
            $other: deny,
          },
        },
      },
    },

    goals: {
      $worldId: {
        ".read": member("$worldId"),
        $uid: {
          ".write": `${member("$worldId")} && auth.uid === $uid`,
          ".validate": "newData.hasChildren(['water', 'steps', 'wakeTime', 'sleepTime', 'focusMinutes', 'sessionMinutes'])",
          water: { ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 20" },
          steps: { ".validate": "newData.isNumber() && newData.val() >= 500 && newData.val() <= 50000" },
          wakeTime: { ".validate": `newData.isString() && newData.val().matches(${CLOCK})` },
          sleepTime: { ".validate": `newData.isString() && newData.val().matches(${CLOCK})` },
          focusMinutes: { ".validate": "newData.isNumber() && newData.val() >= 5 && newData.val() <= 600" },
          sessionMinutes: { ".validate": "newData.isNumber() && newData.val() >= 5 && newData.val() <= 180" },
          alarms: { ".validate": bool },
          $other: deny,
        },
      },
    },

    focus: {
      $worldId: {
        ".read": member("$worldId"),
        $uid: {
          ".write": `${member("$worldId")} && auth.uid === $uid`,
          // A session can't end before it starts or more than four hours out.
          ".validate": "newData.hasChildren(['startedAt', 'endsAt', 'minutes']) && newData.child('endsAt').val() > newData.child('startedAt').val() && newData.child('endsAt').val() <= now + 14400000",
          startedAt: { ".validate": num },
          endsAt: { ".validate": num },
          minutes: { ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 240" },
          together: { ".validate": bool },
          $other: deny,
        },
      },
    },

    gardens: {
      $worldId: {
        ".read": member("$worldId"),
        ".write": member("$worldId"),
        weather: { ".validate": oneOf(["clear", "sunshine", "rainbow", "starry", "aurora"]) },
        plots: {
          $plotId: {
            ".validate": `$plotId.matches(/^[0-8]$/) && newData.hasChildren(['seedId', 'plantedOn', 'plantedBy']) && (data.exists() || newData.child('plantedBy').val() === auth.uid)`,
            seedId: {
              ".validate": oneOf([
                "sunflower", "daisy", "tulip", "lavender", "rose-bush", "blueberry-bush",
                "cherry-tree", "apple-tree", "orange-tree", "mango-tree",
                "pine-tree", "maple-tree", "willow-tree", "peach-tree", "lemon-tree", "moon-tree",
              ]),
            },
            plantedOn: { ".validate": dateStr },
            plantedBy: { ".validate": str(128) },
            $other: deny,
          },
        },
        $other: deny,
      },
    },
  },
};

writeFileSync(new URL("../database.rules.json", import.meta.url), `${JSON.stringify(rules, null, 2)}\n`);
console.log("Wrote database.rules.json");
