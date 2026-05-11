import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Gift,
  Filter,
  ArrowUpDown,
  Shield,
  Lock,
  UserCheck,
  CircleDashed,
  MessageCircle,
  Info,
} from "lucide-react";
import { InternalShell } from "@/components/InternalShell";

export const Route = createFileRoute("/internal/mortgage-offers")({
  head: () => ({
    meta: [
      { title: "approvU — Your Mortgage Options" },
      {
        name: "description",
        content:
          "Compare possible mortgage options with included Home Life Offer Bundle benefits attached to each option.",
      },
    ],
  }),
  component: MortgageOffersPage,
});

type Benefit = { name: string; value?: string; status: "Included" };
type MortgageOption = {
  id: string;
  productName: string;
  lenderName: string;
  fit: "Prime Fit" | "Alternative Fit";
  programLane: "Insured" | "Insurable" | "Uninsurable";
  rateType: "Fixed" | "Variable";
  interestRate: string;
  estimatedMonthlyPayment: string;
  term: string;
  amortization: string;
  estimatedFee?: string;
  notes?: string;
  recommended?: boolean;
  offerBundle: {
    bundleName: string;
    estimatedValue: string;
    benefits: Benefit[];
  };
};

const OPTIONS: MortgageOption[] = [
  {
    id: "opt-1",
    productName: "5-Year Fixed Advantage",
    lenderName: "First National Bank",
    fit: "Prime Fit",
    programLane: "Insurable",
    rateType: "Fixed",
    interestRate: "4.79%",
    estimatedMonthlyPayment: "$2,341",
    term: "5 Year",
    amortization: "30 Year",
    estimatedFee: "No lender fee",
    notes: "Estimated. Subject to lender review.",
    recommended: true,
    offerBundle: {
      bundleName: "Stability Plus Bundle",
      estimatedValue: "Up to $2,350",
      benefits: [
        { name: "No Appraisal Fee", value: "$400", status: "Included" },
        { name: "Legal Fee Rebate", value: "$500", status: "Included" },
        { name: "Moving Expense Credit", value: "$300", status: "Included" },
        { name: "Home Inspection Credit", value: "$250", status: "Included" },
        { name: "First-Time Homeowner Guide", status: "Included" },
      ],
    },
  },
  {
    id: "opt-2",
    productName: "5-Year Fixed Saver",
    lenderName: "Coastline Credit Union",
    fit: "Prime Fit",
    programLane: "Insured",
    rateType: "Fixed",
    interestRate: "4.84%",
    estimatedMonthlyPayment: "$2,358",
    term: "5 Year",
    amortization: "25 Year",
    estimatedFee: "$0 appraisal credit applied",
    notes: "May change after full application review.",
    offerBundle: {
      bundleName: "Essentials Bundle",
      estimatedValue: "Up to $1,400",
      benefits: [
        { name: "Free Legal Review", value: "$500", status: "Included" },
        { name: "Title Insurance Credit", value: "$300", status: "Included" },
        { name: "Home Insurance Referral", value: "$250", status: "Included" },
        { name: "Smart Home Consultation", status: "Included" },
      ],
    },
  },
  {
    id: "opt-3",
    productName: "5-Year Variable Flex",
    lenderName: "Northpeak Monoline",
    fit: "Alternative Fit",
    programLane: "Uninsurable",
    rateType: "Variable",
    interestRate: "5.10%",
    estimatedMonthlyPayment: "$2,432",
    term: "5 Year",
    amortization: "30 Year",
    estimatedFee: "Est. broker fee may apply",
    notes: "Variable rate. Subject to prime adjustments.",
    offerBundle: {
      bundleName: "Flex Living Bundle",
      estimatedValue: "Up to $1,800",
      benefits: [
        { name: "Switch-to-Fixed Credit", value: "$500", status: "Included" },
        { name: "Skip-a-Payment Privilege", status: "Included" },
        { name: "Moving Expense Credit", value: "$300", status: "Included" },
        { name: "Home Inspection Credit", value: "$250", status: "Included" },
      ],
    },
  },
];

const SORT_OPTIONS = [
  "Best Value",
  "Lowest Rate",
  "Lowest Payment",
  "Lowest Fees",
] as const;
const FILTERS = ["Fixed", "Variable", "Prime", "Alternative"] as const;

function MortgageOffersPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>("Best Value");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 3
          ? prev
          : [...prev, id],
    );
  };

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  return (
    <InternalShell
      eyebrow="Step 4 of 6"
      title="Your Mortgage Options"
      description="Based on your Mortgage Snapshot, here are possible mortgage options and value-added benefits to review."
      currentPath="/internal/mortgage-offers"
      prev={{ to: "/internal/account-handoff", label: "Back" }}
      next={{ to: "/internal/borrower-dashboard", label: "Continue" }}
    >
      <p className="-mt-6 mb-6 text-xs text-muted-foreground">
        Options are subject to lender review, supporting documents, and final approval.
      </p>

      {/* Sort + Filter bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort
          </span>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                sort === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filter
          </span>
          {FILTERS.map((f) => {
            const active = activeFilters.includes(f);
            return (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-secondary bg-secondary/15 text-secondary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            option={o}
            selected={selected.includes(o.id)}
            onToggleSelect={() => toggleSelect(o.id)}
          />
        ))}
      </div>

      {/* Compare bar */}
      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          {selected.length === 0
            ? "Select up to 3 options to compare side-by-side."
            : `${selected.length} option${selected.length > 1 ? "s" : ""} selected for comparison.`}
        </p>
        <button
          disabled={selected.length < 2}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Compare Selected Options
        </button>
      </div>

      {/* Transparency */}
      <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">How your benefits work</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Step
            num="1"
            title="Initial Matching"
            body="Your mortgage options and benefits are based on your Mortgage Snapshot information."
          />
          <Step
            num="2"
            title="Application Refinement"
            body="As you complete your full application, your options and benefits may be adjusted based on verified information."
          />
          <Step
            num="3"
            title="Final Verification"
            body="Your final mortgage package is confirmed after document verification and lender review."
          />
        </div>
        <div className="mt-5 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-sm text-foreground">
          <strong className="text-secondary">Our commitment:</strong> approvU will always communicate
          changes clearly. If your verified information differs from your initial qualification, your
          options or benefits may change to match your final profile.
        </div>
      </section>

      {/* Trust row */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Trust icon={CircleDashed} label="No impact on credit score at this stage" />
        <Trust icon={Lock} label="Secure and confidential" />
        <Trust icon={UserCheck} label="Licensed mortgage broker review" />
        <Trust icon={Shield} label="No obligation" />
      </section>
    </InternalShell>
  );
}

function OptionCard({
  option: o,
  selected,
  onToggleSelect,
}: {
  option: MortgageOption;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-card shadow-sm transition-all ${
        o.recommended
          ? "border-primary/60 ring-2 ring-primary/20"
          : "border-border hover:shadow-md"
      } ${selected ? "ring-2 ring-secondary/50" : ""}`}
    >
      {o.recommended && (
        <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
          <Sparkles className="h-3 w-3" /> Best Value + Recommended
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border px-5 pb-4 pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {o.lenderName}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{o.productName}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {o.rateType} • {o.term} • {o.amortization} Amortization
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Tag tone="primary">{o.fit}</Tag>
          <Tag tone="secondary">{o.programLane}</Tag>
        </div>
      </div>

      {/* Mortgage details */}
      <div className="px-5 py-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-primary">{o.interestRate}</p>
            <p className="text-xs text-muted-foreground">Estimated rate</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-foreground">
              {o.estimatedMonthlyPayment}
              <span className="text-xs font-normal text-muted-foreground"> /mo</span>
            </p>
            <p className="text-xs text-muted-foreground">Estimated payment</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <Detail label="Term" value={o.term} />
          <Detail label="Amortization" value={o.amortization} />
          <Detail label="Type" value={o.rateType} />
          <Detail label="Fees" value={o.estimatedFee ?? "—"} />
        </dl>
        {o.notes && (
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            {o.notes}
          </p>
        )}
      </div>

      {/* Offer bundle widget */}
      <div className="mx-5 mb-4 rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-yellow/10 p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Gift className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
              Your Included Home Life Benefits
            </p>
            <p className="text-sm font-semibold text-foreground">{o.offerBundle.bundleName}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-foreground">
          Estimated bundle value:{" "}
          <span className="font-semibold text-primary">{o.offerBundle.estimatedValue}</span>
        </p>
        <ul className="mt-3 space-y-1.5">
          {o.offerBundle.benefits.map((b) => (
            <li
              key={b.name}
              className="flex items-center justify-between gap-2 text-xs text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-mint" />
                {b.name}
                {b.value && (
                  <span className="text-muted-foreground">— {b.value}</span>
                )}
              </span>
              <span className="rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-medium text-foreground">
                {b.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-auto space-y-2 px-5 pb-5">
        <button className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Select This Option
        </button>
        <div className="flex gap-2">
          <button
            onClick={onToggleSelect}
            className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
              selected
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-input bg-background hover:bg-muted"
            }`}
          >
            {selected ? "Selected to compare" : "Compare"}
          </button>
          <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted">
            <MessageCircle className="h-3.5 w-3.5" /> Talk to a Broker
          </button>
        </div>
        <p className="pt-1 text-[11px] leading-snug text-muted-foreground">
          Selecting an option does not finalize your mortgage. A licensed broker will review your
          file before submission.
        </p>
      </div>
    </article>
  );
}

function Tag({
  tone,
  children,
}: {
  tone: "primary" | "secondary" | "accent";
  children: React.ReactNode;
}) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    accent: "bg-accent/15 text-accent",
  }[tone];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1.5">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {num}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function Trust({
  icon: Icon,
  label,
}: {
  icon: typeof Shield;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground shadow-sm">
      <Icon className="h-4 w-4 text-secondary" />
      <span>{label}</span>
    </div>
  );
}