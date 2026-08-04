import { useState } from "react";
import { BookOpen, Pencil } from "lucide-react";

import type { JournalEntry, JournalMood } from "../types/journal";
import { JOURNAL_MOODS } from "../types/journal";
import { JOURNAL_TITLE_MAX_LENGTH } from "../utils/validators";
import { useProfile, useUid } from "../hooks/useAuth";
import { useJournal } from "../hooks/useJournal";
import { playChime } from "../services/audio";
import { usePartner } from "../hooks/useWorld";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Card, EmptyState, SectionHeading } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { TextAreaField, TextField } from "../components/ui/Field";
import { formatRelativeDay, todayKey } from "../utils/date";
import { cx } from "../utils/helpers";

/**
 * The shared journal.
 *
 * Both of you can read everything here. Only the person who wrote an entry
 * can change it — there is no notion of one partner correcting the other's
 * account of a day.
 */
export default function JournalPage() {
  const profile = useProfile();
  const partner = usePartner();
  const uid = useUid();
  const { entries, create, update } = useJournal();

  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  function nameFor(authorUid: string): string {
    if (authorUid === profile?.uid) return "You";
    if (authorUid === partner?.uid) return partner.displayName;
    return "Your person";
  }

  function photoFor(authorUid: string): string | null | undefined {
    if (authorUid === profile?.uid) return profile.photoURL;
    if (authorUid === partner?.uid) return partner.photoURL;
    return null;
  }

  return (
    <div className="ss-container max-w-2xl py-12">
      <SectionHeading
        level={1}
        title="Journal"
        description="Your own words, in your own space. Both of you can read every page."
        action={<Button onClick={() => setComposerOpen(true)}>Write</Button>}
      />

      <div className="mt-10">
        {entries.length === 0 ? (
          <EmptyState
            icon={<BookOpen aria-hidden className="size-8" strokeWidth={1.3} />}
            title="Nothing written yet"
            description="Put a day into words, however the day actually went."
            action={<Button onClick={() => setComposerOpen(true)}>Write the first page</Button>}
          />
        ) : (
          <ul className="space-y-5">
            {entries.map((entry) => {
              const mood = JOURNAL_MOODS.find((candidate) => candidate.id === entry.mood);

              return (
                <li key={entry.id}>
                  <Card padding="md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={nameFor(entry.authorUid)} photoURL={photoFor(entry.authorUid)} size="sm" />

                        <div>
                          <p className="text-sm text-ink">{nameFor(entry.authorUid)}</p>
                          <p className="text-xs text-ink-faint">{formatRelativeDay(entry.date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {mood ? (
                          <span className="text-xs text-ink-faint">{mood.label}</span>
                        ) : null}

                        {entry.authorUid === uid ? (
                          <button
                            type="button"
                            aria-label="Edit this entry"
                            onClick={() => setEditing(entry)}
                            className="rounded-full p-1.5 text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
                          >
                            <Pencil aria-hidden className="size-4" strokeWidth={1.6} />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {entry.title ? (
                      <h3 className="mt-4 text-lg text-ink">{entry.title}</h3>
                    ) : null}

                    <p className="mt-2 leading-relaxed whitespace-pre-wrap text-ink-soft">
                      {entry.body}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <JournalComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmit={create}
      />

      {editing ? (
        <JournalComposer
          open
          entry={editing}
          onClose={() => setEditing(null)}
          onSubmit={(draft) => update(editing.id, draft)}
        />
      ) : null}
    </div>
  );
}

interface JournalComposerProps {
  open: boolean;
  entry?: JournalEntry;
  onClose: () => void;
  onSubmit: (draft: { title: string | null; body: string; mood: JournalMood | null }) => Promise<void>;
}

function JournalComposer({ open, entry, onClose, onSubmit }: JournalComposerProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [mood, setMood] = useState<JournalMood | null>(entry?.mood ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(): Promise<void> {
    if (body.trim().length === 0) {
      setError("There's nothing written yet.");
      return;
    }

    setIsSaving(true);

    try {
      await onSubmit({ title: title.trim() || null, body, mood });

      if (!entry) {
        playChime("journal-saved");
      }

      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That entry could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={entry ? "Edit this page" : "A new page"}
      description={entry ? undefined : formatRelativeDay(todayKey())}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={isSaving} loadingLabel="Saving…" onClick={() => void handleSubmit()}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <TextField
          label="Title"
          hint="Optional"
          value={title}
          maxLength={JOURNAL_TITLE_MAX_LENGTH}
          onChange={(event) => setTitle(event.target.value)}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-ink-soft">How today felt</p>

          <div className="flex flex-wrap gap-2">
            {JOURNAL_MOODS.map((option) => (
              <button
                key={option.id}
                type="button"
                title={option.description}
                aria-pressed={mood === option.id}
                onClick={() => setMood(mood === option.id ? null : option.id)}
                className={cx(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ease-(--ease-calm)",
                  mood === option.id
                    ? "border-accent/40 bg-accent-soft text-accent-strong"
                    : "border-line text-ink-soft hover:border-line-strong",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <TextAreaField
          label="Entry"
          hideLabel
          placeholder="Put the day into words, however it went."
          value={body}
          error={error}
          onChange={(event) => {
            setBody(event.target.value);
            setError(null);
          }}
          className="[&_textarea]:min-h-48"
        />
      </div>
    </Dialog>
  );
}
