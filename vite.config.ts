import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/*
  The same security headers the live site sends (from firebase.json), applied
  to `npm run preview` so the production build can be tested locally under
  the real policy before it's deployed.
*/
const hostingHeaders: Record<string, string> = Object.fromEntries(
  (
    JSON.parse(readFileSync(new URL("./firebase.json", import.meta.url), "utf8")) as {
      hosting: { headers: { source: string; headers: { key: string; value: string }[] }[] };
    }
  ).hosting.headers
    .find((rule) => rule.source === "**")!
    .headers.filter((header) => header.key !== "Strict-Transport-Security")
    .map((header) => [header.key, header.value.replace("upgrade-insecure-requests", "").replace(/;\s*$/, "")]),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  preview: {
    headers: hostingHeaders,
  },

  build: {
    // Keep the initial payload small so the shared world appears quickly
    // even on slow connections. Vendor code changes rarely and caches well.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("firebase")) return "firebase";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("react-router") || id.includes("/react/") || id.includes("/react-dom/")) {
            return "react";
          }
        },
      },
    },
  },
});
