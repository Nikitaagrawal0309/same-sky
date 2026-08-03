import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { ROUTES } from "../app/constants";
import type { Hemisphere, ThemePreference } from "../types/user";
import { useAuthActions, useProfile } from "../hooks/useAuth";
import { useAppearanceControls } from "../hooks/useTheme";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Card, SectionHeading } from "../components/ui/Card";
import { Toggle } from "../components/ui/Field";
import { cx } from "../utils/helpers";

/**
 * Settings.
 *
 * Every choice here takes effect the moment it is made and needs no separate
 * save — a preference screen that must be submitted is a preference screen
 * people stop trusting.
 */

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const HEMISPHERE_OPTIONS: Array<{ value: Hemisphere; label: string }> = [
  { value: "northern", label: "Northern" },
  { value: "southern", label: "Southern" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const { signOut } = useAuthActions();
  const { preferences, update } = useAppearanceControls();

  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true);

    try {
      await signOut();
      navigate(ROUTES.login, { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="ss-container max-w-2xl py-12">
      <SectionHeading level={1} title="Settings" />

      <div className="mt-10 space-y-8">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <Avatar
              name={profile?.displayName ?? "You"}
              photoURL={profile?.photoURL}
              size="lg"
            />

            <div className="min-w-0">
              <p className="truncate text-lg text-ink">{profile?.displayName ?? "You"}</p>
              <p className="truncate text-sm text-ink-faint">{profile?.email}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <h2 className="text-lg text-ink">Appearance</h2>

          <div className="mt-5">
            <p className="text-sm font-medium text-ink-soft">Theme</p>

            <div className="mt-3 flex gap-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => void update({ theme: option.value })}
                  aria-pressed={preferences.theme === option.value}
                  className={cx(
                    "flex-1 rounded-xl border px-4 py-2.5 text-sm transition-colors duration-200 ease-(--ease-calm)",
                    preferences.theme === option.value
                      ? "border-accent/40 bg-accent-soft text-accent-strong"
                      : "border-line text-ink-soft hover:border-line-strong",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <Toggle
              label="Reduce motion"
              description="Keep the world still, regardless of what your device prefers."
              checked={preferences.motion === "reduced"}
              onChange={(checked) => void update({ motion: checked ? "reduced" : "system" })}
            />
          </div>

          <div className="mt-2 border-t border-line pt-5">
            <p className="text-sm font-medium text-ink-soft">Your hemisphere</p>
            <p className="mt-1 text-sm text-ink-faint">
              Determines which seasons your shared world moves through.
            </p>

            <div className="mt-3 flex gap-2">
              {HEMISPHERE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => void update({ hemisphere: option.value })}
                  aria-pressed={preferences.hemisphere === option.value}
                  className={cx(
                    "flex-1 rounded-xl border px-4 py-2.5 text-sm transition-colors duration-200 ease-(--ease-calm)",
                    preferences.hemisphere === option.value
                      ? "border-accent/40 bg-accent-soft text-accent-strong"
                      : "border-line text-ink-soft hover:border-line-strong",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card padding="md">
          <h2 className="text-lg text-ink">Sound</h2>

          <div className="mt-5">
            <Toggle
              label="Ambient sound"
              description="Quiet, natural sound from the world — birdsong, wind, rain."
              checked={preferences.ambientAudio}
              onChange={(checked) => void update({ ambientAudio: checked })}
            />
          </div>

          {preferences.ambientAudio ? (
            <div className="mt-5 border-t border-line pt-5">
              <label htmlFor="ambient-volume" className="text-sm font-medium text-ink-soft">
                Volume
              </label>

              <input
                id="ambient-volume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={preferences.ambientVolume}
                onChange={(event) => void update({ ambientVolume: Number(event.target.value) })}
                className="mt-3 w-full accent-[var(--ss-accent)]"
              />
            </div>
          ) : null}
        </Card>

        <Card padding="md">
          <Button
            variant="danger"
            block
            loading={isSigningOut}
            loadingLabel="Signing out…"
            icon={<LogOut aria-hidden className="size-4" strokeWidth={1.6} />}
            onClick={() => void handleSignOut()}
          >
            Sign out
          </Button>
        </Card>
      </div>
    </div>
  );
}
