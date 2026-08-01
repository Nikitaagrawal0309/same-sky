import { Link } from "react-router-dom";

export default function HomePage() {
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
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
          🌌 Same Sky
        </h1>

        <p
          style={{
            color: "#6b7280",
            marginBottom: "2rem",
          }}
        >
          No matter where life takes you,
          you're always under the same sky.
        </p>

        <Link to="/auth/login">
          <button
            style={{
              padding: "14px 28px",
              border: "none",
              borderRadius: "12px",
              background: "#2563eb",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Continue
          </button>
        </Link>
      </div>
    </div>
  );
}