import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  ApplicationShell,
  NotFoundApplication,
  getApplicationSummary,
  type AppSummary,
} from "@/components/portal/application-shell";

export const Route = createFileRoute("/portal/applications/$applicationId/lender")({
  head: () => ({
    meta: [
      { title: "Lender Submission — approvU" },
      {
        name: "description",
        content:
          "See where your application is with the lender — submitted, under review, approved, or declined.",
      },
    ],
  }),
  component: LenderPage,
});

/**
 * Mock for application_lender_submission. Codex contract:
 *   id, application_id, lender_id, lender_name, product_name,
 *   submission_status (queued|submitted|in_review|conditional_approval|approved|declined|withdrawn),
 *   requested_terms (jsonb), approved_terms (jsonb),
 *   submitted_at, decision_at, decline_reason_code, decline_reason_text,
 *   underwriter_name, underwriter_contact
 */
type SubmissionStatus =
  | "queued"
  | "submitted"
  | "in_review"
  | "conditional_approval"
  | "approved"
  | "declined"
  | "withdrawn";

type LenderSubmission = {
  id: string;
  lenderName: string;
  productName: string;
  status: SubmissionStatus;
  submittedAt?: string;
  decisionAt?: string;
  expectedDecisionBy?: string;
  requested: { rate: string; term: string; amount: string; payment: string };
  approved?: { rate: string; term: string; amount: string; payment: string };
  declineReason?: string;
  underwriter?: { name: string; email?: string; phone?: string };
  notes?: string;
};

function mockSubmissions(summary: AppSummary): LenderSubmission[] {
  if (summary.bucket === "Active") {
    return [
      {
        id: "sub-1",
        lenderName: "Major Bank",
        productName: "5-yr Fixed · Insured",
        status: "queued",
        requested: {
          rate: "4.59%",
          term: "5-yr fixed",
          amount: "$520,000",
          payment: "$2,358 / mo",
        },
        notes: "Will be submitted once your file is reviewed.",
      },
    ];
  }
  if (summary.bucket === "Submitted") {
    return [
      {
        id: "sub-1",
        lenderName: "Major Bank",
        productName: "5-yr Fixed · Insured",
        status: "in_review",
        submittedAt: "May 8, 2026 · 9:42 AM",
        expectedDecisionBy: "May 14, 2026",
        requested: {
          rate: "4.59%",
          term: "5-yr fixed",
          amount: "$520,000",
          payment: "$2,358 / mo",
        },
        underwriter: {
          name: "S. Patel",
          email: "underwriting@majorbank.example",
          phone: "(416) 555-0114",
        },
        notes: "Underwriter has acknowledged the file. Awaiting decision.",
      },
      {
        id: "sub-2",
        lenderName: "Monoline Lender",
        productName: "5-yr Fixed",
        status: "conditional_approval",
        submittedAt: "May 6, 2026 · 2:10 PM",
        decisionAt: "May 9, 2026 · 4:55 PM",
        requested: {
          rate: "4.74%",
          term: "5-yr fixed",
          amount: "$520,000",
          payment: "$2,402 / mo",
        },
        approved: { rate: "4.74%", term: "5-yr fixed", amount: "$520,000", payment: "$2,402 / mo" },
        notes: "Conditional on income verification and property appraisal.",
      },
      {
        id: "sub-3",
        lenderName: "Credit Union",
        productName: "5-yr Variable",
        status: "declined",
        submittedAt: "May 5, 2026 · 11:00 AM",
        decisionAt: "May 7, 2026 · 3:20 PM",
        requested: {
          rate: "5.10%",
          term: "5-yr variable",
          amount: "$520,000",
          payment: "$2,488 / mo",
        },
        declineReason:
          "Beneficial-debt-service ratio (TDS) above policy ceiling for variable-rate stress test. Consider a fixed-rate alternative.",
      },
    ];
  }
  if (summary.bucket === "Completed") {
    return [
      {
        id: "sub-1",
        lenderName: "Major Bank",
        productName: "5-yr Fixed · Insured",
        status: "approved",
        submittedAt: "Apr 15, 2026",
        decisionAt: "Apr 19, 2026",
        requested: {
          rate: "4.59%",
          term: "5-yr fixed",
          amount: "$520,000",
          payment: "$2,358 / mo",
        },
        approved: { rate: "4.54%", term: "5-yr fixed", amount: "$520,000", payment: "$2,346 / mo" },
        underwriter: { name: "S. Patel", email: "underwriting@majorbank.example" },
        notes: "Funded and closed.",
      },
    ];
  }
  return [];
}

const STATUS_META: Record<SubmissionStatus, { label: string; tone: string; icon: typeof Clock }> = {
  queued: {
    label: "Queued for submission",
    tone: "bg-muted text-muted-foreground border-border",
    icon: Clock,
  },
  submitted: {
    label: "Submitted to lender",
    tone: "bg-secondary/10 text-secondary border-secondary/30",
    icon: Send,
  },
  in_review: {
    label: "Under review",
    tone: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/40",
    icon: Clock,
  },
  conditional_approval: {
    label: "Conditional approval",
    tone: "bg-mint/25 text-mint-foreground border-mint/40",
    icon: CheckCircle2,
  },
  approved: {
    label: "Approved",
    tone: "bg-mint/30 text-mint-foreground border-mint/50",
    icon: CheckCircle2,
  },
  declined: { label: "Declined", tone: "bg-coral/10 text-coral border-coral/30", icon: XCircle },
  withdrawn: {
    label: "Withdrawn",
    tone: "bg-muted text-muted-foreground border-border",
    icon: XCircle,
  },
};

function LenderPage() {
  const { applicationId } = Route.useParams();
  const summary = getApplicationSummary(applicationId);
  if (!summary) return <NotFoundApplication id={applicationId} />;

  const subs = mockSubmissions(summary);
  const active = subs.filter((s) => s.status !== "declined" && s.status !== "withdrawn");
  const decisive = subs.find((s) => s.status === "approved" || s.status === "conditional_approval");

  return (
    <ApplicationShell summary={summary} tab="lender">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary/10 p-2 text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {subs.length === 0
                ? "No lender submissions yet"
                : `${subs.length} lender ${subs.length === 1 ? "file" : "files"} on this application`}
            </p>
            <p className="text-xs text-muted-foreground">
              {decisive
                ? `${decisive.lenderName} responded with ${STATUS_META[decisive.status].label.toLowerCase()}.`
                : active.length > 0
                  ? "Awaiting lender decisions."
                  : "Your advisor will submit once your file is reviewed."}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary">
          <ShieldCheck className="h-3 w-3" /> approvU manages lender contact
        </span>
      </div>

      {subs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">Nothing submitted yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Once you select an offer and your file passes review, we'll show every lender submission
            here.
          </p>
          <Link
            to="/portal/applications/$applicationId/offers"
            params={{ applicationId }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            View offers <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((s) => {
            const meta = STATUS_META[s.status];
            const Icon = meta.icon;
            return (
              <article key={s.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                      {s.lenderName}
                    </p>
                    <h3 className="mt-0.5 text-base font-semibold text-foreground">
                      {s.productName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      {s.submittedAt && <span>Submitted {s.submittedAt}</span>}
                      {s.decisionAt && <span>· Decision {s.decisionAt}</span>}
                      {s.expectedDecisionBy && !s.decisionAt && (
                        <span>· Expected by {s.expectedDecisionBy}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}
                  >
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <TermsCard label="Terms requested" terms={s.requested} />
                  {s.approved && <TermsCard label="Terms approved" terms={s.approved} highlight />}
                </div>

                {s.declineReason && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-coral/30 bg-coral/5 p-3 text-xs text-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                    <div>
                      <p className="font-semibold text-coral">Decline reason</p>
                      <p className="mt-0.5 text-muted-foreground">{s.declineReason}</p>
                      <Link
                        to="/portal/messages"
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80"
                      >
                        Discuss alternatives with your advisor →
                      </Link>
                    </div>
                  </div>
                )}

                {s.notes && !s.declineReason && (
                  <p className="mt-3 text-xs text-muted-foreground">{s.notes}</p>
                )}

                {s.underwriter && (
                  <div className="mt-4 rounded-xl border border-border bg-background p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Underwriter contact (via approvU)
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground">
                      <span className="font-medium">{s.underwriter.name}</span>
                      {s.underwriter.email && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" /> {s.underwriter.email}
                        </span>
                      )}
                      {s.underwriter.phone && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {s.underwriter.phone}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          Want to pause or withdraw your application? You can manage that from the Manage tab.
        </p>
        <Link
          to="/portal/applications/$applicationId/manage"
          params={{ applicationId }}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Manage application
        </Link>
      </div>
    </ApplicationShell>
  );
}

function TermsCard({
  label,
  terms,
  highlight,
}: {
  label: string;
  terms: { rate: string; term: string; amount: string; payment: string };
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "border-mint/40 bg-mint/10" : "border-border bg-background"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <Detail k="Rate" v={terms.rate} />
        <Detail k="Term" v={terms.term} />
        <Detail k="Amount" v={terms.amount} />
        <Detail k="Payment" v={terms.payment} />
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{k}</p>
      <p className="font-semibold text-foreground">{v}</p>
    </div>
  );
}
