import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { SETTINGS_NAV } from "@/components/portal/data";
import { PageHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/settings")({
  head: () => ({
    meta: [
      { title: "Settings — approvU" },
      { name: "description", content: "Manage your profile, security, notifications, and preferences." },
    ],
  }),
  beforeLoad: ({ location }) => {
    if (location.pathname === "/portal/settings" || location.pathname === "/portal/settings/") {
      throw redirect({ to: "/portal/settings/profile" });
    }
  },
  component: SettingsLayout,
});

function SettingsLayout() {
  const router = useRouter();
  const path = router.state.location.pathname;
  return (
    <>
      <PageHeader
        eyebrow="Account Settings"
        title="Settings"
        description="Manage your profile, security, notifications, and preferences."
      />
      <div className="space-y-6">
        <nav className="-mx-1 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-sm">
          {SETTINGS_NAV.map((t) => {
            const active = path.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{t.label}</span>
              </Link>
            );
          })}
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </>
  );
}