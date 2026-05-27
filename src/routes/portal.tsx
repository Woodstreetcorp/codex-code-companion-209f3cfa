import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal/ui";
import { getBorrowerSession, storeBorrowerSession } from "@/lib/api/borrowerAuthApi";

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
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = useMemo(
    () => normalizePortalRedirect(location.pathname),
    [location.pathname],
  );
  const [authorized, setAuthorized] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkBorrowerSession() {
      setCheckingSession(true);
      try {
        const session = await getBorrowerSession();
        if (!active) return;
        storeBorrowerSession(session);
        setAuthorized(true);
      } catch {
        if (!active) return;
        setAuthorized(false);
        await navigate({ to: "/login", search: { redirect: requestedPath } });
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    void checkBorrowerSession();

    return () => {
      active = false;
    };
  }, [navigate, requestedPath]);

  if (checkingSession || !authorized) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <section className="mx-auto flex min-h-[360px] max-w-xl flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Checking your borrower session
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We are making sure you are signed in before opening this portal page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <PortalShell>
      <Outlet />
    </PortalShell>
  );
}

function normalizePortalRedirect(pathname: string): "/portal" | "/portal/offers" {
  return pathname === "/portal/offers" ? "/portal/offers" : "/portal";
}
