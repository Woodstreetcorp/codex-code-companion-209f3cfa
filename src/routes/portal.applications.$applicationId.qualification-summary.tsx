import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Printer,
  Share2,
  Circle,
  Clock,
  FileText,
  Gift,
  Home,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

export const Route = createFileRoute(
  "/portal/applications/$applicationId/qualification-summary",
)({
  head: () => ({
    meta: [
      { title: "Your Qualification Summary — approvU" },
      {
        name: "description",
        content:
          "A simple summary of your initial mortgage path, selected offer, and what we still need to verify.",
      },
    ],
  }),
  component: QualificationSummaryPage,
});

// ─── Mock data ───────────────────────────────────────────────────────────
const QUAL = {
  status: "Pre-qualified",
  transactionType: "Purchase" as "Purchase" | "Refinance" | "Renewal" | "Pre-Purchase",
  lendingPath: "Prime Path",
  loanAmount: 748024,
  propertyValue: 832000,
  ltv: 90,
  monthlyPayment: 2358,
};

const OFFER = {
  name: "Best Value Fixed Offer",
  pathLabel: "Monoline Lender Path",
  term: "5-Year Fixed",
  rateType: "Fixed",
  rate: 4.89,
  payment: 2358,
  benefitsValue: 2350,
  status: "Selected Preliminary Offer",
};

const SNAPSHOT = {
  propertyValue: 832000,
  downPayment: 83976,
  downPaymentPct: 10.1,
  usage: "Owner-Occupied",
  propertyType: "Detached",
  location: "Toronto, ON",
  firstTimeBuyer: true,
};

const APPLICANT = {
  count: 2,
  incomeProfile: "Salaried + Self-Employed",
  incomeUsed: 214000,
  creditProfile: "Strong" as "Strong" | "Good" | "Fair" | "Needs Review",
  applicationPath: "Prime Path",
  verificationStatus: "Pending full review",
};

type CheckStatus = "Not Started" | "In Progress" | "Pending Review" | "Completed";
const CHECKLIST: { key: string; label: string; status: CheckStatus }[] = [
  { key: "identity", label: "Identity", status: "Not Started" },
  { key: "income", label: "Income documents", status: "Pending Review" },
  { key: "employment", label: "Employment details", status: "Pending Review" },
  { key: "downpayment", label: "Down payment source", status: "Pending Review" },
  { key: "property", label: "Property details", status: "In Progress" },
  { key: "credit", label: "Credit consent", status: "Not Started" },
  { key: "debts", label: "Existing debts", status: "Not Started" },
];

const BUNDLE = {
  name: "HomeStrategy Advantage™",
  total: 2350,
  benefits: [
    {
      name: "Home Inspection Credit",
      value: 500,
      description: "Reimbursement for a licensed home inspection completed before closing.",
      availableAt: "After mortgage funding",
    },
    {
      name: "Legal Fee Rebate",
      value: 500,
      description: "Credit toward your real estate lawyer or notary closing fees.",
      availableAt: "After mortgage funding",
    },
    {
      name: "Moving Expense Credit",
      value: 500,
      description: "Help offset the cost of professional movers within 60 days of close.",
      availableAt: "Within 60 days of closing",
    },
    {
      name: "Home Insurance Credit",
      value: 450,
      description: "Credit applied to your first year of home insurance premium.",
      availableAt: "After mortgage funding",
    },
    {
      name: "No Appraisal Fee",
      value: 400,
      description: "Property appraisal fee waived during your mortgage application.",
      availableAt: "During application",
    },
  ],
};

const APP_STATE: "not_started" | "in_progress" | "submitted" | "completed" = "in_progress";

// ─── Helpers ─────────────────────────────────────────────────────────────
const fmtMoney = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

// ─── Page ────────────────────────────────────────────────────────────────
function QualificationSummaryPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/portal" className="hover:text-foreground">Portal</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/portal" className="hover:text-foreground">Applications</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Qualification Summary</span>
        </nav>
        <div className="flex gap-2 print:hidden" data-no-print>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>
          <button
            onClick={() => {
              if (navigator.share) navigator.share({ title: "approvU qualification summary", url: window.location.href }).catch(() => {});
              else navigator.clipboard.writeText(window.location.href);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </div>
      <QualificationSummaryContent />
    </div>
  );
}

export function QualificationSummaryContent() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="space-y-6">
      <QualificationSummaryHero />
      <QualificationProgressStepper />
      <InitialQualificationResultCard />
      <SelectedMortgageOfferCard />
      <SnapshotDetailsCard />
      <ApplicantSummaryCard />
      <VerificationChecklistCard />
      <HomeLifeBundlePreviewCard onOpenDetails={() => setDrawerOpen(true)} />
      <NextStepCard />
      <QualificationDisclosurePanel />
      {drawerOpen && <BenefitDetailsDrawer onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────
function QualificationSummaryHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-card to-secondary/8 p-6 shadow-sm sm:p-8">
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-secondary/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="primary" icon={<Sparkles className="h-3.5 w-3.5" />}>
            Preliminary Result
          </StatusBadge>
          <span className="text-xs text-muted-foreground">Application #APP-3024</span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Your Qualification Summary
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Here's a simple summary of your initial mortgage path, selected offer, and what we still
          need to verify.
        </p>
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-secondary/20 bg-card/70 p-3.5 text-xs text-muted-foreground backdrop-blur sm:text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
          <p>
            This is based on your initial answers. Your final mortgage product, rate, payment, and
            benefits will be confirmed after your full application is completed and reviewed.
          </p>
        </div>
      </div>
    </section>
  );
}

function QualificationProgressStepper() {
  const steps = [
    { label: "Snapshot Complete", done: true },
    { label: "Offer Selected", done: true },
    { label: "Full Application", done: false, current: true },
    { label: "Final Review", done: false },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s.label} className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                s.done
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : s.current
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={`text-xs sm:text-sm ${
                s.current
                  ? "font-semibold text-foreground"
                  : s.done
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="h-px w-6 bg-border sm:w-10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InitialQualificationResultCard() {
  const items: { icon: typeof Home; label: string; value: string; tone: ToneKey }[] = [
    { icon: BadgeCheck, label: "Qualification Status", value: QUAL.status, tone: "mint" },
    { icon: TrendingUp, label: "Transaction Type", value: QUAL.transactionType, tone: "primary" },
    { icon: ShieldCheck, label: "Lending Path", value: QUAL.lendingPath, tone: "secondary" },
    { icon: Wallet, label: "Estimated Loan Amount", value: fmtMoney(QUAL.loanAmount), tone: "primary" },
    { icon: Home, label: "Estimated Property Value", value: fmtMoney(QUAL.propertyValue), tone: "secondary" },
    { icon: TrendingUp, label: "Estimated LTV", value: `${QUAL.ltv}%`, tone: "yellow" },
    { icon: Wallet, label: "Estimated Monthly Payment", value: `${fmtMoney(QUAL.monthlyPayment)}/mo`, tone: "primary" },
  ];
  return (
    <SectionCard
      title="Your Initial Result"
      subtitle="Based on your initial answers, you appear to match a mortgage path that may be suitable for your profile."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => (
          <ToneStatTile key={it.label} {...it} />
        ))}
      </div>
      <FootNote>
        Final eligibility depends on verified income, credit, property, down payment, and lender or
        product rules.
      </FootNote>
    </SectionCard>
  );
}

function SelectedMortgageOfferCard() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-secondary/5 p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            Your Selected Mortgage Offer
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {OFFER.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{OFFER.pathLabel}</p>
        </div>
        <StatusBadge tone="primary" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
          {OFFER.status}
        </StatusBadge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <OfferStat label="Term" value={OFFER.term} />
        <OfferStat label="Rate Type" value={OFFER.rateType} />
        <OfferStat label="Estimated Rate" value={`${OFFER.rate.toFixed(2)}%`} highlight />
        <OfferStat label="Estimated Payment" value={`${fmtMoney(OFFER.payment)}/mo`} highlight />
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-secondary/20 bg-card/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-secondary/15 p-2 text-secondary">
            <Gift className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total Benefits Value
            </p>
            <p className="text-base font-semibold text-foreground">
              {fmtMoney(OFFER.benefitsValue)} included
            </p>
          </div>
        </div>
        <Link
          to="/internal/full-application"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Continue Mortgage Application <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>

      <FootNote>
        This is the offer direction you selected. We'll use it as a guide when matching you to final
        mortgage products after your full application is reviewed.
      </FootNote>
    </section>
  );
}

function SnapshotDetailsCard() {
  const isPurchase =
    QUAL.transactionType === "Purchase" || QUAL.transactionType === "Pre-Purchase";
  const rows = isPurchase
    ? [
        { icon: Home, label: "Property Value", value: fmtMoney(SNAPSHOT.propertyValue) },
        { icon: Wallet, label: "Down Payment", value: fmtMoney(SNAPSHOT.downPayment) },
        { icon: TrendingUp, label: "Down Payment %", value: `${SNAPSHOT.downPaymentPct}%` },
        { icon: Building2, label: "Property Usage", value: SNAPSHOT.usage },
        { icon: Building2, label: "Property Type", value: SNAPSHOT.propertyType },
        { icon: MapPin, label: "Location", value: SNAPSHOT.location },
        { icon: BadgeCheck, label: "First-Time Buyer", value: SNAPSHOT.firstTimeBuyer ? "Yes" : "No" },
      ]
    : [];
  return (
    <SectionCard title="Your Snapshot Details" subtitle="A quick look at the answers we used.">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <DetailRow key={r.label} icon={r.icon} label={r.label} value={r.value} />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Need to update this?{" "}
        <Link
          to="/internal/full-application"
          className="font-medium text-secondary underline-offset-4 hover:underline"
        >
          You can adjust your details in the full application.
        </Link>
      </p>
    </SectionCard>
  );
}

function ApplicantSummaryCard() {
  const credit = APPLICANT.creditProfile;
  const creditTone =
    credit === "Strong"
      ? "mint"
      : credit === "Good"
      ? "secondary"
      : credit === "Fair"
      ? "yellow"
      : "coral";
  return (
    <SectionCard title="Applicant Summary" subtitle="A high-level snapshot of who's applying.">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <DetailRow icon={Users} label="Applicants" value={String(APPLICANT.count)} />
        <DetailRow icon={BadgeCheck} label="Income Profile" value={APPLICANT.incomeProfile} />
        <DetailRow
          icon={TrendingUp}
          label="Estimated Income Used"
          value={fmtMoney(APPLICANT.incomeUsed)}
        />
        <DetailRow
          icon={ShieldCheck}
          label="Credit Profile"
          value={credit}
          badgeTone={creditTone}
        />
        <DetailRow icon={Home} label="Application Path" value={APPLICANT.applicationPath} />
        <DetailRow
          icon={Clock}
          label="Verification Status"
          value={APPLICANT.verificationStatus}
          badgeTone="yellow"
        />
      </div>
      <FootNote>
        Your initial profile suggests a possible qualification path. We still need to verify
        income, credit, documents, and property details before confirming final products.
      </FootNote>
    </SectionCard>
  );
}

function VerificationChecklistCard() {
  return (
    <SectionCard
      title="What We Still Need to Verify"
      subtitle="Completing your full application helps us confirm your final mortgage products and benefits."
    >
      <ul className="divide-y divide-border rounded-2xl border border-border bg-background/40">
        {CHECKLIST.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
          >
            <div className="flex items-center gap-3">
              <ChecklistIcon status={item.status} />
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
            <VerificationStatusBadge status={item.status} />
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-end">
        <Link
          to="/internal/full-application"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Continue Application <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>
    </SectionCard>
  );
}

function HomeLifeBundlePreviewCard({ onOpenDetails }: { onOpenDetails: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-mint/30 bg-gradient-to-br from-mint/15 via-card to-card p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            Your Home Life Bundle Preview
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {BUNDLE.name}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            These benefits may be available with your selected offer, subject to final application
            review and funding.
          </p>
        </div>
        <BenefitValueBadge value={BUNDLE.total} />
      </div>
      <ul className="mt-5 space-y-2">
        {BUNDLE.benefits.slice(0, 5).map((b) => (
          <li
            key={b.name}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/80 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-mint/25 p-1.5 text-foreground">
                <Gift className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-foreground">{b.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{fmtMoney(b.value)}</span>
              <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[11px] font-medium text-foreground">
                Included
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onOpenDetails}
          className="text-sm font-medium text-secondary underline-offset-4 hover:underline"
        >
          View benefit details
        </button>
        <p className="text-xs text-muted-foreground">
          Final benefits are confirmed after your application is reviewed and your mortgage is
          approved and funded.
        </p>
      </div>
    </section>
  );
}

function NextStepCard() {
  const cta =
    APP_STATE === "not_started"
      ? "Start Full Application"
      : APP_STATE === "in_progress"
      ? "Continue Where You Left Off"
      : APP_STATE === "submitted"
      ? "View Application Status"
      : "View Mortgage Details";
  return (
    <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary to-secondary p-6 text-primary-foreground shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">
        Next Step
      </p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
        Complete Your Mortgage Application
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
        Complete your full application so we can verify your information, confirm your final
        mortgage products, and prepare your file for review.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to="/internal/full-application"
          className="inline-flex items-center justify-center rounded-xl bg-card px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-card/90"
        >
          {cta} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
        <Link
          to="/portal"
          className="inline-flex items-center justify-center rounded-xl border border-primary-foreground/30 bg-transparent px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10"
        >
          Back to Dashboard
        </Link>
      </div>
    </section>
  );
}

function QualificationDisclosurePanel() {
  return (
    <section className="rounded-2xl border border-border bg-muted/40 p-5">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Important note</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your qualification summary and selected offer are based on your initial answers. They
            are not a final mortgage approval. Your final mortgage product, rate, payment, and
            benefits may change after your full application details are verified.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll clearly explain any changes before you move forward.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Drawer ──────────────────────────────────────────────────────────────
function BenefitDetailsDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary">
              {BUNDLE.name}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">Benefit details</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="mt-5 space-y-3">
          {BUNDLE.benefits.map((b) => (
            <li key={b.name} className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{b.name}</p>
                <span className="text-sm font-semibold text-foreground">{fmtMoney(b.value)}</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.description}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-mint/20 px-2 py-0.5 text-[11px] font-medium text-foreground">
                <Clock className="h-3 w-3" /> {b.availableAt}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-muted-foreground">
          Benefits are not activated until the mortgage is funded and closed. Terms may apply.
        </p>
      </aside>
    </div>
  );
}

// ─── Building blocks ─────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FootNote({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-xs text-muted-foreground">{children}</p>;
}

type ToneKey = "primary" | "secondary" | "yellow" | "coral" | "mint";

function ToneStatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Home;
  label: string;
  value: string;
  tone: ToneKey;
}) {
  const toneCls: Record<ToneKey, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    yellow: "bg-yellow/30 text-foreground",
    coral: "bg-coral/15 text-coral",
    mint: "bg-mint/25 text-foreground",
  };
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneCls[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function OfferStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-secondary/30 bg-secondary/5" : "border-border bg-background/40"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-semibold ${
          highlight ? "text-xl text-foreground" : "text-base text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  badgeTone,
}: {
  icon: typeof Home;
  label: string;
  value: string;
  badgeTone?: ToneKey;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-muted p-1.5 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      {badgeTone ? (
        <StatusBadge tone={badgeTone}>{value}</StatusBadge>
      ) : (
        <span className="text-sm font-semibold text-foreground">{value}</span>
      )}
    </div>
  );
}

function StatusBadge({
  tone,
  icon,
  children,
}: {
  tone: ToneKey;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const toneCls: Record<ToneKey, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    yellow: "bg-yellow/30 text-foreground",
    coral: "bg-coral/15 text-coral",
    mint: "bg-mint/25 text-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneCls[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}

function BenefitValueBadge({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-end rounded-2xl border border-mint/40 bg-card/80 px-4 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Estimated Value
      </span>
      <span className="text-xl font-semibold text-foreground">{fmtMoney(value)}</span>
    </div>
  );
}

function VerificationStatusBadge({ status }: { status: CheckStatus }) {
  const tone: ToneKey =
    status === "Completed"
      ? "mint"
      : status === "In Progress"
      ? "secondary"
      : status === "Pending Review"
      ? "yellow"
      : "coral";
  return <StatusBadge tone={tone}>{status}</StatusBadge>;
}

function ChecklistIcon({ status }: { status: CheckStatus }) {
  if (status === "Completed")
    return (
      <span className="rounded-full bg-mint/25 p-1 text-foreground">
        <CheckCircle2 className="h-4 w-4" />
      </span>
    );
  if (status === "In Progress")
    return (
      <span className="rounded-full bg-secondary/15 p-1 text-secondary">
        <Clock className="h-4 w-4" />
      </span>
    );
  if (status === "Pending Review")
    return (
      <span className="rounded-full bg-yellow/30 p-1 text-foreground">
        <FileText className="h-4 w-4" />
      </span>
    );
  return (
    <span className="rounded-full bg-muted p-1 text-muted-foreground">
      <Circle className="h-4 w-4" />
    </span>
  );
}