import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Lock, Send, X } from "lucide-react";
import {
  Field,
  FormCard,
  InfoNote,
  MissingFieldsPanel,
  PageHeader,
  PageShell,
  TxType,
  fmtMoney,
  inputCls,
} from "@/components/property-financing/shared";

export const Route = createFileRoute(
  "/applications/$applicationId/submit",
)({
  head: () => ({
    meta: [
      { title: "Submit Application — approvU" },
      { name: "description", content: "Submit your completed application to approvU for review." },
    ],
  }),
  component: SubmitApplicationPage,
});

const READINESS = [
  { label: "Primary borrower complete", ok: true },
  { label: "Additional applicants complete", ok: true },
  { label: "Property details complete", ok: true },
  { label: "Financing details complete", ok: true },
  { label: "Mortgage request complete", ok: true },
  { label: "Selected offer confirmed", ok: true },
  { label: "Product review complete", ok: true },
  { label: "Consents complete", ok: true },
  { label: "No blocking issues", ok: true },
];

function SubmitApplicationPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Purchase";

  const isLocked = false;
  const [note, setNote] = useState("");
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const ready = READINESS.every((r) => r.ok);
  const canSubmit = ready && confirm1 && confirm2;

  const missing: string[] = [];
  if (!ready) missing.push("Some required sections are incomplete");
  if (!confirm1) missing.push("Confirm you are ready to submit");
  if (!confirm2) missing.push("Acknowledge approvU may contact you for documents");

  if (isLocked) {
    return (
      <PageShell>
        <PageHeader applicationId={applicationId} tx={tx} title="Submit Application" subtitle="Locked." progress={0} />
        <FormCard title="Locked">
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
            <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <p className="text-sm">Complete required sections before you can submit.</p>
          </div>
        </FormCard>
      </PageShell>
    );
  }

  if (submitted) {
    return <SubmittedSuccess applicationId={applicationId} />;
  }

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        tx={tx}
        title="Submit your application"
        subtitle="Send your completed application to approvU for review. You'll get updates here as it moves forward."
        progress={canSubmit ? 100 : 80}
        saveStatus="saved"
      />

      <FormCard step={1} title="Ready to Submit?">
        <div
          className={`mb-3 rounded-xl p-3 text-sm font-semibold ${
            ready ? "bg-mint/15 text-foreground" : "bg-coral/10 text-coral"
          }`}
        >
          {ready
            ? "Your application is ready to submit."
            : `You still have ${READINESS.filter((r) => !r.ok).length} items to complete before you can submit.`}
        </div>
        <ul className="space-y-1.5 text-sm">
          {READINESS.map((r) => (
            <li key={r.label} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span>{r.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  r.ok ? "bg-mint/25 text-foreground" : "bg-coral/15 text-coral"
                }`}
              >
                {r.ok ? "Complete" : "Missing"}
              </span>
            </li>
          ))}
        </ul>
      </FormCard>

      <FormCard step={2} title="Application Summary">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <KV label="Application ID" value={`APP-${applicationId === "current" ? "2041" : applicationId}`} />
          <KV label="Transaction" value={tx} />
          <KV label="Location" value="Toronto, ON" />
          <KV label="Requested mortgage" value={fmtMoney(748024)} />
          <KV label="Down payment" value={fmtMoney(83976)} />
          <KV label="Estimated LTV" value="90%" />
          <KV label="Borrowers" value="David & Jamie Scott" />
          <KV label="Selected offer" value="Best Value Fixed" />
          <KV label="Bundle value" value={fmtMoney(2350)} />
        </div>
      </FormCard>

      <FormCard step={3} title="What happens after you submit">
        <ol className="space-y-2 text-sm">
          {[
            "approvU reviews your application end-to-end.",
            "We may ask for documents or quick clarifications.",
            "We confirm the mortgage products you qualify for.",
            "Your file is prepared and sent to the lender.",
            "You'll see lender response updates right here in your hub.",
          ].map((s, i) => (
            <li key={s} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <InfoNote>
          Submitting isn't a final mortgage approval. Final approval depends on lender review, document verification, and meeting any conditions.
        </InfoNote>
      </FormCard>

      <FormCard step={4} title="Submission Note (optional)">
        <Field label="Add a note for the approvU team">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Example: Please call me if any documents are missing."
            className={`${inputCls} min-h-24`}
          />
        </Field>
      </FormCard>

      <FormCard step={5} title="Final Confirmation" done={confirm1 && confirm2}>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm">
          <input type="checkbox" checked={confirm1} onChange={(e) => setConfirm1(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I confirm that I am ready to submit this application to approvU for review.</span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm">
          <input type="checkbox" checked={confirm2} onChange={(e) => setConfirm2(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>I understand that approvU may contact me for documents, clarification, or updated information.</span>
        </label>
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-semibold">
          <CheckCircle2 className="h-3 w-3" /> All required applicants have completed their declarations and consents
        </p>
      </FormCard>

      <MissingFieldsPanel items={missing} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link
            to="/internal/full-application"
            search={{ section: "mortgage-application" }}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Back to Hub
          </Link>
          <button
            disabled={!canSubmit}
            onClick={() => setShowModal(true)}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              canSubmit
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
            title={canSubmit ? undefined : "Complete the items above before you can submit."}
          >
            <Send className="h-3.5 w-3.5" /> Submit application to approvU
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold">Submit your mortgage application?</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Once submitted, your application will be reviewed by approvU. Some fields may become locked, and we may request documents or additional information.
            </p>
            <div className="mt-3 space-y-1 rounded-xl bg-muted/40 p-3 text-xs">
              <KVRow k="Application ID" v={`APP-${applicationId === "current" ? "2041" : applicationId}`} />
              <KVRow k="Transaction" v={tx} />
              <KVRow k="Selected offer" v="Best Value Fixed" />
              <KVRow k="Borrowers" v="2 of 2 complete" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSubmitted(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-3.5 w-3.5" /> Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function SubmittedSuccess({ applicationId }: { applicationId: string }) {
  const navigate = useNavigate();
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-mint/30 bg-mint/10 p-6 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-mint">
            <CheckCircle2 className="h-6 w-6 text-mint-foreground" />
          </div>
          <h1 className="mt-3 text-2xl font-semibold">Application submitted</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nice work — your application is with the approvU team for review.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            We'll let you know right here if we need any documents or updates from you.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">What's next</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {[
              "Application submitted",
              "approvU review",
              "Document request",
              "Product/lender review",
              "Lender response",
              "Conditions",
              "Closing",
            ].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    i === 0 ? "bg-mint text-mint-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            onClick={() =>
              navigate({
                to: "/internal/full-application",
                search: { section: "mortgage-application" },
              })
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Go to application hub <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate({ to: "/portal" })}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <FileText className="h-4 w-4" /> Back to portal
          </button>
        </div>
        <div className="sr-only">App {applicationId}</div>
      </div>
    </PageShell>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

function KVRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}