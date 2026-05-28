import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, MessageSquare, Search } from "lucide-react";
import { PageHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/messages")({
  head: () => ({
    meta: [
      { title: "Messages — approvU Portal" },
      {
        name: "description",
        content: "Secure threaded messages with your advisor and lender, per application.",
      },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "advisor" | "lender">("all");

  // No threads until the real messaging API is connected.
  const threads: never[] = [];
  const filtered = threads.filter(() => {
    void query;
    void filter;
    return true;
  });

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
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                No conversations yet.
              </li>
            )}
          </ul>
        </div>

        {/* Empty state panel */}
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">No messages yet.</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Messages from the approvU team, document follow-ups, and application updates will appear
            here once your file is active.
          </p>
          <Link
            to="/portal/applications"
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue application →
          </Link>
        </div>
      </div>
    </>
  );
}
