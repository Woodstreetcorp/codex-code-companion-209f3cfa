import { createFileRoute } from "@tanstack/react-router";
import { Star, TrendingDown, Shield, Filter, Info } from "lucide-react";
import { InternalShell } from "@/components/InternalShell";

export const Route = createFileRoute("/internal/mortgage-options")({
  head: () => ({
    meta: [
      { title: "approvU — Your Mortgage Options" },
      {
        name: "description",
        content:
          "Compare personalized mortgage options from multiple lenders, ranked by what matters to you.",
      },
    ],
  }),
  component: MortgageOptions,
});

const OPTIONS = [
  {
    lender: "Lender A — Big Bank",
    rate: "4.79%",
    term: "5-yr fixed",
    payment: "$2,341 / mo",
    badge: "Best overall",
    badgeTone: "primary" as const,
    perks: ["Prepayment up to 20%", "Portable mortgage", "No hidden fees"],
  },
  {
    lender: "Lender B — Credit Union",
    rate: "4.84%",
    term: "5-yr fixed",
    payment: "$2,358 / mo",
    badge: "Lowest fees",
    badgeTone: "secondary" as const,
    perks: ["No appraisal fee", "Free legal credit", "Flexible payment dates"],
  },
  {
    lender: "Lender C — Monoline",
    rate: "5.10%",
    term: "5-yr variable",
    payment: "$2,432 / mo",
    badge: "Most flexible",
    badgeTone: "accent" as const,
    perks: ["Switch to fixed anytime", "Skip-a-payment", "Lower penalty"],
  },
];

function MortgageOptions() {
  return (
    <InternalShell
      eyebrow="Step 4 of 6"
      title="Your personalized mortgage options"
      description="These options are matched to your snapshot. Pick one to move forward, or talk to a broker for guidance."
      currentPath="/internal/mortgage-options"
      prev={{ to: "/internal/account-handoff", label: "Back" }}
      next={{ to: "/internal/borrower-dashboard", label: "Choose & continue" }}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filters:
        </span>
        {["5-year term", "Fixed & variable", "Refinance", "Cash-out OK"].map((f) => (
          <span
            key={f}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
          >
            {f}
          </span>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {OPTIONS.map((o) => (
          <article
            key={o.lender}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <span
              className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                o.badgeTone === "primary"
                  ? "bg-primary/10 text-primary"
                  : o.badgeTone === "secondary"
                    ? "bg-secondary/15 text-secondary"
                    : "bg-accent/15 text-accent"
              }`}
            >
              <Star className="h-3 w-3" /> {o.badge}
            </span>
            <h3 className="mt-3 text-base font-semibold text-foreground">{o.lender}</h3>
            <p className="text-xs text-muted-foreground">{o.term}</p>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">{o.rate}</p>
                <p className="text-xs text-muted-foreground">approx. rate</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{o.payment}</p>
                <p className="text-xs text-muted-foreground">est. payment</p>
              </div>
            </div>

            <ul className="mt-4 space-y-1.5 text-sm text-foreground">
              {o.perks.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <TrendingDown className="mt-0.5 h-4 w-4 text-mint" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-2">
              <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Select this option
              </button>
              <button className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
                See full details
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-secondary">
            <Shield className="h-5 w-5" />
            <h3 className="text-sm font-semibold">Rate hold</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecting an option will hold the rate for up to 120 days while you complete your full
            application.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" />
            <h3 className="text-sm font-semibold">Need help deciding?</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Book a free 15-minute call with a licensed broker to compare options side-by-side.
          </p>
        </div>
      </div>
    </InternalShell>
  );
}