import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCheck,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Building2,
  UserRound,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/messages")({
  head: () => ({
    meta: [
      { title: "Messages — approvU Portal" },
      { name: "description", content: "Secure threaded messages with your advisor and lender, per application." },
    ],
  }),
  component: MessagesPage,
});

type Party = "advisor" | "lender" | "you";
type Msg = { id: string; from: Party; body: string; at: string; read?: boolean; attachment?: { name: string; size: string } };
type Thread = {
  id: string;
  applicationId: string;
  subject: string;
  with: { name: string; role: "Advisor" | "Lender"; org?: string };
  lastAt: string;
  unread: number;
  messages: Msg[];
};

const THREADS: Thread[] = [
  {
    id: "t-2041-advisor",
    applicationId: "APP-2041",
    subject: "Income docs follow-up",
    with: { name: "Sarah Chen", role: "Advisor", org: "approvU" },
    lastAt: "2h ago",
    unread: 1,
    messages: [
      { id: "m1", from: "advisor", body: "Hi Alex — the lender asked for your last 2 pay stubs. Could you upload them today?", at: "Today · 10:14 AM", read: true },
      { id: "m2", from: "you", body: "Sure, I'll upload them this evening.", at: "Today · 10:32 AM", read: true },
      { id: "m3", from: "advisor", body: "Perfect. Let me know once they're up and I'll push them to the lender.", at: "Today · 12:05 PM" },
    ],
  },
  {
    id: "t-2041-lender",
    applicationId: "APP-2041",
    subject: "Conditions package received",
    with: { name: "MapleTrust Underwriting", role: "Lender", org: "MapleTrust" },
    lastAt: "Yesterday",
    unread: 0,
    messages: [
      { id: "m1", from: "lender", body: "We've received your signed commitment. Two outstanding conditions remain — see the Conditions tab.", at: "Yesterday · 4:42 PM", read: true },
    ],
  },
  {
    id: "t-1987-advisor",
    applicationId: "APP-1987",
    subject: "Renewal options",
    with: { name: "Sarah Chen", role: "Advisor", org: "approvU" },
    lastAt: "May 8",
    unread: 0,
    messages: [
      { id: "m1", from: "advisor", body: "Here are 3 renewal scenarios for your review. Happy to walk through them on a call.", at: "May 8 · 9:10 AM", read: true, attachment: { name: "renewal-scenarios.pdf", size: "412 KB" } },
    ],
  },
];

function partyTone(p: Party) {
  if (p === "you") return "bg-primary text-primary-foreground";
  if (p === "lender") return "bg-secondary/15 text-foreground border border-secondary/30";
  return "bg-muted text-foreground";
}

function MessagesPage() {
  const [activeId, setActiveId] = useState(THREADS[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "advisor" | "lender">("all");
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState(THREADS);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return threads.filter((t) => {
      if (filter === "unread" && t.unread === 0) return false;
      if (filter === "advisor" && t.with.role !== "Advisor") return false;
      if (filter === "lender" && t.with.role !== "Lender") return false;
      if (query && !`${t.subject} ${t.with.name} ${t.applicationId}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [threads, filter, query]);

  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  const send = () => {
    if (!draft.trim()) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? {
              ...t,
              lastAt: "Just now",
              messages: [...t.messages, { id: `m${Date.now()}`, from: "you", body: draft, at: "Just now", read: true }],
            }
          : t,
      ),
    );
    setDraft("");
  };

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Messages"
        description="Secure, encrypted conversations with your approvU advisor and your lender — organized by application."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Threads list */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search messages"
                className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-2 text-sm"
              />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              {(["all", "unread", "advisor", "lender"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">No conversations match.</li>
            )}
            {filtered.map((t) => {
              const isActive = t.id === active.id;
              const Icon = t.with.role === "Lender" ? Building2 : UserRound;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setActiveId(t.id)}
                    className={`flex w-full items-start gap-3 border-b border-border/60 p-3 text-left transition ${
                      isActive ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{t.with.name}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{t.lastAt}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.with.role} · #{t.applicationId}
                      </p>
                      <p className="mt-1 truncate text-xs text-foreground/80">{t.subject}</p>
                    </div>
                    {t.unread > 0 && (
                      <span className="ml-1 mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">
                        {t.unread}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Active thread */}
        <div className="flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{active.subject}</p>
              <p className="text-xs text-muted-foreground">
                {active.with.name} · {active.with.role}
                {active.with.org ? ` · ${active.with.org}` : ""} ·{" "}
                <Link
                  to="/portal/applications/$applicationId"
                  params={{ applicationId: active.applicationId }}
                  className="text-primary hover:underline"
                >
                  #{active.applicationId}
                </Link>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-mint bg-mint/20 px-2 py-0.5 text-[11px] font-medium text-foreground">
              <ShieldCheck className="h-3 w-3" /> End-to-end secured
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {active.messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${partyTone(m.from)}`}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  {m.attachment && (
                    <div className="mt-2 flex items-center gap-2 rounded-md bg-background/30 px-2 py-1.5 text-xs">
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="truncate">{m.attachment.name}</span>
                      <span className="opacity-70">{m.attachment.size}</span>
                    </div>
                  )}
                  <p className={`mt-1 flex items-center gap-1 text-[10px] ${m.from === "you" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {m.at}
                    {m.from === "you" && m.read && <CheckCheck className="h-3 w-3" />}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) toast.success(`Attached ${f.name}`);
                  }}
                />
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Type a message…"
                className="min-h-[40px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={send}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Send <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Messages are logged with your application file and may be reviewed by compliance.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}