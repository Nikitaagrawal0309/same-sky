import { useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Feather, Pencil } from "lucide-react";

import type { JournalEntry, JournalMood } from "../types/journal";
import { JOURNAL_MOODS } from "../types/journal";
import { DAILY_MOODS, type DailyMood } from "../types/garden";
import { JOURNAL_TITLE_MAX_LENGTH } from "../utils/validators";
import { useProfile, useUid } from "../hooks/useAuth";
import { useJournal } from "../hooks/useJournal";
import { useMoods } from "../hooks/useGarden";
import { usePrefersStillness } from "../hooks/useTheme";
import { playChime } from "../services/audio";
import { usePartner } from "../hooks/useWorld";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { NaturePanel } from "../components/ui/NaturePanel";
import { MOOD_TEMPLATES, templateFor, type MoodTemplate } from "../components/journal/moodTemplates";
import { addDaysToKey, formatRelativeDay, formatWeekdayShort, todayKey } from "../utils/date";
import { cx, firstNameOf } from "../utils/helpers";

/**
 * The co-journal.
 *
 * One diary, written in two hands. Each of you checks in with a mood every
 * day, and every page is dressed for how its day felt: its own paper, ink,
 * handwriting and stickers. Both of you can read everything; only the person
 * who wrote a page can change it.
 */
export default function JournalPage() {
  const profile = useProfile();
  const partner = usePartner();
  const uid = useUid();
  const { entries, create, update } = useJournal();
  const moods = useMoods();

  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const partnerName = partner ? firstNameOf(partner.displayName) : null;
  const suggestedMood = DAILY_MOODS.find((mood) => mood.id === moods.mineToday)?.journalMood ?? null;

  function nameFor(authorUid: string): string {
    if (authorUid === profile?.uid) return "You";
    if (authorUid === partner?.uid) return firstNameOf(partner.displayName);
    return "Your person";
  }

  function photoFor(authorUid: string): string | null | undefined {
    if (authorUid === profile?.uid) return profile.photoURL;
    if (authorUid === partner?.uid) return partner.photoURL;
    return null;
  }

  return (
    <div className="ss-container max-w-3xl space-y-6 py-8 sm:space-y-8 sm:py-12 motion-safe:animate-(--animate-fade-in)">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ss-hand text-2xl text-pink-500">one diary, two hands</p>
          <h1 className="font-display text-5xl font-bold sm:text-6xl">
            <span className="ss-gradient-text">Co-journal</span>{" "}
            <motion.span
              aria-hidden
              className="inline-block"
              animate={{ rotate: [0, -12, 10, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
            >
              ✍️
            </motion.span>
          </h1>
          <p className="mt-2 text-[0.95rem] text-ink-soft">
            Your own words, side by side{partnerName ? ` with ${partnerName}'s` : ""}. Both of you can read every page.
          </p>
        </div>
        <Button size="lg" onClick={() => setComposerOpen(true)}>
          <Feather aria-hidden className="size-4" />
          Write a page
        </Button>
      </header>

      <MoodCheckIn moods={moods} partnerName={partnerName} />

      {entries.length === 0 ? (
        <NaturePanel theme="blossom" eyebrow="a fresh notebook" title="Nothing written yet">
          <p className="text-ink-soft">
            Put a day into words, however it actually went. Pick a mood and the page dresses itself to match.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {JOURNAL_MOODS.map((mood) => {
              const template = MOOD_TEMPLATES[mood.id];

              return (
                <span
                  key={mood.id}
                  className="rounded-full border-2 border-white px-3 py-1 text-sm shadow-sm"
                  style={{ background: template.paper, color: template.ink, fontFamily: template.titleFont }}
                >
                  {template.emoji} {template.name}
                </span>
              );
            })}
          </div>
          <Button className="mt-5" onClick={() => setComposerOpen(true)}>
            Write the first page
          </Button>
        </NaturePanel>
      ) : (
        <ul className="space-y-7">
          {entries.map((entry, index) => {
            const mine = entry.authorUid === uid;

            return (
              <motion.li
                key={entry.id}
                className={cx(mine ? "sm:ml-14" : "sm:mr-14")}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={cx("mb-2 flex items-center gap-2", mine && "flex-row-reverse")}>
                  <Avatar name={nameFor(entry.authorUid)} photoURL={photoFor(entry.authorUid)} size="sm" />
                  <span className="text-sm font-bold text-ink">{nameFor(entry.authorUid)}</span>
                  <span className="text-xs text-ink-faint">· {formatRelativeDay(entry.date)}</span>
                </div>

                <JournalPaper template={templateFor(entry.mood)} tilt={index % 2 === 0 ? -0.6 : 0.6}>
                  <div className="flex items-start justify-between gap-3">
                    {entry.title ? (
                      <h3 className="text-3xl leading-tight" style={{ fontFamily: templateFor(entry.mood).titleFont }}>
                        {entry.title}
                      </h3>
                    ) : (
                      <span />
                    )}

                    {mine ? (
                      <button
                        type="button"
                        aria-label="Edit this page"
                        onClick={() => setEditing(entry)}
                        className="shrink-0 rounded-full bg-white/60 p-2 transition-transform hover:scale-110 hover:bg-white active:scale-90"
                      >
                        <Pencil aria-hidden className="size-4" strokeWidth={1.8} />
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xl leading-[28px] whitespace-pre-wrap" style={{ fontFamily: templateFor(entry.mood).bodyFont }}>
                    {entry.body}
                  </p>

                  {entry.mood ? (
                    <p className="mt-3 text-sm font-bold" style={{ color: templateFor(entry.mood).accent }}>
                      {templateFor(entry.mood).emoji} {JOURNAL_MOODS.find((mood) => mood.id === entry.mood)?.label} day
                    </p>
                  ) : null}
                </JournalPaper>
              </motion.li>
            );
          })}
        </ul>
      )}

      {composerOpen ? (
        <JournalComposer
          open
          initialMood={suggestedMood}
          onClose={() => setComposerOpen(false)}
          onSubmit={create}
        />
      ) : null}

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

/* -------------------------------------------------------------------------
   Daily mood check-in
   ------------------------------------------------------------------------- */

function MoodCheckIn({ moods, partnerName }: { moods: ReturnType<typeof useMoods>; partnerName: string | null }) {
  const still = usePrefersStillness();
  const uid = useUid();
  const mine = DAILY_MOODS.find((mood) => mood.id === moods.mineToday);
  const theirs = DAILY_MOODS.find((mood) => mood.id === moods.partnerToday);

  const week = Array.from({ length: 7 }, (_, index) => addDaysToKey(todayKey(), index - 6));
  const emojiFor = (date: string, who: string | null) =>
    who ? DAILY_MOODS.find((mood) => mood.id === moods.byDate[date]?.[who]?.mood)?.emoji : undefined;

  return (
    <NaturePanel theme="sunset" eyebrow="check in with yourself" title="How are you feeling today?">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3" role="radiogroup" aria-label="Today's mood">
        {DAILY_MOODS.map((mood, index) => {
          const selected = moods.mineToday === mood.id;

          return (
            <motion.button
              key={mood.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => void moods.setMood(selected ? null : (mood.id as DailyMood))}
              initial={still ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, scale: selected ? 1.06 : 1 }}
              whileHover={still ? undefined : { y: -6, rotate: index % 2 ? 4 : -4 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 380, damping: 18, delay: still ? 0 : index * 0.04 }}
              className={cx(
                "flex flex-col items-center gap-1 rounded-3xl border-2 py-3 shadow-soft transition-colors",
                selected ? "border-white shadow-lifted" : "border-transparent bg-white/70 hover:bg-white dark:bg-white/5",
              )}
              style={selected ? { background: mood.tint } : undefined}
            >
              <motion.span
                className="text-4xl sm:text-5xl"
                animate={selected && !still ? { rotate: [0, -10, 10, -6, 0], scale: [1, 1.2, 1] } : undefined}
                transition={{ duration: 0.6 }}
              >
                {mood.emoji}
              </motion.span>
              <span className={cx("text-sm font-bold", selected ? "text-slate-800" : "text-ink-soft")}>{mood.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <AnimatePresence mode="wait">
          <motion.p
            key={mine?.id ?? "none"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-full bg-white/80 px-4 py-2 font-semibold text-ink shadow-soft dark:bg-white/10"
          >
            {mine ? `You're feeling ${mine.emoji} ${mine.label.toLowerCase()} today` : "Tap an emoji to check in"}
          </motion.p>
        </AnimatePresence>

        {partnerName ? (
          <p className="rounded-full bg-white/80 px-4 py-2 font-semibold text-ink shadow-soft dark:bg-white/10">
            {theirs
              ? `${partnerName} is feeling ${theirs.emoji} ${theirs.label.toLowerCase()}`
              : `${partnerName} hasn't checked in yet`}
          </p>
        ) : null}
      </div>

      {/* The last seven days of moods, for both of you */}
      <div className="mt-5 overflow-x-auto rounded-3xl bg-white/70 p-4 shadow-soft dark:bg-white/5">
        <table className="w-full min-w-[22rem] text-center">
          <caption className="sr-only">Moods over the last seven days</caption>
          <thead>
            <tr className="text-xs font-bold text-ink-faint">
              <th className="w-20 text-left font-bold">This week</th>
              {week.map((date) => (
                <th key={date} className={cx("font-bold", date === todayKey() && "text-orange-600 dark:text-orange-300")}>
                  {formatWeekdayShort(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-2xl">
            <tr>
              <th scope="row" className="text-left text-sm font-semibold text-ink-soft">You</th>
              {week.map((date) => (
                <td key={date} className="py-1">{emojiFor(date, uid) ?? <span className="text-base text-ink-faint">·</span>}</td>
              ))}
            </tr>
            {partnerName ? (
              <tr>
                <th scope="row" className="text-left text-sm font-semibold text-ink-soft">{partnerName}</th>
                {week.map((date) => (
                  <td key={date} className="py-1">{emojiFor(date, moods.partnerUid) ?? <span className="text-base text-ink-faint">·</span>}</td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {moods.local ? (
        <p className="mt-2 text-xs text-ink-soft">
          Moods are being kept on this device for now. They'll be shared between you once sharing is switched on.
        </p>
      ) : null}
    </NaturePanel>
  );
}

/* -------------------------------------------------------------------------
   A page of paper, dressed by its mood
   ------------------------------------------------------------------------- */

function JournalPaper({
  template,
  tilt = 0,
  children,
}: {
  template: MoodTemplate;
  tilt?: number;
  children: ReactNode;
}) {
  const style: CSSProperties = {
    background: `${template.pattern}, ${template.paper}`,
    color: template.ink,
    transform: `rotate(${tilt}deg)`,
  };

  return (
    <div className="relative rounded-[1.4rem] px-6 pt-8 pb-6 shadow-lifted transition-transform duration-300 hover:rotate-0 sm:px-8" style={style}>
      {/* Washi tape */}
      <span
        aria-hidden
        className="absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 -rotate-3 rounded-sm opacity-85 shadow-sm"
        style={{
          background: `repeating-linear-gradient(45deg, ${template.tape} 0 8px, color-mix(in srgb, ${template.tape} 70%, white) 8px 16px)`,
        }}
      />
      {/* Stickers */}
      <span aria-hidden className="absolute -top-3 right-1 rotate-12 text-3xl drop-shadow">{template.stickers[0]}</span>
      <span aria-hidden className="absolute -bottom-2 left-1 -rotate-12 text-2xl drop-shadow">{template.stickers[1]}</span>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Composer — you write straight onto the page
   ------------------------------------------------------------------------- */

interface JournalComposerProps {
  open: boolean;
  entry?: JournalEntry;
  initialMood?: JournalMood | null;
  onClose: () => void;
  onSubmit: (draft: { title: string | null; body: string; mood: JournalMood | null }) => Promise<void>;
}

function JournalComposer({ open, entry, initialMood = null, onClose, onSubmit }: JournalComposerProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [mood, setMood] = useState<JournalMood | null>(entry?.mood ?? initialMood);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const template = templateFor(mood);

  async function handleSubmit(): Promise<void> {
    if (body.trim().length === 0) {
      setError("There's nothing written yet.");
      return;
    }

    setIsSaving(true);

    try {
      await onSubmit({ title: title.trim() || null, body, mood });

      if (!entry) playChime("journal-saved");

      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That page could not be saved.");
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
            Keep this page
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink-soft">How today felt (it picks the page)</p>
          <div className="flex flex-wrap gap-2">
            {JOURNAL_MOODS.map((option) => {
              const optionTemplate = MOOD_TEMPLATES[option.id];
              const selected = mood === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  title={option.description}
                  aria-pressed={selected}
                  onClick={() => setMood(selected ? null : option.id)}
                  className={cx(
                    "rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-transform active:scale-95",
                    selected ? "scale-105 shadow-md" : "opacity-80 hover:opacity-100",
                  )}
                  style={{
                    background: optionTemplate.paper,
                    color: optionTemplate.ink,
                    borderColor: selected ? optionTemplate.accent : "transparent",
                  }}
                >
                  {optionTemplate.emoji} {option.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-faint">Page style: {template.name}</p>
        </div>

        <motion.div key={mood ?? "plain"} initial={{ rotate: -1.5, scale: 0.98 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
          <JournalPaper template={template}>
            <input
              aria-label="Title (optional)"
              placeholder="A title, if you like"
              value={title}
              maxLength={JOURNAL_TITLE_MAX_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full bg-transparent text-3xl outline-none placeholder:opacity-45"
              style={{ fontFamily: template.titleFont, color: template.ink }}
            />
            <textarea
              aria-label="Entry"
              placeholder="Put the day into words, however it went…"
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                setError(null);
              }}
              className="mt-1 min-h-56 w-full resize-none bg-transparent text-xl leading-[28px] outline-none placeholder:opacity-45"
              style={{ fontFamily: template.bodyFont, color: template.ink }}
            />
          </JournalPaper>
          {error ? <p className="mt-2 text-sm text-ember">{error}</p> : null}
        </motion.div>
      </div>
    </Dialog>
  );
}
