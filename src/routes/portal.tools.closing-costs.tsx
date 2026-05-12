import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
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

export const Route = createFileRoute("/portal/tools/closing-costs")({
  head: () => ({
    meta: [
      { title: "Closing Cost Estimator — approvU" },
      {
        name: "description",
        content:
          "Estimate land transfer tax, legal fees, title insurance, appraisal, and other Canadian mortgage closing costs.",
      },
    ],
  }),
  component: ClosingCostEstimatorPage,
});

// ─── Types & province configuration ─────────────────────────────────────
type TxType = "Purchase" | "Refinance" | "Renewal / Switch";
type YesNoUnsure = "Yes" | "No" | "Not sure";

type LTTBracket = { upTo: number; rate: number };

type ProvinceRule = {
  code: string;
  name: string;
  landTransferTaxBrackets: LTTBracket[];
  firstTimeBuyerRebateMax: number; // provincial rebate cap
  defaultLegalFee: number;
  defaultTitleInsurance: number;
  defaultAppraisalFee: number;
  defaultInspectionFee: number;
  defaultDischargeFee: number;
  defaultRegistrationFee: number;
  defaultAdjustmentBuffer: number;
  defaultLenderAdminFee: number;
  premiumTaxRate: number; // PST on default insurance premium
  notes?: string;
};

const PROVINCES: ProvinceRule[] = [
  {
    code: "ON",
    name: "Ontario",
    landTransferTaxBrackets: [
      { upTo: 55000, rate: 0.005 },
      { upTo: 250000, rate: 0.01 },
      { upTo: 400000, rate: 0.015 },
      { upTo: 2000000, rate: 0.02 },
      { upTo: Infinity, rate: 0.025 },
    ],
    firstTimeBuyerRebateMax: 4000,
    defaultLegalFee: 1800,
    defaultTitleInsurance: 400,
    defaultAppraisalFee: 450,
    defaultInspectionFee: 500,
    defaultDischargeFee: 350,
    defaultRegistrationFee: 150,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0.08,
  },
  {
    code: "BC",
    name: "British Columbia",
    landTransferTaxBrackets: [
      { upTo: 200000, rate: 0.01 },
      { upTo: 2000000, rate: 0.02 },
      { upTo: 3000000, rate: 0.03 },
      { upTo: Infinity, rate: 0.05 },
    ],
    firstTimeBuyerRebateMax: 8000,
    defaultLegalFee: 1700,
    defaultTitleInsurance: 400,
    defaultAppraisalFee: 450,
    defaultInspectionFee: 500,
    defaultDischargeFee: 350,
    defaultRegistrationFee: 200,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0,
  },
  {
    code: "AB",
    name: "Alberta",
    landTransferTaxBrackets: [],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1500,
    defaultTitleInsurance: 350,
    defaultAppraisalFee: 400,
    defaultInspectionFee: 500,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 250,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0,
    notes: "Alberta charges land title and mortgage registration fees instead of land transfer tax.",
  },
  {
    code: "MB",
    name: "Manitoba",
    landTransferTaxBrackets: [
      { upTo: 30000, rate: 0 },
      { upTo: 90000, rate: 0.005 },
      { upTo: 150000, rate: 0.01 },
      { upTo: 200000, rate: 0.015 },
      { upTo: Infinity, rate: 0.02 },
    ],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1500,
    defaultTitleInsurance: 350,
    defaultAppraisalFee: 400,
    defaultInspectionFee: 500,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 150,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0.07,
  },
  {
    code: "SK",
    name: "Saskatchewan",
    landTransferTaxBrackets: [],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1500,
    defaultTitleInsurance: 350,
    defaultAppraisalFee: 400,
    defaultInspectionFee: 500,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 200,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0.06,
    notes: "Saskatchewan uses an Information Services Corporation title transfer fee (~0.3% of value).",
  },
  {
    code: "QC",
    name: "Quebec",
    landTransferTaxBrackets: [
      { upTo: 53700, rate: 0.005 },
      { upTo: 269200, rate: 0.01 },
      { upTo: 500000, rate: 0.015 },
      { upTo: Infinity, rate: 0.02 },
    ],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1500,
    defaultTitleInsurance: 350,
    defaultAppraisalFee: 450,
    defaultInspectionFee: 550,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 150,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0.09,
    notes: "Welcome tax (droit de mutation) is collected by the municipality after closing.",
  },
  {
    code: "NS",
    name: "Nova Scotia",
    landTransferTaxBrackets: [{ upTo: Infinity, rate: 0.015 }],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1700,
    defaultTitleInsurance: 400,
    defaultAppraisalFee: 450,
    defaultInspectionFee: 500,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 100,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0,
    notes: "Deed transfer tax varies by municipality; 1.5% is a common HRM rate.",
  },
  {
    code: "NB",
    name: "New Brunswick",
    landTransferTaxBrackets: [{ upTo: Infinity, rate: 0.01 }],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1500,
    defaultTitleInsurance: 350,
    defaultAppraisalFee: 400,
    defaultInspectionFee: 500,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 100,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0,
  },
  {
    code: "NL",
    name: "Newfoundland and Labrador",
    landTransferTaxBrackets: [{ upTo: Infinity, rate: 0.004 }],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1500,
    defaultTitleInsurance: 350,
    defaultAppraisalFee: 400,
    defaultInspectionFee: 500,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 100,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0,
    notes: "Registration fee is roughly $100 plus 0.4% of the mortgage amount over $500.",
  },
  {
    code: "PE",
    name: "Prince Edward Island",
    landTransferTaxBrackets: [{ upTo: Infinity, rate: 0.01 }],
    firstTimeBuyerRebateMax: 2000,
    defaultLegalFee: 1500,
    defaultTitleInsurance: 350,
    defaultAppraisalFee: 400,
    defaultInspectionFee: 500,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 100,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0,
  },
  {
    code: "YT",
    name: "Yukon",
    landTransferTaxBrackets: [],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1600,
    defaultTitleInsurance: 400,
    defaultAppraisalFee: 500,
    defaultInspectionFee: 550,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 200,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0,
  },
  {
    code: "NT",
    name: "Northwest Territories",
    landTransferTaxBrackets: [],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1700,
    defaultTitleInsurance: 400,
    defaultAppraisalFee: 550,
    defaultInspectionFee: 600,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 200,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0,
  },
  {
    code: "NU",
    name: "Nunavut",
    landTransferTaxBrackets: [],
    firstTimeBuyerRebateMax: 0,
    defaultLegalFee: 1800,
    defaultTitleInsurance: 400,
    defaultAppraisalFee: 600,
    defaultInspectionFee: 650,
    defaultDischargeFee: 300,
    defaultRegistrationFee: 200,
    defaultAdjustmentBuffer: 1500,
    defaultLenderAdminFee: 0,
    premiumTaxRate: 0,
  },
];

const PROVINCE_OPTIONS = PROVINCES.map((p) => ({ value: p.code, label: p.name }));

const PROPERTY_TYPES = [
  "Detached",
  "Semi-detached",
  "Townhouse",
  "Condo",
  "Duplex / multi-unit",
  "New construction",
  "Other",
] as const;

const PROPERTY_USAGE = ["Owner-occupied", "Rental / investment", "Second home"] as const;

// ─── LTT helpers ────────────────────────────────────────────────────────
function calcBracketTax(amount: number, brackets: LTTBracket[]) {
  if (amount <= 0 || brackets.length === 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (amount <= prev) break;
    const slab = Math.min(amount, b.upTo) - prev;
    if (slab > 0) tax += slab * b.rate;
    prev = b.upTo;
  }
  return Math.round(tax);
}

// Toronto MLTT — same brackets as Ontario provincial LTT
const TORONTO_MLTT_BRACKETS: LTTBracket[] = [
  { upTo: 55000, rate: 0.005 },
  { upTo: 250000, rate: 0.01 },
  { upTo: 400000, rate: 0.015 },
  { upTo: 2000000, rate: 0.02 },
  { upTo: 3000000, rate: 0.025 },
  { upTo: 4000000, rate: 0.035 },
  { upTo: Infinity, rate: 0.045 },
];
const TORONTO_FTHB_REBATE_MAX = 4475;

// ─── Page ───────────────────────────────────────────────────────────────
function ClosingCostEstimatorPage() {
  const [txType, setTxType] = useState<TxType>("Purchase");

  return (
    <ToolPageShell
      title="Closing Cost Estimator"
      subtitle="Estimate the cash you may need for legal fees, land transfer tax, title insurance, appraisal, and other closing costs."
      bestFor="budgeting before closing"
    >
      <TransactionTypeSelector value={txType} onChange={setTxType} />
      {txType === "Purchase" && <PurchaseEstimator />}
      {txType === "Refinance" && <RefinanceEstimator />}
      {txType === "Renewal / Switch" && <RenewalSwitchEstimator />}
      <Disclaimer />
    </ToolPageShell>
  );
}

// ─── Transaction type selector ──────────────────────────────────────────
function TransactionTypeSelector({ value, onChange }: { value: TxType; onChange: (v: TxType) => void }) {
  const options: TxType[] = ["Purchase", "Refinance", "Renewal / Switch"];
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Transaction type
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">
        What type of mortgage transaction are you estimating?
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-foreground hover:border-primary/40"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Validation helper ──────────────────────────────────────────────────
function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="rounded-lg border border-coral/40 bg-coral/5 p-3 text-[11px] text-coral">
      {errors.map((e, i) => (
        <li key={i}>• {e}</li>
      ))}
    </ul>
  );
}

// ─── Advanced assumptions accordion ─────────────────────────────────────
type Assumptions = {
  legalFee: number;
  titleInsurance: number;
  appraisalFee: number;
  inspectionFee: number;
  dischargeFee: number;
  registrationFee: number;
  lenderAdminFee: number;
  movingCost: number;
  adjustmentBuffer: number;
  otherCosts: number;
};

function makeAssumptions(rule: ProvinceRule): Assumptions {
  return {
    legalFee: rule.defaultLegalFee,
    titleInsurance: rule.defaultTitleInsurance,
    appraisalFee: rule.defaultAppraisalFee,
    inspectionFee: rule.defaultInspectionFee,
    dischargeFee: rule.defaultDischargeFee,
    registrationFee: rule.defaultRegistrationFee,
    lenderAdminFee: rule.defaultLenderAdminFee,
    movingCost: 0,
    adjustmentBuffer: rule.defaultAdjustmentBuffer,
    otherCosts: 0,
  };
}

function AdvancedAssumptions({
  assumptions,
  setAssumptions,
  variant,
}: {
  assumptions: Assumptions;
  setAssumptions: (a: Assumptions) => void;
  variant: TxType;
}) {
  const [open, setOpen] = useState(false);
  const set = <K extends keyof Assumptions>(k: K, v: number) =>
    setAssumptions({ ...assumptions, [k]: v });
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">Advanced cost assumptions</p>
          <p className="text-[11px] text-muted-foreground">
            Override the defaults if you have quotes from your lawyer, lender, or appraiser.
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2">
          <NumField label="Legal fee" prefix="$" step={50} value={assumptions.legalFee} onChange={(n) => set("legalFee", n)} />
          <NumField label="Title insurance" prefix="$" step={25} value={assumptions.titleInsurance} onChange={(n) => set("titleInsurance", n)} />
          <NumField label="Appraisal fee" prefix="$" step={25} value={assumptions.appraisalFee} onChange={(n) => set("appraisalFee", n)} />
          {variant === "Purchase" && (
            <NumField label="Home inspection" prefix="$" step={25} value={assumptions.inspectionFee} onChange={(n) => set("inspectionFee", n)} />
          )}
          {variant !== "Purchase" && (
            <NumField label="Discharge fee" prefix="$" step={25} value={assumptions.dischargeFee} onChange={(n) => set("dischargeFee", n)} />
          )}
          <NumField label="Registration fee" prefix="$" step={25} value={assumptions.registrationFee} onChange={(n) => set("registrationFee", n)} />
          <NumField label="Lender / admin fee" prefix="$" step={25} value={assumptions.lenderAdminFee} onChange={(n) => set("lenderAdminFee", n)} />
          {variant === "Purchase" && (
            <NumField label="Moving cost (optional)" prefix="$" step={50} value={assumptions.movingCost} onChange={(n) => set("movingCost", n)} />
          )}
          <NumField label="Adjustment buffer" prefix="$" step={50} value={assumptions.adjustmentBuffer} onChange={(n) => set("adjustmentBuffer", n)} hint="Property tax / utility prepayments at closing." />
          <NumField label="Other costs" prefix="$" step={50} value={assumptions.otherCosts} onChange={(n) => set("otherCosts", n)} />
        </div>
      )}
    </section>
  );
}

// ─── Disclaimer / How calculated ────────────────────────────────────────
function Disclaimer() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-secondary" />
        <h2 className="text-sm font-semibold text-foreground">How this estimate is calculated</h2>
      </div>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <p>
          Your estimate is based on the transaction type, province, city, purchase price or mortgage amount,
          first-time buyer status, and estimated service costs. Some fees vary by lawyer, lender, insurer,
          municipality, and property details.
        </p>
        <p>
          <strong className="text-foreground">Purchase:</strong> land transfer tax may be one of the largest
          closing costs. Toronto buyers also pay a municipal land transfer tax. Some provinces and
          municipalities provide first-time buyer rebates.
        </p>
        <p>
          <strong className="text-foreground">Refinance:</strong> costs are usually related to legal work,
          title insurance, appraisal, mortgage discharge, and registration of the new charge.
        </p>
        <p>
          <strong className="text-foreground">Renewal / Switch:</strong> a straight renewal with your current
          lender is typically free. Switching to a new lender may include discharge, registration, and (sometimes)
          legal or appraisal fees, often partly absorbed by the new lender.
        </p>
        <p className="text-[11px]">
          This tool provides an estimate only. Final costs depend on province, municipality, lender requirements,
          lawyer fees, taxes, and verified transaction details.
        </p>
      </div>
    </section>
  );
}

// ─── PURCHASE ───────────────────────────────────────────────────────────
function PurchaseEstimator() {
  const [provinceCode, setProvinceCode] = useState("ON");
  const province = useMemo(
    () => PROVINCES.find((p) => p.code === provinceCode) ?? PROVINCES[0],
    [provinceCode],
  );
  const [city, setCity] = useState("Toronto");
  const [price, setPrice] = useState(850000);
  const [downPayment, setDownPayment] = useState(85000);
  const [mortgageOverride, setMortgageOverride] = useState<number | null>(null);
  const mortgage = mortgageOverride ?? Math.max(0, price - downPayment);
  const [propertyType, setPropertyType] = useState<(typeof PROPERTY_TYPES)[number]>("Detached");
  const [propertyUsage, setPropertyUsage] = useState<(typeof PROPERTY_USAGE)[number]>("Owner-occupied");
  const [firstTime, setFirstTime] = useState<YesNoUnsure>("Yes");
  const [newConstruction, setNewConstruction] = useState(false);
  const [torontoOverride, setTorontoOverride] = useState<boolean | null>(null);
  const isToronto = torontoOverride ?? city.trim().toLowerCase() === "toronto";

  const [insuredKnown, setInsuredKnown] = useState<YesNoUnsure>(
    downPayment / Math.max(1, price) < 0.2 ? "Yes" : "No",
  );
  const [insurancePremium, setInsurancePremium] = useState(0);

  const [assumptions, setAssumptions] = useState<Assumptions>(makeAssumptions(province));
  useEffect(() => setAssumptions(makeAssumptions(province)), [province]);

  // Calculations
  const provincialLTT = calcBracketTax(price, province.landTransferTaxBrackets);
  const municipalLTT = isToronto && provinceCode === "ON" ? calcBracketTax(price, TORONTO_MLTT_BRACKETS) : 0;
  const provincialRebate =
    firstTime === "Yes" ? Math.min(provincialLTT, province.firstTimeBuyerRebateMax) : 0;
  const municipalRebate =
    firstTime === "Yes" && isToronto && provinceCode === "ON"
      ? Math.min(municipalLTT, TORONTO_FTHB_REBATE_MAX)
      : 0;
  const premiumTax =
    insuredKnown === "Yes" && insurancePremium > 0
      ? Math.round(insurancePremium * province.premiumTaxRate)
      : 0;

  const totalClosing =
    provincialLTT +
    municipalLTT -
    provincialRebate -
    municipalRebate +
    assumptions.legalFee +
    assumptions.titleInsurance +
    assumptions.appraisalFee +
    assumptions.inspectionFee +
    assumptions.registrationFee +
    assumptions.lenderAdminFee +
    assumptions.adjustmentBuffer +
    assumptions.otherCosts +
    premiumTax;

  const totalCash = downPayment + totalClosing + assumptions.movingCost;

  // Validation
  const errors: string[] = [];
  if (!provinceCode) errors.push("Please select your province.");
  if (price <= 0) errors.push("Please enter the purchase price.");
  if (downPayment < 0) errors.push("Down payment cannot be negative.");
  if (downPayment > price) errors.push("Down payment cannot exceed the purchase price.");
  if (mortgage < 0) errors.push("Mortgage amount cannot be negative.");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      {/* Inputs */}
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Purchase details</h2>
          <div className="space-y-3">
            <SelectField label="Province" value={provinceCode} onChange={setProvinceCode} options={PROVINCE_OPTIONS} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground">City / municipality</span>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setTorontoOverride(null);
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            {provinceCode === "ON" && (
              <ToggleField
                label="Property is in Toronto (adds municipal LTT)"
                value={isToronto}
                onChange={(v) => setTorontoOverride(v)}
              />
            )}
            <NumField label="Purchase price" prefix="$" step={1000} value={price} onChange={setPrice} />
            <NumField label="Down payment" prefix="$" step={1000} value={downPayment} onChange={setDownPayment} />
            <NumField
              label="Mortgage amount"
              prefix="$"
              step={1000}
              value={mortgage}
              onChange={(n) => setMortgageOverride(n)}
              hint="Auto-calculated. Edit if you want to override."
            />
            <SelectField
              label="Property type"
              value={propertyType}
              onChange={(v) => setPropertyType(v as (typeof PROPERTY_TYPES)[number])}
              options={PROPERTY_TYPES as unknown as readonly string[]}
            />
            <SelectField
              label="Property usage"
              value={propertyUsage}
              onChange={(v) => setPropertyUsage(v as (typeof PROPERTY_USAGE)[number])}
              options={PROPERTY_USAGE as unknown as readonly string[]}
            />
            <SelectField
              label="First-time home buyer?"
              value={firstTime}
              onChange={setFirstTime}
              options={["Yes", "No", "Not sure"] as const}
            />
            <ToggleField
              label="New construction"
              value={newConstruction}
              onChange={setNewConstruction}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Default insurance premium</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            If your down payment is below 20%, mortgage default insurance is required. Some provinces charge
            PST on the premium itself, payable at closing.
          </p>
          <div className="mt-3 space-y-3">
            <SelectField
              label="Is mortgage default insurance included?"
              value={insuredKnown}
              onChange={setInsuredKnown}
              options={["Yes", "No", "Not sure"] as const}
            />
            {insuredKnown === "Yes" && (
              <NumField
                label="Default insurance premium amount"
                prefix="$"
                step={100}
                value={insurancePremium}
                onChange={setInsurancePremium}
                hint={
                  province.premiumTaxRate > 0
                    ? `${province.name} charges ${(province.premiumTaxRate * 100).toFixed(0)}% PST on the premium.`
                    : "No provincial premium tax in this province."
                }
              />
            )}
            {insuredKnown === "Not sure" && (
              <p className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                This may apply if your mortgage is insured. approvU can confirm after reviewing your application.
              </p>
            )}
          </div>
        </section>

        <AdvancedAssumptions
          assumptions={assumptions}
          setAssumptions={setAssumptions}
          variant="Purchase"
        />
      </div>

      {/* Results */}
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Your estimated closing costs</h2>
          <ErrorList errors={errors} />
          <div className="mt-2">
            <ResultRow label={`${province.name} land transfer tax`} value={fmtMoney(provincialLTT)} />
            {provincialRebate > 0 && (
              <ResultRow label="First-time buyer rebate (provincial)" value={`- ${fmtMoney(provincialRebate)}`} tone="mint" />
            )}
            {municipalLTT > 0 && (
              <ResultRow label="Toronto municipal land transfer tax" value={fmtMoney(municipalLTT)} />
            )}
            {municipalRebate > 0 && (
              <ResultRow label="First-time buyer rebate (Toronto)" value={`- ${fmtMoney(municipalRebate)}`} tone="mint" />
            )}
            <ResultRow label="Legal fees" value={fmtMoney(assumptions.legalFee)} />
            <ResultRow label="Title insurance" value={fmtMoney(assumptions.titleInsurance)} />
            <ResultRow label="Appraisal fee" value={fmtMoney(assumptions.appraisalFee)} />
            <ResultRow label="Home inspection" value={fmtMoney(assumptions.inspectionFee)} />
            <ResultRow label="Registration fees" value={fmtMoney(assumptions.registrationFee)} />
            {assumptions.lenderAdminFee > 0 && (
              <ResultRow label="Lender / admin fee" value={fmtMoney(assumptions.lenderAdminFee)} />
            )}
            {premiumTax > 0 && (
              <ResultRow label="Default insurance premium tax" value={fmtMoney(premiumTax)} />
            )}
            <ResultRow label="Property tax / utility adjustments" value={fmtMoney(assumptions.adjustmentBuffer)} />
            {assumptions.otherCosts > 0 && (
              <ResultRow label="Other estimated costs" value={fmtMoney(assumptions.otherCosts)} />
            )}
            <ResultRow label="Total estimated closing costs" value={fmtMoney(totalClosing)} tone="primary" />
          </div>
          {firstTime === "Yes" && province.firstTimeBuyerRebateMax === 0 && (
            <p className="mt-3 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
              {province.name} does not currently offer a first-time home buyer LTT rebate.
            </p>
          )}
          {firstTime === "Not sure" && (
            <p className="mt-3 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
              We did not apply a rebate because eligibility is uncertain.
            </p>
          )}
          {province.notes && (
            <p className="mt-3 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">{province.notes}</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Estimated cash needed at closing</h2>
          <ResultRow label="Down payment" value={fmtMoney(downPayment)} />
          <ResultRow label="Estimated closing costs" value={fmtMoney(totalClosing)} />
          {assumptions.movingCost > 0 && <ResultRow label="Moving cost" value={fmtMoney(assumptions.movingCost)} />}
          <div className="mt-4">
            <HeroResult
              label="Total estimated cash required"
              value={fmtMoney(totalCash)}
              sub={`Mortgage amount: ${fmtMoney(mortgage)} · ${province.name}${isToronto && provinceCode === "ON" ? " · Toronto" : ""}`}
            />
          </div>
          <CtaRow
            onSave={() =>
              saveScenario({
                tool: "Closing Cost Estimator",
                name: `Purchase · ${fmtMoney(price)} · ${province.name}`,
                inputs: { price, downPayment, mortgage, provinceCode, city, isToronto, firstTime, newConstruction, propertyType, propertyUsage, insuredKnown, insurancePremium, assumptions },
                outputs: { provincialLTT, municipalLTT, provincialRebate, municipalRebate, premiumTax, totalClosing, totalCash },
              })
            }
          />
        </section>
      </div>
    </div>
  );
}

// ─── REFINANCE ──────────────────────────────────────────────────────────
function RefinanceEstimator() {
  const [provinceCode, setProvinceCode] = useState("ON");
  const province = useMemo(
    () => PROVINCES.find((p) => p.code === provinceCode) ?? PROVINCES[0],
    [provinceCode],
  );
  const [city, setCity] = useState("Toronto");
  const [propertyValue, setPropertyValue] = useState(900000);
  const [currentBalance, setCurrentBalance] = useState(500000);
  const [newMortgage, setNewMortgage] = useState(650000);
  const [currentLender, setCurrentLender] = useState("");
  const [newLenderKnown, setNewLenderKnown] = useState<YesNoUnsure>("No");
  const [dischargeRequired, setDischargeRequired] = useState<YesNoUnsure>("Yes");
  const [appraisalRequired, setAppraisalRequired] = useState<YesNoUnsure>("Yes");
  const [titleInsRequired, setTitleInsRequired] = useState<YesNoUnsure>("Yes");
  const [legalRequired, setLegalRequired] = useState<YesNoUnsure>("Yes");

  const cashOut = Math.max(0, newMortgage - currentBalance);

  const [assumptions, setAssumptions] = useState<Assumptions>(makeAssumptions(province));
  useEffect(() => setAssumptions(makeAssumptions(province)), [province]);

  const legal = legalRequired === "Yes" ? assumptions.legalFee : 0;
  const title = titleInsRequired === "Yes" ? assumptions.titleInsurance : 0;
  const appraisal = appraisalRequired === "Yes" ? assumptions.appraisalFee : 0;
  const discharge = dischargeRequired === "Yes" ? assumptions.dischargeFee : 0;

  const totalRefiCosts =
    legal +
    title +
    appraisal +
    discharge +
    assumptions.registrationFee +
    assumptions.lenderAdminFee +
    assumptions.otherCosts;

  const netProceeds = cashOut - totalRefiCosts;

  const errors: string[] = [];
  if (!provinceCode) errors.push("Please select your province.");
  if (propertyValue <= 0) errors.push("Please enter your current property value.");
  if (currentBalance < 0) errors.push("Please enter your current mortgage balance.");
  if (newMortgage <= 0) errors.push("Please enter your new mortgage amount.");
  if (newMortgage > propertyValue) errors.push("New mortgage amount looks higher than the property value.");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Refinance details</h2>
          <div className="space-y-3">
            <SelectField label="Province" value={provinceCode} onChange={setProvinceCode} options={PROVINCE_OPTIONS} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground">City / municipality</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <NumField label="Property value" prefix="$" step={1000} value={propertyValue} onChange={setPropertyValue} />
            <NumField label="Current mortgage balance" prefix="$" step={1000} value={currentBalance} onChange={setCurrentBalance} />
            <NumField label="New mortgage amount" prefix="$" step={1000} value={newMortgage} onChange={setNewMortgage} />
            <NumField label="Cash-out (auto-calculated)" prefix="$" value={cashOut} onChange={() => {}} hint="Equal to new mortgage minus current balance." />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground">Current lender</span>
              <input
                type="text"
                value={currentLender}
                onChange={(e) => setCurrentLender(e.target.value)}
                placeholder="e.g. RBC"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <SelectField label="New lender known?" value={newLenderKnown} onChange={setNewLenderKnown} options={["Yes", "No", "Not sure"] as const} />
            <SelectField label="Mortgage discharge required?" value={dischargeRequired} onChange={setDischargeRequired} options={["Yes", "No", "Not sure"] as const} />
            <SelectField label="Appraisal required?" value={appraisalRequired} onChange={setAppraisalRequired} options={["Yes", "No", "Not sure"] as const} />
            <SelectField label="Title insurance required?" value={titleInsRequired} onChange={setTitleInsRequired} options={["Yes", "No", "Not sure"] as const} />
            <SelectField label="Legal representation required?" value={legalRequired} onChange={setLegalRequired} options={["Yes", "No", "Not sure"] as const} />
          </div>
        </section>

        <AdvancedAssumptions assumptions={assumptions} setAssumptions={setAssumptions} variant="Refinance" />
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Your estimated refinance costs</h2>
          <ErrorList errors={errors} />
          <div className="mt-2">
            <ResultRow label="Legal fees" value={fmtMoney(legal)} />
            <ResultRow label="Title insurance" value={fmtMoney(title)} />
            <ResultRow label="Appraisal fee" value={fmtMoney(appraisal)} />
            <ResultRow label="Mortgage discharge fee" value={fmtMoney(discharge)} />
            <ResultRow label="Registration fee" value={fmtMoney(assumptions.registrationFee)} />
            {assumptions.lenderAdminFee > 0 && <ResultRow label="Lender / admin fee" value={fmtMoney(assumptions.lenderAdminFee)} />}
            {assumptions.otherCosts > 0 && <ResultRow label="Other estimated costs" value={fmtMoney(assumptions.otherCosts)} />}
            <ResultRow label="Total estimated refinance costs" value={fmtMoney(totalRefiCosts)} tone="primary" />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Estimated refinance summary</h2>
          <ResultRow label="New mortgage amount" value={fmtMoney(newMortgage)} />
          <ResultRow label="Current mortgage balance" value={fmtMoney(currentBalance)} />
          <ResultRow label="Estimated cash-out" value={fmtMoney(cashOut)} />
          <ResultRow label="Estimated refinance costs" value={fmtMoney(totalRefiCosts)} />
          <div className="mt-4">
            <HeroResult
              label="Net estimated proceeds after costs"
              value={fmtMoney(netProceeds)}
              sub={`${province.name} · ${city || "—"}`}
            />
          </div>
          <CtaRow
            onSave={() =>
              saveScenario({
                tool: "Closing Cost Estimator",
                name: `Refinance · ${fmtMoney(newMortgage)} · ${province.name}`,
                inputs: { provinceCode, city, propertyValue, currentBalance, newMortgage, currentLender, newLenderKnown, dischargeRequired, appraisalRequired, titleInsRequired, legalRequired, assumptions },
                outputs: { cashOut, totalRefiCosts, netProceeds },
              })
            }
          />
        </section>
      </div>
    </div>
  );
}

// ─── RENEWAL / SWITCH ───────────────────────────────────────────────────
function RenewalSwitchEstimator() {
  const [provinceCode, setProvinceCode] = useState("ON");
  const province = useMemo(
    () => PROVINCES.find((p) => p.code === provinceCode) ?? PROVINCES[0],
    [provinceCode],
  );
  const [city, setCity] = useState("");
  const [currentBalance, setCurrentBalance] = useState(420000);
  const [currentLender, setCurrentLender] = useState("");
  const [newLender, setNewLender] = useState(true);
  const [switchOnly, setSwitchOnly] = useState(true);
  const [additionalRequested, setAdditionalRequested] = useState(false);
  const [additionalAmount, setAdditionalAmount] = useState(0);
  const [appraisalRequired, setAppraisalRequired] = useState<YesNoUnsure>("Not sure");
  const [legalRequired, setLegalRequired] = useState<YesNoUnsure>("Not sure");
  const [dischargeExpected, setDischargeExpected] = useState<YesNoUnsure>("Yes");

  const [assumptions, setAssumptions] = useState<Assumptions>(makeAssumptions(province));
  useEffect(() => setAssumptions(makeAssumptions(province)), [province]);

  const discharge = dischargeExpected === "Yes" ? assumptions.dischargeFee : 0;
  const legal = legalRequired === "Yes" ? assumptions.legalFee : 0;
  const appraisal = appraisalRequired === "Yes" ? assumptions.appraisalFee : 0;
  const titleIns = newLender ? assumptions.titleInsurance : 0;

  const totalSwitchCosts =
    discharge +
    legal +
    appraisal +
    titleIns +
    assumptions.registrationFee +
    assumptions.lenderAdminFee +
    assumptions.otherCosts;

  const additional = additionalRequested ? additionalAmount : 0;
  const cashImpact = additional - totalSwitchCosts;

  const errors: string[] = [];
  if (!provinceCode) errors.push("Please select your province.");
  if (currentBalance <= 0) errors.push("Please enter your current mortgage balance.");
  if (additionalRequested && additionalAmount <= 0) errors.push("Enter the additional funds amount, or turn the option off.");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Renewal / switch details</h2>
          <div className="space-y-3">
            <SelectField label="Province" value={provinceCode} onChange={setProvinceCode} options={PROVINCE_OPTIONS} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground">City / municipality</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <NumField label="Current mortgage balance" prefix="$" step={1000} value={currentBalance} onChange={setCurrentBalance} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground">Current lender</span>
              <input
                type="text"
                value={currentLender}
                onChange={(e) => setCurrentLender(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <ToggleField label="Switching to a new lender" value={newLender} onChange={setNewLender} />
            <ToggleField label="Switch / transfer only (no new funds)" value={switchOnly} onChange={(v) => { setSwitchOnly(v); if (v) setAdditionalRequested(false); }} />
            <ToggleField label="Additional funds requested" value={additionalRequested} onChange={(v) => { setAdditionalRequested(v); if (v) setSwitchOnly(false); }} />
            {additionalRequested && (
              <NumField label="Additional funds amount" prefix="$" step={1000} value={additionalAmount} onChange={setAdditionalAmount} />
            )}
            <SelectField label="Appraisal required?" value={appraisalRequired} onChange={setAppraisalRequired} options={["Yes", "No", "Not sure"] as const} />
            <SelectField label="Legal work required?" value={legalRequired} onChange={setLegalRequired} options={["Yes", "No", "Not sure"] as const} />
            <SelectField label="Discharge fee expected?" value={dischargeExpected} onChange={setDischargeExpected} options={["Yes", "No", "Not sure"] as const} />
          </div>
        </section>

        <AdvancedAssumptions assumptions={assumptions} setAssumptions={setAssumptions} variant="Renewal / Switch" />
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Your estimated switch / renewal costs</h2>
          <ErrorList errors={errors} />
          <div className="mt-2">
            <ResultRow label="Discharge / assignment fee" value={fmtMoney(discharge)} />
            <ResultRow label="Legal fee" value={fmtMoney(legal)} />
            <ResultRow label="Appraisal fee" value={fmtMoney(appraisal)} />
            <ResultRow label="Title insurance" value={fmtMoney(titleIns)} />
            <ResultRow label="Registration fee" value={fmtMoney(assumptions.registrationFee)} />
            {assumptions.lenderAdminFee > 0 && <ResultRow label="Lender / admin fee" value={fmtMoney(assumptions.lenderAdminFee)} />}
            {assumptions.otherCosts > 0 && <ResultRow label="Other estimated costs" value={fmtMoney(assumptions.otherCosts)} />}
            <ResultRow label="Total estimated switch / renewal costs" value={fmtMoney(totalSwitchCosts)} tone="primary" />
          </div>
          {!newLender && (
            <p className="mt-3 rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
              Renewing with your current lender is typically free. Costs above only apply if you negotiate or switch.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Switch / renewal cost summary</h2>
          <ResultRow label="Current balance" value={fmtMoney(currentBalance)} />
          <ResultRow label="Additional funds requested" value={fmtMoney(additional)} />
          <ResultRow label="Estimated switch / renewal costs" value={fmtMoney(totalSwitchCosts)} />
          <div className="mt-4">
            <HeroResult
              label={cashImpact >= 0 ? "Estimated proceeds" : "Estimated cash required"}
              value={fmtMoney(Math.abs(cashImpact))}
              sub={`${province.name}${city ? ` · ${city}` : ""}`}
            />
          </div>
          <CtaRow
            onSave={() =>
              saveScenario({
                tool: "Closing Cost Estimator",
                name: `Renewal · ${fmtMoney(currentBalance)} · ${province.name}`,
                inputs: { provinceCode, city, currentBalance, currentLender, newLender, switchOnly, additionalRequested, additionalAmount, appraisalRequired, legalRequired, dischargeExpected, assumptions },
                outputs: { totalSwitchCosts, cashImpact },
              })
            }
          />
        </section>
      </div>
    </div>
  );
}

// ─── Shared CTA row ─────────────────────────────────────────────────────
function CtaRow({ onSave }: { onSave: () => void }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button
        onClick={onSave}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Save scenario
      </button>
      <Link
        to="/pre-purchase"
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Start Mortgage Snapshot
      </Link>
      <Link
        to="/internal/full-application"
        className="inline-flex items-center gap-1.5 rounded-md border border-secondary/40 bg-secondary/5 px-3.5 py-2 text-xs font-semibold text-secondary hover:bg-secondary/10"
      >
        Use these numbers in my application
      </Link>
    </div>
  );
}
