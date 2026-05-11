import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/internal/borrower-dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/portal" });
  },
  component: () => null,
});