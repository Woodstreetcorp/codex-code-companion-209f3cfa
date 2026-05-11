import { Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Clock,
  Home,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  PORTAL_NAV,
  type ActiveApp,
  type CompletedApp,
  type ExpiredApp,
  type SubmittedApp,
} from "./data";

// ─── Shell ───────────────────────────────────────────────────────────────
export function PortalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = router.state.location.pathname;
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-semibold tracking-tight">approvU</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="relative rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-coral" />
            </button>
            <Link
              to="/portal/settings/profile"
              aria-label="Account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-primary-foreground shadow-sm"
            >
              AT
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Mobile horizontal nav */}
        <nav
          aria-label="Portal sections"
          className="sticky top-[57px] z-30 -mx-4 mb-6 flex gap-1.5 overflow-x-auto border-b border-border bg-background/90 px-4 py-2 backdrop-blur lg:hidden"
        >
          {PORTAL_NAV.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Sections
              </p>
              <ul className="space-y-1">
                {PORTAL_NAV.map((n) => {
                  const active = n.exact ? path === n.to : path.startsWith(n.to);
                  return (
                    <li key={n.to}>
                      <Link
                        to={n.to}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <n.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                        <span className="flex-1 truncate">{n.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Internal prototype — illustrative only. Not a mortgage approval.
        </p>
      </main>
    </div>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────
export function PageHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {right}
    </div>
  );
}

// ─── Primitives ──────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {right}
    </div>
  );
}

export function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Home;
  label: string;
  value: string;
  tone: "primary" | "secondary" | "yellow" | "coral" | "mint";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    yellow: "bg-yellow/30 text-foreground",
    coral: "bg-coral/15 text-coral",
    mint: "bg-mint/20 text-foreground",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Received: "bg-mint/20 text-foreground",
    Accepted: "bg-mint/20 text-foreground",
    Completed: "bg-mint/20 text-foreground",
    Requested: "bg-yellow/30 text-foreground",
    Pending: "bg-yellow/30 text-foreground",
    Outstanding: "bg-coral/15 text-coral",
    Overdue: "bg-coral/15 text-coral",
    "Needs Correction": "bg-coral/15 text-coral",
    "Under Review": "bg-secondary/15 text-secondary",
    Uploaded: "bg-secondary/15 text-secondary",
    "Snapshot Complete": "bg-muted text-muted-foreground",
    "Offer Selected": "bg-primary/10 text-primary",
    "Offer Viewed": "bg-secondary/15 text-secondary",
    Expired: "bg-muted text-muted-foreground",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
  );
}

export function Alert({ tone, children }: { tone: "warning" | "info"; children: ReactNode }) {
  const cls =
    tone === "warning"
      ? "border-yellow bg-yellow/15 text-foreground"
      : "border-secondary/30 bg-secondary/10 text-foreground";
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${cls}`} role="status">
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  ctaLabel,
  onClick,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      <button
        onClick={onClick}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="mr-1.5 h-4 w-4" /> {ctaLabel}
      </button>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export function NextBestAction({
  title,
  related,
  due,
  ctaLabel,
  to,
}: {
  title: string;
  related: string;
  due: string;
  ctaLabel: string;
  to?: "/portal/documents" | "/portal/applications";
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-secondary/30 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-secondary/15 p-2 text-secondary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">
            Next best action
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{related} · {due}</p>
        </div>
      </div>
      <Link
        to={to ?? "/portal/documents"}
        className="inline-flex items-center justify-center rounded-md bg-secondary px-3.5 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
      >
        {ctaLabel} <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  );
}

// ─── Application cards ───────────────────────────────────────────────────
export function ActiveCard({ app }: { app: ActiveApp }) {
  const expiringSoon = app.daysToExpiry <= 3;
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {app.type}
        </span>
        <span className="text-xs text-muted-foreground">#{app.id}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{app.property}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Updated {app.lastUpdated}</p>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{app.status}</span>
          <span className="font-medium text-foreground">{app.completion}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-secondary" style={{ width: `${app.completion}%` }} />
        </div>
      </div>
      <div
        className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          expiringSoon ? "bg-yellow/40 text-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        {expiringSoon ? `Expires in ${app.daysToExpiry} days` : `${app.daysToExpiry} days left`}
      </div>
      <div className="mt-4 rounded-lg bg-muted p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Next step</p>
        <p className="mt-0.5 text-sm text-foreground">{app.nextStep}</p>
      </div>
      <Link
        to="/internal/full-application"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Continue Application <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </article>
  );
}

export function SubmittedCard({ app }: { app: SubmittedApp }) {
  return (
    <article className="flex flex-col rounded-2xl border border-secondary/30 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-medium text-secondary">
          {app.type} · Submitted
        </span>
        <span className="text-xs text-muted-foreground">#{app.id}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{app.property}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Broker: {app.broker} · Updated {app.lastUpdate}
      </p>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{app.stage}</span>
          <span className="font-medium text-foreground">{app.progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-mint" style={{ width: `${app.progress}%` }} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-muted p-2">
          <p className="text-muted-foreground">Conditions</p>
          <p className="font-semibold text-foreground">{app.conditionsOutstanding} outstanding</p>
        </div>
        <div className="rounded-lg bg-muted p-2">
          <p className="text-muted-foreground">Documents</p>
          <p className="font-semibold text-foreground">{app.documentsPending} pending</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-muted p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Next step</p>
        <p className="mt-0.5 text-sm text-foreground">{app.nextStep}</p>
      </div>
    </article>
  );
}

export function ExpiredCard({ app, onReactivate }: { app: ExpiredApp; onReactivate: () => void }) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {app.type} · Expired
        </span>
        <span className="text-xs text-muted-foreground">#{app.id}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{app.property}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Expired {app.expiredOn} · {app.completion}% complete
      </p>
      <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-coral/15 px-2.5 py-1 text-xs font-medium text-coral">
        <Clock className="h-3.5 w-3.5" /> Reactivate by {app.reactivateUntil} ({app.daysLeftToReactivate}d left)
      </div>
      <button
        onClick={onReactivate}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <RefreshCw className="mr-1.5 h-4 w-4" /> Reactivate
      </button>
    </article>
  );
}

export function CompletedCard({ app }: { app: CompletedApp }) {
  return (
    <article className="flex flex-col rounded-2xl border border-mint/30 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-mint/20 px-2.5 py-0.5 text-xs font-medium text-foreground">
          Funded · {app.lender}
        </span>
        <span className="text-xs text-muted-foreground">#{app.id}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{app.property}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Funded {app.fundedDate}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Stat2 label="Amount" value={app.amount} />
        <Stat2 label="Term" value={app.term} />
        <Stat2 label="Rate" value={app.rateType} />
        <Stat2 label="Maturity" value={app.maturityDate} />
      </dl>
    </article>
  );
}

function Stat2({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}