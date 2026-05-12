import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { House, RefreshCw, Coins } from "lucide-react";
import { PageHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/home")({
  head: () => ({
    meta: [
      { title: "Homeowner Hub — approvU" },
      {
        name: "description",
        content:
          "Track your mortgage, plan renewal, monitor home equity, and stay on top of property maintenance.",
      },
    ],
  }),
  component: HomeHubLayout,
});

type Tab = { to: string; label: string; icon: typeof House; exact?: boolean };
const TABS: Tab[] = [
  { to: "/portal/home", label: "My Mortgage", icon: House, exact: true },
  { to: "/portal/home/renewal", label: "Renewal", icon: RefreshCw },
  { to: "/portal/home/equity", label: "Equity & Property", icon: Coins },
];

function HomeHubLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div>
      <PageHeader
        eyebrow="Homeowner Hub"
        title="78 River Rd, Ottawa"
        description="Your mortgage, renewal plan, and home value — all in one place."
      />
      <nav
        aria-label="Homeowner sections"
        className="mb-6 flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-sm"
      >
        {TABS.map((t) => {
          const isActive = t.exact ? path === t.to : path.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}