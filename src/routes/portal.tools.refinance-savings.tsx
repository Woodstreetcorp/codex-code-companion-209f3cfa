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

export const Route = createFileRoute("/portal/tools/refinance-savings")({
  head: () => ({
    meta: [
      { title: "Refinance Savings Calculator — approvU" },
      {
        name: "description",
        content:
          "Estimate whether refinancing could lower your payment, consolidate debt, or unlock home equity.",
      },
    ],
  }),
  component: RefinanceSavingsCalculatorPage,
});

// ─── Reference data ─────────────────────────────────────────────────────
const PROVINCES = [
  "Ontario", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Quebec",
  "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island",
  "Yukon", "Northwest Territories", "Nunavut",
] as const;

const RATE_TYPES = ["Fixed", "Variable", "Adjustable", "Not sure"] as const;
const TERM_TYPES = ["Open", "Closed", "Not sure"] as const;
const RATE_PREFS = ["Fixed", "Variable", "No preference"] as const;
const DEBT_TYPES = [
  "Credit card", "Line of credit", "Auto loan", "Personal loan", "Student loan",
  "Collection", "Other",
] as const;

const GOALS = [
  "Lower my monthly payment",
  "Consolidate debt",
  "Access home equity / cash-out",
  "Renovation funds",
  "Switch lender",
  "Shorten my mortgage payoff time",
  "Compare my options",
  "Not sure",
] as const;
type Goal = (typeof GOALS)[number];

type Debt = {
  id: string;
  creditor: string;
  type: (typeof DEBT_TYPES)[number];
  balance: number;
  monthly: number;
  rate: number | null;
  include: boolean;
};

const newDebt = (over: Partial<Debt> = {}): Debt => ({
  id: `d-${Math.random().toString(36).slice(2, 8)}`,
  creditor: "",
  type: "Credit card",
  balance: 0,
  monthly: 0,
  rate: null,
  include: true,
  ...over,
});

// ─── Page ───────────────────────────────────────────────────────────────
function RefinanceSavingsCalculatorPage() {
  // Goal
  const [goal, setGoal] = useState<Goal>("Lower my monthly payment");

  // Current mortgage
  const [province, setProvince] = useState<(typeof PROVINCES)[number]>("Ontario");
  const [propertyValue, setPropertyValue] = useState(900000);
  const [currentBalance, setCurrentBalance] = useState(500000);
  const [currentRate, setCurrentRate] = useState(5.79);
  const [currentPayment, setCurrentPayment] = useState(3150);
  const [remainingAmort, setRemainingAmort] = useState(22);
  const [currentLender, setCurrentLender] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [rateType, setRateType] = useState<(typeof RATE_TYPES)[number]>("Fixed");
  const [termType, setTermType] = useState<(typeof TERM_TYPES)[number]>("Closed");

  // New scenario
  const [newAmount, setNewAmount] = useState(650000);
  const [newRate, setNewRate] = useState(4.99);
  const [newAmort, setNewAmort] = useState(25);
  const [freq, setFreq] = useState<PaymentFreq>("Monthly");
  const [desiredCashOut, setDesiredCashOut] = useState(0);
  const [ratePref, setRatePref] = useState<(typeof RATE_PREFS)[number]>("Fixed");

  // Debt consolidation
  const [debtsExpanded, setDebtsExpanded] = useState(
    goal === "Consolidate debt",
  );
  const [debts, setDebts] = useState<Debt[]>([
    newDebt({ creditor: "Credit card (Visa)", type: "Credit card", balance: 18000, monthly: 540, rate: 19.99 }),
    newDebt({ creditor: "RBC Line of credit", type: "Line of credit", balance: 25000, monthly: 350, rate: 9.45 }),
    newDebt({ creditor: "Honda auto loan", type: "Auto loan", balance: 22000, monthly: 480, rate: 6.49 }),
  ]);

  // Costs
  const [costsOpen, setCostsOpen] = useState(false);
  const [penaltyKnown, setPenaltyKnown] = useState<"Yes" | "I'm not sure">("Yes");
  const [penalty, setPenalty] = useState(4500);
  const [legal, setLegal] = useState(1200);
  const [appraisal, setAppraisal] = useState(500);
  const [titleIns, setTitleIns] = useState(400);
  const [discharge, setDischarge] = useState(350);
  const [registration, setRegistration] = useState(150);
  const [adminFee, setAdminFee] = useState(0);
  const [brokerFee, setBrokerFee] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);

  // Derived
  const includedDebts = debts.filter((d) => d.include);
  const totalDebtBalance = includedDebts.reduce((s, d) => s + (d.balance || 0), 0);
  const totalDebtMonthly = includedDebts.reduce((s, d) => s + (d.monthly || 0), 0);

  const refinanceCosts =
    (penaltyKnown === "Yes" ? penalty : 3000) +
    legal + appraisal + titleIns + discharge + registration + adminFee + brokerFee + otherCosts;

  const equity = Math.max(0, propertyValue - currentBalance);
  const currentLTV = propertyValue > 0 ? currentBalance / propertyValue : 0;
  const newLTV = propertyValue > 0 ? newAmount / propertyValue : 0;
  const cashOutBeforeCosts = newAmount - currentBalance;
  const netCashOut = cashOutBeforeCosts - refinanceCosts;

  const newPaymentPeriodic = useMemo(
    () => periodicPayment(newAmount, newRate, newAmort, freq),
    [newAmount, newRate, newAmort, freq],
  );
  const newPaymentMonthlyEq = monthlyEquivalent(newPaymentPeriodic, freq);

  const monthlySavings =
    currentPayment + (goal === "Consolidate debt" || debtsExpanded ? totalDebtMonthly : 0) -
    newPaymentMonthlyEq;
  const annualCashFlow = monthlySavings * 12;
  const breakEvenMonths = monthlySavings > 0 ? refinanceCosts / monthlySavings : Infinity;

  const suggestedNewAmount =
    currentBalance + totalDebtBalance + desiredCashOut + refinanceCosts;

  // Validation
  const errors: string[] = [];
  if (propertyValue <= 0) errors.push("Please enter your property value.");
  if (currentBalance <= 0) errors.push("Please enter your current mortgage balance.");
  if (currentRate <= 0) errors.push("Please enter your current interest rate.");
  if (currentPayment <= 0) errors.push("Please enter your current monthly payment.");
  if (newAmount <= 0) errors.push("Please enter the new mortgage amount.");
  if (newRate <= 0) errors.push("New interest rate must be greater than 0.");

  const warnings: string[] = [];
  if (currentBalance > propertyValue)
    warnings.push("Your current mortgage balance appears higher than the property value.");
  if (newAmount < currentBalance)
    warnings.push(
      "New mortgage amount is below your current balance. Refinances usually pay out the existing balance.",
    );
  if (newLTV > 0.8)
    warnings.push(
      "Your requested refinance amount may require additional lender review. Conventional refinances are typically capped at 80% LTV.",
    );
  if (penaltyKnown === "I'm not sure")
    warnings.push(
      "Your actual prepayment penalty can significantly affect savings. Confirm with your current lender before deciding.",
    );
  if (includedDebts.length > 0 && monthlySavings > 0)
    warnings.push(
      "Debt consolidation may reduce your monthly payments but can increase total interest over time.",
    );

  // Refinance signal
  const signal = (() => {
    if (errors.length > 0) return { label: "Add a few details", tone: "muted" as const };
    if (monthlySavings >= 400 && breakEvenMonths < 36)
      return { label: "Strong savings potential", tone: "mint" as const };
    if (monthlySavings > 0 && breakEvenMonths < 60)
      return { label: "May be worth reviewing", tone: "secondary" as const };
    if (monthlySavings > 0)
      return { label: "Needs closer review", tone: "warning" as const };
    if (cashOutBeforeCosts > 0 || includedDebts.length > 0)
      return { label: "Best for cash-out or consolidation", tone: "secondary" as const };
    return { label: "Costs may outweigh savings", tone: "coral" as const };
  })();

  const showDebts = goal === "Consolidate debt" || debtsExpanded;

  const onReset = () => {
    setGoal("Lower my monthly payment");
    setProvince("Ontario");
    setPropertyValue(900000);
    setCurrentBalance(500000);
    setCurrentRate(5.79);
    setCurrentPayment(3150);
    setRemainingAmort(22);
    setNewAmount(650000);
    setNewRate(4.99);
    setNewAmort(25);
    setFreq("Monthly");
    setDesiredCashOut(0);
    setPenalty(4500);
    setLegal(1200);
    setAppraisal(500);
    setTitleIns(400);
    setDischarge(350);
  };

  const onSave = () =>
    saveScenario({
      tool: "Refinance Savings Calculator",
      name: `${fmtMoney(newAmount)} · ${province} · ${goal}`,
      inputs: {
        goal, province, propertyValue, currentBalance, currentRate, currentPayment, remainingAmort,
        currentLender, maturityDate, rateType, termType,
        newAmount, newRate, newAmort, freq, desiredCashOut, ratePref,
        debts: includedDebts,
        penalty, penaltyKnown, legal, appraisal, titleIns, discharge, registration, adminFee, brokerFee, otherCosts,
      },
      outputs: {
        equity, currentLTV, newLTV, cashOutBeforeCosts, netCashOut, refinanceCosts,
        newPaymentMonthlyEq, monthlySavings, annualCashFlow, breakEvenMonths,
        signal: signal.label,
      },
    });

  return (
    <ToolPageShell
      title="Refinance Savings Calculator"
      subtitle="Estimate whether refinancing could lower your payment, consolidate debt, or unlock home equity."
      bestFor="existing homeowners"
    >
      <Disclaimer />

      <GoalSelector value={goal} onChange={setGoal} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        {/* Inputs */}
        <div className="space-y-4">
          {/* Current mortgage */}
          <Card title="Your current mortgage" subtitle="We compare your current payment against a refinance scenario.">
            <SelectField label="Province" value={province} onChange={setProvince} options={PROVINCES} />
            <NumField label="Estimated property value" prefix="$" step={1000} value={propertyValue} onChange={setPropertyValue} />
            <NumField label="Current mortgage balance" prefix="$" step={1000} value={currentBalance} onChange={setCurrentBalance} />
            <NumField label="Current mortgage rate" suffix="%" step={0.01} value={currentRate} onChange={setCurrentRate} />
            <NumField label="Current monthly payment" prefix="$" step={25} value={currentPayment} onChange={setCurrentPayment} />
            <NumField label="Remaining amortization (years)" step={1} value={remainingAmort} onChange={setRemainingAmort} />
            <SelectField label="Rate type" value={rateType} onChange={setRateType} options={RATE_TYPES} />
            <SelectField label="Term type" value={termType} onChange={setTermType} options={TERM_TYPES} />
            <TextField label="Current lender (optional)" value={currentLender} onChange={setCurrentLender} placeholder="e.g. RBC" />
            <TextField label="Maturity date (optional)" value={maturityDate} onChange={setMaturityDate} placeholder="YYYY-MM-DD" />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <MiniStat label="Estimated equity" value={fmtMoney(equity)} />
              <MiniStat label="Current LTV" value={fmtPct(currentLTV * 100)} />
            </div>
          </Card>

          {/* New scenario */}
          <Card title="New refinance scenario" subtitle="Adjust until the numbers reflect what you're considering.">
            <NumField
              label="New mortgage amount"
              prefix="$"
              step={1000}
              value={newAmount}
              onChange={setNewAmount}
              hint={
                showDebts
                  ? `Suggested: ${fmtMoney(suggestedNewAmount)} (current balance + selected debts + cash-out + costs)`
                  : undefined
              }
            />
            <NumField label="New estimated rate" suffix="%" step={0.01} value={newRate} onChange={setNewRate} />
            <NumField label="New amortization (years)" step={1} value={newAmort} onChange={setNewAmort} />
            <SelectField label="Payment frequency" value={freq} onChange={setFreq} options={PAYMENT_FREQS} />
            <NumField label="Desired cash-out (optional)" prefix="$" step={500} value={desiredCashOut} onChange={setDesiredCashOut} />
            <SelectField label="Rate type preference" value={ratePref} onChange={setRatePref} options={RATE_PREFS} />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <MiniStat label="Est. new payment" value={`${fmtMoney(newPaymentMonthlyEq)}/mo`} />
              <MiniStat label="New LTV" value={fmtPct(newLTV * 100)} tone={newLTV > 0.8 ? "warning" : "default"} />
            </div>
          </Card>

          {/* Debt consolidation */}
          <Card
            title="Debts to consolidate"
            subtitle="Add debts you may want to pay off through the refinance."
            right={
              <ToggleField
                label={showDebts ? "Included" : "Add debts"}
                value={showDebts}
                onChange={(v) => setDebtsExpanded(v)}
              />
            }
          >
            {showDebts ? (
              <div className="space-y-3">
                {debts.map((d, i) => (
                  <DebtRow
                    key={d.id}
                    debt={d}
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

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <MiniStat label="Selected debt balance" value={fmtMoney(totalDebtBalance)} />
                  <MiniStat label="Monthly payments removed" value={`${fmtMoney(totalDebtMonthly)}/mo`} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Turn this on to roll high-interest debts into your refinance.
              </p>
            )}
          </Card>

          {/* Cost assumptions */}
          <Accordion
            open={costsOpen}
            onToggle={() => setCostsOpen((o) => !o)}
            title="Estimated refinance costs"
            subtitle="Defaults are directional. Override with quotes if you have them."
          >
            <SelectField
              label="Do you know your prepayment penalty?"
              value={penaltyKnown}
              onChange={setPenaltyKnown}
              options={["Yes", "I'm not sure"] as const}
            />
            {penaltyKnown === "Yes" && (
              <NumField label="Prepayment penalty" prefix="$" step={50} value={penalty} onChange={setPenalty} />
            )}
            {penaltyKnown === "I'm not sure" && (
              <p className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                We've used a placeholder of $3,000. Confirm with your lender before deciding.
              </p>
            )}
            <NumField label="Legal fee" prefix="$" step={50} value={legal} onChange={setLegal} />
            <NumField label="Appraisal fee" prefix="$" step={25} value={appraisal} onChange={setAppraisal} />
            <NumField label="Title insurance" prefix="$" step={25} value={titleIns} onChange={setTitleIns} />
            <NumField label="Discharge fee" prefix="$" step={25} value={discharge} onChange={setDischarge} />
            <NumField label="Registration fee" prefix="$" step={25} value={registration} onChange={setRegistration} />
            <NumField label="Lender / admin fee" prefix="$" step={25} value={adminFee} onChange={setAdminFee} />
            <NumField label="Broker fee" prefix="$" step={25} value={brokerFee} onChange={setBrokerFee} />
            <NumField label="Other costs" prefix="$" step={25} value={otherCosts} onChange={setOtherCosts} />
          </Accordion>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <section className="lg:sticky lg:top-4 space-y-4">
            <Card title="Your refinance estimate">
              <ErrorList errors={errors} />
              {warnings.map((w, i) => (
                <p key={i} className="rounded-lg border border-secondary/30 bg-secondary/5 p-2 text-[11px] text-foreground">
                  {w}
                </p>
              ))}

              <SignalPill signal={signal} />

              <HeroResult
                label={monthlySavings >= 0 ? "Estimated monthly savings" : "Estimated monthly increase"}
                value={`${fmtMoney(Math.abs(monthlySavings))}/mo`}
                sub={
                  monthlySavings > 0
                    ? `Annual cash-flow change ${fmtMoney(annualCashFlow)}.`
                    : "Refinancing may still help if your goal is cash-out, renovation, or debt consolidation."
                }
              />

              <ResultRow label="Current monthly payment" value={fmtMoney(currentPayment)} />
              {showDebts && (
                <ResultRow label="Debt payments removed" value={`${fmtMoney(totalDebtMonthly)}/mo`} tone="mint" />
              )}
              <ResultRow label="Estimated new payment" value={`${fmtMoney(newPaymentMonthlyEq)}/mo`} tone="primary" />
              <ResultRow label="Cash-out before costs" value={fmtMoney(cashOutBeforeCosts)} />
              <ResultRow label="Estimated refinance costs" value={fmtMoney(refinanceCosts)} />
              <ResultRow label="Net cash-out after costs" value={fmtMoney(netCashOut)} tone={netCashOut >= 0 ? "mint" : "coral"} />
              <ResultRow label="New LTV" value={fmtPct(newLTV * 100)} tone={newLTV > 0.8 ? "coral" : "default"} />
              <ResultRow
                label="Break-even period"
                value={Number.isFinite(breakEvenMonths) ? `${breakEvenMonths.toFixed(1)} months` : "—"}
              />
            </Card>

            <Card title="Detailed breakdown">
              <Subhead>Payment comparison</Subhead>
              <ResultRow label="Current payment" value={`${fmtMoney(currentPayment)}/mo`} />
              <ResultRow label="New estimated payment" value={`${fmtMoney(newPaymentMonthlyEq)}/mo`} />
              <ResultRow label="Monthly difference" value={`${fmtMoney(currentPayment - newPaymentMonthlyEq)}/mo`} />
              <ResultRow label="Annual cash-flow difference" value={fmtMoney((currentPayment - newPaymentMonthlyEq) * 12)} />

              <Subhead>Equity & LTV</Subhead>
              <ResultRow label="Property value" value={fmtMoney(propertyValue)} />
              <ResultRow label="Current balance" value={fmtMoney(currentBalance)} />
              <ResultRow label="New mortgage amount" value={fmtMoney(newAmount)} />
              <ResultRow label="Estimated equity remaining" value={fmtMoney(Math.max(0, propertyValue - newAmount))} />
              <ResultRow label="New LTV" value={fmtPct(newLTV * 100)} />

              <Subhead>Cash-out</Subhead>
              <ResultRow label="Cash-out before costs" value={fmtMoney(cashOutBeforeCosts)} />
              <ResultRow label="Less refinance costs" value={`- ${fmtMoney(refinanceCosts)}`} />
              <ResultRow label="Net estimated proceeds" value={fmtMoney(netCashOut)} tone="primary" />

              {showDebts && (
                <>
                  <Subhead>Debt consolidation</Subhead>
                  <ResultRow label="Debts paid off" value={fmtMoney(totalDebtBalance)} />
                  <ResultRow label="Monthly debt payments removed" value={`${fmtMoney(totalDebtMonthly)}/mo`} />
                  <ResultRow
                    label="Net monthly cash-flow change"
                    value={`${fmtMoney(currentPayment + totalDebtMonthly - newPaymentMonthlyEq)}/mo`}
                    tone="primary"
                  />
                </>
              )}

              <Subhead>Break-even analysis</Subhead>
              <ResultRow label="Total refinance costs" value={fmtMoney(refinanceCosts)} />
              <ResultRow label="Monthly savings" value={`${fmtMoney(monthlySavings)}/mo`} />
              {monthlySavings > 0 ? (
                <ResultRow label="Break-even months" value={`${breakEvenMonths.toFixed(1)} months`} tone="primary" />
              ) : (
                <p className="mt-2 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                  Break-even does not apply because this scenario does not reduce monthly payments.
                </p>
              )}
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
                Start Refinance Snapshot
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
      This is an estimate only. Final numbers depend on lender approval, verified income, property value,
      mortgage terms, penalties, and closing costs.
    </p>
  );
}

function GoalSelector({ value, onChange }: { value: Goal; onChange: (v: Goal) => void }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your goal</p>
      <p className="mt-1 text-sm font-medium text-foreground">What is your main refinance goal?</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {GOALS.map((g) => {
          const active = value === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onChange(g)}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-foreground hover:border-primary/40"
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>
    </section>
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

function MiniStat({
  label, value, tone = "default",
}: { label: string; value: string; tone?: "default" | "warning" }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === "warning" ? "border-coral/40 bg-coral/5" : "border-border bg-muted/30"
      }`}
    >
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

function DebtRow({
  debt, onChange, onRemove,
}: { debt: Debt; onChange: (d: Debt) => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <ToggleField
          label={debt.include ? "Include in refinance" : "Excluded"}
          value={debt.include}
          onChange={(v) => onChange({ ...debt, include: v })}
        />
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-coral"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField label="Creditor" value={debt.creditor} onChange={(v) => onChange({ ...debt, creditor: v })} placeholder="e.g. Visa" />
        <SelectField
          label="Debt type"
          value={debt.type}
          onChange={(v) => onChange({ ...debt, type: v as Debt["type"] })}
          options={DEBT_TYPES}
        />
        <NumField label="Balance" prefix="$" step={100} value={debt.balance} onChange={(n) => onChange({ ...debt, balance: n })} />
        <NumField label="Monthly payment" prefix="$" step={10} value={debt.monthly} onChange={(n) => onChange({ ...debt, monthly: n })} />
        <NumField
          label="Interest rate (optional)"
          suffix="%"
          step={0.05}
          value={debt.rate ?? 0}
          onChange={(n) => onChange({ ...debt, rate: n || null })}
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
          This calculator compares your current mortgage payment and selected debts against a possible new
          refinance mortgage. It estimates your new payment, available equity, refinance costs, net cash-out,
          and possible monthly savings.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Estimated equity = property value − current mortgage balance</li>
          <li>New LTV = new mortgage amount ÷ property value</li>
          <li>Cash-out before costs = new mortgage amount − current mortgage balance</li>
          <li>Net cash-out = cash-out before costs − refinance costs</li>
          <li>Monthly savings = current payment + debt payments removed − new payment</li>
          <li>Break-even = refinance costs ÷ monthly savings</li>
        </ul>
        <p className="text-[11px]">
          Canadian mortgages compound semi-annually; payment estimates use that convention.
        </p>
      </div>
    </section>
  );
}
