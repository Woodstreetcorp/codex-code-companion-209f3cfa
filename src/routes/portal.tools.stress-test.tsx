import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Info, Plus, Trash2 } from "lucide-react";
import {
  HeroResult,
  NumField,
  PAYMENT_FREQS,
  PaymentFreq,
  ResultRow,
  SelectField,
  ToggleField,
  ToolPageShell,
  fmtMoney,
  fmtPct,
  monthlyEquivalent,
  periodicPayment,
  saveScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/stress-test")({
  head: () => ({
    meta: [
      { title: "Stress Test Calculator — approvU" },
      {
        name: "description",
        content:
          "Estimate qualification using a qualifying rate and affordability ratios.",
      },
    ],
  }),
  component: StressTestCalculatorPage,
});

// ─── Reference data ─────────────────────────────────────────────────────
const PROVINCES = [
  "Ontario", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Quebec",
  "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island",
  "Yukon", "Northwest Territories", "Nunavut",
] as const;

const TRANSACTION_TYPES = ["Purchase", "Pre-Purchase", "Refinance", "Renewal"] as const;
const PROPERTY_USAGES = [
  "Owner-occupied", "Rental / investment", "Second home", "Owner-occupied with rental unit",
] as const;
const AMORT_OPTIONS = ["25 years", "30 years", "Other"] as const;
const INCOME_TYPES = [
  "Salary", "Hourly", "Self-employed", "Pension", "CCB / benefit income",
  "Rental income", "Investment income", "Other",
] as const;
const DEBT_TYPES = [
  "Credit card", "Line of credit", "Auto loan", "Student loan",
  "Personal loan", "Support payment", "Other mortgage", "Other",
] as const;

const MIN_QUALIFYING_RATE = 5.25;

type IncomeRow = {
  id: string;
  borrower: string;
  type: (typeof INCOME_TYPES)[number];
  annual: number;
  include: boolean;
};
type DebtRow = {
  id: string;
  type: (typeof DEBT_TYPES)[number];
  balance: number | null;
  monthly: number;
  include: boolean;
};
const newIncome = (over: Partial<IncomeRow> = {}): IncomeRow => ({
  id: `i-${Math.random().toString(36).slice(2, 8)}`,
  borrower: "Borrower",
  type: "Salary",
  annual: 0,
  include: true,
  ...over,
});
const newDebt = (over: Partial<DebtRow> = {}): DebtRow => ({
  id: `d-${Math.random().toString(36).slice(2, 8)}`,
  type: "Credit card",
  balance: null,
  monthly: 0,
  include: true,
  ...over,
});

function StressTestCalculatorPage() {
  // Mortgage scenario
  const [transactionType, setTransactionType] = useState<(typeof TRANSACTION_TYPES)[number]>("Purchase");
  const [province, setProvince] = useState<(typeof PROVINCES)[number]>("Ontario");
  const [propertyValue, setPropertyValue] = useState(850000);
  const [mortgageAmount, setMortgageAmount] = useState(765000);
  const [downPayment, setDownPayment] = useState(85000);
  const [contractRate, setContractRate] = useState(4.89);
  const [amortChoice, setAmortChoice] = useState<(typeof AMORT_OPTIONS)[number]>("25 years");
  const [amortYears, setAmortYears] = useState(25);
  const [freq, setFreq] = useState<PaymentFreq>("Monthly");
  const [propertyUsage, setPropertyUsage] = useState<(typeof PROPERTY_USAGES)[number]>("Owner-occupied");

  // Income
  const [incomes, setIncomes] = useState<IncomeRow[]>([
    newIncome({ borrower: "Primary borrower", type: "Salary", annual: 180000 }),
  ]);

  // Property costs
  const [annualPropertyTax, setAnnualPropertyTax] = useState(5400);
  const [monthlyHeat, setMonthlyHeat] = useState(120);
  const [monthlyCondo, setMonthlyCondo] = useState(0);
  const [rentalOffset, setRentalOffset] = useState(0);
  const [otherPropertyCost, setOtherPropertyCost] = useState(0);

  // Debts
  const [debts, setDebts] = useState<DebtRow[]>([
    newDebt({ type: "Auto loan", monthly: 450 }),
    newDebt({ type: "Credit card", monthly: 150 }),
    newDebt({ type: "Line of credit", monthly: 300 }),
  ]);

  // Stress test rule
  const [useGlobalRule, setUseGlobalRule] = useState(true);
  const [manualQualifyingRate, setManualQualifyingRate] = useState(0);

  // Costs accordion
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Calculations
  const qualifyingRateAuto = Math.max(MIN_QUALIFYING_RATE, contractRate + 2);
  const qualifyingRate = useGlobalRule || manualQualifyingRate <= 0 ? qualifyingRateAuto : manualQualifyingRate;

  const contractPaymentPeriodic = useMemo(
    () => periodicPayment(mortgageAmount, contractRate, amortYears, freq),
    [mortgageAmount, contractRate, amortYears, freq],
  );
  const qualifyingPaymentPeriodic = useMemo(
    () => periodicPayment(mortgageAmount, qualifyingRate, amortYears, freq),
    [mortgageAmount, qualifyingRate, amortYears, freq],
  );
  const contractPaymentMonthly = monthlyEquivalent(contractPaymentPeriodic, freq);
  const qualifyingPaymentMonthly = monthlyEquivalent(qualifyingPaymentPeriodic, freq);

  const includedIncomes = incomes.filter((i) => i.include);
  const totalAnnualIncome = includedIncomes.reduce((s, i) => s + (i.annual || 0), 0);
  const grossMonthlyIncome = totalAnnualIncome / 12;

  const monthlyPropertyTax = annualPropertyTax / 12;
  const condoForRatio = monthlyCondo * 0.5; // common lender practice
  const shelterCosts =
    qualifyingPaymentMonthly + monthlyPropertyTax + monthlyHeat + condoForRatio + otherPropertyCost - rentalOffset;

  const includedDebts = debts.filter((d) => d.include);
  const totalMonthlyDebts = includedDebts.reduce((s, d) => s + (d.monthly || 0), 0);

  const totalObligations = shelterCosts + totalMonthlyDebts;
  const gds = grossMonthlyIncome > 0 ? shelterCosts / grossMonthlyIncome : 0;
  const tds = grossMonthlyIncome > 0 ? totalObligations / grossMonthlyIncome : 0;

  const ltv = propertyValue > 0 ? mortgageAmount / propertyValue : 0;

  // Qualification signal
  const signal = (() => {
    if (totalAnnualIncome <= 0 || mortgageAmount <= 0)
      return { label: "Add a few details", tone: "muted" as const };
    if (gds <= 0.32 && tds <= 0.40) return { label: "Looks within range", tone: "mint" as const };
    if (gds <= 0.39 && tds <= 0.44) return { label: "Close to limit", tone: "secondary" as const };
    if (gds <= 0.44 && tds <= 0.50) return { label: "Needs review", tone: "warning" as const };
    return { label: "Likely above common limits", tone: "coral" as const };
  })();

  // Validation
  const errors: string[] = [];
  if (mortgageAmount <= 0) errors.push("Please enter your mortgage amount.");
  if (contractRate <= 0) errors.push("Please enter your contract interest rate.");
  if (amortYears <= 0) errors.push("Please enter your amortization period.");
  if (totalAnnualIncome <= 0) errors.push("Please enter your gross annual income.");
  if (transactionType === "Purchase" && propertyValue <= mortgageAmount)
    errors.push("Property value must be greater than mortgage amount for purchase estimates.");

  const warnings: string[] = [];
  if (gds > 0.39) warnings.push("Your estimated GDS appears high.");
  if (tds > 0.44) warnings.push("Your estimated TDS appears high.");
  if (qualifyingRate > contractRate)
    warnings.push("Your qualifying rate is higher than your contract rate — that's expected under the federal stress test.");
  warnings.push("This result does not guarantee approval.");

  // Suggestions
  const suggestions: string[] = [];
  if (gds > 0.35) {
    suggestions.push("Increase your down payment to reduce the mortgage amount.");
    suggestions.push("Consider a lower target purchase price.");
    if (amortYears < 30) suggestions.push("Consider a longer amortization (e.g. 30 years) if available.");
    suggestions.push("Reduce property costs where possible (lower heating, smaller condo fee).");
  }
  if (tds > 0.40) {
    suggestions.push("Pay down high-payment monthly debts before applying.");
    suggestions.push("Consolidate or restructure debts to lower minimum monthly payments.");
    suggestions.push("Remove debts being paid off before closing from the application.");
    if (incomes.length === 1)
      suggestions.push("Add an eligible co-applicant's income, if possible.");
  }
  if (qualifyingPaymentMonthly > grossMonthlyIncome * 0.30) {
    suggestions.push("Compare lower-rate mortgage products to reduce your qualifying payment.");
    suggestions.push("Review amortization options or adjust the requested mortgage amount.");
  }
  if (suggestions.length === 0)
    suggestions.push("Your estimate appears within a common range, but final approval still depends on lender review.");

  const onReset = () => {
    setTransactionType("Purchase");
    setProvince("Ontario");
    setPropertyValue(850000);
    setMortgageAmount(765000);
    setDownPayment(85000);
    setContractRate(4.89);
    setAmortChoice("25 years");
    setAmortYears(25);
    setFreq("Monthly");
    setPropertyUsage("Owner-occupied");
    setIncomes([newIncome({ borrower: "Primary borrower", type: "Salary", annual: 180000 })]);
    setAnnualPropertyTax(5400);
    setMonthlyHeat(120);
    setMonthlyCondo(0);
    setRentalOffset(0);
    setOtherPropertyCost(0);
    setDebts([
      newDebt({ type: "Auto loan", monthly: 450 }),
      newDebt({ type: "Credit card", monthly: 150 }),
      newDebt({ type: "Line of credit", monthly: 300 }),
    ]);
    setUseGlobalRule(true);
    setManualQualifyingRate(0);
  };

  const onSave = () =>
    saveScenario({
      tool: "Stress Test Calculator",
      name: `${fmtMoney(mortgageAmount)} @ ${fmtPct(contractRate)} · ${transactionType}`,
      inputs: {
        transactionType, province, propertyValue, mortgageAmount, downPayment,
        contractRate, amortYears, freq, propertyUsage,
        incomes: includedIncomes, annualPropertyTax, monthlyHeat, monthlyCondo,
        rentalOffset, otherPropertyCost,
        debts: includedDebts,
        useGlobalRule, qualifyingRate,
      },
      outputs: {
        qualifyingRate, contractPaymentMonthly, qualifyingPaymentMonthly,
        grossMonthlyIncome, shelterCosts, totalObligations,
        gds, tds, ltv, signal: signal.label,
      },
    });

  return (
    <ToolPageShell
      title="Stress Test Calculator"
      subtitle="Estimate qualification using a qualifying rate and affordability ratios."
      bestFor="understanding qualification"
    >
      <Disclaimer />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        {/* Inputs */}
        <div className="space-y-4">
          <Card title="Mortgage scenario" subtitle="Tell us about the mortgage you're testing.">
            <SelectField label="Transaction type" value={transactionType} onChange={setTransactionType} options={TRANSACTION_TYPES} />
            <SelectField label="Province" value={province} onChange={setProvince} options={PROVINCES} />
            <NumField label="Property value or purchase price" prefix="$" step={1000} value={propertyValue} onChange={setPropertyValue} />
            <NumField label="Mortgage amount requested" prefix="$" step={1000} value={mortgageAmount} onChange={setMortgageAmount} />
            {transactionType === "Purchase" && (
              <NumField label="Down payment" prefix="$" step={1000} value={downPayment} onChange={setDownPayment} />
            )}
            <NumField label="Contract interest rate" suffix="%" step={0.01} value={contractRate} onChange={setContractRate} />
            <SelectField
              label="Amortization period"
              value={amortChoice}
              onChange={(v) => {
                setAmortChoice(v);
                if (v === "25 years") setAmortYears(25);
                else if (v === "30 years") setAmortYears(30);
              }}
              options={AMORT_OPTIONS}
            />
            {amortChoice === "Other" && (
              <NumField label="Custom amortization (years)" step={1} value={amortYears} onChange={setAmortYears} />
            )}
            <SelectField label="Payment frequency" value={freq} onChange={setFreq} options={PAYMENT_FREQS} />
            <SelectField label="Property usage" value={propertyUsage} onChange={setPropertyUsage} options={PROPERTY_USAGES} />

            <div className="grid grid-cols-3 gap-3 pt-1">
              <MiniStat label="Estimated LTV" value={fmtPct(ltv * 100)} />
              <MiniStat label="Contract payment" value={`${fmtMoney(contractPaymentMonthly)}/mo`} />
              <MiniStat label="Stress-tested payment" value={`${fmtMoney(qualifyingPaymentMonthly)}/mo`} />
            </div>
          </Card>

          <Card title="Income used for qualification" subtitle="Add each income source. Toggle to include or exclude from the test.">
            <div className="space-y-3">
              {incomes.map((row, i) => (
                <IncomeRowCard
                  key={row.id}
                  row={row}
                  onChange={(next) => setIncomes((prev) => prev.map((x, j) => (i === j ? next : x)))}
                  onRemove={() => setIncomes((prev) => prev.filter((_, j) => j !== i))}
                />
              ))}
              <button
                type="button"
                onClick={() => setIncomes((prev) => [...prev, newIncome()])}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Add income source
              </button>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <MiniStat label="Total annual income" value={fmtMoney(totalAnnualIncome)} />
                <MiniStat label="Gross monthly income" value={fmtMoney(grossMonthlyIncome)} />
              </div>
            </div>
          </Card>

          <Card title="Property costs" subtitle="Property taxes, heating, and condo fees are commonly included when calculating affordability ratios.">
            <NumField label="Annual property tax" prefix="$" step={50} value={annualPropertyTax} onChange={setAnnualPropertyTax} />
            <NumField label="Monthly heating cost" prefix="$" step={10} value={monthlyHeat} onChange={setMonthlyHeat} />
            <NumField label="Monthly condo fee (if applicable)" prefix="$" step={10} value={monthlyCondo} onChange={setMonthlyCondo} />
            <NumField label="Monthly rental offset (optional)" prefix="$" step={50} value={rentalOffset} onChange={setRentalOffset} />
            <NumField label="Other monthly property cost (optional)" prefix="$" step={10} value={otherPropertyCost} onChange={setOtherPropertyCost} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <MiniStat label="Monthly property tax" value={fmtMoney(monthlyPropertyTax)} />
              <MiniStat label="Total monthly shelter" value={fmtMoney(shelterCosts)} />
            </div>
          </Card>

          <Card title="Monthly debts" subtitle="Add monthly debts that should be included in your qualification estimate.">
            <div className="space-y-3">
              {debts.map((row, i) => (
                <DebtRowCard
                  key={row.id}
                  row={row}
                  onChange={(next) => setDebts((prev) => prev.map((x, j) => (i === j ? next : x)))}
                  onRemove={() => setDebts((prev) => prev.filter((_, j) => j !== i))}
                />
              ))}
              <button
                type="button"
                onClick={() => setDebts((prev) => [...prev, newDebt()])}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Add debt
              </button>
              <div className="pt-1">
                <MiniStat label="Total included monthly debts" value={`${fmtMoney(totalMonthlyDebts)}/mo`} />
              </div>
            </div>
          </Card>

          <Card
            title="Qualifying rate"
            subtitle="Mortgage qualification often uses a higher rate than the contract rate to test affordability if rates rise."
            right={<ToggleField label="Use standard rule" value={useGlobalRule} onChange={setUseGlobalRule} />}
          >
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Contract rate" value={fmtPct(contractRate)} />
              <MiniStat label="Contract + 2%" value={fmtPct(contractRate + 2)} />
              <MiniStat label="Minimum (5.25%)" value={fmtPct(MIN_QUALIFYING_RATE)} />
            </div>
            <p className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
              Standard rule: use the higher of 5.25% or contract rate + 2%. Current qualifying rate:
              <strong className="ml-1 text-foreground">{fmtPct(qualifyingRateAuto)}</strong>.
            </p>
            {!useGlobalRule && (
              <NumField
                label="Manual qualifying rate override"
                suffix="%"
                step={0.01}
                value={manualQualifyingRate}
                onChange={setManualQualifyingRate}
              />
            )}
          </Card>

          <Accordion
            open={advancedOpen}
            onToggle={() => setAdvancedOpen((o) => !o)}
            title="Advanced inputs"
            subtitle="Fine-tune ratio assumptions if needed."
          >
            <p className="col-span-full text-[11px] text-muted-foreground">
              We use 50% of condo fees in the affordability ratio (a common lender convention).
              Final lender treatment may differ.
            </p>
          </Accordion>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <section className="lg:sticky lg:top-4 space-y-4">
            <Card title="Your stress test estimate">
              <ErrorList errors={errors} />
              {warnings.map((w, i) => (
                <p key={i} className="rounded-lg border border-secondary/30 bg-secondary/5 p-2 text-[11px] text-foreground">
                  {w}
                </p>
              ))}

              <SignalPill signal={signal} />

              <HeroResult
                label="Stress-tested qualifying payment"
                value={`${fmtMoney(qualifyingPaymentMonthly)}/mo`}
                sub={`At a qualifying rate of ${fmtPct(qualifyingRate)} over ${amortYears} years.`}
              />

              <ResultRow label="Qualifying rate used" value={fmtPct(qualifyingRate)} />
              <ResultRow label="Contract payment" value={`${fmtMoney(contractPaymentMonthly)}/mo`} />
              <ResultRow label="Gross monthly income" value={fmtMoney(grossMonthlyIncome)} />
              <ResultRow label="Estimated GDS" value={fmtPct(gds * 100)} tone={gds <= 0.32 ? "mint" : gds <= 0.39 ? "primary" : "coral"} />
              <ResultRow label="Estimated TDS" value={fmtPct(tds * 100)} tone={tds <= 0.40 ? "mint" : tds <= 0.44 ? "primary" : "coral"} />

              <RatioMeter label="GDS" value={gds} good={0.32} caution={0.39} />
              <RatioMeter label="TDS" value={tds} good={0.40} caution={0.44} />
            </Card>

            <Card title="Affordability ratio breakdown">
              <Subhead>GDS</Subhead>
              <ResultRow label="Stress-tested mortgage payment" value={`${fmtMoney(qualifyingPaymentMonthly)}/mo`} />
              <ResultRow label="Monthly property tax" value={`${fmtMoney(monthlyPropertyTax)}/mo`} />
              <ResultRow label="Heating cost" value={`${fmtMoney(monthlyHeat)}/mo`} />
              <ResultRow label="Condo fee (50% used)" value={`${fmtMoney(condoForRatio)}/mo`} />
              <ResultRow label="Total shelter cost" value={`${fmtMoney(shelterCosts)}/mo`} />
              <ResultRow label="Gross monthly income" value={fmtMoney(grossMonthlyIncome)} />
              <ResultRow label="GDS ratio" value={fmtPct(gds * 100)} tone="primary" />

              <Subhead>TDS</Subhead>
              <ResultRow label="Total shelter cost" value={`${fmtMoney(shelterCosts)}/mo`} />
              <ResultRow label="Monthly debts" value={`${fmtMoney(totalMonthlyDebts)}/mo`} />
              <ResultRow label="Total monthly obligations" value={`${fmtMoney(totalObligations)}/mo`} />
              <ResultRow label="Gross monthly income" value={fmtMoney(grossMonthlyIncome)} />
              <ResultRow label="TDS ratio" value={fmtPct(tds * 100)} tone="primary" />

              <p className="mt-2 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                Different lenders and mortgage products may allow different ratio limits.
              </p>
            </Card>

            <Card title="Ways to improve your qualification">
              <ul className="space-y-1.5 text-xs leading-relaxed text-foreground">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2"><span className="text-secondary">•</span><span>{s}</span></li>
                ))}
              </ul>
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
      This is an estimate only. Final qualification depends on lender rules, verified income, credit profile,
      property details, documents, and product eligibility.
    </p>
  );
}

function Card({
  title, subtitle, right, children,
}: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
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
  open, onToggle, title, subtitle, children,
}: { open: boolean; onToggle: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
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
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2">{children}</div>}
    </section>
  );
}

function TextField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
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
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground first:mt-0">
      {children}
    </p>
  );
}

function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="rounded-lg border border-coral/40 bg-coral/5 p-3 text-[11px] text-coral">
      {errors.map((e, i) => <li key={i}>• {e}</li>)}
    </ul>
  );
}

function SignalPill({ signal }: { signal: { label: string; tone: "mint" | "secondary" | "warning" | "coral" | "muted" } }) {
  const map = {
    mint: "bg-mint/20 text-foreground border-mint/40",
    secondary: "bg-secondary/15 text-secondary border-secondary/30",
    warning: "bg-amber-100 text-amber-900 border-amber-300",
    coral: "bg-coral/10 text-coral border-coral/40",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${map[signal.tone]}`}>
      <Info className="h-3 w-3" /> {signal.label}
    </div>
  );
}

function RatioMeter({ label, value, good, caution }: { label: string; value: number; good: number; caution: number }) {
  const pct = Math.min(1, Math.max(0, value));
  const tone = value <= good ? "bg-mint" : value <= caution ? "bg-secondary" : "bg-coral";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{fmtPct(value * 100)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${tone}`} style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>0%</span>
        <span>Good ≤ {fmtPct(good * 100)}</span>
        <span>Caution ≤ {fmtPct(caution * 100)}</span>
      </div>
    </div>
  );
}

function IncomeRowCard({
  row, onChange, onRemove,
}: { row: IncomeRow; onChange: (r: IncomeRow) => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <ToggleField label={row.include ? "Included" : "Excluded"} value={row.include} onChange={(v) => onChange({ ...row, include: v })} />
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-coral">
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField label="Borrower" value={row.borrower} onChange={(v) => onChange({ ...row, borrower: v })} placeholder="e.g. Primary borrower" />
        <SelectField
          label="Income type"
          value={row.type}
          onChange={(v) => onChange({ ...row, type: v as IncomeRow["type"] })}
          options={INCOME_TYPES}
        />
        <NumField label="Annual amount" prefix="$" step={500} value={row.annual} onChange={(n) => onChange({ ...row, annual: n })} />
      </div>
    </div>
  );
}

function DebtRowCard({
  row, onChange, onRemove,
}: { row: DebtRow; onChange: (r: DebtRow) => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <ToggleField label={row.include ? "Included" : "Excluded"} value={row.include} onChange={(v) => onChange({ ...row, include: v })} />
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-coral">
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Debt type"
          value={row.type}
          onChange={(v) => onChange({ ...row, type: v as DebtRow["type"] })}
          options={DEBT_TYPES}
        />
        <NumField label="Balance (optional)" prefix="$" step={100} value={row.balance ?? 0} onChange={(n) => onChange({ ...row, balance: n || null })} />
        <NumField label="Monthly payment" prefix="$" step={10} value={row.monthly} onChange={(n) => onChange({ ...row, monthly: n })} />
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
          This tool estimates affordability using a mortgage qualifying rate, estimated property costs, income,
          and monthly debts. It calculates GDS and TDS ratios, which lenders commonly use to assess mortgage affordability.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Qualifying rate = higher of 5.25% or contract rate + 2%</li>
          <li>Shelter costs = qualifying mortgage payment + property tax + heating + 50% condo fees</li>
          <li>GDS = shelter costs ÷ gross monthly income</li>
          <li>TDS = (shelter costs + debts) ÷ gross monthly income</li>
        </ul>
        <p className="text-[11px]">
          Canadian mortgages compound semi-annually; payment estimates use that convention.
        </p>
      </div>
    </section>
  );
}
