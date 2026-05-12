import { useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileText,
  History,
  Info,
  Inbox,
  Lock,
  MessageCircle,
  Paperclip,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  UploadCloud,
  User,
  X,
} from "lucide-react";
// Upload UI is rendered as a full-page view (no modal/dialog)

// ─── Types ───────────────────────────────────────────────────────────────
type DocStatus =
  | "Requested"
  | "Uploaded"
  | "Under Review"
  | "Accepted"
  | "Needs Correction"
  | "Rejected"
  | "Overdue"
  | "Waived"
  | "Not Required";

type DocCategory =
  | "Identity"
  | "Income"
  | "Down Payment"
  | "Property"
  | "Credit"
  | "Other";

type AppliesTo =
  | { kind: "Borrower"; name: string }
  | { kind: "Application" }
  | { kind: "Subject Property" };

type DocRequest = {
  id: string;
  name: string;
  category: DocCategory;
  appliesTo: AppliesTo;
  required: boolean;
  requestedBy: "System" | "Lender" | "Broker";
  dueDate: string;
  status: DocStatus;
  description: string;
  comment?: string;
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
};

type Activity = {
  id: string;
  date: string;
  actor: string;
  documentName: string;
  event: string;
  comment?: string;
};

// ─── Mock data ───────────────────────────────────────────────────────────
const APPLICATION = {
  id: "APP-2041",
  type: "Purchase",
  status: "In Progress",
  property: "123 Maple Ave, Toronto, ON",
  advisor: "Priya Patel",
};

const INITIAL_DOCS: DocRequest[] = [
  {
    id: "d1",
    name: "Government-issued photo ID",
    category: "Identity",
    appliesTo: { kind: "Borrower", name: "David Scott" },
    required: true,
    requestedBy: "System",
    dueDate: "2026-05-12",
    status: "Accepted",
    description: "Driver's license or passport, both sides if applicable.",
    fileName: "david-id-front.pdf",
    uploadedAt: "2 days ago",
    uploadedBy: "David Scott",
  },
  {
    id: "d2",
    name: "Most recent paystub",
    category: "Income",
    appliesTo: { kind: "Borrower", name: "David Scott" },
    required: true,
    requestedBy: "Lender",
    dueDate: "2026-05-18",
    status: "Requested",
    description: "Upload your most recent paystub showing year-to-date income.",
  },
  {
    id: "d3",
    name: "90-day bank statements",
    category: "Down Payment",
    appliesTo: { kind: "Application" },
    required: true,
    requestedBy: "Lender",
    dueDate: "2026-05-20",
    status: "Under Review",
    description: "Full statements covering the last 90 days for accounts holding your down payment.",
    fileName: "bank-statements-90d.pdf",
    uploadedAt: "Yesterday",
    uploadedBy: "David Scott",
  },
  {
    id: "d4",
    name: "Gift letter",
    category: "Down Payment",
    appliesTo: { kind: "Application" },
    required: true,
    requestedBy: "Lender",
    dueDate: "2026-05-19",
    status: "Needs Correction",
    description: "Signed letter confirming the down payment gift, donor relationship, and amount.",
    comment: "Please include donor signature on the bottom of the letter.",
    fileName: "gift-letter.pdf",
    uploadedAt: "3 days ago",
    uploadedBy: "David Scott",
  },
  {
    id: "d5",
    name: "Property tax bill",
    category: "Property",
    appliesTo: { kind: "Subject Property" },
    required: true,
    requestedBy: "Lender",
    dueDate: "2026-05-22",
    status: "Requested",
    description: "Most recent annual property tax bill for the subject property.",
  },
  {
    id: "d6",
    name: "Employment letter",
    category: "Income",
    appliesTo: { kind: "Borrower", name: "David Scott" },
    required: true,
    requestedBy: "Lender",
    dueDate: "2026-05-25",
    status: "Requested",
    description: "Letter on company letterhead confirming role, salary, start date, and status.",
  },
  {
    id: "d7",
    name: "T4 — last 2 years",
    category: "Income",
    appliesTo: { kind: "Borrower", name: "David Scott" },
    required: false,
    requestedBy: "Lender",
    dueDate: "2026-05-30",
    status: "Requested",
    description: "Two most recent T4 slips for income confirmation.",
  },
  {
    id: "d8",
    name: "Purchase agreement",
    category: "Property",
    appliesTo: { kind: "Subject Property" },
    required: true,
    requestedBy: "Lender",
    dueDate: "2026-05-15",
    status: "Accepted",
    description: "Signed agreement of purchase and sale for the subject property.",
    fileName: "purchase-agreement.pdf",
    uploadedAt: "4 days ago",
    uploadedBy: "David Scott",
  },
];

const INITIAL_ACTIVITY: Activity[] = [
  {
    id: "ac1",
    date: "Today, 10:14 AM",
    actor: "approvU Review Team",
    documentName: "Gift letter",
    event: "Marked as Needs Correction",
    comment: "Please include donor signature on the bottom of the letter.",
  },
  {
    id: "ac2",
    date: "Yesterday, 4:42 PM",
    actor: "David Scott",
    documentName: "90-day bank statements",
    event: "Uploaded",
  },
  {
    id: "ac3",
    date: "2 days ago",
    actor: "approvU Review Team",
    documentName: "Government-issued photo ID",
    event: "Accepted",
  },
  {
    id: "ac4",
    date: "3 days ago",
    actor: "approvU System",
    documentName: "Property tax bill",
    event: "Requested",
  },
];

// ─── Main ────────────────────────────────────────────────────────────────
export function DocumentUploadContent({ unlocked = true }: { unlocked?: boolean }) {
  const [docs, setDocs] = useState<DocRequest[]>(INITIAL_DOCS);
  const [activity, setActivity] = useState<Activity[]>(INITIAL_ACTIVITY);
  const [uploadFor, setUploadFor] = useState<DocRequest | "supporting" | null>(null);

  const summary = useMemo(() => {
    const requested = docs.length;
    const uploaded = docs.filter((d) =>
      ["Uploaded", "Under Review", "Accepted", "Needs Correction"].includes(d.status),
    ).length;
    const accepted = docs.filter((d) => d.status === "Accepted").length;
    const needsCorrection = docs.filter((d) => d.status === "Needs Correction").length;
    const missing = docs.filter((d) => d.status === "Requested" || d.status === "Overdue").length;
    const dueSoon = docs.filter((d) => {
      if (d.status === "Accepted" || d.status === "Waived") return false;
      const due = new Date(d.dueDate).getTime();
      const now = Date.now();
      return due - now <= 1000 * 60 * 60 * 24 * 7;
    }).length;
    return { requested, uploaded, accepted, needsCorrection, missing, dueSoon };
  }, [docs]);

  if (!unlocked) {
    return <LockedDocumentsState />;
  }

  const requestedDocs = docs.filter(
    (d) => d.status === "Requested" || d.status === "Overdue",
  );
  const uploadedDocs = docs.filter((d) =>
    ["Uploaded", "Under Review", "Accepted"].includes(d.status),
  );
  const correctionDocs = docs.filter((d) => d.status === "Needs Correction");

  const handleUpload = (file: File, target: DocRequest | "supporting", note?: string) => {
    if (target === "supporting") {
      const newDoc: DocRequest = {
        id: `s-${Date.now()}`,
        name: file.name,
        category: "Other",
        appliesTo: { kind: "Application" },
        required: false,
        requestedBy: "System",
        dueDate: new Date().toISOString().slice(0, 10),
        status: "Under Review",
        description: note || "Supporting document uploaded by applicant.",
        fileName: file.name,
        uploadedAt: "just now",
        uploadedBy: "David Scott",
      };
      setDocs((prev) => [...prev, newDoc]);
    } else {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === target.id
            ? {
                ...d,
                status: "Under Review",
                fileName: file.name,
                uploadedAt: "just now",
                uploadedBy: "David Scott",
                comment: undefined,
              }
            : d,
        ),
      );
    }
    setActivity((prev) => [
      {
        id: `a-${Date.now()}`,
        date: "just now",
        actor: "David Scott",
        documentName: target === "supporting" ? file.name : target.name,
        event: "Uploaded",
      },
      ...prev,
    ]);
    toast.success("Document uploaded successfully", {
      description: "We'll review it shortly and update its status.",
    });
    setUploadFor(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                Mortgage Application Hub
              </p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Documents</h1>
              <p className="mt-2 max-w-2xl text-sm text-primary-foreground/80">
                Upload, review, and track documents requested for your mortgage application.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row">
              <button
                onClick={() => setUploadFor("supporting")}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ClipboardList className="h-4 w-4" /> View Conditions
              </button>
              <button
                onClick={() => setUploadFor("supporting")}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-foreground/90"
              >
                <Upload className="h-4 w-4" /> Upload Document
              </button>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Application ID" value={APPLICATION.id} />
            <Stat label="Transaction" value={APPLICATION.type} />
            <Stat label="Status" value={APPLICATION.status} />
            <Stat label="Advisor" value={APPLICATION.advisor} />
          </dl>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary-foreground/75">
            <Building2 className="h-3.5 w-3.5" /> {APPLICATION.property}
          </p>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard tone="muted" icon={Inbox} label="Requested" value={summary.requested} />
        <SummaryCard tone="secondary" icon={UploadCloud} label="Uploaded" value={summary.uploaded} />
        <SummaryCard tone="mint" icon={CheckCircle2} label="Accepted" value={summary.accepted} />
        <SummaryCard
          tone="coral"
          icon={AlertCircle}
          label="Needs Correction"
          value={summary.needsCorrection}
        />
        <SummaryCard tone="yellow" icon={Clock} label="Missing" value={summary.missing} />
        <SummaryCard tone="yellow" icon={Clock} label="Due Soon" value={summary.dueSoon} />
      </section>

      {/* Needs correction (priority) */}
      {correctionDocs.length > 0 && (
        <Section
          title="Needs Correction"
          subtitle="Resolve these to keep your application moving."
          tone="coral"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {correctionDocs.map((d) => (
              <CorrectionCard
                key={d.id}
                doc={d}
                onReplace={() => setUploadFor(d)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Required */}
      <Section
        title="Required Documents"
        subtitle="Documents requested for your application."
        count={requestedDocs.length}
      >
        {requestedDocs.length === 0 ? (
          <EmptyRow text="No outstanding required documents. Nice work." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {requestedDocs.map((d) => (
              <DocumentRequestCard key={d.id} doc={d} onUpload={() => setUploadFor(d)} />
            ))}
          </div>
        )}
      </Section>

      {/* Uploaded */}
      <Section
        title="Uploaded Documents"
        subtitle="Files you've shared with the review team."
        count={uploadedDocs.length}
      >
        {uploadedDocs.length === 0 ? (
          <EmptyRow text="No uploads yet." />
        ) : (
          <UploadedTable docs={uploadedDocs} onReplace={(d) => setUploadFor(d)} />
        )}
      </Section>

      {/* Supporting */}
      <Section
        title="Supporting Documents"
        subtitle="Upload additional documents that may help your application."
      >
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <Paperclip className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Have something else to share?</p>
                <p className="text-xs text-muted-foreground">
                  Letter of explanation, separation agreement, additional asset statements, etc.
                </p>
              </div>
            </div>
            <button
              onClick={() => setUploadFor("supporting")}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" /> Upload Supporting Document
            </button>
          </div>
        </div>
      </Section>

      {/* Activity timeline */}
      <Section title="Document Activity" subtitle="Recent changes to your documents.">
        <ActivityTimeline items={activity} />
      </Section>

      {/* Security notice */}
      <SecurityNotice />

      <UploadDocumentDrawer
        target={uploadFor}
        onClose={() => setUploadFor(null)}
        onUpload={handleUpload}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-primary-foreground">{value}</dd>
    </div>
  );
}

function SummaryCard({
  tone,
  icon: Icon,
  label,
  value,
}: {
  tone: "muted" | "secondary" | "mint" | "coral" | "yellow";
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  const cls: Record<typeof tone, string> = {
    muted: "bg-muted text-muted-foreground",
    secondary: "bg-secondary/15 text-secondary",
    mint: "bg-mint/20 text-mint",
    coral: "bg-coral/15 text-coral",
    yellow: "bg-yellow/30 text-yellow-foreground",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${cls[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-2xl font-semibold text-foreground">{value}</span>
      </div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  count,
  tone,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  tone?: "coral";
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            className={`text-sm font-semibold uppercase tracking-widest ${
              tone === "coral" ? "text-coral" : "text-muted-foreground"
            }`}
          >
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
            {count}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function statusBadge(status: DocStatus) {
  const map: Record<DocStatus, string> = {
    Requested: "bg-muted text-foreground",
    Uploaded: "bg-secondary/15 text-secondary",
    "Under Review": "bg-secondary/15 text-secondary",
    Accepted: "bg-mint/25 text-foreground",
    "Needs Correction": "bg-coral/15 text-coral",
    Rejected: "bg-coral/20 text-coral",
    Overdue: "bg-coral/15 text-coral",
    Waived: "bg-muted text-muted-foreground",
    "Not Required": "bg-muted text-muted-foreground",
  };
  return map[status];
}

function appliesToLabel(a: AppliesTo) {
  if (a.kind === "Borrower") return a.name;
  if (a.kind === "Application") return "Whole Application";
  return "Subject Property";
}

function appliesToIcon(a: AppliesTo) {
  if (a.kind === "Borrower") return User;
  if (a.kind === "Subject Property") return Building2;
  return FileText;
}

function dueLabel(due: string) {
  const d = new Date(due);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DocumentRequestCard({
  doc,
  onUpload,
}: {
  doc: DocRequest;
  onUpload: () => void;
}) {
  const Icon = appliesToIcon(doc.appliesTo);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{doc.name}</h3>
            <p className="text-[11px] font-medium uppercase tracking-widest text-secondary">
              {doc.category}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(doc.status)}`}>
          {doc.status}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{doc.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
          <Icon className="h-3 w-3" /> {appliesToLabel(doc.appliesTo)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
          <Clock className="h-3 w-3" /> Due {dueLabel(doc.dueDate)}
        </span>
        {doc.required ? (
          <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-semibold text-coral">
            Required
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Optional
          </span>
        )}
      </div>
      <div className="mt-auto pt-4">
        <button
          onClick={onUpload}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
      </div>
    </article>
  );
}

function CorrectionCard({ doc, onReplace }: { doc: DocRequest; onReplace: () => void }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-coral/40 bg-coral/5 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{doc.name}</h3>
          <p className="text-[11px] font-medium uppercase tracking-widest text-coral">
            Needs Correction
          </p>
        </div>
        <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-semibold text-coral">
          Action required
        </span>
      </div>
      {doc.comment && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-coral/20 bg-background/60 p-3">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
          <p className="text-xs text-foreground/80">{doc.comment}</p>
        </div>
      )}
      {doc.fileName && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Paperclip className="h-3 w-3" /> Current file: {doc.fileName}
        </p>
      )}
      <button
        onClick={onReplace}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-coral px-3 py-2 text-xs font-semibold text-white hover:bg-coral/90"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Replace Document
      </button>
    </article>
  );
}

function UploadedTable({
  docs,
  onReplace,
}: {
  docs: DocRequest[];
  onReplace: (d: DocRequest) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_auto] gap-3 border-b border-border px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:grid">
        <span>File</span>
        <span>Applies To</span>
        <span>Uploaded</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>
      <ul className="divide-y divide-border">
        {docs.map((d) => (
          <li
            key={d.id}
            className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1.6fr_1fr_1fr_1fr_auto] md:items-center md:gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{d.fileName ?? d.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{d.name}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground md:text-foreground">
              {appliesToLabel(d.appliesTo)}
            </div>
            <div className="text-xs text-muted-foreground">
              {d.uploadedAt} · {d.uploadedBy}
            </div>
            <div>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(d.status)}`}
              >
                {d.status}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <IconBtn label="View" icon={Eye} />
              <IconBtn label="Download" icon={Download} />
              {d.status !== "Accepted" && (
                <button
                  onClick={() => onReplace(d)}
                  className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted"
                >
                  <RefreshCw className="h-3 w-3" /> Replace
                </button>
              )}
              {d.status === "Uploaded" && (
                <IconBtn label="Delete" icon={Trash2} tone="coral" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconBtn({
  icon: Icon,
  label,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone?: "coral";
}) {
  return (
    <button
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-muted ${
        tone === "coral" ? "text-coral hover:bg-coral/10" : ""
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ActivityTimeline({ items }: { items: Activity[] }) {
  return (
    <ol className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute left-3.5 top-7 bottom-0 w-px bg-border" />
          )}
          <span className="relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <History className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{it.event}</span>{" "}
              <span className="text-muted-foreground">·</span>{" "}
              <span className="text-muted-foreground">{it.documentName}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {it.actor} · {it.date}
            </p>
            {it.comment && (
              <p className="mt-1 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-foreground/80">
                {it.comment}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function SecurityNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
      <div>
        <p className="text-sm font-semibold text-foreground">Your documents are protected</p>
        <p className="mt-1 text-xs text-foreground/80">
          Documents are uploaded securely and used only to process your mortgage application. Only
          authorized approvU team members, lenders, and partners involved in your application can
          access them when required.
        </p>
      </div>
    </div>
  );
}

export function LockedDocumentsState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Lock className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Document upload is locked</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Document upload unlocks after your application is submitted or when documents are requested.
      </p>
      <button className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Continue Application <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Upload Drawer ───────────────────────────────────────────────────────
const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx";
const MAX_BYTES = 25 * 1024 * 1024;

function UploadDocumentDrawer({
  target,
  onClose,
  onUpload,
}: {
  target: DocRequest | "supporting" | null;
  onClose: () => void;
  onUpload: (file: File, target: DocRequest | "supporting", note?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [drag, setDrag] = useState(false);
  const [supName, setSupName] = useState("");
  const [supCategory, setSupCategory] = useState<DocCategory>("Other");

  const isSupporting = target === "supporting";
  const open = target !== null;

  const reset = () => {
    setFile(null);
    setNote("");
    setConfirmed(false);
    setSupName("");
    setSupCategory("Other");
  };

  const close = (o: boolean) => {
    if (!o) {
      reset();
      onClose();
    }
  };

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("File is too large", { description: "Maximum file size is 25MB." });
      return;
    }
    const ok = /\.(pdf|jpe?g|png|docx?|xlsx?)$/i.test(f.name);
    if (!ok) {
      toast.error("Unsupported file type", {
        description: "Use PDF, JPG, PNG, DOC, DOCX, XLS, or XLSX.",
      });
      return;
    }
    setFile(f);
  };

  const canSubmit =
    !!file && confirmed && (isSupporting ? supName.trim().length > 0 : true);

  const submit = () => {
    if (!file || !target) return;
    onUpload(file, target, isSupporting ? `${supCategory}: ${supName} — ${note}`.trim() : note);
    reset();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-background px-6 py-4 sm:px-10">
        <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-primary sm:text-xl">Upload Document</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isSupporting
                ? "Add a supporting document to your application."
                : target && typeof target !== "string"
                  ? `Upload "${target.name}" for ${appliesToLabel(target.appliesTo)}.`
                  : ""}
            </p>
          </div>
          <button
            onClick={() => close(false)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
        <div className="mx-auto w-full max-w-4xl space-y-4">

        {target && typeof target !== "string" && (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
            <Row label="Document" value={target.name} />
            <Row label="Applies to" value={appliesToLabel(target.appliesTo)} />
            <Row label="Category" value={target.category} />
            <Row label="Due" value={dueLabel(target.dueDate)} />
          </div>
        )}

        {isSupporting && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Document name">
              <input
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                placeholder="e.g. Letter of explanation"
                className={inputCls}
              />
            </Field>
            <Field label="Category">
              <select
                value={supCategory}
                onChange={(e) => setSupCategory(e.target.value as DocCategory)}
                className={inputCls}
              >
                {(["Identity", "Income", "Down Payment", "Property", "Credit", "Other"] as DocCategory[]).map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            drag ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <UploadCloud className="h-5 w-5" />
          </span>
          {file ? (
            <>
              <p className="mt-3 text-sm font-semibold text-foreground">{file.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-coral hover:underline"
              >
                <X className="h-3 w-3" /> Remove file
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-semibold text-foreground">
                Drag and drop your file here
              </p>
              <p className="text-[11px] text-muted-foreground">
                or click to browse — PDF, JPG, PNG, DOC, XLS · max 25MB
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Field label="Note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Add context for the review team…"
            className={inputCls}
          />
        </Field>

        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-foreground/80">
            I confirm this document belongs to{" "}
            <span className="font-semibold text-foreground">
              {target && typeof target !== "string" ? appliesToLabel(target.appliesTo) : "this application"}
            </span>{" "}
            and that I'm authorized to upload it.
          </span>
        </label>

        <div className="mt-2 flex items-start gap-2 rounded-xl border border-secondary/30 bg-secondary/5 p-3 text-[11px] text-foreground/80">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
          Each applicant must provide their own consent. You cannot complete consent or sign on
          behalf of another adult applicant.
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            onClick={() => close(false)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}