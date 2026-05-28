import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
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
  getProductMatchDisclaimer,
  getProductMatchStatusCopy,
  PRODUCT_MATCH_CTA_LABELS,
  type ProductMatchStatus,
  type ProductMatchStatusCopy,
} from "@/lib/productMatching/productMatchCopy";

// ── Safe string helper ────────────────────────────────────────────────────────
//
// Prevents React error #31 ("Objects are not valid as a React child") when an
// API field typed as string | null arrives at runtime as an object.  For
// example, some Laravel responses wrap messages in { message: "..." } even for
// fields the TypeScript types declare as plain strings.
//
// Usage: replace `{field}` with `{safeString(field)}` at every JSX render site
// that sources its value directly from an API response.
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

export const Route = createFileRoute("/portal/offers")({
  head: () => ({
    meta: [
      { title: "Offers & Review Status — approvU" },
      {
        name: "description",
        content:
          "Track your mortgage options review status and see what needs to happen before your advisor can confirm your lending path.",
      },
    ],
  }),
  component: OffersReviewPage,
});

// ── Review status display config ──────────────────────────────────────────────

type ReviewConfig = {
  label: string;
  chipClass: string;
};

const REVIEW_STATUS_CONFIG: Record<string, ReviewConfig> = {
  pending_review: {
    label: "Pending Review",
    chipClass: "bg-muted text-muted-foreground",
  },
  needs_more_information: {
    label: "More Information Needed",
    chipClass: "bg-yellow-50 text-yellow-700",
  },
  documents_required: {
    label: "Documents Required",
    chipClass: "bg-coral/10 text-coral",
  },
  advisor_review_in_progress: {
    label: "Advisor Review in Progress",
    chipClass: "bg-secondary/10 text-secondary",
  },
  options_pending: {
    label: "Options Being Prepared",
    chipClass: "bg-secondary/10 text-secondary",
  },
  ready_for_advisor_review: {
    label: "Ready for Advisor Review",
    chipClass: "bg-mint/15 text-mint-foreground",
  },
  ready_for_lender_packaging: {
    label: "Package Being Prepared",
    chipClass: "bg-secondary/10 text-secondary",
  },
};

function reviewStatusConfig(status?: string | null): ReviewConfig {
  return (
    REVIEW_STATUS_CONFIG[status ?? ""] ?? {
      label: "Under Review",
      chipClass: "bg-muted text-muted-foreground",
    }
  );
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

function productMatchStatusFor(
  reviewStatus?: string | null,
  readiness?: BorrowerOfferReviewSummary["readiness"],
): ProductMatchStatus {
  const missingItems = readiness?.missing_items?.filter(Boolean) ?? [];
  const applicationReady = readiness?.application_ready === true;
  const snapshotReady = readiness?.snapshot_ready === true;
  const documentsReady = readiness?.documents_ready === true;

  if (
    reviewStatus === "needs_more_information" ||
    reviewStatus === "documents_required" ||
    missingItems.length > 0
  ) {
    return "missing_information";
  }

  if (reviewStatus === "options_pending") return "options_being_prepared";
  if (reviewStatus === "ready_for_advisor_review") return "options_ready_placeholder";
  if (reviewStatus === "ready_for_lender_packaging") return "options_ready_placeholder";
  if (reviewStatus === "submitted_to_lender" || reviewStatus === "lender_review") {
    return "lender_review_placeholder";
  }
  if (reviewStatus === "advisor_review_in_progress" || reviewStatus === "pending_review") {
    return "advisor_review";
  }
  if (!applicationReady || !snapshotReady || !documentsReady) return "not_ready";

  return "advisor_review";
}

function productMatchStatusConfig(status: ProductMatchStatus): ProductMatchStatusCopy {
  if (status === "not_ready") {
    return getProductMatchStatusCopy(status, {
      headline: "Product options will appear only after advisor review.",
      body: "Complete your application, documents, and required review steps first. Potential mortgage paths are not shown until your file is ready for approvU review.",
      primaryCta: {
        label: PRODUCT_MATCH_CTA_LABELS.applicationWorkspace,
        route: "/portal/application",
      },
    });
  }

  if (status === "missing_information") {
    return getProductMatchStatusCopy(status, {
      primaryCta: {
        label: PRODUCT_MATCH_CTA_LABELS.applicationWorkspace,
        route: "/portal/application",
      },
    });
  }

  if (status === "options_ready_placeholder") {
    return getProductMatchStatusCopy(status, {
      secondaryCta: {
        label: PRODUCT_MATCH_CTA_LABELS.applicationWorkspace,
        route: "/portal/application",
      },
    });
  }

  return getProductMatchStatusCopy(status);
}

// ── Page component ────────────────────────────────────────────────────────────

function OffersReviewPage() {
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
  const [selectingOptionReference, setSelectingOptionReference] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [productMatchLoading, setProductMatchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setProductMatchLoading(true);
      setError(null);
      try {
        const [
          result,
          productMatchStatusResult,
          productOptionsResult,
          selectedProductsResult,
          lenderPackagingReadinessResult,
        ] = await Promise.all([
          getBorrowerOfferReviewStatus(),
          getBorrowerProductMatchStatus(),
          getBorrowerProductOptions(),
          listBorrowerSelectedProducts(),
          getBorrowerLenderPackagingReadiness(),
        ]);
        if (!active) return;
        storeBorrowerOfferReviewStatus(result);
        setSummary(result);
        storeBorrowerProductMatchStatus(productMatchStatusResult);
        setProductMatchResult(productMatchStatusResult);
        storeBorrowerProductOptions(productOptionsResult);
        setProductOptionsResult(productOptionsResult);
        storeBorrowerSelectedProducts(selectedProductsResult);
        setSelectedProductsResult(selectedProductsResult);
        storeBorrowerLenderPackagingReadiness(lenderPackagingReadinessResult);
        setLenderPackagingReadiness(lenderPackagingReadinessResult);
      } catch (failure) {
        if (!active) return;
        setError(
          failure instanceof Error
            ? failure.message
            : "Your offer review status could not be loaded.",
        );
      } finally {
        if (active) {
          setLoading(false);
          setProductMatchLoading(false);
        }
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

      const [selectedRefresh, optionsRefresh] = await Promise.all([
        listBorrowerSelectedProducts(),
        getBorrowerProductOptions(),
      ]);
      storeBorrowerSelectedProducts(selectedRefresh);
      storeBorrowerProductOptions(optionsRefresh);
      setSelectedProductsResult(selectedRefresh);
      setProductOptionsResult(optionsRefresh);
      const packagingRefresh = await getBorrowerLenderPackagingReadiness();
      storeBorrowerLenderPackagingReadiness(packagingRefresh);
      setLenderPackagingReadiness(packagingRefresh);
    } catch {
      setSelectionError("We could not select this path right now. Please try again.");
    } finally {
      setSelectingOptionReference(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your offer review status…</p>
      </div>
    );
  }

  if (error || !summary?.ok) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          We could not load your review status
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

  const reviewStatus = summary.review_status;
  const readiness = summary.readiness;
  const sections = summary.offer_sections ?? [];
  const primaryAction = summary.primary_action;
  const disclaimers = summary.disclaimers?.filter(Boolean) ?? [];
  const primaryRoute = resolveRoute(primaryAction?.route_hint);
  const { label: statusLabel, chipClass } = reviewStatusConfig(reviewStatus?.status);
  const apiProductMatchStatus =
    productMatchResult?.endpoint_available &&
    productMatchResult.ok !== false &&
    productMatchResult.status
      ? productMatchResult.status
      : null;
  const productMatchStatus =
    apiProductMatchStatus ?? productMatchStatusFor(reviewStatus?.status, readiness);
  const packagingInProgress =
    reviewStatus?.status === "ready_for_lender_packaging" ||
    lenderPackagingReadiness?.status === "ready_for_lender_packaging";
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
  const showPackagingGuidance =
    selectedProducts.length > 0 || lenderPackagingReadiness?.endpoint_available === true;

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Offers &amp; review status
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Product Match Status
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page shows where your file stands in the product matching review process. Product
          options will appear only after advisor review.
        </p>
      </div>

      {/* ── Review status card ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Review status
              </p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{statusLabel}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${chipClass}`}
          >
            {statusLabel}
          </span>
        </div>

        {safeString(reviewStatus?.message) && (
          <p className="mt-4 text-sm text-muted-foreground">{safeString(reviewStatus.message)}</p>
        )}
        {packagingInProgress && (
          <div className="mt-4 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Your advisor is preparing your package.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your selected path is being prepared for advisor review and possible packaging. This
              is not a lender submission, not a lender approval, and does not include final terms.
            </p>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{getProductMatchDisclaimer()}</p>
      </div>

      {/* ── Product match status scaffold ─────────────────────────────────── */}
      <ProductMatchStatusCard
        status={productMatchStatus}
        apiStatus={productMatchResult}
        loading={productMatchLoading}
        packagingInProgress={packagingInProgress}
      />

      <PackagingNextStepsOverview
        hasSelectedProducts={selectedProducts.length > 0}
        packagingInProgress={packagingInProgress}
      />

      {selectedProducts.length > 0 && <SelectedProductPathsSummary products={selectedProducts} />}

      {showPackagingGuidance && (
        <LenderPackagingReadinessCard
          readiness={lenderPackagingReadiness}
          selectedProductsCount={selectedProducts.length}
          packagingInProgress={packagingInProgress}
        />
      )}

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

      {productOptionsAvailable ? (
        <ProductOptionsList
          options={safeProductOptions}
          selectedOptionReferences={selectedOptionReferences}
          selectingOptionReference={selectingOptionReference}
          onSelect={handleSelectProductOption}
        />
      ) : (
        <ProductOptionsPlaceholder status={productMatchStatus} apiStatus={productMatchResult} />
      )}

      {/* ── Readiness checklist ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Application readiness</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These items help approvU decide when potential mortgage paths can be assessed.
        </p>
        <ul className="mt-4 space-y-3">
          <ReadinessRow
            label="Qualification on file"
            ready={readiness?.application_ready ?? false}
          />
          <ReadinessRow
            label="Mortgage Snapshot generated"
            ready={readiness?.snapshot_ready ?? false}
          />
          <ReadinessRow
            label="Document requests resolved"
            ready={readiness?.documents_ready ?? false}
          />
        </ul>

        {(readiness?.missing_items?.filter(Boolean) ?? []).length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Outstanding items
            </p>
            <ul className="mt-2 space-y-1.5">
              {readiness!.missing_items!.filter(Boolean).map((item, index) => (
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

      {/* ── Offer sections grid ───────────────────────────────────────────── */}
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

      {/* ── Primary action CTA ────────────────────────────────────────────── */}
      {primaryAction?.label && (
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

      {/* ── Conservative disclaimer ───────────────────────────────────────── */}
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-yellow-800">
          Product matching guardrails
        </p>
        <p className="mt-2 text-xs text-yellow-800">
          This page does not show lender names, rates, match scores, product cards, selected
          products, or approval decisions. Your advisor will confirm next steps.
        </p>
      </div>

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

      {/* ── Quick links ───────────────────────────────────────────────────── */}
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

// ── Supporting components ─────────────────────────────────────────────────────

function ProductMatchStatusCard({
  status,
  apiStatus,
  loading,
  packagingInProgress,
}: {
  status: ProductMatchStatus;
  apiStatus: ProductMatchStatusResponse | null;
  loading: boolean;
  packagingInProgress: boolean;
}) {
  const config = packagingInProgress
    ? getProductMatchStatusCopy("options_ready_placeholder", {
        badge: "Package being prepared",
        headline: "Your advisor is preparing your package.",
        body: "Your selected path is being prepared for advisor review and possible packaging. This is not a lender submission, not a lender approval, and final terms depend on lender review.",
        primaryCta: {
          label: PRODUCT_MATCH_CTA_LABELS.viewApplicationStatus,
          route: "/portal/application/review-submit",
        },
        secondaryCta: {
          label: PRODUCT_MATCH_CTA_LABELS.viewDocuments,
          route: "/portal/documents",
        },
      })
    : productMatchStatusConfig(status);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Product match status</h2>
              <span className="inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                {config.badge}
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-foreground">{config.headline}</p>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{config.body}</p>
            {loading && (
              <p className="mt-2 text-xs text-muted-foreground">Checking product match status...</p>
            )}
            <ProductMatchSafeFacts apiStatus={apiStatus} />
            <p className="mt-3 text-xs text-muted-foreground">{getProductMatchDisclaimer()}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {config.secondaryCta && (
            <Link
              to={config.secondaryCta.route}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
            >
              {config.secondaryCta.label}
            </Link>
          )}
          {config.primaryCta && (
            <Link
              to={config.primaryCta.route}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {config.primaryCta.label}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function PackagingNextStepsOverview({
  hasSelectedProducts,
  packagingInProgress,
}: {
  hasSelectedProducts: boolean;
  packagingInProgress: boolean;
}) {
  const steps = [
    {
      label: "Selected path",
      body: hasSelectedProducts
        ? "Your selected path has been saved for advisor review."
        : "Choose an advisor-reviewed path when one is available.",
      active: hasSelectedProducts,
    },
    {
      label: "Packaging readiness",
      body: packagingInProgress
        ? "Your advisor is preparing your package and confirming readiness before any possible lender step."
        : "approvU checks documents, consents, and requested items before packaging can continue.",
      active: hasSelectedProducts || packagingInProgress,
    },
    {
      label: "Advisor review",
      body: "Your advisor will confirm next steps before any possible lender packaging.",
      active: packagingInProgress,
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
            What happens next
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            From selected path to packaging review
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {packagingInProgress
              ? "Your advisor is preparing your package from the selected path and confirming the next steps. This is not a lender submission or lender approval. Final terms depend on lender review."
              : "Your selected path is being prepared for advisor review. This is not a lender approval. Final terms depend on lender review. Your advisor will confirm next steps."}
          </p>
        </div>
        <Link
          to="/portal/application"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Back to Application
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={`rounded-xl border p-4 ${
              step.active ? "border-secondary/30 bg-secondary/5" : "border-border bg-background"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  step.active
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

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
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
            Product options
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Advisor-reviewed mortgage paths
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            These possible paths have been reviewed for borrower display by approvU. These are not
            approvals. Final terms depend on lender review, and your advisor will confirm next
            steps.
          </p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            {getProductMatchDisclaimer()}
          </p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-800 lg:max-w-xs">
          Lender names, rates, match scores, product IDs, and approval decisions are intentionally
          hidden.
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
  const documentsNeeded = option.documents_needed?.filter(Boolean) ?? [];
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
    <article className="rounded-xl border border-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Advisor-reviewed mortgage path
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {safeString(option.option_label) || "Advisor-reviewed mortgage path"}
          </h3>
        </div>
        <span className="inline-flex rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-semibold text-mint-foreground">
          Advisor reviewed
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
      <p className="mt-2 text-xs text-muted-foreground">
        This selection tells the approvU team which path you want reviewed for packaging. This is
        not a lender approval. Final terms depend on lender review.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/portal/documents"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted"
        >
          View Documents
        </Link>
        <Link
          to="/portal/application/review-submit"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted"
        >
          View Application Status
        </Link>
        <Link
          to="/portal/application"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Review Requested Items
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
        {option.public_reference ? (
          <button
            type="button"
            onClick={() => {
              if (option.public_reference) onSelect(option.public_reference);
            }}
            disabled={isSelected || isSelecting}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            {isSelected
              ? "Selected for advisor review"
              : isSelecting
                ? "Selecting..."
                : "Select this path for advisor review"}
          </button>
        ) : (
          <span className="inline-flex h-9 items-center justify-center rounded-md bg-muted px-3 text-xs font-semibold text-muted-foreground">
            Selection unavailable
          </span>
        )}
      </div>
    </article>
  );
}

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
  const blockers = endpointReady ? (readiness.blockers?.filter(Boolean) ?? []) : [];
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
                <span>{blocker}</span>
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
      <p className="mt-2 text-xs text-muted-foreground">
        No lender submission has been completed from this screen. Your advisor will confirm before
        any possible lender packaging or review step.
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
          to="/portal/application"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Review Requested Items
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

function ProductOptionsPlaceholder({
  status,
  apiStatus,
}: {
  status: ProductMatchStatus;
  apiStatus: ProductMatchStatusResponse | null;
}) {
  const config = productMatchStatusConfig(status);
  const nextSteps = [
    {
      label: "View Application Status",
      route: "/portal/application/review-submit",
      description: "Check submission readiness and current review status.",
    },
    {
      label: "Review Requested Items",
      route: "/portal/application",
      description: "Return to the workspace if approvU needs more information.",
    },
    {
      label: "Upload Documents",
      route: "/portal/documents",
      description: "Add documents that may be needed before advisor review can continue.",
    },
    {
      label: "Complete Consents",
      route: "/portal/application/consents",
      description: "Review required consents before submission and advisor review.",
    },
    {
      label: "Review & Submit",
      route: "/portal/application/review-submit",
      description: "Submit when your application is ready for approvU review.",
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Product options
            </p>
            <span className="inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
              {config.badge}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Product Options Coming After Advisor Review
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Product options are not visible yet because approvU must first review your application
            details and confirm what is borrower-safe to show. When options are ready, they will be
            presented as advisor-reviewed possible paths, not approvals.
          </p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            {getProductMatchDisclaimer()}
          </p>
          <ProductMatchSafeFacts apiStatus={apiStatus} />
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-800 lg:max-w-xs">
          No lender names, rates, match scores, unsafe product details, or approval decisions are
          shown in this placeholder.
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {nextSteps.map((step) => (
          <Link
            key={step.label}
            to={step.route}
            className="rounded-xl border border-border bg-background p-4 transition hover:bg-muted"
          >
            <span className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground">
              {step.label}
              <ArrowRight className="h-4 w-4 shrink-0 text-secondary" />
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">{step.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

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

function ProductMatchSafeFacts({ apiStatus }: { apiStatus: ProductMatchStatusResponse | null }) {
  const facts = [
    {
      label: "Visible options",
      value:
        typeof apiStatus?.borrower_visible_count === "number"
          ? String(apiStatus.borrower_visible_count)
          : null,
    },
    {
      label: "Advisor-reviewed options",
      value:
        typeof apiStatus?.advisor_reviewed_count === "number"
          ? String(apiStatus.advisor_reviewed_count)
          : null,
    },
    {
      label: "Last status update",
      value: apiStatus?.last_matched_at ? formatProductMatchDate(apiStatus.last_matched_at) : null,
    },
  ].filter((fact) => fact.value);

  if (!apiStatus?.endpoint_available || facts.length === 0) return null;

  return (
    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-lg border border-border bg-background px-3 py-2">
          <dt className="font-semibold text-muted-foreground">{fact.label}</dt>
          <dd className="mt-0.5 text-foreground">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
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
