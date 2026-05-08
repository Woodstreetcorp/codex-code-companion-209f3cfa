import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  ChevronDown,
  CircleDollarSign,
  Compass,
  CreditCard,
  FileText,
  Gift,
  Home,
  Info,
  MapPin,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { type FlowKey, type MortgageEntry, type Question, flows } from "@/lib/flows";
import { formatCAD, ltv, parseCurrency } from "@/lib/calculations";
import {
  classifyLane,
  classifyPrimeSubtype,
  classifyAlternative,
  getMinimumDownPaymentPolicy,
  laneLabel,
  mapUsage,
  programLaneLabel,
  type TransactionType,
} from "@/lib/policy";
import { SnapshotShareSection } from "@/components/SnapshotShare";

type AnswerValue = string | string[] | MortgageEntry[];
type Answers = Record<string, AnswerValue>;

// ---------- Derivations ----------

type LendingPath = "Prime Fit" | "Alternative Fit" | "Needs Tailored Review";
type CreditPosition =
  | "Strong Prime Position"
  | "Prime Position"
  | "Alternative Position"
  | "Needs Review";
type MortgageCategory = "Insured" | "Insurable" | "Uninsurable" | "Refinance" | "Confirming";

function getCreditScore(a: Answers): number {
  const v = a.credit;
  return typeof v === "string" ? parseInt(v.replace(/\D/g, ""), 10) || 0 : 0;
}

// ---------- Effective price/down helpers (handles pre-purchase) ----------

function priceRangeMidpoint(v?: string): number {
  switch (v) {
    case "u400":
      return 350_000;
    case "400-600":
      return 500_000;
    case "600-900":
      return 750_000;
    case "900-1.2":
      return 1_050_000;
    case "1.2-1.5":
      return 1_350_000;
    case "1.5+":
      return 1_700_000;
    default:
      return 0;
  }
}

function getEffectivePrice(a: Answers): number {
  const direct = parseCurrency(a.price as string);
  if (direct > 0) return direct;
  const specific = parseCurrency(a.specificPrice as string);
  if (specific > 0) return specific;
  return priceRangeMidpoint(a.priceRange as string | undefined);
}

function getEffectiveDown(a: Answers): number {
  const direct = parseCurrency(a.down as string);
  if (direct > 0) return direct;
  return parseCurrency(a.savedDown as string);
}

function getCreditPosition(score: number): CreditPosition {
  if (score >= 700) return "Strong Prime Position";
  if (score >= 620) return "Prime Position";
  if (score >= 500) return "Alternative Position";
  return "Needs Review";
}

function getCreditRange(score: number): string {
  if (score >= 620) return "Prime Range (620–900)";
  if (score >= 500) return "Alternative Range (500–619)";
  return "Below 500";
}

function getIncomeProfile(a: Answers): string {
  const income = a.income as string | undefined;
  const verify = a.selfVerify as string | undefined;
  switch (income) {
    case "employed":
      return "Employed";
    case "self":
      if (verify === "tax") return "Self-employed • Tax documents";
      if (verify === "bank") return "Self-employed • Bank statements";
      return "Self-employed";
    case "other":
      return "Other income";
    case "combo":
      return "Mixed income";
    default:
      return "—";
  }
}

function getLendingPath(a: Answers): LendingPath {
  const score = getCreditScore(a);
  const price = getEffectivePrice(a);
  const down = getEffectiveDown(a);
  let meetsMin = true;
  if (price > 0) {
    const policy = getMinimumDownPaymentPolicy({
      property_usage: mapUsage(a.use as string | undefined),
      property_value: price,
      unit_count: Number(a.units) || 1,
      down_payment_amount: down || undefined,
    });
    meetsMin = down === 0 || down >= policy.minimum_down_payment_amount;
  }
  const lane = classifyLane({
    credit_score: score,
    income_type: a.income as string | undefined,
    income_verification: a.selfVerify as string | undefined,
    meets_minimum_dp: meetsMin,
  });
  // If lane is Alternative, run the Alternative classifier so its DP/LTV
  // rules can downgrade the path to TAILORED_REVIEW when applicable.
  if (lane === "ALTERNATIVE_FIT") {
    const alt = classifyAlternative(buildAlternativeInput(a));
    return laneLabel(alt.lending_path) as LendingPath;
  }
  return laneLabel(lane) as LendingPath;
}

function buildAlternativeInput(a: Answers) {
  const score = getCreditScore(a);
  const price = getEffectivePrice(a);
  const down = getEffectiveDown(a);
  const value = parseCurrency(a.value as string);
  const isRefi = !!a.value || !!a.mortgages;
  const transaction_type: TransactionType = isRefi
    ? "REFINANCE"
    : a.priceRange || a.savedDown || a.specificPrice
      ? "PRE_PURCHASE"
      : "PURCHASE";
  const dpPct = price > 0 && down > 0 ? +((down / price) * 100).toFixed(2) : undefined;
  let estLtv: number | undefined;
  if (isRefi && value > 0 && Array.isArray(a.mortgages)) {
    const balance = (a.mortgages as MortgageEntry[]).reduce(
      (s, m) => s + parseCurrency(m.balance),
      0,
    );
    const cashOut = parseCurrency(a.cashAmount as string);
    estLtv = +(((balance + cashOut) / value) * 100).toFixed(1);
  }
  return {
    credit_score: score,
    income_type: a.income as string | undefined,
    income_verification: a.selfVerify as string | undefined,
    transaction_type,
    down_payment_percent: dpPct,
    estimated_ltv: estLtv,
    product_match_count: 1,
  };
}

function getMortgageCategory(flowKey: FlowKey, a: Answers): MortgageCategory {
  if (flowKey === "refinance") return "Refinance";
  const price = getEffectivePrice(a);
  const down = getEffectiveDown(a);
  if (!price) return "Insurable";
  const policy = getMinimumDownPaymentPolicy({
    property_usage: mapUsage(a.use as string | undefined),
    property_value: price,
    unit_count: Number(a.units) || 1,
    down_payment_amount: down || undefined,
  });
  return programLaneLabel(policy.program_lane ?? "INSURABLE") as MortgageCategory;
}

function getNextStep(path: LendingPath): string {
  if (path === "Prime Fit") return "Unlock mortgage options";
  if (path === "Alternative Fit") return "Review options with a broker";
  return "Continue to full review";
}

function getBundleName(flowKey: FlowKey, a: Answers): string {
  if (flowKey === "refinance") return "Refinance Advantage Bundle";
  const use = a.use as string | undefined;
  const firstTime = a.firstTime as string | undefined;
  if (use === "rental") return "Investor Advantage Bundle";
  if (firstTime === "yes") return "SmartStart Bundle";
  return "Stability Plus Bundle";
}

// ---------- Tone helpers ----------

type Tone = "primary" | "secondary" | "accent" | "yellow" | "mint";
const toneClass: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  accent: "bg-accent/10 text-accent border-accent/30",
  yellow: "bg-yellow/20 text-foreground border-yellow/40",
  mint: "bg-mint/15 text-foreground border-mint/30",
};

function pathTone(p: LendingPath): Tone {
  return p === "Prime Fit" ? "primary" : p === "Alternative Fit" ? "secondary" : "yellow";
}
function categoryTone(c: MortgageCategory): Tone {
  return c === "Insured"
    ? "secondary"
    : c === "Insurable"
      ? "primary"
      : c === "Uninsurable"
        ? "yellow"
        : c === "Confirming"
          ? "secondary"
          : "mint";
}
function creditTone(p: CreditPosition): Tone {
  return p === "Strong Prime Position" || p === "Prime Position"
    ? "primary"
    : p === "Alternative Position"
      ? "secondary"
      : "yellow";
}

// ---------- Main component ----------

export function MortgageSnapshot({
  flowKey,
  answers,
  visible,
  onEdit,
}: {
  flowKey: FlowKey;
  answers: Answers;
  visible: Question[];
  onEdit: () => void;
}) {
  if (flowKey === "refinance") {
    return <RefinanceSnapshot answers={answers} visible={visible} onEdit={onEdit} />;
  }
  return <PurchaseSnapshot flowKey={flowKey} answers={answers} visible={visible} onEdit={onEdit} />;
}

// ---------- Purchase / Pre-purchase ----------

function PurchaseSnapshot({
  flowKey,
  answers,
  visible,
  onEdit,
}: {
  flowKey: FlowKey;
  answers: Answers;
  visible: Question[];
  onEdit: () => void;
}) {
  const score = getCreditScore(answers);
  const path = getLendingPath(answers);
  const baseCategory = getMortgageCategory(flowKey, answers);
  const category: MortgageCategory =
    path === "Alternative Fit" ? "Confirming" : baseCategory;
  const primeSubtype = classifyPrimeSubtype({
    credit_score: score,
    income_type: answers.income as string | undefined,
    income_verification: answers.selfVerify as string | undefined,
    meets_minimum_dp: true,
  });
  const altResult =
    path === "Alternative Fit"
      ? classifyAlternative(buildAlternativeInput(answers))
      : null;
  const creditPosition = getCreditPosition(score);
  const incomeProfile = getIncomeProfile(answers);
  const nextStep = getNextStep(path);

  const price =
    parseCurrency(answers.price as string) || parseCurrency(answers.savedDown as string) * 0;
  const down = parseCurrency(answers.down as string);
  const loan = price > down ? price - down : price;
  const lvr = price > 0 && loan > 0 ? ltv(loan, price) : 0;
  const usage = (answers.use as string) ?? "primary";

  const interpretation =
    path === "Prime Fit"
      ? "Your credit and income profile appear aligned with Prime mortgage programs. You may be able to view available mortgage options after creating your account."
      : path === "Alternative Fit"
        ? "Your profile appears aligned with Alternative lending programs designed for borrowers with transitional income or credit situations. A licensed broker can help you review available paths and next steps."
        : "Your profile may require a more personalized review before matching you with lender options. This helps ensure your file is reviewed accurately.";

  const showBundle = path !== "Needs Tailored Review";
  const bundleName = getBundleName(flowKey, answers);

  const heroHeadline =
    path === "Prime Fit"
      ? "You're matched to a Prime lending path"
      : path === "Alternative Fit"
        ? "You're matched to an Alternative lending path"
        : "Your file needs a tailored review";
  const heroTone: Tone = pathTone(path);
  const heroBg =
    heroTone === "primary"
      ? "border-primary/25 bg-gradient-to-br from-primary/8 via-card to-secondary/8"
      : heroTone === "secondary"
        ? "border-secondary/30 bg-gradient-to-br from-secondary/10 via-card to-primary/5"
        : "border-yellow/50 bg-gradient-to-br from-yellow/15 via-card to-accent/5";

  return (
    <SnapshotShell
      title="Your Mortgage Snapshot"
      subtitle="Based on what you shared, here is your likely mortgage path and next best step."
      onEdit={onEdit}
    >
      {/* Hero summary cards */}
      <section className={`rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8 ${heroBg}`}>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-secondary">
          <Sparkles className="h-3.5 w-3.5" />
          Snapshot ready
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {heroHeadline}
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
          <SummaryCard
            icon={<Compass className="h-4 w-4" />}
            label="Likely Lending Path"
            value={path}
            tone={pathTone(path)}
          />
          <SummaryCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Mortgage Category"
            value={category}
            tone={categoryTone(category)}
          />
          <SummaryCard
            icon={<CreditCard className="h-4 w-4" />}
            label="Credit Position"
            value={creditPosition}
            tone={creditTone(creditPosition)}
          />
          <SummaryCard
            icon={<Briefcase className="h-4 w-4" />}
            label="Income Profile"
            value={incomeProfile}
            tone="secondary"
          />
          <SummaryCard
            icon={<ArrowRight className="h-4 w-4" />}
            label="Next Step"
            value={nextStep}
            tone="accent"
          />
        </div>

        <div className="mt-6 rounded-xl bg-card/70 p-5 ring-1 ring-border/60 backdrop-blur">
          <p className="text-sm leading-relaxed text-foreground">{interpretation}</p>
          {primeSubtype && (
            <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/80">
              Internal classification: {primeSubtype === "PRIME_PLUS" ? "Prime-Plus" : "Standard-Prime"}
            </p>
          )}
          {altResult && altResult.alternative_class && (
            <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/80">
              Internal classification:{" "}
              {altResult.alternative_class === "ALTERNATIVE_PLUS"
                ? "Alternative-Plus"
                : "Standard-Alternative"}
              {altResult.alternative_structure
                ? ` · ${
                    altResult.alternative_structure === "CONFIRMING_ALTERNATIVE"
                      ? "Confirming"
                      : "Non-confirming"
                  }`
                : ""}
              {altResult.max_ltv ? ` · Max LTV ${altResult.max_ltv}%` : ""}
            </p>
          )}
        </div>

        <WhatThisMeans />
      </section>

      {/* Two-column supporting cards */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <RequestCard flowKey={flowKey} answers={answers} category={category} />
        <CreditPositionCard score={score} position={creditPosition} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <IncomeVerificationCard answers={answers} />
        {showBundle ? (
          <BundleCard name={bundleName} />
        ) : (
          <TailoredBundlePlaceholder />
        )}
      </section>

      {/* Review your answers */}
      <ReviewAnswers visible={visible} answers={answers} onEdit={onEdit} />

      {/* Save / share / act */}
      <SnapshotShareSection onEdit={onEdit} />

      {/* CTA */}
      <BottomCTA path={path} />

      {/* Hidden vars for QA only — referenced to keep TS happy */}
      <span className="hidden">{lvr}{usage}</span>
    </SnapshotShell>
  );
}

// ---------- Refinance ----------

function RefinanceSnapshot({
  answers,
  visible,
  onEdit,
}: {
  answers: Answers;
  visible: Question[];
  onEdit: () => void;
}) {
  const value = parseCurrency(answers.value as string);
  const mortgages = (Array.isArray(answers.mortgages)
    ? (answers.mortgages as MortgageEntry[]).filter((m) => typeof m === "object")
    : []) as MortgageEntry[];
  const balance = mortgages.reduce((s, m) => s + parseCurrency(m.balance), 0);
  const cashOut = parseCurrency(answers.cashAmount as string);
  const requested = balance + cashOut;
  const maxAllowed = value * 0.8;
  const lvr = value > 0 ? +((requested / value) * 100).toFixed(1) : 0;
  const withinLimit = requested <= maxAllowed && value > 0;
  const availableEquity = Math.max(maxAllowed - balance, 0);

  const creditPath = getLendingPath(answers);
  // For above-limit requests, the snapshot path is always Tailored Review,
  // regardless of credit. For within-limit, fall back to credit-derived path.
  const refinancePath: LendingPath = withinLimit ? creditPath : "Needs Tailored Review";

  // Reusable building blocks ----------------------------------------------
  const outcomeCard = (
    <OutcomeCard
      withinLimit={withinLimit}
      hasNumbers={value > 0 || requested > 0}
    />
  );
  const pathCard = (
    <RefinancePathCard withinLimit={withinLimit} path={refinancePath} />
  );
  const ctaCard = <RefinanceCTACard withinLimit={withinLimit} />;

  const requestCard = (
    <Card title="Your Refinance Request" icon={<FileText className="h-4 w-4" />}>
      <Row label="Property Value" value={value ? formatCAD(value) : "—"} />
      <Row
        label="Existing Mortgage Balance(s)"
        value={balance ? formatCAD(balance) : "—"}
      />
      <Row label="Cash-Out Requested" value={cashOut ? formatCAD(cashOut) : "—"} />
      <Row
        label="Total New Loan Requested"
        value={requested ? formatCAD(requested) : "—"}
        emphasis
      />
      <Row label="Property Use" value={prettifyUse(answers.use as string)} />
      <Row
        label="Property Type"
        value={prettifyType(answers.propertyType as string)}
      />
      <Row label="Program Lane" value="Uninsurable" />
      <Row
        label="Refinance Status"
        value={
          value === 0 && requested === 0
            ? "—"
            : withinLimit
              ? "Within estimated refinance range"
              : "Above estimated refinance range"
        }
      />
      <p className="mt-3 rounded-lg bg-secondary/5 p-3 text-xs text-muted-foreground">
        The total new loan requested includes your existing mortgage balance(s) plus any
        additional cash-out requested.
      </p>
    </Card>
  );

  const equityCard = (
    <Card title="Your Equity Position" icon={<TrendingUp className="h-4 w-4" />}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Property Value" value={value ? formatCAD(value) : "—"} />
        <Metric
          label="Max @ 80% LTV"
          value={value ? formatCAD(maxAllowed) : "—"}
        />
        <Metric
          label="Requested Loan"
          value={requested ? formatCAD(requested) : "—"}
        />
        <Metric label="Estimated LTV" value={lvr ? `${lvr}%` : "—"} />
      </div>
      <div className="mt-5">
        <LtvBar
          value={value}
          maxAllowed={maxAllowed}
          requested={requested}
          withinLimit={withinLimit}
        />
      </div>
      <div className="mt-4">
        <Pill tone={withinLimit ? "secondary" : "yellow"}>
          {withinLimit ? "Within refinance range" : "Above estimated refinance range"}
        </Pill>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        In many refinance scenarios, lenders review the total mortgage balance against the
        property value. If the requested loan amount is above the typical maximum, the
        request may need to be adjusted or reviewed more closely.
      </p>
    </Card>
  );

  const meaningCard = (
    <Card title="What This Means" icon={<Info className="h-4 w-4" />}>
      {withinLimit ? (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Based on your property value and current mortgage balances, your refinance
            request appears to fit within the estimated loan-to-value range. Final options
            are still subject to lender review, income qualification, and supporting
            documents.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {[
              "Your requested loan amount fits within the estimated refinance range",
              "The next review will focus on income, credit, lender fit, and documents",
              "You can continue to review possible refinance options",
            ].map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your requested refinance amount appears to be above the estimated maximum loan
            amount for this property. This does not mean there are no options. It means the
            cash-out request, property value, mortgage balance, or refinance structure may
            need a closer review.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {[
              "Your current mortgage balance appears higher than the estimated 80% refinance range",
              "Additional cash-out may not be available under a standard refinance structure",
              "A broker may review whether another structure, updated property value, renewal strategy, or tailored lender option is possible",
            ].map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );

  const guidanceCard = (
    <Card
      title={withinLimit ? "Your request looks workable" : "Ways to improve this request"}
      icon={<BadgeCheck className="h-4 w-4" />}
    >
      <ul className="space-y-2 text-sm text-muted-foreground">
        {(withinLimit
          ? [
              "Your loan request fits within the estimated refinance range",
              "The next review will focus on income, debt ratios, and lender fit",
              "You can continue to see possible refinance options",
            ]
          : [
              "Reduce or remove the cash-out request",
              "Review the estimated property value if a stronger appraisal may apply",
              "Confirm the exact mortgage balances on title",
              "Consider a renewal or switch strategy if equity access is not available",
              "Continue for a tailored review if your situation is more complex",
            ]
        ).map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <MiniStat label="Available equity" value={value ? formatCAD(availableEquity) : "—"} />
        <MiniStat
          label="Max standard refinance"
          value={value ? formatCAD(maxAllowed) : "—"}
        />
        <MiniStat
          label="Requested loan"
          value={requested ? formatCAD(requested) : "—"}
          tone={withinLimit ? "secondary" : "yellow"}
        />
      </div>
    </Card>
  );

  const reviewCard = (
    <ReviewAnswers visible={visible} answers={answers} onEdit={onEdit} />
  );

  return (
    <SnapshotShell
      title="Your Refinance Snapshot"
      subtitle="Here's a quick view of your refinance position based on the information you provided."
      onEdit={onEdit}
      trustLine="No obligation • No credit impact at this stage"
    >
      {/* Mobile order: outcome → path → CTA → request → equity → meaning → guidance → review */}
      <div className="space-y-4 lg:hidden">
        {outcomeCard}
        {pathCard}
        {ctaCard}
        {requestCard}
        {equityCard}
        {meaningCard}
        {guidanceCard}
        {reviewCard}
      </div>

      {/* Desktop two-column */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {requestCard}
          {equityCard}
          {meaningCard}
          {guidanceCard}
          {reviewCard}
        </div>
        <aside className="space-y-4">
          <div className="lg:sticky lg:top-6 space-y-4">
            {outcomeCard}
            {pathCard}
            {ctaCard}
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onEdit}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Edit answers
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {!withinLimit && (
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Adjust My Numbers
            </Button>
          )}
          <Button variant="outline">
            {withinLimit ? "Adjust My Numbers" : "Continue for Tailored Review"}
          </Button>
          <Button variant="ghost">Talk to a Broker</Button>
        </div>
      </div>
    </SnapshotShell>
  );
}

function OutcomeCard({
  withinLimit,
  hasNumbers,
}: {
  withinLimit: boolean;
  hasNumbers: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm ${
        withinLimit
          ? "border-secondary/30 bg-secondary/5"
          : "border-yellow/50 bg-yellow/10"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-secondary">
        <Sparkles className="h-3.5 w-3.5" />
        Snapshot Outcome
      </div>
      <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
        {!hasNumbers
          ? "Your snapshot is ready"
          : withinLimit
            ? "You're within the estimated refinance range"
            : "Your request may need adjustment"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {withinLimit
          ? "Based on the property value and mortgage balances provided, your refinance request appears to fit within the estimated loan-to-value range. Final options are still subject to lender review, income qualification, and supporting documents."
          : "Based on the property value and mortgage balances provided, your requested refinance amount appears to be above the estimated refinance range. You may still have options, but the structure may need to be reviewed or adjusted."}
      </p>
      <div className="mt-3">
        <Pill tone={withinLimit ? "secondary" : "yellow"}>
          {withinLimit ? "Within estimated refinance range" : "Above estimated refinance range"}
        </Pill>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        This is not a final approval or decline. A licensed broker can review the details
        and help identify possible paths.
      </p>
    </section>
  );
}

function RefinancePathCard({
  withinLimit,
  path,
}: {
  withinLimit: boolean;
  path: LendingPath;
}) {
  return (
    <Card title="Your Refinance Path" icon={<Compass className="h-4 w-4" />}>
      <Pill tone={pathTone(path)}>{path}</Pill>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {withinLimit
          ? "Your refinance request appears to fit within typical lender ranges. The next step focuses on income, credit, and lender fit."
          : "Your refinance request appears to need a more detailed review because the current mortgage balance and requested cash-out appear to exceed the estimated equity available."}
      </p>
      {!withinLimit && (
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <li>• Current LTV appears above the typical refinance range</li>
          <li>• Available equity appears limited</li>
          <li>• Broker review may help identify restructuring options</li>
        </ul>
      )}
    </Card>
  );
}

function MiniStat({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-lg border p-3 ${toneClass[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

// ---------- Sub-components ----------

function SnapshotShell({
  title,
  subtitle,
  trustLine,
  onEdit,
  children,
}: {
  title: string;
  subtitle: string;
  trustLine?: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {trustLine ?? "This snapshot is not a mortgage approval."}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit} className="hidden sm:inline-flex">
          <ArrowLeft className="mr-1 h-4 w-4" /> Edit answers
        </Button>
      </div>
      {children}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className={`min-w-0 rounded-xl border p-3 sm:p-4 ${toneClass[tone]}`}>
      <p className="break-words text-sm font-bold leading-tight tracking-tight sm:text-base xl:text-lg">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide opacity-75 sm:text-[11px]">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}

function WhatThisMeans() {
  return (
    <details className="group mt-5 rounded-xl border border-border bg-background p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">
        <span className="inline-flex items-center gap-2">
          <Info className="h-4 w-4 text-secondary" /> What this means
        </span>
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li>• Prime programs typically offer the most competitive pricing.</li>
        <li>
          • Alternative programs may offer flexible solutions for transitional income,
          self-employed income, or credit situations.
        </li>
        <li>
          • Tailored Review helps ensure more complex files are reviewed accurately before
          lender matching.
        </li>
      </ul>
    </details>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
        {icon}
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <span className="min-w-0 shrink-0 max-w-[45%] text-sm text-muted-foreground">{label}</span>
      <span
        className={`min-w-0 break-words text-right text-sm ${emphasis ? "font-semibold text-primary" : "font-medium text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

function LtvBar({
  value,
  maxAllowed,
  requested,
  withinLimit = true,
}: {
  value: number;
  maxAllowed: number;
  requested: number;
  withinLimit?: boolean;
}) {
  if (!value) {
    return <div className="h-3 w-full rounded-full bg-muted" aria-hidden />;
  }
  // Scale the bar so we can render values that exceed property value (>100% LTV).
  const reqRatio = requested / value;
  const overage = reqRatio > 1;
  const scale = overage ? reqRatio : 1; // bar width represents `scale × value`
  const valuePct = (1 / scale) * 100;
  const maxPct = (maxAllowed / value / scale) * 100;
  const reqPct = (requested / value / scale) * 100;

  return (
    <div className="space-y-2">
      <div className="relative h-4 w-full rounded-full bg-muted">
        {/* Safe range: 0 → max allowed (80% LTV) */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-full bg-secondary/35"
          style={{ width: `${maxPct}%` }}
        />
        {/* Property value zone: max → property value */}
        <div
          className="absolute inset-y-0 bg-yellow/30"
          style={{ left: `${maxPct}%`, width: `${Math.max(valuePct - maxPct, 0)}%` }}
        />
        {/* Above-property-value zone */}
        {overage && (
          <div
            className="absolute inset-y-0 right-0 rounded-r-full bg-accent/30"
            style={{ left: `${valuePct}%`, right: 0 }}
          />
        )}
        {/* Property value tick */}
        <div
          className="absolute -top-1 h-6 w-px bg-foreground/40"
          style={{ left: `${valuePct}%` }}
          aria-label="Property value"
        />
        {/* Requested loan marker */}
        <div
          className={`absolute -top-1.5 h-7 w-1.5 rounded-full ring-2 ring-background ${
            withinLimit ? "bg-primary" : "bg-accent"
          }`}
          style={{ left: `calc(${reqPct}% - 3px)` }}
          aria-label="Requested loan position"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-secondary/60" />
          Max @ 80% LTV
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow/70" />
          Property value
        </span>
        {overage && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent/60" />
            Above range
          </span>
        )}
        <span className={`inline-flex items-center gap-1.5 font-medium ${withinLimit ? "text-primary" : "text-accent"}`}>
          <span className={`h-2 w-2 rounded-full ${withinLimit ? "bg-primary" : "bg-accent"}`} />
          Requested
        </span>
      </div>
    </div>
  );
}

// ---------- Purchase supporting cards ----------

function RequestCard({
  flowKey,
  answers,
  category,
}: {
  flowKey: FlowKey;
  answers: Answers;
  category: MortgageCategory;
}) {
  const isPre = flowKey === "pre";
  const price = getEffectivePrice(answers);
  const down = getEffectiveDown(answers);
  const loan = price > down ? price - down : 0;
  const lvr = price > 0 && loan > 0 ? ltv(loan, price) : null;
  const policy = price > 0
    ? getMinimumDownPaymentPolicy({
        property_usage: mapUsage(answers.use as string | undefined),
        property_value: price,
        unit_count: Number(answers.units) || 1,
        down_payment_amount: down || undefined,
      })
    : null;
  const score = getCreditScore(answers);
  const lane = classifyLane({
    credit_score: score,
    income_type: answers.income as string | undefined,
    income_verification: answers.selfVerify as string | undefined,
    meets_minimum_dp: down >= (policy?.minimum_down_payment_amount ?? 0),
  });
  let ruleLabel = policy?.rule_applied_label;
  let minDpAmount = policy?.minimum_down_payment_amount ?? 0;
  let minDpPercent = policy?.minimum_down_payment_percent ?? 0;
  if (price > 0 && lane === "ALTERNATIVE_FIT") {
    const altPct = score < 550 ? 25 : 20;
    minDpAmount = price * (altPct / 100);
    minDpPercent = altPct;
    ruleLabel =
      altPct === 25
        ? "Alternative lender minimum: 25% down for credit below 550"
        : "Alternative lender minimum: 20% down for Alternative-fit borrowers";
  }

  const microcopy =
    category === "Insured"
      ? "Insured mortgages may offer lower rates but include a default insurance premium."
      : category === "Insurable" || category === "Uninsurable"
        ? "Your mortgage category helps determine which lender programs may be available."
        : "";

  return (
    <Card title="Your Mortgage Request" icon={<Wallet className="h-4 w-4" />}>
      <Row label="Property Use" value={prettifyUse(answers.use as string)} />
      {isPre ? (
        <>
          <Row label="Target Price Range" value={prettifyPriceRange(answers.priceRange as string)} />
          <Row
            label="Estimated Property Value"
            value={price ? formatCAD(price) : "—"}
          />
          <Row
            label="Saved Down Payment"
            value={down ? formatCAD(down) : "—"}
          />
          <Row label="Estimated Loan Amount" value={loan ? formatCAD(loan) : "—"} />
          <Row label="Estimated LTV" value={lvr ? `${lvr}%` : "—"} />
        </>
      ) : (
        <>
          <Row label="Purchase Price" value={price ? formatCAD(price) : "—"} />
          <Row label="Down Payment" value={down ? formatCAD(down) : "—"} />
          <Row label="Loan Amount" value={loan ? formatCAD(loan) : "—"} />
          <Row label="Loan-to-Value" value={lvr ? `${lvr}%` : "—"} />
        </>
      )}
      <Row label="Insurance Type" value={category} />
      <Row label="Property Type" value={prettifyType(answers.propertyType as string)} />
      <Row
        label="Property Location"
        value={(answers.address as string) || (answers.location as string) || "—"}
      />
      {policy && (
        <Row label="Rule Applied" value={ruleLabel ?? policy.rule_applied_label} />
      )}
      {policy && minDpAmount > 0 && (
        <Row
          label="Estimated Minimum Down Payment"
          value={`${formatCAD(minDpAmount)} (${minDpPercent}%)`}
        />
      )}
      {microcopy && (
        <p className="mt-3 rounded-lg bg-secondary/5 p-3 text-xs text-muted-foreground">
          {microcopy}
        </p>
      )}
    </Card>
  );
}

function CreditPositionCard({
  score,
  position,
}: {
  score: number;
  position: CreditPosition;
}) {
  const range = getCreditRange(score);
  return (
    <Card title="Credit Position" icon={<CreditCard className="h-4 w-4" />}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Approximate Score</p>
          <p className="mt-1 text-3xl font-semibold text-primary">{score || "—"}</p>
        </div>
        <Pill tone={creditTone(position)}>{position}</Pill>
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Credit Range</span>
          <span className="font-medium text-foreground">{range}</span>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border text-center text-[11px]">
          <div className="border-r border-border bg-mint/15 py-2">
            <p className="font-medium text-foreground">Prime</p>
            <p className="text-muted-foreground">620–900</p>
          </div>
          <div className="border-r border-border bg-yellow/15 py-2">
            <p className="font-medium text-foreground">Alternative</p>
            <p className="text-muted-foreground">500–619</p>
          </div>
          <div className="bg-accent/10 py-2">
            <p className="font-medium text-foreground">Tailored</p>
            <p className="text-muted-foreground">Below 500</p>
          </div>
        </div>
        <p className="text-xs">
          Credit score helps determine program eligibility and pricing. Scores below 500 may
          require a more specialized review and may have fewer available options.
        </p>
      </div>
    </Card>
  );
}

function IncomeVerificationCard({ answers }: { answers: Answers }) {
  const income = answers.income as string | undefined;
  const verify = answers.selfVerify as string | undefined;
  const incomeLabel =
    income === "employed"
      ? "Employed"
      : income === "self"
        ? "Self-employed"
        : income === "other"
          ? "Other income"
          : income === "combo"
            ? "Combination of income sources"
            : "—";
  const verifyLabel =
    income === "employed"
      ? "Standard documentation"
      : verify === "tax"
        ? "Tax documents"
        : verify === "bank"
          ? "Bank statement program"
          : verify === "unsure"
            ? "Not sure"
            : "—";
  const microcopy =
    verify === "bank"
      ? "Bank statement programs are commonly used for self-employed borrowers where traditional tax documents may not reflect the full income picture."
      : verify === "tax"
        ? "Tax documentation may support standard self-employed income verification."
        : "";

  return (
    <Card title="Income Verification Path" icon={<Briefcase className="h-4 w-4" />}>
      <Row label="Income Type" value={incomeLabel} />
      <Row label="Verification Type" value={verifyLabel} />
      {microcopy && (
        <p className="mt-3 rounded-lg bg-secondary/5 p-3 text-xs text-muted-foreground">
          {microcopy}
        </p>
      )}
    </Card>
  );
}

function BundleCard({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-yellow/40 bg-yellow/10 p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Gift className="h-4 w-4" /> You may be eligible for the {name}
      </h3>
      <ul className="mt-4 space-y-2 text-sm text-foreground">
        <li className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-secondary" /> Legal service discount
        </li>
        <li className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-secondary" /> Moving credit
        </li>
        <li className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-secondary" /> Insurance rebate & partner savings
        </li>
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Unlock your mortgage options and bundle savings after creating your account.
      </p>
    </div>
  );
}

function TailoredBundlePlaceholder() {
  return (
    <Card title="Bundle eligibility" icon={<PiggyBank className="h-4 w-4" />}>
      <p className="text-sm text-muted-foreground">
        Your bundle eligibility can be reviewed after your file is assessed.
      </p>
    </Card>
  );
}

// ---------- Review answers ----------

function ReviewAnswers({
  visible,
  answers,
  onEdit,
}: {
  visible: Question[];
  answers: Answers;
  onEdit: () => void;
}) {
  const skip = new Set([
    "income",
    "selfVerify",
    "credit",
    "price",
    "down",
    "value",
    "mortgages",
    "cashAmount",
    "savedDown",
    "priceRange",
    "specificPrice",
    "locations",
  ]);
  const rows = visible
    .filter((q) => !skip.has(q.id))
    .map((q) => ({
      label: shortLabel(q),
      value: prettifyAnswer(q, answers[q.id]),
    }));
  // Add curated rows for clarity
  const score = getCreditScore(answers);
  if (score) rows.push({ label: "Approximate credit score", value: String(score) });
  const incomeProfile = getIncomeProfile(answers);
  if (incomeProfile !== "—") rows.push({ label: "Income profile", value: incomeProfile });

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Review your answers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's a summary of the information you provided.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit answers
        </Button>
      </div>
      <dl className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div
            key={`${r.label}-${i}`}
            className="flex items-start justify-between gap-4 border-b border-border/50 py-2.5"
          >
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className="text-right text-sm font-medium text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function shortLabel(q: Question): string {
  const map: Record<string, string> = {
    use: "Property use",
    firstTime: "First-time home buyer",
    offer: "Accepted offer",
    address: "Property location",
    location: "Property location",
    locations: "Target locations",
    propertyType: "Property type",
    ownsResidence: "Own primary residence",
    intent: "Refinance goal",
    numMortgages: "Mortgages on title",
    wantsEquity: "Wants to access equity",
    cashPurpose: "Funds will be used for",
    units: "Number of units",
    lowerPaymentIntent: "Lower payment goal",
  };
  return map[q.id] ?? q.title;
}

function prettifyAnswer(q: Question, val: AnswerValue | undefined): string {
  if (val == null || val === "") return "—";
  if (q.type === "choice") {
    const v = typeof val === "string" ? val : "";
    return q.options.find((o) => o.value === v)?.label ?? v ?? "—";
  }
  if (q.type === "multi") {
    const arr = Array.isArray(val) ? (val.filter((v) => typeof v === "string") as string[]) : [];
    if (!arr.length) return "—";
    return arr.map((v) => q.options.find((o) => o.value === v)?.label ?? v).join(", ");
  }
  if (q.type === "locations") {
    const arr = Array.isArray(val) ? (val.filter((v) => typeof v === "string") as string[]) : [];
    return arr.length ? arr.join(", ") : "—";
  }
  if (q.type === "currency") return val ? `$${val as string}` : "—";
  return typeof val === "string" ? val : "—";
}

function prettifyUse(v?: string): string {
  if (v === "primary") return "Primary residence";
  if (v === "rental") return "Rental / investment property";
  if (v === "secondary") return "Secondary or vacation home";
  return "—";
}

function prettifyType(v?: string): string {
  if (v === "detached") return "Detached house";
  if (v === "semi") return "Semi-detached / townhouse";
  if (v === "condo") return "Condo apartment";
  if (v === "multi") return "Multi-unit (2–4 units)";
  return "—";
}

function prettifyPriceRange(v?: string): string {
  switch (v) {
    case "u400":
      return "Under $400,000";
    case "400-600":
      return "$400,000 – $600,000";
    case "600-900":
      return "$600,000 – $900,000";
    case "900-1.2":
      return "$900,000 – $1.2M";
    case "1.2-1.5":
      return "$1.2M – $1.5M";
    case "1.5+":
      return "Above $1.5M";
    case "specific":
      return "Specific amount";
    default:
      return "—";
  }
}

// ---------- CTA ----------

function BottomCTA({ path }: { path: LendingPath }) {
  const tailored = path === "Needs Tailored Review";
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-secondary p-6 text-primary-foreground shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold sm:text-2xl">
        {tailored ? "Complete a Tailored Review" : "View Your Mortgage Options"}
      </h2>
      <p className="mt-2 text-sm text-primary-foreground/85">
        {tailored
          ? "Your profile needs a deeper review to match you accurately with the right lender options."
          : "Create your account to see your qualified mortgage products and select your preferred structure."}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          to="/portal"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground shadow hover:bg-accent/90"
        >
          {tailored ? "Continue to Full Review" : "Unlock My Mortgage Options"}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-primary-foreground/30 bg-transparent px-5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10"
        >
          Edit My Inputs
        </button>
        <button className="inline-flex h-11 items-center justify-center rounded-lg px-3 text-sm text-primary-foreground/85 underline-offset-2 hover:underline">
          Talk to a Broker
        </button>
      </div>
      <p className="mt-3 text-xs text-primary-foreground/70">
        This snapshot is not a mortgage approval. {tailored ? "No credit impact at this stage." : "Takes under 30 seconds. No obligation."}
      </p>
    </section>
  );
}

function RefinanceCTACard({ withinLimit }: { withinLimit: boolean }) {
  const primary = withinLimit ? "See My Refinance Options" : "Adjust My Numbers";
  const secondary = withinLimit ? "Adjust My Numbers" : "Continue for Tailored Review";
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-secondary p-6 text-primary-foreground shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary-foreground/80">
        <ArrowRight className="h-3.5 w-3.5" />
        Next Best Step
      </div>
      <h3 className="mt-2 flex items-center gap-2 text-lg font-semibold">
        <CircleDollarSign className="h-4 w-4" />
        {primary}
      </h3>
      <p className="mt-2 text-sm text-primary-foreground/85">
        {withinLimit
          ? "Create your account to view your possible refinance options."
          : "Try adjusting your cash-out amount, or continue for a tailored review with a licensed broker."}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Link
          to="/portal"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground shadow hover:bg-accent/90"
        >
          {primary}
        </Link>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-primary-foreground/30 px-4 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10"
        >
          {secondary}
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm text-primary-foreground/85 underline-offset-2 hover:underline"
        >
          Talk to a Broker
        </button>
      </div>
      <p className="mt-3 text-xs text-primary-foreground/70">
        No obligation. No credit impact at this stage.
      </p>
    </div>
  );
}

// Avoid an unused-import lint failure in case some icons aren't used in current branches
const _unused = { Home, MapPin, flows };
export const __snapshotInternals = _unused;