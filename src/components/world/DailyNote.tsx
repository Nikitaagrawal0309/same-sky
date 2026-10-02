import { useState } from "react";

import type { DailyNote, NoteVessel } from "../../types/note";
import { NOTE_MAX_LENGTH } from "../../types/note";
import type { TodayNotes } from "../../hooks/useNotes";
import { playChime } from "../../services/audio";
import { validateNote } from "../../utils/validators";
import { Button } from "../ui/Button";
import { NaturePanel } from "../ui/NaturePanel";
import { Dialog } from "../ui/Dialog";
import { TextAreaField } from "../ui/Field";
import { cx } from "../../utils/helpers";
import { VESSELS } from "./vessels";

/**
 * One note, waiting.
 *
 * The daily note is deliberately the smallest feature in the product: one
 * message, once a day, found rather than delivered. There is no thread to
 * scroll and no unread count anywhere else in the interface.
 *
 * A waiting note's *presence* lives inside `WorldScene` itself now, not this
 * card — see the note glyph there. This card still owns composing a note (the
 * one interaction with no natural home in the scene) and the reveal dialog's
 * content, but data-fetching and the reveal trigger live one level up in
 * `WorldPage`, so there is exactly one subscription to today's notes, not two.
 */

export interface DailyNoteCardProps {
  mine: DailyNote | null;
  fromPartner: DailyNote | null;
  send: TodayNotes["send"];
  revealOpen: boolean;
  onCloseReveal: () => void;
}

export function DailyNoteCard({
  mine,
  fromPartner,
  send,
  revealOpen,
  onCloseReveal,
}: DailyNoteCardProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const waiting = fromPartner && fromPartner.openedAt === null;

  return (
    <>
      <NaturePanel theme="blossom" eyebrow="a little love letter" title="Today's note">
        <p className="text-[0.95rem] leading-relaxed text-ink-soft">
          {fromPartner
            ? waiting
              ? "A note is waiting for you, somewhere in your world."
              : "You've read today's note."
            : "Nothing waiting from your person yet today."}
        </p>

        <div className="mt-5 border-t border-pink-200/70 pt-4 dark:border-pink-900/60">
          {mine ? (
            <p className="text-sm text-ink-faint">
              You left {vesselArticle(mine.vessel)} for them today.
            </p>
          ) : (
            <Button variant="quiet" size="sm" onClick={() => setComposerOpen(true)}>
              Leave a note
            </Button>
          )}
        </div>
      </NaturePanel>

      {fromPartner ? (
        <Dialog open={revealOpen} onClose={onCloseReveal} title="A note, for you">
          <p className="text-lg leading-relaxed whitespace-pre-wrap text-ink">
            {fromPartner.body}
          </p>
        </Dialog>
      ) : null}

      <NoteComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSend={send}
      />
    </>
  );
}

function vesselArticle(vessel: NoteVessel): string {
  const entry = VESSELS.find((candidate) => candidate.id === vessel);

  // Each label already reads as "a letter", "a gift" and so on.
  return entry?.label.toLowerCase() ?? "a note";
}

interface NoteComposerProps {
  open: boolean;
  onClose: () => void;
  onSend: (body: string, vessel: NoteVessel) => Promise<void>;
}

function NoteComposer({ open, onClose, onSend }: NoteComposerProps) {
  const [body, setBody] = useState("");
  const [vessel, setVessel] = useState<NoteVessel>("letter");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleSend(): Promise<void> {
    const validation = validateNote(body);

    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setIsSending(true);

    try {
      await onSend(body, vessel);
      playChime("note-sent");
      setBody("");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That note could not be sent.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Leave a note"
      description="One note reaches them today. Say the thing you'd actually say."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={isSending} loadingLabel="Sending…" onClick={() => void handleSend()}>
            Send
          </Button>
        </>
      }
    >
      <div className="flex gap-2">
        {VESSELS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={vessel === id}
            onClick={() => setVessel(id)}
            className={cx(
              "grid size-10 place-items-center rounded-full border transition-colors duration-200",
              vessel === id
                ? "border-accent/40 bg-accent-soft text-accent-strong"
                : "border-line text-ink-faint hover:border-line-strong",
            )}
          >
            <Icon aria-hidden className="size-4" strokeWidth={1.6} />
          </button>
        ))}
      </div>

      <TextAreaField
        label="Your note"
        hideLabel
        className="mt-5"
        value={body}
        maxLength={NOTE_MAX_LENGTH}
        placeholder="Whatever today is asking you to say…"
        error={error}
        onChange={(event) => {
          setBody(event.target.value);
          setError(null);
        }}
      />
    </Dialog>
  );
}
