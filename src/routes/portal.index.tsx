import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Lock,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  ACTIVE,
  COMPLETED,
  CONDITIONS,
  DOCUMENTS,
  EXPIRED,
  MAX_ACTIVE_APPLICATIONS,
  SUBMITTED,
  TOOLS,
  getCounts,
} from "@/components/portal/data";
import {
  ActiveCard,
  Alert,
  Card,
  CardHeader,
  PageHeader,
  StatusPill,
  SubmittedCard,
  SummaryCard,
} from "@/components/portal/ui";

export const Route = createFileRoute("/portal/")({
  head: () => ({
    meta: [
      { title: "Your Mortgage & Home Portal — approvU" },
      {
        name: "description",
        content:
          "Track your applications, review your mortgage offers, upload documents, and access your Home Life benefits in one place.",
      },
    ],
  }),
  component: PortalDashboard,
});

const FIRST_NAME = "Alex";

const ACTIVITY = [
  { date: "May 11", text: "You selected the Best Value Fixed Offer" },
  { date: "May 10", text: "Mortgage snapshot completed" },
  { date: "May 9", text: "Application APP-2041 started" },
  { date: "May 9", text: "Income document requested by your broker" },
];

const OFFERS_PREVIEW = [
  { name: "Best Value Fixed Offer", rate: "4.89%", payment: "$2,358/mo", benefit: "$2,350", selected: true },
  { name: "Lowest Payment Variable", rate: "5.10%", payment: "$2,294/mo", benefit: "$1,950", selected: false },
  { name: "Flexible Open Term", rate: "5.45%", payment: "$2,461/mo", benefit: "$1,400", selected: false },
];

function PortalDashboard() {
  const counts = getCounts();
  const atLimit = counts.active >= MAX_ACTIVE_APPLICATIONS;
  const hasFunded = COMPLETED.length > 0;
  const activeIncomplete = ACTIVE[0];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-secondary p-6 text-primary-foreground shadow-sm sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-secondary/40 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Welcome back, {FIRST_NAME}
          </p>
          <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Your Mortgage &amp; Home Portal
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80 sm:text-base">
            Track your applications, review your mortgage offers, upload documents, and access your
            Home Life benefits in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {activeIncomplete ? (
              <Link
                to="/internal/full-application"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-white/90"
              >
                Continue Application <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            ) : (
              <button
                disabled={atLimit}
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Start a New Mortgage Snapshot
              </button>
            )}
            <Link
              to="/portal/applications"
              className="inline-flex items-center justify-center rounded-md border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur transition hover:bg-white/20"
            >
              View Applications
            </Link>
          </div>
        </div>
      </section>

      {atLimit && (
        <Alert tone="warning">
          You have reached the maximum of {MAX_ACTIVE_APPLICATIONS} active applications. Complete,
          submit, cancel, or let one expire before starting another.
        </Alert>
      )}

      {/* Next Best Action */}
      {activeIncomplete && (
        <section
          aria-label="Next best action"
          className="rounded-3xl border border-secondary/30 bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-secondary/15 p-3 text-secondary">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                  Next best action
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  Continue your purchase application
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  APP-{activeIncomplete.id.replace(/^APP-/, "")} · {activeIncomplete.property}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-yellow/30 px-2.5 py-1 text-xs font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5" /> Expires in {activeIncomplete.daysToExpiry} days
                </div>
              </div>
            </div>
            <Link
              to="/internal/full-application"
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
            >
              Continue Application <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Summary cards */}
      <section aria-label="Summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard icon={Inbox} label="Active" value={`${counts.active} of ${MAX_ACTIVE_APPLICATIONS}`} tone="primary" />
          <SummaryCard icon={CheckCircle2} label="Submitted" value={String(counts.submitted)} tone="secondary" />
          <SummaryCard icon={FileText} label="Documents" value={`${counts.docsPending} pending`} tone="yellow" />
          <SummaryCard icon={Clock} label="Conditions" value={`${counts.conditions} outstanding`} tone="coral" />
          <SummaryCard icon={Wallet} label="Wallet" value={hasFunded ? `${counts.walletAvailable} available` : "Locked"} tone="secondary" />
        </div>
      </section>

      {/* Applications */}
      <section aria-label="Your applications" className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <PageHeaderLite title="Your Applications" subtitle="Active and recently submitted" />
          </div>
          <Link
            to="/portal/applications"
            className="text-sm font-medium text-secondary hover:underline"
          >
            View all <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ACTIVE.slice(0, 2).map((a) => (
            <ActiveCard key={a.id} app={a} />
          ))}
          {SUBMITTED.slice(0, 1).map((a) => (
            <SubmittedCard key={a.id} app={a} />
          ))}
        </div>
        {EXPIRED.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {EXPIRED.length} expired application{EXPIRED.length > 1 ? "s" : ""} can still be reactivated.{" "}
            <Link to="/portal/applications" className="font-medium text-secondary hover:underline">
              Review
            </Link>
          </p>
        )}
      </section>

      {/* Two-column: Documents/Conditions + Offers */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Documents & Conditions"
            right={
              <Link to="/portal/applications" className="text-xs font-medium text-secondary hover:underline">
                View all
              </Link>
            }
          />
          <ul className="mt-4 divide-y divide-border">
            {[...DOCUMENTS.slice(0, 3), ...CONDITIONS.slice(0, 2).map((c) => ({ ...c, kind: "Condition" }))].slice(0, 5).map((row, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.app} · Due {row.due}
                  </p>
                </div>
                <StatusPill status={row.status} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Mortgage Offers"
            right={
              <span className="text-xs text-muted-foreground">From your latest snapshot</span>
            }
          />
          <div className="mt-4 space-y-3">
            {OFFERS_PREVIEW.map((o) => (
              <div
                key={o.name}
                className={`rounded-xl border p-3.5 ${
                  o.selected ? "border-primary/40 bg-primary/5" : "border-border bg-background"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{o.name}</p>
                  {o.selected && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Selected
                    </span>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Rate</p>
                    <p className="font-semibold text-foreground">{o.rate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment</p>
                    <p className="font-semibold text-foreground">{o.payment}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Benefits</p>
                    <p className="font-semibold text-foreground">{o.benefit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/internal/full-application"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue with Selected Offer <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Card>
      </section>

      {/* Wallet preview */}
      <section>
        {hasFunded ? (
          <Card className="bg-gradient-to-br from-card to-mint/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-mint/30 p-3 text-foreground">
                  <Wallet className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                    Home Life Wallet
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-foreground">
                    HomeStrategy Advantage™
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {counts.walletAvailable} benefits available · $2,350 total value
                  </p>
                </div>
              </div>
              <Link
                to="/portal/wallet"
                className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
              >
                View Wallet <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-muted p-3 text-muted-foreground">
                  <Lock className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Home Life Wallet
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-foreground">
                    Unlocks after your mortgage is funded
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Get legal fee rebates, moving credits, inspection credits, and more.
                  </p>
                </div>
              </div>
              <Link
                to="/portal/wallet"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Learn More
              </Link>
            </div>
          </Card>
        )}
      </section>

      {/* Tools */}
      <section aria-label="Mortgage Tools" className="space-y-4">
        <PageHeaderLite title="Mortgage Tools" subtitle="Quick calculators to plan your next move" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <div
              key={t.key}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-secondary/40 hover:shadow-md"
            >
              <span className="rounded-xl bg-secondary/10 p-2.5 text-secondary">
                <t.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.blurb}</p>
              </div>
              <Calculator className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section>
        <Card>
          <CardHeader title="Recent Activity" />
          <ul className="mt-4 space-y-3">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function PageHeaderLite({ title, subtitle }: { title: string; subtitle?: string }) {
  // Lightweight inline header (PageHeader is reserved for top-of-page hero use)
  void PageHeader;
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}