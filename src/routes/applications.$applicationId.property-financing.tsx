import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/applications/$applicationId/property-financing",
)({
  component: () => <Outlet />,
});