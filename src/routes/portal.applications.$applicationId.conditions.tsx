import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Clock, FileUp,
  Filter, MessageSquare, ShieldCheck,
} from "lucide-react";
import {
  ApplicationShell,
  NotFoundApplication,
  getApplicationSummary,
} from "@/components/portal/application-shell";

export const Route = createFileRoute("/portal/applications/$applicationId/conditions")({
  head: () => ({
    meta: [
      { title: "Funding Conditions — approvU" },
      { name: "description", content: "Track lender funding conditions, due dates, and uploads." },
    ],
  }),
  component: ConditionsPage,
});

type CondStatus = "outstanding" | "submitted" | "under_review" | "approved" | "waived";
type CondCategory = "Income" | "Property" | "Identity" | "Banking" | "Legal" | "Insurance" | "Other";

type Condition = {
  id: string;
  title: string;
  category: CondCategory;
  status: CondStatus;
  dueDate: string;
  description: string;
  acceptedFormats: string;
  whyNeeded: string;
};

const SEED: Condition[] = [
  { id: "C-101", title: "Confirm employment letter", category: "Income", status: "outstanding", dueDate: "May 20",
    description: "Signed letter on company letterhead confirming role, status, salary, and start date.",
    acceptedFormats: "PDF, JPG, PNG · max 10MB",
    whyNeeded: "Lender needs to verify your employment is active and matches the income on file." },
  { id: "C-102", title: "Most recent 2 pay stubs", category: "Income", status: "outstanding", dueDate: "May 20",
    description: "Two consecutive pay stubs from the last 30 days.",
    acceptedFormats: "PDF, JPG, PNG · max 10MB each",
    whyNeeded: "Confirms income consistency for the last pay period." },
  { id: "C-103", title: "Void cheque or PAD form", category: "Banking", status: "outstanding", dueDate: "May 22",
    description: "Void cheque (or pre-authorized debit form) for the account that will fund the mortgage payment.",
    acceptedFormats: "PDF, JPG, PNG",
    whyNeeded: "Used to set up your automated mortgage payments at funding." },
  { id: "C-104", title: "Property appraisal", category: "Property", status: "under_review", dueDate: "—",
    description: "Lender-ordered appraisal report. No action required from you unless requested.",
    acceptedFormats: "Lender ordered",
    whyNeeded: "Confirms market value of the property securing the mortgage." },
  { id: "C-105", title: "Property insurance binder", category: "Insurance", status: "outstanding", dueDate: "Before closing",
    description: "Proof of property insurance with the lender named as loss payee.",
    acceptedFormats: "PDF",
    whyNeeded: "Required for funding so the property is insured at closing." },
  { id: "C-106", title: "Government-issued ID", category: "Identity", status: "approved", dueDate: "—",
    description: "Driver's licence, passport, or provincial ID.",
    acceptedFormats: "PDF, JPG, PNG",
    whyNeeded: "Identity verification for the lender and AML/KYC compliance." },
];

const STATUS_LABEL: Record<CondStatus, string> = {
  outstanding: "Outstanding", submitted: "Submitted", under_review: "Under review",
  approved: "Approved", waived: "Waived",
};

const STATUS_TONE: Record<CondStatus, string> = {
  outstanding: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
  submitted: "border-secondary/40 bg-secondary/10 text-secondary",
  under_review: "border-primary/30 bg-primary/10 text-primary",
  approved: "border-mint bg-mint/30 text-mint-foreground",
  waived: "border-border bg-muted text-muted-foreground",
};

function ConditionsPage() {
  const { applicationId } = Route.useParams();
  const summary = getApplicationSummary(applicationId);
  const [filter, setFilter] = useState<"all" | CondStatus>("all");
  const [conditions, setConditions] = useState<Condition[]>(SEED);
  const [openId, setOpenId] = useState<string | null>(SEED[0]?.id ?? null);

  const counts = useMemo(() => {
    const c = { outstanding: 0, submitted: 0, under_review: 0, approved: 0, waived: 0 };
    conditions.forEach((x) => { c[x.status]++; });
    return c;
  }, [conditions]);

  const total = conditions.length;
  const completed = counts.approved + counts.waived;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const visible = filter === "all" ? conditions : conditions.filter((c) => c.status === filter);

  const upload = (id: string) => {
    setConditions((prev) => prev.map((c) => c.id === id ? { ...c, status: "submitted" } : c));
    toast.success("Document submitted for review");
  };

  if (!summary) return <NotFoundApplication id={applicationId} />;

  return (
    <ApplicationShell summary={summary} tab="conditions">
      {/* Summary header */}
      <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Conditions tracker</p>
          <h2 className="mt-0.5 text-lg font-semibold text-foreground">
            {counts.outstanding > 0
              ? `${counts.outstanding} condition${counts.outstanding === 1 ? "" : "s"} need your attention`
              : "All conditions are with the lender"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {completed} of {total} cleared · {counts.under_review} under lender review
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted sm:max-w-md">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-mint" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-secondary" />
          Securely shared with your lender
        </div>
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3 w-3" /> Filter
        </span>
        <Chip active={filter === "all"} onClick={() => setFilter("all")} label="All" count={total} />
        <Chip active={filter === "outstanding"} onClick={() => setFilter("outstanding")} label="Outstanding" count={counts.outstanding} />
        <Chip active={filter === "submitted"} onClick={() => setFilter("submitted")} label="Submitted" count={counts.submitted} />
        <Chip active={filter === "under_review"} onClick={() => setFilter("under_review")} label="Under review" count={counts.under_review} />
        <Chip active={filter === "approved"} onClick={() => setFilter("approved")} label="Approved" count={counts.approved} />
      </div>

      {/* Condition list */}
      <ul className="space-y-3">
        {visible.length === 0 && (
          <li className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No conditions match this filter.
          </li>
        )}
        {visible.map((c) => {
          const open = openId === c.id;
          const overdue = c.status === "outstanding" && c.dueDate !== "—" && c.dueDate !== "Before closing";
          return (
            <li key={c.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <button
                onClick={() => setOpenId(open ? null : c.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border ${STATUS_TONE[c.status]}`}>
                    {c.status === "approved" ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : c.status === "outstanding" ? <AlertTriangle className="h-3.5 w-3.5" />
                      : <Clock className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{c.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {c.category} · Due {c.dueDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`hidden whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:inline-flex ${STATUS_TONE[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                  {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {open && (
                <div className="border-t border-border bg-background px-4 py-4">
                  <p className="text-xs text-foreground">{c.description}</p>
                  <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                    <Detail label="Why this is needed" value={c.whyNeeded} />
                    <Detail label="Accepted formats" value={c.acceptedFormats} />
                  </div>
                  {overdue && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                      <AlertTriangle className="h-3 w-3" /> Due {c.dueDate} — please submit soon
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {(c.status === "outstanding" || c.status === "submitted") && (
                      <button onClick={() => upload(c.id)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                        <FileUp className="h-3.5 w-3.5" /> Upload document
                      </button>
                    )}
                    <button onClick={() => toast.message("Message sent to your broker")} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
                      <MessageSquare className="h-3.5 w-3.5" /> Ask a question
                    </button>
                    {c.status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mint-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Cleared by lender
                      </span>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </ApplicationShell>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
      }`}>
      {label}
      <span className={`rounded-full px-1.5 text-[10px] font-semibold ${active ? "bg-primary-foreground/20" : "bg-muted-foreground/15"}`}>{count}</span>
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}