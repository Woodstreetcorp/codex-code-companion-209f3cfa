import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  HandCoins,
  ListChecks,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
  Filter,
} from "lucide-react";
import {
  ApplicationShell,
  NotFoundApplication,
  getApplicationSummary,
  type AppSummary,
} from "@/components/portal/application-shell";
import {
  getActivity,
  subscribeActivity,
  type ActivityCategory,
  type ActivityEntry,
} from "@/components/portal/activity";

export const Route = createFileRoute("/portal/applications/$applicationId/timeline")({
  head: () => ({
    meta: [
      { title: "Application Timeline — approvU" },
      {
        name: "description",
        content:
          "Step-by-step status of your mortgage application — every milestone, decision, and request.",
      },
    ],
  }),
  component: TimelinePage,
});

type TimelineEntry = {
  id: string;
  category: ActivityCategory;
  title: string;
  body?: string;
  href?: string;
  at: string; // ISO
  source: "system" | "activity";
  milestone?: boolean;
};

/**
 * Mock application_activity_log for this borrower view. Codex will replace
 * this with a query against:
 *   application_activity_log
 *     id, application_id, category, title, body, href, actor, occurred_at,
 *     is_milestone
 */
function mockApplicationLog(summary: AppSummary): TimelineEntry[] {
  const now = new Date();
  const days = (n: number) =>
    new Date(now.getTime() - n * 86_400_000).toISOString();

  const base: TimelineEntry[] = [
    {
      id: "log_created",
      category: "Application",
      title: "Application created",
      body: `${summary.type} application opened for ${summary.property}.`,
      at: days(14),
      source: "system",
      milestone: true,
    },
    {
      id: "log_snapshot",
      category: "Application",
      title: "Mortgage Snapshot completed",
      body: "Initial qualification ran successfully.",
      at: days(13),
      source: "system",
      milestone: true,
    },
    {
      id: "log_profile",
      category: "Application",
      title: "Borrower profile completed",
      body: "Identity, address history, employment, and income captured.",
      at: days(11),
      source: "system",
    },
    {
      id: "log_docs",
      category: "Document",
      title: "Initial documents uploaded",
      body: "T4, NOA, pay stub, and ID added to your Vault.",
      href: `/portal/applications/${summary.id}/documents`,
      at: days(9),
      source: "system",
    },
    {
      id: "log_offers",
      category: "Offer",
      title: "Qualified offers generated",
      body: "Curated lender shortlist based on your profile and policy fit.",
      href: `/portal/applications/${summary.id}/offers`,
      at: days(7),
      source: "system",
      milestone: true,
    },
  ];

  if (summary.bucket === "Submitted" || summary.bucket === "Completed") {
    base.push(
      {
        id: "log_submit",
        category: "Application",
        title: "Application submitted to advisor",
        body: "Your file is in review before lender submission.",
        at: days(5),
        source: "system",
        milestone: true,
      },
      {
        id: "log_lender",
        category: "Application",
        title: "Submitted to lender",
        body: summary.broker
          ? `Sent by ${summary.broker}.`
          : "Sent to lender for underwriting.",
        at: days(4),
        source: "system",
        milestone: true,
      },
    );
  }

  if (summary.bucket === "Submitted" && summary.conditionsOutstanding > 0) {
    base.push({
      id: "log_conditions",
      category: "Condition",
      title: `${summary.conditionsOutstanding} condition${summary.conditionsOutstanding === 1 ? "" : "s"} outstanding`,
      body: "Lender requested additional documentation.",
      href: `/portal/applications/${summary.id}/conditions`,
      at: days(2),
      source: "system",
    });
  }

  if (summary.bucket === "Completed") {
    base.push(
      {
        id: "log_approved",
        category: "Application",
        title: "Lender approved",
        at: days(3),
        source: "system",
        milestone: true,
      },
      {
        id: "log_closing",
        category: "Application",
        title: "Ready for closing",
        body: "Closing package sent to your lawyer.",
        at: days(2),
        source: "system",
        milestone: true,
      },
      {
        id: "log_funded",
        category: "Application",
        title: "Funded & closed",
        body: "Welcome to your new mortgage.",
        at: days(0),
        source: "system",
        milestone: true,
      },
    );
  }

  return base;
}

const CATEGORY_META: Record<
  ActivityCategory,
  { icon: typeof Sparkles; tone: string }
> = {
  Application: { icon: Sparkles, tone: "bg-secondary/15 text-secondary border-secondary/30" },
  Document:    { icon: FileText, tone: "bg-primary/10 text-primary border-primary/30" },
  Offer:       { icon: HandCoins, tone: "bg-mint/25 text-mint-foreground border-mint/40" },
  Condition:   { icon: ListChecks, tone: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/40" },
  Message:     { icon: MessageSquare, tone: "bg-secondary/10 text-secondary border-secondary/30" },
  Wallet:      { icon: Wallet, tone: "bg-primary/10 text-primary border-primary/30" },
  System:      { icon: Clock, tone: "bg-muted text-muted-foreground border-border" },
  Security:    { icon: ShieldCheck, tone: "bg-coral/10 text-coral border-coral/30" },
};

const FILTERS: { key: "all" | ActivityCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Application", label: "Milestones" },
  { key: "Document", label: "Documents" },
  { key: "Offer", label: "Offers" },
  { key: "Condition", label: "Conditions" },
  { key: "Message", label: "Messages" },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function activityToEntry(a: ActivityEntry): TimelineEntry {
  return {
    id: a.id,
    category: a.category,
    title: a.title,
    body: a.body,
    href: a.href,
    at: a.at,
    source: "activity",
  };
}

function TimelinePage() {
  const { applicationId } = Route.useParams();
  const summary = getApplicationSummary(applicationId);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  useEffect(() => {
    setActivity(getActivity());
    return subscribeActivity(() => setActivity(getActivity()));
  }, []);

  const entries = useMemo(() => {
    if (!summary) return [] as TimelineEntry[];
    const merged = [...mockApplicationLog(summary), ...activity.map(activityToEntry)];
    const filtered =
      filter === "all"
        ? merged
        : filter === "Application"
          ? merged.filter((e) => e.milestone || e.category === "Application")
          : merged.filter((e) => e.category === filter);
    return filtered.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [summary, activity, filter]);

  if (!summary) return <NotFoundApplication id={applicationId} />;

  // Group by day for nicer scanning.
  const groups = entries.reduce<Record<string, TimelineEntry[]>>((acc, e) => {
    const k = dayKey(e.at);
    (acc[k] ||= []).push(e);
    return acc;
  }, {});

  const total = entries.length;

  return (
    <ApplicationShell summary={summary} tab="timeline">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-secondary/15 p-2 text-secondary">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {total} event{total === 1 ? "" : "s"} on this application
            </p>
            <p className="text-xs text-muted-foreground">
              Auto-updated as your file moves through review, lender, and funding.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Circle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">No events yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Activity will appear here as your application progresses.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([day, items]) => (
            <section key={day}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {day}
              </p>
              <ol className="relative space-y-3 border-l border-border pl-5">
                {items.map((e) => {
                  const meta = CATEGORY_META[e.category];
                  const Icon = e.milestone ? CheckCircle2 : meta.icon;
                  return (
                    <li key={e.id} className="relative">
                      <span
                        className={`absolute -left-[26px] flex h-6 w-6 items-center justify-center rounded-full border ${meta.tone}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="rounded-xl border border-border bg-card p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{e.title}</p>
                            {e.body && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{e.body}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {e.milestone && (
                              <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-mint-foreground">
                                Milestone
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {fmtDate(e.at)}
                            </span>
                          </div>
                        </div>
                        {e.href && (
                          <a
                            href={e.href}
                            className="mt-2 inline-flex text-[11px] font-semibold text-primary hover:text-primary/80"
                          >
                            View details →
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          Looking for something specific? Browse all account activity in one place.
        </p>
        <Link
          to="/portal/notifications"
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Open notifications
        </Link>
      </div>
    </ApplicationShell>
  );
}