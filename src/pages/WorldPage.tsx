import { Link } from "react-router-dom";

import RitualCard from "../components/world/RitualCard";

import { completeRitual } from "../services/ritual";

export default function WorldPage() {
  async function complete(type: "water" | "walk" | "read") {
    /*
      Temporary IDs.

      Next batch automatically loads these
      from the authenticated user + pair.
    */

    await completeRitual({
      worldId: "demo-world",
      userId: "demo-user",
      ritualType: type,
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="mx-auto max-w-6xl px-6 py-10">

        <header className="mb-12">

          <h1 className="text-5xl font-bold">
            🌌 Same Sky
          </h1>

          <p className="mt-4 text-xl text-slate-400">
            Welcome home.
          </p>

        </header>

        <div className="grid gap-6 lg:grid-cols-2">

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <div className="text-5xl">🌱</div>

            <h2 className="mt-5 text-2xl font-semibold">
              Shared Garden
            </h2>

            <p className="mt-3 text-slate-400">
              Your garden will respond to every
              completed ritual.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <div className="text-5xl">🌳</div>

            <h2 className="mt-5 text-2xl font-semibold">
              Shared Tree
            </h2>

            <p className="mt-3 text-slate-400">
              Quiet, steady growth over time.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <div className="text-5xl">💧</div>

            <h2 className="mt-5 text-2xl font-semibold">
              Shared Pond
            </h2>

            <p className="mt-3 text-slate-400">
              Every ritual creates another ripple.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <div className="text-5xl">💌</div>

            <h2 className="mt-5 text-2xl font-semibold">
              Encourage Your Person
            </h2>

            <button className="mt-8 rounded-xl bg-indigo-600 px-6 py-3 hover:bg-indigo-700">
              Write a Note
            </button>
          </section>

        </div>

        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">

          <h2 className="text-3xl font-semibold">
            Today's Rituals
          </h2>

          <div className="mt-8 space-y-5">

            <RitualCard
              emoji="💧"
              title="Drink Water"
              description="Hydration keeps both body and mind healthy."
              onComplete={() =>
                complete("water")
              }
            />

            <RitualCard
              emoji="🚶"
              title="Walk"
              description="A few minutes outside refreshes the mind."
              onComplete={() =>
                complete("walk")
              }
            />

            <RitualCard
              emoji="📖"
              title="Read"
              description="Learning a little every day builds a lifetime."
              onComplete={() =>
                complete("read")
              }
            />

          </div>

        </section>

        <footer className="mt-10 flex justify-between text-sm text-slate-500">

          <Link
            to="/pair"
            className="hover:text-white"
          >
            Pairing
          </Link>

          <Link
            to="/settings"
            className="hover:text-white"
          >
            Settings
          </Link>

        </footer>

      </div>

    </div>
  );
}