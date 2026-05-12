import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Lock, Mail, Send } from "lucide-react";
import {
  CompletionSummaryPanel,
  Field,
  FormCard,
  InfoNote,
  MissingFieldsPanel,
  PageHeader,
  PageShell,
  SaveAndContinueBar,
  TxType,
  fmtMoney,
  inputCls,
} from "@/components/property-financing/shared";

export const Route = createFileRoute(
  "/applications/$applicationId/product-review-consent",
)({
  head: () => ({
    meta: [
      { title: "Product Review & Consent — approvU" },
      {
        name: "description",
        content: "Review your mortgage submission details and provide consent before review.",
      },
    ],
  }),
  component: ProductReviewConsentPage,
});

const READINESS = [
  { label: "Borrower profiles complete", ok: true },
  { label: "Property details complete", ok: true },
  { label: "Financing details complete", ok: true },
  { label: "Mortgage request complete", ok: true },
  { label: "Selected offer confirmed", ok: true },
  { label: "Required consents complete", ok: false },
  { label: "No blocking issues", ok: true },
];

const ACK = [
  "I confirm the information provided in this application is accurate to the best of my knowledge.",
  "I understand approvU will review my application before lender submission.",
  "I understand my selected mortgage offer is preliminary and may change after review.",
  "I understand that rates, payments, product availability, and benefits are subject to verification and lender approval.",
  "I authorize approvU and its licensed mortgage professionals to review my application and contact me about next steps.",
  "I understand additional documents or conditions may be requested.",
  "I understand that Home Life Bundle benefits only unlock after mortgage funding and closing through approvU.",
];

const BORROWERS = [
  { name: "David Scott", consent: true, credit: true, decl: true },
  { name: "Jamie Scott", consent: false, credit: true, decl: true },
];

const COMM = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Phone" },
  { value: "portal", label: "Portal notification" },
];

function ProductReviewConsentPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Purchase";

  // Toggle locked simulation
  const isLocked = false;

  const [acks, setAcks] = useState<boolean[]>(ACK.map(() => false));
  const [comm, setComm] = useState<string[]>(["email"]);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<string | null>("borrowers");

  const allAcks = acks.every(Boolean);
  const consentsOk = BORROWERS.every((b) => b.consent && b.credit && b.decl);

  const groupsDone = [allAcks, consentsOk, comm.length > 0];
  const progress = Math.round((groupsDone.filter(Boolean).length / groupsDone.length) * 100);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!allAcks) m.push("Accept all required acknowledgements");
    if (!consentsOk) {
      const w = BORROWERS.filter((b) => !b.consent).map((b) => b.name);
      if (w.length) m.push(`Waiting for consent from ${w.join(", ")}`);
    }
    if (comm.length === 0) m.push("Choose at least one communication preference");
    return m;
  }, [allAcks, consentsOk, comm]);

  const canComplete = missing.length === 0;

  if (isLocked) {
    return (
      <PageShell>
        <PageHeader
          applicationId={applicationId}
          tx={tx}
          title="Product Review & Consent"
          subtitle="Locked until required sections are complete."
          progress={0}
        />
        <FormCard title="Locked">
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
            <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Product Review & Consent unlocks once required sections are complete.</p>
              <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                <li>Co-applicant profile incomplete</li>
                <li>Down payment sources incomplete</li>
                <li>Mortgage request not complete</li>
              </ul>
            </div>
          </div>
        </FormCard>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        tx={tx}
        title="Review and consent"
        subtitle="Take a final look at your details and give consent before your application is sent for review."
        progress={progress}
        saveStatus={allAcks ? "saved" : "unsaved"}
      />

      <CompletionSummaryPanel total={groupsDone.length} done={groupsDone.filter(Boolean).length} />

      <FormCard step={1} title="Submission Readiness">
        <ul className="space-y-2 text-sm">
          {READINESS.map((r) => (
            <li key={r.label} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span>{r.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  r.ok ? "bg-mint/25 text-foreground" : "bg-coral/15 text-coral"
                }`}
              >
                {r.ok ? "Ready" : "Needs Review"}
              </span>
            </li>
          ))}
        </ul>
      </FormCard>

      <FormCard step={2} title="Mortgage Product Direction">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-medium text-muted-foreground">Selected preliminary offer</p>
          <h3 className="mt-1 text-base font-semibold">Best Value Fixed Offer</h3>
          <p className="text-xs text-muted-foreground">Monoline Lender Path · 5-Year Fixed</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <KV label="Est. rate" value="4.89%" />
            <KV label="Est. payment" value={`${fmtMoney(2358)}/mo`} />
            <KV label="Loan amount" value={fmtMoney(748024)} />
            <KV label="Bundle" value="HomeStrategy Advantage™" />
          </div>
        </div>
        <InfoNote>
          This is not a final approval. approvU will review your full application and may recommend updated products if your verified details differ from your initial qualification answers.
        </InfoNote>
      </FormCard>

      <FormCard step={3} title="Selected Product Priority">
        <p className="text-xs text-muted-foreground">
          approvU may review up to 3 selected mortgage products in priority order. Your application is not submitted to all lenders at once.
        </p>
        <ol className="mt-3 space-y-2 text-sm">
          {[
            { rank: "1", name: "Best Value Fixed", role: "Primary" },
            { rank: "2", name: "Flexible Payment Option", role: "Backup" },
            { rank: "3", name: "Lower Upfront Costs", role: "Backup" },
          ].map((p) => (
            <li key={p.rank} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {p.rank}
              </span>
              <span className="flex-1">{p.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{p.role}</span>
            </li>
          ))}
        </ol>
      </FormCard>

      <FormCard step={4} title="Application Summary">
        <div className="space-y-2">
          {[
            { id: "borrowers", title: "Borrowers", body: "David Scott — Complete · Jamie Scott — Complete" },
            { id: "property", title: "Property & Financing", body: "123 Maple Ave, Toronto, ON · Purchase price $832,000 · Down payment $83,976" },
            { id: "request", title: "Mortgage Request", body: "Requested $748,024 · 5-year term · Fixed rate" },
            { id: "offer", title: "Selected Offer", body: "Best Value Fixed Offer · 4.89% · $2,358/mo" },
            { id: "bundle", title: "Home Life Bundle", body: "HomeStrategy Advantage™ · $2,350 value" },
          ].map((s) => (
            <div key={s.id} className="rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setOpen(open === s.id ? null : s.id)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium"
              >
                <span>{s.title}</span>
                {open === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {open === s.id && (
                <div className="border-t border-border px-3 py-2.5 text-xs text-muted-foreground">{s.body}</div>
              )}
            </div>
          ))}
        </div>
      </FormCard>

      <FormCard step={5} title="Consent & Acknowledgements" done={allAcks}>
        <div className="space-y-2">
          {ACK.map((a, i) => (
            <label
              key={i}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:bg-muted/30"
            >
              <input
                type="checkbox"
                checked={acks[i]}
                onChange={(e) =>
                  setAcks((p) => p.map((v, idx) => (idx === i ? e.target.checked : v)))
                }
                className="mt-0.5 h-4 w-4"
              />
              <span>{a}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Per-borrower consent</p>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {BORROWERS.map((b) => (
              <li key={b.name} className="flex items-center justify-between px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Consent {b.consent ? "✓" : "—"} · Credit {b.credit ? "✓" : "—"} · Declarations {b.decl ? "✓" : "—"}
                  </p>
                </div>
                {!b.consent ? (
                  <button className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90">
                    <Mail className="h-3 w-3" /> Send Reminder
                  </button>
                ) : (
                  <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold">Complete</span>
                )}
              </li>
            ))}
          </ul>
          {!consentsOk && (
            <p className="mt-2 text-xs text-coral">
              Waiting for {BORROWERS.filter((b) => !b.consent).map((b) => b.name).join(", ")} to complete consent.
            </p>
          )}
        </div>
      </FormCard>

      <FormCard step={6} title="Communication Preferences">
        <Field label="How would you like to receive application updates?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COMM.map((c) => {
              const sel = comm.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() =>
                    setComm((p) => (p.includes(c.value) ? p.filter((x) => x !== c.value) : [...p, c.value]))
                  }
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    sel ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </Field>
      </FormCard>

      <FormCard step={7} title="Final Review Comment">
        <Field label="Anything you want to add before submitting to approvU?">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${inputCls} min-h-24`}
            placeholder="Optional note for the approvU team"
          />
        </Field>
      </FormCard>

      <MissingFieldsPanel items={missing} />

      <div className="mb-4">
        <Link
          to="/applications/$applicationId/submit"
          params={{ applicationId }}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Send className="h-3 w-3" /> Continue to Submit Application
        </Link>
      </div>

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={canComplete}
        nextLabel="Complete Product Review & Consent"
        onSaveContinue={() =>
          navigate({
            to: "/applications/$applicationId/submit",
            params: { applicationId },
          })
        }
      />
    </PageShell>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/70 p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}