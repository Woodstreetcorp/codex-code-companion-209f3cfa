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
  getProductMatchDisclaimer,
  getProductMatchStatusCopy,
  PRODUCT_MATCH_CTA_LABELS,
  type ProductMatchStatus,
  type ProductMatchStatusCopy,
} from "@/lib/productMatching/productMatchCopy";

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
        const [result, productMatchStatusResult] = await Promise.all([
          getBorrowerOfferReviewStatus(),
          getBorrowerProductMatchStatus(),
        ]);
        if (!active) return;
        storeBorrowerOfferReviewStatus(result);
        setSummary(result);
        storeBorrowerProductMatchStatus(productMatchStatusResult);
        setProductMatchResult(productMatchStatusResult);
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

        {reviewStatus?.message && (
          <p className="mt-4 text-sm text-muted-foreground">{reviewStatus.message}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{getProductMatchDisclaimer()}</p>
      </div>

      {/* ── Product match status scaffold ─────────────────────────────────── */}
      <ProductMatchStatusCard
        status={productMatchStatus}
        apiStatus={productMatchResult}
        loading={productMatchLoading}
      />

      <ProductOptionsPlaceholder status={productMatchStatus} apiStatus={productMatchResult} />

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
              {readiness!.missing_items!.filter(Boolean).map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" />
                  {item}
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
              <p className="mt-1 text-base font-semibold text-foreground">{primaryAction.label}</p>
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
          {disclaimers.map((text) => (
            <p key={text} className="mt-2 text-xs text-muted-foreground">
              {text}
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
}: {
  status: ProductMatchStatus;
  apiStatus: ProductMatchStatusResponse | null;
  loading: boolean;
}) {
  const config = productMatchStatusConfig(status);

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
          No product cards, lender names, rates, match scores, selected products, or approval
          decisions are shown in this placeholder.
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
        <h3 className="text-sm font-semibold text-foreground">{section.label ?? section.key}</h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
          {config.label}
        </span>
      </div>
      {section.message && <p className="mt-2 text-xs text-muted-foreground">{section.message}</p>}
      {section.action_label && (
        <Link
          to={sectionRoute}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
        >
          {section.action_label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
