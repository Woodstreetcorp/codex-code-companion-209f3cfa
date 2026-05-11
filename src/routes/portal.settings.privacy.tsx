import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
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
        <div className="grid gap-3 sm:grid-cols-3">
          <DataRightCard title="Download my data" desc="Get a portable copy" onClick={() => toast.success("Preparing your data export")} />
          <DataRightCard title="Request correction" desc="Fix inaccurate information" onClick={() => toast.success("Correction request submitted")} />
          <DataRightCard title="Request account closure" desc="Permanently close access" onClick={() => toast.success("Account closure request started")} destructive />
        </div>
      </SettingPane>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "ok" | "muted" }) {
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