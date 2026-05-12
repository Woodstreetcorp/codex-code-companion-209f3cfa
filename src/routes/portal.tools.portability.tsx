import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  HeroResult,
  NumField,
  ResultRow,
  SelectField,
  ToggleField,
  ToolPageShell,
  fmtMoney,
  fmtPct,
  periodicPayment,
  saveScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/portability")({
  head: () => ({
    meta: [
      { title: "Mortgage Portability Comparator — approvU" },
      {
        name: "description",
        content:
          "Compare porting your existing mortgage to a new home versus breaking and refinancing — including IRD penalty, blend & extend, and bridge financing.",
      },
    ],
  }),
  component: PortabilityPage,
});

type Strategy = "Port" | "Port & increase (blend)" | "Break & refinance";

function PortabilityPage() {
  const [currentBalance, setCurrentBalance] = useState<number>(420000);
  const [currentRate, setCurrentRate] = useState<number>(2.79);
  const [monthsRemaining, setMonthsRemaining] = useState<number>(28);
  const [origAmortYears, setOrigAmortYears] = useState<number>(25);
  const [newPrice, setNewPrice] = useState<number>(820000);
  const [newDown, setNewDown] = useState<number>(120000);
  const [marketRate, setMarketRate] = useState<number>(4.79);
  const [discharge, setDischarge] = useState<number>(400);
  const [bridgeDays, setBridgeDays] = useState<number>(7);
  const [includesPenalty, setIncludesPenalty] = useState<boolean>(true);
  const [strategy, setStrategy] = useState<Strategy>("Port & increase (blend)");

  const result = useMemo(() => {
    const requiredLoan = Math.max(0, newPrice - newDown);
    const additional = Math.max(0, requiredLoan - currentBalance);

    // IRD = (current rate − comparison posted) * balance * months/12.
    // Simplified: comparison ≈ marketRate − 1.0 (lender posted vs market discount).
    const ird = Math.max(
      currentBalance * (currentRate / 100) * 0.25, // floor: 3-month interest
      currentBalance * Math.max(0, (currentRate - (marketRate - 1.0))) / 100 * (monthsRemaining / 12),
    );

    // Blended rate = weighted avg (existing balance @ current rate, new $ @ market).
    const blendedRate = requiredLoan > 0
      ? (currentBalance * currentRate + additional * marketRate) / requiredLoan
      : currentRate;

    const portPmt = periodicPayment(requiredLoan, currentRate, origAmortYears, "Monthly");
    const blendPmt = periodicPayment(requiredLoan, blendedRate, origAmortYears, "Monthly");
    const breakPmt = periodicPayment(requiredLoan, marketRate, origAmortYears, "Monthly");

    const bridgeInterest = (currentBalance * (marketRate / 100) * bridgeDays) / 365;
    const bridgeAdmin = bridgeDays > 0 ? 350 : 0;

    const portCost = discharge + bridgeInterest + bridgeAdmin;
    const blendCost = portCost; // blend & extend: no penalty
    const breakCost = (includesPenalty ? ird : 0) + discharge + bridgeInterest + bridgeAdmin;

    return {
      requiredLoan, additional, ird, blendedRate,
      portPmt, blendPmt, breakPmt,
      portCost, blendCost, breakCost,
      bridgeInterest, bridgeAdmin,
    };
  }, [currentBalance, currentRate, monthsRemaining, origAmortYears, newPrice, newDown, marketRate, discharge, bridgeDays, includesPenalty]);

  const active = strategy === "Port"
    ? { pmt: result.portPmt, oneTime: result.portCost, rate: currentRate }
    : strategy === "Port & increase (blend)"
      ? { pmt: result.blendPmt, oneTime: result.blendCost, rate: result.blendedRate }
      : { pmt: result.breakPmt, oneTime: result.breakCost, rate: marketRate };

  const reset = () => {
    setCurrentBalance(420000); setCurrentRate(2.79); setMonthsRemaining(28); setOrigAmortYears(25);
    setNewPrice(820000); setNewDown(120000); setMarketRate(4.79); setDischarge(400);
    setBridgeDays(7); setIncludesPenalty(true); setStrategy("Port & increase (blend)");
  };
  const save = () => {
    saveScenario({
      tool: "Portability",
      name: `${strategy} · ${fmtMoney(result.requiredLoan)}`,
      inputs: { currentBalance, currentRate, monthsRemaining, origAmortYears, newPrice, newDown, marketRate, strategy },
      outputs: { ...result, chosen: active } as unknown as Record<string, unknown>,
    });
    toast.success("Scenario saved");
  };

  return (
    <ToolPageShell
      title="Mortgage Portability Comparator"
      subtitle="Moving mid-term? Compare porting, blending, or breaking your existing mortgage."
      bestFor="homeowners moving before maturity"
      onReset={reset}
      onSave={save}
      primaryCta={{ label: "Talk to your advisor", to: "/portal/messages" }}
      secondaryCta={{ label: "All saved scenarios", to: "/portal/tools/saved" }}
      inputs={
        <>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Current mortgage</p>
            <div className="space-y-3">
              <NumField label="Current balance" prefix="$" step={1000} value={currentBalance} onChange={setCurrentBalance} />
              <NumField label="Current rate" suffix="%" step={0.01} value={currentRate} onChange={setCurrentRate} />
              <NumField label="Months remaining in term" suffix="mo" step={1} value={monthsRemaining} onChange={setMonthsRemaining} />
              <NumField label="Original amortization" suffix="yrs" step={1} value={origAmortYears} onChange={setOrigAmortYears} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">New home</p>
            <div className="space-y-3">
              <NumField label="New purchase price" prefix="$" step={1000} value={newPrice} onChange={setNewPrice} />
              <NumField label="Down payment / equity" prefix="$" step={1000} value={newDown} onChange={setNewDown} />
              <NumField label="Today's market rate" suffix="%" step={0.01} value={marketRate} onChange={setMarketRate} />
            </div>
          </div>
          <NumField label="Discharge / re-registration fee" prefix="$" step={50} value={discharge} onChange={setDischarge} />
          <NumField label="Bridge financing days" suffix="days" step={1} value={bridgeDays} onChange={setBridgeDays} hint="Days between selling current home and closing new one." />
          <ToggleField label="Include IRD penalty estimate (break only)" value={includesPenalty} onChange={setIncludesPenalty} />
          <SelectField<Strategy>
            label="Compare strategy"
            value={strategy}
            onChange={setStrategy}
            options={["Port", "Port & increase (blend)", "Break & refinance"]}
          />
        </>
      }
      results={
        <>
          <HeroResult
            label={`Estimated payment · ${strategy}`}
            value={`${fmtMoney(active.pmt)}/mo`}
            sub={`Effective rate ${fmtPct(active.rate, 2)} · One-time costs ${fmtMoney(active.oneTime)}`}
          />
          <ResultRow label="New loan required" value={fmtMoney(result.requiredLoan)} />
          <ResultRow label="Additional funds needed" value={fmtMoney(result.additional)} />
          <div className="my-2 h-px bg-border" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Side-by-side</p>
          <CompareRow label="Port (no increase)" pmt={result.portPmt} oneTime={result.portCost} highlighted={strategy === "Port"} />
          <CompareRow label="Port & blend" pmt={result.blendPmt} oneTime={result.blendCost} rate={result.blendedRate} highlighted={strategy === "Port & increase (blend)"} />
          <CompareRow label="Break & refinance" pmt={result.breakPmt} oneTime={result.breakCost} rate={marketRate} highlighted={strategy === "Break & refinance"} />
          {includesPenalty && (
            <ResultRow label="Estimated IRD penalty if breaking" value={fmtMoney(result.ird)} tone="coral" />
          )}
          {bridgeDays > 0 && (
            <ResultRow label={`Bridge cost (${bridgeDays} days)`} value={fmtMoney(result.bridgeInterest + result.bridgeAdmin)} />
          )}
        </>
      }
      explanation={
        <>
          <p>
            <strong>Porting</strong> moves your existing mortgage (rate, term, and remaining
            amortization) to a new property. <strong>Port & blend</strong> adds new money at today's
            market rate, weighted with your existing rate. <strong>Breaking</strong> ends the
            current mortgage early and triggers an IRD or 3-month interest penalty.
          </p>
          <p className="mt-2">
            IRD shown is illustrative — your lender's posted-rate methodology may differ. Confirm
            the exact figure on a discharge statement before proceeding.
          </p>
        </>
      }
    />
  );
}

function CompareRow({ label, pmt, oneTime, rate, highlighted }: { label: string; pmt: number; oneTime: number; rate?: number; highlighted?: boolean }) {
  return (
    <div className={`rounded-lg border p-2.5 text-xs ${highlighted ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-semibold text-foreground">{fmtMoney(pmt)}/mo</span>
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{rate !== undefined ? `Rate ${fmtPct(rate, 2)}` : ""}</span>
        <span>One-time cost {fmtMoney(oneTime)}</span>
      </div>
    </div>
  );
}