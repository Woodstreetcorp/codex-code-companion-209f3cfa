import { useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Flag,
  Home,
  Info,
  Lock,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Upload,
  UserCircle2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────
type ResponseStatus =
  | "Approved"
  | "Approved with Conditions"
  | "Declined"
  | "More Information Required"
  | "Under Review"
  | "Borrower Decision Required";

type DecisionPermission = "View Only" | "Comment Only" | "Decision Maker" | "Primary Decision Maker";

type ProductStatus =
  | "Currently Under Review"
  | "Available for Resubmission"
  | "Previously Rejected"
  | "Already Reviewed"
  | "Expired"
  | "Not Available";

type View =
  | "landing"
  | "reject"
  | "alternatives"
  | "confirmation-accept"
  | "confirmation-alternative";

type Comparison = {
  key: string;
  label: string;
  requested: string;
  approved: string;
  note: string;
  changed: boolean;
};

type Condition = {
  label: string;
  status: "Required" | "Accepted" | "Under Review";
  due?: string;
};

type AltProduct = {
  id: string;
  priority: number;
  name: string;
  path: string;
  rate: string;
  payment: string;
  term: string;
  rateType: string;
  bundle: string;
  status: ProductStatus;
};

type Activity = {
  date: string;
  title: string;
  by?: string;
  tone: "complete" | "active" | "pending";
};

type Message = {
  date: string;
  sender: string;
  body: string;
  related?: string;
};

// ─── Mock data ───────────────────────────────────────────────────────────
const APP = {
  id: "APP-2041",
  transaction: "Purchase",
  property: "123 Maple Ave, Toronto, ON",
  submittedProduct: "Best Value Fixed Offer",
  status: "Borrower Decision Required" as ResponseStatus,
  publishedDate: "May 11, 2026",
  estimatedClosing: "June 28, 2026",
  advisor: "Priya Shah, approvU Advisor",
};

const APPROVAL = {
  status: "Approved with Conditions" as ResponseStatus,
  productName: "Best Value Fixed Offer",
  lenderPath: "Mortgage Trust Path",
  amount: "$450,000",
  rate: "5.39%",
  apr: "5.47%",
  monthly: "$2,510",
  paymentFrequency: "Monthly",
  term: "5 Years",
  termType: "Closed",
  rateType: "Fixed",
  amortization: "25 Years",
  mortgageType: "Conventional",
  lenderFee: "$0",
  brokerageFee: "$0",
  insurancePremium: "N/A",
  closingDate: "June 28, 2026",
  expiry: "June 30, 2026",
  conditionsCount: 5,
  documentsRequired: 3,
  bundleStatus: "Eligible — $2,350 in benefits",
};

const COMPARISON: Comparison[] = [
  { key: "amount", label: "Mortgage Amount", requested: "$450,000", approved: "$450,000", note: "No change", changed: false },
  { key: "rate", label: "Interest Rate", requested: "5.25%", approved: "5.39%", note: "Updated after lender review", changed: true },
  { key: "payment", label: "Monthly Payment", requested: "$2,468", approved: "$2,510", note: "Based on approved rate", changed: true },
  { key: "term", label: "Term", requested: "5 Years", approved: "5 Years", note: "No change", changed: false },
  { key: "rateType", label: "Rate Type", requested: "Fixed", approved: "Fixed", note: "No change", changed: false },
  { key: "amortization", label: "Amortization", requested: "25 Years", approved: "25 Years", note: "No change", changed: false },
  { key: "frequency", label: "Payment Frequency", requested: "Monthly", approved: "Monthly", note: "No change", changed: false },
  { key: "lenderFee", label: "Lender Fee", requested: "$0", approved: "$0", note: "No change", changed: false },
  { key: "closing", label: "Closing Date", requested: "June 30, 2026", approved: "June 28, 2026", note: "Earlier than requested", changed: true },
  { key: "conditions", label: "Conditions", requested: "—", approved: "5 outstanding", note: "Standard for this lender", changed: true },
  { key: "bundle", label: "Home Life Bundle", requested: "Eligible", approved: "Eligible", note: "$2,350 in benefits", changed: false },
];

const CONDITIONS: Condition[] = [
  { label: "Home insurance binder", status: "Required", due: "Jun 14, 2026" },
  { label: "Updated paystub (last 30 days)", status: "Required", due: "Jun 10, 2026" },
  { label: "Signed mortgage commitment", status: "Required", due: "Jun 18, 2026" },
  { label: "Solicitor information", status: "Accepted" },
  { label: "Void cheque for PAD", status: "Required", due: "Jun 14, 2026" },
];

const REJECTION_REASONS = [
  { id: "rate", label: "Rate too high", desc: "The approved interest rate does not meet my expectations." },
  { id: "payment", label: "Monthly payment too high", desc: "The approved payment is higher than I am comfortable with." },
  { id: "product", label: "Wrong product type", desc: "This mortgage product does not fit my needs." },
  { id: "lender", label: "Prefer different lender or product path", desc: "I would like to explore one of my other selected options." },
  { id: "terms", label: "Terms not suitable", desc: "The loan terms do not align with my requirements." },
  { id: "closing", label: "Closing date does not work", desc: "The estimated closing date does not fit my timeline." },
  { id: "fees", label: "Fees or costs too high", desc: "The lender, broker, legal, appraisal, or other fees are too high." },
  { id: "conditions", label: "Conditions are too difficult", desc: "I do not believe I can satisfy the required conditions." },
  { id: "personal", label: "Personal circumstances changed", desc: "My situation has changed since applying." },
  { id: "other", label: "Other reason", desc: "I have another reason." },
];

const AMENDMENTS = [
  { id: "lower_rate", label: "Lower interest rate" },
  { id: "lower_payment", label: "Lower monthly payment" },
  { id: "term_length", label: "Different term length" },
  { id: "rate_type", label: "Different rate type" },
  { id: "lower_fees", label: "Lower fees" },
  { id: "amortization", label: "Different amortization" },
  { id: "closing_date", label: "Different closing date" },
  { id: "lender", label: "Different lender / product" },
  { id: "conditions", label: "Fewer or clearer conditions" },
  { id: "lower_amount", label: "Lower mortgage amount" },
  { id: "higher_amount", label: "Higher mortgage amount" },
  { id: "frequency", label: "Different payment frequency" },
  { id: "other", label: "Other" },
];

const INITIAL_ALTS: AltProduct[] = [
  {
    id: "alt-1",
    priority: 1,
    name: "Best Value Fixed Offer",
    path: "Mortgage Trust Path",
    rate: "5.39%",
    payment: "$2,510/mo",
    term: "5 Years",
    rateType: "Fixed",
    bundle: "$2,350",
    status: "Currently Under Review",
  },
  {
    id: "alt-2",
    priority: 2,
    name: "Flexible Lending Offer",
    path: "Credit Union Path",
    rate: "5.10%",
    payment: "$2,432/mo",
    term: "5 Years",
    rateType: "Fixed",
    bundle: "$2,425",
    status: "Available for Resubmission",
  },
  {
    id: "alt-3",
    priority: 3,
    name: "Short-Term Saver Offer",
    path: "Monoline Lender Path",
    rate: "4.89%",
    payment: "$2,398/mo",
    term: "3 Years",
    rateType: "Fixed",
    bundle: "$1,950",
    status: "Available for Resubmission",
  },
];

const MESSAGES: Message[] = [
  {
    date: "May 11, 2026",
    sender: "Priya Shah, approvU Advisor",
    body: "Your approval came back from Mortgage Trust. Rate moved up slightly due to verified debt ratios — happy to walk you through it.",
    related: "Best Value Fixed Offer",
  },
  {
    date: "May 10, 2026",
    sender: "approvU System",
    body: "Your application has been submitted to Mortgage Trust for underwriting review.",
  },
];

const TIMELINE: Activity[] = [
  { date: "May 8, 2026 · 10:14 AM", title: "Application submitted for lender review", tone: "complete" },
  { date: "May 9, 2026 · 9:02 AM", title: "Lender confirmed file in review", by: "Mortgage Trust", tone: "complete" },
  { date: "May 11, 2026 · 2:48 PM", title: "Lender response received", by: "Mortgage Trust", tone: "complete" },
  { date: "May 11, 2026 · 3:05 PM", title: "Approval published to borrower portal", by: "approvU", tone: "complete" },
  { date: "May 12, 2026 · 8:21 AM", title: "Borrower viewed approval", tone: "active" },
  { date: "Pending", title: "Borrower decision", tone: "pending" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
function statusBadgeCls(s: ResponseStatus | ProductStatus | "Required" | "Accepted" | "Under Review") {
  switch (s) {
    case "Approved":
    case "Accepted":
    case "Available for Resubmission":
      return "bg-mint/20 text-foreground";
    case "Approved with Conditions":
    case "Currently Under Review":
    case "Under Review":
      return "bg-secondary/15 text-secondary";
    case "Borrower Decision Required":
    case "More Information Required":
    case "Required":
      return "bg-yellow/25 text-foreground";
    case "Declined":
    case "Previously Rejected":
    case "Expired":
    case "Not Available":
      return "bg-coral/15 text-coral";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// ─── Main ────────────────────────────────────────────────────────────────
export function LenderResponseContent({
  permission = "Primary Decision Maker",
  unlocked = true,
}: { permission?: DecisionPermission; unlocked?: boolean }) {
  const [view, setView] = useState<View>("landing");
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptedSummary, setAcceptedSummary] = useState<{ comment: string } | null>(null);
  const [alts, setAlts] = useState<AltProduct[]>(INITIAL_ALTS);
  const [chosenAltId, setChosenAltId] = useState<string | null>(null);
  const [confirmAltId, setConfirmAltId] = useState<string | null>(null);

  const canDecide = permission === "Decision Maker" || permission === "Primary Decision Maker";

  if (!unlocked) {
    return (
      <LenderResponseLockedState />
    );
  }

  const goReject = () => setView("reject");
  const goAlternatives = () => setView("alternatives");

  const handleAcceptConfirmed = (comment: string) => {
    setAcceptedSummary({ comment });
    setAcceptOpen(false);
    setView("confirmation-accept");
    toast.success("Approval accepted", { description: "Funding conditions are now unlocked." });
  };

  const handleRejectSubmitted = () => {
    setAlts((prev) =>
      prev.map((p) => (p.priority === 1 ? { ...p, status: "Previously Rejected" } : p)),
    );
    setView("alternatives");
    toast.success("Decision recorded", { description: "Choose a backup product to send for review." });
  };

  const handleAltSelected = (id: string) => {
    setChosenAltId(id);
    setAlts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Currently Under Review" } : p)));
    setConfirmAltId(null);
    setView("confirmation-alternative");
    toast.success("Sent to approvU", { description: "We'll review your selection and follow up." });
  };

  return (
    <div className="space-y-6">
      {view === "landing" && (
        <LandingView
          canDecide={canDecide}
          permission={permission}
          onAccept={() => setAcceptOpen(true)}
          onReject={goReject}
        />
      )}
      {view === "reject" && (
        <RejectView onCancel={() => setView("landing")} onSubmit={handleRejectSubmitted} />
      )}
      {view === "alternatives" && (
        <AlternativesView
          alts={alts}
          onBack={() => setView("landing")}
          onSelect={(id) => setConfirmAltId(id)}
        />
      )}
      {view === "confirmation-accept" && (
        <AcceptConfirmationView
          comment={acceptedSummary?.comment ?? ""}
          onBack={() => setView("landing")}
        />
      )}
      {view === "confirmation-alternative" && (
        <AltConfirmationView
          chosen={alts.find((a) => a.id === chosenAltId) ?? null}
          onBack={() => setView("landing")}
        />
      )}

      <AcceptApprovalModal
        open={acceptOpen}
        onClose={() => setAcceptOpen(false)}
        onConfirm={handleAcceptConfirmed}
      />
      <AlternativeSelectionModal
        product={alts.find((a) => a.id === confirmAltId) ?? null}
        onClose={() => setConfirmAltId(null)}
        onConfirm={(id) => handleAltSelected(id)}
      />
    </div>
  );
}

// ─── Landing View ────────────────────────────────────────────────────────
function LandingView({
  canDecide,
  permission,
  onAccept,
  onReject,
}: {
  canDecide: boolean;
  permission: DecisionPermission;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <>
      <Header />
      <ApprovalStatusBanner status={APPROVAL.status} />
      {!canDecide && <DecisionPermissionNotice permission={permission} />}

      <ApprovalDetailsCard />
      <ApprovedProductCard />
      <RequestedVsApprovedTermsTable />
      <ApprovalConditionsPreview canViewConditions={false} />

      <BorrowerDecisionPanel canDecide={canDecide} onAccept={onAccept} onReject={onReject} />

      <BorrowerVisibleMessagesPanel />
      <LenderResponseActivityTimeline />
    </>
  );
}

function Header() {
  return (
    <header className="rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/85 p-6 text-primary-foreground shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70">
            Mortgage Application Hub
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Lender Response</h1>
          <p className="mt-1 max-w-xl text-sm text-primary-foreground/80">
            Review the lender's decision and choose how you would like to proceed.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            APP.status === "Borrower Decision Required"
              ? "bg-yellow/25 text-foreground"
              : "bg-primary-foreground/15 text-primary-foreground"
          }`}
        >
          {APP.status}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <Meta icon={FileText} label="Application">
          {APP.id} · {APP.transaction}
        </Meta>
        <Meta icon={Home} label="Property">
          {APP.property}
        </Meta>
        <Meta icon={Calendar} label="Estimated closing">
          {APP.estimatedClosing}
        </Meta>
        <Meta icon={UserCircle2} label="Advisor">
          {APP.advisor}
        </Meta>
      </dl>
      <p className="mt-4 text-[11px] text-primary-foreground/70">
        Response published {APP.publishedDate} · Submitted product: {APP.submittedProduct}
      </p>
    </header>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary-foreground/70">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-1 text-sm font-medium text-primary-foreground">{children}</p>
    </div>
  );
}

function ApprovalStatusBanner({ status }: { status: ResponseStatus }) {
  const map: Record<
    ResponseStatus,
    { title: string; body: string; tone: "good" | "warn" | "bad" | "info"; Icon: ComponentType<{ className?: string }> }
  > = {
    Approved: {
      title: "Your mortgage application has been approved",
      body:
        "Please review the approval terms below. If everything looks good, you can accept the approval and move to the next step.",
      tone: "good",
      Icon: CheckCircle2,
    },
    "Approved with Conditions": {
      title: "Your mortgage application has been approved with conditions",
      body:
        "You can accept the approval and then complete the required funding conditions before closing.",
      tone: "good",
      Icon: CheckCircle2,
    },
    Declined: {
      title: "This lender was unable to approve your application",
      body:
        "You may still have other selected mortgage products available. Review your options below or contact approvU for next steps.",
      tone: "bad",
      Icon: XCircle,
    },
    "More Information Required": {
      title: "The lender needs more information",
      body: "Please upload or provide the requested information so your application can continue.",
      tone: "warn",
      Icon: AlertCircle,
    },
    "Under Review": {
      title: "Your application is still under review",
      body: "We'll notify you the moment the lender publishes a decision.",
      tone: "info",
      Icon: Clock,
    },
    "Borrower Decision Required": {
      title: "Your decision is needed",
      body: "Review the approval below and let us know how you'd like to proceed.",
      tone: "warn",
      Icon: Flag,
    },
  };
  const m = map[status];
  const tone = {
    good: "border-mint/40 bg-mint/15",
    warn: "border-yellow/50 bg-yellow/15",
    bad: "border-coral/30 bg-coral/10",
    info: "border-secondary/30 bg-secondary/10",
  }[m.tone];
  const iconTone = {
    good: "text-foreground",
    warn: "text-foreground",
    bad: "text-coral",
    info: "text-secondary",
  }[m.tone];
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${tone}`}>
      <m.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} />
      <div>
        <p className="text-sm font-semibold text-foreground">{m.title}</p>
        <p className="mt-0.5 text-xs text-foreground/80">{m.body}</p>
      </div>
    </div>
  );
}

function DecisionPermissionNotice({ permission }: { permission: DecisionPermission }) {
  return (
    <div className="flex gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground/80">
      <Info className="h-4 w-4 shrink-0 text-secondary" />
      <p>
        Your access level is <span className="font-semibold">{permission}</span>. You can view this
        response, but only the primary applicant or authorized decision maker can accept or decline.
      </p>
    </div>
  );
}

function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-primary">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function ApprovalDetailsCard() {
  const items: { label: string; value: string; tone?: "primary" | "mint" }[] = [
    { label: "Status", value: APPROVAL.status, tone: "primary" },
    { label: "Approved Amount", value: APPROVAL.amount, tone: "primary" },
    { label: "Interest Rate", value: `${APPROVAL.rate} ${APPROVAL.rateType}` },
    { label: "APR", value: APPROVAL.apr },
    { label: "Monthly Payment", value: APPROVAL.monthly, tone: "mint" },
    { label: "Payment Frequency", value: APPROVAL.paymentFrequency },
    { label: "Term", value: `${APPROVAL.term} ${APPROVAL.termType}` },
    { label: "Amortization", value: APPROVAL.amortization },
    { label: "Mortgage Type", value: APPROVAL.mortgageType },
    { label: "Estimated Closing Date", value: APPROVAL.closingDate },
    { label: "Approval Expires", value: APPROVAL.expiry },
    { label: "Conditions Outstanding", value: `${APPROVAL.conditionsCount}` },
    { label: "Documents Required", value: `${APPROVAL.documentsRequired}` },
    { label: "Home Life Bundle", value: APPROVAL.bundleStatus },
  ];
  return (
    <Card title="Approval Details">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-border bg-background/60 p-3">
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{it.label}</dt>
            <dd
              className={`mt-1 text-sm font-semibold ${
                it.tone === "mint" ? "text-foreground" : it.tone === "primary" ? "text-primary" : "text-foreground"
              }`}
            >
              {it.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ApprovedProductCard() {
  return (
    <Card title="Approved Mortgage Product">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary/10 via-card to-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-secondary">
              {APPROVAL.lenderPath}
            </span>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{APPROVAL.productName}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {APPROVAL.term} · {APPROVAL.rateType} · {APPROVAL.amortization} amortization
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeCls(APPROVAL.status)}`}>
            {APPROVAL.status}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Rate" value={APPROVAL.rate} sub={APPROVAL.rateType} />
          <Stat label="Monthly Payment" value={APPROVAL.monthly} sub={APPROVAL.paymentFrequency} />
          <Stat label="Approved Amount" value={APPROVAL.amount} sub={`Closes ${APPROVAL.closingDate}`} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Lender Fee" value={APPROVAL.lenderFee} />
          <Stat label="Brokerage Fee" value={APPROVAL.brokerageFee} />
          <Stat label="Default Insurance" value={APPROVAL.insurancePremium} />
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-yellow/15 p-3 text-xs text-foreground/80">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Your approved terms may differ from your original estimated offer because your full
          application was reviewed using verified details.
        </p>
      </div>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-background/70 p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function RequestedVsApprovedTermsTable() {
  return (
    <Card title="Requested vs Approved Terms">
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="hidden grid-cols-12 gap-2 bg-muted px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:grid">
          <div className="col-span-3">Item</div>
          <div className="col-span-3">Requested</div>
          <div className="col-span-3">Approved</div>
          <div className="col-span-3">Notes</div>
        </div>
        <ul className="divide-y divide-border">
          {COMPARISON.map((row) => (
            <li key={row.key} className="grid grid-cols-1 gap-2 px-4 py-3 text-sm sm:grid-cols-12 sm:items-center">
              <div className="col-span-3 text-xs font-semibold text-foreground sm:text-sm">{row.label}</div>
              <div className="col-span-3 text-foreground">{row.requested}</div>
              <div className="col-span-3 flex items-center gap-2">
                <span className={`font-semibold ${row.changed ? "text-secondary" : "text-foreground"}`}>
                  {row.approved}
                </span>
                {row.changed && (
                  <span className="rounded-full bg-secondary/15 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                    Changed
                  </span>
                )}
              </div>
              <div className="col-span-3 text-xs text-muted-foreground">{row.note}</div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function ApprovalConditionsPreview({ canViewConditions }: { canViewConditions: boolean }) {
  const required = CONDITIONS.filter((c) => c.status === "Required").length;
  const review = CONDITIONS.filter((c) => c.status === "Under Review").length;
  const accepted = CONDITIONS.filter((c) => c.status === "Accepted").length;
  return (
    <Card title="Conditions Required Before Closing">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total" value={`${CONDITIONS.length}`} />
        <Stat label="Action Required" value={`${required}`} sub="Awaiting borrower" />
        <Stat label="Under Review" value={`${review}`} />
        <Stat label="Accepted" value={`${accepted}`} />
      </div>
      <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
        {CONDITIONS.map((c) => (
          <li key={c.label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-4 w-4 text-secondary" />
              <div>
                <p className="font-medium text-foreground">{c.label}</p>
                {c.due && <p className="text-[11px] text-muted-foreground">Due {c.due}</p>}
              </div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeCls(c.status)}`}>
              {c.status}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          {canViewConditions
            ? "Open the Funding Conditions page to start completing each item."
            : "Available after you accept the approval."}
        </p>
        <button
          disabled={!canViewConditions}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          View Funding Conditions <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}

function BorrowerDecisionPanel({
  canDecide,
  onAccept,
  onReject,
}: { canDecide: boolean; onAccept: () => void; onReject: () => void }) {
  return (
    <section className="rounded-2xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/10 to-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-secondary/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-secondary">
            Action required
          </span>
          <h2 className="mt-2 text-lg font-semibold text-primary">How would you like to proceed?</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Accept the approval to move toward funding conditions, or decline to switch to one of
            your previously selected mortgage products.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onAccept}
          disabled={!canDecide}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ThumbsUp className="h-4 w-4" /> Accept Approval
        </button>
        <button
          onClick={onReject}
          disabled={!canDecide}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-input bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ThumbsDown className="h-4 w-4" /> Decline or Request Changes
        </button>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> A short comment is required for every decision.
      </p>
    </section>
  );
}

function BorrowerVisibleMessagesPanel() {
  return (
    <Card title="Messages from approvU">
      <ul className="space-y-3">
        {MESSAGES.map((m, i) => (
          <li key={i} className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <MessageCircle className="h-3.5 w-3.5 text-secondary" /> {m.sender}
              </span>
              <span>{m.date}</span>
            </div>
            <p className="mt-2 text-sm text-foreground">{m.body}</p>
            {m.related && (
              <p className="mt-1 text-[11px] text-muted-foreground">Related: {m.related}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LenderResponseActivityTimeline() {
  return (
    <Card title="Activity Timeline">
      <ol className="space-y-4">
        {TIMELINE.map((t, i) => {
          const dot =
            t.tone === "complete"
              ? "bg-mint text-mint-foreground"
              : t.tone === "active"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground";
          const Glyph = t.tone === "complete" ? CheckCircle2 : t.tone === "active" ? Clock : Flag;
          return (
            <li key={i} className="relative flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${dot}`}>
                  <Glyph className="h-3.5 w-3.5" />
                </span>
                {i !== TIMELINE.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-1">
                <p className="text-sm font-medium text-foreground">{t.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {t.date}
                  {t.by && ` · ${t.by}`}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function LenderResponseLockedState() {
  return (
    <section className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-primary">Lender Response is locked</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        We'll unlock this page as soon as approvU publishes the lender's decision for your
        application. You'll get an email and an in-portal notification.
      </p>
    </section>
  );
}

// ─── Accept Modal ────────────────────────────────────────────────────────
function AcceptApprovalModal({
  open,
  onClose,
  onConfirm,
}: { open: boolean; onClose: () => void; onConfirm: (comment: string) => void }) {
  const [ack, setAck] = useState(false);
  const [comment, setComment] = useState("");
  const valid = ack && comment.trim().length >= 5;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Accept this approval?</DialogTitle>
          <DialogDescription>
            By accepting, you confirm that you want approvU to continue with this approved mortgage
            option. You'll still need to satisfy lender conditions before closing.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <SummaryRow label="Product" value={APPROVAL.productName} />
            <SummaryRow label="Rate" value={`${APPROVAL.rate} ${APPROVAL.rateType}`} />
            <SummaryRow label="Monthly Payment" value={APPROVAL.monthly} />
            <SummaryRow label="Term" value={APPROVAL.term} />
            <SummaryRow label="Closing" value={APPROVAL.closingDate} />
            <SummaryRow label="Conditions" value={`${APPROVAL.conditionsCount} outstanding`} />
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            I understand that this approval is subject to satisfying lender and closing conditions.
          </span>
        </label>

        <div>
          <label className="text-xs font-semibold text-foreground">
            Add a short comment confirming your decision <span className="text-coral">*</span>
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Example: I accept the approval and would like to proceed."
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Minimum 5 characters.</p>
        </div>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => valid && onConfirm(comment.trim())}
            disabled={!valid}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <ThumbsUp className="h-4 w-4" /> Accept Approval
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

// ─── Reject View ─────────────────────────────────────────────────────────
function RejectView({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: () => void }) {
  const [reason, setReason] = useState<string>("");
  const [comment, setComment] = useState("");
  const [ack, setAck] = useState(false);
  const [amendments, setAmendments] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Record<string, string>>({});

  const validComment = comment.trim().length >= 10;
  const valid = !!reason && validComment && ack;

  return (
    <>
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to lender response
      </button>

      <header>
        <h1 className="text-2xl font-semibold text-primary sm:text-3xl">Reject Approval</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Help us understand why this approval does not work for you.
        </p>
      </header>

      <div className="flex gap-3 rounded-2xl border border-yellow/50 bg-yellow/15 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">Before you proceed</p>
          <p className="mt-0.5 text-xs text-foreground/80">
            Rejecting this approval will close this lender approval path. You may still select
            another previously chosen mortgage product for review.
          </p>
        </div>
      </div>

      <Card title="Approval Being Rejected">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Lender Path" value={APPROVAL.lenderPath} />
          <Stat label="Rate" value={APPROVAL.rate} />
          <Stat label="Approved Amount" value={APPROVAL.amount} />
          <Stat label="Term" value={APPROVAL.term} />
          <Stat label="Monthly Payment" value={APPROVAL.monthly} />
          <Stat label="Closing" value={APPROVAL.closingDate} />
        </div>
      </Card>

      <Card title="Why are you rejecting this approval?">
        <ul className="space-y-2">
          {REJECTION_REASONS.map((r) => (
            <li key={r.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  reason === r.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-secondary/40 hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r.id}
                  onChange={() => setReason(r.id)}
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <label className="text-xs font-semibold text-foreground">
            Tell us more <span className="text-coral">*</span>
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Please explain why you are rejecting this approval or what you would like changed."
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Minimum 10 characters.</p>
        </div>
      </Card>

      <Card title="What would you like amended?">
        <p className="mb-3 text-xs text-muted-foreground">
          Select any terms you would like approvU to review or renegotiate, if possible.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {AMENDMENTS.map((a) => {
            const checked = !!amendments[a.id];
            return (
              <div key={a.id} className="rounded-xl border border-border p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setAmendments((p) => ({ ...p, [a.id]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-input"
                  />
                  <span className="font-medium text-foreground">{a.label}</span>
                </label>
                {checked && (
                  <input
                    value={details[a.id] ?? ""}
                    onChange={(e) => setDetails((p) => ({ ...p, [a.id]: e.target.value }))}
                    placeholder="Optional preferred value or notes"
                    className="mt-2 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <label className="flex items-start gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            I understand that rejecting this approval may close this approval path and may require
            my application to be reviewed with another selected mortgage product.
          </span>
        </label>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => valid && onSubmit()}
            disabled={!valid}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Submit Rejection &amp; View Alternatives <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </>
  );
}

// ─── Alternatives View ───────────────────────────────────────────────────
function AlternativesView({
  alts,
  onBack,
  onSelect,
}: { alts: AltProduct[]; onBack: () => void; onSelect: (id: string) => void }) {
  const remaining = useMemo(
    () => alts.filter((p) => p.status === "Available for Resubmission"),
    [alts],
  );

  return (
    <>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to lender response
      </button>

      <header>
        <h1 className="text-2xl font-semibold text-primary sm:text-3xl">Choose Another Mortgage Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select one of your previously selected mortgage products for approvU to review next.
        </p>
      </header>

      {remaining.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              No backup products available
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
              You do not have any remaining selected mortgage products available for resubmission.
              You can contact approvU to review new options.
            </p>
            <div className="mt-4 flex flex-col-reverse justify-center gap-2 sm:flex-row">
              <button
                onClick={onBack}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Back to Application Hub
              </button>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Request New Product Review
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alts.map((p) => (
            <AlternativeProductCard key={p.id} product={p} onSelect={() => onSelect(p.id)} />
          ))}
        </div>
      )}
    </>
  );
}

function AlternativeProductCard({
  product,
  onSelect,
}: { product: AltProduct; onSelect: () => void }) {
  const selectable = product.status === "Available for Resubmission";
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
              Priority {product.priority}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeCls(product.status)}`}>
              {product.status}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-foreground">{product.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {product.path} · {product.term} · {product.rateType}
          </p>
        </div>
        <button
          onClick={onSelect}
          disabled={!selectable}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Select for Review <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Stat label="Estimated Rate" value={product.rate} />
        <Stat label="Estimated Payment" value={product.payment} />
        <Stat label="Term" value={product.term} />
        <Stat label="Bundle Value" value={product.bundle} />
      </div>
    </article>
  );
}

function AlternativeSelectionModal({
  product,
  onClose,
  onConfirm,
}: { product: AltProduct | null; onClose: () => void; onConfirm: (id: string) => void }) {
  const [comment, setComment] = useState("");
  const valid = comment.trim().length >= 5;
  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit this product for review?</DialogTitle>
          <DialogDescription>
            approvU will review this product as your next preferred option. Your application will
            not be sent automatically until our team confirms it is ready.
          </DialogDescription>
        </DialogHeader>
        {product && (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
            <SummaryRow label="Product" value={product.name} />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {product.path} · {product.term} · {product.rate}
            </p>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-foreground">
            Add a note for approvU <span className="text-coral">*</span>
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything we should know before reviewing this product?"
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => valid && product && onConfirm(product.id)}
            disabled={!valid}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Select This Product
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirmation Views ──────────────────────────────────────────────────
function AcceptConfirmationView({ comment, onBack }: { comment: string; onBack: () => void }) {
  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-mint/40 bg-gradient-to-br from-mint/30 via-card to-card p-6 shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-mint/40 text-foreground">
          <PartyPopper className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-primary sm:text-3xl">
          Congratulations — Your Approval Has Been Accepted
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/80">
          You've accepted your mortgage approval. The next step is to complete any required funding
          conditions and upload outstanding documents so your file can move toward closing.
        </p>
      </section>

      <Card title="Approval Summary">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Product" value={APPROVAL.productName} sub={APPROVAL.lenderPath} />
          <Stat label="Approved Amount" value={APPROVAL.amount} />
          <Stat label="Rate" value={`${APPROVAL.rate} ${APPROVAL.rateType}`} />
          <Stat label="Monthly Payment" value={APPROVAL.monthly} sub={APPROVAL.paymentFrequency} />
          <Stat label="Estimated Closing" value={APPROVAL.closingDate} />
          <Stat label="Conditions Outstanding" value={`${APPROVAL.conditionsCount}`} sub={`${APPROVAL.documentsRequired} documents required`} />
        </div>
        {comment && (
          <p className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground/80">
            <span className="font-semibold">Your comment:</span> {comment}
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <NextStepCard
          icon={ClipboardCheck}
          tone="primary"
          title="Complete your funding conditions"
          body={`${APPROVAL.conditionsCount} items remain. Each one moves your file closer to closing on ${APPROVAL.closingDate}.`}
          cta="View Funding Conditions"
        />
        <NextStepCard
          icon={Upload}
          tone="secondary"
          title="Upload required documents"
          body={`${APPROVAL.documentsRequired} documents are still needed to satisfy this approval.`}
          cta="Upload Documents"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-foreground/80">
            <Sparkles className="h-4 w-4 text-secondary" />
            approvU will continue to guide you through the closing process.
          </p>
          <button
            onClick={onBack}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Back to Application Hub
          </button>
        </div>
      </Card>
    </>
  );
}

function AltConfirmationView({
  chosen,
  onBack,
}: { chosen: AltProduct | null; onBack: () => void }) {
  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/15 via-card to-card p-6 shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20 text-secondary">
          <Award className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-primary sm:text-3xl">
          Your alternative product has been selected
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/80">
          We've saved your selection and notified the approvU team. We'll review your file and let
          you know the next step.
        </p>
      </section>

      {chosen && (
        <Card title="Selected for Review">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Product" value={chosen.name} sub={chosen.path} />
            <Stat label="Estimated Rate" value={chosen.rate} sub={chosen.rateType} />
            <Stat label="Estimated Payment" value={chosen.payment} />
            <Stat label="Term" value={chosen.term} />
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-foreground/80">
            <Building2 className="h-4 w-4 text-secondary" />
            We'll reach out within one business day with next steps.
          </p>
          <button
            onClick={onBack}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Back to Application Hub
          </button>
        </div>
      </Card>
    </>
  );
}

function NextStepCard({
  icon: Icon,
  tone,
  title,
  body,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: "primary" | "secondary";
  title: string;
  body: string;
  cta: string;
}) {
  const toneCls = tone === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary";
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      <button className="mt-4 inline-flex items-center gap-1 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}