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

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Login failed");
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
          background: "white",
          padding: 40,
          borderRadius: 18,
          boxShadow: "0 15px 40px rgba(0,0,0,.08)",
        }}
      >
        <h1>Welcome Back 👋</h1>

        <p style={{ margin: "12px 0 30px", color: "#6b7280" }}>
          Continue with Google
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            border: 0,
            borderRadius: 10,
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          {loading ? "Signing In..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}