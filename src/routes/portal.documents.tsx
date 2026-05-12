import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArrowRight,
  Banknote,
  Building2,
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
  Lock,
  Mail,
  PenLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Upload,
  X,
  Zap,
} from "lucide-react";
import {
  ACTIVE,
  SUBMITTED,
  COMPLETED,
  VAULT_DOCUMENTS,
  type VaultDoc,
} from "@/components/portal/data";
import { Card, PageHeader, StatusPill, SummaryCard } from "@/components/portal/ui";

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
type LenderRequest = {
  id: string;
  app: string;
  docType: string;
  description: string;
  sample: string;
  dueIn: number; // days; negative = overdue
  status: RequestStatus;
  required: boolean;
};

const LENDER_REQUESTS: LenderRequest[] = [
  {
    id: "REQ-9001",
    app: "APP-2041",
    docType: "Notice of Assessment (2024)",
    description: "Most recent CRA NOA showing total income line 15000.",
    sample: "Look for the CRA letterhead, your SIN (last 3 digits), tax year, and 'Total income' on page 1.",
    dueIn: 2,
    status: "Outstanding",
    required: true,
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
  { id: "A1", doc: "Pay stubs — April 2026", actor: "Lender Underwriter (Equitable Bank)", action: "Viewed", when: "2 hours ago", ip: "Toronto, ON" },
  { id: "A2", doc: "Notice of Assessment 2024", actor: "Sarah Chen — Mortgage Broker", action: "Downloaded", when: "Yesterday, 4:12 PM" },
  { id: "A3", doc: "Credit Bureau Consent", actor: "approvU System", action: "Shared", when: "May 4, 2026" },
  { id: "A4", doc: "Government ID — Driver's Licence", actor: "You", action: "Uploaded", when: "May 6, 2026", ip: "Toronto, ON" },
  { id: "A5", doc: "Mortgage Commitment Letter", actor: "Scotiabank Underwriter", action: "Viewed", when: "Apr 22, 2026" },
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
type SubTab = "all" | "requests" | "esign" | "connections" | "expiring" | "activity";

const SUB_TABS: { key: SubTab; label: string; icon: typeof FileText }[] = [
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
  const [tab, setTab] = useState<SubTab>("all");
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<VaultDoc[]>(VAULT_DOCUMENTS);
  const [requests, setRequests] = useState<LenderRequest[]>(LENDER_REQUESTS);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [activityOpen, setActivityOpen] = useState<string | null>(null);

  const binderApps = useMemo(() => {
    const ids = new Set<string>();
    [...ACTIVE.map((a) => a.id), ...SUBMITTED.map((a) => a.id), ...COMPLETED.map((a) => a.id)].forEach((id) => ids.add(id));
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
      .filter((x): x is { doc: VaultDoc; remaining: number; ttl: number } => !!x && x.remaining <= 60)
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
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, archived: true, status: "Archived" } : d)));
    toast.success("Moved to Archived");
  }

  function handleUploadFor(req: LenderRequest, source: "file" | "camera" | "connection") {
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "Under Review" } : r)),
    );
    const verb = source === "camera" ? "Captured & uploaded" : source === "connection" ? "Auto-pulled" : "Uploaded";
    toast.success(`${verb}: ${req.docType}`);
  }

  function connect(conn: Connection) {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === conn.id
          ? { ...c, status: "Connected", lastSync: "just now", institutions: c.institutions ?? 1 }
          : c,
      ),
    );
    toast.success(`${conn.provider} connected — pulling documents securely`);
  }

  function disconnect(conn: Connection) {
    setConnections((prev) => prev.map((c) => (c.id === conn.id ? { ...c, status: "Not Connected", lastSync: undefined } : c)));
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
          <SummaryCard icon={FileText} label="Documents" value={String(counts.total)} tone="primary" />
          <SummaryCard icon={Inbox} label="Lender requests" value={String(counts.requests)} tone="yellow" />
          <SummaryCard icon={FileSignature} label="Awaiting signature" value={String(counts.esign)} tone="coral" />
          <SummaryCard icon={Clock} label="Expiring ≤14 days" value={String(counts.expiring)} tone="secondary" />
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
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </nav>

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
          hasBankConnection={connections.some((c) => c.category === "Banking" && c.status === "Connected")}
        />
      )}
      {tab === "esign" && <EsignInboxView envelopes={scopedEnvelopes} />}
      {tab === "connections" && (
        <ConnectionsView connections={connections} onConnect={connect} onDisconnect={disconnect} />
      )}
      {tab === "expiring" && <ExpiringView entries={expiringDocs} />}
      {tab === "activity" && (
        <ActivityView
          activity={ACTIVITY}
          openId={activityOpen}
          setOpenId={setActivityOpen}
        />
      )}
    </div>
  );
}

// ─── Scope button ──────────────────────────────────────
function ScopeButton({
  active, onClick, icon: Icon, label, sub,
}: {
  active: boolean; onClick: () => void; icon: typeof FileText; label: string; sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
        active ? "border-primary bg-primary/5 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted/40"
      }`}
    >
      <span className={`rounded-lg p-1.5 ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
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
  docs, query, setQuery, onArchive, scope, binderApp,
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
          <MobileCaptureButton context={scope === "binder" ? `Binder #${binderApp}` : "Personal Vault"} />
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <Upload className="h-4 w-4" /> Upload
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const n = e.target.files?.length ?? 0;
                if (n) toast.success(`${n} file${n > 1 ? "s" : ""} uploaded`);
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
              <article key={d.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
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
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${expiringBadge.tone}`}>
                      <Clock className="h-3 w-3" /> {expiringBadge.label}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <ActionBtn icon={Eye} label="View" onClick={() => toast.message(`Previewing ${d.name}`)} />
                  <ActionBtn icon={Download} label="Download" onClick={() => toast.success(`Downloading ${d.name}`)} />
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

function ActionBtn({ icon: Icon, label, onClick }: { icon: typeof FileText; label: string; onClick: () => void }) {
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
        // @ts-expect-error capture is a valid HTML attr for file inputs
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          const n = e.target.files?.length ?? 0;
          if (n) toast.success(`${n} page${n > 1 ? "s" : ""} captured & auto-cropped to PDF (${context})`);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}

// ─── Lender Requests ──────────────────────────────────
function LenderRequestsView({
  scope, binderApp, requests, onUpload, hasBankConnection,
}: {
  scope: Scope;
  binderApp: string;
  requests: LenderRequest[];
  onUpload: (r: LenderRequest, src: "file" | "camera" | "connection") => void;
  hasBankConnection: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (scope === "personal") {
    return (
      <Card>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-secondary/15 p-2 text-secondary"><Info className="h-4 w-4" /></span>
            <div>
              <p className="font-medium text-foreground">Lender requests live inside an application binder.</p>
              <p className="text-sm text-muted-foreground">Switch to <strong>Application Binder</strong> above to see what your lender is asking for.</p>
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

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const open = openId === r.id;
        const overdue = r.dueIn < 0;
        const dueSoon = r.dueIn >= 0 && r.dueIn <= 3;
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
                  {r.required && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Required</span>}
                  <RequestStatusPill status={r.status} />
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      overdue ? "bg-coral/15 text-coral" : dueSoon ? "bg-yellow/20 text-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {overdue ? `Overdue by ${Math.abs(r.dueIn)}d` : `Due in ${r.dueIn}d`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              </div>
              {open ? <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground" /> : <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />}
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
                      // @ts-expect-error capture is a valid HTML attr
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
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
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
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>{status}</span>;
}

// ─── E-Sign Inbox ─────────────────────────────────────
function EsignInboxView({ envelopes }: { envelopes: Envelope[] }) {
  if (envelopes.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-muted-foreground">No e-sign envelopes in this view.</p>
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
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>{status}</span>;
}

// ─── Connections ──────────────────────────────────────
function ConnectionsView({
  connections, onConnect, onDisconnect,
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
            We use Flinks, Plaid and Inverite to securely retrieve statements and verify income — your credentials are never shared with approvU or your lender. Saves an average of <strong>70%</strong> of upload time.
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
                  <span className="rounded-lg bg-muted p-2 text-foreground"><Icon className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.provider} · {c.category}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${connected ? "bg-mint/25 text-foreground" : "bg-muted text-muted-foreground"}`}>
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
function ExpiringView({ entries }: { entries: { doc: VaultDoc; remaining: number; ttl: number }[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-muted-foreground">Nothing expiring in the next 60 days. 👌</p>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map(({ doc, remaining, ttl }) => {
        const expired = remaining <= 0;
        const tone = expired ? "border-coral/40 bg-coral/5" : remaining <= 14 ? "border-yellow/50 bg-yellow/5" : "border-border bg-card";
        return (
          <article key={doc.id} className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${tone}`}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{doc.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {doc.category} · uploaded {doc.uploaded} · refresh window: {ttl} days
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${expired ? "bg-coral/15 text-coral" : "bg-yellow/20 text-foreground"}`}>
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
  activity, openId, setOpenId,
}: {
  activity: ActivityEntry[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  return (
    <Card className="p-0">
      <div className="border-b border-border p-4">
        <p className="text-sm font-semibold text-foreground">Who has accessed your documents</p>
        <p className="text-xs text-muted-foreground">Every view, download, and share is logged for your protection.</p>
      </div>
      <ul className="divide-y divide-border">
        {activity.map((a) => {
          const open = openId === a.id;
          const tone =
            a.action === "Rejected" ? "text-coral" :
            a.action === "Verified" ? "text-secondary" :
            a.action === "Shared" ? "text-secondary" :
            "text-foreground";
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
                {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              {open && (
                <div className="border-t border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                  <div className="grid gap-1 sm:grid-cols-3">
                    <div><span className="font-medium text-foreground">Action: </span>{a.action}</div>
                    <div><span className="font-medium text-foreground">Actor: </span>{a.actor}</div>
                    <div><span className="font-medium text-foreground">When: </span>{a.when}</div>
                    {a.ip && <div className="sm:col-span-3"><span className="font-medium text-foreground">Location: </span>{a.ip}</div>}
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
