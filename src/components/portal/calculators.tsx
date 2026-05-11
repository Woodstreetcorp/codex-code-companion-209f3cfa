import { useState } from "react";
import type { ToolKey } from "./data";

function fmt(n: number, frac = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: frac,
    minimumFractionDigits: frac,
  });
}

function monthlyPayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

function NumField({
  label,
  value,
  onChange,
  suffix,
  prefix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  prefix?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-primary">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

function ResultBlock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function CostLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function PaymentCalc() {
  const [price, setPrice] = useState(750000);
  const [down, setDown] = useState(150000);
  const [rate, setRate] = useState(5.25);
  const [amort, setAmort] = useState(25);
  const principal = Math.max(price - down, 0);
  const m = monthlyPayment(principal, rate, amort);
  const total = m * amort * 12;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Home price" value={price} onChange={setPrice} prefix="$" />
        <NumField label="Down payment" value={down} onChange={setDown} prefix="$" />
        <NumField label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.05} />
        <NumField label="Amortization (years)" value={amort} onChange={setAmort} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ResultBlock label="Monthly payment" value={fmt(m, 2)} accent />
        <ResultBlock label="Mortgage amount" value={fmt(principal)} />
        <ResultBlock label="Total paid" value={fmt(total)} />
      </div>
    </div>
  );
}

export function AffordabilityCalc() {
  const [income, setIncome] = useState(120000);
  const [debts, setDebts] = useState(500);
  const [down, setDown] = useState(80000);
  const [rate, setRate] = useState(5.25);
  const [taxes, setTaxes] = useState(450);
  const [heat, setHeat] = useState(150);
  const stressRate = rate + 2;
  const monthlyIncome = income / 12;
  const maxGDS = monthlyIncome * 0.39 - taxes - heat;
  const maxTDS = monthlyIncome * 0.44 - taxes - heat - debts;
  const maxPmt = Math.max(0, Math.min(maxGDS, maxTDS));
  const r = stressRate / 100 / 12;
  const n = 25 * 12;
  const maxLoan = r === 0 ? maxPmt * n : (maxPmt * (1 - Math.pow(1 + r, -n))) / r;
  const maxPrice = maxLoan + down;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Annual household income" value={income} onChange={setIncome} prefix="$" />
        <NumField label="Monthly debt payments" value={debts} onChange={setDebts} prefix="$" />
        <NumField label="Down payment" value={down} onChange={setDown} prefix="$" />
        <NumField label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.05} />
        <NumField label="Property tax (mo)" value={taxes} onChange={setTaxes} prefix="$" />
        <NumField label="Heating (mo)" value={heat} onChange={setHeat} prefix="$" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ResultBlock label="Max home price" value={fmt(maxPrice)} accent />
        <ResultBlock label="Stress-tested at" value={`${stressRate.toFixed(2)}%`} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Uses GDS 39% / TDS 44% with a +2% stress test as a guideline.
      </p>
    </div>
  );
}

export function RefinanceCalc() {
  const [balance, setBalance] = useState(420000);
  const [currentRate, setCurrentRate] = useState(6.1);
  const [newRate, setNewRate] = useState(4.95);
  const [years, setYears] = useState(20);
  const cur = monthlyPayment(balance, currentRate, years);
  const next = monthlyPayment(balance, newRate, years);
  const monthlySave = cur - next;
  const totalSave = monthlySave * years * 12;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Current balance" value={balance} onChange={setBalance} prefix="$" />
        <NumField label="Years remaining" value={years} onChange={setYears} />
        <NumField label="Current rate" value={currentRate} onChange={setCurrentRate} suffix="%" step={0.05} />
        <NumField label="New rate" value={newRate} onChange={setNewRate} suffix="%" step={0.05} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ResultBlock label="Monthly savings" value={fmt(monthlySave, 2)} accent />
        <ResultBlock label="New payment" value={fmt(next, 2)} />
        <ResultBlock label="Lifetime savings" value={fmt(totalSave)} />
      </div>
    </div>
  );
}

export function RenewalCalc() {
  const [balance, setBalance] = useState(380000);
  const [oldRate, setOldRate] = useState(2.49);
  const [newRate, setNewRate] = useState(5.15);
  const [years, setYears] = useState(20);
  const oldP = monthlyPayment(balance, oldRate, years);
  const newP = monthlyPayment(balance, newRate, years);
  const diff = newP - oldP;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Balance at renewal" value={balance} onChange={setBalance} prefix="$" />
        <NumField label="Years remaining" value={years} onChange={setYears} />
        <NumField label="Old rate" value={oldRate} onChange={setOldRate} suffix="%" step={0.05} />
        <NumField label="New rate" value={newRate} onChange={setNewRate} suffix="%" step={0.05} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ResultBlock label="New payment" value={fmt(newP, 2)} accent />
        <ResultBlock label="Old payment" value={fmt(oldP, 2)} />
        <ResultBlock label="Monthly change" value={fmt(diff, 2)} />
      </div>
    </div>
  );
}

export function EquityCalc() {
  const [value, setValue] = useState(900000);
  const [balance, setBalance] = useState(420000);
  const equity = Math.max(value - balance, 0);
  const accessible = Math.max(value * 0.8 - balance, 0);
  const ltv = value > 0 ? (balance / value) * 100 : 0;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Estimated home value" value={value} onChange={setValue} prefix="$" />
        <NumField label="Mortgage balance" value={balance} onChange={setBalance} prefix="$" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ResultBlock label="Total equity" value={fmt(equity)} accent />
        <ResultBlock label="Accessible (80% LTV)" value={fmt(accessible)} />
        <ResultBlock label="Current LTV" value={`${ltv.toFixed(1)}%`} />
      </div>
    </div>
  );
}

export function ClosingCalc() {
  const [price, setPrice] = useState(750000);
  const [firstTime, setFirstTime] = useState(false);
  const ontLTT = (p: number) => {
    let t = 0;
    const brackets: [number, number][] = [
      [55000, 0.005],
      [195000, 0.01],
      [150000, 0.015],
      [1600000, 0.02],
      [Infinity, 0.025],
    ];
    let rem = p;
    for (const [size, rate] of brackets) {
      const seg = Math.min(rem, size);
      t += seg * rate;
      rem -= seg;
      if (rem <= 0) break;
    }
    return t;
  };
  const ltt = ontLTT(price);
  const rebate = firstTime ? Math.min(ltt, 4000) : 0;
  const legal = 1800;
  const titleIns = 350;
  const inspection = 500;
  const appraisal = 400;
  const total = ltt - rebate + legal + titleIns + inspection + appraisal;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Purchase price" value={price} onChange={setPrice} prefix="$" />
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={firstTime}
            onChange={(e) => setFirstTime(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm text-foreground">First-time home buyer (ON)</span>
        </label>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ResultBlock label="Total estimated closing" value={fmt(total)} accent />
        <ResultBlock label="Land transfer tax" value={fmt(ltt - rebate)} />
      </div>
      <div className="mt-3 grid gap-2 rounded-2xl border border-border bg-background p-4 text-sm">
        <CostLine label="Land transfer tax" value={fmt(ltt)} />
        {rebate > 0 && <CostLine label="First-time buyer rebate" value={`− ${fmt(rebate)}`} />}
        <CostLine label="Legal fees" value={fmt(legal)} />
        <CostLine label="Title insurance" value={fmt(titleIns)} />
        <CostLine label="Home inspection" value={fmt(inspection)} />
        <CostLine label="Appraisal" value={fmt(appraisal)} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Estimates only. Ontario rates shown — actual closing costs vary by province and property.
      </p>
    </div>
  );
}

export const TOOL_COMPONENTS: Record<ToolKey, () => JSX.Element> = {
  payment: PaymentCalc,
  affordability: AffordabilityCalc,
  refinance: RefinanceCalc,
  renewal: RenewalCalc,
  equity: EquityCalc,
  closing: ClosingCalc,
};