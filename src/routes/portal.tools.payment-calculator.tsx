import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  ACTIVE_APPS,
  HeroResult,
  NumField,
  PAYMENT_FREQS,
  PrefillFromAppButton,
  ResultRow,
  SelectField,
  ToolPageShell,
  amortize,
  fmtMoney,
  monthlyEquivalent,
  periodicPayment,
  saveScenario,
  type PaymentFreq,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/payment-calculator")({
  validateSearch: z.object({ prefill: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Mortgage Payment Calculator — approvU" },
      { name: "description", content: "Estimate your mortgage payment for any rate, term, and amortization." },
    ],
  }),
  component: PaymentCalculator,
});

const DEFAULTS = {
  amount: 500000,
  rate: 5.25,
  amortYears: 25,
  term: 5,
  freq: "Monthly" as PaymentFreq,
  tax: 4800,
  heat: 1200,
  condo: 0,
};

function PaymentCalculator() {
  const search = Route.useSearch();
  const initial = search.prefill === "1" && ACTIVE_APPS[0]
    ? {
        ...DEFAULTS,
        amount: ACTIVE_APPS[0].mortgageAmount,
        rate: ACTIVE_APPS[0].rate,
        amortYears: ACTIVE_APPS[0].amortYears,
      }
    : DEFAULTS;

  const [s, setS] = useState(initial);
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));

  const calc = useMemo(() => {
    const pmt = periodicPayment(s.amount, s.rate, s.amortYears, s.freq);
    const monthly = monthlyEquivalent(pmt, s.freq);
    const taxesAndFees = (s.tax + s.heat + s.condo * 12) / 12;
    const totalMonthly = monthly + taxesAndFees;
    const term = amortize(s.amount, s.rate, s.amortYears, s.freq, s.term);
    return { pmt, monthly, taxesAndFees, totalMonthly, term };
  }, [s]);

  return (
    <ToolPageShell
      title="Mortgage Payment Calculator"
      subtitle="Estimate your mortgage payment based on loan amount, rate, amortization, and frequency."
      bestFor="understanding monthly payment"
      onReset={() => setS(DEFAULTS)}
      onSave={() =>
        saveScenario({
          tool: "Mortgage Payment",
          name: `${fmtMoney(s.amount)} @ ${s.rate}% / ${s.amortYears}y`,
          inputs: s,
          outputs: { payment: calc.pmt, monthlyEquivalent: calc.monthly },
        })
      }
      primaryCta={{ label: "Start Mortgage Snapshot", to: "/pre-purchase" }}
      inputs={
        <>
          <PrefillFromAppButton onPrefill={(a) => setS({ ...s, amount: a.mortgageAmount, rate: a.rate, amortYears: a.amortYears })} />
          <NumField label="Mortgage amount" prefix="$" step={1000} value={s.amount} onChange={(v) => set("amount", v)} />
          <NumField label="Interest rate" suffix="%" step={0.05} value={s.rate} onChange={(v) => set("rate", v)} />
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Amortization" suffix="years" value={s.amortYears} onChange={(v) => set("amortYears", v)} />
            <NumField label="Term (optional)" suffix="years" value={s.term} onChange={(v) => set("term", v)} />
          </div>
          <SelectField label="Payment frequency" value={s.freq} onChange={(v) => set("freq", v)} options={PAYMENT_FREQS} />
          <div className="grid grid-cols-3 gap-3">
            <NumField label="Property tax / yr" prefix="$" value={s.tax} onChange={(v) => set("tax", v)} />
            <NumField label="Heating / yr" prefix="$" value={s.heat} onChange={(v) => set("heat", v)} />
            <NumField label="Condo fee / mo" prefix="$" value={s.condo} onChange={(v) => set("condo", v)} />
          </div>
        </>
      }
      results={
        <>
          <HeroResult
            label={`Estimated ${s.freq.toLowerCase()} payment`}
            value={fmtMoney(calc.pmt, 2)}
            sub={`≈ ${fmtMoney(calc.monthly, 0)}/mo equivalent`}
          />
          <ResultRow label="Monthly equivalent" value={fmtMoney(calc.monthly)} />
          <ResultRow label="Taxes, heat & condo / mo" value={fmtMoney(calc.taxesAndFees)} />
          <ResultRow label="Total housing cost / mo" value={fmtMoney(calc.totalMonthly)} tone="primary" />
          <ResultRow label={`Total interest over ${s.term}-yr term`} value={fmtMoney(calc.term.totalInterest)} />
          <ResultRow label={`Total principal over ${s.term}-yr term`} value={fmtMoney(calc.term.totalPrincipal)} />
          <ResultRow label="Balance at end of term" value={fmtMoney(calc.term.endingBalance)} />
          <p className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
            Affordability tip: lenders typically want housing costs (PITH) under ~32-39% of gross monthly income.
          </p>
        </>
      }
      explanation={
        <p>
          Canadian mortgage payments compound semi-annually. We convert the annual rate to the
          chosen payment frequency, then apply the standard amortization formula. Accelerated
          bi-weekly and weekly use half/quarter of the equivalent monthly payment, which pays the
          mortgage off faster.
        </p>
      }
    />
  );
}