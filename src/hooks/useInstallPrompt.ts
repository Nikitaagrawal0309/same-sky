import { useEffect, useState } from "react";

/**
 * Installing Same Sky to the home screen.
 *
 * Chrome, Edge and Android offer a real install prompt, which they announce
 * with `beforeinstallprompt`; we hold on to it until the person asks. Safari
 * on iPhone has no prompt at all — there it's Share → Add to Home Screen —
 * so we detect that case and show instructions instead.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "installed" | "available" | "ios" | "unsupported";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support gives it away.
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function useInstallPrompt(): { state: InstallState; install: () => Promise<void> } {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const state: InstallState = installed
    ? "installed"
    : promptEvent
      ? "available"
      : isIos()
        ? "ios"
        : "unsupported";

  return {
    state,
    install: async () => {
      if (!promptEvent) return;

      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;

      if (outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
    },
  };
}
