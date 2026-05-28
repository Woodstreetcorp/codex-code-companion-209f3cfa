import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Gift,
  Home,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getBorrowerOfferReviewStatus,
  storeBorrowerOfferReviewStatus,
  type BorrowerOfferReviewSummary,
  type OfferSection,
  type OfferSectionStatus,
} from "@/lib/api/borrowerOfferReviewApi";
import {
  getBorrowerProductMatchStatus,
  storeBorrowerProductMatchStatus,
  type ProductMatchStatusResponse,
} from "@/lib/api/borrowerProductMatchStatusApi";
import {
  getBorrowerLenderPackagingReadiness,
  storeBorrowerLenderPackagingReadiness,
  type LenderPackagingReadinessResponse,
  type LenderPackagingSummary,
} from "@/lib/api/borrowerLenderPackagingReadinessApi";
import {
  getBorrowerProductOptions,
  storeBorrowerProductOptions,
  type BorrowerProductOption,
  type BorrowerProductOptionsResponse,
} from "@/lib/api/borrowerProductOptionsApi";
import {
  listBorrowerSelectedProducts,
  selectBorrowerProductOption,
  storeBorrowerSelectedProducts,
  type BorrowerSelectedProduct,
  type BorrowerSelectedProductsResponse,
} from "@/lib/api/borrowerSelectedProductsApi";
import {
  getBorrowerOfferBundleSummary,
  storeBorrowerOfferBundleSummary,
  type BorrowerOfferBundleSummary,
} from "@/lib/api/borrowerOfferBundleApi";
import { getProductMatchDisclaimer } from "@/lib/productMatching/productMatchCopy";

// ── Safe string helper ────────────────────────────────────────────────────────
//
// Prevents React error #31 ("Objects are not valid as a React child") when an
// API field typed as string | null arrives at runtime as an object.
function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.label === "string") return obj.label;
    if (typeof obj.text === "string") return obj.text;
  }
  return "";
}

function safeTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safeString(item).trim()).filter(Boolean);
}

function nestedNumber(source: unknown, key: string): number | null {
  if (!source || typeof source !== "object") return null;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

export const Route = createFileRoute("/portal/offers")({
  head: () => ({
    meta: [
      { title: "Your Mortgage Recommendations — approvU" },
      {
        name: "description",
        content:
          "See your personalized mortgage recommendations and home bundle benefits, based on your qualification details.",
      },
    ],
  }),
  component: OffersReviewPage,
});

// ── Preliminary path card definitions ────────────────────────────────────────

type PreliminaryCard = {
  id: string;
  label: string;
  badge?: string;
  recommended?: boolean;
  tagline: string;
  details: string[];
};

function getPreliminaryCards(pathValue: string | null | undefined): PreliminaryCard[] {
  if (pathValue === "prime") {
    return [
      {
        id: "prime-recommended",
        label: "Recommended Mortgage Path",
        badge: "Best Value",
        recommended: true,
        tagline: "A competitive fixed-rate path matched to your qualification profile.",
        details: ["Fixed rate", "5-year term", "Standard qualification"],
      },
      {
        id: "prime-lowest-payment",
        label: "Lowest Payment Path",
        badge: "Lowest Payment",
        tagline: "A variable-rate option designed to minimize your monthly commitment.",
        details: ["Variable rate", "5-year term", "Payment flexibility"],
      },
      {
        id: "prime-balanced",
        label: "Balanced Value Path",
        badge: "Flexible Option",
        tagline: "A shorter fixed term balancing rate stability with renewal flexibility.",
        details: ["Fixed rate", "3-year term", "Renewal flexibility"],
      },
    ];
  }

  if (pathValue === "alternative") {
    return [
      {
        id: "alt-flexible",
        label: "Flexible Approval Path",
        badge: "Best Fit",
        recommended: true,
        tagline: "A mortgage path tailored for non-standard qualification scenarios.",
        details: ["Fixed rate", "1–2 year term", "Flexible qualification"],
      },
      {
        id: "alt-standard",
        label: "Alternative Lending Path",
        badge: "Alternative",
        tagline: "A path for borrowers who fall outside conventional lending criteria.",
        details: ["Fixed rate", "2-year term", "Alternative qualification"],
      },
    ];
  }

  return [];
}

// ── Route hint resolver ───────────────────────────────────────────────────────

function resolveRoute(hint?: string | null): string {
  if (!hint) return "/portal";
  const trimmed = hint.trim();
  const routeMap: Record<string, string> = {
    application: "/portal/application",
    application_workspace: "/portal/application",
    review_submit: "/portal/application/review-submit",
    consents: "/portal/application/consents",
    documents: "/portal/documents",
    document_vault: "/portal/documents",
    borrower_profile: "/internal/full-application",
    income: "/internal/full-application",
    liabilities: "/internal/full-application",
    property: "/applications/current/property-financing/target-property",
    assets_down_payment: "/applications/current/property-financing/down-payment",
    down_payment: "/applications/current/property-financing/down-payment",
  };
  const mapped = routeMap[trimmed.replace(/^\/+/, "")];
  if (mapped) return mapped;
  if (
    trimmed.startsWith("/portal") ||
    trimmed.startsWith("/applications/") ||
    trimmed.startsWith("/internal/") ||
    trimmed.startsWith("/purchase") ||
    trimmed.startsWith("/refinance")
  ) {
    return trimmed;
  }
  return "/portal";
}

// ── Section status config ──────────────────────────────────────────────────────

type SectionConfig = {
  label: string;
  badgeClass: string;
  dotClass: string;
};

const SECTION_STATUS_CONFIG: Record<OfferSectionStatus, SectionConfig> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-secondary/10 text-secondary border border-secondary/20",
    dotClass: "bg-secondary",
  },
  ready: {
    label: "Ready",
    badgeClass: "bg-mint/15 text-mint-foreground border border-mint/30",
    dotClass: "bg-mint",
  },
  needs_attention: {
    label: "Needs Attention",
    badgeClass: "bg-coral/10 text-coral border border-coral/20",
    dotClass: "bg-coral",
  },
  complete: {
    label: "Complete",
    badgeClass: "bg-mint/15 text-mint-foreground border border-mint/30",
    dotClass: "bg-mint",
  },
  not_started: {
    label: "Not Started",
    badgeClass: "bg-muted text-muted-foreground border border-border",
    dotClass: "bg-muted-foreground/40",
  },
};

function sectionStatusConfig(status?: OfferSectionStatus | null): SectionConfig {
  return SECTION_STATUS_CONFIG[status ?? "not_started"] ?? SECTION_STATUS_CONFIG.not_started;
}

// ── Page component ────────────────────────────────────────────────────────────

function OffersReviewPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<BorrowerOfferReviewSummary | null>(null);
  const [productMatchResult, setProductMatchResult] = useState<ProductMatchStatusResponse | null>(
    null,
  );
  const [productOptionsResult, setProductOptionsResult] =
    useState<BorrowerProductOptionsResponse | null>(null);
  const [selectedProductsResult, setSelectedProductsResult] =
    useState<BorrowerSelectedProductsResponse | null>(null);
  const [lenderPackagingReadiness, setLenderPackagingReadiness] =
    useState<LenderPackagingReadinessResponse | null>(null);
  const [bundleSummary, setBundleSummary] = useState<BorrowerOfferBundleSummary | null>(null);
  const [selectingOptionReference, setSelectingOptionReference] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          reviewResult,
          productMatchStatusResult,
          productOptionsData,
          selectedProductsData,
          lenderPackagingData,
          bundleData,
        ] = await Promise.all([
          getBorrowerOfferReviewStatus(),
          getBorrowerProductMatchStatus(),
          getBorrowerProductOptions(),
          listBorrowerSelectedProducts(),
          getBorrowerLenderPackagingReadiness(),
          getBorrowerOfferBundleSummary(),
        ]);
        if (!active) return;
        storeBorrowerOfferReviewStatus(reviewResult);
        setSummary(reviewResult);
        storeBorrowerProductMatchStatus(productMatchStatusResult);
        setProductMatchResult(productMatchStatusResult);
        storeBorrowerProductOptions(productOptionsData);
        setProductOptionsResult(productOptionsData);
        storeBorrowerSelectedProducts(selectedProductsData);
        setSelectedProductsResult(selectedProductsData);
        storeBorrowerLenderPackagingReadiness(lenderPackagingData);
        setLenderPackagingReadiness(lenderPackagingData);
        storeBorrowerOfferBundleSummary(bundleData);
        setBundleSummary(bundleData);
      } catch (failure) {
        if (!active) return;
        setError(
          failure instanceof Error ? failure.message : "Your recommendations could not be loaded.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function handleSelectProductOption(publicReference: string) {
    setSelectingOptionReference(publicReference);
    setSelectionError(null);
    setSelectionNotice(null);

    try {
      const selectionResult = await selectBorrowerProductOption(publicReference);

      if (!selectionResult.endpoint_available || selectionResult.ok === false) {
        setSelectionError("We could not select this path right now. Please try again.");
        setSelectingOptionReference(null);
        return;
      }

      storeBorrowerSelectedProducts(selectionResult);
      setSelectedProductsResult(selectionResult);
      setSelectionNotice(
        "This path was selected for advisor review. This is not a lender approval.",
      );

      const [selectedRefresh, optionsRefresh, packagingRefresh] = await Promise.all([
        listBorrowerSelectedProducts(),
        getBorrowerProductOptions(),
        getBorrowerLenderPackagingReadiness(),
      ]);
      storeBorrowerSelectedProducts(selectedRefresh);
      storeBorrowerProductOptions(optionsRefresh);
      storeBorrowerLenderPackagingReadiness(packagingRefresh);
      setSelectedProductsResult(selectedRefresh);
      setProductOptionsResult(optionsRefresh);
      setLenderPackagingReadiness(packagingRefresh);

      // Navigate to application after a brief moment so the notice is visible
      setTimeout(() => {
        void navigate({ to: "/portal/application" });
      }, 1500);
    } catch {
      setSelectionError("We could not select this path right now. Please try again.");
    } finally {
      setSelectingOptionReference(null);
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Preparing your mortgage recommendations…
        </p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error || !summary?.ok) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          We could not load your recommendations
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error ?? "Your session may have expired. Sign in again to continue."}
        </p>
        <Link
          to="/login"
          search={{ redirect: "/portal/offers" }}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Sign in
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>
    );
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const readiness = summary.readiness;
  const sections = summary.offer_sections ?? [];
  const primaryAction = summary.primary_action;
  const disclaimers = summary.disclaimers?.filter(Boolean) ?? [];
  const primaryRoute = resolveRoute(primaryAction?.route_hint);
  const preliminaryPathValue = summary.preliminary_path?.value;

  const safeProductOptions =
    productOptionsResult?.options?.filter((option) => option?.advisor_reviewed === true) ?? [];
  const productOptionsAvailable =
    productOptionsResult?.endpoint_available === true &&
    productOptionsResult.ok !== false &&
    productOptionsResult.options_available === true &&
    safeProductOptions.length > 0;

  const selectedProducts =
    selectedProductsResult?.endpoint_available === true && selectedProductsResult.ok !== false
      ? (selectedProductsResult.selected_products?.filter(Boolean) ?? [])
      : [];
  const selectedOptionReferences = new Set(
    selectedProducts
      .map((product) => selectedProductOptionReference(product))
      .filter((value): value is string => Boolean(value)),
  );

  const packagingInProgress =
    lenderPackagingReadiness?.status === "ready_for_lender_packaging" ||
    Boolean(
      productMatchResult?.endpoint_available &&
      productMatchResult.status === "lender_review_placeholder",
    );
  const showPackagingGuidance =
    selectedProducts.length > 0 || lenderPackagingReadiness?.endpoint_available === true;

  const productMatchCounts =
    productMatchResult && typeof productMatchResult.counts === "object"
      ? productMatchResult.counts
      : null;
  const totalProductMatches = nestedNumber(productMatchCounts, "total_matches");
  const noActiveApplication =
    productOptionsResult?.status === "no_application" ||
    productMatchResult?.next_step === "complete_application";

  // Preliminary cards state: shown when no formal advisor-reviewed options exist
  const preliminaryCards = getPreliminaryCards(preliminaryPathValue);
  const hasPreliminaryCards =
    !productOptionsAvailable && !noActiveApplication && preliminaryCards.length > 0;

  // Tailored review fallback: shown when no paths can be generated at all
  const needsTailoredReview = !productOptionsAvailable && !hasPreliminaryCards;

  const hasBundleAssignment = bundleSummary?.has_assignment === true && bundleSummary.bundle;

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Your mortgage recommendations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Your Personalized Mortgage Recommendations
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Based on your qualification details, here are your recommended mortgage paths. Your
          advisor will confirm final options before any lender step.
        </p>
      </div>

      {/* ── State 1: Advisor-reviewed product options ────────────────────────── */}
      {productOptionsAvailable && (
        <>
          {selectionNotice && (
            <div className="rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint-foreground">
              {selectionNotice}
            </div>
          )}
          {selectionError && (
            <div className="rounded-xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">
              {selectionError}
            </div>
          )}
          <ProductOptionsList
            options={safeProductOptions}
            selectedOptionReferences={selectedOptionReferences}
            selectingOptionReference={selectingOptionReference}
            onSelect={handleSelectProductOption}
          />
        </>
      )}

      {/* ── State 2: Preliminary path cards ─────────────────────────────────── */}
      {hasPreliminaryCards && (
        <PreliminaryMortgagePaths
          cards={preliminaryCards}
          pathValue={preliminaryPathValue}
          bundleValue={bundleSummary?.bundle?.estimated_borrower_value ?? null}
        />
      )}

      {/* ── State 3: Tailored review ─────────────────────────────────────────── */}
      {needsTailoredReview && <TailoredReviewState noApplication={noActiveApplication} />}

      {/* ── Bundle benefits section ──────────────────────────────────────────── */}
      {hasBundleAssignment && (
        <HowBenefitsWork bundle={bundleSummary!.bundle!} progress={bundleSummary!.progress} />
      )}

      {/* ── Selected paths summary (post-selection) ──────────────────────────── */}
      {selectedProducts.length > 0 && (
        <>
          {!productOptionsAvailable && selectionNotice && (
            <div className="rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint-foreground">
              {selectionNotice}
            </div>
          )}
          {!productOptionsAvailable && selectionError && (
            <div className="rounded-xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">
              {selectionError}
            </div>
          )}
          <SelectedProductPathsSummary products={selectedProducts} />
        </>
      )}

      {/* ── Lender packaging (advanced stage) ───────────────────────────────── */}
      {showPackagingGuidance && (
        <LenderPackagingReadinessCard
          readiness={lenderPackagingReadiness}
          selectedProductsCount={selectedProducts.length}
          packagingInProgress={packagingInProgress}
        />
      )}

      {/* ── Readiness checklist (if items outstanding) ───────────────────────── */}
      {((readiness?.missing_items?.filter(Boolean) ?? []).length > 0 ||
        readiness?.application_ready === false) && <ReadinessChecklist readiness={readiness} />}

      {/* ── Offer sections (if backend returns them) ─────────────────────────── */}
      {sections.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground">Review sections</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each area of your review, and what needs to happen next.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              <OfferSectionCard key={section.key ?? section.label} section={section} />
            ))}
          </div>
        </div>
      )}

      {/* ── Primary action CTA (from backend) ───────────────────────────────── */}
      {primaryAction?.label && !productOptionsAvailable && !hasPreliminaryCards && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
                Your next step
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {safeString(primaryAction.label)}
              </p>
            </div>
            <Link
              to={primaryRoute}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Continue
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── API-level disclaimers ────────────────────────────────────────────── */}
      {disclaimers.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/40 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Important
          </p>
          {disclaimers.map((text, index) => (
            <p
              key={typeof text === "string" ? text : index}
              className="mt-2 text-xs text-muted-foreground"
            >
              {safeString(text)}
            </p>
          ))}
        </div>
      )}

      {/* ── Compliance copy ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">These are not approvals.</span> Final terms depend on
          lender review, document verification, and underwriting. Mortgage paths shown are based on
          your qualification profile and are subject to lender conditions. approvU does not
          guarantee any specific rate, product, or approval outcome. Your advisor will confirm all
          options before any lender step.
        </p>
      </div>

      {/* ── Quick links ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/portal/documents"
          className="inline-flex items-center gap-1.5 font-medium text-secondary hover:underline"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Document Vault
        </Link>
        <Link
          to="/portal/application"
          className="inline-flex items-center gap-1.5 font-medium text-secondary hover:underline"
        >
          <FileText className="h-3.5 w-3.5" />
          Application Workspace
        </Link>
        <Link
          to="/portal"
          className="inline-flex items-center gap-1.5 font-medium text-secondary hover:underline"
        >
          <Clock className="h-3.5 w-3.5" />
          Back to portal
        </Link>
      </div>
    </div>
  );
}

// ── State 2: Preliminary mortgage path cards ──────────────────────────────────

function PreliminaryMortgagePaths({
  cards,
  pathValue,
  bundleValue,
}: {
  cards: PreliminaryCard[];
  pathValue?: string | null;
  bundleValue: number | null;
}) {
  const isPrime = pathValue === "prime";

  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
            {isPrime ? "Prime mortgage paths" : "Mortgage paths"}
          </p>
          <span className="inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
            Preliminary
          </span>
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          {isPrime ? "These paths are likely available to you" : "Your tailored mortgage paths"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Based on your qualification details, these paths most closely match your profile. Your
          advisor will confirm final options and eligibility before any lender step.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <PreliminaryOfferCard key={card.id} card={card} bundleValue={bundleValue} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {getProductMatchDisclaimer()} No lender names, exact rates, or approval decisions are shown.
        Paths are preliminary and subject to advisor review.
      </p>
    </section>
  );
}

function PreliminaryOfferCard({
  card,
  bundleValue,
}: {
  card: PreliminaryCard;
  bundleValue: number | null;
}) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
        card.recommended ? "border-secondary/30 bg-secondary/5" : "border-border bg-card"
      }`}
    >
      {card.recommended && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
            <Star className="h-3 w-3" />
            Best Value — Recommended
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Recommended path
        </p>
        {card.badge && (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              card.recommended ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"
            }`}
          >
            {card.badge}
          </span>
        )}
      </div>

      <h3 className="mt-2 text-base font-semibold text-foreground">{card.label}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{card.tagline}</p>

      <ul className="mt-4 space-y-1.5">
        {card.details.map((detail) => (
          <li key={detail} className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-secondary" />
            {detail}
          </li>
        ))}
      </ul>

      {bundleValue !== null && bundleValue > 0 && (
        <div className="mt-4 rounded-xl border border-secondary/20 bg-secondary/5 px-3 py-2">
          <p className="text-xs font-semibold text-secondary">
            + ${bundleValue.toLocaleString("en-CA")} in estimated bundle benefits
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Included with your approvU Home Bundle
          </p>
        </div>
      )}

      <div className="mt-auto pt-5">
        <Link
          to="/portal/application"
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Select This Option
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

// ── State 3: Tailored review ──────────────────────────────────────────────────

function TailoredReviewState({ noApplication }: { noApplication: boolean }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <Home className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
            Mortgage review
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Your file needs a tailored review
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {noApplication
              ? "Based on your qualification details, our team will prepare a personalized review once your application is started. Complete your application to see your recommended paths."
              : "Based on your qualification details, our team will prepare a personalized review for you. Your advisor will confirm recommended paths and next steps shortly."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/portal/application"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {noApplication ? "Start your application" : "Continue your application"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
            <Link
              to="/portal/documents"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Upload Documents
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Bundle benefits section ───────────────────────────────────────────────────

function HowBenefitsWork({
  bundle,
  progress,
}: {
  bundle: NonNullable<BorrowerOfferBundleSummary["bundle"]>;
  progress: BorrowerOfferBundleSummary["progress"];
}) {
  const value = bundle.estimated_borrower_value;
  const itemCount = bundle.item_count ?? progress?.total_items;
  const selectedCount = progress?.selected_count;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Your included benefits
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              How Your Benefits Work
            </h2>
          </div>
        </div>

        {value !== null && value !== undefined && value > 0 && (
          <div className="rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-2 text-center sm:text-right">
            <p className="text-lg font-bold text-secondary">${value.toLocaleString("en-CA")}</p>
            <p className="text-xs text-muted-foreground">Estimated benefit value</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-base font-semibold text-foreground">
          {safeString(bundle.borrower_facing_title)}
        </p>
        {bundle.short_description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {safeString(bundle.short_description)}
          </p>
        )}
      </div>

      {itemCount !== null && itemCount !== undefined && itemCount > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{itemCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Included benefits</p>
          </div>
          {selectedCount !== null && selectedCount !== undefined && (
            <div className="rounded-xl border border-border bg-background px-4 py-3 text-center">
              <p className="text-2xl font-bold text-foreground">{selectedCount}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Selected by you</p>
            </div>
          )}
          {value !== null && value !== undefined && value > 0 && (
            <div className="rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-secondary">${value.toLocaleString("en-CA")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Estimated value</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/portal/application"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="mr-1.5 h-4 w-4" />
          Explore your benefits
        </Link>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Bundle benefits are included with your approvU mortgage journey. Individual benefits may
        have their own eligibility criteria. Estimated value is approximate and subject to change.
      </p>
    </section>
  );
}

// ── Product options list (State 1: advisor-reviewed) ─────────────────────────

function ProductOptionsList({
  options,
  selectedOptionReferences,
  selectingOptionReference,
  onSelect,
}: {
  options: BorrowerProductOption[];
  selectedOptionReferences: Set<string>;
  selectingOptionReference: string | null;
  onSelect: (publicReference: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
            Advisor-reviewed paths
          </p>
          <span className="inline-flex rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-semibold text-mint-foreground">
            Ready to select
          </span>
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Your Advisor-Reviewed Mortgage Paths
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These paths have been reviewed by your approvU advisor and are ready for your selection.
          Selecting a path tells our team which option you prefer — this is not a lender approval.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {options.map((option, index) => (
          <ProductOptionCard
            key={[option.option_label, option.path_label, option.created_at, index].join("-")}
            option={option}
            isSelected={
              Boolean(option.public_reference) &&
              selectedOptionReferences.has(option.public_reference ?? "")
            }
            isSelecting={selectingOptionReference === option.public_reference}
            onSelect={onSelect}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {getProductMatchDisclaimer()} No lender names, exact rates, or approval decisions are shown.
      </p>
    </section>
  );
}

function ProductOptionCard({
  option,
  isSelected,
  isSelecting,
  onSelect,
}: {
  option: BorrowerProductOption;
  isSelected: boolean;
  isSelecting: boolean;
  onSelect: (publicReference: string) => void;
}) {
  const notes = productOptionTextList(option.notes);
  const documentsNeeded = safeTextList(option.documents_needed);
  const details = [
    { label: "Category", value: formatProductOptionValue(option.product_category) },
    {
      label: "Class",
      value: typeof option.product_class_label === "string" ? option.product_class_label : null,
    },
    {
      label: "Path",
      value: typeof option.path_label === "string" ? option.path_label : null,
    },
    {
      label: "Created",
      value: option.created_at ? formatProductMatchDate(safeString(option.created_at)) : null,
    },
  ].filter((detail) => detail.value);

  return (
    <article
      className={`relative rounded-2xl border p-6 shadow-sm ${
        isSelected ? "border-mint/40 bg-mint/5" : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Advisor-reviewed mortgage path
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {safeString(option.option_label) || "Advisor-reviewed mortgage path"}
          </h3>
        </div>
        {isSelected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-semibold text-mint-foreground">
            <CheckCircle2 className="h-3 w-3" />
            Selected
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
            Advisor reviewed
          </span>
        )}
      </div>

      {details.length > 0 && (
        <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="rounded-lg border border-border bg-background px-3 py-2"
            >
              <dt className="font-semibold text-muted-foreground">{detail.label}</dt>
              <dd className="mt-0.5 text-foreground">{safeString(detail.value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {notes.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Notes
          </p>
          <ul className="mt-2 space-y-1.5">
            {notes.map((note) => (
              <li key={note} className="text-sm text-muted-foreground">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {documentsNeeded.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Documents needed
          </p>
          <ul className="mt-2 space-y-1.5">
            {documentsNeeded.map((document) => (
              <li key={document} className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                {document}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {safeString(option.disclaimer) || getProductMatchDisclaimer()}
      </p>

      <div className="mt-4">
        {option.public_reference ? (
          <button
            type="button"
            onClick={() => {
              if (option.public_reference) onSelect(option.public_reference);
            }}
            disabled={isSelected || isSelecting}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            {isSelected
              ? "Selected — routing to your application…"
              : isSelecting
                ? "Selecting…"
                : "Select This Option"}
            {!isSelected && !isSelecting && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-flex w-full items-center justify-center rounded-md bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground">
            Selection unavailable
          </span>
        )}
      </div>
    </article>
  );
}

// ── Selected paths summary ────────────────────────────────────────────────────

function SelectedProductPathsSummary({ products }: { products: BorrowerSelectedProduct[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
            Selected paths
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Paths selected for advisor review
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            These selections tell the approvU team which paths you want reviewed for packaging. They
            are not lender approvals, and final terms depend on lender review.
          </p>
        </div>
        <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
          {products.length} selected
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {products.map((product, index) => (
          <SelectedProductPathCard
            key={[product.option_label, product.path_label, product.selected_at, index].join("-")}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}

function SelectedProductPathCard({ product }: { product: BorrowerSelectedProduct }) {
  const details = [
    { label: "Category", value: formatProductOptionValue(product.product_category) },
    {
      label: "Class",
      value: typeof product.product_class_label === "string" ? product.product_class_label : null,
    },
    {
      label: "Path",
      value: typeof product.path_label === "string" ? product.path_label : null,
    },
    { label: "Status", value: formatProductOptionValue(product.selection_status) },
    {
      label: "Selected",
      value: product.selected_at ? formatProductMatchDate(safeString(product.selected_at)) : null,
    },
  ].filter((detail) => detail.value);

  return (
    <article className="rounded-xl border border-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Selected mortgage path
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {safeString(product.option_label) || "Selected mortgage path"}
          </h3>
        </div>
        <span className="inline-flex rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-semibold text-mint-foreground">
          Selected
        </span>
      </div>

      {details.length > 0 && (
        <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label} className="rounded-lg border border-border bg-card px-3 py-2">
              <dt className="font-semibold text-muted-foreground">{detail.label}</dt>
              <dd className="mt-0.5 text-foreground">{safeString(detail.value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {safeString(product.disclaimer) || getProductMatchDisclaimer()}
      </p>
    </article>
  );
}

// ── Lender packaging readiness ────────────────────────────────────────────────

function LenderPackagingReadinessCard({
  readiness,
  selectedProductsCount,
  packagingInProgress,
}: {
  readiness: LenderPackagingReadinessResponse | null;
  selectedProductsCount: number;
  packagingInProgress: boolean;
}) {
  const endpointReady = readiness?.endpoint_available === true && readiness.ok !== false;
  const isReady = endpointReady && readiness.ready === true;
  const blockers = endpointReady ? safeTextList(readiness.blockers) : [];
  const nextStep =
    endpointReady && readiness.next_step
      ? safeString(readiness.next_step)
      : "Your advisor will confirm next steps.";
  const selectedCount =
    endpointReady && typeof readiness.selected_products_count === "number"
      ? readiness.selected_products_count
      : selectedProductsCount;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
            Lender packaging readiness
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {packagingInProgress
              ? "Your advisor is preparing your package"
              : isReady
                ? "Ready for advisor packaging review"
                : "Packaging review is being prepared"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {packagingInProgress
              ? "Your selected path is being prepared for advisor review and possible packaging. This is not a lender submission, not a lender approval, and final terms depend on lender review."
              : "Your selected path is being prepared for advisor review. This is not a lender approval. Final terms depend on lender review. Your advisor will confirm next steps."}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            isReady ? "bg-mint/15 text-mint-foreground" : "bg-secondary/10 text-secondary"
          }`}
        >
          {isReady ? "Ready" : "Not ready"}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-xs md:grid-cols-3">
        <PackagingFact label="Selected paths" value={String(selectedCount)} />
        <PackagingFact
          label="Documents"
          value={formatPackagingSummary(readiness?.document_summary)}
        />
        <PackagingFact
          label="Consents"
          value={formatPackagingSummary(readiness?.consent_summary)}
        />
      </dl>

      {blockers.length > 0 ? (
        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-800">
            Items to review
          </p>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {blockers.map((blocker) => (
              <li key={blocker} className="flex items-start gap-2 text-sm text-yellow-800">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{safeString(blocker)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint-foreground">
          No packaging blockers are showing right now. Your advisor will confirm what happens next.
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">{nextStep}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {safeString(readiness?.disclaimer) || getProductMatchDisclaimer()}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to="/portal/documents"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
        >
          View Documents
        </Link>
        <Link
          to="/portal/application/review-submit"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Review Application Status
        </Link>
        <Link
          to="/portal/application/consents"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Complete Consents
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

function PackagingFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}

// ── Readiness checklist ───────────────────────────────────────────────────────

function ReadinessChecklist({ readiness }: { readiness: BorrowerOfferReviewSummary["readiness"] }) {
  const missingItems = readiness?.missing_items?.filter(Boolean) ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Application readiness</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Complete these items so approvU can assess your mortgage paths.
      </p>
      <ul className="mt-4 space-y-3">
        <ReadinessRow label="Qualification on file" ready={readiness?.application_ready ?? false} />
        <ReadinessRow
          label="Mortgage Snapshot generated"
          ready={readiness?.snapshot_ready ?? false}
        />
        <ReadinessRow
          label="Document requests resolved"
          ready={readiness?.documents_ready ?? false}
        />
      </ul>

      {missingItems.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Outstanding items
          </p>
          <ul className="mt-2 space-y-1.5">
            {missingItems.map((item, index) => (
              <li
                key={typeof item === "string" ? item : index}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                {safeString(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Offer section card ────────────────────────────────────────────────────────

function OfferSectionCard({ section }: { section: OfferSection }) {
  const config = sectionStatusConfig(section.status as OfferSectionStatus);
  const sectionRoute = resolveRoute(section.route_hint);

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {safeString(section.label ?? section.key)}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
          {config.label}
        </span>
      </div>
      {safeString(section.message) && (
        <p className="mt-2 text-xs text-muted-foreground">{safeString(section.message)}</p>
      )}
      {safeString(section.action_label) && (
        <Link
          to={sectionRoute}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
        >
          {safeString(section.action_label)}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ── Readiness row ─────────────────────────────────────────────────────────────

function ReadinessRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <li className="flex items-center gap-3">
      {ready ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-mint-foreground" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      )}
      <span className={`text-sm ${ready ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </li>
  );
}

// ── Utility functions ─────────────────────────────────────────────────────────

function productOptionTextList(value: BorrowerProductOption["notes"]): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function selectedProductOptionReference(product: BorrowerSelectedProduct): string | null {
  const candidates = [
    product.product_option_public_reference,
    typeof product.option_public_reference === "string" ? product.option_public_reference : null,
  ];
  return candidates.find(Boolean) ?? null;
}

function formatPackagingSummary(summary?: LenderPackagingSummary | null): string {
  if (!summary) return "Not available";

  const completed = summary.completed ?? summary.ready ?? null;
  const total = summary.total ?? summary.required ?? null;
  const pending = summary.pending ?? summary.missing ?? null;

  if (typeof completed === "number" && typeof total === "number") {
    return `${completed} of ${total} ready`;
  }

  if (typeof pending === "number") {
    return pending > 0 ? `${pending} pending` : "No pending items";
  }

  return "Review in progress";
}

function formatProductOptionValue(value?: unknown): string | null {
  const str = safeString(value);
  if (!str) return null;
  return str
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatProductMatchDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}
