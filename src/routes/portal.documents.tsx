import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArrowRight,
  Download,
  Eye,
  FileText,
  Info,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  VAULT_DOCUMENTS,
  type VaultDoc,
  type VaultTab,
} from "@/components/portal/data";
import { Card, PageHeader, StatusPill, SummaryCard } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/documents")({
  head: () => ({
    meta: [
      { title: "Document Vault — approvU" },
      {
        name: "description",
        content:
          "Your account-wide Document Vault: stored documents across applications, signed consents, approvals, commitments, and closing files.",
      },
    ],
  }),
  component: DocumentVaultPage,
});

const TABS: { key: VaultTab; label: string }[] = [
  { key: "all", label: "All Documents" },
  { key: "application", label: "Application Documents" },
  { key: "reusable", label: "Reusable Documents" },
  { key: "signed", label: "Signed Documents" },
  { key: "approval", label: "Approval & Closing" },
  { key: "archived", label: "Archived" },
];

function matchTab(doc: VaultDoc, tab: VaultTab): boolean {
  if (tab === "all") return !doc.archived;
  if (tab === "application") return !!doc.app && !doc.archived;
  if (tab === "reusable") return doc.reusable && !doc.archived;
  if (tab === "signed") return doc.signed && !doc.archived;
  if (tab === "approval") return doc.approval && !doc.archived;
  if (tab === "archived") return doc.archived;
  return true;
}

function DocumentVaultPage() {
  const [tab, setTab] = useState<VaultTab>("all");
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<VaultDoc[]>(VAULT_DOCUMENTS);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (!matchTab(d, tab)) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        (d.app ?? "").toLowerCase().includes(q)
      );
    });
  }, [docs, tab, query]);

  const counts = useMemo(() => {
    const active = docs.filter((d) => !d.archived);
    return {
      total: active.length,
      reusable: active.filter((d) => d.reusable).length,
      signed: active.filter((d) => d.signed).length,
      approval: active.filter((d) => d.approval).length,
      archived: docs.filter((d) => d.archived).length,
    };
  }, [docs]);

  function archive(id: string) {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, archived: true, status: "Archived" } : d,
      ),
    );
    toast.success("Moved to Archived");
  }
  function restore(id: string) {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, archived: false, status: "Verified" } : d,
      ),
    );
    toast.success("Restored from Archived");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Borrower Portal"
        title="Document Vault"
        description="A central record of every document tied to your approvU account — across current, past, and future mortgage applications."
      />

      {/* Helper / scope clarification */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-xl bg-secondary/15 p-2 text-secondary">
            <Info className="h-4 w-4" />
          </span>
          <div className="text-sm text-foreground">
            <p className="font-medium">Your Document Vault stores documents across your approvU account.</p>
            <p className="mt-0.5 text-muted-foreground">
              To complete document requests for an active mortgage application, open that application&apos;s Document Upload page.
            </p>
          </div>
        </div>
        <Link
          to="/portal/applications"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-secondary px-3.5 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
        >
          Go to Applications <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {/* Summary */}
      <section aria-label="Vault summary" className="mb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard icon={FileText} label="Total" value={String(counts.total)} tone="primary" />
          <SummaryCard icon={RefreshCw} label="Reusable" value={String(counts.reusable)} tone="secondary" />
          <SummaryCard icon={ShieldCheck} label="Signed" value={String(counts.signed)} tone="mint" />
          <SummaryCard icon={FileText} label="Approval & Closing" value={String(counts.approval)} tone="yellow" />
          <SummaryCard icon={Archive} label="Archived" value={String(counts.archived)} tone="coral" />
        </div>
      </section>

      {/* Tabs + search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Vault tabs" className="-mx-1 flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vault…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-muted-foreground">No documents match this view.</p>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {visible.map((d) => (
              <DocCard key={d.id} doc={d} onArchive={archive} onRestore={restore} />
            ))}
          </div>
          {/* Desktop table */}
          <Card className="hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">File</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Application</th>
                    <th className="px-4 py-3 font-semibold">App Status</th>
                    <th className="px-4 py-3 font-semibold">Uploaded</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Lender</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{d.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.category}</td>
                      <td className="px-4 py-3">
                        {d.app ? (
                          <Link
                            to="/internal/full-application"
                            className="text-secondary hover:underline"
                          >
                            #{d.app}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.appStatus ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.uploaded}</td>
                      <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                      <td className="px-4 py-3 text-xs">
                        {d.sharedWithLender ? (
                          <span className="rounded-full bg-mint/20 px-2 py-0.5 font-medium text-foreground">Yes</span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DocActions doc={d} onArchive={archive} onRestore={restore} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function DocCard({
  doc,
  onArchive,
  onRestore,
}: {
  doc: VaultDoc;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{doc.name}</p>
        <StatusPill status={doc.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {doc.category} · Uploaded {doc.uploaded}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-muted p-2">
          <p className="text-muted-foreground">Application</p>
          <p className="font-semibold text-foreground">{doc.app ? `#${doc.app}` : "—"}</p>
        </div>
        <div className="rounded-lg bg-muted p-2">
          <p className="text-muted-foreground">Lender shared</p>
          <p className="font-semibold text-foreground">{doc.sharedWithLender ? "Yes" : "No"}</p>
        </div>
      </div>
      <div className="mt-3">
        <DocActions doc={doc} onArchive={onArchive} onRestore={onRestore} />
      </div>
    </article>
  );
}

function DocActions({
  doc,
  onArchive,
  onRestore,
  compact,
}: {
  doc: VaultDoc;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  compact?: boolean;
}) {
  const btn =
    "inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "justify-end" : ""}`}>
      <button className={btn} onClick={() => toast.message(`Previewing ${doc.name}`)}>
        <Eye className="h-3.5 w-3.5" /> View
      </button>
      <button className={btn} onClick={() => toast.success(`Downloading ${doc.name}`)}>
        <Download className="h-3.5 w-3.5" /> Download
      </button>
      {doc.reusable && !doc.archived && (
        <button className={btn} onClick={() => toast.success("Available to reuse on next application")}>
          <RefreshCw className="h-3.5 w-3.5" /> Reuse
        </button>
      )}
      {doc.archived ? (
        <button className={btn} onClick={() => onRestore(doc.id)}>
          <RefreshCw className="h-3.5 w-3.5" /> Restore
        </button>
      ) : (
        <button className={btn} onClick={() => onArchive(doc.id)}>
          <Archive className="h-3.5 w-3.5" /> Archive
        </button>
      )}
    </div>
  );
}