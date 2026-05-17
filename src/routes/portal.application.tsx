import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getBorrowerApplicationSummary,
  storeBorrowerApplicationSummary,
  type ApplicationSection,
  type BorrowerApplicationSummary,
  type SectionStatus,
} from "@/lib/api/borrowerApplicationSummaryApi";
import {
  listBorrowerApplicationSections,
  storeBorrowerApplicationSections,
  SECTION_LABELS,
  ALL_SECTION_KEYS,
  type ApplicationSectionKey,
  type ApplicationSectionStatus,
  type ApplicationSection as BackendSection,
  type SectionsSummary,
} from "@/lib/api/borrowerApplicationSectionsApi";
import {
  listBorrowerApplicationConsents,
  storeBorrowerApplicationConsents,
  type ConsentSummary,
} from "@/lib/api/borrowerApplicationConsentsApi";
import {
  listBorrowerApplicationReviewRequests,
  respondToBorrowerApplicationReviewRequest,
  storeBorrowerApplicationReviewRequests,
  type BorrowerApplicationReviewRequest,
  type ReviewRequestResponseResult,
  type ReviewRequestsResponse,
} from "@/lib/api/borrowerApplicationReviewRequestsApi";
import {
  getBorrowerApplicationSubmissionReadiness,
  storeBorrowerApplicationSubmission,
  type SubmissionReadinessResponse,
} from "@/lib/api/borrowerApplicationSubmissionApi";

export const Route = createFileRoute("/portal/application")({
  head: () => ({
    meta: [
      { title: "Application Workspace — approvU" },
      {
        name: "description",
        content:
          "Track your mortgage application progress, review document requests, and see where things stand with approvU.",
      },
    ],
  }),
  component: ApplicationWorkspacePage,
});

// ── Section status configuration ──────────────────────────────────────────────

type StatusConfig = {
  label: string;
  badgeClass: string;
  dotClass: string;
};

type SubmittedApplicationStatus =
  | "borrower_submitted"
  | "advisor_review"
  | "needs_more_information"
  | "ready_for_lender_packaging"
  | "submitted_to_lender"
  | "approved"
  | "declined"
  | "withdrawn"
  | "closed";

type SubmittedStatusConfig = {
  label: string;
  copy: string;
  badgeClass: string;
};

const SUBMITTED_STATUS_CONFIG: Record<SubmittedApplicationStatus, SubmittedStatusConfig> = {
  borrower_submitted: {
    label: "Submitted",
    copy: "Submitted to approvU for review.",
    badgeClass: "bg-secondary/10 text-secondary",
  },
  advisor_review: {
    label: "Advisor review",
    copy: "Your application is being reviewed by the approvU team.",
    badgeClass: "bg-secondary/10 text-secondary",
  },
  needs_more_information: {
    label: "More information needed",
    copy: "More information is needed before review can continue.",
    badgeClass: "bg-coral/10 text-coral",
  },
  ready_for_lender_packaging: {
    label: "Preparing lender package",
    copy: "Your application is being prepared for lender packaging.",
    badgeClass: "bg-yellow-50 text-yellow-700",
  },
  submitted_to_lender: {
    label: "Submitted to lender",
    copy: "Your application has been submitted for lender review.",
    badgeClass: "bg-secondary/10 text-secondary",
  },
  approved: {
    label: "Approval update",
    copy: "Your application has an approval update. Your advisor will provide details.",
    badgeClass: "bg-mint/15 text-mint-foreground",
  },
  declined: {
    label: "Review update",
    copy: "Your application has a review update. Your advisor will discuss next steps.",
    badgeClass: "bg-coral/10 text-coral",
  },
  withdrawn: {
    label: "Withdrawn",
    copy: "This application has been withdrawn.",
    badgeClass: "bg-muted text-muted-foreground",
  },
  closed: {
    label: "Closed",
    copy: "This application is closed.",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

const SECTION_STATUS_CONFIG: Record<SectionStatus, StatusConfig> = {
  complete: {
    label: "Complete",
    badgeClass: "bg-mint/15 text-mint-foreground border border-mint/30",
    dotClass: "bg-mint",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-secondary/10 text-secondary border border-secondary/20",
    dotClass: "bg-secondary",
  },
  needs_attention: {
    label: "Needs Attention",
    badgeClass: "bg-coral/10 text-coral border border-coral/20",
    dotClass: "bg-coral",
  },
  not_started: {
    label: "Not Started",
    badgeClass: "bg-muted text-muted-foreground border border-border",
    dotClass: "bg-muted-foreground/40",
  },
  pending_review: {
    label: "Pending Review",
    badgeClass: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    dotClass: "bg-yellow-400",
  },
};

function sectionStatusConfig(status?: SectionStatus | null): StatusConfig {
  return SECTION_STATUS_CONFIG[status ?? "not_started"] ?? SECTION_STATUS_CONFIG.not_started;
}

// ── Application state helpers ─────────────────────────────────────────────────

function formatLabel(value?: string | null): string {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function primaryRouteFor(action?: string | null, routeHint?: string | null): string {
  if (routeHint) return routeHint;
  switch (action) {
    case "start_qualification":
      return "/purchase";
    case "view_mortgage_snapshot":
      return "/portal";
    case "upload_documents":
      return "/portal/documents";
    default:
      return "/portal";
  }
}

function isSubmittedApplicationStatus(
  status?: string | null,
): status is SubmittedApplicationStatus {
  return !!status && status in SUBMITTED_STATUS_CONFIG;
}

function reviewRequestRoute(request?: BorrowerApplicationReviewRequest | null): string | null {
  const key = request?.related_section_key?.toLowerCase();
  switch (key) {
    case "borrower_profile":
      return SECTION_ROUTE.borrower_profile;
    case "property":
      return SECTION_ROUTE.property;
    case "income":
      return SECTION_ROUTE.income;
    case "assets_down_payment":
    case "down_payment":
      return SECTION_ROUTE.assets_down_payment;
    case "liabilities":
      return SECTION_ROUTE.liabilities;
    case "documents":
      return "/portal/documents";
    case "consents":
      return "/portal/application/consents";
    default:
      return null;
  }
}

function submittedStatusAction(
  status: SubmittedApplicationStatus,
  firstOpenRequest?: BorrowerApplicationReviewRequest | null,
): { label: string; route: string } | null {
  if (status === "withdrawn" || status === "closed") return null;
  if (status === "needs_more_information") {
    return {
      label: "Review Requested Items",
      route: reviewRequestRoute(firstOpenRequest) ?? "/portal/application",
    };
  }
  if (status === "ready_for_lender_packaging") {
    return { label: "View Next Steps", route: "/portal/application/review-submit" };
  }
  return { label: "View Application Status", route: "/portal/application/review-submit" };
}

// ── Page component ────────────────────────────────────────────────────────────

// ── Section route mapping ──────────────────────────────────────────────────────
// Maps backend section keys to the closest existing Lovable route.
// applicationId "current" is a placeholder — the real application is resolved
// server-side from the session cookie.
const SECTION_ROUTE: Record<ApplicationSectionKey, string> = {
  borrower_profile: "/portal/settings/profile",
  property: "/applications/current/property-financing/target-property",
  income: "/applications/current/property-financing/purchase-plan",
  assets_down_payment: "/applications/current/property-financing/down-payment",
  liabilities: "/applications/current/mortgage-request",
};

function ApplicationWorkspacePage() {
  const [summary, setSummary] = useState<BorrowerApplicationSummary | null>(null);
  const [backendSections, setBackendSections] = useState<BackendSection[] | null>(null);
  const [sectionsSummary, setSectionsSummary] = useState<SectionsSummary | null>(null);
  const [consentReady, setConsentReady] = useState<boolean | null>(null);
  const [consentSummary, setConsentSummary] = useState<ConsentSummary | null>(null);
  const [submissionReadiness, setSubmissionReadiness] =
    useState<SubmissionReadinessResponse | null>(null);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshReviewRequests(result?: ReviewRequestResponseResult) {
    if (result?.application_status) {
      setSubmissionReadiness((current) =>
        current ? { ...current, status: result.application_status } : current,
      );
    }

    const [requestsResult, readinessResult] = await Promise.allSettled([
      listBorrowerApplicationReviewRequests(),
      getBorrowerApplicationSubmissionReadiness(),
    ]);

    if (requestsResult.status === "fulfilled") {
      storeBorrowerApplicationReviewRequests(requestsResult.value);
      setReviewRequests(requestsResult.value);
    }

    if (readinessResult.status === "fulfilled" && readinessResult.value.ok !== false) {
      storeBorrowerApplicationSubmission(readinessResult.value);
      setSubmissionReadiness(readinessResult.value);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load in parallel; only the core summary is fatal.
        const [summaryResult, sectionsResult, consentsResult, readinessResult, requestsResult] =
          await Promise.allSettled([
            getBorrowerApplicationSummary(),
            listBorrowerApplicationSections(),
            listBorrowerApplicationConsents(),
            getBorrowerApplicationSubmissionReadiness(),
            listBorrowerApplicationReviewRequests(),
          ]);

        if (!active) return;

        if (summaryResult.status === "fulfilled") {
          storeBorrowerApplicationSummary(summaryResult.value);
          setSummary(summaryResult.value);
        } else {
          throw summaryResult.reason instanceof Error
            ? summaryResult.reason
            : new Error("Your application workspace could not be loaded.");
        }

        if (sectionsResult.status === "fulfilled" && sectionsResult.value.ok) {
          storeBorrowerApplicationSections(sectionsResult.value);
          setBackendSections(sectionsResult.value.sections ?? null);
          setSectionsSummary(sectionsResult.value.sections_summary ?? null);
        }
        if (consentsResult.status === "fulfilled" && consentsResult.value.ok) {
          storeBorrowerApplicationConsents(consentsResult.value);
          setConsentReady(consentsResult.value.consent_ready ?? null);
          setConsentSummary(consentsResult.value.consent_summary ?? null);
        }
        if (readinessResult.status === "fulfilled" && readinessResult.value.ok !== false) {
          storeBorrowerApplicationSubmission(readinessResult.value);
          setSubmissionReadiness(readinessResult.value);
        }
        if (requestsResult.status === "fulfilled") {
          storeBorrowerApplicationReviewRequests(requestsResult.value);
          setReviewRequests(requestsResult.value);
        }
        // Secondary fetch failures are silent; the workspace still loads.
      } catch (failure) {
        if (!active) return;
        setError(
          failure instanceof Error
            ? failure.message
            : "Your application workspace could not be loaded.",
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

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your application workspace…</p>
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
          We could not load your workspace
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error ?? "Your session may have expired. Sign in again to continue your application."}
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

  // Use backend completion_percent from sections if available (more accurate)
  const backendPercent =
    sectionsSummary != null && backendSections != null
      ? Math.min(80, backendSections.filter((s) => s.status === "complete").length * 20)
      : null;
  const percent = backendPercent ?? summary.completion_percent ?? 5;

  const state = summary.application_state;
  const qualSummary = summary.qualification_summary;
  const snapSummary = summary.mortgage_snapshot_summary;
  const docSummary = summary.document_summary;
  const sections = summary.sections ?? [];
  const primaryAction = summary.primary_action;
  const messages = summary.messages?.filter(Boolean) ?? [];
  const primaryRoute = primaryRouteFor(primaryAction?.action, primaryAction?.route_hint);
  const applicationStatus = submissionReadiness?.status ?? state ?? null;
  const submittedStatus = isSubmittedApplicationStatus(applicationStatus)
    ? applicationStatus
    : null;
  const requestItems = reviewRequests?.requests?.filter(Boolean) ?? [];
  const openRequests = requestItems.filter((request) => {
    const status = request.status?.toLowerCase();
    return !status || status === "open" || status === "pending" || status === "needs_attention";
  });
  const firstOpenRequest = openRequests[0] ?? null;

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Application workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Your Application
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your mortgage application progress and next steps.
        </p>
      </div>

      {/* ── Messages banner ──────────────────────────────────────────────── */}
      {messages.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
          <ul className="space-y-1">
            {messages.map((msg) => (
              <li key={msg} className="flex items-start gap-2 text-sm text-yellow-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Progress card ────────────────────────────────────────────────── */}
      {submittedStatus && (
        <SubmittedStatusCard
          status={submittedStatus}
          publicReference={submissionReadiness?.application_public_reference ?? null}
          openRequestCount={openRequests.length}
          firstOpenRequest={firstOpenRequest}
        />
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Application progress
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{percent}%</p>
          </div>
          <StateChip state={state ?? "not_started"} />
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ── Summary grid ─────────────────────────────────────────────────── */}
      <ConsentWorkspaceCard consentReady={consentReady} consentSummary={consentSummary} />

      <ReviewRequestsPanel
        reviewRequests={reviewRequests}
        requests={requestItems}
        onRequestAddressed={refreshReviewRequests}
      />

      <ReviewSubmitWorkspaceCard status={submittedStatus} />

      <div className="grid gap-4 md:grid-cols-3">
        {/* Qualification */}
        <SummaryPanel
          icon={ClipboardList}
          title="Qualification"
          empty={!qualSummary?.safe_token_reference}
          emptyText="No qualification started yet."
        >
          {qualSummary?.safe_token_reference && (
            <dl className="space-y-2">
              <DataRow label="Reference" value={qualSummary.safe_token_reference} />
              <DataRow label="Path" value={formatLabel(qualSummary.path)} />
              {qualSummary.location_city && (
                <DataRow
                  label="Location"
                  value={[qualSummary.location_city, qualSummary.location_province]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
              {qualSummary.started_at && (
                <DataRow label="Started" value={formatDate(qualSummary.started_at)} />
              )}
            </dl>
          )}
        </SummaryPanel>

        {/* Snapshot */}
        <SummaryPanel
          icon={FileText}
          title="Mortgage Snapshot"
          empty={!snapSummary?.snapshot_reference}
          emptyText="No snapshot generated yet."
        >
          {snapSummary?.snapshot_reference && (
            <dl className="space-y-2">
              <DataRow label="Reference" value={snapSummary.snapshot_reference} />
              <DataRow label="Classification" value={formatLabel(snapSummary.classification)} />
              <DataRow label="Readiness" value={formatLabel(snapSummary.readiness_status)} />
              <DataRow label="Key insights" value={String(snapSummary.key_insights_count ?? 0)} />
              {(snapSummary.missing_items_count ?? 0) > 0 && (
                <DataRow label="Missing items" value={String(snapSummary.missing_items_count)} />
              )}
            </dl>
          )}
        </SummaryPanel>

        {/* Documents */}
        <SummaryPanel
          icon={UploadCloud}
          title="Documents"
          empty={!docSummary || (docSummary.total ?? 0) === 0}
          emptyText="No document requests yet."
        >
          {docSummary && (docSummary.total ?? 0) > 0 && (
            <dl className="space-y-2">
              <DataRow label="Total requests" value={String(docSummary.total ?? 0)} />
              {(docSummary.requested ?? 0) > 0 && (
                <DataRow
                  label="Needs action"
                  value={String(docSummary.requested)}
                  highlight="coral"
                />
              )}
              {(docSummary.rejected ?? 0) > 0 && (
                <DataRow
                  label="Needs attention"
                  value={String(docSummary.rejected)}
                  highlight="coral"
                />
              )}
              {(docSummary.uploaded ?? 0) > 0 && (
                <DataRow label="Under review" value={String(docSummary.uploaded)} />
              )}
              {(docSummary.reviewed ?? 0) > 0 && (
                <DataRow label="Accepted" value={String(docSummary.reviewed)} highlight="mint" />
              )}
              {docSummary.next_required_document && (
                <div className="border-t border-border pt-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Next required
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {docSummary.next_required_document}
                  </p>
                </div>
              )}
            </dl>
          )}
        </SummaryPanel>
      </div>

      {/* ── Backend application sections ──────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Application sections</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in each section to complete your mortgage application.
            </p>
          </div>
          {sectionsSummary && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-mint-foreground" />
                <strong className="text-foreground">
                  {sectionsSummary.completed_sections ?? 0}
                </strong>{" "}
                / {sectionsSummary.total_sections ?? 5} complete
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_SECTION_KEYS.map((key) => {
            const backendSection = backendSections?.find((s) => s.section_key === key);
            const status: ApplicationSectionStatus = backendSection?.status ?? "not_started";
            return (
              <BackendSectionCard
                key={key}
                sectionKey={key}
                label={SECTION_LABELS[key]}
                status={status}
                lastSavedAt={backendSection?.last_saved_at ?? null}
                route={SECTION_ROUTE[key]}
              />
            );
          })}
        </div>
      </div>

      {/* ── Summary sections (legacy — documents, offers) ─────────────── */}
      {sections.filter(
        (s) =>
          !["borrower_profile", "property", "income", "down_payment", "credit"].includes(
            s.key ?? "",
          ),
      ).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground">Other sections</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sections
              .filter(
                (s) =>
                  !["borrower_profile", "property", "income", "down_payment", "credit"].includes(
                    s.key ?? "",
                  ),
              )
              .map((section) => (
                <SectionCard key={section.key ?? section.label} section={section} />
              ))}
          </div>
        </div>
      )}

      {/* ── Primary action CTA ───────────────────────────────────────────── */}
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

      {/* ── Quick links ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/portal/documents"
          className="inline-flex items-center gap-1.5 font-medium text-secondary hover:underline"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Document Vault
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

function SubmittedStatusCard({
  status,
  publicReference,
  openRequestCount,
  firstOpenRequest,
}: {
  status: SubmittedApplicationStatus;
  publicReference: string | null;
  openRequestCount: number;
  firstOpenRequest: BorrowerApplicationReviewRequest | null;
}) {
  const config = SUBMITTED_STATUS_CONFIG[status];
  const action = submittedStatusAction(status, firstOpenRequest);
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Application status</h2>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badgeClass}`}
              >
                {config.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{config.copy}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitting your application is not a mortgage approval or lender commitment.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {publicReference && <span>Reference {publicReference}</span>}
              {openRequestCount > 0 && (
                <span className="font-semibold text-coral">
                  {openRequestCount} request{openRequestCount === 1 ? "" : "s"} open
                </span>
              )}
            </div>
          </div>
        </div>
        {action && (
          <Link
            to={action.route}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {action.label}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

function StateChip({ state }: { state: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    not_started: {
      label: "Not Started",
      classes: "bg-muted text-muted-foreground",
    },
    in_progress: {
      label: "In Progress",
      classes: "bg-secondary/10 text-secondary",
    },
    needs_attention: {
      label: "Needs Attention",
      classes: "bg-coral/10 text-coral",
    },
    pending_review: {
      label: "Pending Review",
      classes: "bg-yellow-50 text-yellow-700",
    },
  };
  const { label, classes } = config[state] ?? config.not_started;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function SummaryPanel({
  icon: Icon,
  title,
  empty,
  emptyText,
  children,
}: {
  icon: React.ElementType;
  title: string;
  empty: boolean;
  emptyText: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="mt-4">
        {empty ? <p className="text-sm text-muted-foreground">{emptyText}</p> : children}
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "coral" | "mint";
}) {
  const valueClass =
    highlight === "coral"
      ? "text-coral font-semibold"
      : highlight === "mint"
        ? "text-mint-foreground font-semibold"
        : "text-foreground";

  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-xs ${valueClass}`}>{value}</dd>
    </div>
  );
}

function ReviewRequestsPanel({
  reviewRequests,
  requests,
  onRequestAddressed,
}: {
  reviewRequests: ReviewRequestsResponse | null;
  requests: BorrowerApplicationReviewRequest[];
  onRequestAddressed: (result?: ReviewRequestResponseResult) => Promise<void>;
}) {
  const openCount =
    reviewRequests?.open_count ??
    requests.filter((request) => {
      const status = request.status?.toLowerCase();
      return !status || status === "open" || status === "pending" || status === "needs_attention";
    }).length;
  const resolvedCount = reviewRequests?.resolved_count ?? 0;

  if (reviewRequests?.unavailable) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Requests from approvU</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review requests are not available yet. If approvU needs more information, your advisor
              will let you know.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${
        openCount > 0 ? "border-coral/30 bg-coral/5" : "border-border bg-card"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              openCount > 0 ? "bg-coral/10 text-coral" : "bg-mint/15 text-mint-foreground"
            }`}
          >
            {openCount > 0 ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Requests from approvU</h2>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  openCount > 0 ? "bg-coral/10 text-coral" : "bg-mint/15 text-mint-foreground"
                }`}
              >
                {openCount > 0 ? `${openCount} open` : "No open requests"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {openCount > 0
                ? "Please review the items below so the approvU team can continue your application review."
                : "No additional information has been requested right now."}
            </p>
            {resolvedCount > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {resolvedCount} request{resolvedCount === 1 ? "" : "s"} resolved
              </p>
            )}
          </div>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="mt-4 space-y-3">
          {requests.map((request, index) => (
            <ReviewRequestCard
              key={request.public_reference ?? request.id ?? index}
              request={request}
              onRequestAddressed={onRequestAddressed}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewRequestCard({
  request,
  onRequestAddressed,
}: {
  request: BorrowerApplicationReviewRequest;
  onRequestAddressed: (result?: ReviewRequestResponseResult) => Promise<void>;
}) {
  const route = reviewRequestRoute(request);
  const status = request.status?.toLowerCase();
  const resolved = !!request.resolved_at || status === "resolved" || status === "closed";
  const publicReference = request.public_reference;
  const [response, setResponse] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkAddressed() {
    if (!publicReference || !confirmed || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await respondToBorrowerApplicationReviewRequest(publicReference, {
        response: response.trim() || undefined,
        mark_addressed: true,
      });
      setSuccess(result.message ?? "Request marked as addressed.");
      await onRequestAddressed(result);
    } catch {
      setError("We could not mark this request as addressed right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {request.title ?? "Additional information requested"}
            </h3>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                resolved ? "bg-mint/15 text-mint-foreground" : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {formatLabel(request.status ?? (resolved ? "resolved" : "open"))}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {request.body ?? request.message ?? "approvU needs more information for this item."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {request.related_section_key && <span>{formatLabel(request.related_section_key)}</span>}
            {request.created_at && <span>Created {formatDate(request.created_at)}</span>}
            {request.resolved_at && <span>Resolved {formatDate(request.resolved_at)}</span>}
          </div>
          {resolved && (request.response || request.borrower_response) && (
            <div className="mt-3 rounded-lg border border-mint/30 bg-mint/10 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-mint-foreground">
                Your response
              </p>
              <p className="mt-1 text-sm text-foreground">
                {request.response ?? request.borrower_response}
              </p>
            </div>
          )}
        </div>
        {route && !resolved && (
          <Link
            to={route}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Review item
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {!resolved && (
        <div className="mt-4 border-t border-border pt-4">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Response note
          </label>
          <textarea
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            placeholder="Add a short note about what you updated..."
            rows={3}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={saving || !publicReference}
              className="mt-0.5 h-4 w-4 rounded border-input"
            />
            <span>
              I have reviewed this request and updated the relevant information where needed.
            </span>
          </label>
          {error && (
            <div className="mt-3 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-3 rounded-lg border border-mint/30 bg-mint/10 px-3 py-2 text-sm text-mint-foreground">
              {success}
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleMarkAddressed()}
            disabled={!publicReference || !confirmed || saving}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving
              </>
            ) : (
              "Mark as addressed"
            )}
          </button>
          {!publicReference && (
            <p className="mt-2 text-xs text-muted-foreground">
              This request cannot be marked addressed until approvU provides a request reference.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ConsentWorkspaceCard({
  consentReady,
  consentSummary,
}: {
  consentReady: boolean | null;
  consentSummary: ConsentSummary | null;
}) {
  const accepted = consentSummary?.accepted ?? consentSummary?.required_accepted ?? null;
  const total = consentSummary?.total ?? consentSummary?.required_total ?? 6;
  const statusText =
    consentReady === true
      ? "All required consents are accepted."
      : consentReady === false
        ? "Review and accept required borrower consents before submission."
        : "Review borrower consent requirements before submission.";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Application consents</h2>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  consentReady ? "bg-mint/15 text-mint-foreground" : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {consentReady ? "Ready" : "Action needed"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{statusText}</p>
            {accepted != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {accepted} / {total} consents accepted
              </p>
            )}
          </div>
        </div>
        <Link
          to="/portal/application/consents"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Review consents
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function ReviewSubmitWorkspaceCard({ status }: { status: SubmittedApplicationStatus | null }) {
  const submitted = status != null;
  const closed = status === "withdrawn" || status === "closed";
  const description =
    status === "needs_more_information"
      ? "Review your submitted application status and resolve any blockers before review can continue."
      : submitted
        ? "View your submitted application status and next steps from approvU."
        : "Check submission readiness, resolve blockers, and submit your application to approvU for review.";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Review & submit</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {!closed && (
          <Link
            to="/portal/application/review-submit"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {submitted ? "View status" : "Review application"}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: ApplicationSection }) {
  const config = sectionStatusConfig(section.status);

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {section.label ?? formatLabel(section.key)}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
          {config.label}
        </span>
      </div>
      {section.description && (
        <p className="mt-2 text-xs text-muted-foreground">{section.description}</p>
      )}
    </div>
  );
}

// ── Backend section card ──────────────────────────────────────────────────────

const BACKEND_STATUS_CONFIG: Record<
  ApplicationSectionStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  complete: {
    label: "Complete",
    badgeClass: "bg-mint/15 text-mint-foreground border border-mint/30",
    dotClass: "bg-mint",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-secondary/10 text-secondary border border-secondary/20",
    dotClass: "bg-secondary",
  },
  needs_attention: {
    label: "Needs Attention",
    badgeClass: "bg-coral/10 text-coral border border-coral/20",
    dotClass: "bg-coral",
  },
  not_started: {
    label: "Not Started",
    badgeClass: "bg-muted text-muted-foreground border border-border",
    dotClass: "bg-muted-foreground/40",
  },
};

function BackendSectionCard({
  sectionKey,
  label,
  status,
  lastSavedAt,
  route,
}: {
  sectionKey: ApplicationSectionKey;
  label: string;
  status: ApplicationSectionStatus;
  lastSavedAt: string | null;
  route: string;
}) {
  const cfg = BACKEND_STATUS_CONFIG[status] ?? BACKEND_STATUS_CONFIG.not_started;
  return (
    <Link
      to={route}
      className="group block rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">{label}</h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
          {cfg.label}
        </span>
      </div>
      {lastSavedAt && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Last saved {formatDate(lastSavedAt)}
        </p>
      )}
      {!lastSavedAt && status === "not_started" && (
        <p className="mt-2 text-[11px] text-muted-foreground">Not started yet</p>
      )}
      <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        {status === "not_started" ? "Start" : "Continue"} <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

function formatDate(iso?: string | null): string {
  if (!iso) return "Not available";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
