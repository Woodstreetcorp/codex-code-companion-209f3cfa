import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Plus, Trash2, TrendingUp } from "lucide-react";
import {
  NumField, SelectField, ToolPageShell, fmtMoney, fmtPct, saveScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/home-equity")({
  head: () => ({
    meta: [
      { title: "Home Equity Calculator — approvU" },
      { name: "description", content: "Estimate your available equity based on property value and mortgage balances." },
    ],
  }),
  component: HomeEquityTool,
});

const PROVINCES = ["ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "NL", "PE", "YT", "NT", "NU"] as const;
const VALUE_SOURCES = ["Recent appraisal", "Market estimate", "Realtor estimate", "Purchase price", "Owner estimate", "Property tax assessment", "Not sure"] as const;
const USAGES = ["Owner-occupied", "Rental / investment", "Second home", "Owner-occupied with rental unit"] as const;
const TYPES = ["Detached", "Semi-detached", "Townhouse", "Condo", "Duplex / multi-unit", "Other"] as const;
const GOALS = [
  { value: "refinance", label: "Refinance / cash-out" },
  { value: "heloc", label: "HELOC planning" },
  { value: "consolidation", label: "Debt consolidation" },
  { value: "renovation", label: "Renovation" },
  { value: "investment", label: "Investment" },
  { value: "education", label: "Education" },
  { value: "emergency", label: "Emergency reserve" },
  { value: "second_property", label: "Buy another property" },
  { value: "exploring", label: "Just exploring" },
] as const;
type Goal = typeof GOALS[number]["value"];

const DEBT_TYPES = ["First mortgage", "Second mortgage", "HELOC", "Secured line of credit", "Private mortgage", "Other lien"] as const;

type Secured = {
  id: string;
  type: typeof DEBT_TYPES[number];
  balance: number;
  lender: string;
  rate: number;
  monthlyPayment: number;
  include: boolean;
};

const DEFAULT_SECURED: Secured[] = [
  { id: "s1", type: "First mortgage", balance: 500000, lender: "", rate: 4.99, monthlyPayment: 0, include: true },
  { id: "s2", type: "HELOC", balance: 20000, lender: "", rate: 7.45, monthlyPayment: 0, include: true },
];

const LTV_PRESETS = [
  { value: "65", label: "65% — HELOC planning" },
  { value: "80", label: "80% — refinance planning" },
  { value: "custom", label: "Custom LTV" },
  { value: "unsure", label: "Not sure" },
] as const;

function HomeEquityTool() {
  // Section 2 — goal
  const [goal, setGoal] = useState<Goal>("refinance");

  // Section 3 — property
  const [province, setProvince] = useState<typeof PROVINCES[number]>("ON");
  const [city, setCity] = useState("Toronto");
  const [propertyValue, setPropertyValue] = useState(900000);
  const [valueSource, setValueSource] = useState<typeof VALUE_SOURCES[number]>("Market estimate");
  const [usage, setUsage] = useState<typeof USAGES[number]>("Owner-occupied");
  const [propType, setPropType] = useState<typeof TYPES[number]>("Detached");

  // Section 4 — secured
  const [secured, setSecured] = useState<Secured[]>(DEFAULT_SECURED);

  // Section 5 — LTV
  const [ltvPreset, setLtvPreset] = useState<typeof LTV_PRESETS[number]["value"]>("80");
  const [customLtv, setCustomLtv] = useState(80);
  const [cashOut, setCashOut] = useState(100000);

  // Section 6 — costs
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [legal, setLegal] = useState(1200);
  const [appraisal, setAppraisal] = useState(500);
  const [titleIns, setTitleIns] = useState(400);
  const [discharge, setDischarge] = useState(400);
  const [adminFee, setAdminFee] = useState(0);
  const [brokerFee, setBrokerFee] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [includeCostsInMortgage, setIncludeCostsInMortgage] = useState(false);

  const targetLtvPct = ltvPreset === "custom" ? customLtv : ltvPreset === "unsure" ? 80 : parseFloat(ltvPreset);
  const totalCosts = legal + appraisal + titleIns + discharge + adminFee + brokerFee + otherCosts;

  const includedSecured = secured.filter(s => s.include);
  const totalSecured = includedSecured.reduce((s, d) => s + d.balance, 0);
  const currentEquity = Math.max(0, propertyValue - totalSecured);
  const currentLTV = propertyValue > 0 ? totalSecured / propertyValue : 0;
  const maxBorrowing = propertyValue * (targetLtvPct / 100);
  const availableBeforeCosts = Math.max(0, maxBorrowing - totalSecured);
  const netAvailable = Math.max(0, availableBeforeCosts - (includeCostsInMortgage ? 0 : totalCosts));
  const equityRemainingAfterCashOut = Math.max(0, availableBeforeCosts - cashOut);
  const cashOutExceeds = cashOut > netAvailable;
  const overLeveraged = totalSecured > propertyValue;

  const signal = overLeveraged
    ? { tone: "amber" as const, label: "Needs review" }
    : netAvailable >= 100000
    ? { tone: "mint" as const, label: "Strong equity available" }
    : netAvailable >= 25000
    ? { tone: "primary" as const, label: "Some equity may be available" }
    : netAvailable > 0
    ? { tone: "default" as const, label: "Limited equity available" }
    : { tone: "amber" as const, label: "No estimated equity available" };

  const updateSecured = (id: string, patch: Partial<Secured>) =>
    setSecured(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  const addSecured = () => setSecured(prev => [...prev, {
    id: `s${Date.now()}`, type: "Other lien", balance: 0, lender: "", rate: 0, monthlyPayment: 0, include: true,
  }]);
  const removeSecured = (id: string) => setSecured(prev => prev.filter(s => s.id !== id));

  const reset = () => {
    setGoal("refinance"); setProvince("ON"); setCity("Toronto"); setPropertyValue(900000);
    setValueSource("Market estimate"); setUsage("Owner-occupied"); setPropType("Detached");
    setSecured(DEFAULT_SECURED); setLtvPreset("80"); setCustomLtv(80); setCashOut(100000);
    setShowCostDetails(false); setLegal(1200); setAppraisal(500); setTitleIns(400);
    setDischarge(400); setAdminFee(0); setBrokerFee(0); setOtherCosts(0); setIncludeCostsInMortgage(false);
  };

  // Equity bar segments (% of property value)
  const segMortgage = propertyValue > 0 ? (totalSecured / propertyValue) * 100 : 0;
  const segAvailable = propertyValue > 0 ? (availableBeforeCosts / propertyValue) * 100 : 0;
  const segCushion = Math.max(0, 100 - segMortgage - segAvailable);

  return (
    <ToolPageShell
      title="Home Equity Calculator"
      subtitle="Estimate your available equity based on property value and mortgage balances."
      bestFor="refinance and HELOC planning"
      onReset={reset}
      onSave={() => saveScenario({
        tool: "Home Equity Calculator",
        name: `${fmtMoney(netAvailable)} available · LTV ${(currentLTV * 100).toFixed(0)}%`,
        inputs: { goal, propertyValue, secured, targetLtvPct, cashOut, totalCosts, includeCostsInMortgage },
        outputs: { currentEquity, currentLTV, maxBorrowing, availableBeforeCosts, netAvailable },
      })}
      primaryCta={{ label: "Start Refinance Snapshot", to: "/refinance" }}
      inputs={
        <div className="space-y-5">
          <Group title="What do you want to use your equity for?">
            <SelectField label="Equity goal" value={goal} onChange={setGoal} options={GOALS.map(g => ({ value: g.value, label: g.label }))} />
          </Group>

          <Group title="Your property">
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Province" value={province} onChange={setProvince} options={PROVINCES} />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-foreground">City / municipality</span>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </label>
            </div>
            <NumField label="Estimated property value" prefix="$" step={1000} value={propertyValue} onChange={setPropertyValue} />
            <SelectField label="How was the value estimated?" value={valueSource} onChange={setValueSource} options={VALUE_SOURCES} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Property usage" value={usage} onChange={setUsage} options={USAGES} />
              <SelectField label="Property type" value={propType} onChange={setPropType} options={TYPES} />
            </div>
          </Group>

          <Group title="Mortgages and secured balances">
            <p className="text-[11px] text-muted-foreground">Add all mortgages and secured loans registered against this property.</p>
            <div className="space-y-3">
              {secured.map((s) => (
                <div key={s.id} className={`rounded-xl border p-3 ${s.include ? "border-secondary/30 bg-secondary/5" : "border-border bg-background"}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{s.type}</span>
                    <button onClick={() => removeSecured(s.id)} className="text-muted-foreground hover:text-coral" aria-label="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField label="Type" value={s.type} onChange={(v) => updateSecured(s.id, { type: v })} options={DEBT_TYPES} />
                    <NumField label="Current balance" prefix="$" step={500} value={s.balance} onChange={(v) => updateSecured(s.id, { balance: v })} />
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-foreground">Lender (optional)</span>
                      <input value={s.lender} onChange={(e) => updateSecured(s.id, { lender: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                    </label>
                    <NumField label="Rate (optional)" suffix="%" step={0.01} value={s.rate} onChange={(v) => updateSecured(s.id, { rate: v })} />
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={s.include} onChange={(e) => updateSecured(s.id, { include: e.target.checked })} className="h-3.5 w-3.5 rounded border-input" />
                    <span className="text-foreground">Include in equity calculation</span>
                  </label>
                </div>
              ))}
            </div>
            <button onClick={addSecured} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-secondary/40 px-3 py-2 text-xs font-semibold text-secondary hover:bg-secondary/5">
              <Plus className="h-3.5 w-3.5" /> Add secured balance
            </button>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-[11px]">
              <div><span className="text-muted-foreground">Total secured</span><div className="text-sm font-semibold text-foreground">{fmtMoney(totalSecured)}</div></div>
              <div><span className="text-muted-foreground">Current LTV</span><div className="text-sm font-semibold text-foreground">{fmtPct(currentLTV * 100, 1)}</div></div>
            </div>
            {overLeveraged && <Note tone="amber">Secured balances appear higher than the property value. Double-check the property value and mortgage balances.</Note>}
          </Group>

          <Group title="Equity access assumptions">
            <SelectField label="Target maximum LTV" value={ltvPreset} onChange={setLtvPreset} options={LTV_PRESETS.map(p => ({ value: p.value, label: p.label }))} />
            {ltvPreset === "custom" && <NumField label="Custom LTV" suffix="%" step={1} value={customLtv} onChange={setCustomLtv} />}
            <NumField label="Desired cash-out (optional)" prefix="$" step={1000} value={cashOut} onChange={setCashOut} />
            {goal === "heloc" && (
              <Note tone="info">HELOC-style products use different limits and combined-LTV rules. This is only an estimate — confirm your lender's terms.</Note>
            )}
          </Group>

          <Group title="Estimated costs">
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
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 py-2 text-xs">
              <span className="text-foreground">Include costs in new mortgage?</span>
              <input type="checkbox" checked={includeCostsInMortgage} onChange={(e) => setIncludeCostsInMortgage(e.target.checked)} className="h-3.5 w-3.5" />
            </label>
            <div className="rounded-lg bg-muted/40 p-3 text-[11px]">
              <span className="text-muted-foreground">Total estimated costs</span>
              <div className="text-sm font-semibold text-foreground">{fmtMoney(totalCosts)}</div>
            </div>
          </Group>
        </div>
      }
      results={
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/80">Estimated net available equity</p>
            <p className="mt-1 text-3xl font-semibold">{fmtMoney(netAvailable)}</p>
            <p className="mt-1 text-xs text-primary-foreground/85">at {targetLtvPct}% target LTV · current LTV {fmtPct(currentLTV * 100, 1)}</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="mb-2 text-xs font-semibold text-foreground">Equity breakdown</p>
            {/* Equity bar */}
            <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="flex h-full">
                <div style={{ width: `${Math.min(100, segMortgage)}%` }} className="bg-primary" title="Mortgage balances" />
                <div style={{ width: `${Math.min(100, segAvailable)}%` }} className="bg-mint" title="Available equity room" />
                <div style={{ width: `${Math.min(100, segCushion)}%` }} className="bg-secondary/30" title="Equity cushion" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <Legend swatch="bg-primary" label="Mortgages" value={fmtMoney(totalSecured)} />
              <Legend swatch="bg-mint" label="Available room" value={fmtMoney(availableBeforeCosts)} />
              <Legend swatch="bg-secondary/30" label="Equity cushion" value={fmtMoney(Math.max(0, propertyValue - maxBorrowing))} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-sm">
            <Row label="Property value" value={fmtMoney(propertyValue)} />
            <Row label="Total secured balances" value={fmtMoney(totalSecured)} />
            <Row label="Current equity" value={fmtMoney(currentEquity)} />
            <Row label="Current LTV" value={fmtPct(currentLTV * 100, 1)} />
            <Row label={`Max borrowing @ ${targetLtvPct}%`} value={fmtMoney(maxBorrowing)} />
            <Row label="Available before costs" value={fmtMoney(availableBeforeCosts)} />
            <Row label="Estimated costs" value={fmtMoney(totalCosts)} />
            <Row label="Net available" value={fmtMoney(netAvailable)} strong />
            {cashOut > 0 && <Row label="Equity remaining after cash-out" value={fmtMoney(equityRemainingAfterCashOut)} />}
          </div>

          <SignalPill tone={signal.tone} label={signal.label} />

          {/* Insights */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground"><Info className="h-3.5 w-3.5 text-secondary" />What this could mean</p>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
              {netAvailable >= 25000 && <li>• You may have enough equity to explore a refinance, HELOC, or debt consolidation strategy.</li>}
              {netAvailable < 25000 && netAvailable > 0 && <li>• Limited equity available based on this estimate. A higher property value or lower mortgage balance could improve options.</li>}
              {cashOutExceeds && cashOut > 0 && <li className="text-amber-700 dark:text-amber-400">• Your desired cash-out ({fmtMoney(cashOut)}) is higher than the estimated net available ({fmtMoney(netAvailable)}).</li>}
              {currentLTV > targetLtvPct / 100 - 0.05 && <li>• Your current mortgage balance is close to the selected LTV limit, so additional borrowing may be limited.</li>}
              <li>• Final available equity may require an appraisal and full lender review.</li>
              <li>• HELOC and refinance limits vary by lender, product, and credit profile.</li>
            </ul>
          </div>

          {/* Related next steps */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 text-xs font-semibold text-foreground">Related next steps</p>
            <div className="flex flex-wrap gap-2">
              {(goal === "consolidation" || goal === "refinance") && (
                <Link to="/portal/tools/debt-consolidation" className="rounded-md border border-secondary/40 bg-secondary/5 px-3 py-1.5 text-[11px] font-semibold text-secondary hover:bg-secondary/10">
                  Open Debt Consolidation
                </Link>
              )}
              <Link to="/portal/tools/refinance-savings" className="rounded-md border border-secondary/40 bg-secondary/5 px-3 py-1.5 text-[11px] font-semibold text-secondary hover:bg-secondary/10">
                Open Refinance Savings
              </Link>
              <Link to="/portal/applications" className="rounded-md border border-input px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted">
                Use in my application
              </Link>
            </div>
          </div>
        </div>
      }
      explanation={
        <div className="space-y-2">
          <p>This calculator estimates your home equity by subtracting mortgages and secured balances registered against your property from the estimated property value, then estimates how much may be available based on your selected loan-to-value limit.</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Current equity = property value − total secured balances.</li>
            <li>Current LTV = total secured balances ÷ property value.</li>
            <li>Maximum borrowing = property value × target LTV.</li>
            <li>Available equity = maximum borrowing − total secured balances.</li>
            <li>Net available = available equity − estimated costs (when costs are not rolled into the mortgage).</li>
          </ul>
          <p className="text-amber-700 dark:text-amber-500">Lender approval, appraisal, credit, income, and product rules will determine your actual borrowing room.</p>
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

function Legend({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm ${swatch}`} />
      <div>
        <div className="font-medium text-foreground">{label}</div>
        <div className="text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}

function SignalPill({ tone, label }: { tone: "mint" | "primary" | "amber" | "default"; label: string }) {
  const cls = tone === "mint" ? "bg-mint/40 text-mint-foreground border-mint"
    : tone === "primary" ? "bg-secondary/15 text-secondary border-secondary/40"
    : tone === "amber" ? "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/40"
    : "bg-muted text-muted-foreground border-border";
  const Icon = tone === "mint" ? CheckCircle2 : tone === "amber" ? AlertTriangle : TrendingUp;
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
