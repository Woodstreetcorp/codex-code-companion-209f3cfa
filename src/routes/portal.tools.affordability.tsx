import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  HeroResult,
  NumField,
  PrefillFromAppButton,
  ResultRow,
  SelectField,
  ToolPageShell,
  fmtMoney,
  fmtPct,
  periodicPayment,
  saveScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/affordability")({
  head: () => ({
    meta: [
      { title: "Affordability Calculator — approvU" },
      { name: "description", content: "Estimate how much home you can afford based on income, debts, and down payment." },
    ],
  }),
  component: AffordabilityCalculator,
});

const DEFAULTS = {
  income: 95000,
  coIncome: 0,
  debts: 350,
  downPayment: 60000,
  tax: 4800,
  heat: 1200,
  condo: 0,
  rate: 5.25,
  amortYears: 25,
  band: "Prime (680+)" as "Prime+ (740+)" | "Prime (680+)" | "Near-prime (620-679)" | "Below 620",
};

const BANDS = ["Prime+ (740+)", "Prime (680+)", "Near-prime (620-679)", "Below 620"] as const;

function AffordabilityCalculator() {
  const [s, setS] = useState(DEFAULTS);
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));

  const calc = useMemo(() => {
    const grossMonthly = (s.income + s.coIncome) / 12;
    // GDS target 39%, TDS target 44% (CMHC standard).
    const gdsCap = grossMonthly * 0.39;
    const tdsCap = grossMonthly * 0.44 - s.debts;
    const housingCap = Math.max(0, Math.min(gdsCap, tdsCap));
    const monthlyTaxesHeatCondo = (s.tax + s.heat) / 12 + s.condo;
    const availableForMortgage = Math.max(0, housingCap - monthlyTaxesHeatCondo);
    // Solve for principal given monthly payment.
    const i = (Math.pow(1 + s.rate / 200, 1 / 6) - 1); // monthly rate, semi-annual compounding
    const n = s.amortYears * 12;
    const principal = i === 0 ? availableForMortgage * n : availableForMortgage * (1 - Math.pow(1 + i, -n)) / i;
    const purchase = principal + s.downPayment;
    const monthlyPmt = periodicPayment(principal, s.rate, s.amortYears, "Monthly");
    const dpPct = purchase > 0 ? (s.downPayment / purchase) * 100 : 0;
    const gds = grossMonthly > 0 ? ((monthlyPmt + monthlyTaxesHeatCondo) / grossMonthly) * 100 : 0;
    const tds = grossMonthly > 0 ? ((monthlyPmt + monthlyTaxesHeatCondo + s.debts) / grossMonthly) * 100 : 0;
    return { purchase, principal, monthlyPmt, dpPct, gds, tds };
  }, [s]);

  const note =
    s.band === "Below 620"
      ? "Credit below 620 may move you to alternative lending with stricter limits."
      : calc.dpPct < 5
      ? "Down payment is below the 5% minimum on the first $500K. You may need to add more."
      : "This is an estimate. Final affordability depends on lender review and product rules.";

  return (
    <ToolPageShell
      title="Affordability Calculator"
      subtitle="Estimate the home price you may be able to afford."
      bestFor="planning a purchase"
      onReset={() => setS(DEFAULTS)}
      onSave={() =>
        saveScenario({
          tool: "Affordability",
          name: `Up to ${fmtMoney(calc.purchase)} purchase`,
          inputs: s,
          outputs: { purchase: calc.purchase, gds: calc.gds, tds: calc.tds },
        })
      }
      primaryCta={{ label: "Create Mortgage Snapshot", to: "/pre-purchase" }}
      inputs={
        <>
          <PrefillFromAppButton onPrefill={(a) => setS({ ...s, rate: a.rate, amortYears: a.amortYears })} />
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Gross annual income" prefix="$" step={1000} value={s.income} onChange={(v) => set("income", v)} />
            <NumField label="Co-applicant income" prefix="$" step={1000} value={s.coIncome} onChange={(v) => set("coIncome", v)} />
          </div>
          <NumField label="Monthly debt payments" prefix="$" value={s.debts} onChange={(v) => set("debts", v)} hint="Loans, credit card minimums, support payments." />
          <NumField label="Down payment" prefix="$" step={1000} value={s.downPayment} onChange={(v) => set("downPayment", v)} />
          <div className="grid grid-cols-3 gap-3">
            <NumField label="Property tax / yr" prefix="$" value={s.tax} onChange={(v) => set("tax", v)} />
            <NumField label="Heating / yr" prefix="$" value={s.heat} onChange={(v) => set("heat", v)} />
            <NumField label="Condo fee / mo" prefix="$" value={s.condo} onChange={(v) => set("condo", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Interest rate" suffix="%" step={0.05} value={s.rate} onChange={(v) => set("rate", v)} />
            <NumField label="Amortization" suffix="years" value={s.amortYears} onChange={(v) => set("amortYears", v)} />
          </div>
          <SelectField label="Credit profile band" value={s.band} onChange={(v) => set("band", v)} options={BANDS as unknown as string[] as never} />
        </>
      }
      results={
        <>
          <HeroResult label="Estimated affordable purchase price" value={fmtMoney(calc.purchase)} sub={`Mortgage ≈ ${fmtMoney(calc.principal)}`} />
          <ResultRow label="Estimated monthly payment" value={fmtMoney(calc.monthlyPmt)} />
          <ResultRow label="Down payment %" value={fmtPct(calc.dpPct)} />
          <ResultRow label="GDS estimate (cap 39%)" value={fmtPct(calc.gds)} tone={calc.gds > 39 ? "coral" : "mint"} />
          <ResultRow label="TDS estimate (cap 44%)" value={fmtPct(calc.tds)} tone={calc.tds > 44 ? "coral" : "mint"} />
          <p className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">{note}</p>
        </>
      }
      explanation={
        <p>
          We cap your housing cost at 39% of gross monthly income (GDS) and your total debt at 44%
          (TDS), then back-solve the mortgage that fits, plus your down payment.
        </p>
      }
    />
  );
}