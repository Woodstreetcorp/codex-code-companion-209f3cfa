import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  ACTIVE,
  COMPLETED,
  EXPIRED,
  MAX_ACTIVE_APPLICATIONS,
  SUBMITTED,
  type ExpiredApp,
} from "@/components/portal/data";
import {
  ActiveCard,
  CompletedCard,
  EmptyState,
  ExpiredCard,
  Modal,
  PageHeader,
  SummaryCard,
  SubmittedCard,
} from "@/components/portal/ui";

export const Route = createFileRoute("/portal/applications/")({
  head: () => ({
    meta: [
      { title: "Your Applications — approvU" },
      {
        name: "description",
        content:
          "Track active mortgage applications, continue where you left off, and reactivate eligible past applications.",
      },
    ],
  }),
  component: ApplicationsPage,
});

type Tab = "active" | "submitted" | "expired" | "completed" | "all";

function ApplicationsPage() {
  const activeCount = ACTIVE.length;
  const atLimit = activeCount >= MAX_ACTIVE_APPLICATIONS;

  const defaultTab: Tab = ACTIVE.length > 0 ? "active" : SUBMITTED.length > 0 ? "submitted" : "active";
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [reactivate, setReactivate] = useState<ExpiredApp | null>(null);
  const [query, setQuery] = useState("");
  const [reactivated, setReactivated] = useState<string[]>([]);

  const visibleExpired = useMemo(
    () => EXPIRED.filter((e) => e.daysLeftToReactivate >= 0 && !reactivated.includes(e.id)),
    [reactivated],
  );

  const summary = [
    { icon: Inbox, label: "Active", value: `${activeCount} of ${MAX_ACTIVE_APPLICATIONS}`, tone: "primary" as const },
    { icon: ShieldCheck, label: "Submitted", value: `${SUBMITTED.length}`, tone: "secondary" as const },
    { icon: Clock, label: "Expired", value: `${visibleExpired.length}`, tone: "yellow" as const },
    { icon: CheckCircle2, label: "Completed", value: `${COMPLETED.length}`, tone: "mint" as const },
    { icon: FileText, label: "Documents pending", value: "3", tone: "secondary" as const },
    { icon: AlertTriangle, label: "Conditions outstanding", value: "2", tone: "coral" as const },
  ];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: ACTIVE.length },
    { key: "submitted", label: "Submitted / Ongoing", count: SUBMITTED.length },
    { key: "expired", label: "Expired", count: visibleExpired.length },
    { key: "completed", label: "Completed", count: COMPLETED.length },
    { key: "all", label: "All", count: ACTIVE.length + SUBMITTED.length + visibleExpired.length + COMPLETED.length },
  ];

  const onReactivate = (app: ExpiredApp) => {
    if (atLimit) {
      toast.error("You already have 4 active applications. Complete or close one first.");
      return;
    }
    setReactivate(app);
  };

  const confirmReactivate = () => {
    if (!reactivate) return;
    setReactivated((p) => [...p, reactivate.id]);
    toast.success("Application reactivated successfully");
    setReactivate(null);
    setTab("active");
  };

  return (
    <>
      <PageHeader
        eyebrow="Applications"
        title="Your Applications"
        description="Track your mortgage journey, continue active applications, and reactivate eligible past applications."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/portal"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Back to Portal
            </Link>
            <StartButton disabled={atLimit} />
          </div>
        }
      />

      <LimitBanner active={activeCount} />

      <NextBest active={ACTIVE[0]} expired={visibleExpired[0]} />

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {summary.map((s) => (
          <SummaryCard key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-border pb-2">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/15 text-muted-foreground"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "all" && (
        <div className="mt-5 flex max-w-sm items-center gap-2 rounded-lg border border-input bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, address, or status…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}

      <div className="mt-6">
        {tab === "active" && (
          <Section
            title="Active Applications"
            subtitle="Applications you started but have not submitted yet. Active applications expire after 14 days."
          >
            {ACTIVE.length === 0 ? (
              <EmptyState
                title="No active applications"
                body="You don't have any applications in progress right now. Start a new mortgage snapshot to see personalized offers."
                ctaLabel="Start New Mortgage Snapshot"
                onClick={() => toast.success("Starting a new snapshot")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {ACTIVE.map((a) => <ActiveCard key={a.id} app={a} />)}
              </div>
            )}
          </Section>
        )}

        {tab === "submitted" && (
          <Section
            title="Submitted / Ongoing Applications"
            subtitle="Applications submitted for review, lender decision, approval, conditions, or closing."
          >
            {SUBMITTED.length === 0 ? (
              <EmptyState
                title="No submitted applications"
                body="When you submit an application for review, it'll show up here so you can track its progress."
                ctaLabel="View active applications"
                onClick={() => setTab("active")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {SUBMITTED.map((s) => <SubmittedCard key={s.id} app={s} />)}
              </div>
            )}
          </Section>
        )}

        {tab === "expired" && (
          <Section
            title="Expired / Inactive Applications"
            subtitle="Applications that weren't submitted within 14 days. Eligible applications can be reactivated for up to 90 days."
          >
            {visibleExpired.length === 0 ? (
              <EmptyStateMuted
                title="No expired applications"
                body="Nothing has expired in the last 90 days."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleExpired.map((e) => (
                  <ExpiredCard key={e.id} app={e} onReactivate={() => onReactivate(e)} />
                ))}
              </div>
            )}
          </Section>
        )}

        {tab === "completed" && (
          <Section
            title="Completed / Past Applications"
            subtitle="Mortgages funded and closed through approvU."
          >
            {COMPLETED.length === 0 ? (
              <EmptyStateMuted
                title="No completed applications yet"
                body="Funded and closed mortgages will appear here, along with your Home Life Wallet benefits."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {COMPLETED.map((c) => <CompletedCard key={c.id} app={c} />)}
              </div>
            )}
          </Section>
        )}

        {tab === "all" && (
          <AllApplicationsTable
            query={query}
            visibleExpired={visibleExpired}
            onReactivate={onReactivate}
          />
        )}
      </div>

      {/* Help / rules panel */}
      <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-foreground">How applications work</h3>
        <ul className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <li className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Up to 4 active applications at a time.</li>
          <li className="flex gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Active applications expire after 14 days if not submitted.</li>
          <li className="flex gap-2"><RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Expired applications can be reactivated for up to 90 days.</li>
        </ul>
      </div>

      {reactivate && (
        <Modal title="Reactivate this application?" onClose={() => setReactivate(null)}>
          <p className="text-sm text-muted-foreground">
            This application expired because it wasn't submitted within 14 days. You can reactivate it and continue where you left off. Some information may need to be reviewed or updated.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-3 text-xs">
            <DT label="Application" value={`#${reactivate.id}`} />
            <DT label="Type" value={reactivate.type} />
            <DT label="Property" value={reactivate.property} />
            <DT label="Previous completion" value={`${reactivate.completion}%`} />
            <DT label="New expiry" value="14 days from today" />
          </dl>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setReactivate(null)}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={confirmReactivate}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" /> Reactivate Application
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function StartButton({ disabled }: { disabled: boolean }) {
  return (
    <div className="group relative">
      <button
        disabled={disabled}
        onClick={() => !disabled && toast.success("Starting a new mortgage snapshot…")}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ${
          disabled
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        <Plus className="h-4 w-4" /> Start New Mortgage Snapshot
      </button>
      {disabled && (
        <div className="pointer-events-none absolute right-0 top-full z-10 mt-2 hidden w-64 rounded-lg border border-border bg-card p-2.5 text-xs text-muted-foreground shadow-md group-hover:block">
          You can have up to 4 active applications. Complete, submit, cancel, or let one expire before starting another.
        </div>
      )}
    </div>
  );
}

function LimitBanner({ active }: { active: number }) {
  if (active < MAX_ACTIVE_APPLICATIONS - 1) return null;
  const atLimit = active >= MAX_ACTIVE_APPLICATIONS;
  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
        atLimit ? "border-coral/40 bg-coral/10" : "border-yellow/50 bg-yellow/15"
      }`}
    >
      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${atLimit ? "text-coral" : "text-foreground"}`} />
      <div className="text-sm">
        <p className="font-medium text-foreground">
          {atLimit ? "You've reached the maximum of 4 active applications." : "You can start 1 more active application."}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {atLimit
            ? "Complete, submit, cancel, or let one expire before starting another."
            : "Submit, cancel, or finish one to free up a slot."}
        </p>
      </div>
    </div>
  );
}

function NextBest({ active, expired }: { active?: typeof ACTIVE[number]; expired?: ExpiredApp }) {
  const card = active
    ? {
        title: `Continue your ${active.type.toLowerCase()} application`,
        related: `#${active.id} · ${active.property}`,
        due: `Expires in ${active.daysToExpiry} days`,
        cta: "Continue Application",
      }
    : expired
      ? {
          title: `Reactivate your ${expired.type.toLowerCase()} application`,
          related: `#${expired.id} · ${expired.property}`,
          due: `${expired.daysLeftToReactivate} days left to reactivate`,
          cta: "Reactivate",
        }
      : null;

  if (!card) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/8 via-card to-primary/5 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-secondary/15 p-2.5 text-secondary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">Next best action</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{card.title}</p>
          <p className="text-xs text-muted-foreground">{card.related} · {card.due}</p>
        </div>
      </div>
      <Link
        to="/internal/full-application"
        className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {card.cta} <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  );
}

function Section({
  title, subtitle, children,
}: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

function EmptyStateMuted({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function DT({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function AllApplicationsTable({
  query, visibleExpired, onReactivate,
}: {
  query: string;
  visibleExpired: ExpiredApp[];
  onReactivate: (e: ExpiredApp) => void;
}) {
  type Row = {
    id: string; type: string; property: string; status: string; progress: number;
    updated: string; nextStep: string; bucket: "Active" | "Submitted" | "Expired" | "Completed";
    onAction?: () => void; actionLabel?: string;
  };
  const rows: Row[] = [
    ...ACTIVE.map((a): Row => ({
      id: a.id, type: a.type, property: a.property, status: a.status, progress: a.completion,
      updated: a.lastUpdated, nextStep: a.nextStep, bucket: "Active",
    })),
    ...SUBMITTED.map((s): Row => ({
      id: s.id, type: s.type, property: s.property, status: s.stage, progress: s.progress,
      updated: s.lastUpdate, nextStep: s.nextStep, bucket: "Submitted",
    })),
    ...visibleExpired.map((e): Row => ({
      id: e.id, type: e.type, property: e.property, status: "Expired", progress: e.completion,
      updated: e.expiredOn, nextStep: `Reactivate by ${e.reactivateUntil}`, bucket: "Expired",
      onAction: () => onReactivate(e), actionLabel: "Reactivate",
    })),
    ...COMPLETED.map((c): Row => ({
      id: c.id, type: "Purchase", property: c.property, status: "Funded & Closed", progress: 100,
      updated: c.fundedDate, nextStep: "View mortgage details", bucket: "Completed",
    })),
  ];

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        [r.id, r.type, r.property, r.status, r.bucket].some((v) => v.toLowerCase().includes(q)),
      )
    : rows;

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <X className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">No matches</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Try a different search term.</p>
      </div>
    );
  }

  const bucketTone: Record<Row["bucket"], string> = {
    Active: "bg-primary/10 text-primary",
    Submitted: "bg-secondary/15 text-secondary",
    Expired: "bg-muted text-muted-foreground",
    Completed: "bg-mint/20 text-foreground",
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Application</th>
              <th className="px-4 py-2.5 font-medium">Property</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Progress</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Updated</th>
              <th className="px-4 py-2.5 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-foreground">#{r.id}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${bucketTone[r.bucket]}`}>
                      {r.bucket}
                    </span>
                    <span className="text-muted-foreground">{r.type}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-foreground">{r.property}</td>
                <td className="px-4 py-3 align-top text-muted-foreground">{r.status}</td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-secondary" style={{ width: `${r.progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{r.progress}%</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 align-top text-muted-foreground md:table-cell">{r.updated}</td>
                <td className="px-4 py-3 align-top text-right">
                  {r.onAction ? (
                    <button
                      onClick={r.onAction}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <RefreshCw className="h-3 w-3" /> {r.actionLabel}
                    </button>
                  ) : (
                    <Link
                      to={r.bucket === "Completed" ? "/portal" : "/internal/full-application"}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
