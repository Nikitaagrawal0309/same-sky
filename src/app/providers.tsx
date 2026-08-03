import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function Providers({
  children,
}: Props) {
  return <>{children}</>;
}