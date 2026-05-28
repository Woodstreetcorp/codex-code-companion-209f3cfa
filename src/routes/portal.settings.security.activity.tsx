import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Download, FileText, LogIn, Shield, Share2, Filter } from "lucide-react";
import { SettingPane } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/security/activity")({
  head: () => ({
    meta: [
      { title: "Access Log — approvU Settings" },
      {
        name: "description",
        content: "Every login, document share, and security event on your account.",
      },
    ],
  }),
  component: ActivityPage,
});

type Severity = "info" | "warn" | "alert";
type Kind = "login" | "share" | "auth" | "doc" | "consent";
type Event = {
  id: string;
  date: string;
  kind: Kind;
  severity: Severity;
  title: string;
  detail: string;
  device?: string;
  ip?: string;
  location?: string;
  resolved?: boolean;
};

const EVENTS: Event[] = [];

const KIND_META: Record<Kind, { icon: typeof LogIn; label: string }> = {
  login: { icon: LogIn, label: "Sign-in" },
  share: { icon: Share2, label: "Document share" },
  auth: { icon: Shield, label: "Security" },
  doc: { icon: FileText, label: "Document" },
  consent: { icon: FileText, label: "Consent" },
};

function ActivityPage() {
  const [filter, setFilter] = useState<"all" | Kind | "alert">("all");

  const items = EVENTS.filter((e) => {
    if (filter === "all") return true;
    if (filter === "alert") return e.severity === "alert" || e.severity === "warn";
    return e.kind === filter;
  });

  return (
    <div className="space-y-6">
      <SettingPane
        title="Login & access audit log"
        desc="Every sign-in attempt, document share, and security event tied to your account."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {(["all", "alert", "login", "share", "auth", "doc"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 font-medium ${filter === f ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}
              >
                {f === "all" ? "All" : f === "alert" ? "Alerts" : KIND_META[f as Kind].label}
              </button>
            ))}
          </div>
          <button
            onClick={() => toast.success("Exporting activity log to CSV")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
            <Shield className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No security events recorded yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign-ins, document shares, and security alerts will appear here as your account
              activity builds.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-6">
            {items.map((e) => {
              const Icon = KIND_META[e.kind].icon;
              const dot =
                e.severity === "alert"
                  ? "bg-destructive"
                  : e.severity === "warn"
                    ? "bg-amber-500"
                    : "bg-mint";
              return (
                <li key={e.id} className="relative">
                  <span
                    className={`absolute -left-[29px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background ${dot}`}
                  />
                  <div className="rounded-xl border border-border bg-background p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{e.detail}</p>
                        </div>
                      </div>
                      {e.severity === "alert" && (
                        <button
                          onClick={() => toast.success("Reported. We'll review and follow up.")}
                          className="inline-flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90"
                        >
                          <AlertTriangle className="h-3 w-3" /> This wasn't me
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{e.date}</span>
                      {e.device && <span>{e.device}</span>}
                      {e.ip && <span>IP {e.ip}</span>}
                      {e.location && <span>{e.location}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </SettingPane>
    </div>
  );
}
