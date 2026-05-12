import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NumField, ResultRow, ToolPageShell, fmtMoney, saveScenario } from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/stress-test")({
  head: () => ({
    meta: [
      { title: "Stress Test Calculator — approvU" },
      { name: "description", content: "Estimate qualification using a qualifying rate and affordability ratios." },
    ],
  }),
  component: stress_test_Tool,
});

function stress_test_Tool() {
  const [a, setA] = useState(100000);
  const [b, setB] = useState(5);
  const result = a * (b / 100);
  return (
    <ToolPageShell
      title="Stress Test Calculator"
      subtitle="Estimate qualification using a qualifying rate and affordability ratios."
      bestFor="understanding qualification"
      onReset={() => { setA(100000); setB(5); }}
      onSave={() => saveScenario({ tool: "Stress Test Calculator", name: `${fmtMoney(a)} estimate`, inputs: { a, b }, outputs: { result } })}
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
