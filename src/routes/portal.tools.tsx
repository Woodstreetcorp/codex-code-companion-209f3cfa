import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Calculator,
  Coins,
  Home,
  HomeIcon,
  LineChart,
  PiggyBank,
  Receipt,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  ACTIVE_APPS,
  fmtMoney,
  useSavedScenarios,
  type SavedScenario,
} from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools")({
  head: () => ({
    meta: [
      { title: "Mortgage Planning Tools — approvU" },
      {
        name: "description",
        content:
          "Estimate payments, compare options, and plan your mortgage with simple self-serve tools.",
      },
    ],
  }),
  component: ToolsLayout,
});

function ToolsLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  // When on /portal/tools exactly, render hub; otherwise render the child tool page.
  if (path === "/portal/tools" || path === "/portal/tools/") return <ToolsHub />;
  return <Outlet />;
}

type Category =
  | "All"
  | "Payments"
  | "Affordability"
  | "Purchase"
  | "Refinance"
  | "Renewal"
  | "Debt Payoff"
  | "Homeownership"
  | "Scenario Planning";

const CATEGORIES: Category[] = [
  "All", "Payments", "Affordability", "Purchase", "Refinance",
  "Renewal", "Debt Payoff", "Homeownership", "Scenario Planning",
];

type Tool = {
  to: string;
  name: string;
  desc: string;
  bestFor: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  cats: Category[];
  badge?: "Popular" | "Recommended";
};

const TOOLS: Tool[] = [
  {
    to: "/portal/tools/payment-calculator",
    name: "Mortgage Payment Calculator",
    desc: "Estimate your payment based on loan amount, rate, amortization, and frequency.",
    bestFor: "Understanding monthly payment",
    cta: "Calculate Payment",
    icon: Calculator,
    cats: ["Payments"],
    badge: "Popular",
  },
  {
    to: "/portal/tools/affordability",
    name: "Affordability Calculator",
    desc: "See how much home you may be able to afford based on income, debts, and down payment.",
    bestFor: "Planning a purchase",
    cta: "Check Affordability",
    icon: Home,
    cats: ["Affordability", "Purchase"],
    badge: "Recommended",
  },
  {
    to: "/portal/tools/closing-costs",
    name: "Purchase Closing Cost Estimator",
    desc: "Estimate land transfer tax, legal fees, appraisal, title insurance, and other closing costs.",
    bestFor: "Budgeting before closing",
    cta: "Estimate Closing Costs",
    icon: Receipt,
    cats: ["Purchase"],
  },
  {
    to: "/portal/tools/down-payment",
    name: "Down Payment Planner",
    desc: "Plan your down payment sources and see how it affects your mortgage and LTV.",
    bestFor: "First-time buyers",
    cta: "Plan Down Payment",
    icon: PiggyBank,
    cats: ["Purchase", "Affordability"],
  },
  {
    to: "/portal/tools/refinance-savings",
    name: "Refinance Savings Calculator",
    desc: "See if refinancing could lower your payment, consolidate debt, or unlock equity.",
    bestFor: "Existing homeowners",
    cta: "Explore Refinance",
    icon: RefreshCw,
    cats: ["Refinance"],
  },
  {
    to: "/portal/tools/renewal-comparison",
    name: "Renewal Comparison Tool",
    desc: "Compare your current renewal offer against possible mortgage options.",
    bestFor: "Upcoming mortgage renewals",
    cta: "Compare Renewal",
    icon: TrendingUp,
    cats: ["Renewal"],
  },
  {
    to: "/portal/tools/debt-consolidation",
    name: "Debt Consolidation Calculator",
    desc: "See how consolidating debts through a refinance affects your monthly cash flow.",
    bestFor: "Reducing monthly obligations",
    cta: "Compare Debt Options",
    icon: Coins,
    cats: ["Debt Payoff", "Refinance"],
  },
  {
    to: "/portal/tools/prepayment",
    name: "Mortgage Prepayment Calculator",
    desc: "Estimate how extra payments could reduce interest and shorten your mortgage.",
    bestFor: "Paying mortgage faster",
    cta: "Try Prepayments",
    icon: Banknote,
    cats: ["Debt Payoff", "Payments"],
  },
  {
    to: "/portal/tools/rent-vs-buy",
    name: "Rent vs Buy Calculator",
    desc: "Compare the long-term cost of renting versus buying.",
    bestFor: "Early-stage buyers",
    cta: "Compare Rent vs Buy",
    icon: HomeIcon,
    cats: ["Affordability", "Homeownership"],
  },
  {
    to: "/portal/tools/home-equity",
    name: "Home Equity Calculator",
    desc: "Estimate your available equity based on property value and mortgage balances.",
    bestFor: "Refinance and HELOC planning",
    cta: "Estimate Equity",
    icon: Wallet,
    cats: ["Homeownership", "Refinance"],
  },
  {
    to: "/portal/tools/stress-test",
    name: "Stress Test Calculator",
    desc: "Estimate qualification using a qualifying rate and affordability ratios.",
    bestFor: "Understanding qualification",
    cta: "Run Stress Test",
    icon: ShieldAlert,
    cats: ["Affordability"],
  },
  {
    to: "/portal/tools/scenario-compare",
    name: "Mortgage Scenario Compare",
    desc: "Compare up to three mortgage scenarios side by side.",
    bestFor: "Choosing between options",
    cta: "Compare Scenarios",
    icon: Scale,
    cats: ["Scenario Planning"],
  },
];

function ToolsHub() {
  const [cat, setCat] = useState<Category>("All");
  const tools = useMemo(
    () => (cat === "All" ? TOOLS : TOOLS.filter((t) => t.cats.includes(cat))),
    [cat],
  );
  const { list: scenarios, remove } = useSavedScenarios();
  const activeApp = ACTIVE_APPS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold text-primary sm:text-3xl">Mortgage Planning Tools</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Estimate payments, compare options, and plan your mortgage with confidence.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/pre-purchase"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Sparkles className="h-4 w-4" /> Start a New Mortgage Snapshot
          </Link>
          <Link
            to="/portal/applications"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            View My Applications
          </Link>
        </div>
        {!activeApp && (
          <p className="mt-3 rounded-xl border border-secondary/30 bg-secondary/5 px-3 py-2 text-xs text-foreground">
            Not sure where to start? Use the Mortgage Snapshot tool to see possible mortgage paths based on your situation.
          </p>
        )}
      </header>

      {/* Personalized planning snapshot */}
      {activeApp && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-gradient-to-br from-primary/5 to-secondary/5 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary">
                Personalized snapshot
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-primary">
                Planning based on your active application
              </h2>
              <p className="text-xs text-muted-foreground">{activeApp.id} · {activeApp.txType}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/internal/full-application"
                search={{ section: "mortgage-application" }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Open Application <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/portal/tools/payment-calculator"
                search={{ prefill: "1" }}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Use these details in tools
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Address" value={activeApp.address} />
            <Stat label="Property value" value={fmtMoney(activeApp.propertyValue)} />
            <Stat label="Requested mortgage" value={fmtMoney(activeApp.mortgageAmount)} />
            <Stat label="Selected rate" value={`${activeApp.rate}%`} />
            <Stat label="Est. payment" value={`${fmtMoney(activeApp.monthlyPayment)}/mo`} />
            <Stat label="Status" value="In review" />
          </dl>
        </section>
      )}

      {/* Category chips */}
      <nav aria-label="Tool categories" className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              cat === c
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {c}
          </button>
        ))}
      </nav>

      {/* Tools grid */}
      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <ToolCard key={t.to} tool={t} />
          ))}
        </div>
      </section>

      {/* Saved scenarios */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Saved scenarios</h2>
          <span className="text-[11px] text-muted-foreground">Stored on this device</span>
        </div>
        {scenarios.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <LineChart className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">No scenarios yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Save your work in any calculator to revisit and compare later.
            </p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {scenarios.map((s) => (
              <ScenarioRow key={s.id} scenario={s} onRemove={() => remove(s.id)} />
            ))}
          </ul>
        )}
      </section>

      {/* Educational help */}
      <section className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
        <h2 className="text-sm font-semibold text-foreground">New to mortgages?</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Each tool gives a quick estimate. Final numbers depend on lender approval, verified
          income, and product rules. If you'd like a tailored review, start a Mortgage Snapshot or
          message your approvU advisor.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/pre-purchase"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Start a Mortgage Snapshot
          </Link>
          <Link
            to="/portal/applications"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            View My Applications
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        These tools provide illustrative estimates only and are not a mortgage offer or commitment
        to lend. Rates, payments, fees, taxes, and qualification figures may vary. approvU is not
        responsible for decisions made based solely on these results.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-foreground" title={value}>{value}</dd>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
          <Icon className="h-5 w-5" />
        </span>
        {tool.badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              tool.badge === "Popular"
                ? "bg-coral/15 text-coral"
                : "bg-mint/25 text-foreground"
            }`}
          >
            {tool.badge}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{tool.name}</h3>
      <p className="mt-1 flex-1 text-xs text-muted-foreground">{tool.desc}</p>
      <p className="mt-2 text-[11px] font-medium text-secondary">Best for {tool.bestFor}</p>
      <Link
        to={tool.to}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {tool.cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}

function ScenarioRow({ scenario, onRemove }: { scenario: SavedScenario; onRemove: () => void }) {
  const date = new Date(scenario.createdAt).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{scenario.name}</p>
        <p className="text-[11px] text-muted-foreground">{scenario.tool} · {date}</p>
      </div>
      <button
        onClick={onRemove}
        aria-label="Delete scenario"
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}