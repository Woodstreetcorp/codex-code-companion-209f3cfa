import { createFileRoute, Link } from "@tanstack/react-router";
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
  Building2,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/portal/ui";
import {
  APPLICATION_BUNDLES,
  PROFILE_RECORDS,
  PROFILE_TEMPLATES,
  isComplete,
  statusTone,
  templateById,
  type ConsentStatus,
} from "@/lib/disclosures";

export const Route = createFileRoute("/portal/disclosures")({
  head: () => ({
    meta: [
      { title: "Disclosures — approvU" },
      { name: "description", content: "Privacy policy, broker disclosure, conflict of interest, and FCAC cost-of-borrowing — versioned and timestamped." },
    ],
  }),
  component: DisclosuresPage,
});

type Row = {
  scope: "profile" | "application";
  templateId: string;
  title: string;
  category: string;
  jurisdiction: string;
  version: string;
  effective: string;
  status: ConsentStatus;
  reviewedAt?: string;
  reviewedIp?: string;
  whyRequired?: string;
  application?: {
    id: string;
    property: string;
    transactionType: string;
  };
};

function buildRows(): Row[] {
  const profileRows: Row[] = PROFILE_TEMPLATES.map((t) => {
    const rec = PROFILE_RECORDS.find((r) => r.templateId === t.id);
    return {
      scope: "profile",
      templateId: t.id,
      title: t.title,
      category: t.category,
      jurisdiction: t.jurisdiction,
      version: t.version,
      effective: t.effective,
      status: rec?.status ?? "Not Started",
      reviewedAt: rec?.reviewedAt ?? rec?.signedAt,
      reviewedIp: rec?.ip,
      whyRequired: t.whyRequired,
    };
  });

  const appRows: Row[] = [];
  for (const bundle of APPLICATION_BUNDLES) {
    for (const d of bundle.disclosures) {
      const tpl = templateById(d.templateId);
      if (!tpl) continue;
      const primary = d.applicantConsents.find((c) => c.role === "primary");
      appRows.push({
        scope: "application",
        templateId: tpl.id,
        title: tpl.title,
        category: tpl.category,
        jurisdiction: tpl.jurisdiction,
        version: tpl.version,
        effective: tpl.effective,
        status: d.status,
        reviewedAt: primary?.signedAt,
        reviewedIp: primary?.signedIp,
        whyRequired: tpl.whyRequired,
        application: {
          id: bundle.applicationId,
          property: bundle.property,
          transactionType: bundle.transactionType,
        },
      });
    }
  }
  return [...profileRows, ...appRows];
}

type TabKey = "all" | "profile" | "application" | "action" | "history";

function DisclosuresPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [openSuit, setOpenSuit] = useState(false);

  const allRows = buildRows();
  const items = allRows.filter((d) => {
    if (q && !`${d.title} ${d.category} ${d.jurisdiction} ${d.application?.id ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (tab === "profile") return d.scope === "profile";
    if (tab === "application") return d.scope === "application";
    if (tab === "action") return d.status === "Action Required" || d.status === "Not Started" || d.status === "Expired";
    if (tab === "history") return !!d.reviewedAt;
    return true;
  });

  const actionCount = allRows.filter((d) => d.status === "Action Required" || d.status === "Not Started" || d.status === "Expired").length;
  const profileCount = allRows.filter((d) => d.scope === "profile").length;
  const appCount = allRows.filter((d) => d.scope === "application").length;

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="Disclosures Library"
        description="Profile-level policies and application-specific disclosures, all versioned and timestamped."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="Profile-level" value={`${profileCount}`} icon={ShieldCheck} />
        <StatCard label="Application-level" value={`${appCount}`} icon={Building2} />
        <StatCard label="Action required" value={`${actionCount}`} icon={AlertCircle} tone={actionCount > 0 ? "warn" : "ok"} />
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
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1 text-xs">
            {([
              ["all", "All"],
              ["profile", "Profile-Level"],
              ["application", "Application-Level"],
              ["action", `Action Required (${actionCount})`],
              ["history", "Review History"],
            ] as const).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 font-medium ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {items.map((d) => (
            <div key={`${d.scope}-${d.templateId}-${d.application?.id ?? ""}`} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{d.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(d.status)}`}>
                      {d.status}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${d.scope === "profile" ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary"}`}>
                      {d.scope === "profile" ? "Profile" : "Application"}
                    </span>
                  </div>
                  {d.whyRequired && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{d.whyRequired}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span><span className="font-medium text-foreground">{d.category}</span> · {d.jurisdiction}</span>
                    <span>Version {d.version} · Effective {d.effective}</span>
                    {d.reviewedAt && <span>Reviewed {d.reviewedAt}{d.reviewedIp ? ` · ${d.reviewedIp}` : ""}</span>}
                    {d.application && (
                      <span>
                        Application <span className="font-medium text-foreground">{d.application.id}</span> · {d.application.transactionType} · {d.application.property}
                      </span>
                    )}
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
                {d.application ? (
                  <Link
                    to="/portal/applications/$applicationId/disclosures"
                    params={{ applicationId: d.application.id }}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Open application <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : null}
                {d.templateId === "TPL-SUIT-1" ? (
                  <button
                    onClick={() => setOpenSuit(true)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Start questionnaire
                  </button>
                ) : !isComplete(d.status) ? (
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