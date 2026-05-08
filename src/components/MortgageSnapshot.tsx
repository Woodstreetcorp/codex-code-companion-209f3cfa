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
  Check,
  Copy as CopyIcon,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
  Share2,
  Trophy,
  Twitter,
  Users,
  FileText,
  Gift,
  Home,
  Info,
  Scale,
  Activity,
  Lightbulb,
  MapPin,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
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

  const isPre = flowKey === "pre";
  const price = getEffectivePrice(answers);
  const down = getEffectiveDown(answers);
  const loan = price > down ? price - down : price;
  const lvr = price > 0 && loan > 0 ? ltv(loan, price) : 0;

  const interpretation =
    path === "Prime Fit"
      ? "Your credit and income profile appear aligned with Prime mortgage programs. You may be able to view available mortgage options after creating your account."
      : path === "Alternative Fit"
        ? "Your profile appears aligned with Alternative lending programs designed for borrowers with transitional income or credit situations. A licensed broker can help you review available paths and next steps."
        : "Your profile may require a more personalized review before matching you with lender options. This helps ensure your file is reviewed accurately.";

  // Bundle widget removed in favor of full Home Life Offer Bundle section above.

  // The "moment of delight" big number
  const heroBigNumberLabel = isPre
    ? price > 0
      ? "Estimated mortgage you may qualify for"
      : "Your snapshot is ready"
    : loan > 0
      ? "Estimated mortgage amount"
      : "Your snapshot is ready";
  const heroBigNumber = loan > 0 ? formatCAD(loan) : "—";

  const shareText = isPre
    ? `I just mapped out my home-buying path with approvU in 2 minutes — no credit check. ${path === "Prime Fit" ? "Matched to a Prime lending path." : ""}`.trim()
    : loan > 0 && path === "Prime Fit"
      ? `I just got matched to a Prime mortgage path with approvU in 2 minutes — no credit check.`
      : `I just checked my mortgage path with approvU in 2 minutes — no credit check.`;

  return (
    <SnapshotShell
      title={isPre ? "Your Pre-Purchase Snapshot" : "Your Mortgage Snapshot"}
      subtitle={
        isPre
          ? "A quick view of your buying position — built to share, save, and act on."
          : "Your likely mortgage path and next best step — share, save, or unlock options."
      }
      onEdit={onEdit}
      trustLine="No obligation • No credit impact at this stage"
    >
      <PurchaseHero
        path={path}
        category={category}
        creditPosition={creditPosition}
        incomeProfile={incomeProfile}
        bigLabel={heroBigNumberLabel}
        bigValue={heroBigNumber}
        price={price}
        down={down}
        lvr={lvr}
        nextStep={nextStep}
        interpretation={interpretation}
        primeSubtype={primeSubtype}
        altResult={altResult}
        isPre={isPre}
      />

      <HomeLifeOfferBundle variant="purchase" />

      <ShareWinCard
        shareText={shareText}
        headline={
          path === "Prime Fit"
            ? "Smart move — let your network know."
            : "Got your snapshot? Help a friend get one too."
        }
        subhead="Most people never check where they stand on a mortgage. Share approvU and help a friend get clarity in 2 minutes — no credit impact."
      />

      <ReferralCard />

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <RequestCard flowKey={flowKey} answers={answers} category={category} />
        <CreditPositionCard score={score} position={creditPosition} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <IncomeVerificationCard answers={answers} />
      </section>

      <ReviewAnswers visible={visible} answers={answers} onEdit={onEdit} />

      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onEdit}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Edit answers
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onEdit}>
            Adjust My Numbers
          </Button>
          <Button variant="ghost">Talk to a Broker</Button>
          <Link
            to="/portal"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground shadow hover:opacity-95"
          >
            Unlock Mortgage Options
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <Link
            to="/portal"
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow"
          >
            {nextStep}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <ShareSheetButton compact />
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </SnapshotShell>
  );
}

function PurchaseHero({
  path,
  category,
  creditPosition,
  incomeProfile,
  bigLabel,
  bigValue,
  price,
  down,
  lvr,
  nextStep,
  interpretation,
  primeSubtype,
  altResult,
  isPre,
}: {
  path: LendingPath;
  category: MortgageCategory;
  creditPosition: CreditPosition;
  incomeProfile: string;
  bigLabel: string;
  bigValue: string;
  price: number;
  down: number;
  lvr: number;
  nextStep: string;
  interpretation: string;
  primeSubtype: ReturnType<typeof classifyPrimeSubtype>;
  altResult: ReturnType<typeof classifyAlternative> | null;
  isPre: boolean;
}) {
  const heroTone: Tone = pathTone(path);
  const heroBg =
    heroTone === "primary"
      ? "border-primary/25 bg-gradient-to-br from-primary/8 via-card to-secondary/8"
      : heroTone === "secondary"
        ? "border-secondary/30 bg-gradient-to-br from-secondary/10 via-card to-primary/5"
        : "border-yellow/50 bg-gradient-to-br from-yellow/15 via-card to-accent/5";

  return (
    <section className={`rounded-3xl border p-5 shadow-sm sm:p-7 md:p-9 ${heroBg}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-widest text-secondary">
        <Sparkles className="h-3.5 w-3.5" />
        Snapshot ready
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-secondary" /> No credit impact
        </span>
      </div>

      <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
        {path === "Prime Fit"
          ? "You're matched to a Prime lending path"
          : path === "Alternative Fit"
            ? "You're matched to an Alternative lending path"
            : "Your file needs a tailored review"}
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Pill tone={pathTone(path)}>
          <Compass className="mr-1 h-3.5 w-3.5" /> {path}
        </Pill>
        <Pill tone={categoryTone(category)}>{category}</Pill>
      </div>

      {/* Big number — moment of delight */}
      {price > 0 && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {bigLabel}
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            {bigValue}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isPre
              ? "Based on your target price range and saved down payment."
              : "Based on your purchase price and down payment."}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <HeroStat
              label={isPre ? "Target price" : "Purchase price"}
              value={formatCAD(price)}
            />
            <HeroStat
              label={isPre ? "Saved down" : "Down payment"}
              value={down ? formatCAD(down) : "—"}
            />
            <HeroStat label="LTV" value={lvr ? `${lvr}%` : "—"} />
          </div>
        </div>
      )}

      {/* Profile facts */}
      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur sm:grid-cols-3 sm:p-5">
        <HeroFact
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          label="Mortgage Category"
          value={category}
        />
        <HeroFact
          icon={<CreditCard className="h-3.5 w-3.5" />}
          label="Credit Position"
          value={creditPosition}
        />
        <HeroFact
          icon={<Briefcase className="h-3.5 w-3.5" />}
          label="Income Profile"
          value={incomeProfile}
        />
      </dl>

      {/* Primary actions */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          to="/portal"
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90 sm:w-auto"
        >
          {nextStep}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <ShareSheetButton />
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Takes under 30 sec · Soft check only
        </p>
      </div>

      <div className="mt-5 rounded-xl bg-card/70 p-5 ring-1 ring-border/60 backdrop-blur">
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
  const refinancePath: LendingPath = withinLimit ? creditPath : "Needs Tailored Review";

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
      subtitle="A quick view of your refinance position — built to share, save, and act on."
      onEdit={onEdit}
      trustLine="No obligation • No credit impact at this stage"
    >
      <RefinanceHero
        withinLimit={withinLimit}
        hasNumbers={value > 0 || requested > 0}
        availableEquity={availableEquity}
        value={value}
        maxAllowed={maxAllowed}
        requested={requested}
        lvr={lvr}
        path={refinancePath}
      />

      <HomeLifeOfferBundle />

      <ShareWinCard
        shareText={buildShareText(withinLimit, availableEquity)}
        headline={
          withinLimit
            ? "Smart move — let your network know."
            : "Got a snapshot? Help a friend get one too."
        }
        subhead="Most homeowners never check their refinance position. Share approvU and help someone discover their equity in 2 minutes — no credit impact."
      />

      <ReferralCard />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {requestCard}
        {equityCard}
      </div>

      {reviewCard}

      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onEdit}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Edit answers
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onEdit}>
            Adjust My Numbers
          </Button>
          <Button variant="ghost">Talk to a Broker</Button>
          <Link
            to="/portal"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground shadow hover:opacity-95"
          >
            Unlock Mortgage Options
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <Link
            to="/portal"
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow"
          >
            {withinLimit ? "See My Options" : "Adjust My Numbers"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <ShareSheetButton compact />
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </SnapshotShell>
  );
}

// ---------- Refinance hero, share, referral ----------

const SHARE_URL = "https://approvu.app/r/refinance";

function RefinanceHero({
  withinLimit,
  hasNumbers,
  availableEquity,
  value,
  maxAllowed,
  requested,
  lvr,
  path,
}: {
  withinLimit: boolean;
  hasNumbers: boolean;
  availableEquity: number;
  value: number;
  maxAllowed: number;
  requested: number;
  lvr: number;
  path: LendingPath;
}) {
  const headline = !hasNumbers
    ? "Your refinance snapshot is ready"
    : withinLimit
      ? "You're within the estimated refinance range"
      : "Your request may need a tailored review";
  const heroBg = withinLimit
    ? "border-secondary/30 bg-gradient-to-br from-secondary/10 via-card to-primary/5"
    : "border-yellow/50 bg-gradient-to-br from-yellow/15 via-card to-accent/5";
  return (
    <section className={`rounded-3xl border p-5 shadow-sm sm:p-7 md:p-9 ${heroBg}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-widest text-secondary">
        <Sparkles className="h-3.5 w-3.5" />
        Snapshot ready
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-secondary" /> No credit impact
        </span>
      </div>

      <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
        {headline}
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Pill tone={pathTone(path)}>
          <Compass className="mr-1 h-3.5 w-3.5" /> {path}
        </Pill>
        <Pill tone={withinLimit ? "secondary" : "yellow"}>
          {withinLimit ? "Within refinance range" : "Above estimated range"}
        </Pill>
      </div>

      {/* Big equity number — the moment of delight */}
      {value > 0 && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Estimated equity available to access
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            {formatCAD(availableEquity)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on 80% of your property value, less existing balances.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <HeroStat label="Property" value={formatCAD(value)} />
            <HeroStat label="Max @ 80% LTV" value={formatCAD(maxAllowed)} />
            <HeroStat
              label="Requested"
              value={requested ? `${formatCAD(requested)} · ${lvr}%` : "—"}
              tone={withinLimit ? "primary" : "yellow"}
            />
          </div>
        </div>
      )}

      {/* Primary actions */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          to="/portal"
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90 sm:w-auto"
        >
          {withinLimit ? "See My Refinance Options" : "Continue for Tailored Review"}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <ShareSheetButton />
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Takes under 30 sec · Soft check only
        </p>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  tone = "secondary",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-background/60 p-2.5">
      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 truncate text-sm font-semibold ${tone === "yellow" ? "text-foreground" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function buildShareText(withinLimit: boolean, availableEquity: number) {
  if (withinLimit && availableEquity > 0) {
    return `I just checked my refinance position with approvU and could access up to ${formatCAD(availableEquity)} in home equity. Took 2 minutes — no credit check.`;
  }
  return "I just checked my refinance path with approvU in 2 minutes — no credit check needed.";
}

function ShareSheetButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm"
            : "inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted sm:w-auto"
        }
        aria-label="Share snapshot"
      >
        <Share2 className="h-4 w-4" />
        {!compact && <span>Share</span>}
      </button>
      {open && <ShareDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function ShareDialog({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = "I just checked my refinance path with approvU. See where you stand in 2 minutes.";
  const url = SHARE_URL;
  const enc = encodeURIComponent;
  const links = [
    { label: "Twitter / X", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    { label: "Email", icon: Mail, href: `mailto:?subject=${enc("My approvU refinance snapshot")}&body=${enc(`${text}\n\n${url}`)}` },
  ];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Share your snapshot</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Public shares only mention you checked your refinance path — your numbers stay private.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {links.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-3 text-[11px] font-medium text-foreground hover:bg-muted"
            >
              <Icon className="h-5 w-5 text-secondary" />
              {label}
            </a>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background p-2">
          <span className="flex-1 truncate px-2 text-xs text-muted-foreground">{url}</span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareWinCard({
  shareText,
  headline,
  subhead,
}: {
  shareText: string;
  headline?: string;
  subhead?: string;
}) {
  const enc = encodeURIComponent;
  const xHref = `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(SHARE_URL)}`;
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${enc(SHARE_URL)}`;
  const waHref = `https://wa.me/?text=${enc(`${shareText} ${SHARE_URL}`)}`;
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-secondary p-5 text-primary-foreground shadow-md sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[1.2fr,1fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-primary-foreground/90">
            <Trophy className="h-3 w-3" />
            Share your win
          </div>
          <h3 className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">
            {headline ?? "Smart move — let your network know."}
          </h3>
          <p className="mt-2 text-sm text-primary-foreground/85">
            {subhead ??
              "Most people never check where they stand on a mortgage. Share approvU and help a friend get clarity in 2 minutes — no credit impact."}
          </p>
        </div>

        <div className="rounded-2xl bg-primary-foreground/10 p-4 ring-1 ring-primary-foreground/20 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Preview</p>
          <p className="mt-2 text-sm leading-snug text-primary-foreground">
            "{shareText}"
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <SocialPill href={xHref} icon={<Twitter className="h-3.5 w-3.5" />} label="Post on X" />
            <SocialPill href={liHref} icon={<Linkedin className="h-3.5 w-3.5" />} label="LinkedIn" />
            <SocialPill href={waHref} icon={<MessageCircle className="h-3.5 w-3.5" />} label="WhatsApp" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialPill({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-foreground/90"
    >
      {icon}
      {label}
    </a>
  );
}

function ReferralCard() {
  // placeholder anchor (no-op)
  return _ReferralCardImpl();
}

function HomeLifeOfferBundle({
  variant = "refinance",
}: {
  variant?: "refinance" | "purchase";
}) {
  const purchaseOffers = [
    { icon: <Scale className="h-4 w-4" />, title: "Legal Fee Credit", desc: "Save on closing legal costs with our partner network." },
    { icon: <FileText className="h-4 w-4" />, title: "Appraisal Fee Credit", desc: "Up to $400 credited toward your property appraisal." },
    { icon: <Briefcase className="h-4 w-4" />, title: "Moving Service Discount", desc: "Preferred rates with vetted local movers." },
    { icon: <ShieldCheck className="h-4 w-4" />, title: "Home Insurance Referral", desc: "Get matched with insurers tailored to your home." },
    { icon: <Activity className="h-4 w-4" />, title: "Mortgage Strategy Review", desc: "Annual check-in to keep your mortgage optimized." },
  ];
  const refinanceOffers = [
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Appraisal Fee Credit",
      desc: "Up to $400 credited toward your property appraisal.",
    },
    {
      icon: <Scale className="h-4 w-4" />,
      title: "Legal Fee Credit",
      desc: "Save on closing legal costs with our partner network.",
    },
    {
      icon: <Activity className="h-4 w-4" />,
      title: "Annual Mortgage Strategy Review",
      desc: "A yearly check-in to keep your mortgage optimized.",
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      title: "Credit Monitoring",
      desc: "Free credit tracking and alerts for 12 months.",
    },
  ];
  const offers = variant === "purchase" ? purchaseOffers : refinanceOffers;
  const helper =
    variant === "purchase"
      ? "If you continue, you may qualify for added homeownership benefits and partner offers alongside your mortgage options."
      : "If you continue, you may qualify for added benefits and partner offers alongside your refinance options.";
  const secondaryLabel = variant === "purchase" ? "Unlock Mortgage Options" : "Talk to a Broker";
  return (
    <section className="mt-4 rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/5 via-card to-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground sm:text-lg">
                Your Home Life Offer Bundle
              </h3>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                Preview
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {helper}
            </p>
          </div>
        </div>
      </div>

      <div className={`grid gap-3 sm:grid-cols-2 ${offers.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {offers.map((o) => (
          <div
            key={o.title}
            className="rounded-2xl border border-border bg-background/70 p-3 transition hover:border-accent/40 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                {o.icon}
              </div>
              <div className="text-sm font-semibold text-foreground">{o.title}</div>
            </div>
            <p className="mt-2 text-xs leading-snug text-muted-foreground">{o.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-snug text-muted-foreground">
        These offers are preview benefits and may vary based on your selected mortgage option,
        location, and final application details.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          to="/portal"
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm hover:opacity-95 sm:flex-none sm:px-6"
        >
          View My Eligible Offers
          <ArrowRight className="h-4 w-4" />
        </Link>
        {variant === "purchase" ? (
          <Link
            to="/portal"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-input bg-background px-4 text-sm font-semibold text-foreground shadow-sm hover:bg-accent/5 sm:px-6"
          >
            {secondaryLabel}
          </Link>
        ) : (
          <Button variant="outline" className="h-11 rounded-xl">
            {secondaryLabel}
          </Button>
        )}
      </div>
    </section>
  );
}

function _ReferralCardImpl() {
  const [copied, setCopied] = useState(false);
  const code = "REFI-YOU50";
  const link = `${SHARE_URL}?ref=${code}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section className="mt-4 rounded-3xl border border-secondary/30 bg-secondary/5 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">
            Refer a friend, both get $50 closing credit
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When a friend funds a mortgage through approvU, you each receive a $50 credit at
            closing. No limit on referrals.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl border border-border bg-background px-3 py-2 text-xs">
              <span className="truncate font-mono text-foreground">{link}</span>
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? "Copied" : "Copy referral link"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Code <span className="font-mono">{code}</span> · Terms apply.
          </p>
        </div>
      </div>
    </section>
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

function HeroFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="text-secondary">{icon}</span>
        <span>{label}</span>
      </dt>
      <dd className="mt-1 break-words text-base font-semibold text-foreground sm:text-lg">
        {value}
      </dd>
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
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
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
    <section className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 md:p-8">
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
      <dl className="mt-5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div
            key={`${r.label}-${i}`}
            className="flex items-start justify-between gap-3 border-b border-border/50 py-2.5"
          >
            <dt className="min-w-0 shrink-0 max-w-[50%] text-sm text-muted-foreground">{r.label}</dt>
            <dd className="min-w-0 break-words text-right text-sm font-medium text-foreground">{r.value}</dd>
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
    cashout_purposes: "Funds will be used for",
    other_cashout_purpose_detail: "Other purpose details",
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
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold sm:text-2xl">
        {tailored ? "Complete a Tailored Review" : "View Your Mortgage Options"}
      </h2>
      <p className="mt-2 text-sm text-primary-foreground/85">
        {tailored
          ? "Your profile needs a deeper review to match you accurately with the right lender options."
          : "Create your account to see your qualified mortgage products and select your preferred structure."}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          to="/portal"
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground shadow hover:bg-accent/90 sm:w-auto"
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
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-primary-foreground/30 bg-transparent px-5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
        >
          Edit My Inputs
        </button>
        <button className="inline-flex h-11 w-full items-center justify-center rounded-lg px-3 text-sm text-primary-foreground/85 underline-offset-2 hover:underline sm:w-auto">
          Talk to a Broker
        </button>
      </div>
      <p className="mt-3 text-xs text-primary-foreground/70">
        This snapshot is not a mortgage approval. {tailored ? "No credit impact at this stage." : "Takes under 30 seconds. No obligation."}
      </p>
    </section>
  );
}

// (RefinanceCTACard removed — replaced by RefinanceHero + ShareWinCard.)

// Avoid an unused-import lint failure in case some icons aren't used in current branches
const _unused = { Home, MapPin, flows };
export const __snapshotInternals = _unused;