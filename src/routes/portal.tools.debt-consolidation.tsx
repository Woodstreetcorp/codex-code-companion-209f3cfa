import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Plus, Trash2, TrendingDown } from "lucide-react";
import {
  NumField, SelectField, ToolPageShell, fmtMoney, fmtPct, saveScenario,
  paymentsPerYear, periodicPayment, type PaymentFreq,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/debt-consolidation")({
  head: () => ({
    meta: [
      { title: "Debt Consolidation Calculator — approvU" },
      { name: "description", content: "See how consolidating debts through a refinance affects your monthly cash flow." },
    ],
  }),
  component: DebtConsolidationTool,
});

const PROVINCES = ["ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "NL", "PE", "YT", "NT", "NU"] as const;
const FREQS: PaymentFreq[] = ["Monthly", "Semi-monthly", "Bi-weekly", "Accelerated bi-weekly", "Weekly"];
const DEBT_TYPES = ["Credit card", "Line of credit", "Auto loan", "Personal loan", "Student loan", "Collection", "Tax debt", "Support payment", "Other"] as const;

type Debt = {
  id: string;
  creditor: string;
  type: typeof DEBT_TYPES[number];
  balance: number;
  monthlyPayment: number;
  rate: number;
  include: boolean;
};

const DEFAULT_DEBTS: Debt[] = [
  { id: "d1", creditor: "RBC Visa", type: "Credit card", balance: 18000, monthlyPayment: 540, rate: 19.99, include: true },
  { id: "d2", creditor: "TD Line of Credit", type: "Line of credit", balance: 25000, monthlyPayment: 350, rate: 9.99, include: true },
  { id: "d3", creditor: "Honda Finance", type: "Auto loan", balance: 22000, monthlyPayment: 480, rate: 7.99, include: true },
];

function DebtConsolidationTool() {
  // Section 2 — property/mortgage
  const [province, setProvince] = useState<typeof PROVINCES[number]>("ON");
  const [propertyValue, setPropertyValue] = useState(900000);
  const [currentBalance, setCurrentBalance] = useState(500000);
  const [currentRate, setCurrentRate] = useState(5.79);
  const [currentPayment, setCurrentPayment] = useState(3150);
  const [remainAmort, setRemainAmort] = useState(22);
  const [lender, setLender] = useState("");

  // Section 3 — debts
  const [debts, setDebts] = useState<Debt[]>(DEFAULT_DEBTS);

  // Section 4 — new refinance
  const [overrideAmount, setOverrideAmount] = useState<number | null>(null);
  const [newRate, setNewRate] = useState(4.99);
  const [newAmort, setNewAmort] = useState(25);
  const [newFreq, setNewFreq] = useState<PaymentFreq>("Monthly");
  const [includeCostsInMortgage, setIncludeCostsInMortgage] = useState(true);
  const [cashOut, setCashOut] = useState(0);

  // Section 5 — costs
  const [penaltyKnown, setPenaltyKnown] = useState<"Yes" | "Not sure">("Yes");
  const [penalty, setPenalty] = useState(4500);
  const [legal, setLegal] = useState(1200);
  const [appraisal, setAppraisal] = useState(500);
  const [titleIns, setTitleIns] = useState(400);
  const [discharge, setDischarge] = useState(500);
  const [adminFee, setAdminFee] = useState(0);
  const [brokerFee, setBrokerFee] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [showCostDetails, setShowCostDetails] = useState(false);

  // Section 8 — qualification
  const [grossIncome, setGrossIncome] = useState(0);
  const [coIncome, setCoIncome] = useState(0);
  const [otherDebts, setOtherDebts] = useState(0);

  const totalCosts = (penaltyKnown === "Yes" ? penalty : 0) + legal + appraisal + titleIns + discharge + adminFee + brokerFee + otherCosts;

  const selectedDebts = debts.filter(d => d.include);
  const selectedDebtTotal = selectedDebts.reduce((s, d) => s + d.balance, 0);
  const selectedDebtPayments = selectedDebts.reduce((s, d) => s + d.monthlyPayment, 0);
  const remainingDebtPayments = debts.filter(d => !d.include).reduce((s, d) => s + d.monthlyPayment, 0);
  const wAvgRate = selectedDebtTotal > 0
    ? selectedDebts.reduce((s, d) => s + d.rate * d.balance, 0) / selectedDebtTotal
    : 0;

  const suggestedAmount = currentBalance + selectedDebtTotal + (includeCostsInMortgage ? totalCosts : 0) + cashOut;
  const newMortgageAmount = overrideAmount ?? suggestedAmount;

  const newPaymentPeriodic = useMemo(
    () => periodicPayment(newMortgageAmount, newRate, newAmort, newFreq),
    [newMortgageAmount, newRate, newAmort, newFreq],
  );
  const newMonthlyPayment = (newPaymentPeriodic * paymentsPerYear(newFreq)) / 12;

  const currentLTV = propertyValue > 0 ? currentBalance / propertyValue : 0;
  const newLTV = propertyValue > 0 ? newMortgageAmount / propertyValue : 0;
  const equityRemaining = Math.max(0, propertyValue - newMortgageAmount);

  const monthlyBefore = currentPayment + selectedDebtPayments + remainingDebtPayments;
  const monthlyAfter = newMonthlyPayment + remainingDebtPayments;
  const cashFlowChange = monthlyBefore - monthlyAfter; // positive = improvement
  const annualChange = cashFlowChange * 12;
  const breakEvenMonths = cashFlowChange > 0 ? totalCosts / cashFlowChange : Infinity;

  const monthlyIncome = (grossIncome + coIncome) / 12;
  const tdsBefore = monthlyIncome > 0 ? (currentPayment + selectedDebtPayments + remainingDebtPayments + otherDebts) / monthlyIncome : null;
  const tdsAfter = monthlyIncome > 0 ? (newMonthlyPayment + remainingDebtPayments + otherDebts) / monthlyIncome : null;

  const highLtv = newLTV > 0.80;
  const veryHighLtv = newLTV > 0.80; // refinance hard cap
  const negCashFlow = cashFlowChange <= 0;

  const signal = veryHighLtv
    ? { tone: "amber" as const, label: "High LTV — lender review needed" }
    : negCashFlow
    ? { tone: "amber" as const, label: "Costs may outweigh monthly savings" }
    : breakEvenMonths > 36
    ? { tone: "default" as const, label: "May be worth reviewing" }
    : cashFlowChange > 500
    ? { tone: "mint" as const, label: "Strong monthly cash flow improvement" }
    : { tone: "primary" as const, label: "May be worth reviewing" };

  const updateDebt = (id: string, patch: Partial<Debt>) =>
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  const addDebt = () => setDebts(prev => [...prev, {
    id: `d${Date.now()}`, creditor: "", type: "Credit card", balance: 0, monthlyPayment: 0, rate: 0, include: true,
  }]);
  const removeDebt = (id: string) => setDebts(prev => prev.filter(d => d.id !== id));

  const reset = () => {
    setProvince("ON"); setPropertyValue(900000); setCurrentBalance(500000); setCurrentRate(5.79);
    setCurrentPayment(3150); setRemainAmort(22); setLender(""); setDebts(DEFAULT_DEBTS);
    setOverrideAmount(null); setNewRate(4.99); setNewAmort(25); setNewFreq("Monthly");
    setIncludeCostsInMortgage(true); setCashOut(0);
    setPenaltyKnown("Yes"); setPenalty(4500); setLegal(1200); setAppraisal(500); setTitleIns(400);
    setDischarge(500); setAdminFee(0); setBrokerFee(0); setOtherCosts(0);
    setGrossIncome(0); setCoIncome(0); setOtherDebts(0);
  };

  return (
    <ToolPageShell
      title="Debt Consolidation Calculator"
      subtitle="See how consolidating debts through a refinance affects your monthly cash flow."
      bestFor="reducing monthly obligations"
      onReset={reset}
      onSave={() => saveScenario({
        tool: "Debt Consolidation Calculator",
        name: `${cashFlowChange >= 0 ? "+" : ""}${fmtMoney(cashFlowChange)}/mo · LTV ${(newLTV * 100).toFixed(0)}%`,
        inputs: { propertyValue, currentBalance, currentRate, currentPayment, debts, newMortgageAmount, newRate, newAmort, totalCosts },
        outputs: { cashFlowChange, newMonthlyPayment, newLTV, breakEvenMonths, equityRemaining },
      })}
      primaryCta={{ label: "Start Refinance Snapshot", to: "/refinance" }}
      inputs={
        <div className="space-y-5">
          {/* Section 2 */}
          <Group title="Your property & mortgage">
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Province" value={province} onChange={setProvince} options={PROVINCES} />
              <NumField label="Estimated property value" prefix="$" step={1000} value={propertyValue} onChange={setPropertyValue} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Current mortgage balance" prefix="$" step={1000} value={currentBalance} onChange={setCurrentBalance} />
              <NumField label="Current mortgage rate" suffix="%" step={0.01} value={currentRate} onChange={setCurrentRate} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Current monthly mortgage payment" prefix="$" step={50} value={currentPayment} onChange={setCurrentPayment} />
              <NumField label="Remaining amortization (years)" step={1} value={remainAmort} onChange={setRemainAmort} />
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground">Current lender (optional)</span>
              <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={lender} onChange={(e) => setLender(e.target.value)} placeholder="e.g. RBC, Scotia, MCAP…" />
            </label>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-[11px]">
              <div><span className="text-muted-foreground">Current LTV</span><div className="text-sm font-semibold text-foreground">{fmtPct(currentLTV * 100, 1)}</div></div>
              <div><span className="text-muted-foreground">Estimated equity</span><div className="text-sm font-semibold text-foreground">{fmtMoney(Math.max(0, propertyValue - currentBalance))}</div></div>
            </div>
          </Group>

          {/* Section 3 */}
          <Group title="Debts you may want to pay off">
            <p className="text-[11px] text-muted-foreground">Add the debts you may want to consolidate into the refinance.</p>
            <div className="space-y-3">
              {debts.map((d) => (
                <div key={d.id} className={`rounded-xl border p-3 ${d.include ? "border-secondary/30 bg-secondary/5" : "border-border bg-background"}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <input
                      value={d.creditor}
                      onChange={(e) => updateDebt(d.id, { creditor: e.target.value })}
                      placeholder="Creditor name"
                      className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold text-foreground"
                    />
                    <button onClick={() => removeDebt(d.id)} className="text-muted-foreground hover:text-coral" aria-label="Remove debt">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField label="Type" value={d.type} onChange={(v) => updateDebt(d.id, { type: v })} options={DEBT_TYPES} />
                    <NumField label="Balance" prefix="$" step={100} value={d.balance} onChange={(v) => updateDebt(d.id, { balance: v })} />
                    <NumField label="Monthly payment" prefix="$" step={10} value={d.monthlyPayment} onChange={(v) => updateDebt(d.id, { monthlyPayment: v })} />
                    <NumField label="Rate (optional)" suffix="%" step={0.01} value={d.rate} onChange={(v) => updateDebt(d.id, { rate: v })} />
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={d.include} onChange={(e) => updateDebt(d.id, { include: e.target.checked })} className="h-3.5 w-3.5 rounded border-input" />
                    <span className="text-foreground">Include in consolidation</span>
                  </label>
                </div>
              ))}
            </div>
            <button onClick={addDebt} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-secondary/40 px-3 py-2 text-xs font-semibold text-secondary hover:bg-secondary/5">
              <Plus className="h-3.5 w-3.5" /> Add debt
            </button>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-[11px]">
              <div><span className="text-muted-foreground">Selected debt total</span><div className="text-sm font-semibold text-foreground">{fmtMoney(selectedDebtTotal)}</div></div>
              <div><span className="text-muted-foreground">Monthly payments removed</span><div className="text-sm font-semibold text-foreground">{fmtMoney(selectedDebtPayments)}</div></div>
              {wAvgRate > 0 && <div className="col-span-2"><span className="text-muted-foreground">Weighted avg debt rate</span><div className="text-sm font-semibold text-foreground">{fmtPct(wAvgRate, 2)}</div></div>}
            </div>
          </Group>

          {/* Section 4 */}
          <Group title="New refinance scenario">
            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
              Suggested new mortgage amount: <strong className="text-foreground">{fmtMoney(suggestedAmount)}</strong>
              <span className="ml-1">(current balance + selected debts {includeCostsInMortgage ? "+ costs " : ""}+ cash-out)</span>
            </div>
            <NumField
              label="New mortgage amount"
              prefix="$" step={1000}
              value={overrideAmount ?? suggestedAmount}
              onChange={(v) => setOverrideAmount(v)}
              hint={overrideAmount !== null ? "You're overriding the suggested amount." : "Edit to override the suggested amount."}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumField label="New mortgage rate" suffix="%" step={0.01} value={newRate} onChange={setNewRate} />
              <NumField label="New amortization (years)" step={1} value={newAmort} onChange={setNewAmort} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Payment frequency" value={newFreq} onChange={setNewFreq} options={FREQS} />
              <NumField label="Additional cash-out (optional)" prefix="$" step={500} value={cashOut} onChange={setCashOut} />
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 py-2 text-xs">
              <span className="text-foreground">Include refinance costs in mortgage?</span>
              <input type="checkbox" checked={includeCostsInMortgage} onChange={(e) => setIncludeCostsInMortgage(e.target.checked)} className="h-3.5 w-3.5" />
            </label>
            {highLtv && (
              <Note tone="amber">Your requested refinance amount may exceed typical refinance LTV limits (~80%). Lender review will be required.</Note>
            )}
          </Group>

          {/* Section 5 */}
          <Group title="Estimated refinance costs">
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Do you know the prepayment penalty?" value={penaltyKnown} onChange={setPenaltyKnown} options={["Yes", "Not sure"] as const} />
              {penaltyKnown === "Yes" && <NumField label="Prepayment penalty" prefix="$" step={100} value={penalty} onChange={setPenalty} />}
            </div>
            {penaltyKnown === "Not sure" && (
              <Note tone="amber">Your actual prepayment penalty can significantly affect whether this refinance makes sense. Confirm this amount with your current lender before deciding.</Note>
            )}
            <button onClick={() => setShowCostDetails(s => !s)} className="text-[11px] font-semibold text-secondary hover:text-primary">
              {showCostDetails ? "Hide" : "Show"} advanced cost assumptions
            </button>
            {showCostDetails && (
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Legal fee" prefix="$" step={50} value={legal} onChange={setLegal} />
                <NumField label="Appraisal" prefix="$" step={50} value={appraisal} onChange={setAppraisal} />
                <NumField label="Title insurance" prefix="$" step={50} value={titleIns} onChange={setTitleIns} />
                <NumField label="Discharge / registration" prefix="$" step={50} value={discharge} onChange={setDischarge} />
                <NumField label="Lender / admin fee" prefix="$" step={50} value={adminFee} onChange={setAdminFee} />
                <NumField label="Broker fee (if any)" prefix="$" step={50} value={brokerFee} onChange={setBrokerFee} />
                <NumField label="Other costs" prefix="$" step={50} value={otherCosts} onChange={setOtherCosts} />
              </div>
            )}
            <div className="rounded-lg bg-muted/40 p-3 text-[11px]">
              <span className="text-muted-foreground">Total estimated refinance costs</span>
              <div className="text-sm font-semibold text-foreground">{fmtMoney(totalCosts)}</div>
            </div>
          </Group>

          {/* Section 8 — qualification */}
          <Group title="Qualification impact (optional)">
            <p className="text-[11px] text-muted-foreground">Add income to estimate how this refinance may affect your TDS ratio.</p>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Gross annual income" prefix="$" step={1000} value={grossIncome} onChange={setGrossIncome} />
              <NumField label="Co-applicant income" prefix="$" step={1000} value={coIncome} onChange={setCoIncome} />
            </div>
            <NumField label="Other monthly debts not consolidated" prefix="$" step={50} value={otherDebts} onChange={setOtherDebts} />
            {monthlyIncome === 0 && <p className="text-[11px] text-muted-foreground">Add income to estimate qualification impact.</p>}
          </Group>
        </div>
      }
      results={
        <div className="space-y-4">
          <div className={`rounded-2xl p-5 text-primary-foreground ${cashFlowChange >= 0 ? "bg-gradient-to-br from-primary to-secondary" : "bg-gradient-to-br from-amber-600 to-amber-500"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/80">Estimated monthly cash flow change</p>
            <p className="mt-1 text-3xl font-semibold">{cashFlowChange >= 0 ? "+" : ""}{fmtMoney(cashFlowChange)}/mo</p>
            <p className="mt-1 text-xs text-primary-foreground/85">Annual change: {cashFlowChange >= 0 ? "+" : ""}{fmtMoney(annualChange)}</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-sm">
            <Row label="Current mortgage payment" value={fmtMoney(currentPayment) + "/mo"} />
            <Row label="Selected debt payments" value={fmtMoney(selectedDebtPayments) + "/mo"} />
            <Row label="New estimated mortgage payment" value={fmtMoney(newMonthlyPayment) + "/mo"} strong />
            <Row label="New mortgage amount" value={fmtMoney(newMortgageAmount)} />
            <Row label="New LTV" value={fmtPct(newLTV * 100, 1)} />
            <Row label="Estimated refinance costs" value={fmtMoney(totalCosts)} />
            <Row label="Break-even period" value={Number.isFinite(breakEvenMonths) ? `${breakEvenMonths.toFixed(1)} months` : "—"} />
          </div>

          <SignalPill tone={signal.tone} label={signal.label} />

          {/* Breakdown */}
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">Before vs after consolidation</p>
            <div className="grid grid-cols-3 gap-2 border-b border-border/50 py-1.5 text-[11px] font-medium text-muted-foreground">
              <span>Item</span><span className="text-right">Before</span><span className="text-right">After</span>
            </div>
            <CompareRow label="Mortgage payment" before={fmtMoney(currentPayment)} after={fmtMoney(newMonthlyPayment)} />
            <CompareRow label="Consolidated debt pmts" before={fmtMoney(selectedDebtPayments)} after="$0" />
            <CompareRow label="Other debt payments" before={fmtMoney(remainingDebtPayments)} after={fmtMoney(remainingDebtPayments)} />
            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-2 text-xs">
              <span className="font-semibold text-foreground">Total monthly</span>
              <span className="text-right text-muted-foreground">{fmtMoney(monthlyBefore)}</span>
              <span className="text-right font-semibold text-primary">{fmtMoney(monthlyAfter)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">Equity & LTV</p>
            <Row label="Property value" value={fmtMoney(propertyValue)} />
            <Row label="Current mortgage balance" value={fmtMoney(currentBalance)} />
            <Row label="New mortgage amount" value={fmtMoney(newMortgageAmount)} />
            <Row label="New LTV" value={fmtPct(newLTV * 100, 1)} strong />
            <Row label="Estimated equity remaining" value={fmtMoney(equityRemaining)} />
          </div>

          {monthlyIncome > 0 && tdsBefore !== null && tdsAfter !== null && (
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="mb-3 text-xs font-semibold text-foreground">Possible qualification impact</p>
              <Row label="Estimated TDS before" value={fmtPct(tdsBefore * 100, 1)} />
              <Row label="Estimated TDS after" value={fmtPct(tdsAfter * 100, 1)} strong />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {tdsAfter < tdsBefore ? "Removing monthly debt payments may improve your TDS ratio." : "The new mortgage payment may increase your TDS ratio. Lender review needed."}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground"><Info className="h-3.5 w-3.5 text-secondary" />Before you consolidate</p>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <li>• Lower monthly payments may increase total interest over time.</li>
              <li>• Refinance costs and penalties can reduce real savings.</li>
              <li>• Lender approval depends on property value, income, credit, and documents.</li>
              <li>• Some debts may need to be paid directly at closing.</li>
              <li>• Avoid rebuilding high-interest debt after consolidation.</li>
              <li className="text-foreground">+ Can simplify monthly payments and reduce cash flow pressure.</li>
              <li className="text-foreground">+ May improve qualification if monthly debt obligations are removed.</li>
            </ul>
          </div>

          <Link to="/portal/applications" className="block text-center text-[11px] font-medium text-secondary hover:text-primary">
            Use these numbers in my application →
          </Link>
        </div>
      }
      explanation={
        <div className="space-y-2">
          <p>This calculator compares your current mortgage and selected debt payments against a possible new refinance mortgage. It estimates your new mortgage amount, new payment, loan-to-value, refinance costs, and monthly cash flow change.</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Selected debt total = sum of debts marked for consolidation.</li>
            <li>Suggested new mortgage = current balance + selected debts + costs (if rolled in) + cash-out.</li>
            <li>New LTV = new mortgage amount ÷ property value.</li>
            <li>Monthly cash flow change = (current mortgage payment + selected debt payments) − new mortgage payment.</li>
            <li>Break-even = refinance costs ÷ monthly cash flow improvement.</li>
          </ul>
          <p className="text-amber-700 dark:text-amber-500">Consolidating unsecured debt into a mortgage can lower payments today but may increase total interest paid over time. Confirm penalties and lender terms before deciding.</p>
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

function CompareRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-border/40 py-1.5 text-[11px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-muted-foreground">{before}</span>
      <span className="text-right font-semibold text-foreground">{after}</span>
    </div>
  );
}

function SignalPill({ tone, label }: { tone: "mint" | "primary" | "amber" | "default"; label: string }) {
  const cls = tone === "mint" ? "bg-mint/40 text-mint-foreground border-mint"
    : tone === "primary" ? "bg-secondary/15 text-secondary border-secondary/40"
    : tone === "amber" ? "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/40"
    : "bg-muted text-muted-foreground border-border";
  const Icon = tone === "mint" ? CheckCircle2 : tone === "amber" ? AlertTriangle : TrendingDown;
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
