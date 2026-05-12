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

type Liability = {
  id: string;
  creditor: string;
  type: string;
  balance: number;
  monthlyPayment: number;
  ownership: "Individual" | "Joint" | "Shared";
  payOffAtClose: boolean;
  include: boolean;
};

type Asset = {
  id: string;
  type: string;
  institution: string;
  value: number;
  forDownPayment: number;
  liquid: boolean;
  source: string;
};

type OtherProperty = {
  id: string;
  address: string;
  city: string;
  province: string;
  usage: string;
  type: string;
  ownership: number;
  value: number;
  mortgageBalance: number;
  monthlyRental: number;
  monthlyCosts: number;
  include: boolean;
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

const SEED_LIABILITIES_PRIMARY: Liability[] = [
  {
    id: "lia-1",
    creditor: "TD Visa",
    type: "Credit Card",
    balance: 2480,
    monthlyPayment: 75,
    ownership: "Individual",
    payOffAtClose: false,
    include: true,
  },
  {
    id: "lia-2",
    creditor: "Honda Finance",
    type: "Auto Loan",
    balance: 14900,
    monthlyPayment: 412,
    ownership: "Individual",
    payOffAtClose: false,
    include: true,
  },
];

const SEED_ASSETS_PRIMARY: Asset[] = [
  {
    id: "ast-1",
    type: "Savings account",
    institution: "RBC Royal Bank",
    value: 62500,
    forDownPayment: 50000,
    liquid: true,
    source: "Savings",
  },
  {
    id: "ast-2",
    type: "TFSA",
    institution: "Wealthsimple",
    value: 21800,
    forDownPayment: 0,
    liquid: true,
    source: "Savings",
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
  onBack,
}: {
  applicant: BorrowerProfileApplicant;
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
  const [liabilities, setLiabilities] = useState<Liability[]>(
    applicant.isPrimary ? SEED_LIABILITIES_PRIMARY : [],
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
              <p className="font-semibold">Waiting for borrower</p>
              <p className="text-xs text-primary-foreground/75">
                Invite sent to {applicant.email ?? "borrower"} · Status: {applicant.inviteStatus}
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
                  liabilities={liabilities}
                  none={noneLiab}
                  setNone={setNoneLiab}
                  onAdd={() => setDrawer("liab")}
                  onRemove={(id) => setLiabilities((p) => p.filter((x) => x.id !== id))}
                  onMark={markSection}
                />
              )}
              {active === "assets" && (
                <AssetsSection
                  assets={assets}
                  none={noneAssets}
                  setNone={setNoneAssets}
                  onAdd={() => setDrawer("asset")}
                  onRemove={(id) => setAssets((p) => p.filter((x) => x.id !== id))}
                  onMark={markSection}
                />
              )}
              {active === "properties" && (
                <PropertiesSection
                  properties={properties}
                  none={noneProps}
                  setNone={setNoneProps}
                  onAdd={() => setDrawer("property")}
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
            setDrawer(null);
          }}
        />
      )}
      {drawer === "liab" && (
        <AddLiabilityDrawer
          onClose={() => setDrawer(null)}
          onSave={(data) => {
            setLiabilities((p) => [...p, { ...data, id: `lia-${Date.now()}` }]);
            setNoneLiab(false);
            setDrawer(null);
          }}
        />
      )}
      {drawer === "asset" && (
        <AddAssetDrawer
          onClose={() => setDrawer(null)}
          onSave={(data) => {
            setAssets((p) => [...p, { ...data, id: `ast-${Date.now()}` }]);
            setNoneAssets(false);
            setDrawer(null);
          }}
        />
      )}
      {drawer === "property" && (
        <AddOtherPropertyDrawer
          onClose={() => setDrawer(null)}
          onSave={(data) => {
            setProperties((p) => [...p, { ...data, id: `prop-${Date.now()}` }]);
            setNoneProps(false);
            setDrawer(null);
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
  const needsPrev = parseInt(years || "0", 10) < 2;

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
        <div className="rounded-xl border border-yellow/40 bg-yellow/15 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" /> Previous address required
          </div>
          <p className="mt-1 text-xs text-foreground/80">
            Lenders require at least 2 years of address history. Add your previous address to
            continue.
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
  none,
  setNone,
  onAdd,
  onRemove,
  onMark,
}: {
  liabilities: Liability[];
  none: boolean;
  setNone: (v: boolean) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMark: (k: SectionKey, s: SectionState) => void;
}) {
  const [scoreRange, setScoreRange] = useState("720–759");
  const [pullCredit, setPullCredit] = useState(false);
  const totalBalance = liabilities.reduce((s, l) => s + l.balance, 0);
  const totalMonthly = liabilities.filter((l) => l.include).reduce((s, l) => s + l.monthlyPayment, 0);
  const payoff = liabilities.filter((l) => l.payOffAtClose).reduce((s, l) => s + l.balance, 0);

  return (
    <div className="space-y-6">
      <Group title="Credit Information">
        <Field label="Estimated credit score range" full>
          <Select
            value={scoreRange}
            onChange={setScoreRange}
            options={[
              "760+",
              "720–759",
              "680–719",
              "650–679",
              "620–649",
              "600–619",
              "Below 600",
              "Not sure",
            ]}
          />
        </Field>
        <YesNo label="Bankruptcy in the last 7 years?" />
        <YesNo label="Consumer proposal in the last 7 years?" />
        <YesNo label="Missed payments in the last 12 months?" />
        <YesNo label="Active collections or judgments?" />
      </Group>

      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={pullCredit}
            onChange={(e) => setPullCredit(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            <span className="font-semibold text-foreground">
              I authorize approvU to pull my credit report
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Required for mortgage qualification. Each borrower must provide their own consent.
            </span>
          </span>
        </label>
      </div>

      <div>
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Liabilities" value={`${liabilities.length}`} />
          <Stat label="Total balance" value={fmtMoney(totalBalance)} />
          <Stat label="Monthly (incl.)" value={fmtMoney(totalMonthly)} tone="secondary" />
          <Stat label="Payoff at close" value={fmtMoney(payoff)} tone="mint" />
        </div>

        {liabilities.map((l) => (
          <div
            key={l.id}
            className="mt-2 flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                  {l.type}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {l.ownership}
                </span>
                {l.payOffAtClose && (
                  <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                    Pay off at close
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{l.creditor}</p>
              <p className="text-xs text-muted-foreground">
                Balance {fmtMoney(l.balance)} · {fmtMoney(l.monthlyPayment)}/mo
              </p>
            </div>
            <button
              onClick={() => onRemove(l.id)}
              className="self-start rounded-md border border-input bg-background p-1.5 text-coral hover:bg-coral/10 sm:self-center"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

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
          <Plus className="h-3.5 w-3.5" /> Add Liability
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
  onRemove,
  onMark,
}: {
  assets: Asset[];
  none: boolean;
  setNone: (v: boolean) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMark: (k: SectionKey, s: SectionState) => void;
}) {
  const total = assets.reduce((s, a) => s + a.value, 0);
  const downpayment = assets.reduce((s, a) => s + a.forDownPayment, 0);
  const liquid = assets.filter((a) => a.liquid).reduce((s, a) => s + a.value, 0);

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
              {a.liquid && (
                <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  Liquid
                </span>
              )}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {a.source}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{a.institution}</p>
            <p className="text-xs text-muted-foreground">
              Value {fmtMoney(a.value)} · Down payment {fmtMoney(a.forDownPayment)}
            </p>
          </div>
          <button
            onClick={() => onRemove(a.id)}
            className="self-start rounded-md border border-input bg-background p-1.5 text-coral hover:bg-coral/10 sm:self-center"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
  none,
  setNone,
  onAdd,
  onRemove,
  onMark,
}: {
  properties: OtherProperty[];
  none: boolean;
  setNone: (v: boolean) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMark: (k: SectionKey, s: SectionState) => void;
}) {
  const totalValue = properties.reduce((s, p) => s + p.value, 0);
  const totalMort = properties.reduce((s, p) => s + p.mortgageBalance, 0);
  const equity = totalValue - totalMort;
  const rental = properties.reduce((s, p) => s + p.monthlyRental, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Properties" value={`${properties.length}`} />
        <Stat label="Total value" value={fmtMoney(totalValue)} />
        <Stat label="Mortgage balance" value={fmtMoney(totalMort)} />
        <Stat label="Estimated equity" value={fmtMoney(equity)} tone="mint" />
      </div>

      {properties.map((p) => (
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
                {p.include && (
                  <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                    Included
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{p.address}</p>
              <p className="text-xs text-muted-foreground">
                {p.city}, {p.province}
              </p>
            </div>
            <button
              onClick={() => onRemove(p.id)}
              className="rounded-md border border-input bg-background p-1.5 text-coral hover:bg-coral/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tiny label="Value" value={fmtMoney(p.value)} />
            <Tiny label="Mortgage" value={fmtMoney(p.mortgageBalance)} />
            <Tiny label="Rental" value={`${fmtMoney(p.monthlyRental)}/mo`} />
            <Tiny label="Costs" value={`${fmtMoney(p.monthlyCosts)}/mo`} />
          </dl>
        </div>
      ))}

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
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex h-full w-full max-w-lg flex-col bg-background shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        <footer className="border-t border-border p-4">{footer}</footer>
      </div>
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
  const [type, setType] = useState("Salaried Employee");
  const [source, setSource] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [grossIncome, setGrossIncome] = useState("");
  const [frequency, setFrequency] = useState<IncomeSource["frequency"]>("Annual");
  const [verification, setVerification] = useState("Fully Verifiable");
  const [include, setInclude] = useState(true);

  const valid = source.trim().length > 0 && Number(grossIncome) > 0;

  return (
    <DrawerShell
      title="Add Income Source"
      subtitle="Add an employment, business, or other income source for this borrower."
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
                source,
                jobTitle,
                startDate,
                grossIncome: Number(grossIncome),
                frequency,
                verification,
                include,
              })
            }
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
      <div className="space-y-4">
        <Field label="Income type" full>
          <Select
            value={type}
            onChange={setType}
            options={[
              "Salaried Employee",
              "Hourly Employee",
              "Part-Time Employee",
              "Contract Employee",
              "Self-Employed",
              "Incorporated Business Owner",
              "Pension",
              "CPP/OAS",
              "Canada Child Benefit",
              "Rental Income",
              "Investment Income",
              "Support Income",
              "Other",
            ]}
          />
        </Field>
        <Field label="Employer / business / source name" full required>
          <Input value={source} onChange={setSource} />
        </Field>
        <Field label="Role / title" full>
          <Input value={jobTitle} onChange={setJobTitle} placeholder="Optional" />
        </Field>
        <Field label="Start date">
          <Input type="date" value={startDate} onChange={setStartDate} />
        </Field>
        <Field label="Gross income" required>
          <Input value={grossIncome} onChange={setGrossIncome} placeholder="0" />
        </Field>
        <Field label="Frequency">
          <Select
            value={frequency}
            onChange={(v) => setFrequency(v as IncomeSource["frequency"])}
            options={["Annual", "Monthly", "Bi-Weekly", "Weekly", "Hourly"]}
          />
        </Field>
        <Field label="Verification">
          <Select
            value={verification}
            onChange={setVerification}
            options={[
              "Fully Verifiable",
              "Non-Verifiable",
              "Bank Statement Verified",
              "Stated Income",
              "Pension/Benefit Verified",
              "Rental Offset",
              "Other",
            ]}
          />
        </Field>
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

function AddLiabilityDrawer({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (d: Omit<Liability, "id">) => void;
}) {
  const [creditor, setCreditor] = useState("");
  const [type, setType] = useState("Credit Card");
  const [balance, setBalance] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [ownership, setOwnership] = useState<Liability["ownership"]>("Individual");
  const [payOffAtClose, setPayOffAtClose] = useState(false);
  const [include, setInclude] = useState(true);
  const valid = creditor.trim().length > 0 && Number(balance) >= 0;

  return (
    <DrawerShell
      title="Add Liability"
      subtitle="Add a credit card, loan, or other monthly debt for this borrower."
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
                ownership,
                payOffAtClose,
                include,
              })
            }
            className={`rounded-md px-3.5 py-2 text-xs font-semibold ${
              valid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            Save Liability
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Creditor name" full required>
          <Input value={creditor} onChange={setCreditor} />
        </Field>
        <Field label="Liability type" full>
          <Select
            value={type}
            onChange={setType}
            options={[
              "Credit Card",
              "Line of Credit",
              "Unsecured Line of Credit",
              "Auto Loan",
              "Student Loan",
              "Personal Loan",
              "Collection",
              "Lease Payment",
              "Support Payment",
              "Mortgage on Other Property",
              "Other",
            ]}
          />
        </Field>
        <Field label="Balance" required>
          <Input value={balance} onChange={setBalance} placeholder="0" />
        </Field>
        <Field label="Monthly payment">
          <Input value={monthlyPayment} onChange={setMonthlyPayment} placeholder="0" />
        </Field>
        <Field label="Ownership">
          <Select
            value={ownership}
            onChange={(v) => setOwnership(v as Liability["ownership"])}
            options={["Individual", "Joint", "Shared"]}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={payOffAtClose}
            onChange={(e) => setPayOffAtClose(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Pay off at close
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={include}
            onChange={(e) => setInclude(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Include in qualification
        </label>
      </div>
    </DrawerShell>
  );
}

function AddAssetDrawer({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (d: Omit<Asset, "id">) => void;
}) {
  const [type, setType] = useState("Savings account");
  const [institution, setInstitution] = useState("");
  const [value, setValue] = useState("");
  const [forDownPayment, setForDownPayment] = useState("");
  const [liquid, setLiquid] = useState(true);
  const [source, setSource] = useState("Savings");
  const valid = institution.trim().length > 0 && Number(value) > 0;

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
                value: Number(value),
                forDownPayment: Number(forDownPayment) || 0,
                liquid,
                source,
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
        <Field label="Amount used for down payment">
          <Input value={forDownPayment} onChange={setForDownPayment} placeholder="0" />
        </Field>
        <Field label="Source of funds">
          <Select
            value={source}
            onChange={setSource}
            options={[
              "Savings",
              "RRSP",
              "FHSA",
              "Gift",
              "Sale of property",
              "Sale of asset",
              "Borrowed funds",
              "Business funds",
              "Funds from outside Canada",
              "Other",
            ]}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={liquid}
            onChange={(e) => setLiquid(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          This asset is liquid
        </label>
      </div>
    </DrawerShell>
  );
}

function AddOtherPropertyDrawer({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (d: Omit<OtherProperty, "id">) => void;
}) {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("ON");
  const [usage, setUsage] = useState("Rental");
  const [type, setType] = useState("Detached");
  const [ownership, setOwnership] = useState("100");
  const [value, setValue] = useState("");
  const [mortgageBalance, setMortgageBalance] = useState("");
  const [monthlyRental, setMonthlyRental] = useState("");
  const [monthlyCosts, setMonthlyCosts] = useState("");
  const [include, setInclude] = useState(true);
  const valid = address.trim().length > 0 && city.trim().length > 0 && Number(value) > 0;

  return (
    <DrawerShell
      title="Add Other Property"
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
                usage,
                type,
                ownership: Number(ownership) || 100,
                value: Number(value),
                mortgageBalance: Number(mortgageBalance) || 0,
                monthlyRental: Number(monthlyRental) || 0,
                monthlyCosts: Number(monthlyCosts) || 0,
                include,
              })
            }
            className={`rounded-md px-3.5 py-2 text-xs font-semibold ${
              valid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            Save Property
          </button>
        </div>
      }
    >
      <div className="space-y-4">
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
        <Field label="Property value" required>
          <Input value={value} onChange={setValue} placeholder="0" />
        </Field>
        <Field label="Mortgage balance">
          <Input value={mortgageBalance} onChange={setMortgageBalance} placeholder="0" />
        </Field>
        <Field label="Monthly rental income">
          <Input value={monthlyRental} onChange={setMonthlyRental} placeholder="0" />
        </Field>
        <Field label="Monthly carrying costs">
          <Input value={monthlyCosts} onChange={setMonthlyCosts} placeholder="0" />
        </Field>
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
