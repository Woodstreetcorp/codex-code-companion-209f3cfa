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
  type PreliminaryPathValue,
} from "@/lib/api/borrowerOfferReviewApi";

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
    label: "Options Pending",
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

// ── Preliminary path helpers ──────────────────────────────────────────────────

const PATH_DESCRIPTIONS: Record<string, string> = {
  prime: "Prime lending path — standard institutional mortgage products are likely to be applicable.",
  alternative:
    "Alternative lending path — lenders who specialise in non-traditional income or credit profiles may be more suitable.",
  manual_review:
    "Tailored review — your file requires a case-by-case assessment by an advisor.",
  unknown: "Your preliminary lending path has not yet been determined.",
};

function pathDescription(value?: PreliminaryPathValue | null): string {
  return PATH_DESCRIPTIONS[value ?? "unknown"] ?? PATH_DESCRIPTIONS.unknown;
}

// ── Route hint resolver ───────────────────────────────────────────────────────

function resolveRoute(hint?: string | null): string {
  if (!hint) return "/portal";
  if (hint.startsWith("/portal") || hint.startsWith("/purchase") || hint.startsWith("/refinance")) {
    return hint;
  }
  return "/portal";
}

// ── Page component ────────────────────────────────────────────────────────────

function OffersReviewPage() {
  const [summary, setSummary] = useState<BorrowerOfferReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getBorrowerOfferReviewStatus();
        if (!active) return;
        storeBorrowerOfferReviewStatus(result);
        setSummary(result);
      } catch (failure) {
        if (!active) return;
        setError(
          failure instanceof Error
            ? failure.message
            : "Your offer review status could not be loaded.",
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
        <p className="mt-4 text-sm text-muted-foreground">
          Loading your offer review status…
        </p>
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
          {error ??
            "Your session may have expired. Sign in again to continue."}
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
  const prelimPath = summary.preliminary_path;
  const readiness = summary.readiness;
  const sections = summary.offer_sections ?? [];
  const primaryAction = summary.primary_action;
  const disclaimers = summary.disclaimers?.filter(Boolean) ?? [];
  const primaryRoute = resolveRoute(primaryAction?.route_hint);
  const { label: statusLabel, chipClass } = reviewStatusConfig(reviewStatus?.status);

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Offers &amp; review status
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Your Mortgage Options
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page shows where your file stands in the review process. Real
          mortgage options will be discussed once your application and documents
          are complete.
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
              <p className="mt-0.5 text-lg font-semibold text-foreground">
                {statusLabel}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${chipClass}`}
          >
            {statusLabel}
          </span>
        </div>

        {reviewStatus?.message && (
          <p className="mt-4 text-sm text-muted-foreground">
            {reviewStatus.message}
          </p>
        )}
      </div>

      {/* ── Preliminary path card ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Preliminary lending path
            </p>
            <p className="mt-0.5 text-lg font-semibold text-foreground">
              {prelimPath?.label ?? "Not yet determined"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {pathDescription(prelimPath?.value)}
        </p>
        {prelimPath?.source && prelimPath.source !== "unknown" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Source:{" "}
            <span className="font-medium text-foreground capitalize">
              {prelimPath.source}
            </span>
          </p>
        )}
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5">
          <p className="text-xs text-yellow-800">
            <span className="font-semibold">Note:</span> This helps guide the
            review process. It is not an approval decision.
          </p>
        </div>
      </div>

      {/* ── Readiness checklist ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">
          Application readiness
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These three things must be in place before your mortgage options can be
          fully reviewed.
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
          <h2 className="text-lg font-semibold text-foreground">
            Review sections
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each area of your review, and what needs to happen next.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              <OfferSectionCard
                key={section.key ?? section.label}
                section={section}
              />
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
                {primaryAction.label}
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

function ReadinessRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <li className="flex items-center gap-3">
      {ready ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-mint-foreground" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      )}
      <span
        className={`text-sm ${ready ? "text-foreground" : "text-muted-foreground"}`}
      >
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
          {section.label ?? section.key}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
          {config.label}
        </span>
      </div>
      {section.message && (
        <p className="mt-2 text-xs text-muted-foreground">{section.message}</p>
      )}
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
