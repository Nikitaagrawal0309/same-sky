import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Images } from "lucide-react";

import type { Memory, MemoryImage, MemoryKind } from "../types/memory";
import { MEMORY_KINDS } from "../types/memory";
import { useMemories } from "../hooks/useMemories";
import { playChime } from "../services/audio";
import { prepareMemoryImage } from "../services/storage";
import { usePrefersStillness } from "../hooks/useTheme";
import { validateImageFile, validateMemory } from "../utils/validators";
import { Button } from "../components/ui/Button";
import { Card, EmptyState } from "../components/ui/Card";
import { PhotoCollage } from "../components/memories/PhotoCollage";
import { Dialog } from "../components/ui/Dialog";
import { TextAreaField, TextField } from "../components/ui/Field";
import { formatFullDate, formatRelativeDay, todayKey } from "../utils/date";
import { cx } from "../utils/helpers";

/**
 * Memories.
 *
 * Meant to be kept, not curated — there is no filter, no sort by "most liked"
 * and no limit on how ordinary a moment can be to belong here.
 */
export default function MemoriesPage() {
  const { memories, save } = useMemories();
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewing, setViewing] = useState<Memory | null>(null);

  return (
    <div className="relative isolate min-h-[calc(100svh-4rem)]">
      <PhotoCollage className="-z-10" />

      <div className="ss-container max-w-3xl py-12 motion-safe:animate-(--animate-fade-in)">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ss-hand text-2xl text-pink-500">pinned to our wall</p>
            <h1 className="ss-gradient-text font-display text-5xl font-bold sm:text-6xl">
              Memories
            </h1>
            <p className="mt-2 text-[0.95rem] text-ink-soft">
              The moments the two of you chose to keep.
            </p>
          </div>
          <Button size="lg" onClick={() => setComposerOpen(true)}>
            <ImagePlus aria-hidden className="size-4" />
            Save a memory
          </Button>
        </header>

        <div className="mt-10">
          {memories.length === 0 ? (
            <div className="rounded-[2rem] border-2 border-white/80 bg-white/75 shadow-lifted backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
              <EmptyState
                icon={<Images aria-hidden className="size-10 text-pink-400" strokeWidth={1.3} />}
                title="Your wall is waiting for photos"
                description="A photo, a moment, a first — anything worth finding again. Every one you save is pinned here."
                action={
                  <Button onClick={() => setComposerOpen(true)}>Save your first memory</Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {memories.map((memory) => (
                <MemoryTile key={memory.id} memory={memory} onOpen={() => setViewing(memory)} />
              ))}
            </div>
          )}
        </div>

        <MemoryComposer open={composerOpen} onClose={() => setComposerOpen(false)} onSave={save} />

        <MemoryDetail memory={viewing} onClose={() => setViewing(null)} />
      </div>
    </div>
  );
}

function MemoryTile({ memory, onOpen }: { memory: Memory; onOpen: () => void }) {
  const kind = MEMORY_KINDS.find((candidate) => candidate.id === memory.kind);
  const prefersStillness = usePrefersStillness();

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={prefersStillness ? undefined : { y: -3 }}
      whileTap={prefersStillness ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
      className="text-left"
    >
      <Card
        padding="none"
        className="overflow-hidden shadow-soft transition-shadow duration-300 hover:shadow-lifted"
      >
        <div className="aspect-square bg-surface-sunken">
          {memory.image ? (
            <img src={memory.image.data} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-ink-faint">
              <Images aria-hidden className="size-8" strokeWidth={1.2} />
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="truncate text-sm text-ink">{memory.title}</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            {kind?.label} · {formatRelativeDay(memory.date)}
          </p>
        </div>
      </Card>
    </motion.button>
  );
}

/**
 * A memory, in full.
 *
 * The one thing the grid tile can never show: the story behind it, if there
 * is one. Without this, a story typed in while saving a memory would have
 * nowhere to ever be read again.
 */
function MemoryDetail({ memory, onClose }: { memory: Memory | null; onClose: () => void }) {
  const kind = memory ? MEMORY_KINDS.find((candidate) => candidate.id === memory.kind) : undefined;

  return (
    <Dialog
      open={memory !== null}
      onClose={onClose}
      title={memory?.title ?? ""}
      description={memory ? `${kind?.label} · ${formatFullDate(memory.date)}` : undefined}
      size="lg"
    >
      {memory ? (
        <div className="space-y-5">
          {memory.image ? (
            <img
              src={memory.image.data}
              alt=""
              className="max-h-[60svh] w-full rounded-2xl object-cover"
            />
          ) : null}

          {memory.story ? (
            <p className="leading-relaxed whitespace-pre-wrap text-ink-soft">{memory.story}</p>
          ) : (
            <p className="text-sm text-ink-faint">
              No story was written for this one — just the moment itself.
            </p>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}

interface MemoryComposerProps {
  open: boolean;
  onClose: () => void;
  onSave: (draft: {
    title: string;
    story: string | null;
    date: string;
    kind: MemoryKind;
    image: MemoryImage | null;
  }) => Promise<void>;
}

function MemoryComposer({ open, onClose, onSave }: MemoryComposerProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [kind, setKind] = useState<MemoryKind>("moment");
  const [image, setImage] = useState<MemoryImage | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function reset(): void {
    setTitle("");
    setStory("");
    setKind("moment");
    setImage(null);
    setError(null);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);

    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setIsPreparingImage(true);
    setError(null);

    try {
      setImage(await prepareMemoryImage(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That photo could not be used.");
    } finally {
      setIsPreparingImage(false);
    }
  }

  async function handleSave(): Promise<void> {
    const validation = validateMemory(title);

    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        title,
        story: story.trim() || null,
        date: todayKey(),
        kind,
        image,
      });
      playChime("memory-saved");
      reset();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That memory could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Save a memory"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={isSaving}
            loadingLabel="Saving…"
            disabled={isPreparingImage}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => void handleFileChange(event)}
        />

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label={image ? "Change photo" : undefined}
          className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line-strong bg-surface-sunken transition-colors hover:border-accent/50"
        >
          {image ? (
            <img src={image.data} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-ink-faint">
              <ImagePlus aria-hidden className="size-6" strokeWidth={1.4} />
              <span className="text-sm">
                {isPreparingImage ? "Preparing…" : "Add a photo (optional)"}
              </span>
            </span>
          )}
        </button>

        <TextField
          label="Title"
          value={title}
          placeholder="Give this moment a name"
          error={error}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
        />

        <div className="flex flex-wrap gap-2">
          {MEMORY_KINDS.map((option) => (
            <button
              key={option.id}
              type="button"
              title={option.description}
              aria-pressed={kind === option.id}
              onClick={() => setKind(option.id)}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-sm transition-[color,background-color,border-color,transform] duration-200 ease-(--ease-calm) active:scale-95",
                kind === option.id
                  ? "border-accent/40 bg-accent-soft text-accent-strong"
                  : "border-line text-ink-soft hover:border-line-strong",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <TextAreaField
          label="The story behind it"
          hint="Optional"
          value={story}
          onChange={(event) => setStory(event.target.value)}
        />
      </div>
    </Dialog>
  );
}
