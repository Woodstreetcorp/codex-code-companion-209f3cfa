import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, History, ShieldCheck, X } from "lucide-react";
import { SettingPane } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/consents")({
  head: () => ({
    meta: [
      { title: "Consent Center — approvU Settings" },
      { name: "description", content: "View and manage every consent you've granted: credit pull, e-sign, marketing, partner sharing, and open banking." },
    ],
  }),
  component: ConsentsPage,
});

type ConsentStatus = "Active" | "Withdrawn" | "Expired" | "Not granted";
type Consent = {
  id: string;
  name: string;
  category: "Credit" | "E-Signature" | "Marketing" | "Partner Sharing" | "Open Banking" | "Document Sharing";
  description: string;
  status: ConsentStatus;
  version: string;
  signedOn?: string;
  signedIp?: string;
  expires?: string;
  withdrawable: boolean;
  required?: boolean;
};

const SEED: Consent[] = [
  { id: "C-001", name: "Credit bureau pull (Equifax/TransUnion)", category: "Credit", description: "Authorizes a soft or hard credit pull to assess qualification.", status: "Active", version: "v2.0", signedOn: "Apr 02, 2026 · 9:41 AM", signedIp: "76.10.x.x · Toronto, ON", expires: "Oct 02, 2026", withdrawable: false, required: true },
  { id: "C-002", name: "Electronic signature & records", category: "E-Signature", description: "Allows you to sign mortgage documents electronically.", status: "Active", version: "v3.1", signedOn: "Jan 12, 2025 · 9:01 AM", signedIp: "76.10.x.x · Toronto, ON", withdrawable: true },
  { id: "C-003", name: "Marketing communications", category: "Marketing", description: "Receive product updates, rate alerts, and offers from approvU.", status: "Not granted", version: "v1.4", withdrawable: true },
  { id: "C-004", name: "Partner data sharing (Home Life Bundle)", category: "Partner Sharing", description: "Share necessary data with vetted partners for benefit fulfillment.", status: "Active", signedOn: "Apr 18, 2026 · 2:11 PM", signedIp: "76.10.x.x · Toronto, ON", version: "v1.2", withdrawable: true },
  { id: "C-005", name: "Open banking — income & banking data", category: "Open Banking", description: "Connects to your bank via Flinks/Plaid to auto-pull statements and verify income.", status: "Active", signedOn: "Apr 18, 2026 · 2:14 PM", signedIp: "76.10.x.x · Toronto, ON", version: "v2.0", expires: "Jul 18, 2026", withdrawable: true },
  { id: "C-006", name: "Document sharing with lenders", category: "Document Sharing", description: "Share submitted documents with lenders considering your application.", status: "Active", signedOn: "Apr 02, 2026 · 9:41 AM", signedIp: "76.10.x.x · Toronto, ON", version: "v1.5", withdrawable: false, required: true },
];

function ConsentsPage() {
  const [consents, setConsents] = useState<Consent[]>(SEED);
  const [history, setHistory] = useState<{ id: string; name: string; action: string; date: string }[]>([]);

  const update = (id: string, status: ConsentStatus, action: string) => {
    const c = consents.find((x) => x.id === id);
    setConsents((prev) => prev.map((x) => (x.id === id ? { ...x, status, signedOn: status === "Active" ? new Date().toLocaleString() : x.signedOn } : x)));
    if (c) setHistory((h) => [{ id, name: c.name, action, date: new Date().toLocaleString() }, ...h]);
    toast.success(`${c?.name}: ${action}`);
  };

  const grouped = (cat: Consent["category"]) => consents.filter((c) => c.category === cat);
  const cats = Array.from(new Set(consents.map((c) => c.category)));

  return (
    <div className="space-y-6">
      <SettingPane title="Consent center" desc="One place to view and revoke every authorization you've granted. Each consent is timestamped and IP-stamped for compliance.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Active consents" value={consents.filter((c) => c.status === "Active").length} tone="ok" icon={CheckCircle2} />
          <Stat label="Withdrawn" value={consents.filter((c) => c.status === "Withdrawn").length} tone="warn" icon={X} />
          <Stat label="Expiring < 90 days" value={1} tone="warn" icon={ShieldCheck} />
        </div>
      </SettingPane>

      {cats.map((cat) => (
        <SettingPane key={cat} title={cat} desc={`Authorizations in the ${cat} category.`}>
          <div className="grid gap-3 sm:grid-cols-2">
            {grouped(cat).map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-3 grid gap-1 text-[11px] text-muted-foreground">
                  <span>Version {c.version}</span>
                  {c.signedOn && <span>Granted {c.signedOn}</span>}
                  {c.signedIp && <span>From {c.signedIp}</span>}
                  {c.expires && <span>Expires {c.expires}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => toast.success(`Opening v${c.version} of "${c.name}"`)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted"
                  >
                    <FileText className="h-3.5 w-3.5" /> View signed copy
                  </button>
                  {c.status === "Active" && c.withdrawable && (
                    <button
                      onClick={() => update(c.id, "Withdrawn", "Withdrawn by borrower")}
                      className="rounded-md border border-destructive/40 bg-destructive/5 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      Withdraw consent
                    </button>
                  )}
                  {c.status === "Active" && !c.withdrawable && (
                    <span className="text-[11px] text-muted-foreground">Required to continue your application</span>
                  )}
                  {(c.status === "Withdrawn" || c.status === "Not granted") && (
                    <button
                      onClick={() => update(c.id, "Active", "Granted")}
                      className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Grant consent
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SettingPane>
      ))}

      <SettingPane title="Consent change history" desc="Audit trail of every consent change on your account.">
        {history.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            <History className="h-4 w-4" /> No recent changes — toggle a consent above to see it logged here.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-background">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="font-medium text-foreground">{h.name}</span>
                <span className="text-xs text-muted-foreground">{h.action} · {h.date}</span>
              </li>
            ))}
          </ul>
        )}
      </SettingPane>
    </div>
  );
}

function Stat({ label, value, tone, icon: Icon }: { label: string; value: number; tone: "ok" | "warn"; icon: typeof CheckCircle2 }) {
  const cls = tone === "ok" ? "bg-mint/15 text-mint" : "bg-amber-500/15 text-amber-600";
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${cls}`}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ConsentStatus }) {
  const map: Record<ConsentStatus, string> = {
    Active: "bg-mint/15 text-mint",
    Withdrawn: "bg-destructive/10 text-destructive",
    Expired: "bg-muted text-muted-foreground",
    "Not granted": "bg-amber-500/15 text-amber-600",
  };
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>{status}</span>;
}