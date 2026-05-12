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
  saveScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/land-transfer-tax")({
  head: () => ({
    meta: [
      { title: "Land Transfer Tax Calculator — approvU" },
      {
        name: "description",
        content:
          "Estimate provincial and municipal land transfer tax with first-time buyer rebates across all Canadian provinces.",
      },
    ],
  }),
  component: LandTransferTaxPage,
});

type Bracket = { upTo: number; rate: number };

type Province = {
  code: string;
  name: string;
  brackets: Bracket[];
  ftbRebateMax: number;
  notes?: string;
};

const PROVINCES: Province[] = [
  { code: "ON", name: "Ontario", brackets: [
    { upTo: 55000, rate: 0.005 }, { upTo: 250000, rate: 0.01 },
    { upTo: 400000, rate: 0.015 }, { upTo: 2000000, rate: 0.02 },
    { upTo: Infinity, rate: 0.025 },
  ], ftbRebateMax: 4000 },
  { code: "BC", name: "British Columbia", brackets: [
    { upTo: 200000, rate: 0.01 }, { upTo: 2000000, rate: 0.02 },
    { upTo: 3000000, rate: 0.03 }, { upTo: Infinity, rate: 0.05 },
  ], ftbRebateMax: 8000 },
  { code: "AB", name: "Alberta", brackets: [{ upTo: Infinity, rate: 0 }], ftbRebateMax: 0,
    notes: "Alberta has no land transfer tax — only nominal title and mortgage registration fees." },
  { code: "QC", name: "Quebec (outside Montreal)", brackets: [
    { upTo: 53700, rate: 0.005 }, { upTo: 269200, rate: 0.01 },
    { upTo: 500000, rate: 0.015 }, { upTo: Infinity, rate: 0.02 },
  ], ftbRebateMax: 0 },
  { code: "QC-MTL", name: "Quebec (Montreal)", brackets: [
    { upTo: 53700, rate: 0.005 }, { upTo: 269200, rate: 0.01 },
    { upTo: 552300, rate: 0.015 }, { upTo: 1104700, rate: 0.02 },
    { upTo: 2136500, rate: 0.025 }, { upTo: Infinity, rate: 0.035 },
  ], ftbRebateMax: 0 },
  { code: "MB", name: "Manitoba", brackets: [
    { upTo: 30000, rate: 0 }, { upTo: 90000, rate: 0.005 },
    { upTo: 150000, rate: 0.01 }, { upTo: 200000, rate: 0.015 },
    { upTo: Infinity, rate: 0.02 },
  ], ftbRebateMax: 0 },
  { code: "SK", name: "Saskatchewan", brackets: [{ upTo: Infinity, rate: 0.003 }], ftbRebateMax: 0,
    notes: "Saskatchewan charges a Land Title Transfer Fee of 0.3%." },
  { code: "NS", name: "Nova Scotia", brackets: [{ upTo: Infinity, rate: 0.015 }], ftbRebateMax: 0 },
  { code: "NB", name: "New Brunswick", brackets: [{ upTo: Infinity, rate: 0.01 }], ftbRebateMax: 0 },
  { code: "PE", name: "Prince Edward Island", brackets: [{ upTo: Infinity, rate: 0.01 }], ftbRebateMax: 2000 },
  { code: "NL", name: "Newfoundland & Labrador", brackets: [{ upTo: Infinity, rate: 0.004 }], ftbRebateMax: 0 },
];

function applyBrackets(price: number, brackets: Bracket[]): number {
  let tax = 0; let lower = 0;
  for (const b of brackets) {
    const upper = Math.min(price, b.upTo);
    if (upper > lower) tax += (upper - lower) * b.rate;
    if (price <= b.upTo) break;
    lower = b.upTo;
  }
  return tax;
}

function torontoMLTT(price: number): number {
  // Toronto MLTT mirrors Ontario LTT brackets (separate municipal layer).
  return applyBrackets(price, [
    { upTo: 55000, rate: 0.005 }, { upTo: 250000, rate: 0.01 },
    { upTo: 400000, rate: 0.015 }, { upTo: 2000000, rate: 0.02 },
    { upTo: 3000000, rate: 0.025 }, { upTo: 4000000, rate: 0.035 },
    { upTo: 5000000, rate: 0.045 }, { upTo: Infinity, rate: 0.055 },
  ]);
}

const TORONTO_FTB_REBATE_MAX = 4475;

function LandTransferTaxPage() {
  const [provCode, setProvCode] = useState<string>("ON");
  const [price, setPrice] = useState<number>(750000);
  const [inToronto, setInToronto] = useState<boolean>(false);
  const [firstTime, setFirstTime] = useState<boolean>(true);

  const prov = PROVINCES.find((p) => p.code === provCode)!;

  const result = useMemo(() => {
    const provincialTax = applyBrackets(price, prov.brackets);
    const provRebate = firstTime ? Math.min(prov.ftbRebateMax, provincialTax) : 0;
    const municipalTax = provCode === "ON" && inToronto ? torontoMLTT(price) : 0;
    const muniRebate =
      firstTime && provCode === "ON" && inToronto
        ? Math.min(TORONTO_FTB_REBATE_MAX, municipalTax)
        : 0;
    const total = provincialTax + municipalTax - provRebate - muniRebate;
    return { provincialTax, municipalTax, provRebate, muniRebate, total };
  }, [provCode, price, inToronto, firstTime, prov]);

  const reset = () => { setProvCode("ON"); setPrice(750000); setInToronto(false); setFirstTime(true); };
  const save = () => {
    saveScenario({
      tool: "Land Transfer Tax",
      name: `${prov.name} · ${fmtMoney(price)}`,
      inputs: { provCode, price, inToronto, firstTime },
      outputs: result as unknown as Record<string, unknown>,
    });
    toast.success("Scenario saved");
  };

  return (
    <ToolPageShell
      title="Land Transfer Tax Calculator"
      subtitle="Estimate provincial and municipal land transfer tax with first-time buyer rebates."
      bestFor="purchase planning"
      onReset={reset}
      onSave={save}
      primaryCta={{ label: "Open closing cost estimate", to: "/portal/tools/closing-costs" }}
      secondaryCta={{ label: "All saved scenarios", to: "/portal/tools/saved" }}
      inputs={
        <>
          <SelectField
            label="Province / region"
            value={provCode}
            onChange={(v) => { setProvCode(v); if (v !== "ON") setInToronto(false); }}
            options={PROVINCES.map((p) => ({ value: p.code, label: p.name }))}
          />
          <NumField label="Purchase price" prefix="$" step={1000} value={price} onChange={setPrice} />
          {provCode === "ON" && (
            <ToggleField label="Property is in the City of Toronto" value={inToronto} onChange={setInToronto} />
          )}
          <ToggleField label="I'm a first-time home buyer" value={firstTime} onChange={setFirstTime} />
          {prov.notes && <p className="text-[11px] text-muted-foreground">{prov.notes}</p>}
        </>
      }
      results={
        <>
          <HeroResult
            label="Total land transfer tax"
            value={fmtMoney(result.total)}
            sub={firstTime && (result.provRebate + result.muniRebate) > 0
              ? `Includes ${fmtMoney(result.provRebate + result.muniRebate)} first-time buyer rebate`
              : undefined}
          />
          <ResultRow label="Provincial tax" value={fmtMoney(result.provincialTax)} />
          {result.provRebate > 0 && (
            <ResultRow label="First-time buyer rebate" value={`− ${fmtMoney(result.provRebate)}`} tone="mint" />
          )}
          {inToronto && (
            <>
              <ResultRow label="Toronto municipal tax" value={fmtMoney(result.municipalTax)} />
              {result.muniRebate > 0 && (
                <ResultRow label="Toronto FTB rebate" value={`− ${fmtMoney(result.muniRebate)}`} tone="mint" />
              )}
            </>
          )}
          <ResultRow label="Net amount due at closing" value={fmtMoney(result.total)} tone="primary" />
        </>
      }
      explanation={
        <p>
          Land transfer tax is calculated using progressive brackets on the purchase price. Some
          provinces and the City of Toronto offer rebates to first-time buyers, capped at the
          maximums shown. Estimates are illustrative — your lawyer will confirm the final amount.
        </p>
      }
    />
  );
}