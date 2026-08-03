import { useState } from "react";

interface RitualCardProps {
  emoji: string;
  title: string;
  description: string;
  onComplete: () => Promise<void>;
}

export default function RitualCard({
  emoji,
  title,
  description,
  onComplete,
}: RitualCardProps) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (completed || loading) return;

    try {
      setLoading(true);

      await onComplete();

      setCompleted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={completed || loading}
      className={`w-full rounded-2xl border p-5 text-left transition ${
        completed
          ? "border-emerald-600 bg-emerald-900/20"
          : "border-slate-800 bg-slate-900 hover:border-indigo-500 hover:bg-slate-800"
      }`}
    >
      <div className="flex items-center justify-between">

        <div className="flex gap-4">

          <div className="text-4xl">
            {emoji}
          </div>

          <div>

            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {description}
            </p>

          </div>

        </div>

        <div className="text-2xl">
          {loading
            ? "⏳"
            : completed
            ? "✨"
            : "○"}
        </div>

      </div>
    </button>
  );
}