import { useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileSignature,
  Home,
  Info,
  Mail,
  MapPin,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────
export type BorrowerProfileApplicant = {
  id: string;
  name: string;
  email?: string;
  role: string;
  isPrimary: boolean;
  accessLevel: string;
  inviteStatus: string;
  completion: number;
  invitedAgo?: string;
};

type SectionKey =
  | "about"
  | "address"
  | "income"
  | "credit"
  | "assets"
  | "properties"
  | "review";

type SectionState =
  | "Not Started"
  | "In Progress"
  | "Complete"
  | "Needs Review"
  | "Missing Required Info";

type Section = {
  key: SectionKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  state: SectionState;
};

type IncomeSource = {
  id: string;
  type: string;
  source: string;
  jobTitle?: string;
  startDate: string;
  grossIncome: number;
  frequency: "Annual" | "Monthly" | "Bi-Weekly" | "Weekly" | "Hourly";
  verification: string;
  include: boolean;
};

export type Liability = {
  id: string;
  ownerId: string; // applicant.id who entered the debt
  creditor: string; // Name of lender
  type: string; // Type of debt
  balance: number;
  monthlyPayment: number;
  shared: boolean;
  sharedWith: string[]; // applicant IDs the debt is shared with
  paymentHistory:
    | ""
    | "R1"
    | "R2"
    | "R3"
    | "R4"
    | "R5"
    | "R7"
    | "R8"
    | "R9";
  payoffPlan:
    | ""
    | "payoff_before_closing"
    | "leave_open"
    | "include_in_loan";
};

type Asset = {
  id: string;
  type: string;
  institution: string;
  value: number;
  forDownPayment: number;
  // amount = specific dollar amount entered; pct = percent of value
  dpMode?: "amount" | "pct";
  dpInput?: string;
};

type OtherProperty = {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  currentOwners: string[]; // applicant ids who co-own this property
  plansToSell: "yes" | "no" | "";
  usage: string;
  type: string;
  ownership: number;
  ownershipTimeframe: string; // e.g. "<1 year", "1-3 years"
  value: number;
  monthlyRental: number;
  rentalFrequency: string;
  numberOfUnits: string;
  heating: number;
  heatingIncludedInCondo: "yes" | "no" | "";
  propertyTax: number;
  propertyTaxFrequency: string;
  condoFee: number;
  condoFeeFrequency: string;
  monthlyCosts: number;
  mortgageFree: boolean;
  mortgages: PropertyMortgage[];
  include: boolean;
};

type PropertyMortgage = {
  id: string;
  position: string; // First, Second, HELOC, Private
  lender: string;
  balance: number;
  rate: number;
  rateType: string;
  termType: string;
  maturityDate: string;
  payment: number;
  paymentFrequency: string;
};

// ─── Mock seeds ────────────────────────────────────────────────────
const SECTIONS_BASE: Omit<Section, "state">[] = [
  { key: "about", shortLabel: "About", label: "About the Borrower", description: "Personal, identity, and contact details", icon: User },
  { key: "address", shortLabel: "Address", label: "Borrower Address", description: "Current & previous address history", icon: MapPin },
  { key: "income", shortLabel: "Income", label: "Employment & Income", description: "Employment, business, and other income", icon: Briefcase },
  { key: "credit", shortLabel: "Credit", label: "Credit & Liabilities", description: "Credit profile and monthly debts", icon: CreditCard },
  { key: "assets", shortLabel: "Assets", label: "Assets", description: "Down payment, reserves, and net worth", icon: PiggyBank },
  { key: "properties", shortLabel: "Properties", label: "Other Properties", description: "Properties owned outside this application", icon: Building2 },
  { key: "review", shortLabel: "Review", label: "Review & Consent", description: "Confirm details and sign required consents", icon: FileSignature },
];

const SEED_INCOME_PRIMARY: IncomeSource[] = [
  {
    id: "inc-1",
    type: "Salaried Employee",
    source: "Northwind Health",
    jobTitle: "Senior Product Manager",
    startDate: "2021-03-15",
    grossIncome: 138000,
    frequency: "Annual",
    verification: "Fully Verifiable",
    include: true,
  },
];

export const buildSeedLiabilities = (primaryId: string): Liability[] => [
  {
    id: "lia-1",
    ownerId: primaryId,
    creditor: "TD Visa",
    type: "Credit Card",
    balance: 2480,
    monthlyPayment: 75,
    shared: false,
    sharedWith: [],
    paymentHistory: "R1",
    payoffPlan: "leave_open",
  },
  {
    id: "lia-2",
    ownerId: primaryId,
    creditor: "Honda Finance",
    type: "Auto Loan",
    balance: 14900,
    monthlyPayment: 412,
    shared: false,
    sharedWith: [],
    paymentHistory: "R1",
    payoffPlan: "leave_open",
  },
];

const DEBT_TYPES = [
  "Credit Card",
  "Line of Credit",
  "Auto Loan",
  "Student Loan",
  "Payday Loan",
  "Personal Loan",
  "Other",
];

const PAYMENT_HISTORY_OPTIONS: { value: Liability["paymentHistory"]; label: string }[] = [
  { value: "R1", label: "R1 – Pays as agreed" },
  { value: "R2", label: "R2 – 30 days past due" },
  { value: "R3", label: "R3 – 60 days past due" },
  { value: "R4", label: "R4 – 90 days past due" },
  { value: "R5", label: "R5 – 120+ days past due" },
  { value: "R7", label: "R7 – Making payments under arrangement" },
  { value: "R8", label: "R8 – Repossession/voluntary return" },
  { value: "R9", label: "R9 – Bad debt/placed for collection" },
];

const PAYOFF_PLAN_OPTIONS: { value: Liability["payoffPlan"]; label: string }[] = [
  { value: "payoff_before_closing", label: "Yes – Will Pay Off Before Closing" },
  { value: "leave_open", label: "No – Leave Open" },
  { value: "include_in_loan", label: "Yes – Include in Loan" },
];

const CREDIT_SCORE_SOURCES = [
  "Equifax",
  "TransUnion",
  "Borrowell",
  "Credit Karma",
  "Bank or Lender App",
  "Other",
];

// Co-applicants are now passed in dynamically from the application's applicant list.

const LIQUID_ASSET_TYPES = new Set([
  "Chequing account",
  "Savings account",
  "TFSA",
  "RRSP",
  "FHSA",
  "Investment account",
  "GIC",
  "Stocks/bonds",
  "Crypto",
  "Gift funds",
]);
const isLiquidAsset = (type: string) => LIQUID_ASSET_TYPES.has(type);

const SEED_ASSETS_PRIMARY: Asset[] = [
  {
    id: "ast-1",
    type: "Savings account",
    institution: "RBC Royal Bank",
    value: 62500,
    forDownPayment: 50000,
    dpMode: "amount",
    dpInput: "50000",
  },
  {
    id: "ast-2",
    type: "TFSA",
    institution: "Wealthsimple",
    value: 21800,
    forDownPayment: 0,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────
const fmtMoney = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

function stateBadge(state: SectionState) {
  const map: Record<SectionState, string> = {
    "Not Started": "bg-muted text-muted-foreground",
    "In Progress": "bg-secondary/15 text-secondary",
    Complete: "bg-mint/25 text-foreground",
    "Needs Review": "bg-coral/15 text-coral",
    "Missing Required Info": "bg-yellow/30 text-yellow-foreground",
  };
  return map[state];
}

// ─── Page ──────────────────────────────────────────────────────────
export function BorrowerProfilePage({
  applicant,
  coApplicants,
  tx,
  liabilities,
  onUpsertLiability,
  onRemoveLiability,
  onLeaveSharedLiability,
  onBack,
}: {
  applicant: BorrowerProfileApplicant;
  coApplicants: BorrowerProfileApplicant[];
  tx: "Purchase" | "Pre-Purchase" | "Refinance" | "Renewal";
  liabilities: Liability[];
  onUpsertLiability: (l: Liability) => void;
  onRemoveLiability: (id: string) => void;
  onLeaveSharedLiability: (id: string, applicantId: string) => void;
  onBack: () => void;
}) {
  const isPending =
    applicant.inviteStatus === "Invite Sent" ||
    applicant.inviteStatus === "Invite Viewed" ||
    applicant.inviteStatus === "Invite Expired";
  const ownProfileOnly = applicant.accessLevel === "own_profile_only";

  // Drive section states from primary vs invited mock data
  const initialSections: Section[] = useMemo(() => {
    return SECTIONS_BASE.map((s) => {
      const state: SectionState = applicant.isPrimary
        ? s.key === "review"
          ? "Needs Review"
          : "Complete"
        : "Not Started";
      return { ...s, state };
    });
  }, [applicant.isPrimary]);

  const [sections, setSections] = useState<Section[]>(initialSections);
  const [active, setActive] = useState<SectionKey>(applicant.isPrimary ? "review" : "about");

  // Section data
  const [income, setIncome] = useState<IncomeSource[]>(
    applicant.isPrimary ? SEED_INCOME_PRIMARY : [],
  );
  const [assets, setAssets] = useState<Asset[]>(applicant.isPrimary ? SEED_ASSETS_PRIMARY : []);
  const [properties, setProperties] = useState<OtherProperty[]>([]);

  // "I have none" toggles
  const [noneIncome, setNoneIncome] = useState(false);
  const [noneLiab, setNoneLiab] = useState(false);
  const [noneAssets, setNoneAssets] = useState(false);
  const [noneProps, setNoneProps] = useState(false);

  // Drawers
  const [drawer, setDrawer] = useState<null | "income" | "liab" | "asset" | "property">(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [editingProperty, setEditingProperty] = useState<OtherProperty | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Visible liabilities for this applicant: own + any shared FROM others where this applicant is included
  const visibleLiabilities = useMemo(
    () =>
      liabilities.filter(
        (l) => l.ownerId === applicant.id || l.sharedWith.includes(applicant.id),
      ),
    [liabilities, applicant.id],
  );
  const applicantNameById = useMemo(() => {
    const map: Record<string, string> = { [applicant.id]: applicant.name };
    coApplicants.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [applicant, coApplicants]);

  // Consents
  const [consents, setConsents] = useState({
    accuracy: false,
    use: false,
    each: false,
    authorize: false,
    credit: false,
  });

  const completionPct = useMemo(() => {
    const completed = sections.filter((s) => s.state === "Complete").length;
    return Math.round((completed / sections.length) * 100);
  }, [sections]);

  const markSection = (key: SectionKey, state: SectionState) =>
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, state } : s)));

  const goNext = () => {
    const idx = sections.findIndex((s) => s.key === active);
    if (idx < sections.length - 1) setActive(sections[idx + 1].key);
  };
  const goPrev = () => {
    const idx = sections.findIndex((s) => s.key === active);
    if (idx > 0) setActive(sections[idx - 1].key);
  };

  const consentsComplete =
    consents.accuracy && consents.use && consents.each && consents.authorize;

  const handleComplete = () => {
    if (!consentsComplete) return;
    markSection("review", "Complete");
    onBack();
  };

  const activeSection = sections.find((s) => s.key === active)!;

  return (
    <div className="space-y-5">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Mortgage Application
      </button>

      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/85 p-6 text-primary-foreground shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/70">
              Borrower Profile
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold sm:text-3xl">
              About {applicant.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/80">
              Complete personal, income, credit, asset, and property details for this borrower.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill>{applicant.role}</Pill>
              <Pill icon={ShieldCheck}>{prettyAccess(applicant.accessLevel)}</Pill>
              {isPending && <Pill tone="warn">{applicant.inviteStatus}</Pill>}
              <Pill tone="muted">App {`#APP-2041`}</Pill>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/70">
              Completion
            </p>
            <p className="mt-1 text-3xl font-semibold">{completionPct}%</p>
            <p className="text-[11px] text-primary-foreground/70">Last updated · just now</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-primary-foreground/15">
            <div
              className="h-full rounded-full bg-secondary"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {isPending && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-3 text-sm">
            <div className="min-w-0">
              <p className="font-semibold">Completing on behalf of {applicant.name}</p>
              <p className="text-xs text-primary-foreground/75">
                As the account holder you have full access to fill out this co-applicant's
                profile. Invite sent to {applicant.email ?? "borrower"} · Status:{" "}
                {applicant.inviteStatus}
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary-foreground px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-foreground/90">
              <Mail className="h-3.5 w-3.5" /> Resend Invite
            </button>
          </div>
        )}
      </header>

      {/* Horizontal section stepper */}
      <nav className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Sections
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {sections.findIndex((s) => s.key === active) + 1} / {sections.length}
          </p>
        </div>
        <ol className="flex gap-2 overflow-x-auto p-2">
          {sections.map((s, i) => {
            const Icon = s.icon;
            const isActive = active === s.key;
            return (
              <li key={s.key} className="shrink-0">
                <button
                  onClick={() => setActive(s.key)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isActive
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : s.state === "Complete"
                          ? "bg-mint text-mint-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.state === "Complete" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[13px] font-medium">{s.shortLabel}</span>
                    <span
                      className={`text-[10px] ${
                        isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {s.state}
                    </span>
                  </span>
                  <Icon className="h-3.5 w-3.5 opacity-70" />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {(ownProfileOnly || true) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {ownProfileOnly && (
            <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4 text-xs">
              <div className="flex items-center gap-2 font-semibold text-secondary">
                <ShieldCheck className="h-4 w-4" /> Own Profile Only
              </div>
              <p className="mt-1.5 text-foreground/80">
                You can view and complete your own profile. Other borrower profiles and full
                application details are private.
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-yellow/40 bg-yellow/15 p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <Info className="h-4 w-4" /> Compliance
            </div>
            <p className="mt-1.5 text-foreground/80">
              Each adult borrower must complete their own consent, credit authorization, and
              declarations.
            </p>
          </div>
        </div>
      )}

      {/* Main */}
      <div>
        <section className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary">
                  Section {sections.findIndex((s) => s.key === active) + 1} of {sections.length}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-primary">{activeSection.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{activeSection.description}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${stateBadge(activeSection.state)}`}
              >
                {activeSection.state}
              </span>
            </div>

            <div className="mt-6">
              {active === "about" && <AboutSection applicant={applicant} onMark={markSection} />}
              {active === "address" && <AddressSection onMark={markSection} />}
              {active === "income" && (
                <IncomeSection
                  income={income}
                  none={noneIncome}
                  setNone={setNoneIncome}
                  onAdd={() => setDrawer("income")}
                  onRemove={(id) => setIncome((p) => p.filter((x) => x.id !== id))}
                  onMark={markSection}
                />
              )}
              {active === "credit" && (
                <CreditSection
                  liabilities={visibleLiabilities}
                  currentApplicantId={applicant.id}
                  applicantNameById={applicantNameById}
                  none={noneLiab}
                  setNone={setNoneLiab}
                  onAdd={() => {
                    setEditingLiability(null);
                    setDrawer("liab");
                  }}
                  onEdit={(l) => {
                    setEditingLiability(l);
                    setDrawer("liab");
                  }}
                  onRemove={onRemoveLiability}
                  onLeaveShared={(id) => onLeaveSharedLiability(id, applicant.id)}
                  onMark={markSection}
                />
              )}
              {active === "assets" && (
                <AssetsSection
                  assets={assets}
                  none={noneAssets}
                  setNone={setNoneAssets}
                  onAdd={() => {
                    setEditingAsset(null);
                    setDrawer("asset");
                  }}
                  onEdit={(a) => {
                    setEditingAsset(a);
                    setDrawer("asset");
                  }}
                  onRemove={(id) => setAssets((p) => p.filter((x) => x.id !== id))}
                  onMark={markSection}
                />
              )}
              {active === "properties" && (
                <PropertiesSection
                  properties={properties}
                  applicants={[
                    { id: applicant.id, name: applicant.name },
                    ...coApplicants.map((c) => ({ id: c.id, name: c.name })),
                  ]}
                  none={noneProps}
                  setNone={setNoneProps}
                  onAdd={() => {
                    setEditingProperty(null);
                    setDrawer("property");
                  }}
                  onEdit={(p) => {
                    setEditingProperty(p);
                    setDrawer("property");
                  }}
                  onRemove={(id) => setProperties((p) => p.filter((x) => x.id !== id))}
                  onMark={markSection}
                />
              )}
              {active === "review" && (
                <ReviewSection
                  sections={sections}
                  consents={consents}
                  setConsents={setConsents}
                  onJump={setActive}
                />
              )}
            </div>
          </div>

          {/* Save & continue bar */}
          <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
            <p className="text-xs text-muted-foreground">
              <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-mint" /> Autosaved · changes
              are saved as you go
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={sections[0].key === active}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              {active === "review" ? (
                <button
                  onClick={handleComplete}
                  disabled={!consentsComplete}
                  className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold ${
                    consentsComplete
                      ? "bg-mint text-mint-foreground hover:bg-mint/90"
                      : "cursor-not-allowed bg-muted text-muted-foreground"
                  }`}
                >
                  Complete Borrower Profile <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    markSection(active, "Complete");
                    goNext();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Save & Continue <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Drawers */}
      {drawer === "income" && (
        <AddIncomeDrawer
          onClose={() => setDrawer(null)}
          onSave={(data) => {
            setIncome((p) => [...p, { ...data, id: `inc-${Date.now()}` }]);
            setNoneIncome(false);
          }}
        />
      )}
      {drawer === "liab" && (
        <AddLiabilityDrawer
          coApplicants={coApplicants}
          initial={editingLiability}
          onClose={() => {
            setEditingLiability(null);
            setDrawer(null);
          }}
          onSave={(data) => {
            const next: Liability = editingLiability
              ? { ...editingLiability, ...data }
              : { ...data, id: `lia-${Date.now()}`, ownerId: applicant.id };
            onUpsertLiability(next);
            setNoneLiab(false);
            setEditingLiability(null);
            setDrawer(null);
          }}
        />
      )}
      {drawer === "asset" && (
        <AddAssetDrawer
          tx={tx}
          initial={editingAsset}
          applicantId={applicant.id}
          applicantName={applicant.name}
          onClose={() => {
            setDrawer(null);
            setEditingAsset(null);
          }}
          onSave={(data) => {
            const id = editingAsset?.id ?? `ast-${Date.now()}`;
            setAssets((p) =>
              editingAsset
                ? p.map((x) => (x.id === id ? { ...data, id } : x))
                : [...p, { ...data, id }],
            );
            // Sync down-payment contribution to localStorage so the
            // Down Payment page can auto-populate the source
            if (typeof window !== "undefined") {
              try {
                const key = "approvu:dp-contributions";
                const raw = window.localStorage.getItem(key);
                const list: Array<{
                  assetId: string;
                  ownerId: string;
                  ownerName: string;
                  type: string;
                  institution: string;
                  amount: number;
                }> = raw ? JSON.parse(raw) : [];
                const filtered = list.filter((x) => x.assetId !== id);
                if (data.forDownPayment > 0) {
                  filtered.push({
                    assetId: id,
                    ownerId: applicant.id,
                    ownerName: applicant.name,
                    type: data.type,
                    institution: data.institution,
                    amount: data.forDownPayment,
                  });
                }
                window.localStorage.setItem(key, JSON.stringify(filtered));
              } catch {
                // ignore storage failures
              }
            }
            setNoneAssets(false);
            setEditingAsset(null);
            setDrawer(null);
          }}
        />
      )}
      {drawer === "property" && (
        <AddOtherPropertyDrawer
          initial={editingProperty}
          applicants={[
            { id: applicant.id, name: applicant.name },
            ...coApplicants.map((c) => ({ id: c.id, name: c.name })),
          ]}
          onClose={() => {
            setDrawer(null);
            setEditingProperty(null);
          }}
          onSave={(data) => {
            setProperties((prev) =>
              editingProperty
                ? prev.map((x) => (x.id === editingProperty.id ? { ...data, id: editingProperty.id } : x))
                : [...prev, { ...data, id: `prop-${Date.now()}` }],
            );
            setNoneProps(false);
            setDrawer(null);
            setEditingProperty(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Sections ──────────────────────────────────────────────────────
function AboutSection({
  applicant,
  onMark,
}: {
  applicant: BorrowerProfileApplicant;
  onMark: (k: SectionKey, s: SectionState) => void;
}) {
  const [first, setFirst] = useState(applicant.name.split(" ")[0] ?? "");
  const [last, setLast] = useState(applicant.name.split(" ").slice(1).join(" "));
  const [dob, setDob] = useState("");
  const [marital, setMarital] = useState("Married");
  const [dependents, setDependents] = useState("0");
  const [residency, setResidency] = useState("Canadian Citizen");
  const [email, setEmail] = useState(applicant.email ?? "");
  const [phone, setPhone] = useState("");
  const [contactPref, setContactPref] = useState("Email");

  return (
    <div className="space-y-6">
      <Group title="Personal Information">
        <Field label="Legal first name" required>
          <Input value={first} onChange={setFirst} />
        </Field>
        <Field label="Legal middle name">
          <Input />
        </Field>
        <Field label="Legal last name" required>
          <Input value={last} onChange={setLast} />
        </Field>
        <Field label="Preferred name">
          <Input placeholder="Optional" />
        </Field>
        <Field label="Date of birth" required>
          <Input type="date" value={dob} onChange={setDob} />
        </Field>
        <Field label="Marital status">
          <Select
            value={marital}
            onChange={setMarital}
            options={["Single", "Married", "Common-Law", "Separated", "Divorced", "Widowed"]}
          />
        </Field>
        <Field label="Number of dependents">
          <Input value={dependents} onChange={setDependents} />
        </Field>
        <Field label="Citizenship / Residency">
          <Select
            value={residency}
            onChange={setResidency}
            options={["Canadian Citizen", "Permanent Resident", "Work Permit", "Other"]}
          />
        </Field>
      </Group>

      <Group title="Contact Information">
        <Field label="Email" required>
          <Input value={email} onChange={setEmail} type="email" />
        </Field>
        <Field label="Mobile phone" required>
          <Input value={phone} onChange={setPhone} placeholder="(555) 555-5555" />
        </Field>
        <Field label="Alternate phone">
          <Input placeholder="Optional" />
        </Field>
        <Field label="Preferred contact method">
          <Select
            value={contactPref}
            onChange={setContactPref}
            options={["Email", "Mobile", "SMS", "Call"]}
          />
        </Field>
      </Group>

      <Group title="Borrower Role">
        <Field label="Role on this application" full>
          <Select
            value={applicant.role}
            onChange={() => {}}
            options={[
              "Primary Applicant",
              "Co-Applicant",
              "Co-Borrower",
              "Guarantor",
              "Spouse / Partner",
              "Non-Applicant Property Owner",
            ]}
          />
        </Field>
      </Group>

      <Group title="Application Participation">
        <YesNo
          label="Will this borrower be on title?"
          warnOnNo="Lenders strongly prefer every applicant on the mortgage to also be on title. Selecting No may disqualify this mortgage application or require lender exception approval."
        />
        <YesNo label="Will this borrower be on the mortgage?" />
        <YesNo label="Will this borrower provide income?" />
        <YesNo label="Will this borrower provide down payment / assets?" />
        <YesNo label="Will this borrower's debts be included?" />
        <YesNo label="Is this borrower occupying the property?" />
      </Group>

      <SectionFootHelp
        text="Updating legal name or date of birth after lender submission may require support to re-issue documents."
      />
      <input type="hidden" onChange={() => onMark("about", "In Progress")} />
    </div>
  );
}

function AddressSection({ onMark }: { onMark: (k: SectionKey, s: SectionState) => void }) {
  const [years, setYears] = useState("3");
  const [housing, setHousing] = useState("Own");
  const [mailingSame, setMailingSame] = useState(true);
  const needsPrev = parseInt(years || "0", 10) < 3;

  return (
    <div className="space-y-6">
      <Group title="Current Address">
        <Field label="Street address" required full>
          <AddressAutocompleteInput placeholder="Start typing your address…" />
        </Field>
        <Field label="Unit / Suite">
          <Input />
        </Field>
        <Field label="City" required>
          <Input />
        </Field>
        <Field label="Province" required>
          <Select
            options={["AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK", "NT", "NU", "YT"]}
          />
        </Field>
        <Field label="Postal code" required>
          <Input placeholder="A1A 1A1" />
        </Field>
        <Field label="Country" required>
          <Select options={["Canada", "United States", "Other"]} />
        </Field>
        <Field label="Housing status" required>
          <Select
            value={housing}
            onChange={setHousing}
            options={["Own", "Rent", "Live with family", "Employer-provided", "Other"]}
          />
        </Field>
        <Field label="Years at address" required>
          <Input value={years} onChange={setYears} />
        </Field>
        <Field label="Months at address">
          <Input placeholder="0" />
        </Field>
        <Field label="Monthly housing payment">
          <Input placeholder="$0" />
        </Field>
      </Group>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mailingSame}
          onChange={(e) => setMailingSame(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        Mailing address is the same as current address
      </label>

      {needsPrev && (
        <div className="rounded-xl border border-coral/40 bg-coral/10 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-coral">
            <AlertCircle className="h-4 w-4" /> Previous address required to continue
          </div>
          <p className="mt-1 text-xs text-foreground/80">
            A minimum of <span className="font-semibold">3 years</span> of address history is
            required before proceeding. Add previous addresses until your combined history covers
            at least 3 years.
          </p>
          <button className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> Add Previous Address
          </button>
        </div>
      )}

      <input type="hidden" onChange={() => onMark("address", "In Progress")} />
    </div>
  );
}

function IncomeSection({
  income,
  none,
  setNone,
  onAdd,
  onRemove,
  onMark,
}: {
  income: IncomeSource[];
  none: boolean;
  setNone: (v: boolean) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMark: (k: SectionKey, s: SectionState) => void;
}) {
  const totalDeclared = income.reduce(
    (sum, i) => sum + (i.frequency === "Annual" ? i.grossIncome : i.grossIncome * 12),
    0,
  );
  const verified = income
    .filter((i) => i.verification === "Fully Verifiable")
    .reduce((s, i) => s + (i.frequency === "Annual" ? i.grossIncome : i.grossIncome * 12), 0);
  const included = income
    .filter((i) => i.include)
    .reduce((s, i) => s + (i.frequency === "Annual" ? i.grossIncome : i.grossIncome * 12), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total declared" value={fmtMoney(totalDeclared)} />
        <Stat label="Fully verifiable" value={fmtMoney(verified)} tone="mint" />
        <Stat label="Included" value={fmtMoney(included)} tone="secondary" />
        <Stat label="Sources" value={`${income.length}`} />
      </div>

      {income.map((i) => (
        <div
          key={i.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                {i.type}
              </span>
              {i.include && (
                <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  Included
                </span>
              )}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {i.verification}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-foreground">
              {i.source}
              {i.jobTitle ? ` · ${i.jobTitle}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {fmtMoney(i.grossIncome)} {i.frequency.toLowerCase()} · since {i.startDate}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button className="rounded-md border border-input bg-background p-1.5 text-foreground hover:bg-muted">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onRemove(i.id)}
              className="rounded-md border border-input bg-background p-1.5 text-coral hover:bg-coral/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {income.length === 0 && !none && (
        <EmptyState
          icon={Briefcase}
          title="No income sources added yet"
          body="Add all sources of income for this borrower. We'll determine eligibility at qualification."
        />
      )}

      <NoneToggle
        checked={none}
        onChange={setNone}
        label="I have no income to declare for this borrower."
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Income Source
        </button>
        <button
          onClick={() => onMark("income", income.length > 0 || none ? "Complete" : "In Progress")}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          Save Progress
        </button>
      </div>
    </div>
  );
}

function CreditSection({
  liabilities,
  currentApplicantId,
  applicantNameById,
  none,
  setNone,
  onAdd,
  onEdit,
  onRemove,
  onLeaveShared,
  onMark,
}: {
  liabilities: Liability[];
  currentApplicantId: string;
  applicantNameById: Record<string, string>;
  none: boolean;
  setNone: (v: boolean) => void;
  onAdd: () => void;
  onEdit: (l: Liability) => void;
  onRemove: (id: string) => void;
  onLeaveShared: (id: string) => void;
  onMark: (k: SectionKey, s: SectionState) => void;
}) {
  const [creditScore, setCreditScore] = useState("");
  const [scoreSource, setScoreSource] = useState("");
  const [bankruptcy, setBankruptcy] = useState<"yes" | "no" | "">("");
  const [bankruptcyType, setBankruptcyType] = useState<"bankruptcy" | "consumer_proposal" | "">("");
  const [bankruptcyActive, setBankruptcyActive] = useState<"yes" | "no" | "">("");
  const [dischargedWhen, setDischargedWhen] = useState<string>("");
  // Only count debts owned by this applicant — shared debts are counted on the
  // owner's profile to avoid double counting in the qualification ratios.
  const ownLiabilities = liabilities.filter((l) => l.ownerId === currentApplicantId);
  const totalBalance = ownLiabilities.reduce((s, l) => s + l.balance, 0);
  const totalMonthly = ownLiabilities
    .filter((l) => l.payoffPlan !== "payoff_before_closing")
    .reduce((s, l) => s + l.monthlyPayment, 0);
  const payoff = ownLiabilities
    .filter((l) => l.payoffPlan === "payoff_before_closing")
    .reduce((s, l) => s + l.balance, 0);

  const scoreNum = Number(creditScore);
  const scoreInvalid =
    creditScore.length > 0 && (Number.isNaN(scoreNum) || scoreNum < 300 || scoreNum > 850);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-xl border border-secondary/30 bg-secondary/5 p-3 text-xs text-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
        <div>
          <p className="font-semibold">Why we ask for this information</p>
          <p className="mt-0.5 text-muted-foreground">
            We're requesting detailed credit information to prevent checking your credit report at this early stage,
            which could impact your score. All the information we're asking for can be found on your credit report,
            and we'll ask you to upload a copy later to help our agents avoid pulling your credit record unnecessarily.
          </p>
        </div>
      </div>

      <Group title="Credit Score Information">
        <Field label="What is your current credit score?" required full>
          <Input
            type="number"
            value={creditScore}
            onChange={setCreditScore}
            placeholder="e.g. 720"
          />
          <p className={`mt-1 text-[11px] ${scoreInvalid ? "text-coral" : "text-muted-foreground"}`}>
            {scoreInvalid
              ? "Please enter a score between 300 and 850."
              : "Enter your exact credit score (300–850)"}
          </p>
        </Field>
        <Field label="Where did you check your credit score?" full>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CREDIT_SCORE_SOURCES.map((s) => (
              <label
                key={s}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  scoreSource === s
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="score-source"
                  checked={scoreSource === s}
                  onChange={() => setScoreSource(s)}
                  className="h-3.5 w-3.5"
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </Field>
        <div className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-coral/40 bg-coral/10 p-3 text-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
          <div>
            <p className="font-semibold text-foreground">Credit Report Upload Required</p>
            <p className="mt-0.5 text-muted-foreground">
              Please upload a copy of your credit report in the document section of your application.
              This helps our agents avoid pulling your credit record and saves costs.
            </p>
          </div>
        </div>
      </Group>

      <Group title="Negative Credit Events">
        <div className="sm:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
            <span className="text-sm text-foreground">
              Have you ever filed for a Consumer Proposal or Bankruptcy?
            </span>
            <div className="flex items-center gap-1.5">
              {(["yes", "no"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setBankruptcy(opt);
                    if (opt === "no") {
                      setBankruptcyType("");
                      setBankruptcyActive("");
                      setDischargedWhen("");
                    }
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${
                    bankruptcy === opt
                      ? "bg-primary text-primary-foreground"
                      : "border border-input bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {opt === "yes" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {bankruptcy === "yes" && (
            <div className="ml-1 space-y-4 border-l-2 border-secondary/40 pl-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Which one applies to you?
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {([
                    ["bankruptcy", "Bankruptcy"],
                    ["consumer_proposal", "Consumer Proposal"],
                  ] as const).map(([val, label]) => (
                    <label key={val} className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="bankruptcy-type"
                        checked={bankruptcyType === val}
                        onChange={() => setBankruptcyType(val)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {bankruptcyType && (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Is it still active?</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {(["yes", "no"] as const).map((opt) => (
                      <label key={opt} className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
                        <input
                          type="radio"
                          name="bankruptcy-active"
                          checked={bankruptcyActive === opt}
                          onChange={() => {
                            setBankruptcyActive(opt);
                            if (opt === "yes") setDischargedWhen("");
                          }}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        {opt === "yes" ? "Yes" : "No"}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {bankruptcyType && bankruptcyActive === "no" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">When was it discharged?</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      "Less than 12 months ago",
                      "Just over 1 year ago",
                      "2 years ago",
                      "Over 2 years ago",
                    ].map((opt) => (
                      <label key={opt} className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
                        <input
                          type="radio"
                          name="discharged-when"
                          checked={dischargedWhen === opt}
                          onChange={() => setDischargedWhen(opt)}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Group>

      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Current Debt Obligations
        </h3>
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-coral/30 bg-coral/5 p-3 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
          <p>
            <span className="font-semibold">Note:</span> Please list all non-mortgage debts only.
            Existing mortgage details will be captured in a separate section.
          </p>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Liabilities" value={`${liabilities.length}`} />
          <Stat label="Total balance" value={fmtMoney(totalBalance)} />
          <Stat label="Monthly (kept)" value={fmtMoney(totalMonthly)} tone="secondary" />
          <Stat label="Pay off before closing" value={fmtMoney(payoff)} tone="mint" />
        </div>

        {liabilities.map((l, i) => {
          const isOwn = l.ownerId === currentApplicantId;
          const ownerName = applicantNameById[l.ownerId] ?? "another applicant";
          const sharedNames = l.sharedWith
            .map((id) => applicantNameById[id])
            .filter(Boolean);
          return (
            <div
              key={l.id}
              className={`mt-2 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                isOwn ? "border-border bg-background" : "border-secondary/30 bg-secondary/5"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Debt #{i + 1}
                  </span>
                  <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                    {l.type}
                  </span>
                  {!isOwn && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                      Auto-filled · Shared from {ownerName}
                    </span>
                  )}
                  {isOwn && l.shared && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      Shared
                    </span>
                  )}
                  {l.paymentHistory && (
                    <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                      {l.paymentHistory}
                    </span>
                  )}
                  {l.payoffPlan === "payoff_before_closing" && (
                    <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                      Pay off before closing
                    </span>
                  )}
                  {l.payoffPlan === "include_in_loan" && (
                    <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                      Include in loan
                    </span>
                  )}
                  {!isOwn && (
                    <span className="rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                      Counted on {ownerName}'s profile
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-foreground">{l.creditor}</p>
                <p className="text-xs text-muted-foreground">
                  Balance {fmtMoney(l.balance)} · {fmtMoney(l.monthlyPayment)}/mo
                  {isOwn && l.shared && sharedNames.length > 0 && (
                    <> · Shared with {sharedNames.join(", ")}</>
                  )}
                </p>
                {!isOwn && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Edits are made on {ownerName}'s profile to keep both records in sync. This debt
                    is only counted once in the qualification ratios.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {isOwn ? (
                  <>
                    <button
                      onClick={() => onEdit(l)}
                      className="rounded-md border border-input bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRemove(l.id)}
                      className="rounded-md border border-input bg-background p-1.5 text-coral hover:bg-coral/10"
                      aria-label="Remove debt"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onLeaveShared(l.id)}
                    className="rounded-md border border-input bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                  >
                    Not mine
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {liabilities.length === 0 && !none && (
          <EmptyState
            icon={CreditCard}
            title="No liabilities added yet"
            body="Add credit cards, loans, lines of credit, or any monthly debts."
          />
        )}
      </div>

      <NoneToggle
        checked={none}
        onChange={setNone}
        label="I have no liabilities or debts to declare."
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Debt
        </button>
        <button
          onClick={() =>
            onMark("credit", liabilities.length > 0 || none ? "Complete" : "In Progress")
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          Save Progress
        </button>
      </div>
    </div>
  );
}

function AssetsSection({
  assets,
  none,
  setNone,
  onAdd,
  onEdit,
  onRemove,
  onMark,
}: {
  assets: Asset[];
  none: boolean;
  setNone: (v: boolean) => void;
  onAdd: () => void;
  onEdit: (a: Asset) => void;
  onRemove: (id: string) => void;
  onMark: (k: SectionKey, s: SectionState) => void;
}) {
  const total = assets.reduce((s, a) => s + a.value, 0);
  const downpayment = assets.reduce((s, a) => s + a.forDownPayment, 0);
  const liquid = assets.filter((a) => isLiquidAsset(a.type)).reduce((s, a) => s + a.value, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total assets" value={fmtMoney(total)} />
        <Stat label="For down payment" value={fmtMoney(downpayment)} tone="mint" />
        <Stat label="Liquid" value={fmtMoney(liquid)} tone="secondary" />
        <Stat label="Records" value={`${assets.length}`} />
      </div>

      {assets.map((a) => (
        <div
          key={a.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                {a.type}
              </span>
              {isLiquidAsset(a.type) && (
                <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  Liquid
                </span>
              )}
              {a.forDownPayment > 0 && (
                <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                  Down payment {fmtMoney(a.forDownPayment)}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{a.institution}</p>
            <p className="text-xs text-muted-foreground">
              Value {fmtMoney(a.value)} · Down payment {fmtMoney(a.forDownPayment)}
            </p>
          </div>
          <div className="flex items-center gap-1 self-start sm:self-center">
            <button
              onClick={() => onEdit(a)}
              className="rounded-md border border-input bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
            >
              Edit
            </button>
            <button
              onClick={() => onRemove(a.id)}
              className="rounded-md border border-input bg-background p-1.5 text-coral hover:bg-coral/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {assets.length === 0 && !none && (
        <EmptyState
          icon={Wallet}
          title="No assets added yet"
          body="Add chequing, savings, investments, gift funds, or any other assets."
        />
      )}

      <NoneToggle
        checked={none}
        onChange={setNone}
        label="I have no assets to declare for this borrower."
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Asset
        </button>
        <button
          onClick={() => onMark("assets", assets.length > 0 || none ? "Complete" : "In Progress")}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          Save Progress
        </button>
      </div>
    </div>
  );
}

function PropertiesSection({
  properties,
  applicants,
  none,
  setNone,
  onAdd,
  onEdit,
  onRemove,
  onMark,
}: {
  properties: OtherProperty[];
  applicants: { id: string; name: string }[];
  none: boolean;
  setNone: (v: boolean) => void;
  onAdd: () => void;
  onEdit: (p: OtherProperty) => void;
  onRemove: (id: string) => void;
  onMark: (k: SectionKey, s: SectionState) => void;
}) {
  const sumMortgages = (p: OtherProperty) =>
    p.mortgageFree ? 0 : p.mortgages.reduce((s, m) => s + (m.balance || 0), 0);
  const sumPayments = (p: OtherProperty) =>
    p.mortgageFree ? 0 : p.mortgages.reduce((s, m) => s + (m.payment || 0), 0);
  const totalValue = properties.reduce((s, p) => s + p.value, 0);
  const totalMort = properties.reduce((s, p) => s + sumMortgages(p), 0);
  const equity = totalValue - totalMort;
  const rental = properties.reduce((s, p) => s + p.monthlyRental, 0);
  const carrying = properties.reduce(
    (s, p) => s + (p.monthlyCosts || 0) + (p.propertyTax || 0) + (p.condoFee || 0) + (p.heating || 0) + sumPayments(p),
    0,
  );
  const includedCount = properties.filter((p) => p.include).length;
  const ltv = totalValue > 0 ? Math.round((totalMort / totalValue) * 100) : 0;
  const applicantNameById = useMemo(() => {
    const m: Record<string, string> = {};
    applicants.forEach((a) => (m[a.id] = a.name));
    return m;
  }, [applicants]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Properties" value={`${properties.length}`} />
        <Stat label="Included in qual." value={`${includedCount}`} tone="secondary" />
        <Stat label="Total value" value={fmtMoney(totalValue)} />
        <Stat label="Total mortgages" value={fmtMoney(totalMort)} />
        <Stat label="Estimated equity" value={fmtMoney(equity)} tone="mint" />
        <Stat label="Portfolio LTV" value={`${ltv}%`} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Monthly rental income" value={`${fmtMoney(rental)}/mo`} tone="mint" />
        <Stat label="Monthly carrying costs" value={`${fmtMoney(carrying)}/mo`} />
        <Stat label="Net cash flow" value={`${fmtMoney(rental - carrying)}/mo`} />
      </div>

      {properties.map((p) => {
        const pMort = sumMortgages(p);
        const pEquity = p.value - pMort;
        const pLtv = p.value > 0 ? Math.round((pMort / p.value) * 100) : 0;
        return (
          <div key={p.id} className="rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                    {p.usage}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {p.type}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {p.ownership}% owned
                  </span>
                  {p.mortgageFree && (
                    <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                      Mortgage free
                    </span>
                  )}
                  {p.plansToSell === "yes" && (
                    <span className="rounded-full bg-yellow/30 px-2 py-0.5 text-[10px] font-semibold text-yellow-foreground">
                      Selling soon
                    </span>
                  )}
                  {p.include && (
                    <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                      Included
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-foreground">{p.address}</p>
                <p className="text-xs text-muted-foreground">
                  {p.city}, {p.province} {p.postalCode ?? ""}
                </p>
                {p.currentOwners.length > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Owners: {p.currentOwners.map((id) => applicantNameById[id] ?? id).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(p)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={() => onRemove(p.id)}
                  className="rounded-md border border-input bg-background p-1.5 text-coral hover:bg-coral/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              <Tiny label="Value" value={fmtMoney(p.value)} />
              <Tiny label="Mortgages" value={fmtMoney(pMort)} />
              <Tiny label="Equity" value={fmtMoney(pEquity)} />
              <Tiny label="LTV" value={`${pLtv}%`} />
              <Tiny label="Rental" value={`${fmtMoney(p.monthlyRental)}/mo`} />
              <Tiny label="Tax + condo + heat" value={`${fmtMoney((p.propertyTax || 0) + (p.condoFee || 0) + (p.heating || 0))}/mo`} />
            </dl>
            {!p.mortgageFree && p.mortgages.length > 0 && (
              <div className="mt-3 space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Mortgages on this property
                </p>
                {p.mortgages.map((m, i) => (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground">
                      #{i + 1} · {m.position || "Mortgage"} · {m.lender || "—"}
                    </span>
                    <span className="text-muted-foreground">
                      {fmtMoney(m.balance || 0)} @ {m.rate || 0}% {m.rateType ? `· ${m.rateType}` : ""} · {fmtMoney(m.payment || 0)}/{m.paymentFrequency || "mo"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {properties.length === 0 && !none && (
        <EmptyState
          icon={Building2}
          title="No other properties added yet"
          body="Add any real estate this borrower owns or co-owns outside this application."
        />
      )}

      <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-secondary">
          <Info className="h-4 w-4" /> Why this matters
        </div>
        <p className="mt-1 text-foreground/80">
          Other properties affect affordability, can offset rental income, and help approvU
          identify future refinance, renewal, and homeownership opportunities.
        </p>
      </div>

      <NoneToggle
        checked={none}
        onChange={setNone}
        label="I do not own any other properties."
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Other Property
        </button>
        <button
          onClick={() =>
            onMark("properties", properties.length > 0 || none ? "Complete" : "In Progress")
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          Save Progress
        </button>
      </div>
    </div>
  );
}

function ReviewSection({
  sections,
  consents,
  setConsents,
  onJump,
}: {
  sections: Section[];
  consents: { accuracy: boolean; use: boolean; each: boolean; authorize: boolean; credit: boolean };
  setConsents: (c: typeof consents) => void;
  onJump: (k: SectionKey) => void;
}) {
  const sectionList = sections.filter((s) => s.key !== "review");
  const set = (k: keyof typeof consents, v: boolean) => setConsents({ ...consents, [k]: v });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {sectionList.map((s) => (
          <button
            key={s.key}
            onClick={() => onJump(s.key)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5 text-left hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <s.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stateBadge(s.state)}`}
              >
                {s.state}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <h3 className="text-sm font-semibold text-foreground">Borrower Declarations</h3>
        <div className="mt-3 space-y-3 text-sm">
          <Consent
            checked={consents.accuracy}
            onChange={(v) => set("accuracy", v)}
            text="I confirm the information I provided is accurate to the best of my knowledge."
          />
          <Consent
            checked={consents.use}
            onChange={(v) => set("use", v)}
            text="I understand approvU may use this information to assess mortgage options and prepare my application."
          />
          <Consent
            checked={consents.each}
            onChange={(v) => set("each", v)}
            text="I understand each applicant must provide their own consent."
          />
          <Consent
            checked={consents.authorize}
            onChange={(v) => set("authorize", v)}
            text="I authorize approvU to use my information for this mortgage application."
          />
        </div>
      </div>

      <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-5">
        <h3 className="text-sm font-semibold text-secondary">Credit Consent</h3>
        <div className="mt-3 text-sm">
          <Consent
            checked={consents.credit}
            onChange={(v) => set("credit", v)}
            text="I consent to a credit check for mortgage qualification and application purposes. This consent is borrower-specific."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Drawers ───────────────────────────────────────────────────────
function DrawerShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-background px-6 py-4 sm:px-10">
        <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </div>
      <footer className="sticky bottom-0 border-t border-border bg-background px-6 py-4 sm:px-10">
        <div className="mx-auto w-full max-w-4xl">{footer}</div>
      </footer>
    </div>
  );
}

function AddIncomeDrawer({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (d: Omit<IncomeSource, "id">) => void;
}) {
  // Top-level income category
  const [category, setCategory] = useState<"employed" | "self_employed" | "other">("employed");

  // Shared
  const [employerName, setEmployerName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("Select your industry");
  const [startDate, setStartDate] = useState("");
  const [include, setInclude] = useState(true);

  // Employed specifics
  const [employmentType, setEmploymentType] = useState<
    "Full-Time Employee" | "Part-Time Employee" | "Contract Employee" | "Seasonal Employee"
  >("Full-Time Employee");
  const [employmentStatus, setEmploymentStatus] = useState<"Current" | "Previous">("Current");
  const [onLeave, setOnLeave] = useState<"yes" | "no">("no");

  const [components, setComponents] = useState<{
    base: boolean;
    overtime: boolean;
    bonus: boolean;
    commission: boolean;
  }>({ base: true, overtime: false, bonus: false, commission: false });

  const [baseSalary, setBaseSalary] = useState("");
  const [overtimeIncluded, setOvertimeIncluded] = useState<"yes" | "no">("no");
  const [overtimeAmount, setOvertimeAmount] = useState("");
  const [bonusIncluded, setBonusIncluded] = useState<"yes" | "no">("no");
  const [bonusAmount, setBonusAmount] = useState("");
  const [commissionIncluded, setCommissionIncluded] = useState<"yes" | "no">("no");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [commissionTenure, setCommissionTenure] = useState<"<1y" | "1-2y" | "2+y">("2+y");

  // Self-employed specifics
  const [seType, setSeType] = useState<
    "Sole Proprietor" | "Incorporated Business Owner" | "Partnership" | "Freelancer / Contractor"
  >("Sole Proprietor");
  const [ownershipPct, setOwnershipPct] = useState("100");
  const [grossBusiness, setGrossBusiness] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [seVerification, setSeVerification] = useState("T1 General + NOA (2 years)");
  const [gstRegistered, setGstRegistered] = useState<"yes" | "no">("no");
  const [businessNumber, setBusinessNumber] = useState("");
  const [employees, setEmployees] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [incomeTrend, setIncomeTrend] = useState<"increasing" | "stable" | "declining">("stable");
  const [twoYearAvg, setTwoYearAvg] = useState("");
  const [addBacks, setAddBacks] = useState("");
  const [accountantName, setAccountantName] = useState("");
  const [accountantContact, setAccountantContact] = useState("");
  const [seIncomeBasis, setSeIncomeBasis] = useState<"net" | "gross_up" | "stated">("net");

  // Other income specifics
  const OTHER_INCOME_TYPES = [
    "Pension",
    "CPP / OAS",
    "Disability Benefit",
    "Social Benefit",
    "Social Assistance",
    "Child Tax Benefit",
    "Canada Child Benefit",
    "Child Support",
    "Alimony / Spousal Support",
    "Foster Care",
    "Rental Income",
    "Investment Income",
    "Dividends",
    "Tipped Income",
    "Foreign Income",
    "Gig Income",
    "Other",
  ] as const;
  const [otherType, setOtherType] = useState<string>("");
  const [otherSource, setOtherSource] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [otherFrequency, setOtherFrequency] =
    useState<IncomeSource["frequency"]>("Annual");
  const [otherStart, setOtherStart] = useState("");
  const [otherDuration, setOtherDuration] = useState<"<1y" | "1-2y" | "2-3y" | "3+y">("3+y");
  const [otherContinuance, setOtherContinuance] = useState<"yes" | "no" | "unknown">("yes");
  const [otherVerification, setOtherVerification] = useState("Government Award Letter");

  const [addedCount, setAddedCount] = useState(0);

  const resetOtherForm = () => {
    setOtherType("");
    setOtherSource("");
    setOtherAmount("");
    setOtherFrequency("Annual");
    setOtherStart("");
    setOtherDuration("3+y");
    setOtherContinuance("yes");
    setOtherVerification("Government Award Letter");
  };

  const computedEmployedTotal =
    Number(baseSalary || 0) +
    (overtimeIncluded === "no" ? Number(overtimeAmount || 0) : 0) +
    (bonusIncluded === "no" ? Number(bonusAmount || 0) : 0) +
    (commissionIncluded === "no" ? Number(commissionAmount || 0) : 0);

  const valid =
    category === "other"
      ? otherType.length > 0 && Number(otherAmount) > 0
      : employerName.trim().length > 0 &&
        (category === "employed" ? computedEmployedTotal > 0 : Number(netIncome) > 0);

  const performSave = () => {
    if (category === "employed") {
      onSave({
        type: employmentType,
        source: employerName,
        jobTitle,
        startDate,
        grossIncome: computedEmployedTotal,
        frequency: "Annual",
        verification: employmentStatus === "Previous" ? "Previous Employment" : "Fully Verifiable",
        include,
      });
    } else if (category === "self_employed") {
      onSave({
        type: seType,
        source: employerName,
        jobTitle,
        startDate,
        grossIncome: Number(netIncome),
        frequency: "Annual",
        verification: seVerification,
        include,
      });
    } else {
      onSave({
        type: otherType || "Other Income",
        source: otherSource || otherType || "Other Income",
        startDate: otherStart,
        grossIncome: Number(otherAmount),
        frequency: otherFrequency,
        verification: otherVerification,
        include,
      });
    }
    setAddedCount((n) => n + 1);
  };

  const handleSave = () => {
    performSave();
    onClose();
  };

  const handleSaveAndAddAnother = () => {
    performSave();
    resetOtherForm();
  };

  return (
    <DrawerShell
      title="Add Income Source"
      subtitle="Tell us about this borrower's employment or self-employment income."
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          {addedCount > 0 && (
            <span className="mr-auto text-xs text-muted-foreground">
              {addedCount} income source{addedCount === 1 ? "" : "s"} added
            </span>
          )}
          <button
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            {addedCount > 0 ? "Done" : "Cancel"}
          </button>
          {category === "other" && (
            <button
              disabled={!valid}
              onClick={handleSaveAndAddAnother}
              className={`rounded-md border px-3.5 py-2 text-xs font-semibold ${
                valid
                  ? "border-primary text-primary hover:bg-primary/10"
                  : "cursor-not-allowed border-muted text-muted-foreground"
              }`}
            >
              Save & add another
            </button>
          )}
          <button
            disabled={!valid}
            onClick={handleSave}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold ${
              valid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            Save Income Source
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Category toggle */}
        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">
            What type of income are you adding?
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                { key: "employed", label: "Employed", hint: "T4 employee paid by an employer" },
                {
                  key: "self_employed",
                  label: "Self-Employed",
                  hint: "Owns a business, freelancer or contractor",
                },
                {
                  key: "other",
                  label: "Other Income",
                  hint: "Pension, benefits, rental, investment, support",
                },
              ] as const
            ).map((opt) => {
              const active = category === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setCategory(opt.key)}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-secondary bg-secondary/10"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      active ? "text-secondary" : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{opt.hint}</p>
                </button>
              );
            })}
          </div>
        </div>

        {category === "employed" && (
          <>
            {/* Employment overview */}
            <SubGroup
              icon={Briefcase}
              title="Employment Overview"
              subtitle="Basic details about this position"
            >
              <Field label="How are you employed?" full>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      "Full-Time Employee",
                      "Part-Time Employee",
                      "Contract Employee",
                      "Seasonal Employee",
                    ] as const
                  ).map((t) => {
                    const a = employmentType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEmploymentType(t)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          a
                            ? "border-secondary bg-secondary/10 text-secondary"
                            : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        {t.replace(" Employee", "")}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Employer name" required full>
                <Input value={employerName} onChange={setEmployerName} placeholder="Enter employer name" />
              </Field>
              <Field label="Job title">
                <Input value={jobTitle} onChange={setJobTitle} placeholder="Enter your job title" />
              </Field>
              <Field label="Industry">
                <Select
                  value={industry}
                  onChange={setIndustry}
                  options={[
                    "Select your industry",
                    "Technology",
                    "Healthcare",
                    "Finance & Insurance",
                    "Education",
                    "Construction & Trades",
                    "Retail & Hospitality",
                    "Manufacturing",
                    "Government / Public Sector",
                    "Transportation",
                    "Professional Services",
                    "Other",
                  ]}
                />
              </Field>
              <Field label="Employment status">
                <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2">
                  {(["Current", "Previous"] as const).map((s) => (
                    <label key={s} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        checked={employmentStatus === s}
                        onChange={() => setEmploymentStatus(s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Start date with this employer">
                <Input type="date" value={startDate} onChange={setStartDate} />
              </Field>
              <Field label="Currently on short-term leave?" full>
                <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2">
                  {(["yes", "no"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        checked={onLeave === v}
                        onChange={() => setOnLeave(v)}
                      />
                      {v === "yes" ? "Yes" : "No"}
                    </label>
                  ))}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    Parental, medical, or disability leave
                  </span>
                </div>
              </Field>
            </SubGroup>

            {/* Income type chips */}
            <SubGroup
              icon={Wallet}
              title="How is this employment income paid?"
              subtitle="Select all income types received from this employer"
            >
              <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-4">
                {(
                  [
                    { key: "base", label: "Base Salary" },
                    { key: "overtime", label: "Overtime" },
                    { key: "bonus", label: "Bonus" },
                    { key: "commission", label: "Commission" },
                  ] as const
                ).map((c) => {
                  const a = components[c.key];
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setComponents((p) => ({ ...p, [c.key]: !p[c.key] }))}
                      className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                        a
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </SubGroup>

            {/* Income breakdown */}
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Info className="h-3.5 w-3.5 text-secondary" /> Income Breakdown
              </p>

              {components.base && (
                <BreakdownCard title="Base Salary">
                  <Field label="Annual base salary" required full>
                    <Input value={baseSalary} onChange={setBaseSalary} placeholder="$75,000" />
                  </Field>
                </BreakdownCard>
              )}

              {components.overtime && (
                <BreakdownCard title="Overtime">
                  <IncludedToggle
                    label="Is overtime included in your base salary?"
                    value={overtimeIncluded}
                    onChange={setOvertimeIncluded}
                  />
                  {overtimeIncluded === "no" && (
                    <Field label="Average annual overtime income" full>
                      <Input value={overtimeAmount} onChange={setOvertimeAmount} placeholder="$10,000" />
                    </Field>
                  )}
                </BreakdownCard>
              )}

              {components.bonus && (
                <BreakdownCard title="Bonus">
                  <IncludedToggle
                    label="Is bonus included in your base salary?"
                    value={bonusIncluded}
                    onChange={setBonusIncluded}
                  />
                  {bonusIncluded === "no" && (
                    <Field label="Average annual bonus received" full>
                      <Input value={bonusAmount} onChange={setBonusAmount} placeholder="$5,000" />
                    </Field>
                  )}
                </BreakdownCard>
              )}

              {components.commission && (
                <BreakdownCard title="Commission">
                  <IncludedToggle
                    label="Is commission included in your base salary?"
                    value={commissionIncluded}
                    onChange={setCommissionIncluded}
                  />
                  {commissionIncluded === "no" && (
                    <Field label="Average annual commission income" full>
                      <Input
                        value={commissionAmount}
                        onChange={setCommissionAmount}
                        placeholder="$20,000"
                      />
                    </Field>
                  )}
                  <Field label="How long have you earned commission income?" full>
                    <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {(
                        [
                          { v: "<1y", l: "Less than 1 year" },
                          { v: "1-2y", l: "1–2 years" },
                          { v: "2+y", l: "2+ years" },
                        ] as const
                      ).map((o) => (
                        <label key={o.v} className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            checked={commissionTenure === o.v}
                            onChange={() => setCommissionTenure(o.v)}
                          />
                          {o.l}
                        </label>
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      We use this to understand income stability.
                    </p>
                  </Field>
                </BreakdownCard>
              )}

              <div className="rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs">
                <span className="font-semibold text-secondary">
                  Estimated qualifying annual income:
                </span>{" "}
                ${computedEmployedTotal.toLocaleString()}
              </div>
            </div>
          </>
        )}

        {category === "self_employed" && (
          <>
            <SubGroup
              icon={Briefcase}
              title="Self-Employment Overview"
              subtitle="Tell us about your business or self-employment"
            >
              <Field label="Business structure" full>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      "Sole Proprietor",
                      "Incorporated Business Owner",
                      "Partnership",
                      "Freelancer / Contractor",
                    ] as const
                  ).map((t) => {
                    const a = seType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSeType(t)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          a
                            ? "border-secondary bg-secondary/10 text-secondary"
                            : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Business / operating name" required full>
                <Input value={employerName} onChange={setEmployerName} placeholder="Enter business name" />
              </Field>
              <Field label="Your role / title">
                <Input value={jobTitle} onChange={setJobTitle} placeholder="e.g. Owner, Director" />
              </Field>
              <Field label="Industry">
                <Select
                  value={industry}
                  onChange={setIndustry}
                  options={[
                    "Select your industry",
                    "Technology",
                    "Healthcare",
                    "Finance & Insurance",
                    "Construction & Trades",
                    "Retail & Hospitality",
                    "Professional Services",
                    "Real Estate",
                    "Transportation",
                    "Other",
                  ]}
                />
              </Field>
              <Field label="Business start date">
                <Input type="date" value={startDate} onChange={setStartDate} />
              </Field>
              <Field label="Ownership %">
                <Input value={ownershipPct} onChange={setOwnershipPct} placeholder="100" />
              </Field>
              <Field label="GST/HST registered?" full>
                <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {(["yes", "no"] as const).map((v) => (
                    <label key={v} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={gstRegistered === v}
                        onChange={() => setGstRegistered(v)}
                      />
                      {v === "yes" ? "Yes" : "No"}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="CRA business number">
                <Input
                  value={businessNumber}
                  onChange={setBusinessNumber}
                  placeholder="123456789RT0001"
                />
              </Field>
              <Field label="Number of employees (incl. owner)">
                <Input value={employees} onChange={setEmployees} placeholder="1" />
              </Field>
              <Field label="Business address" full>
                <Input
                  value={businessAddress}
                  onChange={setBusinessAddress}
                  placeholder="Street, City, Province"
                />
              </Field>
            </SubGroup>

            <SubGroup
              icon={Wallet}
              title="Business Income"
              subtitle="Use figures consistent with your filed tax returns"
            >
              <Field label="Income basis used for qualification" full>
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {(
                    [
                      { v: "net", l: "Net (after expenses)" },
                      { v: "gross_up", l: "Gross-up (15%)" },
                      { v: "stated", l: "Stated income program" },
                    ] as const
                  ).map((o) => (
                    <label key={o.v} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={seIncomeBasis === o.v}
                        onChange={() => setSeIncomeBasis(o.v)}
                      />
                      {o.l}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Gross business revenue (annual)">
                <Input value={grossBusiness} onChange={setGrossBusiness} placeholder="$0" />
              </Field>
              <Field label="Net income after expenses (annual)" required>
                <Input value={netIncome} onChange={setNetIncome} placeholder="$0" />
              </Field>
              <Field label="2-year average net income">
                <Input value={twoYearAvg} onChange={setTwoYearAvg} placeholder="$0" />
              </Field>
              <Field label="Allowable add-backs (annual)">
                <Input value={addBacks} onChange={setAddBacks} placeholder="$0" />
              </Field>
              <Field label="Recent income trend" full>
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {(
                    [
                      { v: "increasing", l: "Increasing" },
                      { v: "stable", l: "Stable" },
                      { v: "declining", l: "Declining" },
                    ] as const
                  ).map((o) => (
                    <label key={o.v} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={incomeTrend === o.v}
                        onChange={() => setIncomeTrend(o.v)}
                      />
                      {o.l}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Verification" full>
                <Select
                  value={seVerification}
                  onChange={setSeVerification}
                  options={[
                    "T1 General + NOA (2 years)",
                    "T2 Corporate Returns + Financial Statements",
                    "Bank Statement Verified",
                    "Stated Income",
                    "Other",
                  ]}
                />
              </Field>
              <Field label="Accountant / CPA name">
                <Input
                  value={accountantName}
                  onChange={setAccountantName}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Accountant phone or email">
                <Input
                  value={accountantContact}
                  onChange={setAccountantContact}
                  placeholder="Optional"
                />
              </Field>
            </SubGroup>
          </>
        )}

        {category === "other" && (
          <>
            <SubGroup
              icon={Wallet}
              title="Other Income Details"
              subtitle="Government benefits, rental, investment, support, and similar income"
            >
              <Field label="Other income type" required full>
                <Select
                  value={otherType || OTHER_INCOME_TYPES[0]}
                  onChange={setOtherType}
                  options={[...OTHER_INCOME_TYPES]}
                />
              </Field>
              <Field label="Source / payer name" full>
                <Input
                  value={otherSource}
                  onChange={setOtherSource}
                  placeholder="e.g. Service Canada, Sun Life, Tenant name"
                />
              </Field>
              <Field label="Amount" required>
                <Input value={otherAmount} onChange={setOtherAmount} placeholder="$0" />
              </Field>
              <Field label="Frequency">
                <Select
                  value={otherFrequency}
                  onChange={(v) => setOtherFrequency(v as IncomeSource["frequency"])}
                  options={["Annual", "Monthly", "Bi-Weekly", "Weekly", "Hourly"]}
                />
              </Field>
              <Field label="Receiving since">
                <Input type="date" value={otherStart} onChange={setOtherStart} />
              </Field>
              <Field label="How long have you received this income?">
                <Select
                  value={otherDuration}
                  onChange={(v) => setOtherDuration(v as typeof otherDuration)}
                  options={["<1y", "1-2y", "2-3y", "3+y"]}
                />
              </Field>
              <Field label="Will this income continue for 3+ years?" full>
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {(
                    [
                      { v: "yes", l: "Yes" },
                      { v: "no", l: "No" },
                      { v: "unknown", l: "Unknown" },
                    ] as const
                  ).map((o) => (
                    <label key={o.v} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={otherContinuance === o.v}
                        onChange={() => setOtherContinuance(o.v)}
                      />
                      {o.l}
                    </label>
                  ))}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    Lenders typically require continuance for qualifying income
                  </span>
                </div>
              </Field>
              <Field label="Verification document" full>
                <Select
                  value={otherVerification}
                  onChange={setOtherVerification}
                  options={[
                    "Government Award Letter",
                    "Pension/Benefit Statement",
                    "Bank Statement Verified",
                    "T1 General + NOA",
                    "Lease Agreement (Rental)",
                    "T5 / Investment Statement",
                    "Court Order / Separation Agreement",
                    "Stated Income",
                    "Other",
                  ]}
                />
              </Field>
            </SubGroup>
          </>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={include}
            onChange={(e) => setInclude(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Include this income for mortgage qualification
        </label>
      </div>
    </DrawerShell>
  );
}

function SubGroup({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function BreakdownCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">{title}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function IncludedToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "yes" | "no";
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <Field label={label} full>
      <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
        {(["yes", "no"] as const).map((v) => (
          <label key={v} className="flex items-center gap-1.5">
            <input type="radio" checked={value === v} onChange={() => onChange(v)} />
            {v === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </Field>
  );
}

function AddLiabilityDrawer({
  coApplicants,
  initial,
  onClose,
  onSave,
}: {
  coApplicants: BorrowerProfileApplicant[];
  initial: Liability | null;
  onClose: () => void;
  onSave: (d: Omit<Liability, "id" | "ownerId">) => void;
}) {
  const [type, setType] = useState(initial?.type ?? "");
  const [creditor, setCreditor] = useState(initial?.creditor ?? "");
  const [balance, setBalance] = useState(initial ? String(initial.balance) : "");
  const [monthlyPayment, setMonthlyPayment] = useState(
    initial ? String(initial.monthlyPayment) : "",
  );
  const [shared, setShared] = useState(initial?.shared ?? false);
  const [sharedWith, setSharedWith] = useState<string[]>(initial?.sharedWith ?? []);
  const [paymentHistory, setPaymentHistory] = useState<Liability["paymentHistory"]>(
    initial?.paymentHistory ?? "",
  );
  const [payoffPlan, setPayoffPlan] = useState<Liability["payoffPlan"]>(
    initial?.payoffPlan ?? "",
  );
  const valid =
    !!type &&
    creditor.trim().length > 0 &&
    Number(balance) >= 0 &&
    !!paymentHistory &&
    !!payoffPlan &&
    (!shared || sharedWith.length > 0);
  const toggleSharedWith = (id: string) =>
    setSharedWith((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <DrawerShell
      title={initial ? "Edit Debt" : "Add Debt"}
      subtitle={
        initial
          ? "Update this debt. Shared debts will sync to the linked co-applicants automatically."
          : "Add a credit card, loan, or other monthly non-mortgage debt."
      }
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() =>
              onSave({
                creditor,
                type,
                balance: Number(balance),
                monthlyPayment: Number(monthlyPayment) || 0,
                shared,
                sharedWith: shared ? sharedWith : [],
                paymentHistory,
                payoffPlan,
              })
            }
            className={`rounded-md px-3.5 py-2 text-xs font-semibold ${
              valid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            Save Debt
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type of debt" required>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-secondary"
            >
              <option value="">Select debt type</option>
              {DEBT_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name of lender" required>
            <Input value={creditor} onChange={setCreditor} placeholder="Enter lender name" />
          </Field>
          <Field label="Outstanding balance" required>
            <Input value={balance} onChange={setBalance} placeholder="$0.00" />
          </Field>
          <Field label="Monthly payment" required>
            <Input value={monthlyPayment} onChange={setMonthlyPayment} placeholder="$0.00" />
          </Field>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => {
                setShared(e.target.checked);
                if (!e.target.checked) setSharedWith([]);
              }}
              className="h-4 w-4 rounded border-input"
            />
            Is this debt shared with another applicant?
          </label>
          {shared && (
            <div className="ml-6 space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-foreground">
                Select co-applicant(s) this debt is shared with:
              </p>
              {coApplicants.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No co-applicants on this application yet. Add a co-applicant in the Mortgage
                  Application Hub to share a debt.
                </p>
              ) : (
                coApplicants.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sharedWith.includes(c.id)}
                      onChange={() => toggleSharedWith(c.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    {c.name}
                    <span className="text-xs text-muted-foreground">({c.role})</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <Field label="Payment History / Performance" required full>
          <select
            value={paymentHistory}
            onChange={(e) => setPaymentHistory(e.target.value as Liability["paymentHistory"])}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-secondary"
          >
            <option value="">Select payment history rating</option>
            {PAYMENT_HISTORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Do you plan to pay off this debt before closing?" required full>
          <div className="space-y-2">
            {PAYOFF_PLAN_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  payoffPlan === o.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="payoff-plan"
                  checked={payoffPlan === o.value}
                  onChange={() => setPayoffPlan(o.value)}
                  className="h-3.5 w-3.5"
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>
    </DrawerShell>
  );
}

function AddAssetDrawer({
  tx,
  applicantId: _applicantId,
  applicantName: _applicantName,
  onClose,
  onSave,
}: {
  tx: "Purchase" | "Pre-Purchase" | "Refinance" | "Renewal";
  applicantId: string;
  applicantName: string;
  onClose: () => void;
  onSave: (d: Omit<Asset, "id">) => void;
}) {
  const [type, setType] = useState("Savings account");
  const [institution, setInstitution] = useState("");
  const [value, setValue] = useState("");
  const [useForDP, setUseForDP] = useState<"yes" | "no" | "">("");
  const [dpMode, setDpMode] = useState<"amount" | "pct">("amount");
  const [dpInput, setDpInput] = useState("");

  const valueNum = Number(value) || 0;
  const dpInputNum = Number(dpInput) || 0;
  const isLiquid = isLiquidAsset(type);
  const dpEligible = isLiquid && (tx === "Purchase" || tx === "Pre-Purchase");
  const computedDP =
    useForDP === "yes" && dpEligible
      ? dpMode === "amount"
        ? Math.min(dpInputNum, valueNum)
        : Math.round((Math.min(dpInputNum, 100) / 100) * valueNum)
      : 0;

  const dpAnswered = !dpEligible || useForDP === "no" || (useForDP === "yes" && computedDP > 0);
  const dpInputInvalid =
    useForDP === "yes" &&
    (dpInputNum <= 0 || (dpMode === "amount" && dpInputNum > valueNum) || (dpMode === "pct" && dpInputNum > 100));
  const valid = institution.trim().length > 0 && valueNum > 0 && dpAnswered && !dpInputInvalid;

  return (
    <DrawerShell
      title="Add Asset"
      subtitle="Add bank, investment, gift, or other asset records for this borrower."
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() =>
              onSave({
                type,
                institution,
                value: valueNum,
                forDownPayment: computedDP,
                dpMode: useForDP === "yes" ? dpMode : undefined,
                dpInput: useForDP === "yes" ? dpInput : undefined,
              })
            }
            className={`rounded-md px-3.5 py-2 text-xs font-semibold ${
              valid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            Save Asset
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Asset type" full>
          <Select
            value={type}
            onChange={setType}
            options={[
              "Chequing account",
              "Savings account",
              "TFSA",
              "RRSP",
              "FHSA",
              "Investment account",
              "GIC",
              "Stocks/bonds",
              "Crypto",
              "Gift funds",
              "Vehicle",
              "Business asset",
              "Real estate equity",
              "Other",
            ]}
          />
        </Field>
        <Field label="Institution / name" full required>
          <Input value={institution} onChange={setInstitution} />
        </Field>
        <Field label="Current value" required>
          <Input value={value} onChange={setValue} placeholder="0" />
        </Field>

        {dpEligible ? (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium text-foreground">
              Will any portion of this asset be used for the down payment?
            </p>
            <div className="flex gap-6 text-sm">
              {(["yes", "no"] as const).map((opt) => (
                <label key={opt} className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="asset-use-dp"
                    checked={useForDP === opt}
                    onChange={() => {
                      setUseForDP(opt);
                      if (opt === "no") setDpInput("");
                    }}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  {opt === "yes" ? "Yes" : "No"}
                </label>
              ))}
            </div>

            {useForDP === "yes" && (
              <div className="space-y-3 rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-medium text-foreground">
                  How would you like to specify the down payment amount?
                </p>
                <div className="flex gap-6 text-sm">
                  {(["amount", "pct"] as const).map((m) => (
                    <label key={m} className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="asset-dp-mode"
                        checked={dpMode === m}
                        onChange={() => setDpMode(m)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      {m === "amount" ? "Specific Amount" : "Percentage"}
                    </label>
                  ))}
                </div>
                <Field
                  label={dpMode === "amount" ? "Amount (CAD)" : "Percentage of asset value"}
                  full
                  required
                >
                  <Input
                    value={dpInput}
                    onChange={setDpInput}
                    placeholder={dpMode === "amount" ? "0.00" : "0"}
                  />
                </Field>
                <p className="text-[11px] text-muted-foreground">
                  Down payment contribution: {fmtMoney(computedDP)}
                  {dpInputInvalid && (
                    <span className="ml-2 text-coral">
                      {dpMode === "amount"
                        ? "Cannot exceed the asset's current value."
                        : "Must be between 1 and 100."}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  This amount will auto-populate in the Down Payment page of your application.
                </p>
              </div>
            )}
          </div>
        ) : isLiquid ? null : (
          <p className="text-[11px] text-muted-foreground">
            Down payment use is only available for liquid assets on Purchase or Pre-Purchase
            applications.
          </p>
        )}
      </div>
    </DrawerShell>
  );
}

function AddOtherPropertyDrawer({
  initial,
  applicants,
  onClose,
  onSave,
}: {
  initial: OtherProperty | null;
  applicants: { id: string; name: string }[];
  onClose: () => void;
  onSave: (d: Omit<OtherProperty, "id">) => void;
}) {
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [province, setProvince] = useState(initial?.province ?? "ON");
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? "");
  const [currentOwners, setCurrentOwners] = useState<string[]>(
    initial?.currentOwners ?? (applicants[0] ? [applicants[0].id] : []),
  );
  const [plansToSell, setPlansToSell] = useState<"yes" | "no" | "">(initial?.plansToSell ?? "");
  const [usage, setUsage] = useState(initial?.usage ?? "Rental");
  const [type, setType] = useState(initial?.type ?? "Detached");
  const [ownership, setOwnership] = useState(String(initial?.ownership ?? "100"));
  const [ownershipTimeframe, setOwnershipTimeframe] = useState(initial?.ownershipTimeframe ?? "1-3 years");
  const [value, setValue] = useState(initial ? String(initial.value) : "");
  const [numberOfUnits, setNumberOfUnits] = useState(initial?.numberOfUnits ?? "1");
  const [monthlyRental, setMonthlyRental] = useState(initial ? String(initial.monthlyRental) : "");
  const [rentalFrequency, setRentalFrequency] = useState(initial?.rentalFrequency ?? "Monthly");
  const [heating, setHeating] = useState(initial ? String(initial.heating) : "");
  const [heatingIncludedInCondo, setHeatingIncludedInCondo] = useState<"yes" | "no" | "">(
    initial?.heatingIncludedInCondo ?? "",
  );
  const [propertyTax, setPropertyTax] = useState(initial ? String(initial.propertyTax) : "");
  const [propertyTaxFrequency, setPropertyTaxFrequency] = useState(initial?.propertyTaxFrequency ?? "Annual");
  const [condoFee, setCondoFee] = useState(initial ? String(initial.condoFee) : "");
  const [condoFeeFrequency, setCondoFeeFrequency] = useState(initial?.condoFeeFrequency ?? "Monthly");
  const [monthlyCosts, setMonthlyCosts] = useState(initial ? String(initial.monthlyCosts) : "");
  const [mortgageFree, setMortgageFree] = useState(initial?.mortgageFree ?? false);
  const [mortgages, setMortgages] = useState<PropertyMortgage[]>(
    initial?.mortgages && initial.mortgages.length > 0
      ? initial.mortgages
      : [
          {
            id: `pm-${Date.now()}`,
            position: "First mortgage",
            lender: "",
            balance: 0,
            rate: 0,
            rateType: "Fixed",
            termType: "Closed",
            maturityDate: "",
            payment: 0,
            paymentFrequency: "Monthly",
          },
        ],
  );
  const [include, setInclude] = useState(initial?.include ?? true);

  const valid =
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    Number(value) > 0 &&
    currentOwners.length > 0 &&
    (mortgageFree ||
      mortgages.every((m) => m.lender.trim().length > 0 && (m.balance || 0) >= 0));

  const updateMortgage = (id: string, p: Partial<PropertyMortgage>) =>
    setMortgages((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const removeMortgage = (id: string) =>
    setMortgages((prev) => prev.filter((m) => m.id !== id));
  const addMortgage = () =>
    setMortgages((prev) => [
      ...prev,
      {
        id: `pm-${Date.now()}-${Math.random()}`,
        position: prev.length === 0 ? "First mortgage" : "Second mortgage",
        lender: "",
        balance: 0,
        rate: 0,
        rateType: "Fixed",
        termType: "Closed",
        maturityDate: "",
        payment: 0,
        paymentFrequency: "Monthly",
      },
    ]);
  const toggleOwner = (id: string) =>
    setCurrentOwners((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <DrawerShell
      title={initial ? "Edit Other Property" : "Add Other Property"}
      subtitle="Add a property this borrower owns or co-owns outside the subject property."
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() =>
              onSave({
                address,
                city,
                province,
                postalCode,
                currentOwners,
                plansToSell,
                usage,
                type,
                ownership: Number(ownership) || 100,
                ownershipTimeframe,
                value: Number(value),
                monthlyRental: Number(monthlyRental) || 0,
                rentalFrequency,
                numberOfUnits,
                heating: Number(heating) || 0,
                heatingIncludedInCondo,
                propertyTax: Number(propertyTax) || 0,
                propertyTaxFrequency,
                condoFee: Number(condoFee) || 0,
                condoFeeFrequency,
                monthlyCosts: Number(monthlyCosts) || 0,
                mortgageFree,
                mortgages: mortgageFree ? [] : mortgages,
                include,
              })
            }
            className={`rounded-md px-3.5 py-2 text-xs font-semibold ${
              valid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            {initial ? "Save Changes" : "Save Property"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <Group title="Property Address">
          <Field label="Street address" full required>
            <Input value={address} onChange={setAddress} />
          </Field>
          <Field label="City" required>
            <Input value={city} onChange={setCity} />
          </Field>
          <Field label="Province">
            <Select
              value={province}
              onChange={setProvince}
              options={["AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK", "NT", "NU", "YT"]}
            />
          </Field>
          <Field label="Postal code">
            <Input value={postalCode} onChange={setPostalCode} placeholder="A1A 1A1" />
          </Field>
        </Group>

        <Group title="Ownership Details">
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-medium text-foreground">
              Who are the current owners of this property?<span className="ml-0.5 text-coral">*</span>
            </p>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Select all owners who are also on this application.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {applicants.map((a) => {
                const on = currentOwners.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleOwner(a.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      on
                        ? "bg-primary text-primary-foreground"
                        : "border border-input bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Plans to sell within next 4 months?">
            <Select
              value={plansToSell || ""}
              onChange={(v) => setPlansToSell(v as "yes" | "no" | "")}
              options={["", "no", "yes"]}
            />
          </Field>
          <Field label="Ownership timeframe">
            <Select
              value={ownershipTimeframe}
              onChange={setOwnershipTimeframe}
              options={["<1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"]}
            />
          </Field>
          <Field label="Property usage">
            <Select
              value={usage}
              onChange={setUsage}
              options={[
                "Rental",
                "Owner-Occupied Family",
                "Vacation / Second Home",
                "Commercial",
                "Mixed Use",
                "Other",
              ]}
            />
          </Field>
          <Field label="Property type">
            <Select
              value={type}
              onChange={setType}
              options={[
                "Detached",
                "Semi-Detached",
                "Townhouse",
                "Condo",
                "Duplex",
                "Triplex",
                "Fourplex",
                "Multi-unit",
                "Other",
              ]}
            />
          </Field>
          <Field label="Ownership %">
            <Input value={ownership} onChange={setOwnership} />
          </Field>
          <Field label="Number of units">
            <Select
              value={numberOfUnits}
              onChange={setNumberOfUnits}
              options={["1", "2", "3", "4", "5+"]}
            />
          </Field>
          <Field label="Property value" required>
            <Input value={value} onChange={setValue} placeholder="0" />
          </Field>
        </Group>

        <Group title="Income & Carrying Costs">
          <Field label="Rental income">
            <Input value={monthlyRental} onChange={setMonthlyRental} placeholder="0" />
          </Field>
          <Field label="Rental frequency">
            <Select
              value={rentalFrequency}
              onChange={setRentalFrequency}
              options={["Monthly", "Annual"]}
            />
          </Field>
          <Field label="Heating">
            <Input value={heating} onChange={setHeating} placeholder="0" />
          </Field>
          <Field label="Heating included in condo fee?">
            <Select
              value={heatingIncludedInCondo || ""}
              onChange={(v) => setHeatingIncludedInCondo(v as "yes" | "no" | "")}
              options={["", "no", "yes"]}
            />
          </Field>
          <Field label="Property tax">
            <Input value={propertyTax} onChange={setPropertyTax} placeholder="0" />
          </Field>
          <Field label="Property tax frequency">
            <Select
              value={propertyTaxFrequency}
              onChange={setPropertyTaxFrequency}
              options={["Annual", "Monthly"]}
            />
          </Field>
          <Field label="Condo fee (if applicable)">
            <Input value={condoFee} onChange={setCondoFee} placeholder="0" />
          </Field>
          <Field label="Condo fee frequency">
            <Select
              value={condoFeeFrequency}
              onChange={setCondoFeeFrequency}
              options={["Monthly", "Annual"]}
            />
          </Field>
          <Field label="Other monthly carrying costs">
            <Input value={monthlyCosts} onChange={setMonthlyCosts} placeholder="0" />
          </Field>
        </Group>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Mortgage Details
            </h3>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={mortgageFree}
                onChange={(e) => setMortgageFree(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              This property has no mortgage
            </label>
          </div>

          {!mortgageFree && (
            <div className="space-y-3">
              {mortgages.map((m, i) => (
                <div key={m.id} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">Mortgage #{i + 1}</p>
                    {mortgages.length > 1 && (
                      <button
                        onClick={() => removeMortgage(m.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-coral hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Mortgage position">
                      <Select
                        value={m.position}
                        onChange={(v) => updateMortgage(m.id, { position: v })}
                        options={["First mortgage", "Second mortgage", "HELOC", "Private mortgage", "Other"]}
                      />
                    </Field>
                    <Field label="Lender">
                      <Input
                        value={m.lender}
                        onChange={(v) => updateMortgage(m.id, { lender: v })}
                        placeholder="Enter lender name"
                      />
                    </Field>
                    <Field label="Outstanding balance">
                      <Input
                        value={m.balance ? String(m.balance) : ""}
                        onChange={(v) => updateMortgage(m.id, { balance: Number(v) || 0 })}
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Interest rate (%)">
                      <Input
                        value={m.rate ? String(m.rate) : ""}
                        onChange={(v) => updateMortgage(m.id, { rate: Number(v) || 0 })}
                        placeholder="0.00"
                      />
                    </Field>
                    <Field label="Rate type">
                      <Select
                        value={m.rateType}
                        onChange={(v) => updateMortgage(m.id, { rateType: v })}
                        options={["Fixed", "Variable", "Adjustable"]}
                      />
                    </Field>
                    <Field label="Term type">
                      <Select
                        value={m.termType}
                        onChange={(v) => updateMortgage(m.id, { termType: v })}
                        options={["Closed", "Open"]}
                      />
                    </Field>
                    <Field label="Maturity date">
                      <Input
                        type="date"
                        value={m.maturityDate}
                        onChange={(v) => updateMortgage(m.id, { maturityDate: v })}
                      />
                    </Field>
                    <Field label="P&I payment">
                      <Input
                        value={m.payment ? String(m.payment) : ""}
                        onChange={(v) => updateMortgage(m.id, { payment: Number(v) || 0 })}
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Payment frequency">
                      <Select
                        value={m.paymentFrequency}
                        onChange={(v) => updateMortgage(m.id, { paymentFrequency: v })}
                        options={["Monthly", "Semi-monthly", "Bi-weekly", "Accelerated bi-weekly", "Weekly"]}
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button
                onClick={addMortgage}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" /> Add Mortgage
              </button>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={include}
            onChange={(e) => setInclude(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Include in qualification
        </label>
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          Other property mortgages and carrying costs flow into Qualification Analysis. We'll also
          identify potential refinance, renewal, and HELOC opportunities.
        </p>
      </div>
    </DrawerShell>
  );
}

// ─── Building blocks ───────────────────────────────────────────────
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-coral">*</span>}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-secondary"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value?: string;
  onChange?: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value ?? options[0]}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-secondary"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function AddressAutocompleteInput({ placeholder }: { placeholder?: string }) {
  const [v, setV] = useState("");
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder={placeholder}
          autoComplete="street-address"
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-28 text-sm text-foreground outline-none focus:border-secondary"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
          <MapPin className="h-3 w-3" /> Autofill
        </span>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Info className="h-3 w-3" />
        Start typing and select your address — Google Maps autofill will populate city, province,
        postal code, and country once enabled.
      </p>
    </div>
  );
}

function YesNo({ label, warnOnNo }: { label: string; warnOnNo?: string }) {
  const [v, setV] = useState<"yes" | "no" | undefined>();
  return (
    <div className="sm:col-span-2 space-y-2">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
        <span className="text-sm text-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          {(["yes", "no"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setV(opt)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                v === opt
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-background text-foreground hover:bg-muted"
              }`}
            >
              {opt === "yes" ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </div>
      {warnOnNo && v === "no" && (
        <div className="flex items-start gap-2 rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-xs text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
          <p>{warnOnNo}</p>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "mint" | "secondary";
}) {
  const cls =
    tone === "mint"
      ? "border-mint/40 bg-mint/15"
      : tone === "secondary"
        ? "border-secondary/30 bg-secondary/10"
        : "border-border bg-muted/40";
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Tiny({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function NoneToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-3 text-sm transition ${
        checked
          ? "border-mint/40 bg-mint/10"
          : "border-border bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-input"
      />
      <span className="text-foreground">{label}</span>
    </label>
  );
}

function Pill({
  children,
  icon: Icon,
  tone = "default",
}: {
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: "default" | "warn" | "muted";
}) {
  const cls =
    tone === "warn"
      ? "bg-yellow/90 text-yellow-foreground"
      : tone === "muted"
        ? "bg-primary-foreground/10 text-primary-foreground/80"
        : "bg-primary-foreground/15 text-primary-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      {Icon && <Icon className="h-3 w-3" />} {children}
    </span>
  );
}

function Consent({
  checked,
  onChange,
  text,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  text: string;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-input"
      />
      <span className="text-foreground/90">{text}</span>
    </label>
  );
}

function SectionFootHelp({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5" /> <span>{text}</span>
    </div>
  );
}

function prettyAccess(level: string) {
  const map: Record<string, string> = {
    own_profile_only: "Own Profile Only",
    own_profile_summary: "Own Profile + Summary",
    application_contributor: "Application Contributor",
    full_application_access: "Full Application Access",
    application_manager: "Application Manager",
  };
  return map[level] ?? level;
}
