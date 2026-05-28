import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  CircleDot,
  FileText,
  HandCoins,
  ListChecks,
  MessageSquare,
  Settings2,
  Sparkles,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/portal/ui";
import {
  getActivity,
  markActivityRead,
  subscribeActivity,
  type ActivityEntry,
} from "@/components/portal/activity";

export const Route = createFileRoute("/portal/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — approvU Portal" },
      {
        name: "description",
        content: "All your application, document, offer, and wallet alerts in one feed.",
      },
    ],
  }),
  component: NotificationsPage,
});

type Category =
  | "Application"
  | "Document"
  | "Offer"
  | "Condition"
  | "Message"
  | "Wallet"
  | "System"
  | "Security";

type Notif = {
  id: string;
  category: Category;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
  applicationId?: string;
};

const ICONS: Record<Category, typeof Bell> = {
  Application: Sparkles,
  Document: FileText,
  Offer: HandCoins,
  Condition: ListChecks,
  Message: MessageSquare,
  Wallet: Wallet,
  System: Bell,
  Security: ShieldCheck,
};
const TONES: Record<Category, string> = {
  Application: "bg-primary/10 text-primary",
  Document: "bg-secondary/15 text-secondary",
  Offer: "bg-mint/30 text-foreground",
  Condition: "bg-yellow/30 text-foreground",
  Message: "bg-muted text-foreground",
  Wallet: "bg-coral/15 text-coral",
  System: "bg-muted text-muted-foreground",
  Security: "bg-secondary/15 text-secondary",
};

function NotificationsPage() {
  const [feed, setFeed] = useState<ActivityEntry[]>(() => getActivity());
  useEffect(() => subscribeActivity(() => setFeed(getActivity())), []);

  const items: Notif[] = useMemo(() => {
    return feed.map((e) => ({
      id: e.id,
      category: e.category as Category,
      title: e.title,
      body: e.body ?? "",
      at: relativeTime(e.at),
      read: e.read,
      href: e.href,
    }));
  }, [feed]);

  const [filter, setFilter] = useState<"all" | "unread" | Category>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((n) => !n.read);
    return items.filter((n) => n.category === filter);
  }, [items, filter]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="One feed for everything happening on your file — documents, offers, conditions, and more."
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                markActivityRead();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark all read
            </button>
            <Link
              to="/portal/settings/notifications"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Settings2 className="h-4 w-4" /> Preferences
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {(
          [
            "all",
            "unread",
            "Application",
            "Document",
            "Offer",
            "Condition",
            "Message",
            "Wallet",
            "Security",
            "System",
          ] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {f === "all" ? `All (${items.length})` : f === "unread" ? `Unread (${unread})` : f}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 && (
          <li className="p-10 text-center">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No notifications yet.</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Application updates, document reminders, and offer updates will appear here as
                  your file progresses.
                </p>
                <Link
                  to="/portal/applications"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  View application status →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
            )}
          </li>
        )}
        {filtered.map((n) => {
          const Icon = ICONS[n.category];
          const body = (
            <div
              className={`flex items-start gap-3 p-4 transition ${n.read ? "" : "bg-primary/[0.03]"}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONES[n.category]}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {n.title}
                    {!n.read && (
                      <CircleDot className="ml-1 inline h-3 w-3 text-coral" aria-label="Unread" />
                    )}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{n.at}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                    {n.category}
                  </span>
                  {n.applicationId && (
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                      #{n.applicationId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
          return (
            <li key={n.id}>
              <button
                onClick={() => {
                  markActivityRead(n.id);
                }}
                className="block w-full text-left hover:bg-muted/30"
              >
                {n.applicationId && !n.href ? (
                  <Link
                    to="/portal/applications/$applicationId"
                    params={{ applicationId: n.applicationId }}
                    className="block"
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}
