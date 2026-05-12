import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  HeroResult,
  NumField,
  PAYMENT_FREQS,
  PaymentFreq,
  ResultRow,
  SelectField,
  ToggleField,
  ToolPageShell,
  fmtMoney,
  fmtPct,
  monthlyEquivalent,
  periodicPayment,
  saveScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/rent-vs-buy")({
  head: () => ({
    meta: [
      { title: "Rent vs Buy Calculator — approvU" },
      {
        name: "description",
        content: "Compare the long-term cost of renting versus buying a home.",
      },
    ],
  }),
  component: RentVsBuyCalculatorPage,
});

const PROVINCES = [
  "Ontario", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Quebec",
  "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island",
  "Yukon", "Northwest Territories", "Nunavut",
] as const;
const HORIZON_OPTIONS = ["3 years", "5 years", "7 years", "10 years", "Custom"] as const;
const SCENARIO_GOALS = [
  "Should I keep renting or buy soon?",
  "How much home can I afford compared with rent?",
  "Is buying worth it in the next few years?",
  "I am just exploring",
] as const;
const PROPERTY_TYPES = [
  "Detached", "Semi-detached", "Townhouse", "Condo", "Duplex / multi-unit", "Other",
] as const;
const PROPERTY_USAGES = ["Primary residence", "Rental / investment", "Second home"] as const;
const FTHB = ["Yes", "No", "Not sure"] as const;
const MAINT_MODE = ["Use percentage of home value", "Enter monthly amount manually"] as const;

function RentVsBuyCalculatorPage() {
  // Scenario / horizon
  const [horizonChoice, setHorizonChoice] = useState<(typeof HORIZON_OPTIONS)[number]>("5 years");
  const [horizonYears, setHorizonYears] = useState(5);
  const [scenarioGoal, setScenarioGoal] = useState<(typeof SCENARIO_GOALS)[number]>("Should I keep renting or buy soon?");

  // Renting
  const [rent, setRent] = useState(2500);
  const [rentIncrease, setRentIncrease] = useState(3);
  const [renterInsurance, setRenterInsurance] = useState(30);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [extraUtilities, setExtraUtilities] = useState(0);
  const [monthlyInvest, setMonthlyInvest] = useState(0);

  // Buying
  const [province, setProvince] = useState<(typeof PROVINCES)[number]>("Ontario");
  const [city, setCity] = useState("Toronto");
  const [purchasePrice, setPurchasePrice] = useState(750000);
  const [downPayment, setDownPayment] = useState(75000);
  const [mortgageRate, setMortgageRate] = useState(4.99);
  const [amort, setAmort] = useState(25);
  const [freq, setFreq] = useState<PaymentFreq>("Monthly");
  const [fthb, setFthb] = useState<(typeof FTHB)[number]>("Yes");
  const [propertyType, setPropertyType] = useState<(typeof PROPERTY_TYPES)[number]>("Detached");
  const [propertyUsage, setPropertyUsage] = useState<(typeof PROPERTY_USAGES)[number]>("Primary residence");

  // Ownership costs
  const [annualPropertyTax, setAnnualPropertyTax] = useState(5000);
  const [monthlyCondo, setMonthlyCondo] = useState(0);
  const [monthlyHeat, setMonthlyHeat] = useState(120);
  const [monthlyHomeIns, setMonthlyHomeIns] = useState(120);
  const [maintMode, setMaintMode] = useState<(typeof MAINT_MODE)[number]>("Use percentage of home value");
  const [maintPctAnnual, setMaintPctAnnual] = useState(1);
  const [maintMonthly, setMaintMonthly] = useState(0);
  const [otherOwnership, setOtherOwnership] = useState(0);
  const [closingCostsAtBuy, setClosingCostsAtBuy] = useState(8000);

  // Growth assumptions
  const [growthOpen, setGrowthOpen] = useState(false);
  const [appreciation, setAppreciation] = useState(3);
  const [investReturn, setInvestReturn] = useState(4);
  const [sellingCostPct, setSellingCostPct] = useState(4);

  // Derived
  const mortgageAmount = Math.max(0, purchasePrice - downPayment);
  const dpPct = purchasePrice > 0 ? downPayment / purchasePrice : 0;
  const ltv = purchasePrice > 0 ? mortgageAmount / purchasePrice : 0;

  const mortgagePeriodic = useMemo(
    () => periodicPayment(mortgageAmount, mortgageRate, amort, freq),
    [mortgageAmount, mortgageRate, amort, freq],
  );
  const mortgageMonthly = monthlyEquivalent(mortgagePeriodic, freq);

  const monthlyPropertyTax = annualPropertyTax / 12;
  const monthlyMaintenance =
    maintMode === "Use percentage of home value"
      ? (purchasePrice * (maintPctAnnual / 100)) / 12
      : maintMonthly;

  const monthlyOwnership =
    mortgageMonthly + monthlyPropertyTax + monthlyCondo + monthlyHeat + monthlyHomeIns + monthlyMaintenance + otherOwnership;

  const cashToBuy = downPayment + closingCostsAtBuy;

  // Year-by-year simulation
  const sim = useMemo(() => {
    const months = Math.max(1, horizonYears) * 12;
    const r = mortgageRate / 100 / 12;
    const n = amort * 12;
    const pmt = r === 0 ? mortgageAmount / n : (mortgageAmount * r) / (1 - Math.pow(1 + r, -n));
    let bal = mortgageAmount;
    let totalOwn = 0;
    let totalRent = 0;
    let homeValue = purchasePrice;
    let investBal = (downPayment + closingCostsAtBuy); // opportunity cost
    const annualInvest = investReturn / 100;
    const annualAppr = appreciation / 100;
    const annualRentInc = rentIncrease / 100;
    let curRent = rent;
    const monthlyRentExtras = renterInsurance + (utilitiesIncluded ? 0 : extraUtilities);

    const yearly: { year: number; rentCost: number; ownNetCost: number; equity: number; diff: number }[] = [];
    let cumRent = 0;
    let cumOwnGross = 0;
    let cumOwnExtras = 0; // non-mortgage ownership
    const monthlyOwnershipExtras = monthlyPropertyTax + monthlyCondo + monthlyHeat + monthlyHomeIns + monthlyMaintenance + otherOwnership;

    for (let m = 1; m <= months; m++) {
      // mortgage period
      const ip = bal * r;
      const pp = Math.min(pmt - ip, bal);
      bal = Math.max(0, bal - pp);
      cumOwnGross += pmt + monthlyOwnershipExtras;
      cumOwnExtras += monthlyOwnershipExtras;
      totalOwn = cumOwnGross;

      // rent
      cumRent += curRent + monthlyRentExtras;
      totalRent = cumRent;

      // invest opportunity cost: invest the difference (mortgage costs > rent)
      const diff = (curRent + monthlyRentExtras) - (pmt + monthlyOwnershipExtras);
      // if user inputs explicit monthly investment amount when renting, use that
      const investContribution = monthlyInvest > 0 ? monthlyInvest : Math.max(0, -diff);
      investBal = investBal * (1 + annualInvest / 12) + investContribution;

      if (m % 12 === 0) {
        const year = m / 12;
        homeValue = homeValue * (1 + annualAppr);
        curRent = curRent * (1 + annualRentInc);
        const sellingCosts = homeValue * (sellingCostPct / 100);
        const equity = Math.max(0, homeValue - bal - sellingCosts);
        const ownNet = cumOwnGross - equity;
        const rentNet = cumRent - (investBal - (downPayment + closingCostsAtBuy));
        yearly.push({ year, rentCost: rentNet, ownNetCost: ownNet, equity, diff: rentNet - ownNet });
      }
    }

    const finalHomeValue = homeValue;
    const sellingCosts = finalHomeValue * (sellingCostPct / 100);
    const equity = Math.max(0, finalHomeValue - bal - sellingCosts);
    const ownNet = totalOwn - equity + closingCostsAtBuy;
    const investGrowth = investBal - (downPayment + closingCostsAtBuy);
    const rentNet = totalRent - investGrowth;

    // Break-even year
    const breakEvenYear = yearly.find((y) => y.diff > 0)?.year ?? null;

    return {
      months, finalBal: bal, finalHomeValue, equity, sellingCosts,
      totalOwn, totalRent, ownNet, rentNet, investBal, investGrowth,
      yearly, breakEvenYear,
    };
  }, [
    horizonYears, mortgageRate, amort, mortgageAmount, purchasePrice, downPayment, closingCostsAtBuy,
    investReturn, appreciation, rentIncrease, rent, renterInsurance, utilitiesIncluded, extraUtilities,
    monthlyInvest, monthlyPropertyTax, monthlyCondo, monthlyHeat, monthlyHomeIns, monthlyMaintenance,
    otherOwnership, sellingCostPct,
  ]);

  const netAdvantage = sim.rentNet - sim.ownNet; // positive = buying better
  const monthlyRentTotal = rent + renterInsurance + (utilitiesIncluded ? 0 : extraUtilities);

  // Validation
  const errors: string[] = [];
  if (rent <= 0) errors.push("Please enter your monthly rent.");
  if (purchasePrice <= 0) errors.push("Please enter a target purchase price.");
  if (downPayment <= 0) errors.push("Please enter your down payment.");
  if (mortgageRate <= 0) errors.push("Mortgage rate must be greater than 0.");
  if (horizonYears < 1) errors.push("Time horizon must be at least 1 year.");
  if (downPayment > purchasePrice) errors.push("Down payment cannot be greater than purchase price.");

  const warnings: string[] = [];
  if (monthlyOwnership > monthlyRentTotal * 1.5)
    warnings.push("Your monthly ownership cost is significantly higher than rent.");
  if (dpPct < 0.05) warnings.push("Your down payment is below common minimum requirements (5%).");
  warnings.push("Results may change significantly if home appreciation or investment returns differ.");
  if (horizonYears <= 3 && netAdvantage <= 0)
    warnings.push("Buying may not break even if you plan to move soon.");

  // Signal
  const signal = (() => {
    if (errors.length > 0) return { label: "Add a few details", tone: "muted" as const };
    if (Math.abs(netAdvantage) < 5000)
      return { label: "Results are close — lifestyle factors may matter most", tone: "secondary" as const };
    if (netAdvantage > 0 && sim.breakEvenYear)
      return { label: `Buying may be ahead after ${sim.breakEvenYear} years`, tone: "mint" as const };
    if (netAdvantage > 0)
      return { label: "Buying builds equity but requires higher monthly cash flow", tone: "secondary" as const };
    return { label: "Renting may cost less over this period", tone: "warning" as const };
  })();

  const onReset = () => {
    setHorizonChoice("5 years"); setHorizonYears(5);
    setScenarioGoal("Should I keep renting or buy soon?");
    setRent(2500); setRentIncrease(3); setRenterInsurance(30); setUtilitiesIncluded(false); setExtraUtilities(0); setMonthlyInvest(0);
    setProvince("Ontario"); setCity("Toronto");
    setPurchasePrice(750000); setDownPayment(75000); setMortgageRate(4.99); setAmort(25); setFreq("Monthly");
    setFthb("Yes"); setPropertyType("Detached"); setPropertyUsage("Primary residence");
    setAnnualPropertyTax(5000); setMonthlyCondo(0); setMonthlyHeat(120); setMonthlyHomeIns(120);
    setMaintMode("Use percentage of home value"); setMaintPctAnnual(1); setMaintMonthly(0); setOtherOwnership(0);
    setClosingCostsAtBuy(8000);
    setAppreciation(3); setInvestReturn(4); setSellingCostPct(4);
  };

  const onSave = () =>
    saveScenario({
      tool: "Rent vs Buy Calculator",
      name: `${fmtMoney(rent)} rent vs ${fmtMoney(purchasePrice)} buy · ${horizonYears}y`,
      inputs: {
        horizonYears, scenarioGoal, rent, rentIncrease, renterInsurance, utilitiesIncluded, extraUtilities, monthlyInvest,
        province, city, purchasePrice, downPayment, mortgageRate, amort, freq, fthb, propertyType, propertyUsage,
        annualPropertyTax, monthlyCondo, monthlyHeat, monthlyHomeIns, maintMode, maintPctAnnual, maintMonthly,
        otherOwnership, closingCostsAtBuy, appreciation, investReturn, sellingCostPct,
      },
      outputs: {
        mortgageMonthly, monthlyOwnership, monthlyRentTotal, cashToBuy,
        totalRent: sim.totalRent, totalOwn: sim.totalOwn,
        equity: sim.equity, ownNet: sim.ownNet, rentNet: sim.rentNet, netAdvantage,
        breakEvenYear: sim.breakEvenYear, signal: signal.label,
      },
    });

  return (
    <ToolPageShell
      title="Rent vs Buy Calculator"
      subtitle="Compare the long-term cost of renting versus buying a home."
      bestFor="early-stage buyers"
    >
      <Disclaimer />

      {/* Scenario */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your scenario</p>
          <p className="mt-1 text-sm font-medium text-foreground">How long do you want to compare renting versus buying?</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          {HORIZON_OPTIONS.map((o) => {
            const active = horizonChoice === o;
            return (
              <button
                key={o}
                type="button"
                onClick={() => {
                  setHorizonChoice(o);
                  if (o === "3 years") setHorizonYears(3);
                  else if (o === "5 years") setHorizonYears(5);
                  else if (o === "7 years") setHorizonYears(7);
                  else if (o === "10 years") setHorizonYears(10);
                }}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/40"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
        {horizonChoice === "Custom" && (
          <NumField label="Time horizon (years)" step={1} value={horizonYears} onChange={setHorizonYears} />
        )}
        <SelectField label="What are you trying to decide?" value={scenarioGoal} onChange={setScenarioGoal} options={SCENARIO_GOALS} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        {/* Inputs */}
        <div className="space-y-4">
          <Card title="If you keep renting" subtitle="What renting could look like over your selected period.">
            <NumField label="Current monthly rent" prefix="$" step={25} value={rent} onChange={setRent} />
            <NumField label="Expected annual rent increase" suffix="%" step={0.1} value={rentIncrease} onChange={setRentIncrease} />
            <NumField label="Renter's insurance (optional)" prefix="$" step={5} value={renterInsurance} onChange={setRenterInsurance} />
            <ToggleField label="Utilities included in rent?" value={utilitiesIncluded} onChange={setUtilitiesIncluded} />
            {!utilitiesIncluded && (
              <NumField label="Monthly utilities paid separately" prefix="$" step={10} value={extraUtilities} onChange={setExtraUtilities} />
            )}
            <NumField
              label="Amount you'd invest monthly if renting (optional)"
              prefix="$"
              step={50}
              value={monthlyInvest}
              onChange={setMonthlyInvest}
              hint="If blank, we assume you invest the difference between owning and renting."
            />
          </Card>

          <Card title="If you buy" subtitle="The home and mortgage you're considering.">
            <SelectField label="Province" value={province} onChange={setProvince} options={PROVINCES} />
            <TextField label="City / municipality" value={city} onChange={setCity} placeholder="e.g. Toronto" />
            <NumField label="Target purchase price" prefix="$" step={1000} value={purchasePrice} onChange={setPurchasePrice} />
            <NumField label="Down payment amount" prefix="$" step={1000} value={downPayment} onChange={setDownPayment} hint={`Down payment: ${fmtPct(dpPct * 100)} · Mortgage: ${fmtMoney(mortgageAmount)}`} />
            <NumField label="Mortgage rate" suffix="%" step={0.01} value={mortgageRate} onChange={setMortgageRate} />
            <NumField label="Amortization (years)" step={1} value={amort} onChange={setAmort} />
            <SelectField label="Payment frequency" value={freq} onChange={setFreq} options={PAYMENT_FREQS} />
            <SelectField label="First-time home buyer?" value={fthb} onChange={setFthb} options={FTHB} />
            <SelectField label="Property type" value={propertyType} onChange={setPropertyType} options={PROPERTY_TYPES} />
            <SelectField label="Property usage" value={propertyUsage} onChange={setPropertyUsage} options={PROPERTY_USAGES} />
            <NumField label="Estimated closing costs at purchase" prefix="$" step={500} value={closingCostsAtBuy} onChange={setClosingCostsAtBuy} />

            <div className="grid grid-cols-3 gap-3 pt-1">
              <MiniStat label="Mortgage payment" value={`${fmtMoney(mortgageMonthly)}/mo`} />
              <MiniStat label="Estimated LTV" value={fmtPct(ltv * 100)} />
              <MiniStat label="Cash to buy" value={fmtMoney(cashToBuy)} />
            </div>
          </Card>

          <Card title="Monthly ownership costs" subtitle="Property taxes, condo fees, heating, insurance, and maintenance.">
            <NumField label="Annual property tax" prefix="$" step={50} value={annualPropertyTax} onChange={setAnnualPropertyTax} />
            <NumField label="Monthly condo fee (if applicable)" prefix="$" step={10} value={monthlyCondo} onChange={setMonthlyCondo} />
            <NumField label="Monthly heating cost" prefix="$" step={10} value={monthlyHeat} onChange={setMonthlyHeat} />
            <NumField label="Monthly home insurance" prefix="$" step={5} value={monthlyHomeIns} onChange={setMonthlyHomeIns} />
            <SelectField label="Maintenance estimate" value={maintMode} onChange={setMaintMode} options={MAINT_MODE} />
            {maintMode === "Use percentage of home value" ? (
              <NumField label="Annual maintenance % of home value" suffix="%" step={0.1} value={maintPctAnnual} onChange={setMaintPctAnnual} />
            ) : (
              <NumField label="Monthly maintenance" prefix="$" step={25} value={maintMonthly} onChange={setMaintMonthly} />
            )}
            <NumField label="Other monthly ownership costs" prefix="$" step={10} value={otherOwnership} onChange={setOtherOwnership} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <MiniStat label="Total monthly to own" value={`${fmtMoney(monthlyOwnership)}/mo`} />
              <MiniStat label="Total monthly to rent" value={`${fmtMoney(monthlyRentTotal)}/mo`} />
            </div>
          </Card>

          <Accordion
            open={growthOpen}
            onToggle={() => setGrowthOpen((o) => !o)}
            title="Growth & investment assumptions"
            subtitle="Small changes here can significantly affect the result."
          >
            <NumField label="Expected annual home appreciation" suffix="%" step={0.1} value={appreciation} onChange={setAppreciation} />
            <NumField label="Expected annual investment return if renting" suffix="%" step={0.1} value={investReturn} onChange={setInvestReturn} />
            <NumField label="Expected selling cost (% of sale price)" suffix="%" step={0.1} value={sellingCostPct} onChange={setSellingCostPct} />
          </Accordion>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <section className="lg:sticky lg:top-4 space-y-4">
            <Card title="Rent vs buy estimate">
              <ErrorList errors={errors} />
              {warnings.map((w, i) => (
                <p key={i} className="rounded-lg border border-secondary/30 bg-secondary/5 p-2 text-[11px] text-foreground">
                  {w}
                </p>
              ))}

              <SignalPill signal={signal} />

              <HeroResult
                label={netAdvantage >= 0 ? "Buying may be ahead by" : "Renting may be ahead by"}
                value={fmtMoney(Math.abs(netAdvantage))}
                sub={
                  sim.breakEvenYear
                    ? `Estimated break-even around year ${sim.breakEvenYear} of your ${horizonYears}-year horizon.`
                    : `No break-even within ${horizonYears} years based on these assumptions.`
                }
              />

              <ResultRow label="Monthly cost to rent today" value={`${fmtMoney(monthlyRentTotal)}/mo`} />
              <ResultRow label="Monthly cost to own today" value={`${fmtMoney(monthlyOwnership)}/mo`} />
              <ResultRow label={`Total cost of renting over ${horizonYears}y`} value={fmtMoney(sim.totalRent)} />
              <ResultRow label={`Total cost of owning over ${horizonYears}y`} value={fmtMoney(sim.totalOwn)} />
              <ResultRow label={`Estimated equity after ${horizonYears}y`} value={fmtMoney(sim.equity)} tone="primary" />
              <ResultRow label="Net cost of renting (after invest growth)" value={fmtMoney(sim.rentNet)} />
              <ResultRow label="Net cost of buying (after equity)" value={fmtMoney(sim.ownNet)} />
            </Card>

            <Card title="Rent vs buy breakdown">
              <ComparisonTable
                rows={[
                  { label: "Monthly payment / cost", a: `${fmtMoney(monthlyRentTotal)}/mo`, b: `${fmtMoney(monthlyOwnership)}/mo` },
                  { label: "Upfront cash required", a: fmtMoney(0), b: fmtMoney(cashToBuy) },
                  { label: `Total payments over ${horizonYears}y`, a: fmtMoney(sim.totalRent), b: fmtMoney(sim.totalOwn) },
                  { label: "Insurance / utilities", a: `${fmtMoney(renterInsurance + (utilitiesIncluded ? 0 : extraUtilities))}/mo`, b: `${fmtMoney(monthlyHomeIns + monthlyHeat)}/mo` },
                  { label: "Maintenance", a: "—", b: `${fmtMoney(monthlyMaintenance)}/mo` },
                  { label: "Closing costs", a: "—", b: fmtMoney(closingCostsAtBuy) },
                  { label: "Estimated selling costs", a: "—", b: fmtMoney(sim.sellingCosts) },
                  { label: "Investment growth if renting", a: fmtMoney(sim.investGrowth), b: "—" },
                  { label: "Equity built if buying", a: "—", b: fmtMoney(sim.equity) },
                  { label: "Estimated net cost", a: fmtMoney(sim.rentNet), b: fmtMoney(sim.ownNet) },
                ]}
              />
            </Card>

            <Card title="When buying may break even">
              <div className="space-y-2">
                {sim.yearly.filter((y) => [1, 3, 5, 7, 10].includes(y.year) || y.year === sim.breakEvenYear).map((y) => (
                  <div
                    key={y.year}
                    className={`grid grid-cols-4 gap-2 rounded-xl border p-2 text-[11px] ${
                      y.year === sim.breakEvenYear
                        ? "border-mint/50 bg-mint/10"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="font-semibold text-foreground">Year {y.year}</div>
                    <div className="text-muted-foreground">Rent net <span className="block text-foreground">{fmtMoney(y.rentCost)}</span></div>
                    <div className="text-muted-foreground">Own net <span className="block text-foreground">{fmtMoney(y.ownNetCost)}</span></div>
                    <div className="text-muted-foreground">Equity <span className="block text-foreground">{fmtMoney(y.equity)}</span></div>
                  </div>
                ))}
                {!sim.breakEvenYear && (
                  <p className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                    Buying may not break even within this timeframe based on your assumptions.
                  </p>
                )}
              </div>
            </Card>

            <Card title="Other things to consider">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">Buying may help if</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-foreground">
                    <li>• You plan to stay for several years</li>
                    <li>• You want stability and control</li>
                    <li>• You want to build equity</li>
                    <li>• You can handle maintenance and surprises</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">Renting may help if</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-foreground">
                    <li>• You want flexibility</li>
                    <li>• You may move soon</li>
                    <li>• You want lower upfront cash commitment</li>
                    <li>• You don't want maintenance responsibility</li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onSave}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
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
                Use these numbers in my buying plan
              </Link>
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            </div>
          </section>
        </div>
      </div>

      <HowCalculated />
    </ToolPageShell>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────
function Disclaimer() {
  return (
    <p className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-[11px] text-foreground">
      This is an estimate only. Final results depend on market conditions, mortgage approval, property costs,
      taxes, investment returns, and your personal situation.
    </p>
  );
}

function Card({
  title, subtitle, right, children,
}: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Accordion({
  open, onToggle, title, subtitle, children,
}: { open: boolean; onToggle: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2">{children}</div>}
    </section>
  );
}

function TextField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="rounded-lg border border-coral/40 bg-coral/5 p-3 text-[11px] text-coral">
      {errors.map((e, i) => <li key={i}>• {e}</li>)}
    </ul>
  );
}

function SignalPill({ signal }: { signal: { label: string; tone: "mint" | "secondary" | "warning" | "coral" | "muted" } }) {
  const map = {
    mint: "bg-mint/20 text-foreground border-mint/40",
    secondary: "bg-secondary/15 text-secondary border-secondary/30",
    warning: "bg-amber-100 text-amber-900 border-amber-300",
    coral: "bg-coral/10 text-coral border-coral/40",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${map[signal.tone]}`}>
      <Info className="h-3 w-3" /> {signal.label}
    </div>
  );
}

function ComparisonTable({ rows }: { rows: { label: string; a: string; b: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="py-2 pr-3 font-semibold"></th>
            <th className="py-2 pr-3 font-semibold">Renting</th>
            <th className="py-2 pr-0 font-semibold text-primary">Buying</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60">
              <td className="py-2 pr-3 text-muted-foreground">{r.label}</td>
              <td className="py-2 pr-3 text-foreground">{r.a}</td>
              <td className="py-2 pr-0 font-semibold text-primary">{r.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HowCalculated() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-secondary" />
        <h2 className="text-sm font-semibold text-foreground">How this is calculated</h2>
      </div>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <p>
          This calculator compares the cost of renting with the cost of buying over your selected time period.
          It estimates rent increases, mortgage payments, property costs, closing costs, home appreciation,
          selling costs, equity built, and the possible investment growth of money not used for a down payment.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Mortgage amount = purchase price − down payment</li>
          <li>Monthly ownership cost = mortgage + property tax + condo + heating + insurance + maintenance</li>
          <li>Total rent cost = rent payments over time + renter costs</li>
          <li>Estimated equity = estimated home value − remaining balance − selling costs</li>
          <li>Net buying cost = ownership costs + closing/selling costs − estimated equity</li>
          <li>Net renting cost = rent cost − estimated investment growth</li>
        </ul>
      </div>
    </section>
  );
}
