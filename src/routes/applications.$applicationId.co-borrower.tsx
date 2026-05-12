import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  Mail,
  Phone,
  Trash2,
  UserPlus,
  Send,
  ShieldCheck,
  Clock,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Field,
  FormCard,
  InfoNote,
  PageHeader,
  PageShell,
  inputCls,
} from "@/components/property-financing/shared";
import { notify } from "@/components/portal/activity";
import {
  inviteCoBorrower,
  listCoBorrowers,
  relationshipLabel,
  removeCoBorrower,
  resendInvite,
  revokeCoBorrower,
  roleLabel,
  statusLabel,
  subscribeCoBorrowers,
  type CoBorrower,
  type CoBorrowerRelationship,
  type CoBorrowerRole,
} from "@/lib/co-borrowers";

export const Route = createFileRoute("/applications/$applicationId/co-borrower")({
  head: () => ({
    meta: [
      { title: "Co-Borrowers — approvU" },
      {
        name: "description",
        content:
          "Invite a spouse, partner, guarantor, or co-signer to your mortgage application.",
      },
    ],
  }),
  component: CoBorrowerPage,
});

const RELATIONSHIPS: CoBorrowerRelationship[] = [
  "spouse",
  "partner",
  "parent",
  "child",
  "sibling",
  "friend",
  "business-partner",
  "other",
];

const ROLES: { value: CoBorrowerRole; label: string; description: string }[] = [
  {
    value: "co-borrower",
    label: "Co-Borrower",
    description: "Equal applicant — income, credit, and ownership are shared.",
  },
  {
    value: "guarantor",
    label: "Guarantor",
    description: "Backs repayment but is not on title.",
  },
  {
    value: "co-signer",
    label: "Co-Signer",
    description: "Strengthens the file; usually appears on title.",
  },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function statusTone(s: CoBorrower["status"]) {
  switch (s) {
    case "invited":
      return "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/40";
    case "accepted":
    case "profile_started":
      return "bg-secondary/10 text-secondary border-secondary/30";
    case "profile_complete":
    case "consent_complete":
      return "bg-mint/25 text-mint-foreground border-mint/40";
    case "revoked":
      return "bg-muted text-muted-foreground border-border";
  }
}

function CoBorrowerPage() {
  const { applicationId } = Route.useParams();
  const [list, setList] = useState<CoBorrower[]>([]);

  useEffect(() => {
    setList(listCoBorrowers(applicationId));
    return subscribeCoBorrowers(() => setList(listCoBorrowers(applicationId)));
  }, [applicationId]);

  const active = list.filter((c) => c.status !== "revoked");
  const completedCount = active.filter(
    (c) => c.status === "profile_complete" || c.status === "consent_complete",
  ).length;
  const progress = active.length
    ? Math.round((completedCount / active.length) * 100)
    : 0;

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        title="Co-Borrowers & Co-Applicants"
        subtitle="Invite anyone who should appear on the application — they'll get a secure link to complete their profile and consents."
        tx="Purchase"
        progress={progress}
      />

      <InfoNote variant="info">
        Adding a co-borrower can boost qualifying income and improve your offer mix.
        Each invited person creates their own secure approvU account; you won't see
        their banking or credit details.
      </InfoNote>

      <div className="mt-5">
        <FormCard
          step={1}
          title="Invite a co-applicant"
          description="They'll receive an email and SMS with a secure link to start their profile."
        >
          <InviteForm applicationId={applicationId} />
        </FormCard>

        <FormCard
          step={2}
          title="Invited co-applicants"
          description={`${active.length} active · ${completedCount} complete`}
          done={active.length > 0 && completedCount === active.length}
        >
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
              No co-applicants invited yet. Use the form above to add one.
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {list.map((c) => (
                <li key={c.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{c.fullName}</p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(c.status)}`}
                        >
                          {c.status === "invited" && <Clock className="h-3 w-3" />}
                          {(c.status === "profile_complete" ||
                            c.status === "consent_complete") && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {c.status === "revoked" && <XCircle className="h-3 w-3" />}
                          {statusLabel(c.status)}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {roleLabel(c.role)} · {relationshipLabel(c.relationship)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {c.email}
                        </span>
                        {c.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </span>
                        )}
                        <span>Invited {timeAgo(c.invitedAt)}</span>
                        {c.lastReminderAt && (
                          <span>· Last reminder {timeAgo(c.lastReminderAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {c.status === "invited" && (
                        <button
                          type="button"
                          onClick={() => {
                            resendInvite(c.id);
                            notify({
                              category: "Application",
                              title: `Reminder sent to ${c.fullName}`,
                              body: "We re-sent the secure invitation link.",
                              tone: "success",
                            });
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted"
                        >
                          <Send className="h-3 w-3" /> Resend
                        </button>
                      )}
                      {c.status !== "revoked" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm(`Revoke ${c.fullName}'s invitation?`)) return;
                            revokeCoBorrower(c.id);
                            notify({
                              category: "Application",
                              title: `Invitation revoked`,
                              body: `${c.fullName} can no longer access this application.`,
                              tone: "info",
                            });
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-[11px] font-medium text-coral hover:bg-coral/5"
                        >
                          <XCircle className="h-3 w-3" /> Revoke
                        </button>
                      )}
                      {c.status === "revoked" && (
                        <button
                          type="button"
                          onClick={() => {
                            removeCoBorrower(c.id);
                            toast(`Removed ${c.fullName}`);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
            <p>
              Each co-applicant gives their own credit-pull and disclosure consent.
              You won't see their SIN, banking, or full credit report.
            </p>
          </div>
        </FormCard>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              You can return to consent once everyone has accepted their invitation.
            </p>
          </div>
          <Link
            to="/applications/$applicationId/product-review-consent"
            params={{ applicationId }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Review &amp; Consent
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function InviteForm({ applicationId }: { applicationId: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState<CoBorrowerRelationship>("spouse");
  const [role, setRole] = useState<CoBorrowerRole>("co-borrower");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const created = inviteCoBorrower({
      applicationId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      relationship,
      role,
    });
    notify({
      category: "Application",
      title: `Invitation sent to ${created.fullName}`,
      body: `${roleLabel(role)} · ${relationshipLabel(relationship)}`,
      tone: "success",
    });
    setFullName("");
    setEmail("");
    setPhone("");
    setRelationship("spouse");
    setRole("co-borrower");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full legal name" required>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jamie Scott"
            className={inputCls}
            required
          />
        </Field>
        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jamie@example.com"
            className={inputCls}
            required
          />
        </Field>
        <Field label="Mobile (optional)" hint="Used for SMS reminders.">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(416) 555-0148"
            className={inputCls}
          />
        </Field>
        <Field label="Relationship" required>
          <select
            value={relationship}
            onChange={(e) =>
              setRelationship(e.target.value as CoBorrowerRelationship)
            }
            className={inputCls}
          >
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {relationshipLabel(r)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-foreground">Role on application</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLES.map((opt) => {
            const sel = role === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                  sel
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <span className="block font-medium">{opt.label}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" /> Send invitation
        </button>
      </div>
    </form>
  );
}