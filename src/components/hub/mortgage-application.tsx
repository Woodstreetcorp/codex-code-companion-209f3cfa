import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSignature,
  Gift,
  Home,
  Info,
  Lock,
  Mail,
  MapPin,
  Minus,
  PiggyBank,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BorrowerProfilePage } from "./borrower-profile";

// ─── Types ───────────────────────────────────────────────────────────────
type TxType = "Purchase" | "Pre-Purchase" | "Refinance" | "Renewal";

type AccessLevel =
  | "own_profile_only"
  | "own_profile_summary"
  | "application_contributor"
  | "full_application_access"
  | "application_manager";

type ApplicantRole =
  | "Primary Applicant"
  | "Co-Applicant"
  | "Co-Borrower"
  | "Guarantor"
  | "Spouse / Partner"
  | "Non-Applicant Property Owner";

type InviteStatus =
  | "Accepted"
  | "Invite Sent"
  | "Invite Viewed"
  | "Invite Expired"
  | "Not Invited";

type Applicant = {
  id: string;
  name: string;
  email?: string;
  role: ApplicantRole;
  isPrimary: boolean;
  accessLevel: AccessLevel;
  inviteStatus: InviteStatus;
  completion: number;
  invitedAgo?: string;
};

type WidgetStatus =
  | "Complete"
  | "In Progress"
  | "Not Started"
  | "Selected"
  | "Locked"
  | "Needs Review";

type Widget = {
  id: string;
  group: "Property & Financing" | "Mortgage & Submission";
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  progress: number;
  status: WidgetStatus;
  cta: string;
  meta?: string;
  locked?: boolean;
};

// ─── Mock data ───────────────────────────────────────────────────────────
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

const INITIAL_APPLICANTS: Applicant[] = [
  {
    id: "a-david",
    name: "David Scott",
    email: "david@email.com",
    role: "Primary Applicant",
    isPrimary: true,
    accessLevel: "application_manager",
    inviteStatus: "Accepted",
    completion: 100,
  },
  {
    id: "a-jamie",
    name: "Jamie Scott",
    email: "jamie@email.com",
    role: "Co-Applicant",
    isPrimary: false,
    accessLevel: "own_profile_only",
    inviteStatus: "Invite Sent",
    completion: 0,
    invitedAgo: "2 days ago",
  },
];

const PURCHASE_WIDGETS: Widget[] = [
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
  PURCHASE_WIDGETS[1],
  ...PURCHASE_WIDGETS.slice(2),
];

const REFINANCE_WIDGETS: Widget[] = [
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
  ...PURCHASE_WIDGETS.slice(3),
];

// ─── Access Levels ───────────────────────────────────────────────────────
const ACCESS_LEVELS: {
  value: AccessLevel;
  label: string;
  short: string;
  description: string;
  useCase: string;
}[] = [
  {
    value: "own_profile_only",
    label: "Own Profile Only",
    short: "Recommended default",
    description:
      "Can view and complete only their own borrower profile section.",
    useCase: "Best for co-applicants who only need to complete their own info.",
  },
  {
    value: "own_profile_summary",
    label: "Own Profile + Summary",
    short: "Limited context",
    description:
      "Can complete their own profile and see limited application summary information.",
    useCase: "Good when they need context but not full financial details of others.",
  },
  {
    value: "application_contributor",
    label: "Application Contributor",
    short: "Shared sections",
    description:
      "Can complete their own profile and contribute to assigned shared sections.",
    useCase: "Good for spouses/co-buyers helping with property or documents.",
  },
  {
    value: "full_application_access",
    label: "Full Application Access",
    short: "Trusted collaborator",
    description:
      "Can view and edit most parts of the borrower-facing application.",
    useCase: "Good for trusted co-borrowers jointly managing the application.",
  },
  {
    value: "application_manager",
    label: "Application Manager",
    short: "Maximum access",
    description:
      "Can edit the entire borrower-facing application and help submit it.",
    useCase: "Best for spouse/partner who is fully managing the application with you.",
  },
];

const ACCESS_MATRIX: { permission: string; levels: (boolean | "partial")[] }[] = [
  { permission: "View own profile", levels: [true, true, true, true, true] },
  { permission: "Edit own profile", levels: [true, true, true, true, true] },
  { permission: "View application summary", levels: [false, true, true, true, true] },
  { permission: "View property details", levels: [false, false, true, true, true] },
  { permission: "Edit property details", levels: [false, false, true, true, true] },
  { permission: "View financing details", levels: [false, false, true, true, true] },
  { permission: "Edit financing details", levels: [false, false, true, true, true] },
  { permission: "View mortgage offers", levels: [false, false, "partial", true, true] },
  { permission: "Select / review products", levels: [false, false, false, "partial", true] },
  { permission: "Upload own documents", levels: [true, true, true, true, true] },
  { permission: "Upload shared documents", levels: [false, false, true, true, true] },
  { permission: "View other applicants", levels: [false, false, false, "partial", "partial"] },
  { permission: "Edit other applicants", levels: [false, false, false, false, false] },
  { permission: "Submit application", levels: [false, false, false, false, "partial"] },
  { permission: "Manage applicants / access", levels: [false, false, false, false, false] },
];

const READINESS = [
  { label: "Primary borrower complete", state: "Complete" as const },
  { label: "Additional applicants complete", state: "Missing" as const },
  { label: "Property details complete", state: "Needs Review" as const },
  { label: "Financing details complete", state: "Missing" as const },
  { label: "Mortgage request complete", state: "Needs Review" as const },
  { label: "Consents complete", state: "Locked" as const },
  { label: "Selected offer confirmed", state: "Complete" as const },
  { label: "No blocking issues", state: "Complete" as const },
];

const MAX_APPLICANTS = 4;

// ─── Main ────────────────────────────────────────────────────────────────
export function MortgageApplicationContent() {
  const [tx, setTx] = useState<TxType>(APPLICATION.type);
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [addOpen, setAddOpen] = useState(false);
  const [accessFor, setAccessFor] = useState<Applicant | null>(null);
  const [profileFor, setProfileFor] = useState<Applicant | null>(null);

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
  const atMax = applicants.length >= MAX_APPLICANTS;

  const handleAdd = (a: Applicant) => {
    setApplicants((prev) => [...prev, a]);
    setAddOpen(false);
  };

  const handleAccessChange = (id: string, level: AccessLevel) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, accessLevel: level } : a)),
    );
    setAccessFor(null);
  };

  const handleResend = (id: string) => {
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, inviteStatus: "Invite Sent", invitedAgo: "just now" } : a,
      ),
    );
  };

  const handleRemove = (id: string) => {
    setApplicants((prev) => prev.filter((a) => a.id !== id));
  };

  if (profileFor) {
    return (
      <BorrowerProfilePage
        applicant={profileFor}
        onBack={() => setProfileFor(null)}
      />
    );
  }

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
                We'll use your details to verify your selected offer and prepare your file for review.
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
            <SummaryStat label="Completion" value={`${APPLICATION.completion}%`} />
          </dl>

          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-primary-foreground/15">
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${APPLICATION.completion}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-primary-foreground/75">
              {APPLICATION.sectionsComplete} of {APPLICATION.totalSections} sections complete · Estimated 10–15 minutes remaining
            </p>
          </div>
        </div>

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
                Your co-applicant needs to complete their personal details, employment, and income.
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

      {/* Borrowers section */}
      <section className="space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Borrowers
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Each applicant completes their own profile and required consent.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Borrowers {applicants.length} of {MAX_APPLICANTS}
            </span>
            <button
              disabled={atMax}
              onClick={() => setAddOpen(true)}
              title={atMax ? "A mortgage application can have up to 4 applicants." : ""}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                atMax
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Add Applicant
            </button>
          </div>
        </header>
        {atMax ? (
          <p className="text-xs text-muted-foreground">Maximum applicants reached.</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            You can add up to {MAX_APPLICANTS - applicants.length} more applicant
            {MAX_APPLICANTS - applicants.length === 1 ? "" : "s"}.
          </p>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {applicants.map((a) => (
            <BorrowerWidgetCard
              key={a.id}
              applicant={a}
              onResend={() => handleResend(a.id)}
              onManageAccess={() => setAccessFor(a)}
              onRemove={() => handleRemove(a.id)}
            />
          ))}
        </div>
      </section>

      {/* Property/Financing + Mortgage groups */}
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

      {/* Important notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
        <p className="text-xs text-foreground/80">
          Your selected offer is based on your initial answers. Your final mortgage product, rate,
          payment, and benefits may change after your full application is verified. Each applicant
          must complete their own consent and declarations.
        </p>
      </div>

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

      <AddApplicantDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingCount={applicants.length}
        onAdd={handleAdd}
      />
      <ChangeAccessDialog
        applicant={accessFor}
        onOpenChange={(o) => !o && setAccessFor(null)}
        onSave={(level) => accessFor && handleAccessChange(accessFor.id, level)}
      />
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────
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

function inviteBadge(status: InviteStatus) {
  const map: Record<InviteStatus, string> = {
    Accepted: "bg-mint/25 text-foreground",
    "Invite Sent": "bg-yellow/30 text-yellow-foreground",
    "Invite Viewed": "bg-secondary/20 text-secondary",
    "Invite Expired": "bg-coral/15 text-coral",
    "Not Invited": "bg-muted text-muted-foreground",
  };
  return map[status];
}

function accessLabel(level: AccessLevel) {
  return ACCESS_LEVELS.find((a) => a.value === level)?.label ?? level;
}

function BorrowerWidgetCard({
  applicant,
  onResend,
  onManageAccess,
  onRemove,
}: {
  applicant: Applicant;
  onResend: () => void;
  onManageAccess: () => void;
  onRemove: () => void;
}) {
  const isInvitePending =
    applicant.inviteStatus === "Invite Sent" ||
    applicant.inviteStatus === "Invite Viewed" ||
    applicant.inviteStatus === "Invite Expired";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
          {applicant.isPrimary ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${inviteBadge(applicant.inviteStatus)}`}
        >
          {applicant.inviteStatus}
        </span>
      </div>
      <div className="mt-3 flex-1">
        <h3 className="text-sm font-semibold text-foreground">About {applicant.name}</h3>
        <p className="text-[11px] font-medium uppercase tracking-widest text-secondary">
          {applicant.role}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Personal details, address, employment, income, credit, and assets.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
            <ShieldCheck className="h-3 w-3" /> {accessLabel(applicant.accessLevel)}
          </span>
          {applicant.invitedAgo && isInvitePending && (
            <span className="text-[10px] text-muted-foreground">Invited {applicant.invitedAgo}</span>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>Progress</span>
          <span>{applicant.completion}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${applicant.completion === 100 ? "bg-mint" : "bg-secondary"}`}
            style={{ width: `${applicant.completion}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {applicant.isPrimary ? (
            <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
              Review <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : isInvitePending ? (
            <button
              onClick={onResend}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Mail className="h-3.5 w-3.5" /> Resend Invite
            </button>
          ) : (
            <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {!applicant.isPrimary && (
            <>
              <button
                onClick={onManageAccess}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted"
                title="Manage Access"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onRemove}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2.5 py-2 text-xs font-medium text-coral hover:bg-coral/10"
                title="Remove Applicant"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function statusBadge(status: WidgetStatus) {
  const map: Record<WidgetStatus, string> = {
    Complete: "bg-mint/25 text-foreground",
    "In Progress": "bg-secondary/15 text-secondary",
    "Not Started": "bg-muted text-muted-foreground",
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
        {widget.meta && <p className="mt-2 text-[11px] text-muted-foreground">{widget.meta}</p>}
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

// ─── Add Applicant Dialog ────────────────────────────────────────────────
const ROLE_OPTIONS: { value: ApplicantRole; description: string }[] = [
  {
    value: "Co-Applicant",
    description:
      "This person will be part of the mortgage application and may share responsibility for the mortgage.",
  },
  {
    value: "Guarantor",
    description:
      "This person may support the application but may not be an owner of the property.",
  },
  {
    value: "Spouse / Partner",
    description:
      "This person may need to provide information depending on ownership, income, debts, or consent.",
  },
  {
    value: "Non-Applicant Property Owner",
    description: "This person may be connected to the property but not applying for the mortgage.",
  },
];

function AddApplicantDialog({
  open,
  onOpenChange,
  existingCount,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existingCount: number;
  onAdd: (a: Applicant) => void;
}) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<ApplicantRole>("Co-Applicant");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [onTitle, setOnTitle] = useState(false);
  const [onMortgage, setOnMortgage] = useState(true);
  const [providesIncome, setProvidesIncome] = useState(false);
  const [providesAssets, setProvidesAssets] = useState(false);
  const [includesDebts, setIncludesDebts] = useState(false);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("own_profile_only");

  const reset = () => {
    setStep(1);
    setRole("Co-Applicant");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setRelationship("");
    setOnTitle(false);
    setOnMortgage(true);
    setProvidesIncome(false);
    setProvidesAssets(false);
    setIncludesDebts(false);
    setAccessLevel("own_profile_only");
  };

  const close = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const submit = () => {
    onAdd({
      id: `a-${Date.now()}`,
      name: `${firstName} ${lastName}`.trim() || "New Applicant",
      email,
      role,
      isPrimary: false,
      accessLevel,
      inviteStatus: "Invite Sent",
      completion: 0,
      invitedAgo: "just now",
    });
    reset();
  };

  const canNext1 = !!role;
  const canNext2 = firstName && lastName && /\S+@\S+\.\S+/.test(email);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Add Applicant</DialogTitle>
          <DialogDescription>
            Step {step} of 4 · You'll have {existingCount + 1} of {MAX_APPLICANTS} applicants on this application.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-semibold">What role will this person have?</h3>
            <div className="grid gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    role === r.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">{r.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-semibold">Applicant details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Last name">
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Phone (optional)">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Relationship to main applicant">
                <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Spouse, partner, parent…" className={inputCls} />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle label="On title" checked={onTitle} onChange={setOnTitle} />
              <Toggle label="On the mortgage" checked={onMortgage} onChange={setOnMortgage} />
              <Toggle label="Provides income" checked={providesIncome} onChange={setProvidesIncome} />
              <Toggle label="Provides assets / down payment" checked={providesAssets} onChange={setProvidesAssets} />
              <Toggle label="Has debts to include" checked={includesDebts} onChange={setIncludesDebts} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Choose access level</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose the minimum access this person needs. You can update access later.
              </p>
            </div>
            <div className="grid gap-2">
              {ACCESS_LEVELS.map((lv) => (
                <button
                  key={lv.value}
                  onClick={() => setAccessLevel(lv.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    accessLevel === lv.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{lv.label}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {lv.short}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{lv.description}</p>
                  <p className="mt-1 text-[11px] italic text-muted-foreground">{lv.useCase}</p>
                </button>
              ))}
            </div>

            <details className="mt-3 rounded-xl border border-border bg-muted/30 p-3 text-xs">
              <summary className="cursor-pointer font-semibold text-foreground">
                Compare access levels
              </summary>
              <div className="mt-3 overflow-x-auto">
                <AccessMatrix />
              </div>
            </details>

            <div className="flex items-start gap-2 rounded-xl border border-yellow/40 bg-yellow/10 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-yellow-foreground" />
              <p className="text-[11px] text-foreground/80">
                Applicants may have sensitive financial information in their profile. Only grant
                full access to someone you trust. Each applicant must complete their own consent and
                declarations.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-semibold">Review & send invite</h3>
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <Row label="Name" value={`${firstName} ${lastName}`.trim() || "—"} />
              <Row label="Email" value={email || "—"} />
              <Row label="Role" value={role} />
              <Row label="Access level" value={accessLabel(accessLevel)} />
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">What they can access</p>
              <p className="mt-1">
                {ACCESS_LEVELS.find((a) => a.value === accessLevel)?.description}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
          <button
            onClick={() => (step === 1 ? close(false) : setStep(step - 1))}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 4 ? (
            <button
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" /> Send Invite
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChangeAccessDialog({
  applicant,
  onOpenChange,
  onSave,
}: {
  applicant: Applicant | null;
  onOpenChange: (o: boolean) => void;
  onSave: (level: AccessLevel) => void;
}) {
  const [level, setLevel] = useState<AccessLevel>(
    applicant?.accessLevel ?? "own_profile_only",
  );

  // sync when applicant changes
  useMemo(() => {
    if (applicant) setLevel(applicant.accessLevel);
  }, [applicant]);

  return (
    <Dialog open={!!applicant} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage access · {applicant?.name}</DialogTitle>
          <DialogDescription>
            Choose the minimum access this person needs. You can update access at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3 grid gap-2">
          {ACCESS_LEVELS.map((lv) => (
            <button
              key={lv.value}
              onClick={() => setLevel(lv.value)}
              className={`rounded-xl border p-3 text-left transition ${
                level === lv.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{lv.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{lv.description}</p>
            </button>
          ))}
        </div>
        <details className="mt-3 rounded-xl border border-border bg-muted/30 p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-foreground">
            Compare access levels
          </summary>
          <div className="mt-3 overflow-x-auto">
            <AccessMatrix />
          </div>
        </details>
        <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(level)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Save access
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccessMatrix() {
  return (
    <table className="w-full min-w-[640px] border-separate border-spacing-0 text-[11px]">
      <thead>
        <tr>
          <th className="sticky left-0 bg-card text-left font-semibold text-foreground p-2">Permission</th>
          {ACCESS_LEVELS.map((lv) => (
            <th key={lv.value} className="p-2 text-center font-semibold text-foreground">
              {lv.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ACCESS_MATRIX.map((row) => (
          <tr key={row.permission} className="border-t border-border">
            <td className="sticky left-0 bg-card p-2 text-foreground/80">{row.permission}</td>
            {row.levels.map((v, i) => (
              <td key={i} className="p-2 text-center">
                {v === true ? (
                  <Check className="mx-auto h-3.5 w-3.5 text-mint" />
                ) : v === "partial" ? (
                  <Minus className="mx-auto h-3.5 w-3.5 text-yellow-foreground" />
                ) : (
                  <X className="mx-auto h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
      <span className="text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}