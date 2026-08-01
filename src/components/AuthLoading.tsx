export default function AuthLoading() {
  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#F8FAF8",
      }}
    >
      <div
        style={{
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            marginBottom: "1rem",
            color: "#2F4F4F",
          }}
        >
          Same Sky
        </h2>

        <p
          style={{
            color: "#666",
          }}
        >
          Preparing your shared world...
        </p>
      </div>
    </div>
  );
}