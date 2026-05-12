import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/portal/applications/$applicationId/property-financing",
)({
  component: () => <Outlet />,
});