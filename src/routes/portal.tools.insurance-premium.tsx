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
  saveScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/insurance-premium")({
  head: () => ({
    meta: [
      { title: "Mortgage Insurance Premium Calculator — approvU" },
      {
        name: "description",
        content:
          "Estimate CMHC, Sagen, or Canada Guaranty mortgage default insurance premiums and provincial PST in MB, SK, and ON.",
      },
    ],
  }),
  component: InsurancePremiumPage,
});

type Insurer = "CMHC" | "Sagen" | "Canada Guaranty";

// Standard high-ratio rates (transactional). Identical across the 3 insurers.
function premiumRate(ltv: number): number {
  if (ltv <= 65) return 0.006;
  if (ltv <= 75) return 0.017;
  if (ltv <= 80) return 0.024;
  if (ltv <= 85) return 0.028;
  if (ltv <= 90) return 0.031;
  if (ltv <= 95) return 0.04;
  return NaN;
}

const PST_RATES: Record<string, number> = { ON: 0.08, MB: 0.07, SK: 0.06 };

const PROVINCES = [
  { value: "ON", label: "Ontario (8% PST on premium)" },
  { value: "MB", label: "Manitoba (7% PST on premium)" },
  { value: "SK", label: "Saskatchewan (6% PST on premium)" },
  { value: "OTHER", label: "Other province (no PST on premium)" },
] as const;

function InsurancePremiumPage() {
  const [insurer, setInsurer] = useState<Insurer>("CMHC");
  const [price, setPrice] = useState<number>(750000);
  const [down, setDown] = useState<number>(45000);
  const [amortYears, setAmortYears] = useState<number>(25);
  const [province, setProvince] = useState<string>("ON");
  const [extendedAmort, setExtendedAmort] = useState<boolean>(false);
  const [selfEmployedAlt, setSelfEmployedAlt] = useState<boolean>(false);

  const result = useMemo(() => {
    const baseLoan = Math.max(0, price - down);
    const ltv = price > 0 ? (baseLoan / price) * 100 : 0;
    const downPct = price > 0 ? (down / price) * 100 : 0;
    const insurable = ltv > 80 && ltv <= 95 && price < 1500000;
    let rate = insurable ? premiumRate(ltv) : 0;
    // Surcharges
    if (insurable && extendedAmort && amortYears > 25) rate += 0.0025; // 25bps per 5y typically; simplified
    if (insurable && selfEmployedAlt) rate += 0.015;
    const premium = baseLoan * rate;
    const pst = (PST_RATES[province] ?? 0) * premium;
    const totalLoan = baseLoan + premium; // PST paid at closing, premium added to loan
    return { baseLoan, ltv, downPct, insurable, rate, premium, pst, totalLoan };
  }, [price, down, amortYears, province, extendedAmort, selfEmployedAlt]);

  const reset = () => {
    setInsurer("CMHC"); setPrice(750000); setDown(45000); setAmortYears(25);
    setProvince("ON"); setExtendedAmort(false); setSelfEmployedAlt(false);
  };
  const save = () => {
    saveScenario({
      tool: "Insurance Premium",
      name: `${insurer} · ${fmtPct(result.ltv)} LTV`,
      inputs: { insurer, price, down, amortYears, province, extendedAmort, selfEmployedAlt },
      outputs: result as unknown as Record<string, unknown>,
    });
    toast.success("Scenario saved");
  };

  return (
    <ToolPageShell
      title="Mortgage Insurance Premium Calculator"
      subtitle="Estimate CMHC, Sagen, or Canada Guaranty default insurance premium and applicable PST."
      bestFor="high-ratio purchases (down payment under 20%)"
      onReset={reset}
      onSave={save}
      primaryCta={{ label: "Open closing cost estimate", to: "/portal/tools/closing-costs" }}
      secondaryCta={{ label: "Down payment planner", to: "/portal/tools/down-payment" }}
      inputs={
        <>
          <SelectField<Insurer>
            label="Insurer"
            value={insurer}
            onChange={setInsurer}
            options={["CMHC", "Sagen", "Canada Guaranty"]}
          />
          <NumField label="Purchase price" prefix="$" step={1000} value={price} onChange={setPrice} />
          <NumField
            label="Down payment"
            prefix="$"
            step={500}
            value={down}
            onChange={setDown}
            hint={`${fmtPct(result.downPct)} of purchase price`}
          />
          <NumField label="Amortization (years)" suffix="yrs" step={1} value={amortYears} onChange={setAmortYears} />
          <SelectField
            label="Property province"
            value={province}
            onChange={setProvince}
            options={PROVINCES.map((p) => ({ value: p.value, label: p.label }))}
          />
          <ToggleField label="Extended amortization (26–30 yrs)" value={extendedAmort} onChange={setExtendedAmort} />
          <ToggleField label="Self-employed (alternative income docs)" value={selfEmployedAlt} onChange={setSelfEmployedAlt} />
        </>
      }
      results={
        <>
          <HeroResult
            label={result.insurable ? "Insurance premium added to loan" : "No premium required"}
            value={fmtMoney(result.premium)}
            sub={
              result.insurable
                ? `${fmtPct(result.rate * 100, 2)} of ${fmtMoney(result.baseLoan)} · ${insurer}`
                : result.ltv <= 80
                  ? "LTV is 80% or less — conventional mortgage, no insurance required."
                  : "Insurance is unavailable above 95% LTV or for purchase prices over $1.5M."
            }
          />
          <ResultRow label="Loan-to-value (LTV)" value={fmtPct(result.ltv)} />
          <ResultRow label="Base loan amount" value={fmtMoney(result.baseLoan)} />
          <ResultRow label="Premium rate" value={result.insurable ? fmtPct(result.rate * 100, 2) : "—"} />
          <ResultRow label="Total mortgage (incl. premium)" value={fmtMoney(result.totalLoan)} tone="primary" />
          {result.pst > 0 && (
            <ResultRow
              label={`PST on premium (${province})`}
              value={`${fmtMoney(result.pst)} due at closing`}
              tone="coral"
            />
          )}
        </>
      }
      explanation={
        <>
          <p>
            Mortgage default insurance is required when the down payment is less than 20%. The
            premium is a percentage of the loan amount based on LTV, and is typically added to your
            mortgage and amortized.
          </p>
          <p className="mt-2">
            <strong>Provincial PST:</strong> Ontario (8%), Manitoba (7%), and Saskatchewan (6%)
            charge sales tax on the insurance premium itself. PST is paid at closing — it cannot be
            rolled into the mortgage. Surcharges may apply for extended amortizations or alternative
            income documentation.
          </p>
        </>
      }
    />
  );
}