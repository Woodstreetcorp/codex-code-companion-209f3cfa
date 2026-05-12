import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  HeroResult,
  NumField,
  PAYMENT_FREQS,
  PaymentFreq,
  ResultRow,
  SelectField,
  ToolPageShell,
  fmtMoney,
  fmtPct,
  monthlyEquivalent,
  periodicPayment,
  saveScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/renewal-comparison")({
  head: () => ({
    meta: [
      { title: "Renewal Comparison Tool — approvU" },
      {
        name: "description",
        content:
          "Compare your current renewal offer against possible mortgage options.",
      },
    ],
  }),
  component: RenewalComparisonToolPage,
});

// ─── Reference data ─────────────────────────────────────────────────────
const PROVINCES = [
  "Ontario", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Quebec",
  "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island",
  "Yukon", "Northwest Territories", "Nunavut",
] as const;

const RATE_TYPES = ["Fixed", "Variable", "Adjustable", "Not sure"] as const;
const TERM_TYPES = ["Open", "Closed", "Not sure"] as const;
const RENEWAL_TERMS = [0.5, 1, 2, 3, 4, 5, 7, 10] as const;
const YES_NO_MAYBE = ["Yes", "No", "Maybe"] as const;
const YES_NO_NS = ["Yes", "No", "Not sure"] as const;
const PURPOSES = [
  "Renovation", "Debt consolidation", "Investment", "Emergency fund",
  "Education", "Business", "Other",
] as const;

const GOALS = [
  "Lower my monthly payment",
  "Get a better rate",
  "Keep my mortgage simple",
  "Switch lenders",
  "Access home equity",
  "Consolidate debt",
  "Shorten my amortization",
  "Compare my options",
  "Not sure",
] as const;
type Goal = (typeof GOALS)[number];

function termLabel(t: number) {
  return t < 1 ? `${Math.round(t * 12)} months` : `${t} year${t === 1 ? "" : "s"}`;
}

// ─── Page ───────────────────────────────────────────────────────────────
function RenewalComparisonToolPage() {
  const [goal, setGoal] = useState<Goal>("Get a better rate");

  // Current mortgage
  const [province, setProvince] = useState<(typeof PROVINCES)[number]>("Ontario");
  const [currentLender, setCurrentLender] = useState("RBC");
  const [currentBalance, setCurrentBalance] = useState(520000);
  const [currentRate, setCurrentRate] = useState(5.79);
  const [currentPayment, setCurrentPayment] = useState(3250);
  const [remainingAmort, setRemainingAmort] = useState(22);
  const [currentFreq, setCurrentFreq] = useState<PaymentFreq>("Monthly");
  const [maturityDate, setMaturityDate] = useState("2026-09-01");
  const [currentRateType, setCurrentRateType] = useState<(typeof RATE_TYPES)[number]>("Fixed");
  const [currentTermType, setCurrentTermType] = useState<(typeof TERM_TYPES)[number]>("Closed");

  // Renewal offer
  const [renewalRate, setRenewalRate] = useState(5.24);
  const [renewalTerm, setRenewalTerm] = useState<number>(5);
  const [renewalRateType, setRenewalRateType] = useState<(typeof RATE_TYPES)[number]>("Fixed");
  const [renewalFreq, setRenewalFreq] = useState<PaymentFreq>("Monthly");
  const [renewalAmort, setRenewalAmort] = useState(22);
  const [renewalPaymentOverride, setRenewalPaymentOverride] = useState(0);
  const [offerExpiry, setOfferExpiry] = useState("");

  // Alternative
  const [altRate, setAltRate] = useState(4.89);
  const [altTerm, setAltTerm] = useState<number>(5);
  const [altRateType, setAltRateType] = useState<(typeof RATE_TYPES)[number]>("Fixed");
  const [altAmort, setAltAmort] = useState(22);
  const [altFreq, setAltFreq] = useState<PaymentFreq>("Monthly");

  // Switch / refinance
  const [switching, setSwitching] = useState<(typeof YES_NO_MAYBE)[number]>("Maybe");
  const [extraFunds, setExtraFunds] = useState<(typeof YES_NO_NS)[number]>("No");
  const [extraAmount, setExtraAmount] = useState(0);
  const [extraPurpose, setExtraPurpose] = useState<(typeof PURPOSES)[number]>("Renovation");
  const [appraisalReq, setAppraisalReq] = useState<(typeof YES_NO_NS)[number]>("Not sure");
  const [titleInsReq, setTitleInsReq] = useState<(typeof YES_NO_NS)[number]>("Not sure");

  // Costs
  const [costsOpen, setCostsOpen] = useState(false);
  const [legal, setLegal] = useState(900);
  const [appraisal, setAppraisal] = useState(300);
  const [titleIns, setTitleIns] = useState(300);
  const [discharge, setDischarge] = useState(350);
  const [registration, setRegistration] = useState(100);
  const [adminFee, setAdminFee] = useState(250);
  const [otherCosts, setOtherCosts] = useState(0);

  const switchCosts =
    legal + appraisal + titleIns + discharge + registration + adminFee + otherCosts;

  // Calculations
  const renewalBalance = currentBalance + (extraFunds === "Yes" ? extraAmount : 0);

  const renewalPaymentCalc = useMemo(
    () => periodicPayment(renewalBalance, renewalRate, renewalAmort, renewalFreq),
    [renewalBalance, renewalRate, renewalAmort, renewalFreq],
  );
  const renewalPaymentMonthlyEq =
    renewalPaymentOverride > 0
      ? renewalPaymentOverride
      : monthlyEquivalent(renewalPaymentCalc, renewalFreq);

  const altPaymentPeriodic = useMemo(
    () => periodicPayment(renewalBalance, altRate, altAmort, altFreq),
    [renewalBalance, altRate, altAmort, altFreq],
  );
  const altPaymentMonthlyEq = monthlyEquivalent(altPaymentPeriodic, altFreq);

  const monthlyDiffOfferVsCurrent = currentPayment - renewalPaymentMonthlyEq;
  const monthlyDiffAltVsOffer = renewalPaymentMonthlyEq - altPaymentMonthlyEq;

  const altTermMonths = Math.round(altTerm * 12);
  const termSavings = monthlyDiffAltVsOffer * altTermMonths;
  const breakEvenMonths =
    monthlyDiffAltVsOffer > 0 ? switchCosts / monthlyDiffAltVsOffer : Infinity;

  // Estimated interest over alt term (rough — using amortization)
  function interestOverTerm(balance: number, ratePct: number, amortYears: number, termYears: number, freq: PaymentFreq) {
    const ppy = freq === "Monthly" ? 12 : 12;
    const r = ratePct / 100 / ppy;
    const n = amortYears * ppy;
    const pmt =
      r === 0 ? balance / n : (balance * r) / (1 - Math.pow(1 + r, -n));
    let bal = balance;
    let interest = 0;
    const periods = Math.round(termYears * ppy);
    for (let i = 0; i < periods && bal > 0; i++) {
      const ip = bal * r;
      const pp = Math.min(pmt - ip, bal);
      interest += ip;
      bal -= pp;
    }
    return { interest, endingBalance: Math.max(0, bal) };
  }
  const offerTermInfo = interestOverTerm(renewalBalance, renewalRate, renewalAmort, renewalTerm, "Monthly");
  const altTermInfo = interestOverTerm(renewalBalance, altRate, altAmort, altTerm, "Monthly");
  const currentTermInfo = interestOverTerm(currentBalance, currentRate, remainingAmort, renewalTerm, "Monthly");

  // Months until maturity
  const monthsToMaturity = useMemo(() => {
    if (!maturityDate) return null;
    const m = new Date(maturityDate);
    if (Number.isNaN(m.getTime())) return null;
    const now = new Date();
    return Math.round((m.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
  }, [maturityDate]);

  // Validation
  const errors: string[] = [];
  if (currentBalance <= 0) errors.push("Please enter your current mortgage balance.");
  if (currentRate <= 0) errors.push("Please enter your current rate.");
  if (currentPayment <= 0) errors.push("Please enter your current monthly payment.");
  if (remainingAmort <= 0) errors.push("Please enter your remaining amortization.");
  if (renewalRate <= 0) errors.push("Please enter your renewal offer rate.");
  if (altRate <= 0) errors.push("Alternative rate must be greater than 0.");
  if (extraFunds === "Yes" && extraAmount < 0) errors.push("Additional funds cannot be negative.");

  const warnings: string[] = [];
  if (monthsToMaturity !== null && monthsToMaturity > 6)
    warnings.push("Your renewal maturity date appears to be far away. Renewal options may change before maturity.");
  if (offerExpiry) {
    const e = new Date(offerExpiry);
    const days = (e.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days >= 0 && days < 14) warnings.push("Your offer expiry date is coming soon.");
  }
  if (extraFunds === "Yes" && extraAmount > 0)
    warnings.push("Borrowing additional funds may require a refinance application.");
  if (switching === "Yes")
    warnings.push("Switching lenders may involve legal, appraisal, or discharge costs.");

  // Recommendation signal
  const signal = (() => {
    if (errors.length > 0) return { label: "Add a few details", tone: "muted" as const };
    if (extraFunds === "Yes" && extraAmount > 0)
      return { label: "Refinance may be worth reviewing", tone: "secondary" as const };
    const diff = monthlyDiffAltVsOffer;
    if (diff >= 100 && Number.isFinite(breakEvenMonths) && breakEvenMonths < 18)
      return { label: "Switch may save money", tone: "mint" as const };
    if (diff >= 25 && diff < 100)
      return { label: "Strong reason to compare", tone: "secondary" as const };
    if (diff < 25 && diff > -25)
      return { label: "Renewal offer may be reasonable", tone: "secondary" as const };
    if (diff <= -25)
      return { label: "Renewal offer looks competitive", tone: "mint" as const };
    return { label: "Needs closer review", tone: "warning" as const };
  })();

  const onReset = () => {
    setGoal("Get a better rate");
    setProvince("Ontario");
    setCurrentLender("RBC");
    setCurrentBalance(520000);
    setCurrentRate(5.79);
    setCurrentPayment(3250);
    setRemainingAmort(22);
    setCurrentFreq("Monthly");
    setMaturityDate("2026-09-01");
    setRenewalRate(5.24);
    setRenewalTerm(5);
    setRenewalAmort(22);
    setRenewalPaymentOverride(0);
    setAltRate(4.89);
    setAltTerm(5);
    setAltAmort(22);
    setSwitching("Maybe");
    setExtraFunds("No");
    setExtraAmount(0);
  };

  const onSave = () =>
    saveScenario({
      tool: "Renewal Comparison Tool",
      name: `${currentLender || "Renewal"} · ${fmtPct(renewalRate)} vs ${fmtPct(altRate)}`,
      inputs: {
        goal, province, currentLender, currentBalance, currentRate, currentPayment,
        remainingAmort, currentFreq, maturityDate, currentRateType, currentTermType,
        renewalRate, renewalTerm, renewalRateType, renewalFreq, renewalAmort,
        renewalPaymentOverride, offerExpiry,
        altRate, altTerm, altRateType, altAmort, altFreq,
        switching, extraFunds, extraAmount, extraPurpose, appraisalReq, titleInsReq,
        legal, appraisal, titleIns, discharge, registration, adminFee, otherCosts,
      },
      outputs: {
        renewalPaymentMonthlyEq, altPaymentMonthlyEq,
        monthlyDiffOfferVsCurrent, monthlyDiffAltVsOffer,
        termSavings, switchCosts, breakEvenMonths,
        signal: signal.label,
      },
    });

  const showRefinanceNote =
    goal === "Access home equity" || goal === "Consolidate debt" || extraFunds === "Yes";

  return (
    <ToolPageShell
      title="Renewal Comparison Tool"
      subtitle="Compare your current renewal offer against possible mortgage options."
      bestFor="upcoming mortgage renewals"
    >
      <Disclaimer />

      <GoalSelector value={goal} onChange={setGoal} />
      {showRefinanceNote && (
        <p className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-[11px] text-foreground">
          This may become a refinance, not a simple renewal. We'll estimate the impact and guide you.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        {/* Inputs */}
        <div className="space-y-4">
          <Card title="Your current mortgage" subtitle="Tell us about the mortgage that's coming up for renewal.">
            <SelectField label="Province" value={province} onChange={setProvince} options={PROVINCES} />
            <TextField label="Current lender" value={currentLender} onChange={setCurrentLender} placeholder="e.g. RBC" />
            <NumField label="Current mortgage balance" prefix="$" step={1000} value={currentBalance} onChange={setCurrentBalance} />
            <NumField label="Current interest rate" suffix="%" step={0.01} value={currentRate} onChange={setCurrentRate} />
            <NumField label="Current monthly payment" prefix="$" step={25} value={currentPayment} onChange={setCurrentPayment} />
            <NumField label="Remaining amortization (years)" step={1} value={remainingAmort} onChange={setRemainingAmort} />
            <SelectField label="Payment frequency" value={currentFreq} onChange={setCurrentFreq} options={PAYMENT_FREQS} />
            <TextField label="Maturity date" value={maturityDate} onChange={setMaturityDate} placeholder="YYYY-MM-DD" />
            <SelectField label="Current rate type" value={currentRateType} onChange={setCurrentRateType} options={RATE_TYPES} />
            <SelectField label="Current term type" value={currentTermType} onChange={setCurrentTermType} options={TERM_TYPES} />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <MiniStat label="Months to maturity" value={monthsToMaturity !== null ? `${monthsToMaturity} mo` : "—"} />
              <MiniStat label="Est. annual payment" value={fmtMoney(currentPayment * 12)} />
            </div>
          </Card>

          <Card title="Your renewal offer" subtitle="Enter the offer your current lender has presented.">
            <NumField label="Renewal offer rate" suffix="%" step={0.01} value={renewalRate} onChange={setRenewalRate} />
            <SelectField
              label="Renewal term"
              value={termLabel(renewalTerm)}
              onChange={(v) => {
                const t = RENEWAL_TERMS.find((x) => termLabel(x) === v);
                if (t !== undefined) setRenewalTerm(t);
              }}
              options={RENEWAL_TERMS.map(termLabel)}
            />
            <SelectField label="Renewal rate type" value={renewalRateType} onChange={setRenewalRateType} options={RATE_TYPES} />
            <SelectField label="Renewal payment frequency" value={renewalFreq} onChange={setRenewalFreq} options={PAYMENT_FREQS} />
            <NumField label="Renewal amortization (years)" step={1} value={renewalAmort} onChange={setRenewalAmort} />
            <NumField
              label="Renewal monthly payment (optional override)"
              prefix="$"
              step={25}
              value={renewalPaymentOverride}
              onChange={setRenewalPaymentOverride}
              hint={renewalPaymentOverride === 0 ? `Auto-estimated: ${fmtMoney(renewalPaymentMonthlyEq)}/mo` : undefined}
            />
            <TextField label="Offer expiry date (optional)" value={offerExpiry} onChange={setOfferExpiry} placeholder="YYYY-MM-DD" />
          </Card>

          <Card title="Alternative option" subtitle="Compare your lender's renewal offer against a possible alternative mortgage option.">
            <NumField label="Alternative rate" suffix="%" step={0.01} value={altRate} onChange={setAltRate} />
            <SelectField
              label="Alternative term"
              value={termLabel(altTerm)}
              onChange={(v) => {
                const t = RENEWAL_TERMS.find((x) => termLabel(x) === v);
                if (t !== undefined) setAltTerm(t);
              }}
              options={RENEWAL_TERMS.map(termLabel)}
            />
            <SelectField label="Alternative rate type" value={altRateType} onChange={setAltRateType} options={RATE_TYPES} />
            <NumField label="Alternative amortization (years)" step={1} value={altAmort} onChange={setAltAmort} />
            <SelectField label="Alternative payment frequency" value={altFreq} onChange={setAltFreq} options={PAYMENT_FREQS} />
            <SelectField label="Appraisal required?" value={appraisalReq} onChange={setAppraisalReq} options={YES_NO_NS} />
            <SelectField label="Title insurance required?" value={titleInsReq} onChange={setTitleInsReq} options={YES_NO_NS} />
            <button
              type="button"
              onClick={() => setAltRate(Math.max(0, currentRate - 0.9))}
              className="inline-flex items-center gap-1.5 rounded-md border border-secondary/40 bg-secondary/5 px-3 py-1.5 text-[11px] font-semibold text-secondary hover:bg-secondary/10"
            >
              Use sample alternative rate
            </button>
          </Card>

          <Card title="Switch or refinance details" subtitle="Help us shape the comparison around your situation.">
            <SelectField label="Are you considering switching lenders?" value={switching} onChange={setSwitching} options={YES_NO_MAYBE} />
            <SelectField label="Do you want to borrow additional funds at renewal?" value={extraFunds} onChange={setExtraFunds} options={YES_NO_NS} />
            {extraFunds === "Yes" && (
              <>
                <NumField label="Additional amount requested" prefix="$" step={1000} value={extraAmount} onChange={setExtraAmount} />
                <SelectField label="Purpose of funds" value={extraPurpose} onChange={setExtraPurpose} options={PURPOSES} />
                <p className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                  Borrowing additional funds may change this from a renewal/switch into a refinance and may require full underwriting.
                </p>
              </>
            )}
          </Card>

          <Accordion
            open={costsOpen}
            onToggle={() => setCostsOpen((o) => !o)}
            title="Estimated switch / refinance costs"
            subtitle="Provincial defaults — override with quotes if you have them."
          >
            <NumField label="Legal fee" prefix="$" step={50} value={legal} onChange={setLegal} />
            <NumField label="Appraisal fee" prefix="$" step={25} value={appraisal} onChange={setAppraisal} />
            <NumField label="Title insurance" prefix="$" step={25} value={titleIns} onChange={setTitleIns} />
            <NumField label="Discharge / assignment fee" prefix="$" step={25} value={discharge} onChange={setDischarge} />
            <NumField label="Registration fee" prefix="$" step={25} value={registration} onChange={setRegistration} />
            <NumField label="Lender / admin fee" prefix="$" step={25} value={adminFee} onChange={setAdminFee} />
            <NumField label="Other cost" prefix="$" step={25} value={otherCosts} onChange={setOtherCosts} />
          </Accordion>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <section className="lg:sticky lg:top-4 space-y-4">
            <Card title="Your renewal comparison">
              <ErrorList errors={errors} />
              {warnings.map((w, i) => (
                <p key={i} className="rounded-lg border border-secondary/30 bg-secondary/5 p-2 text-[11px] text-foreground">
                  {w}
                </p>
              ))}

              <SignalPill signal={signal} />

              <HeroResult
                label={monthlyDiffAltVsOffer >= 0 ? "Estimated monthly savings (alternative vs offer)" : "Alternative costs more"}
                value={`${fmtMoney(Math.abs(monthlyDiffAltVsOffer))}/mo`}
                sub={
                  Number.isFinite(breakEvenMonths) && monthlyDiffAltVsOffer > 0
                    ? `Break even on switch costs in about ${breakEvenMonths.toFixed(1)} months.`
                    : "Switching may not lower your payment — review features and flexibility too."
                }
              />

              <ResultRow label="Current payment" value={`${fmtMoney(currentPayment)}/mo`} />
              <ResultRow label="Renewal offer payment" value={`${fmtMoney(renewalPaymentMonthlyEq)}/mo`} />
              <ResultRow label="Alternative option payment" value={`${fmtMoney(altPaymentMonthlyEq)}/mo`} tone="primary" />
              <ResultRow label="Monthly difference (alt vs offer)" value={`${fmtMoney(monthlyDiffAltVsOffer)}/mo`} tone={monthlyDiffAltVsOffer >= 0 ? "mint" : "coral"} />
              <ResultRow label={`Estimated savings over ${termLabel(altTerm)}`} value={fmtMoney(termSavings)} tone={termSavings >= 0 ? "mint" : "coral"} />
              <ResultRow label="Estimated switch / refinance costs" value={fmtMoney(switchCosts)} />
              <ResultRow
                label="Break-even period"
                value={Number.isFinite(breakEvenMonths) ? `${breakEvenMonths.toFixed(1)} months` : "—"}
              />
            </Card>

            <Card title="Detailed comparison">
              <ComparisonTable
                rows={[
                  { label: "Interest rate", a: fmtPct(currentRate), b: fmtPct(renewalRate), c: fmtPct(altRate) },
                  { label: "Term", a: "—", b: termLabel(renewalTerm), c: termLabel(altTerm) },
                  { label: "Rate type", a: currentRateType, b: renewalRateType, c: altRateType },
                  { label: "Payment frequency", a: currentFreq, b: renewalFreq, c: altFreq },
                  { label: "Monthly payment", a: `${fmtMoney(currentPayment)}/mo`, b: `${fmtMoney(renewalPaymentMonthlyEq)}/mo`, c: `${fmtMoney(altPaymentMonthlyEq)}/mo` },
                  { label: `Est. interest over ${termLabel(altTerm)}`, a: fmtMoney(currentTermInfo.interest), b: fmtMoney(offerTermInfo.interest), c: fmtMoney(altTermInfo.interest) },
                  { label: "Est. balance at end of term", a: fmtMoney(currentTermInfo.endingBalance), b: fmtMoney(offerTermInfo.endingBalance), c: fmtMoney(altTermInfo.endingBalance) },
                  { label: "Estimated costs", a: "—", b: "$0 (stay)", c: fmtMoney(switchCosts) },
                  { label: "Flexibility", a: "Existing terms", b: "Same lender, simple", c: switching === "Yes" ? "New lender, may include features" : "Compare features" },
                ]}
              />
            </Card>

            <Card title="What this means">
              <RecommendationCopy
                monthlyDiffAltVsOffer={monthlyDiffAltVsOffer}
                breakEvenMonths={breakEvenMonths}
                extraFunds={extraFunds}
                extraAmount={extraAmount}
              />
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
                Start Renewal Review
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
      This is an estimate only. Final options depend on lender approval, verified income, property value,
      credit profile, mortgage terms, and market rates.
    </p>
  );
}

function GoalSelector({ value, onChange }: { value: Goal; onChange: (v: Goal) => void }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your goal</p>
      <p className="mt-1 text-sm font-medium text-foreground">What is your main renewal goal?</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
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

function ComparisonTable({ rows }: { rows: { label: string; a: string; b: string; c: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="py-2 pr-3 font-semibold"></th>
            <th className="py-2 pr-3 font-semibold">Current</th>
            <th className="py-2 pr-3 font-semibold">Renewal offer</th>
            <th className="py-2 pr-0 font-semibold text-primary">Alternative</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60">
              <td className="py-2 pr-3 text-muted-foreground">{r.label}</td>
              <td className="py-2 pr-3 text-foreground">{r.a}</td>
              <td className="py-2 pr-3 text-foreground">{r.b}</td>
              <td className="py-2 pr-0 font-semibold text-primary">{r.c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecommendationCopy({
  monthlyDiffAltVsOffer, breakEvenMonths, extraFunds, extraAmount,
}: {
  monthlyDiffAltVsOffer: number;
  breakEvenMonths: number;
  extraFunds: string;
  extraAmount: number;
}) {
  if (extraFunds === "Yes" && extraAmount > 0) {
    return (
      <p className="text-xs leading-relaxed text-foreground">
        Because you want to borrow additional funds, this may be treated as a refinance. A full review may be required —
        a renewal review with your approvU advisor can compare both paths.
      </p>
    );
  }
  if (monthlyDiffAltVsOffer >= 50) {
    return (
      <p className="text-xs leading-relaxed text-foreground">
        Your alternative option may reduce your payment by about <strong>{fmtMoney(monthlyDiffAltVsOffer)}/month</strong>.
        After estimated switching costs, you may break even in about <strong>{Number.isFinite(breakEvenMonths) ? `${breakEvenMonths.toFixed(0)} months` : "—"}</strong>.
        It may be worth getting a formal quote to compare.
      </p>
    );
  }
  if (monthlyDiffAltVsOffer > -50) {
    return (
      <p className="text-xs leading-relaxed text-foreground">
        Your current renewal offer appears close to the alternative option. You may still want to negotiate or compare
        features (prepayment privileges, portability, penalty calculation) before signing.
      </p>
    );
  }
  return (
    <p className="text-xs leading-relaxed text-foreground">
      The alternative option may not lower your payment, but it may still be useful if you want different features,
      a shorter amortization, or cash-out at renewal.
    </p>
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
          This tool estimates your renewal payment and compares it with a possible alternative mortgage option.
          It uses your mortgage balance, interest rate, amortization, payment frequency, and estimated switching costs.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Payment estimate = balance, rate, amortization, and payment frequency</li>
          <li>Monthly savings = renewal payment − alternative payment</li>
          <li>Term savings = monthly savings × number of months in term</li>
          <li>Break-even period = estimated switch costs ÷ monthly savings</li>
          <li>If borrowing extra funds, the comparison may become a refinance estimate</li>
        </ul>
        <p className="text-[11px]">
          Canadian mortgages compound semi-annually; payment estimates use that convention.
        </p>
      </div>
    </section>
  );
}
