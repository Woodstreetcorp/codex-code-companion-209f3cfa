import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Info, Plus, Trash2 } from "lucide-react";
import {
  HeroResult,
  NumField,
  ResultRow,
  SelectField,
  ToolPageShell,
  fmtMoney,
  fmtPct,
  saveScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/down-payment")({
  head: () => ({
    meta: [
      { title: "Down Payment Planner — approvU" },
      {
        name: "description",
        content:
          "Plan your down payment sources and see how they affect your mortgage amount, LTV, and insurance.",
      },
    ],
  }),
  component: DownPaymentPlannerPage,
});

// ─── Configurable rules ─────────────────────────────────────────────────
const downPaymentRules = {
  minimumDownPaymentTiers: [
    { upTo: 500000, percent: 0.05 },
    { upTo: 1500000, percentOnExcess: 0.1 },
    { above: 1500000, percent: 0.2 },
  ],
  insuredMortgageThreshold: 0.2, // <20% down → insured
  insuredMortgageMaxPrice: 1500000,
};

function calcMinDownPayment(price: number): number {
  if (price <= 0) return 0;
  if (price >= 1500000) return price * 0.2;
  if (price <= 500000) return price * 0.05;
  return 500000 * 0.05 + (price - 500000) * 0.1;
}

// ─── Reference data ─────────────────────────────────────────────────────
const PROVINCES = [
  "Ontario",
  "British Columbia",
  "Alberta",
  "Manitoba",
  "Saskatchewan",
  "Quebec",
  "Nova Scotia",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Prince Edward Island",
  "Yukon",
  "Northwest Territories",
  "Nunavut",
] as const;

const PROPERTY_USAGES = [
  "Primary residence",
  "Rental / investment",
  "Second home",
  "Owner-occupied with rental unit",
] as const;
const PROPERTY_TYPES = [
  "Detached",
  "Semi-detached",
  "Townhouse",
  "Condo",
  "Duplex / multi-unit",
  "New construction",
  "Other",
] as const;
const FTHB = ["Yes", "No", "Not sure"] as const;
const NEW_CONSTR = ["Yes", "No", "Not sure"] as const;
const TIMELINES = [
  "0–30 days",
  "1–3 months",
  "3–6 months",
  "6–12 months",
  "More than 12 months",
  "Not sure",
] as const;
const AVAILABILITY = ["Yes", "No", "Partially"] as const;
const HOLD_90D = ["Yes", "No", "Not sure"] as const;
const YES_NO = ["Yes", "No"] as const;

const SOURCE_TYPES = [
  "Personal savings",
  "Chequing / savings account",
  "TFSA",
  "RRSP Home Buyers' Plan",
  "FHSA",
  "Investment account",
  "Gift from immediate family",
  "Gift from non-immediate family",
  "Government or homebuyer grant",
  "Sale of existing property",
  "Builder or seller incentive",
  "Rent-to-own accumulated deposit",
  "Borrowed funds",
  "Business funds",
  "Funds from outside Canada",
  "Other",
] as const;
type SourceType = (typeof SOURCE_TYPES)[number];

type Source = {
  id: string;
  type: SourceType;
  amount: number;
  borrower: string;
  institution: string;
  available: (typeof AVAILABILITY)[number];
  held90: (typeof HOLD_90D)[number];
  notes: string;
  // gift
  donorRel: string;
  repayable: (typeof YES_NO)[number];
  donorCountry: string;
  // sale
  saleAddress: string;
  firmSale: (typeof YES_NO)[number];
  saleClosing: string;
  // borrowed
  borrowedFrom: string;
  monthlyRepayment: number;
  borrowedRate: number;
  // outside Canada
  country: string;
  currency: string;
  inCanada: (typeof YES_NO)[number];
  // builder incentive
  incentiveType: string;
  incentiveDisclosed: (typeof YES_NO)[number];
  // RRSP / FHSA
  usingHBP: (typeof FTHB)[number];
  fhsaHolder: string;
};

const newSource = (over: Partial<Source> = {}): Source => ({
  id: `s-${Math.random().toString(36).slice(2, 8)}`,
  type: "Personal savings",
  amount: 0,
  borrower: "Primary borrower",
  institution: "",
  available: "Yes",
  held90: "Yes",
  notes: "",
  donorRel: "Parent",
  repayable: "No",
  donorCountry: "Canada",
  saleAddress: "",
  firmSale: "No",
  saleClosing: "",
  borrowedFrom: "",
  monthlyRepayment: 0,
  borrowedRate: 0,
  country: "",
  currency: "CAD",
  inCanada: "Yes",
  incentiveType: "Cash credit",
  incentiveDisclosed: "Yes",
  usingHBP: "Yes",
  fhsaHolder: "Primary borrower",
  ...over,
});

const SOURCE_DOCS: Record<string, string[]> = {
  "Personal savings": ["90-day bank statements"],
  "Chequing / savings account": ["90-day bank statements"],
  TFSA: ["TFSA account statement"],
  "RRSP Home Buyers' Plan": ["RRSP account statement", "Withdrawal confirmation later"],
  FHSA: ["FHSA account statement", "Withdrawal confirmation later"],
  "Investment account": ["Investment account statements"],
  "Gift from immediate family": ["Signed gift letter", "Proof of donor funds"],
  "Gift from non-immediate family": ["Signed gift letter", "Proof of donor funds"],
  "Government or homebuyer grant": ["Grant approval letter"],
  "Sale of existing property": ["Sale agreement", "Statement of adjustments"],
  "Builder or seller incentive": ["Purchase agreement showing incentive"],
  "Rent-to-own accumulated deposit": ["Rent-to-own agreement", "Payment history"],
  "Borrowed funds": ["Loan agreement", "Monthly payment confirmation"],
  "Business funds": ["Business financials", "Accountant letter"],
  "Funds from outside Canada": [
    "Bank records",
    "Transfer confirmation",
    "Source-of-funds evidence",
  ],
  Other: ["Source-of-funds documentation"],
};

function DownPaymentPlannerPage() {
  // Scenario
  const [province, setProvince] = useState<(typeof PROVINCES)[number]>("Ontario");
  const [city, setCity] = useState("Toronto");
  const [purchasePrice, setPurchasePrice] = useState(850000);
  const [propertyUsage, setPropertyUsage] =
    useState<(typeof PROPERTY_USAGES)[number]>("Primary residence");
  const [propertyType, setPropertyType] = useState<(typeof PROPERTY_TYPES)[number]>("Detached");
  const [fthb, setFthb] = useState<(typeof FTHB)[number]>("Yes");
  const [newConstruction, setNewConstruction] = useState<(typeof NEW_CONSTR)[number]>("No");
  const [timeline, setTimeline] = useState<(typeof TIMELINES)[number]>("3–6 months");

  // Sources
  const [sources, setSources] = useState<Source[]>([newSource()]);

  // Savings gap planner
  const [gapOpen, setGapOpen] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [monthlySavings, setMonthlySavings] = useState(1500);
  const [expectedGift, setExpectedGift] = useState(0);
  const [investmentGrowth, setInvestmentGrowth] = useState(0);

  // Derived
  const totalDownPayment = sources.reduce((s, x) => s + (x.amount || 0), 0);
  const dpPct = purchasePrice > 0 ? totalDownPayment / purchasePrice : 0;
  const mortgageAmount = Math.max(0, purchasePrice - totalDownPayment);
  const ltv = purchasePrice > 0 ? mortgageAmount / purchasePrice : 0;
  const minRequired = calcMinDownPayment(purchasePrice);
  const gap = minRequired - totalDownPayment;
  const surplus = -gap;
  const meetsMin = totalDownPayment >= minRequired;

  const insuranceSignal = (() => {
    if (purchasePrice <= 0) return { label: "Add a few details", tone: "muted" as const };
    if (purchasePrice > downPaymentRules.insuredMortgageMaxPrice && ltv > 0.8)
      return { label: "Insurable only with 20%+ down at this price", tone: "coral" as const };
    if (ltv >= 0.8) return { label: "May require default insurance", tone: "warning" as const };
    if (ltv > 0) return { label: "20% or more down — likely uninsured", tone: "mint" as const };
    return { label: "Needs review", tone: "secondary" as const };
  })();

  const insurancePremiumEst = useMemo(() => {
    if (ltv <= 0.8 || purchasePrice > downPaymentRules.insuredMortgageMaxPrice) return 0;
    // Rough CMHC-style premium tiers
    let rate = 0.04;
    if (ltv <= 0.65) rate = 0.006;
    else if (ltv <= 0.75) rate = 0.017;
    else if (ltv <= 0.8) rate = 0.024;
    else if (ltv <= 0.85) rate = 0.028;
    else if (ltv <= 0.9) rate = 0.031;
    else if (ltv <= 0.95) rate = 0.04;
    return mortgageAmount * rate;
  }, [ltv, mortgageAmount, purchasePrice]);

  // Validation
  const errors: string[] = [];
  if (!province) errors.push("Province required.");
  if (purchasePrice <= 0) errors.push("Please enter your target purchase price.");
  if (sources.length === 0) errors.push("Please add at least one down payment source.");
  sources.forEach((s, i) => {
    if (s.amount <= 0) errors.push(`Source ${i + 1}: please enter an amount.`);
    if (!s.borrower)
      errors.push(`Source ${i + 1}: please select who owns or provides this source.`);
    if (s.type === "Borrowed funds" && s.monthlyRepayment <= 0)
      errors.push(`Source ${i + 1}: borrowed funds require a monthly repayment amount.`);
    if (s.type.startsWith("Gift") && !s.donorRel)
      errors.push(`Source ${i + 1}: gift must include donor relationship.`);
    if (s.type === "Sale of existing property" && s.amount <= 0)
      errors.push(`Source ${i + 1}: sale proceeds should include expected sale amount.`);
  });

  // Warnings
  const warnings: string[] = [];
  if (!meetsMin && purchasePrice > 0)
    warnings.push("Your down payment appears below the estimated minimum.");
  if (sources.some((s) => s.type === "Borrowed funds"))
    warnings.push("Borrowed funds may reduce mortgage affordability.");
  if (sources.some((s) => s.type === "Funds from outside Canada"))
    warnings.push(
      "Funds from outside Canada may require additional source-of-funds documentation.",
    );
  if (sources.some((s) => s.type.startsWith("Gift")))
    warnings.push("Gift funds may need a signed gift letter.");
  warnings.push("Closing costs are separate from your down payment — budget for them too.");

  // Documents
  const documents = useMemo(() => {
    const list: { doc: string; source: string }[] = [];
    sources.forEach((s) => {
      const docs = SOURCE_DOCS[s.type] ?? [];
      docs.forEach((d) => list.push({ doc: d, source: s.type }));
    });
    return list;
  }, [sources]);

  // Savings gap math
  const gapMonths = useMemo(() => {
    if (!targetDate) return null;
    const t = new Date(targetDate);
    if (Number.isNaN(t.getTime())) return null;
    return Math.max(0, Math.round((t.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.4375)));
  }, [targetDate]);

  const stillNeeded = Math.max(0, minRequired - totalDownPayment - expectedGift - investmentGrowth);
  const monthlySavingsNeeded = gapMonths && gapMonths > 0 ? stillNeeded / gapMonths : null;

  const onReset = () => {
    setProvince("Ontario");
    setCity("Toronto");
    setPurchasePrice(850000);
    setPropertyUsage("Primary residence");
    setPropertyType("Detached");
    setFthb("Yes");
    setNewConstruction("No");
    setTimeline("3–6 months");
    setSources([newSource()]);
    setTargetDate("");
    setMonthlySavings(1500);
    setExpectedGift(0);
    setInvestmentGrowth(0);
  };

  const onSave = () =>
    saveScenario({
      tool: "Down Payment Planner",
      name: `${fmtMoney(purchasePrice)} · ${fmtPct(dpPct * 100)} down`,
      inputs: {
        province,
        city,
        purchasePrice,
        propertyUsage,
        propertyType,
        fthb,
        newConstruction,
        timeline,
        sources,
      },
      outputs: {
        totalDownPayment,
        dpPct,
        mortgageAmount,
        ltv,
        minRequired,
        gap,
        insuranceSignal: insuranceSignal.label,
        insurancePremiumEst,
      },
    });

  return (
    <ToolPageShell
      title="Down Payment Planner"
      subtitle="Plan your down payment sources and see how they affect your mortgage and LTV."
      bestFor="first-time buyers"
    >
      <Disclaimer />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        {/* Inputs */}
        <div className="space-y-4">
          <Card
            title="Your purchase scenario"
            subtitle="Tell us about the home you're planning to buy."
          >
            <SelectField
              label="Province"
              value={province}
              onChange={setProvince}
              options={PROVINCES}
            />
            <TextField
              label="City / municipality"
              value={city}
              onChange={setCity}
              placeholder="e.g. Toronto"
            />
            <NumField
              label="Target purchase price"
              prefix="$"
              step={1000}
              value={purchasePrice}
              onChange={setPurchasePrice}
            />
            <SelectField
              label="Property usage"
              value={propertyUsage}
              onChange={setPropertyUsage}
              options={PROPERTY_USAGES}
            />
            <SelectField
              label="Property type"
              value={propertyType}
              onChange={setPropertyType}
              options={PROPERTY_TYPES}
            />
            <SelectField
              label="First-time home buyer?"
              value={fthb}
              onChange={setFthb}
              options={FTHB}
            />
            <SelectField
              label="New construction?"
              value={newConstruction}
              onChange={setNewConstruction}
              options={NEW_CONSTR}
            />
            <SelectField
              label="Expected purchase timeline"
              value={timeline}
              onChange={setTimeline}
              options={TIMELINES}
            />

            <div className="grid grid-cols-3 gap-3 pt-1">
              <MiniStat label="Min. down payment" value={fmtMoney(minRequired)} />
              <MiniStat label="Mortgage amount" value={fmtMoney(mortgageAmount)} />
              <MiniStat label="Estimated LTV" value={fmtPct(ltv * 100)} />
            </div>
          </Card>

          <Card
            title="Your down payment sources"
            subtitle="Add where your funds are coming from. Some sources may require documents later."
          >
            <div className="space-y-3">
              {sources.map((s, i) => (
                <SourceCard
                  key={s.id}
                  source={s}
                  onChange={(next) =>
                    setSources((prev) => prev.map((x, j) => (i === j ? next : x)))
                  }
                  onRemove={() => setSources((prev) => prev.filter((_, j) => j !== i))}
                />
              ))}
              <button
                type="button"
                onClick={() => setSources((prev) => [...prev, newSource()])}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Add source
              </button>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <MiniStat label="Total down payment" value={fmtMoney(totalDownPayment)} />
                <MiniStat label="Down payment %" value={fmtPct(dpPct * 100)} />
              </div>
            </div>
          </Card>

          <Accordion
            open={gapOpen}
            onToggle={() => setGapOpen((o) => !o)}
            title="Savings gap planner"
            subtitle="If you have a shortfall or future timeline, plan your monthly savings."
          >
            <TextField
              label="Target purchase date"
              value={targetDate}
              onChange={setTargetDate}
              placeholder="YYYY-MM-DD"
            />
            <NumField
              label="Monthly savings amount"
              prefix="$"
              step={50}
              value={monthlySavings}
              onChange={setMonthlySavings}
            />
            <NumField
              label="Expected additional gift / grant"
              prefix="$"
              step={500}
              value={expectedGift}
              onChange={setExpectedGift}
            />
            <NumField
              label="Expected investment growth (optional)"
              prefix="$"
              step={100}
              value={investmentGrowth}
              onChange={setInvestmentGrowth}
            />
          </Accordion>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <section className="lg:sticky lg:top-4 space-y-4">
            <Card title="Your down payment estimate">
              <ErrorList errors={errors} />
              {warnings.map((w, i) => (
                <p
                  key={i}
                  className="rounded-lg border border-secondary/30 bg-secondary/5 p-2 text-[11px] text-foreground"
                >
                  {w}
                </p>
              ))}

              <SignalPill signal={insuranceSignal} />

              <HeroResult
                label={meetsMin ? "Surplus over minimum" : "Gap to minimum"}
                value={fmtMoney(Math.abs(gap))}
                sub={
                  meetsMin
                    ? "Your entered down payment meets the estimated minimum for this purchase price."
                    : `You may need approximately ${fmtMoney(gap)} more to meet the estimated minimum down payment.`
                }
              />

              <ResultRow label="Purchase price" value={fmtMoney(purchasePrice)} />
              <ResultRow
                label="Total down payment"
                value={fmtMoney(totalDownPayment)}
                tone="primary"
              />
              <ResultRow label="Down payment %" value={fmtPct(dpPct * 100)} />
              <ResultRow label="Estimated minimum required" value={fmtMoney(minRequired)} />
              <ResultRow
                label={meetsMin ? "Surplus" : "Gap"}
                value={fmtMoney(Math.abs(gap))}
                tone={meetsMin ? "mint" : "coral"}
              />
              <ResultRow label="Estimated mortgage amount" value={fmtMoney(mortgageAmount)} />
              <ResultRow
                label="Estimated LTV"
                value={fmtPct(ltv * 100)}
                tone={ltv > 0.8 ? "primary" : "mint"}
              />
              {insurancePremiumEst > 0 && (
                <ResultRow
                  label="Estimated default insurance premium"
                  value={fmtMoney(insurancePremiumEst)}
                  tone="primary"
                />
              )}

              <p className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                If your down payment is below 20%, mortgage default insurance may apply. Final
                insurance cost depends on product and lender rules.
              </p>
            </Card>

            <Card title="Minimum down payment check">
              <p className="text-[11px] text-muted-foreground">
                For homes above $500,000, the minimum down payment is calculated in tiers: 5% on the
                first $500,000, 10% on the portion from $500K to $1.5M, and typically 20%+ at $1.5M
                and above.
              </p>
              <ResultRow label="Estimated minimum required" value={fmtMoney(minRequired)} />
              <ResultRow label="Your entered down payment" value={fmtMoney(totalDownPayment)} />
              <ResultRow
                label="Difference"
                value={fmtMoney(Math.abs(gap))}
                tone={meetsMin ? "mint" : "coral"}
              />
              <ResultRow
                label="Status"
                value={meetsMin ? "Meets minimum" : "Below minimum"}
                tone={meetsMin ? "mint" : "coral"}
              />
            </Card>

            <Card title="Documents you may need">
              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add a source to see likely documents.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {documents.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-3 border-b border-border/60 pb-1.5"
                    >
                      <span className="text-foreground">{d.doc}</span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {d.source}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                Status: <strong>May be required.</strong> Final document list depends on lender
                review.
              </p>
            </Card>

            <Card title="Savings gap planner">
              {meetsMin && gapMonths === null ? (
                <p className="text-xs text-foreground">
                  You appear to have enough down payment based on this estimate. Remember to budget
                  for closing costs too.
                </p>
              ) : (
                <>
                  <ResultRow
                    label="Amount still needed"
                    value={fmtMoney(stillNeeded)}
                    tone={stillNeeded > 0 ? "coral" : "mint"}
                  />
                  <ResultRow
                    label="Months until target date"
                    value={gapMonths !== null ? `${gapMonths} mo` : "—"}
                  />
                  <ResultRow
                    label="Monthly savings needed"
                    value={
                      monthlySavingsNeeded !== null ? `${fmtMoney(monthlySavingsNeeded)}/mo` : "—"
                    }
                    tone="primary"
                  />
                  {monthlySavingsNeeded !== null && (
                    <p className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      You currently plan to save <strong>{fmtMoney(monthlySavings)}/mo</strong>.
                      {monthlySavings >= monthlySavingsNeeded
                        ? " You're on track."
                        : ` You may need to increase savings by ${fmtMoney(monthlySavingsNeeded - monthlySavings)}/mo.`}
                    </p>
                  )}
                </>
              )}
              <Link
                to="/portal/tools/closing-costs"
                className="inline-flex items-center gap-1.5 rounded-md border border-secondary/40 bg-secondary/5 px-3 py-1.5 text-[11px] font-semibold text-secondary hover:bg-secondary/10"
              >
                Estimate closing costs
              </Link>
            </Card>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onSave}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Save scenario
              </button>
              <Link
                to="/pre-purchase"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Start Mortgage Snapshot
              </Link>
              <Link
                to="/internal/full-application"
                className="inline-flex items-center gap-1.5 rounded-md border border-secondary/40 bg-secondary/5 px-3.5 py-2 text-xs font-semibold text-secondary hover:bg-secondary/10"
              >
                Use these numbers in my application
              </Link>
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            </div>
          </section>
        </div>
      </div>

      <HowCalculated />
    </ToolPageShell>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────
function Disclaimer() {
  return (
    <p className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-[11px] text-foreground">
      This is an estimate only. Final mortgage eligibility depends on lender rules, verified funds,
      property details, insurance rules, and document review.
    </p>
  );
}

function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Accordion({
  open,
  onToggle,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2">{children}</div>
      )}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="rounded-lg border border-coral/40 bg-coral/5 p-3 text-[11px] text-coral">
      {errors.map((e, i) => (
        <li key={i}>• {e}</li>
      ))}
    </ul>
  );
}

function SignalPill({
  signal,
}: {
  signal: { label: string; tone: "mint" | "secondary" | "warning" | "coral" | "muted" };
}) {
  const map = {
    mint: "bg-mint/20 text-foreground border-mint/40",
    secondary: "bg-secondary/15 text-secondary border-secondary/30",
    warning: "bg-amber-100 text-amber-900 border-amber-300",
    coral: "bg-coral/10 text-coral border-coral/40",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${map[signal.tone]}`}
    >
      <Info className="h-3 w-3" /> {signal.label}
    </div>
  );
}

function SourceCard({
  source,
  onChange,
  onRemove,
}: {
  source: Source;
  onChange: (s: Source) => void;
  onRemove: () => void;
}) {
  const isGift = source.type.startsWith("Gift");
  const set = <K extends keyof Source>(k: K, v: Source[K]) => onChange({ ...source, [k]: v });

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary">
          {source.type}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-coral"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Source type"
          value={source.type}
          onChange={(v) => set("type", v as SourceType)}
          options={SOURCE_TYPES}
        />
        <NumField
          label="Amount"
          prefix="$"
          step={500}
          value={source.amount}
          onChange={(n) => set("amount", n)}
        />
        <TextField
          label="Borrower"
          value={source.borrower}
          onChange={(v) => set("borrower", v)}
          placeholder="e.g. Primary borrower"
        />
        <TextField
          label="Institution / source name (optional)"
          value={source.institution}
          onChange={(v) => set("institution", v)}
          placeholder="e.g. RBC, Wealthsimple"
        />
        <SelectField
          label="Funds already available?"
          value={source.available}
          onChange={(v) => set("available", v)}
          options={AVAILABILITY}
        />
        <SelectField
          label="Funds held for 90 days?"
          value={source.held90}
          onChange={(v) => set("held90", v)}
          options={HOLD_90D}
        />

        {isGift && (
          <>
            <TextField
              label="Donor relationship"
              value={source.donorRel}
              onChange={(v) => set("donorRel", v)}
              placeholder="e.g. Parent"
            />
            <SelectField
              label="Is it repayable?"
              value={source.repayable}
              onChange={(v) => set("repayable", v)}
              options={YES_NO}
            />
            <TextField
              label="Donor country"
              value={source.donorCountry}
              onChange={(v) => set("donorCountry", v)}
            />
            <p className="sm:col-span-2 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
              A signed gift letter is typically required. Repayable gifts may be treated as borrowed
              funds.
            </p>
          </>
        )}

        {source.type === "RRSP Home Buyers' Plan" && (
          <>
            <SelectField
              label="Using Home Buyers' Plan?"
              value={source.usingHBP}
              onChange={(v) => set("usingHBP", v)}
              options={FTHB}
            />
            <p className="sm:col-span-2 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
              The RRSP HBP requires first-time buyer status. Up to $60,000 per person may be
              withdrawn tax-free.
            </p>
          </>
        )}

        {source.type === "FHSA" && (
          <>
            <TextField
              label="Account holder"
              value={source.fhsaHolder}
              onChange={(v) => set("fhsaHolder", v)}
            />
            <p className="sm:col-span-2 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
              FHSA withdrawals for a qualifying home purchase are tax-free. First-time buyer status
              required.
            </p>
          </>
        )}

        {source.type === "Sale of existing property" && (
          <>
            <TextField
              label="Property address"
              value={source.saleAddress}
              onChange={(v) => set("saleAddress", v)}
            />
            <SelectField
              label="Firm sale?"
              value={source.firmSale}
              onChange={(v) => set("firmSale", v)}
              options={YES_NO}
            />
            <TextField
              label="Expected closing date"
              value={source.saleClosing}
              onChange={(v) => set("saleClosing", v)}
              placeholder="YYYY-MM-DD"
            />
          </>
        )}

        {source.type === "Borrowed funds" && (
          <>
            <TextField
              label="Lender / source"
              value={source.borrowedFrom}
              onChange={(v) => set("borrowedFrom", v)}
            />
            <NumField
              label="Monthly repayment"
              prefix="$"
              step={10}
              value={source.monthlyRepayment}
              onChange={(n) => set("monthlyRepayment", n)}
            />
            <NumField
              label="Interest rate (optional)"
              suffix="%"
              step={0.05}
              value={source.borrowedRate}
              onChange={(n) => set("borrowedRate", n)}
            />
            <p className="sm:col-span-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900">
              Borrowed down payment may affect mortgage qualification.
            </p>
          </>
        )}

        {source.type === "Funds from outside Canada" && (
          <>
            <TextField label="Country" value={source.country} onChange={(v) => set("country", v)} />
            <TextField
              label="Currency"
              value={source.currency}
              onChange={(v) => set("currency", v)}
              placeholder="e.g. USD"
            />
            <SelectField
              label="Funds already in Canada?"
              value={source.inCanada}
              onChange={(v) => set("inCanada", v)}
              options={YES_NO}
            />
            <p className="sm:col-span-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900">
              Additional source-of-funds documentation may be required.
            </p>
          </>
        )}

        {source.type === "Builder or seller incentive" && (
          <>
            <TextField
              label="Incentive type"
              value={source.incentiveType}
              onChange={(v) => set("incentiveType", v)}
            />
            <SelectField
              label="Disclosed in purchase agreement?"
              value={source.incentiveDisclosed}
              onChange={(v) => set("incentiveDisclosed", v)}
              options={YES_NO}
            />
          </>
        )}

        <TextField
          label="Notes (optional)"
          value={source.notes}
          onChange={(v) => set("notes", v)}
          placeholder="Anything else to remember"
        />
      </div>
    </div>
  );
}

function HowCalculated() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-secondary" />
        <h2 className="text-sm font-semibold text-foreground">How this is calculated</h2>
      </div>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <p>
          This planner adds up your down payment sources and compares them against an estimated
          minimum down payment. It then estimates your mortgage amount, loan-to-value ratio, and
          whether mortgage default insurance may apply.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Total down payment = sum of all selected sources</li>
          <li>Down payment % = total down payment ÷ purchase price</li>
          <li>Mortgage amount = purchase price − down payment</li>
          <li>LTV = mortgage amount ÷ purchase price</li>
          <li>Savings gap = estimated minimum required − total down payment</li>
        </ul>
        <p className="text-[11px]">
          Some down payment sources may affect lender eligibility and may require documentation.
        </p>
      </div>
    </section>
  );
}
