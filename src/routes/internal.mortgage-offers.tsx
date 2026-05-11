import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Gift,
  Shield,
  Lock,
  UserCheck,
  CircleDashed,
  ArrowRight,
  X,
  Info,
  TrendingDown,
  Award,
  Zap,
} from "lucide-react";
import { InternalShell } from "@/components/InternalShell";

export const Route = createFileRoute("/internal/mortgage-offers")({
  head: () => ({
    meta: [
      { title: "approvU — Your Mortgage Offers" },
      {
        name: "description",
        content:
          "Personalized preliminary mortgage offer directions and Home Life benefits based on your initial qualification.",
      },
    ],
  }),
  component: MortgageOffersPage,
});

type Benefit = { name: string; value: number };
type Offer = {
  id: string;
  title: string;
  lenderTypeLabel: string;
  termLabel: string;
  rateType: "Fixed" | "Variable";
  termLength: string;
  estimatedRate: string;
  estimatedMonthlyPayment: string;
  totalBenefitsValue: number;
  recommended?: boolean;
  highlight?: { icon: typeof Award; label: string };
  groupKey: string;
  representativeProductId: string;
  offerBundleId: string;
  benefits: Benefit[];
};

const OFFERS: Offer[] = [
  {
    id: "offer-variable-mb",
    title: "Lowest Payment Variable Offer",
    lenderTypeLabel: "Mortgage Bank Path",
    termLabel: "5-Year Variable",
    rateType: "Variable",
    termLength: "5-Year",
    estimatedRate: "4.79%",
    estimatedMonthlyPayment: "$2,341",
    totalBenefitsValue: 1599,
    highlight: { icon: TrendingDown, label: "Lowest Payment" },
    groupKey: "MB_5Y_VAR",
    representativeProductId: "prod_mb_var_5y_001",
    offerBundleId: "bundle_flex_living",
    benefits: [
      { name: "No Appraisal Fee", value: 400 },
      { name: "Home Inspection Credit", value: 500 },
      { name: "Legal Fee Rebate", value: 500 },
      { name: "First-Time Homeowner Guide", value: 199 },
    ],
  },
  {
    id: "offer-fixed-mono",
    title: "Best Value Fixed Offer",
    lenderTypeLabel: "Monoline Lender Path",
    termLabel: "5-Year Fixed",
    rateType: "Fixed",
    termLength: "5-Year",
    estimatedRate: "4.89%",
    estimatedMonthlyPayment: "$2,358",
    totalBenefitsValue: 2350,
    recommended: true,
    highlight: { icon: Award, label: "Best Value — Recommended" },
    groupKey: "MONO_5Y_FIX",
    representativeProductId: "prod_mono_fix_5y_001",
    offerBundleId: "bundle_stability_plus",
    benefits: [
      { name: "No Appraisal Fee", value: 400 },
      { name: "Home Inspection Credit", value: 500 },
      { name: "Legal Fee Rebate", value: 500 },
      { name: "Moving Expense Credit", value: 500 },
      { name: "Home Insurance Credit", value: 450 },
    ],
  },
  {
    id: "offer-fixed-cu",
    title: "Flexible Lending Offer",
    lenderTypeLabel: "Credit Union Path",
    termLabel: "3-Year Fixed",
    rateType: "Fixed",
    termLength: "3-Year",
    estimatedRate: "5.10%",
    estimatedMonthlyPayment: "$2,432",
    totalBenefitsValue: 2425,
    highlight: { icon: Zap, label: "Strong Approval" },
    groupKey: "CU_3Y_FIX",
    representativeProductId: "prod_cu_fix_3y_001",
    offerBundleId: "bundle_essentials",
    benefits: [
      { name: "Flexible Review Support", value: 250 },
      { name: "Financial Planning Session", value: 500 },
      { name: "Legal Fee Rebate", value: 500 },
      { name: "Home Inspection Credit", value: 500 },
      { name: "Moving Support Credit", value: 675 },
    ],
  },
];

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function MortgageOffersPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOffer, setDrawerOffer] = useState<Offer | null>(null);
  const selected = OFFERS.find((o) => o.id === selectedId) ?? null;

  return (
    <InternalShell
      eyebrow="Step 4 of 6"
      title="Your Mortgage Offers"
      description="You're one step closer. Based on your initial answers, we found mortgage offers and benefits that may fit your profile."
      currentPath="/internal/mortgage-offers"
      prev={{ to: "/internal/account-handoff", label: "Back" }}
      next={{ to: "/internal/borrower-dashboard", label: "Continue" }}
    >
      <p className="-mt-6 mb-10 max-w-2xl text-sm text-muted-foreground">
        Select one offer to continue. Your final mortgage product will be confirmed after your full
        application is completed and reviewed.
      </p>

      {/* Offer Cards */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {OFFERS.map((o) => (
          <OfferCard
            key={o.id}
            offer={o}
            selected={selectedId === o.id}
            onSelect={() => setSelectedId(o.id)}
            onViewDetails={() => setDrawerOffer(o)}
          />
        ))}
      </div>

      {/* Selected Confirmation */}
      {selected && (
        <section className="mt-8 overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-secondary/5 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  You selected
                </p>
                <h3 className="mt-0.5 text-lg font-semibold text-foreground">{selected.title}</h3>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  We'll use this as your preferred mortgage direction when you complete your full
                  application.
                </p>
              </div>
            </div>
            <Link
              to="/internal/borrower-dashboard"
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Continue Application <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* How Your Offers Work */}
      <section className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-foreground">How Your Offers Work</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A simple, transparent path from preview to confirmed offer.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Step
            num="1"
            title="Initial Match"
            body="These offers are based on your initial qualification answers."
          />
          <Step
            num="2"
            title="Full Application Review"
            body="When you complete your full application, we verify your income, property, credit, and financing details."
          />
          <Step
            num="3"
            title="Final Confirmation"
            body="Your final mortgage offer and benefits are confirmed after review and lender validation."
          />
        </div>
        <div className="mt-6 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-sm text-foreground">
          <strong className="text-secondary">Our commitment:</strong> We'll clearly explain any
          changes if your verified application details affect your final offer.
        </div>
      </section>

      {/* Trust */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Trust icon={CircleDashed} label="No impact on credit at this stage" />
        <Trust icon={Lock} label="Secure and confidential" />
        <Trust icon={UserCheck} label="Reviewed by a licensed broker" />
        <Trust icon={Shield} label="No obligation" />
      </section>

      {/* Drawer */}
      {drawerOffer && (
        <BenefitsDrawer offer={drawerOffer} onClose={() => setDrawerOffer(null)} />
      )}
    </InternalShell>
  );
}

function OfferCard({
  offer: o,
  selected,
  onSelect,
  onViewDetails,
}: {
  offer: Offer;
  selected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
}) {
  const HighlightIcon = o.highlight?.icon;
  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-card transition-all ${
        o.recommended
          ? "border-primary shadow-lg lg:scale-[1.02] lg:-translate-y-1"
          : "border-border shadow-sm hover:shadow-md"
      } ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      {o.highlight && (
        <div
          className={`absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${
            o.recommended
              ? "bg-primary text-primary-foreground"
              : "bg-accent/90 text-accent-foreground"
          }`}
        >
          {HighlightIcon && <HighlightIcon className="h-3 w-3" />}
          {o.highlight.label}
        </div>
      )}

      {/* Header */}
      <div className="px-6 pb-4 pt-7 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {o.lenderTypeLabel}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-foreground">{o.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{o.termLabel}</p>
      </div>

      {/* Benefits hero value */}
      <div
        className={`mx-6 rounded-xl px-4 py-5 text-center ${
          o.recommended
            ? "bg-gradient-to-br from-primary/10 to-accent/10"
            : "bg-muted/40"
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Total Benefits Value
        </p>
        <p
          className={`mt-1 text-4xl font-bold tracking-tight ${
            o.recommended ? "text-primary" : "text-foreground"
          }`}
        >
          {formatCurrency(o.totalBenefitsValue)}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-mint">
          <Gift className="h-3 w-3" /> Included with this offer
        </p>
      </div>

      {/* Mortgage stats */}
      <div className="grid grid-cols-2 gap-px bg-border/60 mx-6 mt-5 overflow-hidden rounded-xl border border-border">
        <Stat label="Estimated Rate" value={o.estimatedRate} />
        <Stat label="Monthly Payment" value={`${o.estimatedMonthlyPayment}/mo`} />
        <Stat label="Term" value={o.termLength} />
        <Stat label="Rate Type" value={o.rateType} />
      </div>

      {/* Benefits */}
      <div className="px-6 pt-5">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Your Benefits Include
        </p>
        <ul className="space-y-2">
          {o.benefits.slice(0, 5).map((b) => (
            <li key={b.name} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-mint" />
                <span className="leading-tight">{b.name}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {formatCurrency(b.value)}
              </span>
            </li>
          ))}
        </ul>
        <button
          onClick={onViewDetails}
          className="mt-3 text-xs font-medium text-secondary hover:underline"
        >
          View benefit details
        </button>
      </div>

      {/* CTA */}
      <div className="mt-auto px-6 pb-6 pt-5">
        <button
          onClick={onSelect}
          className={`w-full rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-colors ${
            selected
              ? "bg-mint text-foreground"
              : o.recommended
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-foreground text-background hover:bg-foreground/90"
          }`}
        >
          {selected ? (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Offer Selected
            </span>
          ) : o.recommended ? (
            "Select Recommended Offer"
          ) : (
            "Select This Offer"
          )}
        </button>
        <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground">
          Estimated only. Final offer depends on your verified application.
        </p>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {num}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Trust({ icon: Icon, label }: { icon: typeof Shield; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground shadow-sm">
      <Icon className="h-4 w-4 text-secondary" />
      <span>{label}</span>
    </div>
  );
}

function BenefitsDrawer({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative ml-auto flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {offer.lenderTypeLabel}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-foreground">{offer.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Offer Benefits Details</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-5 rounded-xl bg-primary/5 p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total Benefits Value
            </p>
            <p className="mt-0.5 text-2xl font-bold text-primary">
              {formatCurrency(offer.totalBenefitsValue)}
            </p>
          </div>
          <ul className="space-y-3">
            {offer.benefits.map((b) => (
              <li key={b.name} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{b.name}</p>
                  <span className="rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-medium text-foreground">
                    Included
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Estimated value: <span className="font-medium text-foreground">{formatCurrency(b.value)}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Eligibility and redemption terms apply. Confirmed after your full application is verified.
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Benefit availability and exact value may change based on your verified application
            details and final offer.
          </p>
        </div>
        <div className="border-t border-border bg-muted/30 px-5 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

// Suppressed unused-warning sentinels
void Sparkles;
