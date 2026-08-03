import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: React.ReactNode;
}

export default function AuthGate({ children }: Props) {
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const pairId = useAuthStore((state) => state.pairId);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontSize: 22,
          fontWeight: 600,
        }}
      >
        Preparing Your Sky...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!pairId) {
    return <Navigate to="/pair" replace />;
  }

  return <>{children}</>;
}