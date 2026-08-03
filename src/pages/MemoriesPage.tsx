import { useRef, useState } from "react";
import { ImagePlus, Images } from "lucide-react";

import type { Memory, MemoryImage, MemoryKind } from "../types/memory";
import { MEMORY_KINDS } from "../types/memory";
import { useMemories } from "../hooks/useMemories";
import { prepareMemoryImage } from "../services/storage";
import { validateImageFile, validateMemory } from "../utils/validators";
import { Button } from "../components/ui/Button";
import { Card, EmptyState, SectionHeading } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { TextAreaField, TextField } from "../components/ui/Field";
import { formatRelativeDay, todayKey } from "../utils/date";
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

  return (
    <div className="ss-container max-w-3xl py-12">
      <SectionHeading
        level={1}
        title="Memories"
        description="The moments the two of you chose to keep."
        action={<Button onClick={() => setComposerOpen(true)}>Save a memory</Button>}
      />

      <div className="mt-10">
        {memories.length === 0 ? (
          <EmptyState
            icon={<Images aria-hidden className="size-8" strokeWidth={1.3} />}
            title="Nothing saved yet"
            description="A photo, a moment, a first — anything worth finding again."
            action={<Button onClick={() => setComposerOpen(true)}>Save your first memory</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {memories.map((memory) => (
              <MemoryTile key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </div>

      <MemoryComposer open={composerOpen} onClose={() => setComposerOpen(false)} onSave={save} />
    </div>
  );
}

function MemoryTile({ memory }: { memory: Memory }) {
  const kind = MEMORY_KINDS.find((candidate) => candidate.id === memory.kind);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="aspect-square bg-surface-sunken">
        {memory.image ? (
          <img
            src={memory.image.data}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
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
      await onSave({ title, story: story.trim() || null, date: todayKey(), kind, image });
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
          className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line-strong bg-surface-sunken"
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
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ease-(--ease-calm)",
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
