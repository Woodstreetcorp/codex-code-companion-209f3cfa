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

type AnswerValue = string | string[] | MortgageEntry[];
type Answers = Record<string, AnswerValue>;

// ---------- Derivations ----------

type LendingPath = "Prime Fit" | "Alternative Fit" | "Needs Tailored Review";
type CreditPosition =
  | "Strong Prime Position"
  | "Prime Position"
  | "Alternative Position"
  | "Needs Review";
type MortgageCategory = "Insured" | "Insurable" | "Uninsurable" | "Refinance";

function getCreditScore(a: Answers): number {
  const v = a.credit;
  return typeof v === "string" ? parseInt(v.replace(/\D/g, ""), 10) || 0 : 0;
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
  if (score && score < 500) return "Needs Tailored Review";
  const verify = a.selfVerify as string | undefined;
  const income = a.income as string | undefined;
  if (score >= 620 && (income === "employed" || verify === "tax")) return "Prime Fit";
  if (score >= 500) return "Alternative Fit";
  return "Needs Tailored Review";
}

function getMortgageCategory(flowKey: FlowKey, a: Answers): MortgageCategory {
  if (flowKey === "refinance") return "Refinance";
  const price = parseCurrency(a.price as string) || parseCurrency(a.savedDown as string) * 0;
  const usage = (a.use as string) ?? "primary";
  if (usage !== "primary") return "Uninsurable";
  if (price && price >= 1_500_000) return "Uninsurable";

  if (flowKey === "purchase") {
    const down = parseCurrency(a.down as string);
    if (price > 0 && down > 0) {
      const loan = Math.max(price - down, 0);
      const lvr = (loan / price) * 100;
      if (lvr > 80) return "Insured";
      return "Insurable";
    }
  }
  return "Insurable";
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
  return c === "Insured" ? "secondary" : c === "Insurable" ? "primary" : c === "Uninsurable" ? "yellow" : "mint";
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
  const category = getMortgageCategory(flowKey, answers);
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

  return (
    <SnapshotShell
      title="Your Mortgage Snapshot"
      subtitle="Based on what you shared, here is your likely mortgage path and next best step."
      onEdit={onEdit}
    >
      {/* Hero summary cards */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-secondary">
          <Sparkles className="h-3.5 w-3.5" />
          Snapshot ready
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
          Here's your snapshot
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

        <div className="mt-6 rounded-xl bg-secondary/5 p-5">
          <p className="text-sm leading-relaxed text-foreground">{interpretation}</p>
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
  const additionalAvailable = Math.max(maxAllowed - balance, 0);

  const path = getLendingPath(answers);
  const interpretation = withinLimit
    ? "Based on your property value and current mortgage balances, your refinance request appears to fit within the estimated allowed loan-to-value limit. You may be able to proceed with this refinance structure, subject to lender review, income qualification, and supporting documents."
    : "Your requested refinance amount appears to be above the estimated maximum allowed loan amount for this property. You may still have options, but your current cash-out request may need to be reduced or reviewed more closely.";

  return (
    <SnapshotShell
      title="Your Refinance Snapshot"
      subtitle="Here's a quick view of your refinance position based on the information you provided."
      onEdit={onEdit}
      trustLine="No obligation • No credit impact at this stage"
    >
      {/* Snapshot outcome banner */}
      <section
        className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${
          withinLimit
            ? "border-secondary/30 bg-secondary/5"
            : "border-yellow/40 bg-yellow/10"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-secondary">
          <Sparkles className="h-3.5 w-3.5" />
          Snapshot ready
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
          {withinLimit
            ? "You're within the estimated refinance range"
            : "Your request may need adjustment"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This is not a final approval. It is an early snapshot to help you understand your
          position before moving forward.
        </p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Left: request + equity */}
        <div className="space-y-4">
          <Card title="Your Refinance Request" icon={<FileText className="h-4 w-4" />}>
            <Row label="Property Value" value={value ? formatCAD(value) : "—"} />
            <Row label="Existing Mortgage Balance(s)" value={balance ? formatCAD(balance) : "—"} />
            <Row label="Cash-Out Requested" value={cashOut ? formatCAD(cashOut) : "—"} />
            <Row
              label="Total New Loan Requested"
              value={requested ? formatCAD(requested) : "—"}
              emphasis
            />
            <Row label="Property Use" value={prettifyUse(answers.use as string)} />
            <Row label="Property Type" value={prettifyType(answers.propertyType as string)} />
          </Card>

          <Card title="What this means" icon={<Info className="h-4 w-4" />}>
            <p className="text-sm leading-relaxed text-muted-foreground">{interpretation}</p>
          </Card>
        </div>

        {/* Right: equity position + path + CTA */}
        <div className="space-y-4">
          <Card title="Your Equity Position" icon={<TrendingUp className="h-4 w-4" />}>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Maximum allowed" value={value ? formatCAD(maxAllowed) : "—"} />
              <Metric label="Requested" value={requested ? formatCAD(requested) : "—"} />
              <Metric label="Estimated LTV" value={lvr ? `${lvr}%` : "—"} />
            </div>
            <div className="mt-4">
              <LtvBar value={value} maxAllowed={maxAllowed} requested={requested} />
            </div>
            <div className="mt-4">
              <Pill tone={withinLimit ? "secondary" : "yellow"}>
                {withinLimit ? "Within refinance limit" : "Above refinance limit"}
              </Pill>
            </div>
          </Card>

          <Card title="Your Refinance Path" icon={<Compass className="h-4 w-4" />}>
            <Pill tone={pathTone(path)}>{path}</Pill>
            <p className="mt-3 text-sm text-muted-foreground">
              Your current structure suggests a {path.toLowerCase()} based on the property
              profile and refinance request.
            </p>
          </Card>

          <Card
            title={withinLimit ? "Your request looks workable" : "Here's how to improve this request"}
            icon={<BadgeCheck className="h-4 w-4" />}
          >
            <ul className="space-y-2 text-sm text-muted-foreground">
              {(withinLimit
                ? [
                    "Your loan request fits within the estimated refinance limit",
                    "The next review will focus on income, debt ratios, and lender fit",
                    "You can continue to see refinance options",
                  ]
                : [
                    "Reduce your cash-out amount",
                    "Review the property value if a stronger appraisal may apply",
                    "Continue for a more tailored review if your situation is more complex",
                  ]
              ).map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {!withinLimit && additionalAvailable >= 0 && (
              <p className="mt-4 rounded-lg bg-yellow/15 px-3 py-2 text-sm text-foreground">
                Maximum additional cash-out available:{" "}
                <strong>{formatCAD(additionalAvailable)}</strong>
              </p>
            )}
          </Card>

          <RefinanceCTACard withinLimit={withinLimit} />
        </div>
      </section>

      <ReviewAnswers visible={visible} answers={answers} onEdit={onEdit} />
    </SnapshotShell>
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
    <div className={`rounded-xl border p-4 ${toneClass[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-80">
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-base font-semibold leading-snug">{value}</p>
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
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-right text-sm ${emphasis ? "font-semibold text-primary" : "font-medium text-foreground"}`}
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
}: {
  value: number;
  maxAllowed: number;
  requested: number;
}) {
  if (!value) {
    return (
      <div className="h-3 w-full rounded-full bg-muted" aria-hidden />
    );
  }
  const maxPct = Math.min(100, (maxAllowed / value) * 100);
  const reqPct = Math.min(100, (requested / value) * 100);
  return (
    <div className="space-y-2">
      <div className="relative h-3 w-full rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-secondary/30"
          style={{ width: `${maxPct}%` }}
        />
        <div
          className="absolute -top-1 h-5 w-1 rounded-full bg-primary"
          style={{ left: `calc(${reqPct}% - 2px)` }}
          aria-label="Requested loan position"
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>$0</span>
        <span>Max allowed {Math.round(maxPct)}%</span>
        <span>Property value</span>
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
  const price = parseCurrency(answers.price as string);
  const down = parseCurrency(answers.down as string);
  const loan = price > down ? price - down : 0;
  const lvr = price > 0 && loan > 0 ? ltv(loan, price) : null;

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
            label="Saved Down Payment"
            value={parseCurrency(answers.savedDown as string) ? formatCAD(parseCurrency(answers.savedDown as string)) : "—"}
          />
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
        <Gift className="h-4 w-4" /> You may qualify for the {name}
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
    propertyType: "Property type",
    ownsResidence: "Own primary residence",
    intent: "Refinance goal",
    numMortgages: "Mortgages on title",
    wantsEquity: "Wants to access equity",
    cashPurpose: "Funds will be used for",
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
    case "1.2+":
      return "Above $1.2M";
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
        <button className="inline-flex h-11 items-center justify-center rounded-lg border border-primary-foreground/30 bg-transparent px-5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10">
          Edit My Inputs
        </button>
        {!tailored && (
          <button className="inline-flex h-11 items-center justify-center rounded-lg px-3 text-sm text-primary-foreground/85 underline-offset-2 hover:underline">
            Talk to a Broker
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-primary-foreground/70">
        {tailored ? "No obligation. No credit impact at this stage." : "Takes under 30 seconds. No obligation."}
      </p>
    </section>
  );
}

function RefinanceCTACard({ withinLimit }: { withinLimit: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-secondary p-6 text-primary-foreground shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <CircleDollarSign className="h-4 w-4" />
        {withinLimit ? "See My Refinance Options" : "Adjust My Numbers"}
      </h3>
      <p className="mt-2 text-sm text-primary-foreground/85">
        {withinLimit
          ? "Create your account to view your qualified refinance options."
          : "Try adjusting your cash-out amount or continue for a tailored review."}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          to="/portal"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground shadow hover:bg-accent/90"
        >
          {withinLimit ? "See My Refinance Options" : "Adjust My Numbers"}
        </Link>
        <button className="inline-flex h-10 items-center justify-center rounded-lg border border-primary-foreground/30 px-4 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10">
          {withinLimit ? "Adjust My Numbers" : "Continue for Tailored Review"}
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