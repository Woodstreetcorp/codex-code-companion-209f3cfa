import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Info, Plus, Trash2, Trophy, Lightbulb } from "lucide-react";
import {
  NumField, SelectField, ToolPageShell, fmtMoney, fmtPct, saveScenario,
  paymentsPerYear, periodicPayment, periodicRate, type PaymentFreq,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/scenario-compare")({
  head: () => ({
    meta: [
      { title: "Mortgage Scenario Compare — approvU" },
      { name: "description", content: "Compare up to three mortgage scenarios side by side." },
    ],
  }),
  component: ScenarioCompareTool,
});

const FREQS: PaymentFreq[] = ["Monthly", "Semi-monthly", "Bi-weekly", "Accelerated bi-weekly", "Weekly"];
const RATE_TYPES = ["Fixed", "Variable", "Adjustable"] as const;
const TERMS = [0.5, 1, 2, 3, 4, 5, 7, 10] as const;
const AMORTS = [20, 25, 30] as const;

type Scenario = {
  id: string;
  name: string;
  product: string;
  amount: number;
  rate: number;
  amort: number;
  termYears: number;
  rateType: typeof RATE_TYPES[number];
  freq: PaymentFreq;
  closingCosts: number;
  lenderFee: number;
  cashback: number;
  bundleValue: number;
  prepayFlex: string;
  notes: string;
};

const DEFAULT_SCENARIOS: Scenario[] = [
  { id: "a", name: "5-Year Fixed", product: "RBC", amount: 748000, rate: 4.89, amort: 25, termYears: 5, rateType: "Fixed", freq: "Monthly", closingCosts: 8500, lenderFee: 0, cashback: 0, bundleValue: 2350, prepayFlex: "15/15", notes: "" },
  { id: "b", name: "5-Year Variable", product: "Scotia", amount: 748000, rate: 4.69, amort: 25, termYears: 5, rateType: "Variable", freq: "Monthly", closingCosts: 8700, lenderFee: 0, cashback: 0, bundleValue: 2100, prepayFlex: "20/20", notes: "" },
  { id: "c", name: "30-Year Fixed", product: "MCAP", amount: 748000, rate: 5.09, amort: 30, termYears: 5, rateType: "Fixed", freq: "Monthly", closingCosts: 8900, lenderFee: 0, cashback: 0, bundleValue: 2500, prepayFlex: "15/15", notes: "" },
];

type Computed = {
  monthlyPayment: number;
  periodPayment: number;
  totalPaymentsTerm: number;
  interestOverTerm: number;
  endingBalance: number;
  netCost: number;
  upfrontCost: number;
};

function computeScenario(s: Scenario): Computed {
  const ppy = paymentsPerYear(s.freq);
  const periodPmt = periodicPayment(s.amount, s.rate, s.amort, s.freq);
  const monthlyPayment = (periodPmt * ppy) / 12;
  // amortize over term
  const r = periodicRate(s.rate, ppy);
  const periods = Math.round(ppy * s.termYears);
  let bal = s.amount;
  let interest = 0;
  for (let i = 0; i < periods && bal > 0; i++) {
    const ip = bal * r;
    const pp = Math.min(periodPmt - ip, bal);
    interest += ip;
    bal -= pp;
  }
  const totalPaymentsTerm = periodPmt * periods;
  const upfrontCost = s.closingCosts + s.lenderFee - s.cashback;
  const netCost = totalPaymentsTerm + s.closingCosts + s.lenderFee - s.cashback - s.bundleValue;
  return { monthlyPayment, periodPayment: periodPmt, totalPaymentsTerm, interestOverTerm: interest, endingBalance: Math.max(0, bal), netCost, upfrontCost };
}

const GOALS = [
  { value: "lowest_payment", label: "Lowest monthly payment" },
  { value: "lowest_rate", label: "Lowest rate" },
  { value: "lowest_interest", label: "Lowest total interest" },
  { value: "lowest_upfront", label: "Lowest upfront cost" },
  { value: "best_value", label: "Best overall value" },
  { value: "most_flex", label: "Most flexible features" },
  { value: "best_bundle", label: "Best Home Life Bundle" },
  { value: "not_sure", label: "I'm not sure" },
] as const;
type Goal = typeof GOALS[number]["value"];

function ScenarioCompareTool() {
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [goal, setGoal] = useState<Goal>("best_value");

  const computed = useMemo(() => scenarios.map(computeScenario), [scenarios]);

  const bestIdx = useMemo(() => ({
    payment: argMin(computed.map(c => c.monthlyPayment)),
    rate: argMin(scenarios.map(s => s.rate)),
    interest: argMin(computed.map(c => c.interestOverTerm)),
    upfront: argMin(computed.map(c => c.upfrontCost)),
    netCost: argMin(computed.map(c => c.netCost)),
    bundle: argMax(scenarios.map(s => s.bundleValue)),
  }), [scenarios, computed]);

  const goalRecommend: number = useMemo(() => {
    switch (goal) {
      case "lowest_payment": return bestIdx.payment;
      case "lowest_rate": return bestIdx.rate;
      case "lowest_interest": return bestIdx.interest;
      case "lowest_upfront": return bestIdx.upfront;
      case "best_value":
      case "not_sure":
      default: return bestIdx.netCost;
      case "most_flex": return argMax(scenarios.map(s => parseFlex(s.prepayFlex)));
      case "best_bundle": return bestIdx.bundle;
    }
  }, [goal, bestIdx, scenarios]);

  const update = (id: string, patch: Partial<Scenario>) =>
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  const addScenario = () => {
    if (scenarios.length >= 3) return;
    const base = scenarios[0];
    setScenarios(prev => [...prev, { ...base, id: `s${Date.now()}`, name: `Scenario ${String.fromCharCode(65 + prev.length)}` }]);
  };
  const removeScenario = (id: string) => {
    if (scenarios.length <= 2) return;
    setScenarios(prev => prev.filter(s => s.id !== id));
  };
  const reset = () => setScenarios(DEFAULT_SCENARIOS);

  const labels = scenarios.map((_, i) => `Scenario ${String.fromCharCode(65 + i)}`);

  return (
    <ToolPageShell
      title="Mortgage Scenario Compare"
      subtitle="Compare up to three mortgage scenarios side by side."
      bestFor="choosing between options"
      onReset={reset}
      onSave={() => saveScenario({
        tool: "Mortgage Scenario Compare",
        name: `${scenarios.length} scenarios · best net ${labels[bestIdx.netCost]}`,
        inputs: { scenarios, goal },
        outputs: { best: bestIdx, recommended: labels[goalRecommend] },
      })}
      primaryCta={{ label: "Start Mortgage Snapshot", to: "/pre-purchase" }}
      inputs={
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Scenario setup</p>
            <p className="text-[11px] text-muted-foreground">Compare up to 3 mortgage options. Edit each scenario below.</p>
            <SelectField label="What matters most to you?" value={goal} onChange={setGoal} options={GOALS.map(g => ({ value: g.value, label: g.label }))} />
          </div>

          {scenarios.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">{labels[i]}</span>
                {scenarios.length > 2 && (
                  <button onClick={() => removeScenario(s.id)} className="text-muted-foreground hover:text-coral" aria-label="Remove scenario">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-foreground">Scenario name</span>
                  <input value={s.name} onChange={(e) => update(s.id, { name: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-foreground">Product / lender (optional)</span>
                  <input value={s.product} onChange={(e) => update(s.id, { product: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Mortgage amount" prefix="$" step={1000} value={s.amount} onChange={(v) => update(s.id, { amount: v })} />
                  <NumField label="Interest rate" suffix="%" step={0.01} value={s.rate} onChange={(v) => update(s.id, { rate: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Amortization (yrs)" value={String(s.amort)} onChange={(v) => update(s.id, { amort: parseInt(v) })} options={[...AMORTS.map(String), "Custom"]} />
                  <SelectField label="Term (years)" value={String(s.termYears)} onChange={(v) => update(s.id, { termYears: parseFloat(v) })} options={TERMS.map(t => ({ value: String(t), label: t < 1 ? `${t * 12} months` : `${t} year${t === 1 ? "" : "s"}` }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Rate type" value={s.rateType} onChange={(v) => update(s.id, { rateType: v })} options={RATE_TYPES} />
                  <SelectField label="Payment frequency" value={s.freq} onChange={(v) => update(s.id, { freq: v })} options={FREQS} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Closing costs" prefix="$" step={100} value={s.closingCosts} onChange={(v) => update(s.id, { closingCosts: v })} />
                  <NumField label="Lender fee" prefix="$" step={50} value={s.lenderFee} onChange={(v) => update(s.id, { lenderFee: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Cashback / credit" prefix="$" step={100} value={s.cashback} onChange={(v) => update(s.id, { cashback: v })} />
                  <NumField label="Home Life Bundle value" prefix="$" step={50} value={s.bundleValue} onChange={(v) => update(s.id, { bundleValue: v })} />
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-foreground">Prepayment flexibility (e.g. 15/15)</span>
                  <input value={s.prepayFlex} onChange={(e) => update(s.id, { prepayFlex: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </label>
              </div>
            </div>
          ))}

          {scenarios.length < 3 && (
            <button onClick={addScenario} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-secondary/40 px-3 py-2 text-xs font-semibold text-secondary hover:bg-secondary/5">
              <Plus className="h-3.5 w-3.5" /> Add scenario
            </button>
          )}
        </div>
      }
      results={
        <div className="space-y-4">
          {/* Hero recommendation */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/80">
              <Trophy className="h-3.5 w-3.5" /> Recommended for your goal
            </p>
            <p className="mt-1 text-2xl font-semibold">{scenarios[goalRecommend]?.name}</p>
            <p className="mt-1 text-xs text-primary-foreground/85">
              {goalExplanation(goal, scenarios[goalRecommend], computed[goalRecommend])}
            </p>
          </div>

          {/* Best fit summary tiles */}
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">Best fit summary</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <BestTile label="Lowest monthly payment" name={scenarios[bestIdx.payment]?.name} value={fmtMoney(computed[bestIdx.payment]?.monthlyPayment ?? 0) + "/mo"} />
              <BestTile label="Lowest rate" name={scenarios[bestIdx.rate]?.name} value={fmtPct(scenarios[bestIdx.rate]?.rate ?? 0, 2)} />
              <BestTile label="Lowest interest over term" name={scenarios[bestIdx.interest]?.name} value={fmtMoney(computed[bestIdx.interest]?.interestOverTerm ?? 0)} />
              <BestTile label="Lowest upfront cost" name={scenarios[bestIdx.upfront]?.name} value={fmtMoney(computed[bestIdx.upfront]?.upfrontCost ?? 0)} />
              <BestTile label="Best net value" name={scenarios[bestIdx.netCost]?.name} value={fmtMoney(computed[bestIdx.netCost]?.netCost ?? 0)} />
              <BestTile label="Best Home Life Bundle" name={scenarios[bestIdx.bundle]?.name} value={fmtMoney(scenarios[bestIdx.bundle]?.bundleValue ?? 0)} />
            </div>
          </div>

          {/* Side-by-side table */}
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">Side-by-side comparison</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">Metric</th>
                    {scenarios.map((s, i) => (
                      <th key={s.id} className="py-2 pr-2 font-semibold text-foreground">
                        <div>{s.name}</div>
                        <div className="text-[10px] font-normal text-muted-foreground">{labels[i]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CmpRow label="Mortgage amount" values={scenarios.map(s => fmtMoney(s.amount))} />
                  <CmpRow label="Interest rate" values={scenarios.map(s => fmtPct(s.rate, 2))} bestIdx={bestIdx.rate} />
                  <CmpRow label="Rate type" values={scenarios.map(s => s.rateType)} />
                  <CmpRow label="Term" values={scenarios.map(s => `${s.termYears} yr`)} />
                  <CmpRow label="Amortization" values={scenarios.map(s => `${s.amort} yr`)} />
                  <CmpRow label="Payment freq." values={scenarios.map(s => s.freq)} />
                  <CmpRow label="Monthly payment" values={computed.map(c => fmtMoney(c.monthlyPayment))} bestIdx={bestIdx.payment} />
                  <CmpRow label="Payments over term" values={computed.map(c => fmtMoney(c.totalPaymentsTerm))} />
                  <CmpRow label="Interest over term" values={computed.map(c => fmtMoney(c.interestOverTerm))} bestIdx={bestIdx.interest} />
                  <CmpRow label="Balance at end of term" values={computed.map(c => fmtMoney(c.endingBalance))} />
                  <CmpRow label="Closing costs" values={scenarios.map(s => fmtMoney(s.closingCosts))} />
                  <CmpRow label="Lender fees" values={scenarios.map(s => fmtMoney(s.lenderFee))} />
                  <CmpRow label="Cashback / credits" values={scenarios.map(s => fmtMoney(s.cashback))} />
                  <CmpRow label="Bundle value" values={scenarios.map(s => fmtMoney(s.bundleValue))} bestIdx={bestIdx.bundle} />
                  <CmpRow label="Upfront cost" values={computed.map(c => fmtMoney(c.upfrontCost))} bestIdx={bestIdx.upfront} />
                  <CmpRow label="Net estimated cost" values={computed.map(c => fmtMoney(c.netCost))} bestIdx={bestIdx.netCost} strong />
                  <CmpRow label="Prepayment flex" values={scenarios.map(s => s.prepayFlex || "—")} />
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Highlights show the best value in each row. Best net value uses payments + costs − credits − bundle.</p>
          </div>

          {/* Cost breakdown per scenario */}
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">Cost breakdown per scenario</p>
            <div className="space-y-3">
              {scenarios.map((s, i) => (
                <details key={s.id} className="rounded-lg border border-border/60 bg-card p-3 text-[11px]" open={i === goalRecommend}>
                  <summary className="cursor-pointer font-semibold text-foreground">{s.name} — net {fmtMoney(computed[i].netCost)}</summary>
                  <div className="mt-2 space-y-1">
                    <Row label="Periodic payment" value={`${fmtMoney(computed[i].periodPayment)} / ${s.freq.toLowerCase()}`} />
                    <Row label="Monthly equivalent" value={fmtMoney(computed[i].monthlyPayment)} />
                    <Row label="Total payments over term" value={fmtMoney(computed[i].totalPaymentsTerm)} />
                    <Row label="Total interest over term" value={fmtMoney(computed[i].interestOverTerm)} />
                    <Row label="Ending balance" value={fmtMoney(computed[i].endingBalance)} />
                    <Row label="Closing + fees − credits" value={fmtMoney(computed[i].upfrontCost)} />
                    <Row label="Bundle benefit" value={`− ${fmtMoney(s.bundleValue)}`} />
                    <Row label="Net estimated cost" value={fmtMoney(computed[i].netCost)} strong />
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground"><Lightbulb className="h-3.5 w-3.5 text-secondary" />Scenario insights</p>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <li>• A lower rate doesn't always mean the lowest total cost.</li>
              <li>• Longer amortizations lower payments but increase long-term interest.</li>
              <li>• Cashback helps with upfront costs — compare against rate and fees.</li>
              <li>• Fixed rates provide payment stability; variable/adjustable rates can change.</li>
              <li>• Bundle value is a benefit estimate, not direct cash unless the offer says so.</li>
            </ul>
          </div>

          <Link to="/portal/applications" className="block text-center text-[11px] font-medium text-secondary hover:text-primary">
            Use selected scenario in my application →
          </Link>
        </div>
      }
      explanation={
        <div className="space-y-2">
          <p>This tool compares mortgage scenarios using mortgage amount, interest rate, amortization, term, payment frequency, fees, closing costs, and estimated benefits.</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Periodic payment is calculated from amount, rate, and amortization (Canadian semi-annual compounding).</li>
            <li>Total payments over term = payment × number of payments during the term.</li>
            <li>Interest over term = total payments over term − principal repaid during the term.</li>
            <li>Net estimated cost = payments + closing costs + fees − credits − bundle value.</li>
          </ul>
        </div>
      }
    />
  );
}

function argMin(arr: number[]) {
  let best = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] < arr[best]) best = i;
  return best;
}
function argMax(arr: number[]) {
  let best = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
  return best;
}
function parseFlex(s: string) {
  const m = s.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return 0;
  return parseInt(m[1]) + parseInt(m[2]);
}

function goalExplanation(goal: Goal, s: Scenario | undefined, c: Computed | undefined) {
  if (!s || !c) return "";
  switch (goal) {
    case "lowest_payment": return `${s.name} has the lowest monthly payment at ${fmtMoney(c.monthlyPayment)}.`;
    case "lowest_rate": return `${s.name} has the lowest rate at ${fmtPct(s.rate, 2)}.`;
    case "lowest_interest": return `${s.name} pays the least interest over the term (${fmtMoney(c.interestOverTerm)}).`;
    case "lowest_upfront": return `${s.name} has the lowest upfront cost at ${fmtMoney(c.upfrontCost)}.`;
    case "most_flex": return `${s.name} offers the strongest prepayment flexibility (${s.prepayFlex}).`;
    case "best_bundle": return `${s.name} has the highest Home Life Bundle value (${fmtMoney(s.bundleValue)}).`;
    case "best_value":
    case "not_sure":
    default: return `${s.name} has the best net estimated cost (${fmtMoney(c.netCost)}) when fees, credits, and bundle value are considered.`;
  }
}

function CmpRow({ label, values, bestIdx, strong }: { label: string; values: string[]; bestIdx?: number; strong?: boolean }) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-1.5 pr-2 text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`py-1.5 pr-2 ${strong ? "font-semibold" : ""} ${bestIdx === i ? "text-mint-foreground font-semibold" : "text-foreground"}`}>
          {bestIdx === i && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
          {v}
        </td>
      ))}
    </tr>
  );
}

function BestTile({ label, name, value }: { label: string; name?: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-semibold text-primary">{name ?? "—"}</div>
      <div className="text-[10px] text-muted-foreground">{value}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1 text-[11px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}
