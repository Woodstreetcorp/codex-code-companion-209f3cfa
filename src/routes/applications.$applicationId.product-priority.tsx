import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  GripVertical,
  Info,
  ListOrdered,
  Trash2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/property-financing/shared";

export const Route = createFileRoute(
  "/applications/$applicationId/product-priority",
)({
  head: () => ({
    meta: [
      { title: "Product Priority Review — approvU" },
      {
        name: "description",
        content:
          "Review and reorder your selected mortgage products before submitting your application.",
      },
    ],
  }),
  component: ProductPriorityReviewPage,
});

const MAX_SELECT = 3;

type SelectedProduct = {
  id: string;
  productName: string;
  lenderDisplayName: string;
  lenderTypePath: string;
  estimatedRate: number;
  estimatedPayment: number;
  term: string;
  rateType: "Fixed" | "Variable";
  approvalScore?: number;
  features: string[];
  homeLifeBundleValue: number;
};

const INITIAL_SELECTED: SelectedProduct[] = [
  {
    id: "fn",
    productName: "FN Dime Best — Uninsured O/O FRM",
    lenderDisplayName: "First National Financial",
    lenderTypePath: "Monoline Lender Path",
    estimatedRate: 5.34,
    estimatedPayment: 2848,
    term: "5-Year Fixed",
    rateType: "Fixed",
    approvalScore: 92,
    features: ["Portable", "Rate Hold 90 Days", "Payment Increase"],
    homeLifeBundleValue: 2350,
  },
  {
    id: "cm",
    productName: "CMLS Mtl-Quebec Uninsured FRM",
    lenderDisplayName: "CMLS",
    lenderTypePath: "Monoline Lender Path",
    estimatedRate: 5.39,
    estimatedPayment: 2857,
    term: "5-Year Fixed",
    rateType: "Fixed",
    approvalScore: 88,
    features: ["Portable", "No Penalty Payout", "Rate Drop Prior to Closing"],
    homeLifeBundleValue: 2100,
  },
  {
    id: "mc",
    productName: "MCAP Standard Fixed Rate Mortgage",
    lenderDisplayName: "MCAP Financial",
    lenderTypePath: "Monoline Lender Path",
    estimatedRate: 5.44,
    estimatedPayment: 2867,
    term: "5-Year Fixed",
    rateType: "Fixed",
    approvalScore: 85,
    features: ["Skip-a-payment", "Convertible", "Payment Increase"],
    homeLifeBundleValue: 2250,
  },
];

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function ProductPriorityReviewPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<SelectedProduct[]>(INITIAL_SELECTED);
  const [confirmed, setConfirmed] = useState(false);
  const [removedSnapshot, setRemovedSnapshot] = useState<{
    product: SelectedProduct;
    index: number;
  } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const count = products.length;

  const move = (id: string, dir: -1 | 1) => {
    setProducts((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const remove = (id: string) => {
    setProducts((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      if (i < 0) return prev;
      setRemovedSnapshot({ product: prev[i], index: i });
      const next = prev.filter((p) => p.id !== id);
      toast("Product removed from selected list.", {
        action: {
          label: "Undo",
          onClick: () => {
            setProducts((curr) => {
              if (curr.some((c) => c.id === prev[i].id)) return curr;
              const restored = [...curr];
              restored.splice(Math.min(i, restored.length), 0, prev[i]);
              return restored;
            });
            setRemovedSnapshot(null);
          },
        },
      });
      return next;
    });
  };

  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (overId: string) => {
    if (!dragId || dragId === overId) return setDragId(null);
    setProducts((prev) => {
      const from = prev.findIndex((p) => p.id === dragId);
      const to = prev.findIndex((p) => p.id === overId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDragId(null);
  };

  const canContinue = count >= 1 && confirmed;

  const handleContinue = () => {
    if (!canContinue) return;
    toast.success("Product priority saved.");
    navigate({
      to: "/applications/$applicationId/mortgage-request",
      params: { applicationId },
    });
  };

  void removedSnapshot;

  return (
    <PageShell>
      {/* Header */}
      <header className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <Link
          to="/applications/$applicationId/mortgage-offers"
          params={{ applicationId }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Mortgage Offers
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                <Sparkles className="h-3 w-3" /> Mortgage Application
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                Application #{applicationId}
              </span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
              Review Your Mortgage Product Priority
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm the order you want approvU to follow when reviewing your selected mortgage
              products.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to="/applications/$applicationId/mortgage-offers"
              params={{ applicationId }}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Selected Products
            </Link>
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Application <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Priority Explanation Card */}
      <section className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ListOrdered className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground">How Product Priority Works</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Your selected mortgage products are reviewed in priority order. approvU will review
              your first-choice product first. Your backup products are only used if your first
              choice cannot proceed.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <PriorityHint num={1} label="First choice" tone="primary" />
              <PriorityHint num={2} label="Backup option" tone="muted" />
              <PriorityHint num={3} label="Backup option" tone="muted" />
            </div>

            <p className="mt-4 inline-flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Your final mortgage product, rate, payment, and benefits may change after your full
              application is verified.
            </p>
          </div>
        </div>
      </section>

      {/* Count badge + helpers */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
          <span className="text-muted-foreground">Selected Products:</span>
          <span className="font-semibold text-foreground">
            {count} of {MAX_SELECT}
          </span>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Drag products to reorder your priority.
        </p>
      </div>

      {/* Selected Products List or Empty State */}
      {count === 0 ? (
        <EmptySelectedProductsState applicationId={applicationId} />
      ) : (
        <ul className="space-y-3">
          {products.map((p, idx) => (
            <SelectedProductPriorityCard
              key={p.id}
              product={p}
              priority={idx + 1}
              isFirst={idx === 0}
              isLast={idx === products.length - 1}
              onMoveUp={() => move(p.id, -1)}
              onMoveDown={() => move(p.id, 1)}
              onRemove={() => remove(p.id)}
              draggable
              dragging={dragId === p.id}
              onDragStart={() => onDragStart(p.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(p.id)}
              onDragEnd={() => setDragId(null)}
            />
          ))}
        </ul>
      )}

      {/* Add backup hint */}
      {count > 0 && count < MAX_SELECT && (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            You can continue with one product or add backup options.
          </p>
          <Link
            to="/applications/$applicationId/mortgage-offers"
            params={{ applicationId }}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            Add Backup Product <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Confirmation Checklist */}
      {count > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Confirm your priority</h2>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-foreground" />
              Your first-choice product will be reviewed first.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-foreground" />
              Backup products are only used if needed.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-foreground" />
              Your final product, rate, payment, and benefits may change after your full
              application is reviewed.
            </li>
          </ul>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-xs text-foreground">
              I understand that this order represents my preferred product priority and that
              approvU will review my application based on this order.
            </span>
          </label>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Priority & Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {!confirmed && (
            <p className="mt-2 text-right text-[11px] text-muted-foreground">
              Check the box above to continue.
            </p>
          )}
        </section>
      )}
    </PageShell>
  );
}

function PriorityHint({
  num,
  label,
  tone,
}: {
  num: number;
  label: string;
  tone: "primary" | "muted";
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
        tone === "primary"
          ? "border-primary/30 bg-primary/10"
          : "border-border bg-background"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
          tone === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {num}
      </span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}

function SelectedProductPriorityCard({
  product,
  priority,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  draggable,
  dragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  product: SelectedProduct;
  priority: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  draggable?: boolean;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}) {
  const isFirstChoice = priority === 1;
  return (
    <li
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group overflow-hidden rounded-2xl border bg-card shadow-sm transition ${
        isFirstChoice ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
      } ${dragging ? "opacity-50" : ""}`}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-start">
        {/* Priority + drag */}
        <div className="flex items-center gap-3 md:flex-col md:items-center md:gap-2">
          <button
            type="button"
            aria-label="Drag to reorder"
            className="hidden cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing md:block"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              isFirstChoice
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {priority}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {isFirstChoice ? "First Choice" : "Backup"}
          </span>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{product.lenderDisplayName}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {product.lenderTypePath}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{product.productName}</p>

          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">
                Estimated Rate
              </p>
              <p className="text-lg font-bold text-primary">
                {product.estimatedRate.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">
                Monthly Payment
              </p>
              <p className="text-base font-semibold text-foreground">
                {fmtMoney(product.estimatedPayment)}/mo
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Term</p>
              <p className="text-sm font-semibold text-foreground">{product.term}</p>
            </div>
            {typeof product.approvalScore === "number" && (
              <div>
                <p className="text-[10px] font-medium uppercase text-muted-foreground">
                  Approval Score
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {product.approvalScore}/100
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">
                Home Life Bundle
              </p>
              <p className="text-sm font-semibold text-foreground">
                {fmtMoney(product.homeLifeBundleValue)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.features.map((f) => (
              <span
                key={f}
                className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-row flex-wrap gap-2 md:w-32 md:flex-col">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="h-3.5 w-3.5" /> Move Up
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-[11px] font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDown className="h-3.5 w-3.5" /> Move Down
          </button>
          <button
            onClick={onRemove}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-coral/40 bg-background px-2 py-1.5 text-[11px] font-medium text-coral hover:bg-coral/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptySelectedProductsState({ applicationId }: { applicationId: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
        <ListOrdered className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">No mortgage products selected</p>
        <p className="mt-1 text-xs text-muted-foreground">
          You need to select at least one mortgage product before continuing.
        </p>
      </div>
      <Link
        to="/applications/$applicationId/mortgage-offers"
        params={{ applicationId }}
        className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Select Mortgage Products <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}