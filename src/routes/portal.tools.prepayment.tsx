import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, TrendingDown, Calendar } from "lucide-react";
import {
  NumField, SelectField, ToolPageShell, fmtMoney, saveScenario,
  periodicRate, paymentsPerYear, periodicPayment, type PaymentFreq,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/prepayment")({
  head: () => ({
    meta: [
      { title: "Mortgage Prepayment Calculator — approvU" },
      { name: "description", content: "Estimate how extra payments could reduce interest and shorten your mortgage." },
    ],
  }),
  component: PrepaymentTool,
});

const FREQS: PaymentFreq[] = ["Monthly", "Semi-monthly", "Bi-weekly", "Accelerated bi-weekly", "Weekly"];
const RATE_TYPES = ["Fixed", "Variable", "Adjustable", "Not sure"] as const;
const MORTGAGE_TYPES = ["Closed", "Open", "Not sure"] as const;
const STRATEGIES = [
  { value: "increase", label: "Increase my regular payment" },
  { value: "lump", label: "One-time lump-sum payment" },
  { value: "recurring", label: "Recurring extra payments" },
  { value: "annual", label: "Annual lump-sum payments" },
] as const;
type Strategy = typeof STRATEGIES[number]["value"];

type SimResult = { months: number; totalInterest: number; totalExtra: number; payoffDate: Date; yearly: { year: number; balance: number }[] };

function simulate({
  balance, ratePct, freq, regularPayment,
  extraPerPeriod = 0, lumpSum = 0, annualLump = 0, annualMonth = 1,
}: {
  balance: number; ratePct: number; freq: PaymentFreq; regularPayment: number;
  extraPerPeriod?: number; lumpSum?: number; annualLump?: number; annualMonth?: number;
}): SimResult {
  const ppy = paymentsPerYear(freq);
  const r = periodicRate(ratePct, ppy);
  let bal = balance;
  let interest = 0;
  let extras = 0;
  let periods = 0;
  const maxPeriods = ppy * 40;
  const yearly: { year: number; balance: number }[] = [{ year: 0, balance: bal }];
  // Apply lump sum at start (month 0)
  if (lumpSum > 0) { const apply = Math.min(lumpSum, bal); bal -= apply; extras += apply; }
  while (bal > 0.01 && periods < maxPeriods) {
    const ip = bal * r;
    interest += ip;
    let pp = Math.min(regularPayment - ip, bal);
    if (pp < 0) pp = 0; // payment can't cover interest — stop to avoid infinite
    bal -= pp;
    if (extraPerPeriod > 0 && bal > 0) {
      const ex = Math.min(extraPerPeriod, bal);
      bal -= ex; extras += ex;
    }
    periods++;
    // Annual lump on chosen month
    const monthsElapsed = (periods * 12) / ppy;
    if (annualLump > 0 && bal > 0) {
      const yearMark = Math.floor(monthsElapsed);
      const prevYearMark = Math.floor(((periods - 1) * 12) / ppy);
      // Trigger once per crossing of (year * 12 + annualMonth)
      for (let y = 1; y <= 40; y++) {
        const trigger = (y - 1) * 12 + annualMonth;
        if (yearMark >= trigger && prevYearMark < trigger) {
          const ex = Math.min(annualLump, bal);
          bal -= ex; extras += ex;
        }
      }
    }
    if (periods % ppy === 0) yearly.push({ year: periods / ppy, balance: bal });
    if (regularPayment - ip <= 0 && extraPerPeriod === 0 && annualLump === 0 && lumpSum === 0) break;
  }
  if (yearly[yearly.length - 1].balance !== bal) yearly.push({ year: periods / ppy, balance: bal });
  const months = (periods * 12) / ppy;
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + Math.round(months));
  return { months, totalInterest: interest, totalExtra: extras, payoffDate, yearly };
}

function fmtMonths(months: number) {
  if (!Number.isFinite(months) || months <= 0) return "—";
  const y = Math.floor(months / 12);
  const m = Math.round(months - y * 12);
  if (y === 0) return `${m} month${m === 1 ? "" : "s"}`;
  if (m === 0) return `${y} year${y === 1 ? "" : "s"}`;
  return `${y} yr ${m} mo`;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-CA", { month: "short", year: "numeric" });
}

function PrepaymentTool() {
  // Section 2 — current mortgage
  const [balance, setBalance] = useState(500000);
  const [rate, setRate] = useState(4.99);
  const [amortYears, setAmortYears] = useState(25);
  const [freq, setFreq] = useState<PaymentFreq>("Monthly");
  const [regularPayment, setRegularPayment] = useState(2900);
  const [termRemaining, setTermRemaining] = useState(4);
  const [rateType, setRateType] = useState<typeof RATE_TYPES[number]>("Fixed");
  const [mortgageType, setMortgageType] = useState<typeof MORTGAGE_TYPES[number]>("Closed");
  const [lender, setLender] = useState("");

  // Section 3 — strategy
  const [strategy, setStrategy] = useState<Strategy>("recurring");
  const [increaseAmt, setIncreaseAmt] = useState(200);
  const [increasePct, setIncreasePct] = useState(0);
  const [lumpAmount, setLumpAmount] = useState(10000);
  const [recurringExtra, setRecurringExtra] = useState(300);
  const [recurringFreq, setRecurringFreq] = useState<PaymentFreq>("Monthly");
  const [annualAmount, setAnnualAmount] = useState(5000);
  const [annualMonth, setAnnualMonth] = useState(1);

  // Section 4 — privilege
  const [knowsPrivilege, setKnowsPrivilege] = useState<"Yes" | "No" | "Not sure">("Yes");
  const [originalAmount, setOriginalAmount] = useState(550000);
  const [lumpPrivPct, setLumpPrivPct] = useState(15);
  const [increasePrivPct, setIncreasePrivPct] = useState(15);

  const suggestedPayment = useMemo(
    () => periodicPayment(balance, rate, amortYears, freq),
    [balance, rate, amortYears, freq],
  );
  const ppy = paymentsPerYear(freq);

  // Compute baseline & with-prepayment
  const baseline = useMemo(
    () => simulate({ balance, ratePct: rate, freq, regularPayment }),
    [balance, rate, freq, regularPayment],
  );

  const withPrep = useMemo(() => {
    let extraPerPeriod = 0;
    let lumpSum = 0;
    let annualLump = 0;
    let pmt = regularPayment;
    if (strategy === "increase") {
      const inc = increasePct > 0 ? regularPayment * (increasePct / 100) : increaseAmt;
      pmt = regularPayment + inc;
    } else if (strategy === "lump") {
      lumpSum = lumpAmount;
    } else if (strategy === "recurring") {
      // Convert recurring frequency to current payment-frequency periods (monthly equivalence)
      const recurringPpy = paymentsPerYear(recurringFreq);
      const annualExtra = recurringExtra * recurringPpy;
      extraPerPeriod = annualExtra / ppy;
    } else if (strategy === "annual") {
      annualLump = annualAmount;
    }
    return simulate({ balance, ratePct: rate, freq, regularPayment: pmt, extraPerPeriod, lumpSum, annualLump, annualMonth });
  }, [strategy, balance, rate, freq, regularPayment, increaseAmt, increasePct, lumpAmount, recurringExtra, recurringFreq, ppy, annualAmount, annualMonth]);

  const interestSaved = Math.max(0, baseline.totalInterest - withPrep.totalInterest);
  const monthsSaved = Math.max(0, baseline.months - withPrep.months);

  // Privilege check
  const annualExtraEstimate = useMemo(() => {
    if (strategy === "lump") return lumpAmount;
    if (strategy === "recurring") return recurringExtra * paymentsPerYear(recurringFreq);
    if (strategy === "annual") return annualAmount;
    if (strategy === "increase") {
      const inc = increasePct > 0 ? regularPayment * (increasePct / 100) : increaseAmt;
      return inc * ppy;
    }
    return 0;
  }, [strategy, lumpAmount, recurringExtra, recurringFreq, annualAmount, increaseAmt, increasePct, regularPayment, ppy]);

  const privilegeBase = knowsPrivilege === "Yes" ? originalAmount : originalAmount;
  const lumpPrivilegeDollar = privilegeBase * (lumpPrivPct / 100);
  const increasePrivilegeDollar = regularPayment * ppy * (increasePrivPct / 100);
  const exceedsLump = (strategy === "lump" || strategy === "annual" || strategy === "recurring") && annualExtraEstimate > lumpPrivilegeDollar;
  const exceedsIncrease = strategy === "increase" && annualExtraEstimate > increasePrivilegeDollar;
  const exceedsPrivilege = knowsPrivilege !== "No" && (exceedsLump || exceedsIncrease);

  const paymentTooLow = regularPayment < suggestedPayment * 0.85;

  const signal = monthsSaved > 60
    ? { tone: "mint" as const, label: "Strong interest savings" }
    : monthsSaved > 12
    ? { tone: "primary" as const, label: "Faster payoff potential" }
    : monthsSaved > 0
    ? { tone: "default" as const, label: "Small but helpful savings" }
    : { tone: "default" as const, label: "Check lender rules before proceeding" };

  const reset = () => {
    setBalance(500000); setRate(4.99); setAmortYears(25); setFreq("Monthly");
    setRegularPayment(2900); setTermRemaining(4); setRateType("Fixed"); setMortgageType("Closed");
    setStrategy("recurring"); setIncreaseAmt(200); setIncreasePct(0); setLumpAmount(10000);
    setRecurringExtra(300); setRecurringFreq("Monthly"); setAnnualAmount(5000); setAnnualMonth(1);
    setKnowsPrivilege("Yes"); setOriginalAmount(550000); setLumpPrivPct(15); setIncreasePrivPct(15);
  };

  const yearlyCompare = useMemo(() => {
    const max = Math.min(Math.max(baseline.yearly.length, withPrep.yearly.length), 11);
    return Array.from({ length: max }, (_, i) => ({
      year: i,
      baseBal: baseline.yearly[i]?.balance ?? 0,
      newBal: withPrep.yearly[i]?.balance ?? 0,
    })).filter((r, i) => i === 0 || r.baseBal > 0 || r.newBal > 0);
  }, [baseline, withPrep]);

  return (
    <ToolPageShell
      title="Mortgage Prepayment Calculator"
      subtitle="Estimate how extra payments could reduce interest and shorten your mortgage."
      bestFor="paying mortgage faster"
      onReset={reset}
      onSave={() => saveScenario({
        tool: "Mortgage Prepayment Calculator",
        name: `${fmtMoney(interestSaved)} saved · ${fmtMonths(monthsSaved)} faster`,
        inputs: { balance, rate, amortYears, freq, regularPayment, strategy, increaseAmt, increasePct, lumpAmount, recurringExtra, recurringFreq, annualAmount, annualMonth },
        outputs: { interestSaved, monthsSaved, newPayoff: withPrep.payoffDate.toISOString(), basePayoff: baseline.payoffDate.toISOString() },
      })}
      primaryCta={{ label: "Start Mortgage Snapshot", to: "/pre-purchase" }}
      inputs={
        <div className="space-y-5">
          {/* Section 2 */}
          <Group title="Your current mortgage">
            <NumField label="Current mortgage balance" prefix="$" step={1000} value={balance} onChange={setBalance} />
            <NumField label="Current interest rate" suffix="%" step={0.01} value={rate} onChange={setRate} />
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Remaining amortization (years)" step={1} value={amortYears} onChange={setAmortYears} />
              <NumField label="Term remaining (years)" step={1} value={termRemaining} onChange={setTermRemaining} />
            </div>
            <SelectField label="Payment frequency" value={freq} onChange={setFreq} options={FREQS} />
            <NumField
              label="Regular mortgage payment"
              prefix="$" step={50} value={regularPayment} onChange={setRegularPayment}
              hint={`Estimated payment for this balance & rate: ${fmtMoney(suggestedPayment)} per period.`}
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Rate type" value={rateType} onChange={setRateType} options={RATE_TYPES} />
              <SelectField label="Mortgage type" value={mortgageType} onChange={setMortgageType} options={MORTGAGE_TYPES} />
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground">Current lender (optional)</span>
              <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={lender} onChange={(e) => setLender(e.target.value)} placeholder="e.g. RBC, Scotia, MCAP…" />
            </label>
            {paymentTooLow && (
              <Note tone="amber">Your regular payment appears low for this balance and amortization. Double-check the amount before relying on this estimate.</Note>
            )}
          </Group>

          {/* Section 3 */}
          <Group title="Your prepayment plan">
            <SelectField label="How do you want to make extra payments?" value={strategy} onChange={(v) => setStrategy(v as Strategy)} options={STRATEGIES.map(s => ({ value: s.value, label: s.label }))} />
            {strategy === "increase" && (
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Increase by (amount)" prefix="$" step={25} value={increaseAmt} onChange={(v) => { setIncreaseAmt(v); setIncreasePct(0); }} />
                <NumField label="Or by percentage" suffix="%" step={1} value={increasePct} onChange={(v) => { setIncreasePct(v); }} />
              </div>
            )}
            {strategy === "lump" && (
              <NumField label="Lump-sum amount" prefix="$" step={500} value={lumpAmount} onChange={setLumpAmount} hint="Applied at the start of the simulation." />
            )}
            {strategy === "recurring" && (
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Extra payment amount" prefix="$" step={25} value={recurringExtra} onChange={setRecurringExtra} />
                <SelectField label="Extra payment frequency" value={recurringFreq} onChange={setRecurringFreq} options={["Monthly", "Bi-weekly", "Weekly", "Accelerated bi-weekly"] as PaymentFreq[]} />
              </div>
            )}
            {strategy === "annual" && (
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Annual lump-sum amount" prefix="$" step={500} value={annualAmount} onChange={setAnnualAmount} />
                <NumField label="Month of payment (1–12)" step={1} value={annualMonth} onChange={(v) => setAnnualMonth(Math.min(12, Math.max(1, Math.round(v))))} />
              </div>
            )}
          </Group>

          {/* Section 4 */}
          <Group title="Prepayment privilege check">
            <SelectField label="Do you know your lender's annual prepayment limit?" value={knowsPrivilege} onChange={setKnowsPrivilege} options={["Yes", "No", "Not sure"] as const} />
            <NumField label="Original mortgage amount" prefix="$" step={1000} value={originalAmount} onChange={setOriginalAmount} hint="Most lenders calculate the lump-sum limit from the original amount." />
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Annual lump-sum limit" suffix="%" step={1} value={lumpPrivPct} onChange={setLumpPrivPct} />
              <NumField label="Payment increase limit" suffix="%" step={1} value={increasePrivPct} onChange={setIncreasePrivPct} />
            </div>
            <p className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
              Estimated lump-sum allowance: <strong className="text-foreground">{fmtMoney(lumpPrivilegeDollar)}/yr</strong> · Payment-increase allowance: <strong className="text-foreground">{fmtMoney(increasePrivilegeDollar)}/yr</strong>
            </p>
            {exceedsPrivilege && (
              <Note tone="amber">
                Your planned extra payments (~{fmtMoney(annualExtraEstimate)}/yr) may exceed typical privilege limits. Confirm with your lender before proceeding to avoid penalties.
              </Note>
            )}
            {knowsPrivilege !== "Yes" && (
              <Note tone="info">
                Many lenders allow annual prepayments, but limits vary. Check your mortgage agreement before making a large extra payment.
              </Note>
            )}
          </Group>
        </div>
      }
      results={
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/75">Interest saved</p>
            <p className="mt-1 text-3xl font-semibold">{fmtMoney(interestSaved)}</p>
            <p className="mt-1 text-xs text-primary-foreground/80">Time saved: {fmtMonths(monthsSaved)}</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-sm">
            <Row label="New estimated payoff" value={fmtDate(withPrep.payoffDate)} strong />
            <Row label="Original payoff" value={fmtDate(baseline.payoffDate)} />
            <Row label="New remaining amortization" value={fmtMonths(withPrep.months)} />
            <Row label="Total extra payments made" value={fmtMoney(withPrep.totalExtra)} />
          </div>

          <SignalPill tone={signal.tone} label={signal.label} />

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">Savings breakdown</p>
            <CompareRow label="Interest remaining" base={fmtMoney(baseline.totalInterest)} prep={fmtMoney(withPrep.totalInterest)} />
            <CompareRow label="Time to payoff" base={fmtMonths(baseline.months)} prep={fmtMonths(withPrep.months)} />
            <CompareRow label="Total extra payments" base="$0" prep={fmtMoney(withPrep.totalExtra)} />
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs font-semibold text-foreground">Total interest saved</span>
              <span className="text-base font-semibold text-mint-foreground">{fmtMoney(interestSaved)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-secondary" />
              <p className="text-xs font-semibold text-foreground">Mortgage payoff timeline</p>
            </div>
            <div className="space-y-2 text-[11px]">
              <TimelineRow label="Today" value={fmtDate(new Date())} />
              <TimelineRow label="End of current term" value={fmtDate(new Date(new Date().setFullYear(new Date().getFullYear() + termRemaining)))} />
              <TimelineRow label="Original payoff date" value={fmtDate(baseline.payoffDate)} />
              <TimelineRow label="New payoff date" value={fmtDate(withPrep.payoffDate)} highlight />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border"><th className="py-1.5 pr-2 font-medium">Year</th><th className="py-1.5 pr-2 font-medium">Without</th><th className="py-1.5 pr-2 font-medium">With</th><th className="py-1.5 font-medium">Difference</th></tr>
                </thead>
                <tbody>
                  {yearlyCompare.slice(1).map((r) => (
                    <tr key={r.year} className="border-b border-border/50 last:border-0">
                      <td className="py-1.5 pr-2 font-medium text-foreground">Yr {r.year}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">{fmtMoney(r.baseBal)}</td>
                      <td className="py-1.5 pr-2 text-foreground">{fmtMoney(r.newBal)}</td>
                      <td className="py-1.5 text-mint-foreground">{fmtMoney(Math.max(0, r.baseBal - r.newBal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground"><Info className="h-3.5 w-3.5 text-secondary" />Before you make extra payments</p>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <li>• Check your lender's prepayment privileges before making large payments.</li>
              <li>• Closed mortgages may charge penalties if you exceed privilege limits.</li>
              <li>• Prepayments save interest because they reduce principal faster.</li>
              <li>• Paying down high-interest consumer debt first may sometimes be a better use of funds.</li>
              <li>• Keep an emergency fund before committing to large lump-sum payments.</li>
              <li>• Variable and fixed mortgages may have different penalty rules.</li>
            </ul>
          </div>

          <Link to="/portal/applications" className="block text-center text-[11px] font-medium text-secondary hover:text-primary">
            Use these numbers in my mortgage plan →
          </Link>
        </div>
      }
      explanation={
        <div className="space-y-2">
          <p>This calculator compares your mortgage payoff <strong>with</strong> and <strong>without</strong> extra payments. Extra payments reduce the principal balance faster, which lowers total interest and shortens the time to pay off the mortgage.</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Interest savings = baseline interest − interest with prepayments.</li>
            <li>Time saved = original payoff date − new payoff date.</li>
            <li>Balance is recalculated after each regular payment plus any extra payment for that period.</li>
            <li>Canadian mortgages compound semi-annually; we convert to your payment frequency.</li>
          </ul>
          <p className="text-amber-700 dark:text-amber-500">This estimate does not include prepayment penalties. Confirm your lender's terms before making large extra payments.</p>
        </div>
      }
    />
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}

function CompareRow({ label, base, prep }: { label: string; base: string; prep: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-border/40 py-1.5 text-[11px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-muted-foreground line-through">{base}</span>
      <span className="text-right font-semibold text-foreground">{prep}</span>
    </div>
  );
}

function TimelineRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-md px-2 py-1.5 ${highlight ? "bg-mint/30 text-foreground" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={highlight ? "font-semibold text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}

function SignalPill({ tone, label }: { tone: "mint" | "primary" | "default"; label: string }) {
  const cls = tone === "mint" ? "bg-mint/40 text-mint-foreground border-mint" : tone === "primary" ? "bg-secondary/15 text-secondary border-secondary/40" : "bg-muted text-muted-foreground border-border";
  const Icon = tone === "mint" ? CheckCircle2 : tone === "primary" ? TrendingDown : Info;
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
  );
}

function Note({ tone, children }: { tone: "amber" | "info"; children: React.ReactNode }) {
  const cls = tone === "amber"
    ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
    : "border-secondary/30 bg-secondary/5 text-foreground";
  const Icon = tone === "amber" ? AlertTriangle : Info;
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 text-[11px] leading-relaxed ${cls}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
