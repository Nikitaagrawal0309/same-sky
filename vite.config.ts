import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

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
