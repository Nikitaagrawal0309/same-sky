import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { signInWithGoogle } from "../services/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    try {
      setLoading(true);

      await signInWithGoogle();

      // Authentication complete.
      // Pair Detection will later decide whether to
      // continue to Pair or Shared World.
      navigate("/pair", {
        replace: true,
      });
    } catch (err) {
      console.error(err);

      alert("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          width: 420,
          background: "#ffffff",
          padding: 40,
          borderRadius: 18,
          boxShadow: "0 15px 40px rgba(0,0,0,.08)",
        }}
      >
        <h1>Welcome Back 👋</h1>

        <p
          style={{
            marginTop: 12,
            marginBottom: 30,
            color: "#64748b",
          }}
        >
          Continue your journey together.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "12px",
            background: "#4f46e5",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}