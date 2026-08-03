import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createPair, joinPair } from "../services/pair";
import { useAuthStore } from "../store/authStore";

export default function PairPage() {
  const navigate = useNavigate();

  const {
    user,
    isPaired,
  } = useAuthStore();

  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (isPaired) {
      navigate("/world", {
        replace: true,
      });
    }
  }, [isPaired, navigate]);

  async function handleCreate() {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const pair = await createPair({
        ownerUid: user.uid,
      });

      setGeneratedCode(pair.inviteCode);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to create your Sky Link."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const success = await joinPair({
        inviteCode: inviteCode
          .trim()
          .toUpperCase(),
        joiningUid: user.uid,
      });

      if (!success) {
        setError(
          "Invalid or expired Sky Link."
        );
        return;
      }

      navigate("/world", {
        replace: true,
      });
    } catch (err) {
      console.error(err);

      setError(
        "Unable to join your person."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!generatedCode) return;

    await navigator.clipboard.writeText(
      generatedCode
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">

      <div className="w-full max-w-xl rounded-3xl border bg-white p-10 shadow-sm">

        <h1 className="text-4xl font-bold">
          Welcome to Same Sky 🌌
        </h1>

        <p className="mt-4 text-slate-600">
          Every shared journey begins with one connection.
        </p>

        {generatedCode ? (
          <div className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50 p-8">

            <h2 className="text-2xl font-semibold">
              Your Sky Link ✨
            </h2>

            <p className="mt-3 text-slate-600">
              Share this code with your person.
              Once they join, both of you will automatically
              enter your shared world.
            </p>

            <div className="mt-8 text-center">

              <div className="text-5xl font-bold tracking-[0.45em]">
                {generatedCode}
              </div>

              <button
                onClick={handleCopy}
                className="mt-8 rounded-xl border px-6 py-3 hover:bg-white"
              >
                Copy Sky Link
              </button>

            </div>

          </div>
        ) : (
          <div className="mt-10 space-y-8">

            <section className="rounded-2xl border p-6">

              <h2 className="text-xl font-semibold">
                Invite Your Person ❤️
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Create a permanent connection.
              </p>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700"
              >
                {loading
                  ? "Creating..."
                  : "Create Sky Link"}
              </button>

            </section>

            <section className="rounded-2xl border p-6">

              <h2 className="text-xl font-semibold">
                Join Your Person ❤️
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Enter the Sky Link shared with you.
              </p>

              <input
                value={inviteCode}
                onChange={(e) =>
                  setInviteCode(
                    e.target.value.toUpperCase()
                  )
                }
                maxLength={6}
                placeholder="ABC123"
                className="mt-6 w-full rounded-xl border p-4 text-center text-2xl uppercase tracking-[0.35em]"
              />

              <button
                onClick={handleJoin}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700"
              >
                {loading
                  ? "Joining..."
                  : "Connect"}
              </button>

            </section>

          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <div className="mt-10">
          <Link
            to="/"
            className="text-sm text-indigo-600"
          >
            ← Back
          </Link>
        </div>

      </div>

    </div>
  );
}