import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  HandCoins,
  History,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Building2,
  Settings2,
  BadgeCheck,
  Gift,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  ACTIVE,
  COMPLETED,
  EXPIRED,
  SUBMITTED,
  type ActiveApp,
  type CompletedApp,
  type ExpiredApp,
  type SubmittedApp,
} from "./data";

export type AppBucket = "Active" | "Submitted" | "Expired" | "Completed";

export type AppSummary = {
  id: string;
  type: string;
  property: string;
  bucket: AppBucket;
  status: string;
  progress: number;
  nextStep: string;
  lastUpdate: string;
  conditionsOutstanding: number;
  documentsPending: number;
  broker?: string;
};

export function getApplicationSummary(id: string): AppSummary | null {
  const a: ActiveApp | undefined = ACTIVE.find((x) => x.id === id);
  if (a) {
    return {
      id: a.id, type: a.type, property: a.property, bucket: "Active",
      status: a.status, progress: a.completion, nextStep: a.nextStep,
      lastUpdate: a.lastUpdated, conditionsOutstanding: 0, documentsPending: 2,
    };
  }
  const s: SubmittedApp | undefined = SUBMITTED.find((x) => x.id === id);
  if (s) {
    return {
      id: s.id, type: s.type, property: s.property, bucket: "Submitted",
      status: s.stage, progress: s.progress, nextStep: s.nextStep,
      lastUpdate: s.lastUpdate, conditionsOutstanding: s.conditionsOutstanding,
      documentsPending: s.documentsPending, broker: s.broker,
    };
  }
  const e: ExpiredApp | undefined = EXPIRED.find((x) => x.id === id);
  if (e) {
    return {
      id: e.id, type: e.type, property: e.property, bucket: "Expired",
      status: "Expired", progress: e.completion,
      nextStep: `Reactivate by ${e.reactivateUntil}`, lastUpdate: e.expiredOn,
      conditionsOutstanding: 0, documentsPending: 0,
    };
  }
  const c: CompletedApp | undefined = COMPLETED.find((x) => x.id === id);
  if (c) {
    return {
      id: c.id, type: "Purchase", property: c.property, bucket: "Completed",
      status: "Funded & Closed", progress: 100,
      nextStep: "View funded mortgage details", lastUpdate: c.fundedDate,
      conditionsOutstanding: 0, documentsPending: 0,
    };
  }
  // Fallback synthetic so unknown IDs still render the shell
  return {
    id, type: "Application", property: "Unknown property", bucket: "Active",
    status: "In Progress", progress: 0, nextStep: "Continue your application",
    lastUpdate: "—", conditionsOutstanding: 0, documentsPending: 0,
  };
}

const STAGES: { key: string; label: string }[] = [
  { key: "snapshot", label: "Snapshot" },
  { key: "application", label: "Application" },
  { key: "submitted", label: "Submitted" },
  { key: "lender", label: "Lender Review" },
  { key: "approved", label: "Approved" },
  { key: "conditions", label: "Conditions" },
  { key: "closing", label: "Closing" },
  { key: "funded", label: "Funded" },
];

function stageIndexFor(summary: AppSummary): number {
  const s = summary.status.toLowerCase();
  if (summary.bucket === "Completed") return 7;
  if (s.includes("ready for closing") || s.includes("closing")) return 6;
  if (s.includes("conditions")) return 5;
  if (s.includes("approved")) return 4;
  if (s.includes("lender") || s.includes("review")) return 3;
  if (s.includes("submitted")) return 2;
  if (s.includes("snapshot")) return 0;
  return 1;
}

export type AppTabKey =
  | "snapshot" | "timeline" | "certificate" | "offers" | "benefits" | "lender" | "documents" | "conditions" | "funding" | "messages" | "manage";

const TABS = [
  { key: "snapshot",   label: "Snapshot",   to: "/portal/applications/$applicationId",            icon: LayoutDashboard },
  { key: "timeline",   label: "Timeline",   to: "/portal/applications/$applicationId/timeline",   icon: History },
  { key: "certificate", label: "Certificate", to: "/portal/applications/$applicationId/certificate", icon: BadgeCheck },
  { key: "offers",     label: "Offers",     to: "/portal/applications/$applicationId/offers",     icon: HandCoins },
  { key: "benefits",   label: "Benefits",   to: "/portal/applications/$applicationId/benefits",   icon: Gift },
  { key: "lender",     label: "Lender",     to: "/portal/applications/$applicationId/lender",     icon: Building2 },
  { key: "documents",  label: "Documents",  to: "/portal/applications/$applicationId/documents",  icon: FileText },
  { key: "conditions", label: "Conditions", to: "/portal/applications/$applicationId/conditions", icon: ListChecks },
  { key: "funding",    label: "Funding",    to: "/portal/applications/$applicationId/funding",    icon: Clock },
  { key: "messages",   label: "Messages",   to: "/portal/applications/$applicationId/messages",   icon: MessageSquare },
  { key: "manage",     label: "Manage",     to: "/portal/applications/$applicationId/manage",     icon: Settings2 },
] as const;

export function ApplicationShell({
  summary, tab, children,
}: { summary: AppSummary; tab: AppTabKey; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const stageIdx = stageIndexFor(summary);
  const base = `/portal/applications/${summary.id}`;
  const bucketTone =
    summary.bucket === "Submitted" ? "bg-secondary/15 text-secondary border-secondary/40"
    : summary.bucket === "Completed" ? "bg-mint/30 text-mint-foreground border-mint"
    : summary.bucket === "Expired" ? "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/40"
    : "bg-primary/10 text-primary border-primary/30";

  return (
    <>
      {/* Header */}
      <div className="mb-4">
        <Link
          to="/portal/applications"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
        </Link>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {summary.type} · #{summary.id}
            </p>
            <h1 className="mt-0.5 text-xl font-semibold text-foreground sm:text-2xl">
              {summary.property}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated {summary.lastUpdate}
              {summary.broker ? ` · Broker ${summary.broker}` : ""}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${bucketTone}`}>
            {summary.status}
          </span>
        </div>

        {/* Progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Overall progress</span>
            <span className="font-semibold text-foreground">{summary.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              style={{ width: `${summary.progress}%` }} />
          </div>
        </div>

        {/* Stage rail */}
        <div className="overflow-x-auto">
          <ol className="flex min-w-max items-center gap-0">
            {STAGES.map((s, i) => {
              const done = i < stageIdx;
              const active = i === stageIdx;
              return (
                <li key={s.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold ${
                      done ? "border-primary bg-primary text-primary-foreground"
                      : active ? "border-secondary bg-secondary/15 text-secondary"
                      : "border-border bg-background text-muted-foreground"
                    }`}>
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className={`mt-1 whitespace-nowrap text-[10px] ${
                      active ? "font-semibold text-secondary" : done ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`mx-1 h-px w-8 ${i < stageIdx ? "bg-primary" : "bg-border"} sm:w-12`} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Quick signals */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Signal label="Next step" value={summary.nextStep} />
          <Signal label="Conditions" value={`${summary.conditionsOutstanding} outstanding`} tone={summary.conditionsOutstanding > 0 ? "amber" : "default"} />
          <Signal label="Documents" value={`${summary.documentsPending} pending`} tone={summary.documentsPending > 0 ? "amber" : "default"} />
          <Signal label="Stage" value={STAGES[stageIdx]?.label ?? "—"} />
        </div>
      </div>

      {/* Tabs */}
      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-border" aria-label="Application sections">
        {TABS.map((t) => {
          const isActive = t.key === tab || (t.key === "snapshot" && (pathname === base || pathname === `${base}/`));
          const Icon = t.icon;
          return (
            <Link
              key={t.key}
              to={t.to}
              params={{ applicationId: summary.id }}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>
    </>
  );
}

function Signal({ label, value, tone = "default" }: {
  label: string; value: string; tone?: "default" | "amber";
}) {
  const cls = tone === "amber"
    ? "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10"
    : "border-border bg-background";
  return (
    <div className={`rounded-lg border p-2.5 ${cls}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-xs font-medium text-foreground" title={value}>{value}</p>
    </div>
  );
}

export function NotFoundApplication({ id }: { id: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <Circle className="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-semibold text-foreground">Application not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn't find an application with ID #{id}.
      </p>
      <Link to="/portal/applications" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Back to Applications
      </Link>
    </div>
  );
}