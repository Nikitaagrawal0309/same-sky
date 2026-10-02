import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "./app/router";
import AppBootstrap from "./components/AppBootstrap";

/*
  Fonts are bundled with the app rather than loaded from Google Fonts, so
  opening Same Sky doesn't tell a third party, and the site's security
  policy can refuse every outside style sheet.
*/
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/500.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/fredoka/400.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/700.css";
import "@fontsource/gaegu/400.css";
import "@fontsource/gaegu/700.css";
import "@fontsource/indie-flower/400.css";
import "@fontsource/patrick-hand/400.css";
import "@fontsource/shadows-into-light/400.css";

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
