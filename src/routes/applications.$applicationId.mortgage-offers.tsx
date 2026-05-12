import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  Info,
  Lock,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import {
  PageHeader,
  PageShell,
  TxType,
  fmtMoney,
} from "@/components/property-financing/shared";

export const Route = createFileRoute(
  "/applications/$applicationId/mortgage-offers",
)({
  head: () => ({
    meta: [
      { title: "Qualified Products — approvU" },
      {
        name: "description",
        content:
          "Review your qualified mortgage products and select up to three to submit for your application.",
      },
    ],
  }),
  component: QualifiedProductsPage,
});

const MAX_SELECT = 3;

type Product = {
  id: string;
  lender: string;
  initials: string;
  product: string;
  badge?: string;
  rate: number;
  apr: number;
  payment: number;
  closingCosts: number;
  loanAmount: number;
  termYears: number;
  rateType: "Fixed" | "Variable";
  status: "Open" | "Closed";
  rateHoldDays: number;
  amortYears: number;
  emotionalTags: string[];
  tagline: string;
  features: string[];
  description: string;
  curated?: boolean;
};

const TOP: Product[] = [
  {
    id: "fn", lender: "First National Financial", initials: "FN", product: "FN Dime Best - Uninsured Mtg O/O FRM",
    badge: "Best Overall Value", rate: 5.34, apr: 5.64, payment: 2847.96, closingCosts: 8500, loanAmount: 500000,
    termYears: 5, rateType: "Fixed", status: "Closed", rateHoldDays: 120, amortYears: 25,
    emotionalTags: ["Security & Stability", "Confidence & Guidance"],
    tagline: "Predictable payments for long-term peace of mind.",
    features: ["Skip-a-payment", "Convertible", "LOC Available", "No Penalty Payout", "Payment Increase", "Rate Drop Prior to Closing"],
    description: "Our top recommended product with excellent features and competitive rates.",
    curated: true,
  },
  {
    id: "ml", lender: "Merix-Lendwise", initials: "ML", product: "MERIX FN Capital Metro - Quebec | Uninsured FRM",
    badge: "Best for Flexibility", rate: 5.29, apr: 5.59, payment: 2835.43, closingCosts: 8200, loanAmount: 500000,
    termYears: 5, rateType: "Fixed", status: "Closed", rateHoldDays: 120, amortYears: 30,
    emotionalTags: ["Savings & Value", "Speed & Convenience"],
    tagline: "Save thousands over 5 years with this smart choice.",
    features: ["Skip-a-payment", "Convertible", "LOC Available", "No Penalty Payout", "Payment Increase", "Rate Drop Prior to Closing"],
    description: "Lower rate with strong flexibility for prepayments and life changes.",
    curated: true,
  },
  {
    id: "cm", lender: "CMLS", initials: "CM", product: "CMLS Mtl - Ques O/O Uninsured Extra Quebec Funds FRM",
    badge: "Best for Stability", rate: 5.39, apr: 5.69, payment: 2856.78, closingCosts: 8600, loanAmount: 500000,
    termYears: 5, rateType: "Fixed", status: "Closed", rateHoldDays: 90, amortYears: 25,
    emotionalTags: ["Freedom & Flexibility", "Lifestyle Alignment"],
    tagline: "Great for early payoffs and flexible lifestyles.",
    features: ["Skip-a-payment", "Convertible", "Payment Increase", "Rate Drop Prior to Closing"],
    description: "Stable monoline option with strong prepayment freedom.",
    curated: true,
  },
  {
    id: "mc", lender: "MCAP Financial", initials: "MC", product: "MCAP Standard Fixed Rate Mortgage",
    badge: "Best for First-Time Buyers", rate: 5.44, apr: 5.74, payment: 2867.33, closingCosts: 8750, loanAmount: 500000,
    termYears: 5, rateType: "Fixed", status: "Closed", rateHoldDays: 90, amortYears: 25,
    emotionalTags: ["Security & Stability", "Growth & Opportunity"],
    tagline: "Predictable payments with first-time buyer support.",
    features: ["Portable", "Rate Hold 90 Days", "Payment Increase"],
    description: "Tailored for first-time buyers needing guidance and stability.",
    curated: true,
  },
  {
    id: "td", lender: "TD Bank", initials: "TD", product: "TD Fixed Rate Mortgage",
    badge: "Best for Branch Access", rate: 5.49, apr: 5.79, payment: 2876.45, closingCosts: 8900, loanAmount: 500000,
    termYears: 5, rateType: "Fixed", status: "Closed", rateHoldDays: 120, amortYears: 25,
    emotionalTags: ["Confidence & Guidance", "Speed & Convenience"],
    tagline: "Advisor's top pick — clear terms and trusted lender.",
    features: ["Branch Support", "Rate Hold 120 Days", "Pre-Payment Options"],
    description: "Big-bank service with reliable in-branch support.",
    curated: true,
  },
];

const ALL_OTHERS: Product[] = [
  ["sb", "Scotiabank", "SB", 5.31, 2853.17, 8650],
  ["bm", "BMO Bank of Montreal", "BM", 5.39, 2868.88, 8740],
  ["rb", "RBC Royal Bank", "RB", 5.44, 2876.27, 8800],
  ["ds", "Desjardins", "DS", 5.33, 2856.78, 8400],
  ["lb", "Laurentian Bank", "LB", 5.47, 2887.33, 8920],
  ["tg", "Tangerine", "TG", 5.31, 2847.96, 8450],
  ["ic", "Alterna Financial", "IC", 5.46, 2884.74, 8800],
  ["mt", "Manulife Credit Union", "MT", 5.49, 2891.34, 8800],
  ["ci", "CIBC", "CI", 5.31, 2854.55, 8090],
  ["nb", "National Bank", "NB", 5.41, 2867.33, 8090],
  ["eq", "Equitable Bank", "EQ", 5.31, 2856.78, 8420],
  ["hs", "HSBC", "HS", 5.43, 2887.83, 8800],
  ["mc2", "Meridian Credit Union", "MC", 5.42, 2871.04, 8800],
  ["wt", "WFCM Mortgage", "WM", 5.45, 2879.45, 8730],
  ["xz", "X2 Bank", "XZ", 5.45, 2867.33, 8090],
].map(([id, lender, initials, rate, payment, closingCosts]) => ({
  id: id as string,
  lender: lender as string,
  initials: initials as string,
  product: `${lender} Standard Fixed Rate Mortgage`,
  rate: rate as number,
  apr: (rate as number) + 0.3,
  payment: payment as number,
  closingCosts: closingCosts as number,
  loanAmount: 500000,
  termYears: 5,
  rateType: "Fixed" as const,
  status: "Closed" as const,
  rateHoldDays: 90,
  amortYears: 25,
  emotionalTags: ["Savings & Value"],
  tagline: "Reliable rate from a trusted lender.",
  features: ["Skip-a-payment", "Portable"],
  description: "Qualified product available for your application.",
}));

function QualifiedProductsPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Purchase";

  const [selected, setSelected] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const all = useMemo(() => [...TOP, ...ALL_OTHERS], []);
  const byId = (id: string) => all.find((p) => p.id === id)!;
  const isSelected = (id: string) => selected.includes(id);
  const atMax = selected.length >= MAX_SELECT;

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_SELECT ? prev : [...prev, id],
    );
  };
  const remove = (id: string) => setSelected((prev) => prev.filter((x) => x !== id));

  const canSubmit = selected.length >= 2;
  const progress = selected.length === 0 ? 0 : selected.length >= 2 ? 100 : 50;

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        tx={tx}
        title="Qualified Products"
        subtitle="Select up to 3 mortgage products to submit with your application."
        progress={progress}
        saveStatus="saved"
      />

      <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Transparency Verified — You see every product you qualify for. No bias. No hidden deals.
            </p>
            <p className="text-xs text-muted-foreground">
              We compared 12,438 mortgage options across 25 lenders to find your best matches.
            </p>
          </div>
        </div>
        <button className="hidden shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted sm:inline-flex">
          <Info className="h-3.5 w-3.5" /> Learn More
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-semibold text-foreground">Top 5 Matches — Curated For You</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              These products best align with your financial goals and lifestyle needs.
            </p>
          </div>

          <div className="space-y-3">
            {TOP.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                selected={isSelected(p.id)}
                disabled={!isSelected(p.id) && atMax}
                onSelect={() => toggle(p.id)}
                onDetails={() => setDetailsId(p.id)}
              />
            ))}
          </div>

          <div className="mt-8 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-base font-semibold text-foreground">All Qualified Products</h2>
                <p className="text-xs text-muted-foreground">
                  {ALL_OTHERS.length} more products match your profile
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {showAll ? "Hide" : `View All (${ALL_OTHERS.length})`}
              <ChevronDown className={`h-3.5 w-3.5 transition ${showAll ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showAll ? (
            <div className="space-y-3">
              {ALL_OTHERS.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  compact
                  selected={isSelected(p.id)}
                  disabled={!isSelected(p.id) && atMax}
                  onSelect={() => toggle(p.id)}
                  onDetails={() => setDetailsId(p.id)}
                />
              ))}
            </div>
          ) : (
            <button
              onClick={() => setShowAll(true)}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-10 text-center transition hover:border-primary/40 hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                <Filter className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">Explore More Options</p>
              <p className="text-xs text-muted-foreground">
                Click to view {ALL_OTHERS.length} additional qualified products
              </p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                View All Products <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          )}

          <p className="mt-6 text-center text-xs italic text-muted-foreground">
            "Most sites show 2 deals. We show your full universe — simplified, not filtered."
          </p>
        </div>

        {/* Cart - Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <CartPanel
              selected={selected}
              byId={byId}
              onRemove={remove}
              onClear={() => setSelected([])}
              onSubmit={() =>
                navigate({
                  to: "/portal/applications/$applicationId/product-review-consent",
                  params: { applicationId },
                })
              }
              canSubmit={canSubmit}
            />
          </div>
        </aside>
      </div>

      {/* Mobile cart FAB */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xl lg:hidden"
      >
        <ShoppingCart className="h-4 w-4" />
        Cart
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground px-1 text-[11px] font-bold text-primary">
          {selected.length}
        </span>
      </button>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 lg:hidden" onClick={() => setCartOpen(false)}>
          <div className="w-full rounded-t-2xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Your Cart</h3>
              <button onClick={() => setCartOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <CartPanel
              selected={selected}
              byId={byId}
              onRemove={remove}
              onClear={() => setSelected([])}
              onSubmit={() => {
                setCartOpen(false);
                navigate({
                  to: "/portal/applications/$applicationId/product-review-consent",
                  params: { applicationId },
                });
              }}
              canSubmit={canSubmit}
              embedded
            />
          </div>
        </div>
      )}

      {detailsId && (
        <DetailsModal
          p={byId(detailsId)}
          selected={isSelected(detailsId)}
          disabled={!isSelected(detailsId) && atMax}
          onClose={() => setDetailsId(null)}
          onToggle={() => toggle(detailsId)}
        />
      )}
    </PageShell>
  );
}

function ProductCard({
  p,
  selected,
  disabled,
  onSelect,
  onDetails,
  compact,
}: {
  p: Product;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onDetails: () => void;
  compact?: boolean;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {p.initials}
          </div>
          <div className="min-w-0 md:hidden">
            <h3 className="text-sm font-semibold text-foreground">{p.lender}</h3>
            {p.badge && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Sparkles className="h-2.5 w-2.5" /> {p.badge}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="hidden items-center gap-2 md:flex">
            <h3 className="text-sm font-semibold text-foreground">{p.lender}</h3>
            {p.badge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Sparkles className="h-2.5 w-2.5" /> {p.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{p.product}</p>

          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="rounded border border-border px-1.5 py-0.5">{p.rateType}</span>
              <span className="rounded border border-border px-1.5 py-0.5">{p.status}</span>
              <span className="text-muted-foreground">{p.termYears} Years</span>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Mortgage Rate</p>
              <p className="text-xl font-bold text-primary">{p.rate.toFixed(2)}%</p>
              <p className="text-[10px] text-muted-foreground">APR {p.apr.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Monthly Payment</p>
              <p className="text-base font-semibold text-foreground">{fmtMoney(p.payment)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Est. Closing Costs</p>
              <p className="text-base font-semibold text-foreground">{fmtMoney(p.closingCosts)}</p>
            </div>
          </div>

          {!compact && (
            <>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.emotionalTags.map((t) => (
                  <span key={t} className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-foreground">
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs italic text-muted-foreground">"{p.tagline}"</p>
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Features</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {p.features.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 text-[11px] text-foreground">
                      <Check className="h-3 w-3 text-mint-foreground" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-row gap-2 md:w-32 md:flex-col">
          <button
            onClick={onSelect}
            disabled={disabled}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition ${
              selected
                ? "bg-mint text-mint-foreground hover:bg-mint/90"
                : disabled
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {selected ? (
              <span className="inline-flex items-center justify-center gap-1"><Check className="h-3.5 w-3.5" /> Selected</span>
            ) : disabled ? (
              <span className="inline-flex items-center justify-center gap-1"><Lock className="h-3 w-3" /> Max 3</span>
            ) : (
              "Select"
            )}
          </button>
          <button
            onClick={onDetails}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <Info className="h-3.5 w-3.5" /> Details
          </button>
        </div>
      </div>
    </article>
  );
}

function CartPanel({
  selected,
  byId,
  onRemove,
  onClear,
  onSubmit,
  canSubmit,
  embedded,
}: {
  selected: string[];
  byId: (id: string) => Product;
  onRemove: (id: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  embedded?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card shadow-sm ${embedded ? "" : "p-4"}`}>
      {!embedded && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Selected Products</h3>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
            {selected.length}/{MAX_SELECT}
          </span>
        </div>
      )}

      <div className={embedded ? "p-3 pt-0" : ""}>
        {selected.length === 0 ? (
          <div className="rounded-xl bg-muted/40 p-4 text-center">
            <ShoppingCart className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-xs font-medium text-foreground">No products selected yet.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Select products to compare and apply.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {selected.map((id) => {
              const p = byId(id);
              return (
                <li key={id} className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                        {p.initials}
                      </div>
                      <p className="truncate text-xs font-semibold">{p.lender}</p>
                    </div>
                    <button onClick={() => onRemove(id)} className="text-coral hover:opacity-70">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <dl className="mt-2 space-y-0.5 text-[11px]">
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Mortgage:</dt><dd className="font-medium text-foreground">{fmtMoney(p.loanAmount)}</dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Rate:</dt><dd className="font-medium text-primary">{p.rate.toFixed(2)}%</dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Payment:</dt><dd className="font-medium text-foreground">{fmtMoney(p.payment)}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-3 space-y-2">
          {!canSubmit && selected.length > 0 && (
            <p className="text-center text-[11px] text-muted-foreground">
              Select at least two products to begin submission.
            </p>
          )}
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="w-full rounded-md bg-primary px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            Begin Submission
          </button>
          {selected.length > 0 && (
            <button
              onClick={onClear}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" /> Clear Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailsModal({
  p,
  selected,
  disabled,
  onClose,
  onToggle,
}: {
  p: Product;
  selected: boolean;
  disabled: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{p.lender}</h3>
            <p className="text-xs text-muted-foreground">{p.product}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Interest Rate</p>
            <p className="text-2xl font-bold text-primary">{p.rate.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Payment</p>
            <p className="text-2xl font-bold text-foreground">{fmtMoney(p.payment)}</p>
          </div>
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-semibold">Product Details</h4>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <Row k="Loan Amount" v={fmtMoney(p.loanAmount)} />
            <Row k="Term" v={`${p.termYears} Years`} />
            <Row k="Rate Hold" v={`${p.rateHoldDays} Days`} />
            <Row k="Max Amortization" v={`${p.amortYears} Years`} />
          </div>
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-semibold">Features</h4>
          <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-xs">
            {p.features.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-mint-foreground" /> {f}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-semibold">Description</h4>
          <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => { onToggle(); onClose(); }}
            disabled={!selected && disabled}
            className={`rounded-md px-3 py-2.5 text-xs font-semibold ${
              selected
                ? "bg-coral text-white hover:opacity-90"
                : disabled
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {selected ? "Remove Selection" : disabled ? "Cart Full (Max 3)" : "Add to Cart"}
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-2.5 text-xs font-medium hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{k}:</span>
      <span className="font-medium text-foreground">{v}</span>
    </div>
  );
}