import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/ui";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "approvU — Mortgage & Home Portal" },
      {
        name: "description",
        content:
          "Track applications, upload documents, review mortgage offers, and access Home Life benefits.",
      },
    ],
  }),
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <PortalShell>
      <Outlet />
    </PortalShell>
  );
}
