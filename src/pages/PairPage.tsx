import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy } from "lucide-react";

import { ROUTES } from "../app/constants";
import type { JoinPairOutcome } from "../services/pair";
import { createPair, getPair, joinPair } from "../services/pair";
import { useAuth } from "../hooks/useAuth";
import { useSky } from "../hooks/useWorld";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextField } from "../components/ui/Field";
import { Spinner } from "../components/ui/Icon";
import { SkyBackdrop } from "../components/world/SkyBackdrop";
import { INVITE_CODE_LENGTH, normaliseInviteCode, validateInviteCode } from "../utils/validators";
import { firstNameOf } from "../utils/helpers";

/**
 * Pairing.
 *
 * The one moment in Same Sky that is genuinely one-way: a Sky Link joins two
 * people to a single world, permanently. The screen is deliberately unhurried
 * about it, and every failure it can produce is explained specifically rather
 * than as a generic refusal.
 */

/**
 * Written for the person reading them, not for the developer. "That is your
 * own link" and "that link has already been used" are entirely different
 * situations, and answering both with "invalid code" helps nobody.
 */
const JOIN_MESSAGES: Record<Exclude<JoinPairOutcome["status"], "joined">, string> = {
  "unknown-code": "No world is waiting behind that Sky Link. Check the letters and try again.",
  "already-used": "Someone has already joined with that Sky Link. Ask your person for a new one.",
  "own-code": "That is your own Sky Link — send it to your person instead.",
  "already-paired": "You already belong to a world. Sign out first if you need to start again.",
};

export default function PairPage() {
  const navigate = useNavigate();
  const { user, profile, isPaired } = useAuth();
  const sky = useSky();

  const [inviteCode, setInviteCode] = useState("");
  const [skyLink, setSkyLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const firstName = profile ? firstNameOf(profile.displayName) : "there";

  /*
    Someone who created a link and closed the tab must find the same link when
    they return, not a second one. The world already exists; this recovers the
    code that opens it.
  */
  useEffect(() => {
    let cancelled = false;

    async function restore(): Promise<void> {
      if (!profile?.pairId) {
        if (!cancelled) setIsRestoring(false);
        return;
      }

      const pair = await getPair(profile.pairId);

      if (cancelled) return;

      // A completed pair goes straight through; a pending one shows its link.
      if (pair && !pair.partnerB) {
        setSkyLink(pair.inviteCode);
      }

      setIsRestoring(false);
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, [profile?.pairId]);

  /*
    The listener on the profile means this fires the instant a partner accepts
    the invitation — the person waiting sees the world open rather than
    refreshing a page hoping something changed.
  */
  useEffect(() => {
    if (!isPaired || !profile?.pairId) return;

    let cancelled = false;

    void getPair(profile.pairId).then((pair) => {
      if (!cancelled && pair?.partnerB) {
        navigate(ROUTES.world, { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isPaired, profile?.pairId, navigate]);

  async function handleCreate(): Promise<void> {
    if (!user) return;

    setIsCreating(true);
    setError(null);

    try {
      const pair = await createPair({ ownerUid: user.uid });

      setSkyLink(pair.inviteCode);
    } catch (cause) {
      console.error(cause);
      setError("Your Sky Link could not be created. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoin(): Promise<void> {
    if (!user) return;

    const validation = validateInviteCode(inviteCode);

    if (!validation.isValid) {
      setCodeError(validation.message);
      return;
    }

    setIsJoining(true);
    setCodeError(null);
    setError(null);

    try {
      const outcome = await joinPair({ inviteCode, joiningUid: user.uid });

      if (outcome.status === "joined") {
        navigate(ROUTES.world, { replace: true });
        return;
      }

      setCodeError(JOIN_MESSAGES[outcome.status]);
    } catch (cause) {
      console.error(cause);
      setError("Something interrupted the connection. Please try again.");
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCopy(): Promise<void> {
    if (!skyLink) return;

    try {
      await navigator.clipboard.writeText(skyLink);

      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard access can be refused. The code is on screen to be read.
      setError("Your browser would not let us copy. The link is above — read it out.");
    }
  }

  return (
    <div className="relative isolate min-h-svh">
      <SkyBackdrop sky={sky} className="absolute inset-0 -z-10 h-[42svh]" />

      <div className="ss-container flex min-h-svh flex-col justify-center py-16">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-10 text-center motion-safe:animate-(--animate-fade-in)">
            <p className="text-sm tracking-[0.18em] text-white/70 uppercase">
              {sky.label}
            </p>

            <h1 className="mt-4 font-display text-4xl text-white sm:text-5xl">
              Hello, {firstName}
            </h1>
          </div>

          {isRestoring ? (
            <Card padding="lg" className="grid place-items-center py-20">
              <Spinner label="Looking for your world" />
            </Card>
          ) : skyLink ? (
            <SkyLinkPanel
              code={skyLink}
              copied={copied}
              onCopy={() => void handleCopy()}
            />
          ) : (
            <Card padding="lg" className="motion-safe:animate-(--animate-rise)">
              <h2 className="text-2xl text-ink">Find your person</h2>

              <p className="mt-3 leading-relaxed text-ink-soft">
                A world in Same Sky belongs to exactly two people. Send a Sky
                Link, or use the one you were sent.
              </p>

              <div className="mt-10">
                <Button
                  block
                  size="lg"
                  loading={isCreating}
                  loadingLabel="Creating your world…"
                  onClick={() => void handleCreate()}
                >
                  Create a Sky Link
                </Button>

                <p className="mt-3 text-sm text-ink-faint">
                  Your world begins the moment you do — you can start tending it
                  while you wait for them.
                </p>
              </div>

              <div className="my-9 flex items-center gap-4">
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs tracking-widest text-ink-faint uppercase">
                  or
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleJoin();
                }}
              >
                <TextField
                  label="Sky Link"
                  hint="Six characters, sent to you by your person."
                  error={codeError}
                  value={inviteCode}
                  maxLength={INVITE_CODE_LENGTH}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="ABC234"
                  inputClassName="text-center text-2xl uppercase tracking-[0.4em]"
                  onChange={(event) => {
                    setInviteCode(normaliseInviteCode(event.target.value));
                    setCodeError(null);
                  }}
                />

                <Button
                  type="submit"
                  block
                  variant="quiet"
                  size="lg"
                  className="mt-5"
                  loading={isJoining}
                  loadingLabel="Connecting…"
                >
                  Join their world
                </Button>
              </form>
            </Card>
          )}

          {error ? (
            <p role="alert" className="mt-6 text-center text-sm text-ember">
              {error}
            </p>
          ) : null}

          <div className="mt-10 text-center">
            <Link
              to={ROUTES.settings}
              className="text-sm text-ink-faint underline-offset-4 hover:text-ink hover:underline"
            >
              Account settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SkyLinkPanelProps {
  code: string;
  copied: boolean;
  onCopy: () => void;
}

/**
 * The waiting state.
 *
 * Framed as an open door rather than an empty room: the world already exists
 * and can already be tended, which makes the wait a beginning instead of a
 * blocked screen.
 */
function SkyLinkPanel({ code, copied, onCopy }: SkyLinkPanelProps) {
  return (
    <Card padding="lg" className="motion-safe:animate-(--animate-rise)">
      <h2 className="text-2xl text-ink">Your Sky Link</h2>

      <p className="mt-3 leading-relaxed text-ink-soft">
        Give these six characters to your person. The moment they use them, your
        world opens for both of you — wherever either of you happens to be.
      </p>

      <div className="mt-9 rounded-2xl bg-surface-sunken px-6 py-10 text-center">
        <p
          className="font-display text-4xl tracking-[0.35em] text-ink sm:text-5xl"
          /* Read out character by character rather than as a made-up word. */
          aria-label={code.split("").join(" ")}
        >
          {code}
        </p>
      </div>

      <Button
        block
        variant="quiet"
        className="mt-5"
        icon={
          copied ? (
            <Check aria-hidden className="size-4" strokeWidth={1.8} />
          ) : (
            <Copy aria-hidden className="size-4" strokeWidth={1.6} />
          )
        }
        onClick={onCopy}
      >
        {copied ? "Copied" : "Copy Sky Link"}
      </Button>

      <div className="mt-9 border-t border-line pt-7">
        <p className="text-[0.95rem] leading-relaxed text-ink-soft">
          You do not have to wait. Your world already exists, and anything you
          tend to now will be there when they arrive.
        </p>

        <Link
          to={ROUTES.world}
          className="mt-4 inline-block text-[0.95rem] text-accent underline-offset-4 hover:underline"
        >
          Go to your world
        </Link>
      </div>
    </Card>
  );
}
