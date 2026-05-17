import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getBorrowerApplicationSubmissionReadiness,
  storeBorrowerApplicationSubmission,
  submitBorrowerApplication,
  type SubmissionBlocker,
  type SubmissionReadinessResponse,
  type SubmissionResponse,
  type SubmissionSummary,
} from "@/lib/api/borrowerApplicationSubmissionApi";

export const Route = createFileRoute("/portal/application/review-submit")({
  head: () => ({
    meta: [
      { title: "Review & Submit Application - approvU" },
      {
        name: "description",
        content: "Review your mortgage application readiness before submitting to approvU.",
      },
    ],
  }),
  component: ApplicationReviewSubmitPage,
});

function ApplicationReviewSubmitPage() {
  const [readiness, setReadiness] = useState<SubmissionReadinessResponse | null>(null);
  const [submitted, setSubmitted] = useState<SubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const blockers = useMemo(() => readiness?.blockers?.filter(Boolean) ?? [], [readiness]);
  const ready = readiness?.ready === true && blockers.length === 0;

  const loadReadiness = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getBorrowerApplicationSubmissionReadiness();
      storeBorrowerApplicationSubmission(result);
      setReadiness(result);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Application submission readiness could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReadiness();
  }, []);

  const handleSubmit = async () => {
    if (!ready || !confirmed || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitBorrowerApplication();
      storeBorrowerApplicationSubmission(result);
      if (result.submitted || result.application) {
        setSubmitted(result);
      } else {
        await loadReadiness();
        setSubmitError(
          result.message ?? "Your application could not be submitted yet. Please review blockers.",
        );
      }
    } catch (error) {
      await loadReadiness();
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not submit your application right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !readiness) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Checking application readiness...</p>
      </div>
    );
  }

  if (loadError && !readiness) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          We could not check readiness
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{loadError}</p>
        <button
          onClick={() => void loadReadiness()}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (submitted?.application || submitted?.submitted) {
    const application = submitted.application;
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-mint/30 bg-mint/10 p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint/25 text-mint-foreground">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-secondary">
            Application submitted
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Your application has been sent to approvU for review
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Submitting sends your application package to the approvU team for review. It is not a
            mortgage approval or lender commitment.
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryTile
              label="Reference"
              value={application?.public_reference ?? "Not available"}
            />
            <SummaryTile label="Status" value={formatLabel(application?.status)} />
            <SummaryTile
              label="Submitted"
              value={formatDate(application?.submitted_at) ?? "Just now"}
            />
          </dl>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/portal/application"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Back to application
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
          <Link
            to="/portal/documents"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Documents
          </Link>
          <Link
            to="/portal/offers"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Offers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/portal/application"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to application workspace
        </Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-secondary">
          Review and submit
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Final Application Review
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Before you can submit, please complete the items below. Submitting sends your application
          package to the approvU team for review. It is not a mortgage approval or lender
          commitment.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <ReadinessHeader readiness={readiness} ready={ready} />

          {blockers.length > 0 ? (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-coral" />
                <h2 className="text-base font-semibold text-foreground">
                  Items to complete before submission
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {blockers.map((blocker, index) => (
                  <BlockerCard key={blocker.key ?? index} blocker={blocker} />
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-mint/30 bg-mint/10 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint-foreground" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Your application is ready to submit
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review the summary one last time, confirm accuracy, then submit to approvU.
                  </p>
                </div>
              </div>
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryPanel
              icon={ClipboardList}
              title="Application sections"
              summary={readiness?.sections_summary}
            />
            <SummaryPanel
              icon={ShieldCheck}
              title="Consents"
              summary={readiness?.consent_summary}
            />
            <SummaryPanel
              icon={UploadCloud}
              title="Documents"
              summary={readiness?.document_summary}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Submit application</h2>
                <p className="text-xs text-muted-foreground">
                  {ready ? "Ready for final confirmation" : "Blocked until required items are done"}
                </p>
              </div>
            </div>

            <label
              className={`mt-5 flex items-start gap-3 rounded-xl border p-3 text-sm ${
                confirmed ? "border-mint/40 bg-mint/10" : "border-border bg-muted/30"
              }`}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={!ready || submitting}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span className="text-foreground">
                I confirm the information provided is accurate to the best of my knowledge.
              </span>
            </label>

            {submitError && (
              <div className="mt-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
                {submitError}
              </div>
            )}

            <button
              onClick={() => void handleSubmit()}
              disabled={!ready || !confirmed || submitting}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>

          {readiness?.next_step && (
            <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-4 text-sm">
              <p className="font-semibold text-foreground">Next step</p>
              <p className="mt-1 text-muted-foreground">{formatLabel(readiness.next_step)}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ReadinessHeader({
  readiness,
  ready,
}: {
  readiness: SubmissionReadinessResponse | null;
  ready: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Application status
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            {formatLabel(readiness?.status)}
          </h2>
          {readiness?.application_public_reference && (
            <p className="mt-1 text-xs text-muted-foreground">
              Reference {readiness.application_public_reference}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
            ready ? "bg-mint/15 text-mint-foreground" : "bg-yellow-50 text-yellow-700"
          }`}
        >
          {ready ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          {ready ? "Ready" : "Not ready"}
        </span>
      </div>
      {readiness?.message && (
        <p className="mt-3 text-sm text-muted-foreground">{readiness.message}</p>
      )}
    </section>
  );
}

function BlockerCard({ blocker }: { blocker: SubmissionBlocker }) {
  const route = routeForBlocker(blocker);
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {blocker.label ?? formatLabel(blocker.key)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {blocker.message ?? "This item must be completed before submission."}
          </p>
          {blocker.key && (
            <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {blocker.key}
            </p>
          )}
        </div>
        {route && (
          <Link
            to={route}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Resolve
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

function SummaryPanel({
  icon: Icon,
  title,
  summary,
}: {
  icon: React.ElementType;
  title: string;
  summary?: SubmissionSummary | null;
}) {
  const entries = Object.entries(summary ?? {}).filter(([, value]) => value != null);
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <dl className="mt-4 space-y-2">
        {entries.length > 0 ? (
          entries.slice(0, 6).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <dt className="text-xs text-muted-foreground">{formatLabel(key)}</dt>
              <dd className="text-xs font-semibold text-foreground">{String(value)}</dd>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No summary available yet.</p>
        )}
      </dl>
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function routeForBlocker(blocker: SubmissionBlocker): string | undefined {
  if (blocker.route_hint) return blocker.route_hint;
  const key = (blocker.key ?? "").toLowerCase();
  if (key.includes("consent")) return "/portal/application/consents";
  if (key.includes("document")) return "/portal/documents";
  if (key.includes("section")) return "/portal/application";
  return undefined;
}

function formatLabel(value?: string | null): string {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
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
