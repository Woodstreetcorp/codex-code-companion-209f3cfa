import { useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Flag,
  Home,
  Info,
  Lock,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCircle2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Types ───────────────────────────────────────────────────────────────
type ConditionStatus =
  | "Requested"
  | "Action Required"
  | "Uploaded"
  | "Submitted"
  | "Under Review"
  | "Sent to Lender"
  | "Accepted"
  | "Needs Correction"
  | "Overdue"
  | "Waived"
  | "Completed"
  | "Managed by approvU";

type ConditionCategory =
  | "Income"
  | "Down Payment"
  | "Property"
  | "Identity"
  | "Credit"
  | "Insurance"
  | "Legal"
  | "Appraisal"
  | "Lender"
  | "Insurer"
  | "Closing"
  | "Borrower Declaration"
  | "Other";

type AppliesTo =
  | "Primary Borrower"
  | "Co-Applicant"
  | "Guarantor"
  | "Subject Property"
  | "Application"
  | "Solicitor"
  | "Appraiser"
  | "Insurer"
  | "Lender"
  | "approvU";

type RequiredBy =
  | "Required by lender"
  | "Required by approvU"
  | "Required for closing"
  | "Required by insurer"
  | "Required by solicitor"
  | "Required for property verification";

type ActionType =
  | "file_upload"
  | "text_response"
  | "checkbox_confirmation"
  | "e_signature"
  | "contact_details"
  | "date_confirmation"
  | "select_existing_document"
  | "external_action"
  | "no_borrower_action";

type Condition = {
  id: string;
  name: string;
  category: ConditionCategory;
  appliesTo: AppliesTo;
  appliesToName?: string;
  requiredBy: RequiredBy;
  status: ConditionStatus;
  priority?: "Urgent" | "High" | "Normal";
  description: string;
  borrowerInstruction: string;
  actionType: ActionType;
  dueDate?: string;
  acceptedDate?: string;
  acceptedBy?: string;
  managedBy?: string;
  blocksClosing?: boolean;
  reviewComment?: string;
  ctaLabel?: string;
  documentName?: string;
  comments?: { author: string; authorType: "approvU" | "Borrower"; date: string; text: string }[];
};

type Activity = {
  id: string;
  date: string;
  actor: string;
  event: string;
  condition?: string;
  details?: string;
};

type TabKey =
  | "Action Required"
  | "Under Review"
  | "Accepted"
  | "Needs Correction"
  | "Overdue"
  | "Managed by approvU"
  | "All Conditions";

// ─── Mock data ───────────────────────────────────────────────────────────
const APPROVAL = {
  applicationId: "APP-2041",
  transaction: "Purchase",
  property: "123 Maple Ave, Toronto, ON",
  offer: "Best Value Fixed Offer",
  amount: "$748,024",
  rate: "4.99% Fixed",
  monthly: "$4,372",
  closingDate: "Jun 28, 2026",
  expiryDate: "Jun 30, 2026",
  status: "Conditions in Progress",
  advisor: "Priya Patel",
};

const INITIAL_CONDITIONS: Condition[] = [
  {
    id: "fc-1",
    name: "Home Insurance Binder",
    category: "Insurance",
    appliesTo: "Subject Property",
    requiredBy: "Required by lender",
    status: "Action Required",
    priority: "High",
    description: "Proof of home insurance for the subject property.",
    borrowerInstruction:
      "Upload proof of home insurance showing the lender as loss payee before closing.",
    actionType: "contact_details",
    dueDate: "Jun 18, 2026",
    blocksClosing: true,
    ctaLabel: "Upload Insurance Binder",
  },
  {
    id: "fc-2",
    name: "Most Recent Paystub",
    category: "Income",
    appliesTo: "Primary Borrower",
    appliesToName: "David Scott",
    requiredBy: "Required by lender",
    status: "Action Required",
    priority: "Normal",
    description: "Most recent paystub to confirm employment income.",
    borrowerInstruction: "Upload your most recent paystub (within the last 30 days).",
    actionType: "file_upload",
    dueDate: "Jun 15, 2026",
    ctaLabel: "Upload Paystub",
  },
  {
    id: "fc-3",
    name: "90-Day Bank Statements",
    category: "Down Payment",
    appliesTo: "Application",
    requiredBy: "Required by lender",
    status: "Under Review",
    description: "90 days of bank statements showing down payment funds.",
    borrowerInstruction: "We received your bank statements and they are being reviewed.",
    actionType: "no_borrower_action",
    dueDate: "Jun 14, 2026",
    documentName: "BankStatements_90day.pdf",
  },
  {
    id: "fc-4",
    name: "Signed Purchase Agreement",
    category: "Property",
    appliesTo: "Subject Property",
    requiredBy: "Required by lender",
    status: "Needs Correction",
    priority: "Urgent",
    description: "Fully signed purchase and sale agreement.",
    borrowerInstruction: "Replace with the fully executed purchase agreement.",
    actionType: "file_upload",
    dueDate: "Jun 12, 2026",
    blocksClosing: true,
    reviewComment:
      "Please upload the fully signed copy. The current file is missing the seller's signature on page 6.",
    ctaLabel: "Replace Document",
    documentName: "PurchaseAgreement.pdf",
    comments: [
      {
        author: "Priya Patel",
        authorType: "approvU",
        date: "Jun 4, 2026",
        text: "We're missing the seller's signature on page 6 — please upload the fully executed copy.",
      },
    ],
  },
  {
    id: "fc-5",
    name: "Government-Issued Photo ID",
    category: "Identity",
    appliesTo: "Co-Applicant",
    appliesToName: "Jamie Scott",
    requiredBy: "Required by approvU",
    status: "Accepted",
    description: "Valid government-issued photo ID for identity verification.",
    borrowerInstruction: "Identity has been verified.",
    actionType: "no_borrower_action",
    acceptedDate: "Jun 2, 2026",
    acceptedBy: "approvU Compliance",
    documentName: "JamieScott_DriversLicense.pdf",
  },
  {
    id: "fc-6",
    name: "Solicitor Information",
    category: "Legal",
    appliesTo: "Application",
    requiredBy: "Required for closing",
    status: "Accepted",
    description: "Solicitor / notary handling the closing.",
    borrowerInstruction: "Solicitor details confirmed.",
    actionType: "contact_details",
    acceptedDate: "Jun 1, 2026",
    acceptedBy: "Priya Patel",
  },
  {
    id: "fc-7",
    name: "Appraisal Report Review",
    category: "Appraisal",
    appliesTo: "Subject Property",
    requiredBy: "Required by lender",
    status: "Managed by approvU",
    description: "Independent appraisal of the subject property.",
    borrowerInstruction: "No action is required from you right now.",
    actionType: "no_borrower_action",
    managedBy: "approvU / Appraiser",
  },
];

const INITIAL_ACTIVITY: Activity[] = [
  {
    id: "a1",
    date: "Jun 5, 2026 · 9:14 AM",
    actor: "approvU",
    event: "Conditions issued",
    details: "7 funding conditions issued after lender approval.",
  },
  {
    id: "a2",
    date: "Jun 5, 2026 · 10:02 AM",
    actor: "David Scott",
    event: "Document uploaded",
    condition: "90-Day Bank Statements",
  },
  {
    id: "a3",
    date: "Jun 5, 2026 · 2:21 PM",
    actor: "David Scott",
    event: "Document uploaded",
    condition: "Signed Purchase Agreement",
  },
  {
    id: "a4",
    date: "Jun 6, 2026 · 11:48 AM",
    actor: "Priya Patel",
    event: "Returned for correction",
    condition: "Signed Purchase Agreement",
    details: "Missing seller signature on page 6.",
  },
  {
    id: "a5",
    date: "Jun 7, 2026 · 8:30 AM",
    actor: "approvU Compliance",
    event: "Condition accepted",
    condition: "Government-Issued Photo ID",
  },
];

const CLOSING_TIMELINE: { label: string; state: "complete" | "current" | "upcoming" }[] = [
  { label: "Approval received", state: "complete" },
  { label: "Approval accepted", state: "complete" },
  { label: "Conditions issued", state: "current" },
  { label: "Documents submitted", state: "upcoming" },
  { label: "Conditions reviewed", state: "upcoming" },
  { label: "All conditions satisfied", state: "upcoming" },
  { label: "Ready for closing", state: "upcoming" },
  { label: "Mortgage funded", state: "upcoming" },
  { label: "Home Life Wallet activated", state: "upcoming" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
function statusTone(status: ConditionStatus): {
  label: string;
  cls: string;
  Icon: ComponentType<{ className?: string }>;
} {
  switch (status) {
    case "Action Required":
    case "Requested":
      return { label: status, cls: "bg-secondary/15 text-secondary", Icon: AlertCircle };
    case "Uploaded":
    case "Submitted":
    case "Under Review":
    case "Sent to Lender":
      return { label: status, cls: "bg-primary/10 text-primary", Icon: Clock };
    case "Accepted":
    case "Completed":
      return { label: status, cls: "bg-mint/25 text-foreground", Icon: CheckCircle2 };
    case "Needs Correction":
      return { label: status, cls: "bg-coral/15 text-coral", Icon: AlertTriangle };
    case "Overdue":
      return { label: status, cls: "bg-coral text-coral-foreground", Icon: AlertTriangle };
    case "Waived":
      return { label: status, cls: "bg-muted text-muted-foreground", Icon: ShieldCheck };
    case "Managed by approvU":
      return { label: status, cls: "bg-primary/10 text-primary", Icon: ShieldCheck };
    default:
      return { label: status, cls: "bg-muted text-muted-foreground", Icon: Info };
  }
}

function categoryIcon(c: ConditionCategory): ComponentType<{ className?: string }> {
  switch (c) {
    case "Income":
      return Award;
    case "Down Payment":
      return FileText;
    case "Property":
      return Home;
    case "Identity":
      return UserCircle2;
    case "Insurance":
      return ShieldCheck;
    case "Legal":
      return FileCheck;
    case "Appraisal":
      return Building2;
    case "Closing":
      return Flag;
    default:
      return FileText;
  }
}

function tabFilter(status: ConditionStatus, tab: TabKey): boolean {
  if (tab === "All Conditions") return true;
  if (tab === "Action Required")
    return ["Action Required", "Requested"].includes(status);
  if (tab === "Under Review")
    return ["Uploaded", "Submitted", "Under Review", "Sent to Lender"].includes(status);
  if (tab === "Accepted") return ["Accepted", "Completed", "Waived"].includes(status);
  if (tab === "Needs Correction") return status === "Needs Correction";
  if (tab === "Overdue") return status === "Overdue";
  if (tab === "Managed by approvU") return status === "Managed by approvU";
  return true;
}

// ─── Public component ────────────────────────────────────────────────────
export function FundingConditionsContent({ unlocked = true }: { unlocked?: boolean }) {
  const [conditions, setConditions] = useState<Condition[]>(INITIAL_CONDITIONS);
  const [activity, setActivity] = useState<Activity[]>(INITIAL_ACTIVITY);
  const [tab, setTab] = useState<TabKey>("Action Required");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = {
      total: conditions.length,
      action: 0,
      review: 0,
      accepted: 0,
      correction: 0,
      overdue: 0,
      managed: 0,
    };
    for (const x of conditions) {
      if (tabFilter(x.status, "Action Required")) c.action++;
      if (tabFilter(x.status, "Under Review")) c.review++;
      if (tabFilter(x.status, "Accepted")) c.accepted++;
      if (tabFilter(x.status, "Needs Correction")) c.correction++;
      if (tabFilter(x.status, "Overdue")) c.overdue++;
      if (tabFilter(x.status, "Managed by approvU")) c.managed++;
    }
    return c;
  }, [conditions]);

  const readinessPct = Math.round((counts.accepted / Math.max(counts.total, 1)) * 100);
  const readinessState: "Not Started" | "In Progress" | "Almost Ready" | "Ready for Closing" | "Blocked" =
    counts.correction > 0 || counts.overdue > 0
      ? "Blocked"
      : readinessPct === 0
        ? "Not Started"
        : readinessPct === 100
          ? "Ready for Closing"
          : readinessPct >= 80
            ? "Almost Ready"
            : "In Progress";

  const nextAction = useMemo(() => {
    const order: ConditionStatus[] = [
      "Overdue",
      "Needs Correction",
      "Action Required",
      "Requested",
      "Under Review",
    ];
    for (const s of order) {
      const c = conditions.find((x) => x.status === s);
      if (c) return c;
    }
    return null;
  }, [conditions]);

  const filtered = useMemo(() => {
    return conditions.filter((c) => {
      if (!tabFilter(c.status, tab)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.appliesTo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [conditions, tab, search]);

  const active = conditions.find((c) => c.id === activeId) ?? null;

  function submitCondition(id: string, note?: string) {
    setConditions((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "Under Review",
              reviewComment: undefined,
              comments: note
                ? [
                    ...(c.comments ?? []),
                    {
                      author: "You",
                      authorType: "Borrower",
                      date: "Just now",
                      text: note,
                    },
                  ]
                : c.comments,
            }
          : c,
      ),
    );
    setActivity((prev) => [
      {
        id: `a-${Date.now()}`,
        date: "Just now",
        actor: "You",
        event: "Condition submitted",
        condition: conditions.find((c) => c.id === id)?.name,
      },
      ...prev,
    ]);
    setActiveId(null);
    toast.success("Condition submitted for review.");
  }

  if (!unlocked) {
    return <LockedFundingConditionsState />;
  }

  return (
    <>
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold text-primary sm:text-3xl">Funding Conditions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the remaining requirements so your mortgage can move toward closing.
        </p>
      </header>

      {/* Approval context */}
      <ApprovalContextCard />

      {/* Closing readiness */}
      <ClosingReadinessCard
        pct={readinessPct}
        state={readinessState}
        accepted={counts.accepted}
        total={counts.total}
        nextMilestone={nextAction?.name ?? "All conditions complete"}
      />

      {/* Summary cards */}
      <ConditionsSummaryCards counts={counts} />

      {/* Next required action */}
      {nextAction && (
        <NextRequiredActionCard
          condition={nextAction}
          onClick={() => setActiveId(nextAction.id)}
        />
      )}

      {/* Search / filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conditions, categories, applicants…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {counts.total} conditions
        </p>
      </div>

      {/* Tabs */}
      <ConditionsTabs
        tab={tab}
        onChange={setTab}
        counts={counts}
      />

      {/* Conditions list */}
      {filtered.length === 0 ? (
        <EmptyConditionsState tab={tab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ConditionCard
              key={c.id}
              condition={c}
              onAction={() => setActiveId(c.id)}
            />
          ))}
        </div>
      )}

      {/* Closing timeline */}
      <ClosingTimeline />

      {/* Activity */}
      <ConditionActivityTimeline activity={activity} />

      {/* Help */}
      <ConditionsHelpPanel />

      {/* Drawer */}
      <CompleteConditionDrawer
        condition={active}
        onClose={() => setActiveId(null)}
        onSubmit={submitCondition}
      />
    </>
  );
}

// ─── Locked state ────────────────────────────────────────────────────────
function LockedFundingConditionsState() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-primary">
        Funding Conditions will unlock after approval
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Once your mortgage approval is ready and conditions are issued, you'll be able to track and
        complete them here.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <MessageCircle className="h-4 w-4" /> View Lender Response
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted">
          <Upload className="h-4 w-4" /> Upload Documents
        </button>
      </div>
    </div>
  );
}

// ─── Approval context ────────────────────────────────────────────────────
function ApprovalContextCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Approval Context
          </p>
          <h2 className="mt-1 text-lg font-semibold text-primary">{APPROVAL.offer}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {APPROVAL.transaction} · {APPROVAL.property}
          </p>
        </div>
        <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-semibold text-secondary">
          {APPROVAL.status}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <KV label="Application" value={APPROVAL.applicationId} />
        <KV label="Approved Amount" value={APPROVAL.amount} />
        <KV label="Rate" value={APPROVAL.rate} />
        <KV label="Monthly" value={APPROVAL.monthly} />
        <KV label="Closing Date" value={APPROVAL.closingDate} />
        <KV label="Approval Expires" value={APPROVAL.expiryDate} />
      </dl>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Your mortgage approval is subject to satisfying lender and closing conditions before funding.
        Your advisor {APPROVAL.advisor} is here to help.
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

// ─── Closing readiness ───────────────────────────────────────────────────
function ClosingReadinessCard({
  pct,
  state,
  accepted,
  total,
  nextMilestone,
}: {
  pct: number;
  state: "Not Started" | "In Progress" | "Almost Ready" | "Ready for Closing" | "Blocked";
  accepted: number;
  total: number;
  nextMilestone: string;
}) {
  const barCls = {
    "Not Started": "bg-muted-foreground/40",
    "In Progress": "bg-secondary",
    "Almost Ready": "bg-secondary",
    "Ready for Closing": "bg-mint",
    Blocked: "bg-coral",
  }[state];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Closing Readiness</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {accepted} of {total} conditions accepted · {state}
          </p>
        </div>
        <span className="text-2xl font-semibold text-foreground">{pct}%</span>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${barCls}`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 text-secondary" />
          <div>
            <p className="font-semibold text-foreground">Next milestone</p>
            <p className="text-muted-foreground">{nextMilestone}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3">
          <Calendar className="mt-0.5 h-3.5 w-3.5 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Estimated closing date</p>
            <p className="text-muted-foreground">{APPROVAL.closingDate}</p>
          </div>
        </div>
      </div>

      {state === "Blocked" && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-coral">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Your closing may be delayed until the highlighted conditions are completed.
        </div>
      )}
    </div>
  );
}

// ─── Summary cards ───────────────────────────────────────────────────────
function ConditionsSummaryCards({
  counts,
}: {
  counts: {
    total: number;
    action: number;
    review: number;
    accepted: number;
    correction: number;
    overdue: number;
    managed: number;
  };
}) {
  const items: { label: string; value: number; tone: string; Icon: ComponentType<{ className?: string }> }[] = [
    { label: "Total", value: counts.total, tone: "bg-primary/10 text-primary", Icon: FileText },
    { label: "Action Required", value: counts.action, tone: "bg-secondary/15 text-secondary", Icon: AlertCircle },
    { label: "Under Review", value: counts.review, tone: "bg-primary/10 text-primary", Icon: Clock },
    { label: "Accepted", value: counts.accepted, tone: "bg-mint/25 text-foreground", Icon: CheckCircle2 },
    { label: "Needs Correction", value: counts.correction, tone: "bg-coral/15 text-coral", Icon: AlertTriangle },
    { label: "Overdue", value: counts.overdue, tone: "bg-coral/15 text-coral", Icon: AlertTriangle },
    { label: "Managed by approvU", value: counts.managed, tone: "bg-muted text-foreground", Icon: ShieldCheck },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${it.tone}`}>
            <it.Icon className="h-4 w-4" />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{it.label}</p>
          <p className="text-xl font-semibold text-foreground">{it.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Next required action ────────────────────────────────────────────────
function NextRequiredActionCard({
  condition,
  onClick,
}: {
  condition: Condition;
  onClick: () => void;
}) {
  const tone = statusTone(condition.status);
  const isAction = ["Action Required", "Requested", "Needs Correction", "Overdue"].includes(
    condition.status,
  );
  return (
    <div className="rounded-2xl border border-border border-l-4 border-l-secondary bg-secondary/5 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-background p-2 text-secondary shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Next Required Action
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{condition.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{condition.borrowerInstruction}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${tone.cls}`}>
                <tone.Icon className="h-3 w-3" /> {tone.label}
              </span>
              {condition.dueDate && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Due {condition.dueDate}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClick}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isAction ? condition.ctaLabel ?? "Complete Now" : "View Conditions"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────
function ConditionsTabs({
  tab,
  onChange,
  counts,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
  counts: {
    total: number;
    action: number;
    review: number;
    accepted: number;
    correction: number;
    overdue: number;
    managed: number;
  };
}) {
  const tabs: { key: TabKey; count: number }[] = [
    { key: "Action Required", count: counts.action },
    { key: "Under Review", count: counts.review },
    { key: "Accepted", count: counts.accepted },
    { key: "Needs Correction", count: counts.correction },
    { key: "Overdue", count: counts.overdue },
    { key: "Managed by approvU", count: counts.managed },
    { key: "All Conditions", count: counts.total },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {t.key}
            <span
              className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
              }`}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Condition card ──────────────────────────────────────────────────────
function ConditionCard({
  condition,
  onAction,
}: {
  condition: Condition;
  onAction: () => void;
}) {
  const tone = statusTone(condition.status);
  const Cat = categoryIcon(condition.category);
  const isActionable = ["Action Required", "Requested", "Needs Correction", "Overdue"].includes(
    condition.status,
  );
  const reviewState = ["Uploaded", "Submitted", "Under Review", "Sent to Lender"].includes(
    condition.status,
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-3">
          <span className="rounded-lg bg-muted p-2 text-foreground">
            <Cat className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{condition.name}</p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${tone.cls}`}>
                <tone.Icon className="h-3 w-3" /> {tone.label}
              </span>
              {condition.priority === "Urgent" && (
                <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-coral-foreground">
                  Urgent
                </span>
              )}
              {condition.blocksClosing && condition.status !== "Accepted" && (
                <span className="rounded-full border border-coral/40 bg-coral/10 px-2 py-0.5 text-[10px] font-medium text-coral">
                  Blocks closing
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>{condition.category}</span>
              <span>·</span>
              <span>
                Applies to: {condition.appliesToName ?? condition.appliesTo}
              </span>
              <span>·</span>
              <span>{condition.requiredBy}</span>
              {condition.dueDate && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Due {condition.dueDate}
                  </span>
                </>
              )}
            </div>

            <p className="mt-2 text-xs text-foreground/80">{condition.borrowerInstruction}</p>

            {condition.reviewComment && (
              <div className="mt-3 rounded-lg border border-coral/30 bg-coral/10 p-3 text-xs text-foreground">
                <p className="font-semibold text-coral">Comment from approvU</p>
                <p className="mt-1 text-foreground/80">{condition.reviewComment}</p>
              </div>
            )}

            {condition.acceptedDate && (
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-mint" />
                Accepted {condition.acceptedDate}
                {condition.acceptedBy ? ` · by ${condition.acceptedBy}` : ""}
              </p>
            )}

            {condition.managedBy && (
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-primary" /> Handled by {condition.managedBy}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          {isActionable ? (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" /> {condition.ctaLabel ?? "Complete Now"}
            </button>
          ) : reviewState ? (
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
              No action needed
            </span>
          ) : null}
          <button
            onClick={onAction}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────
function EmptyConditionsState({ tab }: { tab: TabKey }) {
  const map: Record<TabKey, { title: string; msg: string }> = {
    "Action Required": {
      title: "No action required right now",
      msg: "We're reviewing your submitted items. We'll notify you if anything else is needed.",
    },
    "Under Review": {
      title: "Nothing under review",
      msg: "Items you submit for review will appear here.",
    },
    Accepted: {
      title: "No accepted conditions yet",
      msg: "Conditions accepted by approvU or the lender will appear here.",
    },
    "Needs Correction": {
      title: "Nothing needs correction",
      msg: "If a condition needs to be fixed, it will appear here with details.",
    },
    Overdue: {
      title: "Nothing overdue",
      msg: "You're on track. Keep an eye on upcoming due dates.",
    },
    "Managed by approvU": {
      title: "No third-party items",
      msg: "Items handled by approvU, the lender, solicitor, or insurer will appear here.",
    },
    "All Conditions": {
      title: "No funding conditions yet",
      msg: "Funding conditions will appear here after your lender approval is issued or accepted.",
    },
  };
  const { title, msg } = map[tab];
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
      <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">{msg}</p>
    </div>
  );
}

// ─── Closing timeline ────────────────────────────────────────────────────
function ClosingTimeline() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-primary">Closing Timeline</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Where you are in the journey from approval to funding.
      </p>
      <ol className="mt-5 space-y-4">
        {CLOSING_TIMELINE.map((s, i) => {
          const dot =
            s.state === "complete"
              ? "bg-mint text-mint-foreground"
              : s.state === "current"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground";
          const Glyph =
            s.state === "complete" ? CheckCircle2 : s.state === "current" ? Clock : Lock;
          return (
            <li key={s.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${dot}`}>
                  <Glyph className="h-3.5 w-3.5" />
                </span>
                {i < CLOSING_TIMELINE.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-border" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <p
                  className={`text-sm font-medium ${
                    s.state === "upcoming" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {s.label}
                </p>
                {s.state === "current" && (
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary">
                    Current stage
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Activity timeline ───────────────────────────────────────────────────
function ConditionActivityTimeline({ activity }: { activity: Activity[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-primary">Activity</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Updates to your funding conditions over time.
      </p>
      <ul className="mt-4 space-y-3">
        {activity.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
          >
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-3.5 w-3.5" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{a.event}</p>
                <p className="text-[11px] text-muted-foreground">{a.date}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {a.actor}
                {a.condition ? ` · ${a.condition}` : ""}
              </p>
              {a.details && <p className="mt-1 text-xs text-foreground/80">{a.details}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Help panel ──────────────────────────────────────────────────────────
function ConditionsHelpPanel() {
  return (
    <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-background p-2 text-secondary shadow-sm">
          <Info className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">What are funding conditions?</h3>
          <p className="mt-1 text-xs text-foreground/80">
            Funding conditions are items required by the lender, insurer, solicitor, or approvU
            before your mortgage can close. Some conditions require you to upload documents or
            confirm information. Others are handled by approvU or third parties.
          </p>
          <p className="mt-2 text-xs text-foreground/80">
            Completing conditions quickly helps avoid closing delays.
          </p>
          <button className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            <MessageCircle className="h-3.5 w-3.5" /> Contact approvU
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Complete drawer ─────────────────────────────────────────────────────
function CompleteConditionDrawer({
  condition,
  onClose,
  onSubmit,
}: {
  condition: Condition | null;
  onClose: () => void;
  onSubmit: (id: string, note?: string) => void;
}) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [textResponse, setTextResponse] = useState("");

  const open = !!condition;
  if (!condition) return null;
  const c = condition;

  const tone = statusTone(c.status);
  const requiresFile = ["file_upload", "select_existing_document"].includes(c.actionType);
  const requiresText = c.actionType === "text_response";
  const requiresCheckbox = c.actionType === "checkbox_confirmation";
  const requiresContact = c.actionType === "contact_details";

  function canSubmit() {
    if (requiresFile) return !!file;
    if (requiresText) return textResponse.trim().length > 0;
    if (requiresCheckbox) return confirmed;
    if (requiresContact) return textResponse.trim().length > 0 || !!file;
    return true;
  }

  function handleSubmit() {
    if (!canSubmit()) {
      toast.error("Please complete the required information.");
      return;
    }
    onSubmit(c.id, note.trim() || undefined);
    setNote("");
    setFile(null);
    setConfirmed(false);
    setTextResponse("");
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Complete Condition</SheetTitle>
          <SheetDescription>
            Submit the requested information to satisfy this funding condition.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{condition.name}</p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${tone.cls}`}>
                <tone.Icon className="h-3 w-3" /> {tone.label}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {condition.category} · Applies to {condition.appliesToName ?? condition.appliesTo} ·{" "}
              {condition.requiredBy}
              {condition.dueDate ? ` · Due ${condition.dueDate}` : ""}
            </p>
            <p className="mt-3 text-sm text-foreground/90">{condition.borrowerInstruction}</p>

            {condition.reviewComment && (
              <div className="mt-3 rounded-lg border border-coral/30 bg-coral/10 p-3 text-xs">
                <p className="font-semibold text-coral">approvU asked you to fix this</p>
                <p className="mt-1 text-foreground/80">{condition.reviewComment}</p>
              </div>
            )}
          </div>

          {requiresFile && (
            <div>
              <label className="text-xs font-semibold text-foreground">Upload document</label>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-6 text-center hover:bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground">
                  {file ? file.name : "Drag and drop or click to browse"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  PDF, JPG, PNG, DOC, XLS · max 25MB
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 25 * 1024 * 1024) {
                      toast.error("File exceeds 25MB.");
                      return;
                    }
                    setFile(f);
                  }}
                />
              </label>
            </div>
          )}

          {requiresText && (
            <div>
              <label className="text-xs font-semibold text-foreground">Your response</label>
              <textarea
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                rows={4}
                placeholder="Provide your explanation…"
                className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}

          {requiresCheckbox && (
            <label className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-xs text-foreground">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              I confirm the information above is accurate.
            </label>
          )}

          {requiresContact && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Provider details</label>
              <input
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                placeholder="Name, firm, email, phone…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-primary hover:underline">
                <Upload className="h-3.5 w-3.5" />
                {file ? file.name : "Attach supporting document (optional)"}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
              </label>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-foreground">Add a note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything approvU should know…"
              className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {condition.comments && condition.comments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground">Comments</p>
              <ul className="mt-2 space-y-2">
                {condition.comments.map((c, i) => (
                  <li key={i} className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{c.author}</p>
                      <p className="text-[11px] text-muted-foreground">{c.date}</p>
                    </div>
                    <p className="mt-1 text-foreground/80">{c.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" /> Submit for Review
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}