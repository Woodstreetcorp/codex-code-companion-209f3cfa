import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Pencil,
  Search,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import { useSavedScenarios, type SavedScenario } from "@/components/portal/tools-shared";

export const Route = createFileRoute("/portal/tools/saved")({
  head: () => ({
    meta: [
      { title: "Saved Scenarios — approvU Mortgage Tools" },
      { name: "description", content: "Review, rename, share and push your saved mortgage tool scenarios into an application." },
    ],
  }),
  component: SavedScenariosPage,
});

const TOOL_LINKS: Record<string, string> = {
  "Mortgage Payment": "/portal/tools/payment-calculator",
  "Affordability": "/portal/tools/affordability",
  "Closing Costs": "/portal/tools/closing-costs",
  "Down Payment": "/portal/tools/down-payment",
  "Refinance Savings": "/portal/tools/refinance-savings",
  "Renewal Comparison": "/portal/tools/renewal-comparison",
  "Debt Consolidation": "/portal/tools/debt-consolidation",
  "Prepayment": "/portal/tools/prepayment",
  "Rent vs Buy": "/portal/tools/rent-vs-buy",
  "Home Equity": "/portal/tools/home-equity",
  "Stress Test": "/portal/tools/stress-test",
  "Scenario Compare": "/portal/tools/scenario-compare",
  "Land Transfer Tax": "/portal/tools/land-transfer-tax",
  "Insurance Premium": "/portal/tools/insurance-premium",
  "Portability": "/portal/tools/portability",
};

function SavedScenariosPage() {
  const { list, remove, rename } = useSavedScenarios();
  const [q, setQ] = useState("");
  const [tool, setTool] = useState<string>("All");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const tools = useMemo(() => ["All", ...Array.from(new Set(list.map((s) => s.tool)))], [list]);
  const filtered = useMemo(
    () => list.filter((s) =>
      (tool === "All" || s.tool === tool) &&
      (!q || s.name.toLowerCase().includes(q.toLowerCase()))
    ),
    [list, tool, q],
  );

  const startEdit = (s: SavedScenario) => { setEditId(s.id); setEditName(s.name); };
  const commitEdit = () => {
    if (editId && editName.trim()) {
      rename(editId, editName.trim());
      toast.success("Scenario renamed");
    }
    setEditId(null); setEditName("");
  };

  const share = (s: SavedScenario) => {
    const url = `${window.location.origin}/portal/tools/saved#${s.id}`;
    navigator.clipboard?.writeText(url);
    toast.success("Share link copied to clipboard");
  };
  const copyJson = (s: SavedScenario) => {
    navigator.clipboard?.writeText(JSON.stringify(s, null, 2));
    toast.success("Scenario data copied as JSON");
  };
  const pushToApp = (s: SavedScenario) => {
    toast.success(`"${s.name}" sent to APP-2041 — your advisor will review it.`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link
          to="/portal/tools"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All tools
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-primary sm:text-3xl">Saved scenarios</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every scenario you've saved across the calculators. Rename, share, or push one into your application.
            </p>
          </div>
          <span className="rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-semibold text-secondary">
            {list.length} saved
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search scenarios…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
          >
            {tools.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-foreground">
              {list.length === 0 ? "No scenarios saved yet" : "No scenarios match your filter"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {list.length === 0
                ? "Save your work in any calculator to revisit and compare it later."
                : "Try a different search or tool filter."}
            </p>
            <Link
              to="/portal/tools"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Browse calculators <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((s) => {
              const date = new Date(s.createdAt).toLocaleDateString("en-CA", {
                month: "short", day: "numeric", year: "numeric",
              });
              const editing = editId === s.id;
              const toolLink = TOOL_LINKS[s.tool];
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditId(null); setEditName(""); } }}
                          className="w-full max-w-sm rounded-md border border-input bg-background px-2 py-1 text-sm"
                        />
                        <button
                          onClick={commitEdit}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                      </div>
                    ) : (
                      <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {s.tool} · saved {date}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {toolLink && (
                      <Link
                        to={toolLink}
                        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        Reopen
                      </Link>
                    )}
                    <IconBtn label="Rename" icon={Pencil} onClick={() => startEdit(s)} />
                    <IconBtn label="Copy link" icon={Share2} onClick={() => share(s)} />
                    <IconBtn label="Copy JSON" icon={Copy} onClick={() => copyJson(s)} />
                    <button
                      onClick={() => pushToApp(s)}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Send className="h-3 w-3" /> Push to app
                    </button>
                    <IconBtn
                      label="Delete"
                      icon={Trash2}
                      tone="coral"
                      onClick={() => { remove(s.id); toast.success("Scenario deleted"); }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function IconBtn({ icon: Icon, label, onClick, tone }: { icon: typeof Trash2; label: string; onClick: () => void; tone?: "coral" }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:bg-muted ${tone === "coral" ? "hover:text-coral" : "hover:text-foreground"}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}