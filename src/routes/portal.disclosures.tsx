import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  FileText,
  History,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/disclosures")({
  head: () => ({
    meta: [
      { title: "Disclosures — approvU" },
      { name: "description", content: "Privacy policy, broker disclosure, conflict of interest, and FCAC cost-of-borrowing — versioned and timestamped." },
    ],
  }),
  component: DisclosuresPage,
});

type DiscStatus = "Reviewed" | "Action Required" | "New Version" | "Not Applicable";

type Disclosure = {
  id: string;
  title: string;
  jurisdiction: string;
  category: "Privacy" | "Brokerage" | "Cost of Borrowing" | "Conflicts" | "Suitability" | "Regulatory";
  version: string;
  effective: string;
  reviewedOn?: string;
  reviewedIp?: string;
  status: DiscStatus;
  summary: string;
};

const DISCLOSURES: Disclosure[] = [
  {
    id: "DSC-001",
    title: "approvU Privacy Policy",
    jurisdiction: "Canada (PIPEDA / Quebec Law 25)",
    category: "Privacy",
    version: "v3.2",
    effective: "Jan 15, 2026",
    reviewedOn: "Jan 18, 2026 · 9:14 AM",
    reviewedIp: "76.10.x.x · Toronto, ON",
    status: "Reviewed",
    summary: "How we collect, use, store and share your personal information.",
  },
  {
    id: "DSC-002",
    title: "Form 1.1 — Mortgage Brokerage Disclosure (Ontario)",
    jurisdiction: "Ontario · FSRA",
    category: "Brokerage",
    version: "v2024.1",
    effective: "Jul 1, 2024",
    reviewedOn: "Apr 2, 2026 · 4:32 PM",
    reviewedIp: "76.10.x.x · Toronto, ON",
    status: "Reviewed",
    summary: "Brokerage relationship, services, compensation and lender list.",
  },
  {
    id: "DSC-003",
    title: "Conflict of Interest Disclosure",
    jurisdiction: "All provinces",
    category: "Conflicts",
    version: "v1.4",
    effective: "Mar 10, 2026",
    status: "Action Required",
    summary: "Lender referral fees, volume bonuses, and any potential conflicts.",
  },
  {
    id: "DSC-004",
    title: "Cost of Borrowing Disclosure (FCAC)",
    jurisdiction: "Federally regulated",
    category: "Cost of Borrowing",
    version: "v2026.1",
    effective: "Feb 1, 2026",
    reviewedOn: "Apr 28, 2026 · 11:02 AM",
    reviewedIp: "76.10.x.x · Toronto, ON",
    status: "Reviewed",
    summary: "APR, total cost of credit, prepayment terms, and key disclosures.",
  },
  {
    id: "DSC-005",
    title: "Suitability Questionnaire (FSRA)",
    jurisdiction: "Ontario · FSRA",
    category: "Suitability",
    version: "v1.0",
    effective: "Apr 1, 2026",
    status: "Action Required",
    summary: "Required intake to confirm a recommended mortgage is suitable for you.",
  },
  {
    id: "DSC-006",
    title: "Electronic Signatures & Records Consent",
    jurisdiction: "PIPEDA · Provincial e-signature acts",
    category: "Regulatory",
    version: "v2.1",
    effective: "Jan 12, 2025",
    reviewedOn: "Jan 12, 2025 · 9:01 AM",
    reviewedIp: "76.10.x.x · Toronto, ON",
    status: "Reviewed",
    summary: "You agree to transact and receive records electronically.",
  },
];

function DisclosuresPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "action" | "history">("all");
  const [openSuit, setOpenSuit] = useState(false);

  const items = DISCLOSURES.filter((d) => {
    if (q && !`${d.title} ${d.category} ${d.jurisdiction}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (tab === "action") return d.status === "Action Required" || d.status === "New Version";
    if (tab === "history") return !!d.reviewedOn;
    return true;
  });

  const actionCount = DISCLOSURES.filter((d) => d.status === "Action Required" || d.status === "New Version").length;

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="Disclosures Library"
        description="Versioned disclosures, regulatory documents, and your review history."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="Disclosures on file" value={`${DISCLOSURES.length}`} icon={ScrollIcon} />
        <StatCard label="Action required" value={`${actionCount}`} icon={AlertCircle} tone={actionCount > 0 ? "warn" : "ok"} />
        <StatCard label="Reviewed by you" value={`${DISCLOSURES.filter((d) => d.reviewedOn).length}`} icon={CheckCircle2} tone="ok" />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search disclosures…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 text-xs">
            {(["all", "action", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 font-medium ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "all" ? "All" : t === "action" ? `Action (${actionCount})` : "Review History"}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {items.map((d) => (
            <div key={d.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{d.title}</p>
                    <StatusPill status={d.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{d.summary}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span><span className="font-medium text-foreground">{d.category}</span> · {d.jurisdiction}</span>
                    <span>Version {d.version} · Effective {d.effective}</span>
                    {d.reviewedOn && <span>You reviewed {d.reviewedOn}{d.reviewedIp ? ` · ${d.reviewedIp}` : ""}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success(`Downloading ${d.title}`)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>
                {d.id === "DSC-005" ? (
                  <button
                    onClick={() => setOpenSuit(true)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Start questionnaire
                  </button>
                ) : d.status === "Action Required" || d.status === "New Version" ? (
                  <button
                    onClick={() => toast.success(`${d.title} marked as reviewed`)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Review & acknowledge
                  </button>
                ) : (
                  <button
                    onClick={() => toast.success(`Opening ${d.title}`)}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">No disclosures match your search.</p>
          )}
        </div>
      </div>

      {openSuit && <SuitabilityModal onClose={() => setOpenSuit(false)} />}
    </>
  );
}

function StatCard({ label, value, icon: Icon, tone = "neutral" }: { label: string; value: string; icon: typeof FileText; tone?: "ok" | "warn" | "neutral" }) {
  const toneClass = tone === "ok" ? "bg-mint/15 text-mint" : tone === "warn" ? "bg-amber-500/15 text-amber-600" : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ScrollIcon(props: React.ComponentProps<typeof ShieldCheck>) {
  return <ShieldCheck {...props} />;
}

function StatusPill({ status }: { status: DiscStatus }) {
  const map: Record<DiscStatus, string> = {
    Reviewed: "bg-mint/15 text-mint",
    "Action Required": "bg-amber-500/15 text-amber-600",
    "New Version": "bg-primary/10 text-primary",
    "Not Applicable": "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>{status}</span>;
}

function SuitabilityModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const questions = [
    { id: "horizon", label: "How long do you plan to keep this property?", options: ["< 3 years", "3–5 years", "5–10 years", "10+ years"] },
    { id: "rate", label: "Rate preference", options: ["Lower payment now (variable)", "Predictable payment (fixed)", "Open to either"] },
    { id: "risk", label: "How would a 2% rate increase affect you?", options: ["Major hardship", "Manageable", "Comfortable"] },
    { id: "prepay", label: "Likelihood of making lump-sum prepayments?", options: ["Unlikely", "Possible", "Definitely"] },
    { id: "income", label: "Is your income stable for the next 5 years?", options: ["Yes", "Mostly", "Variable"] },
  ];
  const q = questions[step];
  const done = step === questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Suitability Questionnaire</h3>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
        </div>
        <div className="p-6">
          {!done ? (
            <>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${(step / questions.length) * 100}%` }} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Question {step + 1} of {questions.length}</p>
              <p className="mt-1 text-base font-semibold text-foreground">{q.label}</p>
              <div className="mt-4 grid gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setAnswers({ ...answers, [q.id]: opt }); setStep(step + 1); }}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${answers[q.id] === opt ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint/15 text-mint">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="mt-3 font-semibold text-foreground">Thanks — your suitability profile has been saved.</h4>
              <p className="mt-1 text-sm text-muted-foreground">Your broker will use this when recommending products.</p>
              <button
                onClick={() => { toast.success("Suitability questionnaire submitted"); onClose(); }}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

void History;