import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      <Outlet />
    </main>
  );
}