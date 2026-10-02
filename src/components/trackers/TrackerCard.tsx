import type { ReactNode } from "react";

import { cx } from "../../utils/helpers";

/** The shared frame every daily tracker sits in. */
export function TrackerCard({
  emoji,
  title,
  tint,
  status,
  partner,
  children,
}: {
  emoji: string;
  title: string;
  tint: string;
  status?: string | null;
  partner?: string | null;
  children: ReactNode;
}) {
  return (
    <section className={cx("flex flex-col rounded-3xl border-2 border-white/80 bg-linear-to-br p-4 shadow-soft dark:border-white/10", tint)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <span aria-hidden className="text-2xl">{emoji}</span>
          {title}
        </h3>
        {status ? <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-ink-soft dark:bg-white/10">{status}</span> : null}
      </div>

      <div className="mt-3 flex-1">{children}</div>

      {partner ? <p className="mt-3 border-t border-white/70 pt-2 text-xs font-semibold text-ink-soft dark:border-white/10">💞 {partner}</p> : null}
    </section>
  );
}
