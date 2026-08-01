import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../services/auth";
import { useAuthStore } from "../store/authStore";

export default function SettingsPage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      await logout();

      navigate("/auth/login", {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      alert("Unable to sign out.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "60px auto",
        padding: 32,
      }}
    >
      <h1>Settings</h1>

      <div
        style={{
          marginTop: 24,
          marginBottom: 32,
        }}
      >
        <p>
          <strong>Name</strong>
        </p>

        <p>{user?.displayName ?? "Unknown User"}</p>

        <br />

        <p>
          <strong>Email</strong>
        </p>

        <p>{user?.email}</p>
      </div>

      <button
        onClick={handleLogout}
        disabled={loading}
        style={{
          background: "#dc2626",
          color: "#fff",
          border: "none",
          padding: "12px 22px",
          borderRadius: 10,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Signing Out..." : "Logout"}
      </button>
    </div>
  );
}