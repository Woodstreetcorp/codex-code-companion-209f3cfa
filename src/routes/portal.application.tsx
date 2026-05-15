import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
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

const SECTION_STATUS_CONFIG: Record<SectionStatus, StatusConfig> = {
  complete: {
    label: "Complete",
    badgeClass:
      "bg-mint/15 text-mint-foreground border border-mint/30",
    dotClass: "bg-mint",
  },
  in_progress: {
    label: "In Progress",
    badgeClass:
      "bg-secondary/10 text-secondary border border-secondary/20",
    dotClass: "bg-secondary",
  },
  needs_attention: {
    label: "Needs Attention",
    badgeClass:
      "bg-coral/10 text-coral border border-coral/20",
    dotClass: "bg-coral",
  },
  not_started: {
    label: "Not Started",
    badgeClass:
      "bg-muted text-muted-foreground border border-border",
    dotClass: "bg-muted-foreground/40",
  },
  pending_review: {
    label: "Pending Review",
    badgeClass:
      "bg-yellow-50 text-yellow-700 border border-yellow-200",
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

function primaryRouteFor(
  action?: string | null,
  routeHint?: string | null,
): string {
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

// ── Page component ────────────────────────────────────────────────────────────

function ApplicationWorkspacePage() {
  const [summary, setSummary] = useState<BorrowerApplicationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getBorrowerApplicationSummary();
        if (!active) return;
        storeBorrowerApplicationSummary(result);
        setSummary(result);
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
        <p className="mt-4 text-sm text-muted-foreground">
          Loading your application workspace…
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
          We could not load your workspace
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error ??
            "Your session may have expired. Sign in again to continue your application."}
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

  const percent = summary.completion_percent ?? 5;
  const state = summary.application_state;
  const qualSummary = summary.qualification_summary;
  const snapSummary = summary.mortgage_snapshot_summary;
  const docSummary = summary.document_summary;
  const sections = summary.sections ?? [];
  const primaryAction = summary.primary_action;
  const messages = summary.messages?.filter(Boolean) ?? [];
  const primaryRoute = primaryRouteFor(
    primaryAction?.action,
    primaryAction?.route_hint,
  );

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
              <li
                key={msg}
                className="flex items-start gap-2 text-sm text-yellow-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Progress card ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Application progress
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {percent}%
            </p>
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
                <DataRow
                  label="Started"
                  value={formatDate(qualSummary.started_at)}
                />
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
              <DataRow
                label="Classification"
                value={formatLabel(snapSummary.classification)}
              />
              <DataRow
                label="Readiness"
                value={formatLabel(snapSummary.readiness_status)}
              />
              <DataRow
                label="Key insights"
                value={String(snapSummary.key_insights_count ?? 0)}
              />
              {(snapSummary.missing_items_count ?? 0) > 0 && (
                <DataRow
                  label="Missing items"
                  value={String(snapSummary.missing_items_count)}
                />
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
                <DataRow
                  label="Under review"
                  value={String(docSummary.uploaded)}
                />
              )}
              {(docSummary.reviewed ?? 0) > 0 && (
                <DataRow
                  label="Accepted"
                  value={String(docSummary.reviewed)}
                  highlight="mint"
                />
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

      {/* ── Sections grid ────────────────────────────────────────────────── */}
      {sections.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Application sections
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            An overview of each part of your application.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sections.map((section) => (
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
        {empty ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          children
        )}
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
