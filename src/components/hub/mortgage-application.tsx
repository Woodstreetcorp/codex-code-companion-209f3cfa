import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  DollarSign,
  FileSignature,
  Gift,
  Home,
  Info,
  Lock,
  Mail,
  MapPin,
  PiggyBank,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wallet,
} from "lucide-react";

type TxType = "Purchase" | "Pre-Purchase" | "Refinance" | "Renewal";

type WidgetStatus =
  | "Complete"
  | "In Progress"
  | "Not Started"
  | "Waiting for Co-Applicant"
  | "Invite Sent"
  | "Selected"
  | "Locked"
  | "Needs Review";

type Widget = {
  id: string;
  group: "Borrowers" | "Property & Financing" | "Mortgage & Submission";
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  description: string;
  progress: number;
  status: WidgetStatus;
  cta: string;
  meta?: string;
  locked?: boolean;
};

const APPLICATION = {
  id: "APP-2041",
  type: "Purchase" as TxType,
  status: "In Progress",
  selectedOffer: "Best Value Fixed Offer",
  completion: 60,
  sectionsComplete: 4,
  totalSections: 8,
  expiresInDays: 8,
  lastUpdated: "Today, 2:14 PM",
};

const SELECTED_OFFER = {
  name: "Best Value Fixed Offer",
  path: "Monoline Lender Path · 5-Year Fixed",
  rate: "4.89%",
  monthly: "$2,358",
  bundle: "$2,350",
};

const PURCHASE_WIDGETS: Widget[] = [
  {
    id: "borrower-david",
    group: "Borrowers",
    icon: User,
    title: "About David Scott",
    subtitle: "Primary Applicant",
    description: "Personal details, address, employment, income, credit, and assets.",
    progress: 100,
    status: "Complete",
    cta: "Review",
  },
  {
    id: "borrower-jamie",
    group: "Borrowers",
    icon: Users,
    title: "About Jamie Scott",
    subtitle: "Co-Applicant",
    description: "Personal details, address, employment, income, credit, and assets.",
    progress: 0,
    status: "Waiting for Co-Applicant",
    cta: "Resend Invite",
    meta: "Invite sent 2 days ago",
  },
  {
    id: "property",
    group: "Property & Financing",
    icon: Home,
    title: "About the Property",
    description: "Property address, usage, value, costs, and closing details.",
    progress: 40,
    status: "In Progress",
    cta: "Continue",
  },
  {
    id: "financing",
    group: "Property & Financing",
    icon: PiggyBank,
    title: "Down Payment & Financing",
    description: "Down payment amount, source of funds, and financing details.",
    progress: 0,
    status: "Not Started",
    cta: "Start",
  },
  {
    id: "mortgage-request",
    group: "Mortgage & Submission",
    icon: Wallet,
    title: "Mortgage Request",
    description: "Loan amount, payment preference, term, and mortgage goals.",
    progress: 20,
    status: "In Progress",
    cta: "Continue",
  },
  {
    id: "offers",
    group: "Mortgage & Submission",
    icon: Gift,
    title: "Your Mortgage Offers",
    description: "Review your selected preliminary mortgage offer.",
    progress: 100,
    status: "Selected",
    cta: "View Offer",
  },
  {
    id: "consent",
    group: "Mortgage & Submission",
    icon: FileSignature,
    title: "Product Review & Consent",
    description: "Review products and provide consent before submission.",
    progress: 0,
    status: "Locked",
    cta: "Locked",
    locked: true,
    meta: "Unlocks once required sections are complete",
  },
  {
    id: "submit",
    group: "Mortgage & Submission",
    icon: Send,
    title: "Submit Application",
    description: "Submit your application for review.",
    progress: 0,
    status: "Locked",
    cta: "Locked",
    locked: true,
    meta: "3 items remaining",
  },
];

const PRE_PURCHASE_WIDGETS: Widget[] = [
  PURCHASE_WIDGETS[0],
  {
    id: "purchase-plan",
    group: "Property & Financing",
    icon: MapPin,
    title: "Your Purchase Plan",
    description: "Buying timeline, target price, location, and property status.",
    progress: 50,
    status: "In Progress",
    cta: "Continue",
  },
  {
    id: "preferences",
    group: "Property & Financing",
    icon: Building2,
    title: "Target Property Preferences",
    description: "Preferred cities, property type, usage, and budget.",
    progress: 0,
    status: "Not Started",
    cta: "Start",
  },
  PURCHASE_WIDGETS[3],
  PURCHASE_WIDGETS[4],
  PURCHASE_WIDGETS[5],
  PURCHASE_WIDGETS[6],
  PURCHASE_WIDGETS[7],
];

const REFINANCE_WIDGETS: Widget[] = [
  PURCHASE_WIDGETS[0],
  {
    id: "property-r",
    group: "Property & Financing",
    icon: Home,
    title: "About Your Property",
    description: "Value, address, property type, usage, taxes, and ownership.",
    progress: 60,
    status: "In Progress",
    cta: "Continue",
  },
  {
    id: "current-mortgage",
    group: "Property & Financing",
    icon: ClipboardCheck,
    title: "Current Mortgage Details",
    description: "Current lender, balance, rate, payment, and maturity.",
    progress: 0,
    status: "Not Started",
    cta: "Start",
  },
  {
    id: "refi-request",
    group: "Property & Financing",
    icon: Wallet,
    title: "Refinance Request",
    description: "New mortgage amount, cash-out, and refinance purpose.",
    progress: 0,
    status: "Not Started",
    cta: "Start",
  },
  PURCHASE_WIDGETS[5],
  PURCHASE_WIDGETS[6],
  PURCHASE_WIDGETS[7],
];

const READINESS = [
  { label: "Primary borrower complete", state: "Complete" as const },
  { label: "Co-applicant complete", state: "Missing" as const },
  { label: "Property details complete", state: "Needs Review" as const },
  { label: "Financing details complete", state: "Missing" as const },
  { label: "Mortgage request complete", state: "Needs Review" as const },
  { label: "Consents complete", state: "Locked" as const },
  { label: "Selected offer confirmed", state: "Complete" as const },
  { label: "No blocking issues", state: "Complete" as const },
];

export function MortgageApplicationContent() {
  const [tx, setTx] = useState<TxType>(APPLICATION.type);

  const widgets = useMemo(() => {
    if (tx === "Pre-Purchase") return PRE_PURCHASE_WIDGETS;
    if (tx === "Refinance" || tx === "Renewal") return REFINANCE_WIDGETS;
    return PURCHASE_WIDGETS;
  }, [tx]);

  const grouped = useMemo(() => {
    const groups: Record<string, Widget[]> = {};
    widgets.forEach((w) => {
      groups[w.group] = groups[w.group] ?? [];
      groups[w.group].push(w);
    });
    return groups;
  }, [widgets]);

  const remaining = READINESS.filter((r) => r.state !== "Complete").length;
  const submitReady = remaining === 0;

  return (
    <div className="space-y-6">
      {/* Hero / Application summary */}
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                Mortgage Application Hub
              </p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                Complete Your Mortgage Application
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-primary-foreground/80">
                We'll use your details to verify your selected offer and prepare your file for
                review.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow/90 px-3 py-1 text-xs font-semibold text-yellow-foreground">
                <Clock className="h-3.5 w-3.5" /> Expires in {APPLICATION.expiresInDays} days
              </span>
              <span className="text-xs text-primary-foreground/70">
                Last updated · {APPLICATION.lastUpdated}
              </span>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Application ID" value={APPLICATION.id} />
            <SummaryStat label="Transaction" value={tx} />
            <SummaryStat label="Status" value={APPLICATION.status} />
            <SummaryStat
              label="Completion"
              value={`${APPLICATION.completion}%`}
            />
          </dl>

          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-primary-foreground/15">
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${APPLICATION.completion}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-primary-foreground/75">
              {APPLICATION.sectionsComplete} of {APPLICATION.totalSections} sections complete ·
              Estimated 10–15 minutes remaining
            </p>
          </div>
        </div>

        {/* Tx switcher (demo) */}
        <div className="flex flex-wrap items-center gap-2 border-t border-primary-foreground/15 bg-primary/40 px-6 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/70">
            Preview flow
          </span>
          {(["Purchase", "Pre-Purchase", "Refinance", "Renewal"] as TxType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTx(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                tx === t
                  ? "bg-primary-foreground text-primary"
                  : "bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Important notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
        <p className="text-xs text-foreground/80">
          Your selected offer is based on your initial answers. Your final mortgage product, rate,
          payment, and benefits may change after your full application is verified.
        </p>
      </div>

      {/* Two-column: Next step + Selected offer */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary">
                Next Step
              </p>
              <h2 className="mt-1 text-lg font-semibold text-primary">
                Complete Jamie Scott's borrower profile
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your co-applicant needs to complete their personal details, employment, and income
                information.
              </p>
            </div>
            <span className="hidden sm:inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
              <Sparkles className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Continue Next Step <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <Mail className="h-4 w-4" /> Resend Co-Applicant Invite
            </button>
          </div>
        </div>

        <SelectedOfferCard />
      </div>

      {/* Widget grid grouped */}
      {Object.entries(grouped).map(([group, items]) => (
        <section key={group} className="space-y-3">
          <header className="flex items-end justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {group}
            </h2>
            <span className="text-xs text-muted-foreground">
              {items.filter((w) => w.progress === 100).length}/{items.length} complete
            </span>
          </header>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((w) => (
              <WidgetCard key={w.id} widget={w} />
            ))}
          </div>
        </section>
      ))}

      {/* Submission readiness */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-primary">Ready to Submit?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {submitReady
                ? "Your application is ready to submit."
                : `You still have ${remaining} item${remaining === 1 ? "" : "s"} to complete before you can submit.`}
            </p>
          </div>
          <button
            disabled={!submitReady}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold ${
              submitReady
                ? "bg-mint text-mint-foreground hover:bg-mint/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            {submitReady ? "Submit Application" : "Continue Next Step"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {READINESS.map((r) => (
            <ReadinessRow key={r.label} {...r} />
          ))}
        </ul>
      </section>

      {/* Locked future stages */}
      <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">What happens after submission</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <LockedStage
            icon={ClipboardCheck}
            title="Document Upload"
            body="Unlocks once your application is submitted or documents are requested."
          />
          <LockedStage
            icon={ShieldCheck}
            title="Lender Response"
            body="Unlocks after your file is sent to the lender."
          />
          <LockedStage
            icon={Calendar}
            title="Funding Conditions"
            body="Unlocks after lender approval to prepare for closing."
          />
        </div>
      </section>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-primary-foreground">{value}</dd>
    </div>
  );
}

function SelectedOfferCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between bg-mint/20 px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/80">
          Selected Offer
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[10px] font-semibold text-mint-foreground">
          <CheckCircle2 className="h-3 w-3" /> Selected
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{SELECTED_OFFER.name}</p>
          <p className="text-xs text-muted-foreground">{SELECTED_OFFER.path}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          <Mini label="Estimated Rate" value={SELECTED_OFFER.rate} />
          <Mini label="Est. Payment" value={`${SELECTED_OFFER.monthly}/mo`} />
        </dl>
        <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
          <span className="text-xs text-muted-foreground">Home Life Bundle</span>
          <span className="text-sm font-semibold text-mint">{SELECTED_OFFER.bundle} value</span>
        </div>
        <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
          View Offer Details <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function statusBadge(status: WidgetStatus) {
  const map: Record<WidgetStatus, string> = {
    Complete: "bg-mint/25 text-foreground",
    "In Progress": "bg-secondary/15 text-secondary",
    "Not Started": "bg-muted text-muted-foreground",
    "Waiting for Co-Applicant": "bg-yellow/30 text-yellow-foreground",
    "Invite Sent": "bg-yellow/30 text-yellow-foreground",
    Selected: "bg-mint/25 text-foreground",
    Locked: "bg-muted text-muted-foreground",
    "Needs Review": "bg-coral/15 text-coral",
  };
  return map[status];
}

function WidgetCard({ widget }: { widget: Widget }) {
  const Icon = widget.icon;
  return (
    <article
      className={`flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md ${
        widget.locked ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
            widget.locked ? "bg-muted text-muted-foreground" : "bg-secondary/15 text-secondary"
          }`}
        >
          {widget.locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(widget.status)}`}
        >
          {widget.status}
        </span>
      </div>
      <div className="mt-3 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{widget.title}</h3>
        {widget.subtitle && (
          <p className="text-[11px] font-medium uppercase tracking-widest text-secondary">
            {widget.subtitle}
          </p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">{widget.description}</p>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>Progress</span>
          <span>{widget.progress}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${widget.progress === 100 ? "bg-mint" : "bg-secondary"}`}
            style={{ width: `${widget.progress}%` }}
          />
        </div>
        {widget.meta && (
          <p className="mt-2 text-[11px] text-muted-foreground">{widget.meta}</p>
        )}
        <button
          disabled={widget.locked}
          className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${
            widget.locked
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : widget.status === "Complete" || widget.status === "Selected"
                ? "border border-input bg-background text-foreground hover:bg-muted"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {widget.cta}
          {!widget.locked && <ArrowRight className="h-3.5 w-3.5" />}
        </button>
      </div>
    </article>
  );
}

function ReadinessRow({
  label,
  state,
}: {
  label: string;
  state: "Complete" | "Missing" | "Needs Review" | "Locked";
}) {
  const cfg = {
    Complete: { icon: CheckCircle2, cls: "text-mint", badge: "bg-mint/20 text-foreground" },
    Missing: { icon: AlertCircle, cls: "text-coral", badge: "bg-coral/15 text-coral" },
    "Needs Review": { icon: AlertCircle, cls: "text-yellow-foreground", badge: "bg-yellow/30 text-yellow-foreground" },
    Locked: { icon: Lock, cls: "text-muted-foreground", badge: "bg-muted text-muted-foreground" },
  }[state];
  const Icon = cfg.icon;
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-foreground">
        <Icon className={`h-4 w-4 ${cfg.cls}`} /> {label}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>
        {state}
      </span>
    </li>
  );
}

function LockedStage({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

// avoid unused-import warnings if the icons are referenced only by mapping
void DollarSign;