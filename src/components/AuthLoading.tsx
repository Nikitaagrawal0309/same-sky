import { motion } from "framer-motion";

import { APP_NAME } from "../app/constants";

/**
 * The moment before a screen appears.
 *
 * Shown while a session is replayed or a page's code arrives. Usually on
 * screen for a single frame. It shares the opening intro's meadow green so
 * stepping between the two never feels like a jump.
 */
export default function AuthLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-svh place-items-center px-6"
      style={{ background: "radial-gradient(120% 90% at 30% 20%, #3fd13f 0%, #13a51f 45%, #087515 80%)" }}
    >
      <div className="text-center text-white">
        <motion.svg
          viewBox="-20 -24 40 40"
          className="mx-auto size-14 drop-shadow-lg"
          animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <path d="M0,10 C0,2 0,-4 0,-8" stroke="#e4ff6b" strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <path d="M0,-6 C-10,-18 -20,-12 -16,-4 C-10,0 -4,-1 0,-6 Z" fill="#c6f04a" />
          <path d="M0,-8 C10,-22 20,-14 16,-6 C10,-2 4,-3 0,-8 Z" fill="#e4ff6b" />
        </motion.svg>

        <p className="mt-3 font-display text-3xl font-bold tracking-tight drop-shadow">{APP_NAME}</p>
        <p className="ss-hand mt-1 text-xl text-lime-100">Opening your world…</p>
      </div>
    </div>
  );
}
