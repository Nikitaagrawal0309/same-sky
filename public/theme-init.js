/* Runs before first paint (loaded synchronously from index.html). Kept as a
   file, not inline, so the security policy can forbid inline scripts. */
/*
        Resolve the theme before first paint so returning to Same Sky is never
        preceded by a flash of the wrong environment. Mirrors the logic in
        src/services/preferences.ts — keep the storage key in sync.
      */
      (function () {
        try {
          var stored = localStorage.getItem("same-sky:theme");
          var theme =
            stored === "light" || stored === "dark"
              ? stored
              : window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
          document.documentElement.dataset.theme = theme;
        } catch (_) {
          /* Private browsing or blocked storage — the light default stands. */
        }
      })();
