import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f1f5f9",
      }}
    >
      <Outlet />
    </main>
  );
}