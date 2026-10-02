/**
 * Input validation.
 *
 * Two rules govern everything here.
 *
 * First, messages are written to be read by a person, not a developer. Nothing
 * a person types into Same Sky should ever be answered with the word
 * "invalid", and nothing should imply they did something wrong.
 *
 * Second, validation returns a result rather than throwing. Callers decide how
 * to present a problem; validators never decide for them.
 */

import { NOTE_MAX_LENGTH } from "../types/note";
import { normaliseText } from "./helpers";

export interface ValidationResult {
  isValid: boolean;

  /** A message safe to show directly, or `null` when the value is fine. */
  message: string | null;
}

const VALID: ValidationResult = { isValid: true, message: null };

function invalid(message: string): ValidationResult {
  return { isValid: false, message };
}

/* -------------------------------------------------------------------------
   Pairing
   ------------------------------------------------------------------------- */

/**
 * Invite codes deliberately exclude the characters that people misread when
 * copying a code by hand: I, O, 0 and 1.
 */
export const INVITE_CODE_LENGTH = 6;

/**
 * How long a Sky Link stays valid. Kept short so an old or overheard code
 * can't be used to slip into a world later. Must match the 172800000 ms
 * check in `database.rules.json`, which is what actually enforces it.
 */
export const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

export const INVITE_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

/**
 * Prepare a typed code for comparison: uppercase, and stripped of the spaces
 * and dashes people naturally add when reading a code aloud.
 */
export function normaliseInviteCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function validateInviteCode(value: string): ValidationResult {
  const code = normaliseInviteCode(value);

  if (code.length === 0) {
    return invalid("Enter the Sky Link your person shared with you.");
  }

  if (code.length < INVITE_CODE_LENGTH) {
    return invalid(`A Sky Link is ${INVITE_CODE_LENGTH} characters long.`);
  }

  if (!INVITE_CODE_PATTERN.test(code)) {
    return invalid("That doesn't look like a Sky Link. Check it and try again.");
  }

  return VALID;
}

/* -------------------------------------------------------------------------
   Written content
   ------------------------------------------------------------------------- */

export function validateNote(value: string): ValidationResult {
  const body = normaliseText(value);

  if (body.length === 0) {
    return invalid("Write a line for your person before you send it.");
  }

  if (body.length > NOTE_MAX_LENGTH) {
    return invalid(
      `Notes are kept to ${NOTE_MAX_LENGTH} characters — say it in one breath.`,
    );
  }

  return VALID;
}

export const JOURNAL_TITLE_MAX_LENGTH = 120;

export function validateJournalEntry(
  body: string,
  title: string | null,
): ValidationResult {
  if (normaliseText(body).length === 0) {
    return invalid("There's nothing written yet.");
  }

  if (title !== null && title.length > JOURNAL_TITLE_MAX_LENGTH) {
    return invalid(`Titles are kept under ${JOURNAL_TITLE_MAX_LENGTH} characters.`);
  }

  return VALID;
}

export const MEMORY_TITLE_MAX_LENGTH = 120;

export function validateMemory(title: string): ValidationResult {
  const trimmed = normaliseText(title);

  if (trimmed.length === 0) {
    return invalid("Give this moment a name so you can find it again.");
  }

  if (trimmed.length > MEMORY_TITLE_MAX_LENGTH) {
    return invalid(`Keep the name under ${MEMORY_TITLE_MAX_LENGTH} characters.`);
  }

  return VALID;
}

export const INTENTION_MAX_LENGTH = 160;

export function validateIntention(value: string): ValidationResult {
  const text = normaliseText(value);

  if (text.length === 0) {
    return invalid("Name something you'd like to tend to.");
  }

  if (text.length > INTENTION_MAX_LENGTH) {
    return invalid(`Keep an intention under ${INTENTION_MAX_LENGTH} characters.`);
  }

  return VALID;
}

/* -------------------------------------------------------------------------
   Images
   ------------------------------------------------------------------------- */

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/**
 * The limit applies to the file a person chooses, before Same Sky downscales
 * it. It exists only to reject something that clearly is not a photograph.
 */
export const MAX_IMAGE_UPLOAD_BYTES = 25 * 1024 * 1024;

export function validateImageFile(file: File): ValidationResult {
  const isAccepted = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);

  if (!isAccepted) {
    return invalid("Choose a photo — JPEG, PNG or WebP.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return invalid("That photo is very large. Try one under 25 MB.");
  }

  return VALID;
}
