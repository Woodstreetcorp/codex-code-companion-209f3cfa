import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Download, FileJson, FileText, ShieldCheck, Trash2 } from "lucide-react";
import { SettingPane, ToggleRow } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — approvU Settings" },
      { name: "description", content: "Manage consents, data sharing, and your privacy preferences." },
    ],
  }),
  component: PrivacyPage,
});

type ConsentStatus = "Active" | "Not signed" | "Expired" | "Revoked";

const CONSENTS: { name: string; status: ConsentStatus; signed?: string; expires?: string; revocable: boolean; required?: boolean }[] = [
  { name: "Privacy policy consent", status: "Active", signed: "Jan 12, 2025", revocable: false, required: true },
  { name: "Electronic communication consent", status: "Active", signed: "Jan 12, 2025", revocable: true },
  { name: "Credit check consent", status: "Active", signed: "Apr 02, 2026", expires: "Oct 02, 2026", revocable: false, required: true },
  { name: "Document sharing consent", status: "Active", signed: "Apr 02, 2026", revocable: true },
  { name: "Marketing consent", status: "Not signed", revocable: true },
  { name: "Admin-assisted completion authorization", status: "Active", signed: "Apr 02, 2026", revocable: true },
];

function PrivacyPage() {
  const [share, setShare] = useState({
    lenders: true, lenderDocs: true, solicitor: true, bundle: false,
  });
  const [comm, setComm] = useState({ email: true, sms: true, phone: false, inApp: true });
  const t = <T,>(setter: (fn: (p: T) => T) => void, k: keyof T) => (v: boolean) => setter((p) => ({ ...p, [k]: v }));
  const [exportFormat, setExportFormat] = useState<"json" | "pdf">("json");
  const [exportRequested, setExportRequested] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-secondary/10 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Privacy overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage how your information is used for mortgage applications, document review, communication, and homeownership benefits.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="ok">Privacy consent signed</Pill>
            <Pill tone="muted">Updated Jan 12, 2025</Pill>
            <Pill tone="ok">Data sharing on</Pill>
          </div>
        </div>
      </section>

      <SettingPane title="Consents" desc="Documents you've signed and authorizations on your account.">
        <div className="grid gap-3 sm:grid-cols-2">
          {CONSENTS.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.signed ? `Signed ${c.signed}` : "Not signed yet"}
                    {c.expires ? ` · Expires ${c.expires}` : ""}
                  </p>
                </div>
                <ConsentBadge status={c.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <button className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  <FileText className="h-3.5 w-3.5" /> View details
                </button>
                {c.status === "Not signed" ? (
                  <button
                    onClick={() => toast.success(`${c.name} signed`)}
                    className="font-medium text-primary hover:underline"
                  >
                    Provide consent
                  </button>
                ) : c.revocable ? (
                  <button
                    onClick={() => toast.success(`${c.name} revoked`)}
                    className="font-medium text-destructive hover:underline"
                  >
                    Revoke
                  </button>
                ) : (
                  <span className="text-muted-foreground">Required to continue</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingPane>

      <SettingPane title="Data sharing" desc="Some sharing permissions are required to complete your mortgage application." onSave={() => toast.success("Data sharing preferences saved")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="Share application data with selected lenders" desc="Required to receive offers" checked={share.lenders} onChange={t(setShare, "lenders")} />
          <ToggleRow title="Share documents with lender / underwriting" desc="Required to fund your mortgage" checked={share.lenderDocs} onChange={t(setShare, "lenderDocs")} />
          <ToggleRow title="Share required info with solicitor / appraiser" desc="Used at closing or appraisal" checked={share.solicitor} onChange={t(setShare, "solicitor")} />
          <ToggleRow title="Share Home Life Bundle redemption data" desc="With fulfillment partners only" checked={share.bundle} onChange={t(setShare, "bundle")} />
        </div>
      </SettingPane>

      <SettingPane title="Communication consent" desc="Channels you've authorized for outreach." onSave={() => toast.success("Communication consent saved")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="Email communication" desc="Account, application, and service emails" checked={comm.email} onChange={t(setComm, "email")} />
          <ToggleRow title="SMS communication" desc="Time-sensitive updates by text" checked={comm.sms} onChange={t(setComm, "sms")} />
          <ToggleRow title="Phone communication" desc="Calls from your team" checked={comm.phone} onChange={t(setComm, "phone")} />
          <ToggleRow title="In-app communication" desc="Messages inside your portal" checked={comm.inApp} onChange={t(setComm, "inApp")} />
        </div>
      </SettingPane>

      <SettingPane title="Your data rights" desc="Download a copy of your data, request a correction, or close your account.">
        <p className="mb-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          Under <span className="font-medium text-foreground">PIPEDA</span>, <span className="font-medium text-foreground">Quebec Law 25</span>, and equivalent regulations you have the right to access, correct, and request deletion of your personal data.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Data export */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Export my data</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">A complete copy of everything we hold: profile, applications, documents, consents, and audit log.</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setExportFormat("json")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${exportFormat === "json" ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
              >
                <FileJson className="h-3.5 w-3.5" /> JSON
              </button>
              <button
                onClick={() => setExportFormat("pdf")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${exportFormat === "pdf" ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
              >
                <FileText className="h-3.5 w-3.5" /> PDF
              </button>
            </div>
            <button
              onClick={() => { setExportRequested(true); toast.success(`Export queued — we'll email a secure ${exportFormat.toUpperCase()} link within 24h.`); }}
              className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Request {exportFormat.toUpperCase()} export
            </button>
            {exportRequested && (
              <p className="mt-2 flex items-center gap-1 text-xs text-mint">
                <CheckCircle2 className="h-3 w-3" /> Export queued. ETA &lt; 24h.
              </p>
            )}
          </div>

          {/* Right to be forgotten */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Delete my account & data</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Closes your account and removes personal data. We may retain certain records (e.g. funded mortgage files) for the period required by law.
            </p>
            <button
              onClick={() => setDeleteOpen(true)}
              className="mt-3 w-full rounded-md border border-destructive/40 bg-card px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              Start deletion request
            </button>
          </div>

          <DataRightCard title="Request a correction" desc="Fix inaccurate or outdated information." onClick={() => toast.success("Correction request submitted to your privacy officer.")} />
          <Link
            to="/portal/settings/consents"
            className="rounded-xl border border-border bg-background p-4 transition hover:bg-muted"
          >
            <p className="text-sm font-medium text-foreground">Manage all consents</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Withdraw or grant credit pull, marketing, partner sharing, and open banking consents.</p>
          </Link>
        </div>
      </SettingPane>

      {deleteOpen && <DeleteAccountModal onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone: "ok" | "muted" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${tone === "ok" ? "bg-mint/15 text-mint" : "bg-muted text-muted-foreground"}`}>
      {tone === "ok" && <CheckCircle2 className="h-3 w-3" />}
      {children}
    </span>
  );
}

function ConsentBadge({ status }: { status: ConsentStatus }) {
  const map: Record<ConsentStatus, string> = {
    Active: "bg-mint/15 text-mint",
    "Not signed": "bg-amber-500/15 text-amber-600",
    Expired: "bg-muted text-muted-foreground",
    Revoked: "bg-destructive/10 text-destructive",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>{status}</span>;
}

function DataRightCard({
  title, desc, onClick, destructive,
}: { title: string; desc: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${destructive ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10" : "border-border bg-background hover:bg-muted"}`}
    >
      <p className={`text-sm font-medium ${destructive ? "text-destructive" : "text-foreground"}`}>{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-foreground">Delete account & data</h3>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
        <div className="p-6">
          {step === 1 && (
            <>
              <h4 className="text-sm font-semibold text-foreground">Before you continue</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Active applications will be cancelled.</li>
                <li>• Home Life Bundle benefits will be forfeited.</li>
                <li>• Funded mortgage records may be retained as required by law (typically 7 years).</li>
                <li>• You'll receive an email confirmation with the deletion timeline.</li>
              </ul>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={onClose} className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">Cancel</button>
                <button onClick={() => setStep(2)} className="rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">Continue</button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h4 className="text-sm font-semibold text-foreground">Help us improve (optional)</h4>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a reason…</option>
                <option>I no longer need a mortgage</option>
                <option>I'm using another platform</option>
                <option>Privacy concerns</option>
                <option>Too many notifications</option>
                <option>Other</option>
              </select>
              <div className="mt-5 flex justify-between">
                <button onClick={() => setStep(1)} className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">Back</button>
                <button onClick={() => setStep(3)} className="rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">Continue</button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h4 className="text-sm font-semibold text-foreground">Type DELETE to confirm</h4>
              <p className="mt-1 text-xs text-muted-foreground">This will start a 30-day deletion request. You can cancel any time before then.</p>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="DELETE"
                className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              />
              <div className="mt-5 flex justify-between">
                <button onClick={() => setStep(2)} className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">Back</button>
                <button
                  disabled={confirm !== "DELETE"}
                  onClick={() => { toast.success("Deletion request submitted. You'll receive a confirmation email shortly."); onClose(); }}
                  className="rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
                >
                  Confirm deletion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}