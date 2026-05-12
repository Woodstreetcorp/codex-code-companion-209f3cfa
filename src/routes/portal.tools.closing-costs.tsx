import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NumField, ResultRow, ToolPageShell, fmtMoney, saveScenario } from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/closing-costs")({
  head: () => ({
    meta: [
      { title: "Purchase Closing Cost Estimator — approvU" },
      { name: "description", content: "Estimate land transfer tax, legal, appraisal, title insurance, and other closing costs." },
    ],
  }),
  component: closing_costs_Tool,
});

function closing_costs_Tool() {
  const [a, setA] = useState(100000);
  const [b, setB] = useState(5);
  const result = a * (b / 100);
  return (
    <ToolPageShell
      title="Purchase Closing Cost Estimator"
      subtitle="Estimate land transfer tax, legal, appraisal, title insurance, and other closing costs."
      bestFor="budgeting before closing"
      onReset={() => { setA(100000); setB(5); }}
      onSave={() => saveScenario({ tool: "Purchase Closing Cost Estimator", name: `${fmtMoney(a)} estimate`, inputs: { a, b }, outputs: { result } })}
      primaryCta={{ label: "Start Mortgage Snapshot", to: "/pre-purchase" }}
      inputs={
        <>
          <p className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-[11px] text-foreground">
            Quick-estimate version. A full guided experience is on the way — for now, enter your numbers below to see a directional result.
          </p>
          <NumField label="Primary amount" prefix="$" step={1000} value={a} onChange={setA} />
          <NumField label="Rate / percent" suffix="%" step={0.05} value={b} onChange={setB} />
        </>
      }
      results={
        <>
          <ResultRow label="Estimate" value={fmtMoney(result)} tone="primary" />
          <p className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
            For a tailored breakdown, start a Mortgage Snapshot or message your approvU advisor.
          </p>
        </>
      }
      explanation={<p>This is a directional estimate. The detailed calculator is being expanded with full inputs and outputs as described in your tool spec.</p>}
    />
  );
}
