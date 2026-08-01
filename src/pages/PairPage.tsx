import { Link } from "react-router-dom";

export default function PairPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border p-8 shadow-sm">
        <h1 className="text-3xl font-bold">
          Welcome to Same Sky 🌱
        </h1>

        <p className="mt-4 text-gray-600">
          Same Sky is shared between two people who choose to grow
          together.
        </p>

        <div className="mt-10 grid gap-4">
          <button className="rounded-xl border p-4 text-left hover:bg-gray-50">
            Create an Invite Code
          </button>

          <button className="rounded-xl border p-4 text-left hover:bg-gray-50">
            Join with an Invite Code
          </button>
        </div>

        <div className="mt-10">
          <Link to="/" className="text-sm text-blue-600">
            ← Back
          </Link>
        </div>
      </div>
    </div>
  );
}