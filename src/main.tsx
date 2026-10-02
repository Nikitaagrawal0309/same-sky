import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "./app/router";
import AppBootstrap from "./components/AppBootstrap";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppBootstrap>
      <RouterProvider router={router} />
    </AppBootstrap>
  </React.StrictMode>
);

/*
  Installable app: register the service worker in production builds only, so
  local development never serves stale files from a cache.
*/
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.warn("[Same Sky] Service worker registration failed:", error);
    });
  });
}
