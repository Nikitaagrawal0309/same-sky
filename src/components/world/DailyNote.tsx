import { useState } from "react";
import { Feather, Flame, Gem, Gift, Mail, MailOpen, type LucideIcon } from "lucide-react";

import type { NoteVessel } from "../../types/note";
import { NOTE_MAX_LENGTH } from "../../types/note";
import { useTodayNotes } from "../../hooks/useNotes";
import { validateNote } from "../../utils/validators";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { TextAreaField } from "../ui/Field";
import { cx } from "../../utils/helpers";

/**
 * One note, waiting.
 *
 * The daily note is deliberately the smallest feature in the product: one
 * message, once a day, found rather than delivered. There is no thread to
 * scroll and no unread count anywhere else in the interface — the only trace
 * of it is this one quiet card.
 */

const VESSELS: ReadonlyArray<{ id: NoteVessel; icon: LucideIcon; label: string }> = [
  { id: "letter", icon: Mail, label: "A letter" },
  { id: "gift", icon: Gift, label: "A gift" },
  { id: "lantern", icon: Flame, label: "A lantern" },
  { id: "feather", icon: Feather, label: "A feather" },
  { id: "stone", icon: Gem, label: "A stone" },
];

export function DailyNoteCard() {
  const { mine, fromPartner, send, open } = useTodayNotes();

  const [composerOpen, setComposerOpen] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);

  const waiting = fromPartner && fromPartner.openedAt === null;

  async function handleReveal(): Promise<void> {
    setRevealOpen(true);
    await open();
  }

  return (
    <>
      <Card
        padding="md"
        className={cx(waiting && "border border-ember/30 bg-ember-soft")}
      >
        {fromPartner ? (
          <button
            type="button"
            onClick={() => void handleReveal()}
            className="flex w-full items-center gap-4 text-left"
          >
            {waiting ? (
              <VesselGlyph vessel={fromPartner.vessel} />
            ) : (
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink-faint">
                <MailOpen aria-hidden className="size-5" strokeWidth={1.5} />
              </span>
            )}

            <span className="min-w-0 flex-1">
              <span className="block text-[0.95rem] text-ink">
                {waiting ? "A note is waiting for you" : "You've read today's note"}
              </span>
              <span className="block text-sm text-ink-faint">
                {waiting ? "Tap to open it" : "Left for you today"}
              </span>
            </span>
          </button>
        ) : (
          <p className="text-[0.95rem] leading-relaxed text-ink-soft">
            Nothing waiting from your person yet today.
          </p>
        )}

        <div className="mt-5 border-t border-line pt-4">
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
      </Card>

      {fromPartner ? (
        <Dialog
          open={revealOpen}
          onClose={() => setRevealOpen(false)}
          title="A note, for you"
        >
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

function VesselGlyph({ vessel }: { vessel: NoteVessel }) {
  const entry = VESSELS.find((candidate) => candidate.id === vessel) ?? VESSELS[0];
  const Icon = entry.icon;

  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink">
      <Icon aria-hidden className="size-5" strokeWidth={1.5} />
    </span>
  );
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
