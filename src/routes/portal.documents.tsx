import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { notify } from "@/components/portal/activity";
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Banknote,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText,
  Folder,
  HelpCircle,
  History,
  Info,
  Inbox,
  Landmark,
  Link as LinkIcon,
  Loader2,
  Lock,
  PenLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  UserCheck,
  Building2,
  ListChecks,
  X,
  Zap,
} from "lucide-react";
import {
  listBorrowerDocuments,
  uploadBorrowerDocument,
  type BorrowerDocument,
} from "@/lib/api/borrowerDocumentApi";
import {
  ACTIVE,
  SUBMITTED,
  COMPLETED,
  VAULT_DOCUMENTS,
  type VaultDoc,
} from "@/components/portal/data";
import { Card, PageHeader, StatusPill, SummaryCard } from "@/components/portal/ui";
import { BankConnectDialog, type BankConnectResult } from "@/components/portal/bank-connect-dialog";

export const Route = createFileRoute("/portal/documents")({
  head: () => ({
    meta: [
      { title: "Document Vault — approvU" },
      {
        name: "description",
        content:
          "Your secure Document Vault: personal documents, lender requests, e-signatures, bank connections, expiry tracking, and full sharing history.",
      },
    ],
  }),
  component: DocumentVaultPage,
});

// ─── Mock data specific to this hub ─────────────────────────────
type RequestStatus = "Outstanding" | "Uploaded" | "Under Review" | "Approved" | "Rejected";
type RequestSource = "lender" | "advisor" | "compliance";
type LenderRequest = {
  id: string;
  app: string;
  docType: string;
  description: string;
  sample: string;
  dueIn: number; // days; negative = overdue
  status: RequestStatus;
  required: boolean;
  source: RequestSource;
  requestedBy: string;
  requestedAt: string;
  conditionId?: string;
  conditionTitle?: string;
};

const LENDER_REQUESTS: LenderRequest[] = [
  {
    id: "REQ-9001",
    app: "APP-2041",
    docType: "Notice of Assessment (2024)",
    description: "Most recent CRA NOA showing total income line 15000.",
    sample:
      "Look for the CRA letterhead, your SIN (last 3 digits), tax year, and 'Total income' on page 1.",
    dueIn: 2,
    status: "Outstanding",
    required: true,
    source: "advisor",
    requestedBy: "Sarah Chen — Mortgage Broker",
    requestedAt: "May 9, 2026",
    conditionId: "C-101",
    conditionTitle: "Confirm employment letter & income docs",
  },
  {
    id: "REQ-9002",
    app: "APP-2041",
    docType: "Pay stub — most recent",
    description: "Most recent pay stub within 30 days, showing YTD earnings.",
    sample: "Must include employer name, pay period, gross pay, YTD totals, and your full name.",
    dueIn: 5,
    status: "Outstanding",
    required: true,
    source: "advisor",
    requestedBy: "Sarah Chen — Mortgage Broker",
    requestedAt: "May 9, 2026",
    conditionId: "C-102",
    conditionTitle: "Most recent 2 pay stubs",
  },
  {
    id: "REQ-9003",
    app: "APP-2041",
    docType: "Bank statement — 90 days down payment",
    description: "Last 90 days of statements for the account holding your down payment.",
    sample: "Include all pages, account holder name, account #, and a clear running balance.",
    dueIn: -1,
    status: "Outstanding",
    required: true,
    source: "lender",
    requestedBy: "Equitable Bank — Underwriting",
    requestedAt: "May 8, 2026",
    conditionId: "C-103",
    conditionTitle: "Void cheque or PAD form",
  },
  {
    id: "REQ-9004",
    app: "APP-2041",
    docType: "Letter of Employment",
    description: "Signed letter on company letterhead with role, salary, start date.",
    sample: "Must be dated within 30 days and signed by HR / supervisor.",
    dueIn: 7,
    status: "Under Review",
    required: true,
    source: "lender",
    requestedBy: "Equitable Bank — Underwriting",
    requestedAt: "May 8, 2026",
    conditionId: "C-101",
    conditionTitle: "Confirm employment letter & income docs",
  },
  {
    id: "REQ-9005",
    app: "APP-1801",
    docType: "Property Insurance Binder",
    description: "Proof of home insurance for closing.",
    sample: "Must show effective date on or before closing, lender as loss payee.",
    dueIn: 12,
    status: "Approved",
    required: true,
    source: "lender",
    requestedBy: "Scotiabank — Underwriting",
    requestedAt: "Apr 18, 2026",
    conditionId: "C-105",
    conditionTitle: "Property insurance binder",
  },
];

type Envelope = {
  id: string;
  app: string;
  title: string;
  sender: string;
  provider: "DocuSign" | "OneSpan";
  status: "Action Required" | "Awaiting Counterparty" | "Signed" | "Voided";
  receivedAt: string;
  dueAt: string;
  pages: number;
};

const ENVELOPES: Envelope[] = [
  {
    id: "ENV-7701",
    app: "APP-2041",
    title: "Mortgage Application & Privacy Consent",
    sender: "approvU Brokerage",
    provider: "DocuSign",
    status: "Action Required",
    receivedAt: "May 10, 2026",
    dueAt: "May 14, 2026",
    pages: 6,
  },
  {
    id: "ENV-7702",
    app: "APP-2041",
    title: "FCAC Cost-of-Borrowing Disclosure",
    sender: "Lender — Equitable Bank",
    provider: "OneSpan",
    status: "Action Required",
    receivedAt: "May 11, 2026",
    dueAt: "May 16, 2026",
    pages: 4,
  },
  {
    id: "ENV-7703",
    app: "APP-1801",
    title: "Mortgage Commitment Letter",
    sender: "Lender — Scotiabank",
    provider: "DocuSign",
    status: "Signed",
    receivedAt: "Apr 22, 2026",
    dueAt: "Apr 25, 2026",
    pages: 12,
  },
];

type Connection = {
  id: string;
  provider: "Flinks" | "Plaid" | "Inverite";
  label: string;
  description: string;
  category: "Banking" | "Payroll";
  status: "Connected" | "Not Connected" | "Reconnect";
  lastSync?: string;
  institutions?: number;
};

const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: "CONN-FLN",
    provider: "Flinks",
    label: "Bank statements (Flinks)",
    description: "Auto-pull 90-day statements from RBC, TD, BMO, Scotia, CIBC, NBC + 100s more.",
    category: "Banking",
    status: "Not Connected",
  },
  {
    id: "CONN-PLD",
    provider: "Plaid",
    label: "Bank & investment accounts (Plaid)",
    description: "Verify balances and transaction history for down-payment and reserves.",
    category: "Banking",
    status: "Not Connected",
  },
  {
    id: "CONN-INV",
    provider: "Inverite",
    label: "Income verification (Inverite)",
    description: "Pull payroll deposits and verify employer income directly from your bank.",
    category: "Payroll",
    status: "Not Connected",
  },
];

type ActivityEntry = {
  id: string;
  doc: string;
  actor: string;
  action: "Viewed" | "Downloaded" | "Shared" | "Uploaded" | "Verified" | "Rejected";
  when: string;
  ip?: string;
};

const ACTIVITY: ActivityEntry[] = [
  {
    id: "A1",
    doc: "Pay stubs — April 2026",
    actor: "Lender Underwriter (Equitable Bank)",
    action: "Viewed",
    when: "2 hours ago",
    ip: "Toronto, ON",
  },
  {
    id: "A2",
    doc: "Notice of Assessment 2024",
    actor: "Sarah Chen — Mortgage Broker",
    action: "Downloaded",
    when: "Yesterday, 4:12 PM",
  },
  {
    id: "A3",
    doc: "Credit Bureau Consent",
    actor: "approvU System",
    action: "Shared",
    when: "May 4, 2026",
  },
  {
    id: "A4",
    doc: "Government ID — Driver's Licence",
    actor: "You",
    action: "Uploaded",
    when: "May 6, 2026",
    ip: "Toronto, ON",
  },
  {
    id: "A5",
    doc: "Mortgage Commitment Letter",
    actor: "Scotiabank Underwriter",
    action: "Viewed",
    when: "Apr 22, 2026",
  },
];

// Expiry rules (days). Pay stubs 30, NOAs 365, IDs 365.
function expiryDaysFor(doc: VaultDoc): number | null {
  if (/pay\s*stub/i.test(doc.name)) return 30;
  if (/bank statement/i.test(doc.name)) return 90;
  if (/notice of assessment|noa/i.test(doc.name)) return 365;
  if (/id|licence|license|passport/i.test(doc.name)) return 365;
  return null;
}
function parseDate(s: string): Date {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}
function daysSince(s: string): number {
  return Math.floor((Date.now() - parseDate(s).getTime()) / (1000 * 60 * 60 * 24));
}

type Scope = "personal" | "binder";
type SubTab = "uploads" | "all" | "requests" | "esign" | "connections" | "expiring" | "activity";

const SUB_TABS: { key: SubTab; label: string; icon: typeof FileText }[] = [
  { key: "uploads", label: "My Uploads", icon: Upload },
  { key: "all", label: "All Documents", icon: Folder },
  { key: "requests", label: "Lender Requests", icon: Inbox },
  { key: "esign", label: "E-Sign Inbox", icon: FileSignature },
  { key: "connections", label: "Bank & Payroll", icon: LinkIcon },
  { key: "expiring", label: "Expiring Soon", icon: Clock },
  { key: "activity", label: "Sharing Log", icon: History },
];

function DocumentVaultPage() {
  const [scope, setScope] = useState<Scope>("personal");
  const [binderApp, setBinderApp] = useState<string>("APP-2041");
  const [tab, setTab] = useState<SubTab>("uploads");
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<VaultDoc[]>(VAULT_DOCUMENTS);
  const [requests, setRequests] = useState<LenderRequest[]>(LENDER_REQUESTS);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [pendingConn, setPendingConn] = useState<Connection | null>(null);
  const [activityOpen, setActivityOpen] = useState<string | null>(null);

  const binderApps = useMemo(() => {
    const ids = new Set<string>();
    [
      ...ACTIVE.map((a) => a.id),
      ...SUBMITTED.map((a) => a.id),
      ...COMPLETED.map((a) => a.id),
    ].forEach((id) => ids.add(id));
    return Array.from(ids);
  }, []);

  const scopedDocs = useMemo(() => {
    if (scope === "personal") return docs.filter((d) => d.reusable || !d.app);
    return docs.filter((d) => d.app === binderApp);
  }, [docs, scope, binderApp]);

  const scopedRequests = useMemo(() => {
    if (scope === "personal") return [];
    return requests.filter((r) => r.app === binderApp);
  }, [requests, scope, binderApp]);

  const scopedEnvelopes = useMemo(() => {
    if (scope === "personal") return ENVELOPES;
    return ENVELOPES.filter((e) => e.app === binderApp);
  }, [scope, binderApp]);

  const expiringDocs = useMemo(() => {
    return docs
      .map((d) => {
        const ttl = expiryDaysFor(d);
        if (ttl == null) return null;
        const age = daysSince(d.uploaded);
        const remaining = ttl - age;
        return { doc: d, remaining, ttl };
      })
      .filter(
        (x): x is { doc: VaultDoc; remaining: number; ttl: number } => !!x && x.remaining <= 60,
      )
      .sort((a, b) => a.remaining - b.remaining);
  }, [docs]);

  const visibleDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedDocs.filter((d) => {
      if (d.archived) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
    });
  }, [scopedDocs, query]);

  const counts = useMemo(() => {
    return {
      total: scopedDocs.filter((d) => !d.archived).length,
      requests: scopedRequests.filter((r) => r.status === "Outstanding").length,
      esign: scopedEnvelopes.filter((e) => e.status === "Action Required").length,
      expiring: expiringDocs.filter((x) => x.remaining <= 14).length,
    };
  }, [scopedDocs, scopedRequests, scopedEnvelopes, expiringDocs]);

  function handleArchive(id: string) {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, archived: true, status: "Archived" } : d)),
    );
    toast.success("Moved to Archived");
  }

  function handleUploadFor(req: LenderRequest, source: "file" | "camera" | "connection") {
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "Under Review" } : r)),
    );
    const verb =
      source === "camera"
        ? "Captured & uploaded"
        : source === "connection"
          ? "Auto-pulled"
          : "Uploaded";
    toast.success(`${verb}: ${req.docType}`);
  }

  function connect(conn: Connection) {
    setPendingConn(conn);
  }

  function handleConnectComplete(conn: Connection, result: BankConnectResult) {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === conn.id
          ? {
              ...c,
              status: "Connected",
              lastSync: "just now",
              institutions: (c.institutions ?? 0) + 1,
            }
          : c,
      ),
    );
    notify({
      category: "Document",
      title: `${result.institution} connected via ${result.provider}`,
      body: `Pulled ${result.monthsRetrieved} months from ${result.accounts.length} account${result.accounts.length === 1 ? "" : "s"} into your vault.`,
      tone: "success",
    });
  }

  function disconnect(conn: Connection) {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === conn.id ? { ...c, status: "Not Connected", lastSync: undefined } : c,
      ),
    );
    toast.message(`${conn.provider} disconnected`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Borrower Portal"
        title="Document Vault"
        description="Your personal documents, per-application binders, lender requests, e-signatures, and secure connections — all in one place."
      />

      {/* Scope switcher */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ScopeButton
            active={scope === "personal"}
            onClick={() => setScope("personal")}
            icon={ShieldCheck}
            label="My Documents"
            sub="Personal vault"
          />
          <ScopeButton
            active={scope === "binder"}
            onClick={() => setScope("binder")}
            icon={Folder}
            label="Application Binder"
            sub={scope === "binder" ? `#${binderApp}` : "Per-application"}
          />
          {scope === "binder" && (
            <select
              value={binderApp}
              onChange={(e) => setBinderApp(e.target.value)}
              className="rounded-md border border-border bg-background px-2.5 py-2 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            >
              {binderApps.map((id) => (
                <option key={id} value={id}>
                  #{id}
                </option>
              ))}
            </select>
          )}
        </div>
        {scope === "binder" && (
          <Link
            to="/portal/applications/$applicationId"
            params={{ applicationId: binderApp }}
            className="inline-flex items-center gap-1 self-start rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
          >
            Open Application Hub <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Summary tiles */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            icon={FileText}
            label="Documents"
            value={String(counts.total)}
            tone="primary"
          />
          <SummaryCard
            icon={Inbox}
            label="Lender requests"
            value={String(counts.requests)}
            tone="yellow"
          />
          <SummaryCard
            icon={FileSignature}
            label="Awaiting signature"
            value={String(counts.esign)}
            tone="coral"
          />
          <SummaryCard
            icon={Clock}
            label="Expiring ≤14 days"
            value={String(counts.expiring)}
            tone="secondary"
          />
        </div>
      </section>

      {/* Sub-tabs */}
      <nav aria-label="Vault sections" className="-mx-1 mb-4 flex flex-wrap gap-1.5">
        {SUB_TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "uploads" && <UploadsView />}
      {tab === "all" && (
        <AllDocumentsView
          docs={visibleDocs}
          query={query}
          setQuery={setQuery}
          onArchive={handleArchive}
          scope={scope}
          binderApp={binderApp}
        />
      )}
      {tab === "requests" && (
        <LenderRequestsView
          scope={scope}
          binderApp={binderApp}
          requests={scopedRequests}
          onUpload={handleUploadFor}
          hasBankConnection={connections.some(
            (c) => c.category === "Banking" && c.status === "Connected",
          )}
        />
      )}
      {tab === "esign" && <EsignInboxView envelopes={scopedEnvelopes} />}
      {tab === "connections" && (
        <ConnectionsView connections={connections} onConnect={connect} onDisconnect={disconnect} />
      )}

      {pendingConn && (
        <BankConnectDialog
          open={!!pendingConn}
          onOpenChange={(o) => {
            if (!o) setPendingConn(null);
          }}
          provider={pendingConn.provider}
          onComplete={(result) => handleConnectComplete(pendingConn, result)}
        />
      )}
      {tab === "expiring" && <ExpiringView entries={expiringDocs} />}
      {tab === "activity" && (
        <ActivityView activity={ACTIVITY} openId={activityOpen} setOpenId={setActivityOpen} />
      )}
    </div>
  );
}

// ─── Document type options (must match backend allowlist exactly) ─────────────
const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: "identification", label: "Identification" },
  { value: "proof_of_income", label: "Proof of Income" },
  { value: "employment_letter", label: "Employment Letter" },
  { value: "notice_of_assessment", label: "Notice of Assessment" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "property_tax_bill", label: "Property Tax Bill" },
  { value: "purchase_agreement", label: "Purchase Agreement" },
  { value: "other", label: "Other" },
];

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function documentTypeLabel(value?: string | null): string {
  return DOCUMENT_TYPES.find((d) => d.value === value)?.label ?? value ?? "Unknown";
}

function getQualificationPublicReference(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem("approvu:borrower-portal-summary");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      latest_qualification?: { public_reference?: string | null };
    };
    return parsed.latest_qualification?.public_reference ?? null;
  } catch {
    return null;
  }
}

function DocumentStatusPill({ status }: { status?: string | null }) {
  const normalized = (status ?? "").toLowerCase();
  const map: Record<string, { label: string; tone: string }> = {
    uploaded: { label: "Uploaded", tone: "bg-secondary/15 text-secondary" },
    reviewed: { label: "Reviewed", tone: "bg-mint/25 text-foreground" },
    rejected: { label: "Needs attention", tone: "bg-coral/15 text-coral" },
  };
  const resolved = map[normalized] ?? {
    label: status ?? "Unknown",
    tone: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${resolved.tone}`}>
      {resolved.label}
    </span>
  );
}

// ─── My Uploads (API-connected) ───────────────────────
function UploadsView() {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [documents, setDocuments] = useState<BorrowerDocument[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const result = await listBorrowerDocuments();
      setDocuments(result.documents ?? []);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Could not load your documents.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  function validateFile(f: File): string | null {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Only PDF, JPG, JPEG, and PNG files are accepted.";
    }
    if (f.size > MAX_FILE_BYTES) {
      return "File must not exceed 10 MB.";
    }
    return null;
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(false);

    if (!file) {
      setUploadError("Please select a file.");
      return;
    }
    if (!documentType) {
      setUploadError("Please select a document type.");
      return;
    }
    const fileError = validateFile(file);
    if (fileError) {
      setUploadError(fileError);
      return;
    }

    setUploading(true);
    try {
      await uploadBorrowerDocument({
        file,
        document_type: documentType,
        qualification_public_reference: getQualificationPublicReference(),
        notes: notes.trim() || undefined,
      });
      setUploadSuccess(true);
      setFile(null);
      setDocumentType("");
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      void fetchDocuments();
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "We could not upload this document. Please check the file type and size, then try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Upload card ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Upload a document</h2>
            <p className="text-xs text-muted-foreground">
              PDF, JPG, JPEG, or PNG · max 10 MB · stored securely
            </p>
          </div>
        </div>

        <form onSubmit={handleUpload} noValidate className="mt-5 space-y-4">
          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              File <span className="text-coral">*</span>
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                <Upload className="h-4 w-4" /> Choose file
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setUploadError(null);
                    setUploadSuccess(false);
                  }}
                />
              </label>
              {file ? (
                <span className="truncate text-sm text-foreground" title={file.name}>
                  {file.name}{" "}
                  <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">No file selected</span>
              )}
            </div>
          </div>

          {/* Document type */}
          <div>
            <label htmlFor="doc-upload-type" className="block text-sm font-medium text-foreground">
              Document type <span className="text-coral">*</span>
            </label>
            <select
              id="doc-upload-type"
              value={documentType}
              onChange={(e) => {
                setDocumentType(e.target.value);
                setUploadError(null);
              }}
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary sm:max-w-sm"
            >
              <option value="">Select document type…</option>
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes (optional) */}
          <div>
            <label htmlFor="doc-upload-notes" className="block text-sm font-medium text-foreground">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="doc-upload-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="e.g. 2024 tax year, joint account…"
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary sm:max-w-sm"
            />
          </div>

          {/* Error */}
          {uploadError && (
            <div className="flex items-start gap-2 rounded-lg border border-coral/30 bg-coral/5 p-3 text-sm text-coral">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Success */}
          {uploadSuccess && !uploadError && (
            <div className="flex items-start gap-2 rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-sm text-secondary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Document uploaded successfully.</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading your document…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload document
              </>
            )}
          </button>
        </form>
      </section>

      {/* ── Uploaded documents list ──────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Your uploaded documents
            {documents.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {documents.length}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={() => void fetchDocuments()}
            disabled={listLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            aria-label="Refresh document list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {listLoading ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your documents…</p>
          </div>
        ) : listError ? (
          <div className="flex items-start gap-3 rounded-2xl border border-coral/30 bg-coral/5 p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
            <div>
              <p className="text-sm font-medium text-foreground">Could not load documents</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{listError}</p>
              <button
                type="button"
                onClick={() => void fetchDocuments()}
                className="mt-2 text-xs font-medium text-secondary underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">No documents uploaded yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the upload form above to add your first document.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc, idx) => (
              <article
                key={doc.id ?? idx}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium text-foreground"
                      title={doc.original_filename ?? undefined}
                    >
                      {doc.original_filename ?? "Unnamed file"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {documentTypeLabel(doc.document_type)}
                      {doc.size_bytes ? ` · ${formatFileSize(doc.size_bytes)}` : ""}
                    </p>
                  </div>
                  <DocumentStatusPill status={doc.status} />
                </div>

                {doc.notes && (
                  <p className="mt-2 truncate text-xs text-muted-foreground" title={doc.notes}>
                    {doc.notes}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  {doc.uploaded_at && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(doc.uploaded_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {doc.qualification_public_reference && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                      <ShieldCheck className="h-3 w-3" />
                      {doc.qualification_public_reference}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Scope button ──────────────────────────────────────
function ScopeButton({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
        active
          ? "border-primary bg-primary/5 text-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted/40"
      }`}
    >
      <span
        className={`rounded-lg p-1.5 ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block font-medium text-foreground">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}

// ─── All Documents ─────────────────────────────────────
function AllDocumentsView({
  docs,
  query,
  setQuery,
  onArchive,
  scope,
  binderApp,
}: {
  docs: VaultDoc[];
  query: string;
  setQuery: (v: string) => void;
  onArchive: (id: string) => void;
  scope: Scope;
  binderApp: string;
}) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        </div>
        <div className="flex gap-2">
          <MobileCaptureButton
            context={scope === "binder" ? `Binder #${binderApp}` : "Personal Vault"}
          />
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <Upload className="h-4 w-4" /> Upload
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const n = e.target.files?.length ?? 0;
                if (n) {
                  notify({
                    category: "Document",
                    title: `${n} file${n > 1 ? "s" : ""} uploaded`,
                    body: "Your documents are encrypted and pending review by your advisor.",
                    href: "/portal/documents",
                    tone: "success",
                  });
                }
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {docs.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No documents yet in this {scope === "binder" ? "binder" : "vault"}.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => {
            const ttl = expiryDaysFor(d);
            const remaining = ttl != null ? ttl - daysSince(d.uploaded) : null;
            const expiringBadge =
              remaining != null && remaining <= 30
                ? remaining <= 0
                  ? { tone: "bg-coral/15 text-coral", label: "Expired" }
                  : { tone: "bg-yellow/20 text-foreground", label: `Expires in ${remaining}d` }
                : null;
            return (
              <article
                key={d.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.category} · {d.uploaded}
                    </p>
                  </div>
                  <StatusPill status={d.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {d.app ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      <Folder className="h-3 w-3" /> #{d.app}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" /> Personal
                    </span>
                  )}
                  {d.sharedWithLender && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-mint/20 px-2 py-0.5 text-foreground">
                      <CheckCircle2 className="h-3 w-3" /> Shared with lender
                    </span>
                  )}
                  {expiringBadge && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${expiringBadge.tone}`}
                    >
                      <Clock className="h-3 w-3" /> {expiringBadge.label}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <ActionBtn
                    icon={Eye}
                    label="View"
                    onClick={() => toast.message(`Previewing ${d.name}`)}
                  />
                  <ActionBtn
                    icon={Download}
                    label="Download"
                    onClick={() => toast.success(`Downloading ${d.name}`)}
                  />
                  <ActionBtn icon={Archive} label="Archive" onClick={() => onArchive(d.id)} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

// ─── Mobile Capture ───────────────────────────────────
function MobileCaptureButton({ context }: { context: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
      <Camera className="h-4 w-4" /> Scan with camera
      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          const n = e.target.files?.length ?? 0;
          if (n)
            toast.success(
              `${n} page${n > 1 ? "s" : ""} captured & auto-cropped to PDF (${context})`,
            );
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}

// ─── Lender Requests ──────────────────────────────────
function LenderRequestsView({
  scope,
  binderApp,
  requests,
  onUpload,
  hasBankConnection,
}: {
  scope: Scope;
  binderApp: string;
  requests: LenderRequest[];
  onUpload: (r: LenderRequest, src: "file" | "camera" | "connection") => void;
  hasBankConnection: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"all" | RequestSource>("all");

  if (scope === "personal") {
    return (
      <Card>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-secondary/15 p-2 text-secondary">
              <Info className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium text-foreground">
                Lender requests live inside an application binder.
              </p>
              <p className="text-sm text-muted-foreground">
                Switch to <strong>Application Binder</strong> above to see what your lender is
                asking for.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-muted-foreground">
          No outstanding lender requests for #{binderApp}. You&apos;re all caught up.
        </p>
      </Card>
    );
  }

  const counts = {
    all: requests.length,
    advisor: requests.filter((r) => r.source === "advisor").length,
    lender: requests.filter((r) => r.source === "lender").length,
    compliance: requests.filter((r) => r.source === "compliance").length,
  };
  const visible =
    sourceFilter === "all" ? requests : requests.filter((r) => r.source === sourceFilter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Inbox className="h-3 w-3" /> Inbox
        </span>
        <SourceChip
          active={sourceFilter === "all"}
          onClick={() => setSourceFilter("all")}
          icon={ListChecks}
          label="All"
          count={counts.all}
        />
        <SourceChip
          active={sourceFilter === "advisor"}
          onClick={() => setSourceFilter("advisor")}
          icon={UserCheck}
          label="From advisor"
          count={counts.advisor}
        />
        <SourceChip
          active={sourceFilter === "lender"}
          onClick={() => setSourceFilter("lender")}
          icon={Building2}
          label="From lender"
          count={counts.lender}
        />
        {counts.compliance > 0 && (
          <SourceChip
            active={sourceFilter === "compliance"}
            onClick={() => setSourceFilter("compliance")}
            icon={ShieldCheck}
            label="Compliance"
            count={counts.compliance}
          />
        )}
        <Link
          to="/portal/applications/$applicationId/conditions"
          params={{ applicationId: binderApp }}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted"
        >
          Open conditions tracker <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {visible.length === 0 && (
        <Card>
          <p className="py-6 text-center text-sm text-muted-foreground">
            No requests match this filter.
          </p>
        </Card>
      )}

      {visible.map((r) => {
        const open = openId === r.id;
        const overdue = r.dueIn < 0;
        const dueSoon = r.dueIn >= 0 && r.dueIn <= 3;
        const SourceIcon =
          r.source === "advisor" ? UserCheck : r.source === "lender" ? Building2 : ShieldCheck;
        const sourceTone =
          r.source === "advisor"
            ? "bg-secondary/10 text-secondary border-secondary/30"
            : r.source === "lender"
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-mint/20 text-mint-foreground border-mint/40";
        return (
          <article key={r.id} className="rounded-2xl border border-border bg-card shadow-sm">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : r.id)}
              className="flex w-full items-start justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{r.docType}</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sourceTone}`}
                  >
                    <SourceIcon className="h-3 w-3" />
                    {r.source === "advisor"
                      ? "Requested by advisor"
                      : r.source === "lender"
                        ? "Requested by lender"
                        : "Compliance"}
                  </span>
                  {r.required && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Required
                    </span>
                  )}
                  <RequestStatusPill status={r.status} />
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      overdue
                        ? "bg-coral/15 text-coral"
                        : dueSoon
                          ? "bg-yellow/20 text-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {overdue ? `Overdue by ${Math.abs(r.dueIn)}d` : `Due in ${r.dueIn}d`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {r.requestedBy} · {r.requestedAt}
                  {r.conditionTitle && (
                    <>
                      {" "}
                      · linked to condition{" "}
                      <span className="font-medium text-foreground">{r.conditionTitle}</span>
                    </>
                  )}
                </p>
              </div>
              {open ? (
                <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {open && (
              <div className="border-t border-border bg-muted/30 p-4">
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-xs">
                  <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
                  <div>
                    <p className="font-medium text-foreground">What to send</p>
                    <p className="text-muted-foreground">{r.sample}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Upload className="h-4 w-4" /> Upload file
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if ((e.target.files?.length ?? 0) > 0) onUpload(r, "file");
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                    <Camera className="h-4 w-4" /> Scan with camera
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if ((e.target.files?.length ?? 0) > 0) onUpload(r, "camera");
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {/bank statement|pay stub|noa|notice of assessment/i.test(r.docType) && (
                    <button
                      onClick={() => {
                        if (!hasBankConnection) {
                          toast.message("Connect your bank under Bank & Payroll to auto-pull this");
                        } else {
                          onUpload(r, "connection");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <Zap className="h-4 w-4 text-secondary" /> Auto-pull from bank
                    </button>
                  )}
                  {r.conditionId && (
                    <Link
                      to="/portal/applications/$applicationId/conditions"
                      params={{ applicationId: r.app }}
                      className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
                    >
                      View linked condition <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function SourceChip({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Inbox;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-3 w-3" /> {label}
      <span
        className={`rounded-full px-1.5 text-[10px] font-semibold ${active ? "bg-primary-foreground/20" : "bg-muted-foreground/15"}`}
      >
        {count}
      </span>
    </button>
  );
}

function RequestStatusPill({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, string> = {
    Outstanding: "bg-yellow/20 text-foreground",
    Uploaded: "bg-secondary/15 text-secondary",
    "Under Review": "bg-secondary/15 text-secondary",
    Approved: "bg-mint/25 text-foreground",
    Rejected: "bg-coral/15 text-coral",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

// ─── E-Sign Inbox ─────────────────────────────────────
function EsignInboxView({ envelopes }: { envelopes: Envelope[] }) {
  if (envelopes.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-muted-foreground">
          No e-sign envelopes in this view.
        </p>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {envelopes.map((env) => {
        const action = env.status === "Action Required";
        return (
          <article
            key={env.id}
            className={`rounded-2xl border bg-card p-4 shadow-sm ${action ? "border-primary/40" : "border-border"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{env.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  From {env.sender} · via {env.provider} · {env.pages} pages
                </p>
              </div>
              <EnvelopePill status={env.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-muted p-2">
                <p className="text-muted-foreground">Received</p>
                <p className="font-semibold text-foreground">{env.receivedAt}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <p className="text-muted-foreground">Due</p>
                <p className="font-semibold text-foreground">{env.dueAt}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {action ? (
                <button
                  onClick={() => toast.success(`Opening ${env.provider} signing session…`)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <PenLine className="h-4 w-4" /> Review & sign
                </button>
              ) : (
                <button
                  onClick={() => toast.message(`Opening ${env.title}`)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <Eye className="h-4 w-4" /> View envelope
                </button>
              )}
              <button
                onClick={() => toast.success(`Downloading signed PDF for ${env.title}`)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <Download className="h-4 w-4" /> PDF
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EnvelopePill({ status }: { status: Envelope["status"] }) {
  const map: Record<Envelope["status"], string> = {
    "Action Required": "bg-coral/15 text-coral",
    "Awaiting Counterparty": "bg-yellow/20 text-foreground",
    Signed: "bg-mint/25 text-foreground",
    Voided: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

// ─── Connections ──────────────────────────────────────
function ConnectionsView({
  connections,
  onConnect,
  onDisconnect,
}: {
  connections: Connection[];
  onConnect: (c: Connection) => void;
  onDisconnect: (c: Connection) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4 text-sm">
        <Lock className="mt-0.5 h-4 w-4 text-secondary" />
        <div>
          <p className="font-medium text-foreground">Bank-grade, read-only connections</p>
          <p className="text-muted-foreground">
            We use Flinks, Plaid and Inverite to securely retrieve statements and verify income —
            your credentials are never shared with approvU or your lender. Saves an average of{" "}
            <strong>70%</strong> of upload time.
          </p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {connections.map((c) => {
          const Icon = c.category === "Banking" ? Landmark : Banknote;
          const connected = c.status === "Connected";
          return (
            <article key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-muted p-2 text-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {c.provider} · {c.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${connected ? "bg-mint/25 text-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {c.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
              {connected && (
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-secondary">
                  <RefreshCw className="h-3 w-3" /> Last sync: {c.lastSync}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                {connected ? (
                  <>
                    <button
                      onClick={() => toast.success(`Re-syncing ${c.provider}…`)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <RefreshCw className="h-4 w-4" /> Sync
                    </button>
                    <button
                      onClick={() => onDisconnect(c)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <X className="h-4 w-4" /> Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onConnect(c)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <LinkIcon className="h-4 w-4" /> Connect securely
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ─── Expiring ─────────────────────────────────────────
function ExpiringView({
  entries,
}: {
  entries: { doc: VaultDoc; remaining: number; ttl: number }[];
}) {
  if (entries.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing expiring in the next 60 days. 👌
        </p>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map(({ doc, remaining, ttl }) => {
        const expired = remaining <= 0;
        const tone = expired
          ? "border-coral/40 bg-coral/5"
          : remaining <= 14
            ? "border-yellow/50 bg-yellow/5"
            : "border-border bg-card";
        return (
          <article
            key={doc.id}
            className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${tone}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{doc.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {doc.category} · uploaded {doc.uploaded} · refresh window: {ttl} days
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${expired ? "bg-coral/15 text-coral" : "bg-yellow/20 text-foreground"}`}
              >
                {expired ? `Expired ${Math.abs(remaining)}d ago` : `Expires in ${remaining}d`}
              </span>
              <button
                onClick={() => toast.success(`Re-upload prompt sent for ${doc.name}`)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" /> Re-upload
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ─── Activity / Sharing Log ───────────────────────────
function ActivityView({
  activity,
  openId,
  setOpenId,
}: {
  activity: ActivityEntry[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  return (
    <Card className="p-0">
      <div className="border-b border-border p-4">
        <p className="text-sm font-semibold text-foreground">Who has accessed your documents</p>
        <p className="text-xs text-muted-foreground">
          Every view, download, and share is logged for your protection.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {activity.map((a) => {
          const open = openId === a.id;
          const tone =
            a.action === "Rejected"
              ? "text-coral"
              : a.action === "Verified"
                ? "text-secondary"
                : a.action === "Shared"
                  ? "text-secondary"
                  : "text-foreground";
          return (
            <li key={a.id}>
              <button
                onClick={() => setOpenId(open ? null : a.id)}
                className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.doc}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className={tone}>{a.action}</span> by {a.actor} · {a.when}
                  </p>
                </div>
                {open ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {open && (
                <div className="border-t border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                  <div className="grid gap-1 sm:grid-cols-3">
                    <div>
                      <span className="font-medium text-foreground">Action: </span>
                      {a.action}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Actor: </span>
                      {a.actor}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">When: </span>
                      {a.when}
                    </div>
                    {a.ip && (
                      <div className="sm:col-span-3">
                        <span className="font-medium text-foreground">Location: </span>
                        {a.ip}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
