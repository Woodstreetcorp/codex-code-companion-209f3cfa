import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  listBorrowerApplicationConsents,
  storeBorrowerApplicationConsents,
  submitBorrowerApplicationConsent,
  type BorrowerApplicationConsent,
  type ConsentListResponse,
  type ConsentStatus,
  type ConsentType,
} from "@/lib/api/borrowerApplicationConsentsApi";

export const Route = createFileRoute("/portal/application/consents")({
  head: () => ({
    meta: [
      { title: "Application Consents - approvU" },
      {
        name: "description",
        content: "Review and accept required borrower consents for your mortgage application.",
      },
    ],
  }),
  component: BorrowerApplicationConsentsPage,
});

const CONSENT_VERSION = "v1";

type ConsentCopy = {
  type: ConsentType;
  title: string;
  purpose: string;
};

const CONSENT_COPY: ConsentCopy[] = [
  {
    type: "privacy",
    title: "Privacy Consent",
    purpose:
      "You agree that approvU may collect, use, and store your personal information to support your mortgage application.",
  },
  {
    type: "electronic_communication",
    title: "Electronic Communication Consent",
    purpose: "You agree to receive application-related communications electronically.",
  },
  {
    type: "document_collection",
    title: "Document Collection Consent",
    purpose:
      "You agree that approvU may collect and review documents you upload for your mortgage application.",
  },
  {
    type: "credit_bureau",
    title: "Credit Bureau Consent",
    purpose:
      "You authorize approvU or its authorized mortgage professionals to obtain and review credit information where required for mortgage assessment.",
  },
  {
    type: "lender_sharing",
    title: "Lender Sharing Consent",
    purpose:
      "You agree that your application information and supporting documents may be shared with suitable lenders or service providers for mortgage review.",
  },
  {
    type: "application_submission",
    title: "Application Submission Consent",
    purpose:
      "You confirm that the information you provide is accurate to the best of your knowledge and may be used to prepare your mortgage application for review.",
  },
];

const STATUS_LABELS: Record<ConsentStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  revoked: "Revoked",
};

function BorrowerApplicationConsentsPage() {
  const [result, setResult] = useState<ConsentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<ConsentType | null>(null);
  const [saveError, setSaveError] = useState<Record<ConsentType, string | undefined>>({
    privacy: undefined,
    electronic_communication: undefined,
    document_collection: undefined,
    credit_bureau: undefined,
    lender_sharing: undefined,
    application_submission: undefined,
  });

  const consentByType = useMemo(() => {
    const map = new Map<string, BorrowerApplicationConsent>();
    result?.consents?.forEach((consent) => {
      if (consent.consent_type) map.set(consent.consent_type, consent);
    });
    return map;
  }, [result?.consents]);

  const acceptedCount = CONSENT_COPY.filter((item) => {
    const consent = consentByType.get(item.type);
    return consent?.status === "accepted" || consent?.accepted === true;
  }).length;

  const loadConsents = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await listBorrowerApplicationConsents();
      storeBorrowerApplicationConsents(response);
      setResult(response);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Application consents could not be loaded right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConsents();
  }, []);

  const acceptConsent = async (copy: ConsentCopy) => {
    setSavingType(copy.type);
    setSaveError((current) => ({ ...current, [copy.type]: undefined }));

    try {
      const response = await submitBorrowerApplicationConsent({
        consent_type: copy.type,
        accepted: true,
        consent_version: CONSENT_VERSION,
        consent_text: copy.purpose,
      });
      storeBorrowerApplicationConsents(response);
      setResult(response);
      await loadConsents();
    } catch (error) {
      setSaveError((current) => ({
        ...current,
        [copy.type]:
          error instanceof Error ? error.message : "We could not save this consent right now.",
      }));
    } finally {
      setSavingType(null);
    }
  };

  if (loading && !result) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading application consents...</p>
      </div>
    );
  }

  if (loadError && !result) {
    const sessionExpired = isSessionExpiredMessage(loadError);
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          We could not load your consents
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {sessionExpired ? "Your session may have expired. Please sign in again." : loadError}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => void loadConsents()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Retry
          </button>
          {sessionExpired && (
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              Sign in
            </Link>
          )}
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
          Required borrower consents
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Review and Accept Consents
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Review each consent before your application is prepared for submission. Final consent
          wording should be reviewed by the approvU team before public launch.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {CONSENT_COPY.map((copy) => {
            const consent = consentByType.get(copy.type);
            return (
              <ConsentCard
                key={copy.type}
                copy={copy}
                consent={consent}
                saving={savingType === copy.type}
                error={saveError[copy.type]}
                onAccept={() => void acceptConsent(copy)}
              />
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Consent readiness</h2>
                <p className="text-xs text-muted-foreground">
                  {result?.consent_ready ? "Ready for next step" : "Action required"}
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.round((acceptedCount / CONSENT_COPY.length) * 100)}%` }}
              />
            </div>

            <dl className="mt-4 space-y-2 text-xs">
              <SummaryRow label="Accepted" value={acceptedCount} />
              <SummaryRow label="Required" value={CONSENT_COPY.length} />
              {result?.consent_summary?.pending != null && (
                <SummaryRow label="Pending" value={result.consent_summary.pending} />
              )}
              {result?.consent_summary?.declined != null && (
                <SummaryRow label="Declined" value={result.consent_summary.declined} />
              )}
              {result?.consent_summary?.revoked != null && (
                <SummaryRow label="Revoked" value={result.consent_summary.revoked} />
              )}
            </dl>

            {result?.next_step && (
              <div className="mt-4 rounded-xl border border-secondary/20 bg-secondary/10 p-3 text-xs">
                <p className="font-semibold text-foreground">Next step</p>
                <p className="mt-1 text-muted-foreground">{formatNextStep(result.next_step)}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-xs text-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
              <p>
                This page captures borrower consent acknowledgements only. It does not replace legal
                review, e-signature, or lender-specific consent requirements.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ConsentCard({
  copy,
  consent,
  saving,
  error,
  onAccept,
}: {
  copy: ConsentCopy;
  consent?: BorrowerApplicationConsent;
  saving: boolean;
  error?: string;
  onAccept: () => void;
}) {
  const status = normalizeStatus(consent);
  const accepted = status === "accepted";

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">{copy.title}</h2>
            <StatusBadge status={status} />
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {consent?.consent_version ?? CONSENT_VERSION}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.purpose}</p>
          {consent?.accepted_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              Accepted {formatDate(consent.accepted_at)}
            </p>
          )}
        </div>

        <button
          onClick={onAccept}
          disabled={accepted || saving}
          className={`inline-flex h-10 shrink-0 items-center justify-center rounded-md px-4 text-sm font-semibold ${
            accepted
              ? "cursor-default bg-mint/20 text-mint-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Saving
            </>
          ) : accepted ? (
            <>
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Agreed
            </>
          ) : (
            "I agree"
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: ConsentStatus }) {
  const classes: Record<ConsentStatus, string> = {
    accepted: "border-mint/30 bg-mint/15 text-mint-foreground",
    pending: "border-border bg-muted text-muted-foreground",
    declined: "border-coral/30 bg-coral/10 text-coral",
    revoked: "border-yellow-200 bg-yellow-50 text-yellow-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${classes[status]}`}
    >
      {status === "accepted" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {STATUS_LABELS[status]}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function normalizeStatus(consent?: BorrowerApplicationConsent): ConsentStatus {
  if (consent?.status === "accepted" || consent?.accepted === true) return "accepted";
  if (consent?.status === "declined") return "declined";
  if (consent?.status === "revoked") return "revoked";
  return "pending";
}

function formatNextStep(nextStep: string): string {
  return nextStep
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
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

function isSessionExpiredMessage(message?: string | null): boolean {
  const lower = message?.toLowerCase() ?? "";
  return lower.includes("session") || lower.includes("unauthenticated") || lower.includes("401");
}
