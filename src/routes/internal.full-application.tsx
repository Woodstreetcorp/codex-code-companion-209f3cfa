import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Circle,
  DollarSign,
  FileCheck,
  FileText,
  Flag,
  Gift,
  Lock,
  MessageCircle,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export const Route = createFileRoute("/internal/full-application")({
  head: () => ({
    meta: [
      { title: "approvU — Application Hub" },
      {
        name: "description",
        content:
          "Track your mortgage application progress, complete required sections, and access your exclusive offers.",
      },
    ],
  }),
  component: ApplicationHub,
});

// ─── Mock data ───────────────────────────────────────────────────────────
type HubStatus = "active" | "complete" | "upcoming" | "locked";

const HUB_NAV: { label: string; icon: ComponentType<{ className?: string }>; status: HubStatus; progress?: number }[] = [
  { label: "Application Overview", icon: BarChart3, status: "active" },
  { label: "Qualification Summary", icon: FileText, status: "complete" },
  { label: "Pre-Qualified Certificate", icon: CheckCircle2, status: "complete" },
  { label: "Mortgage Application", icon: FileCheck, status: "active", progress: 0 },
  { label: "Exclusive Offers", icon: Gift, status: "active" },
  { label: "Document Upload", icon: Upload, status: "locked" },
  { label: "Lender Response", icon: MessageCircle, status: "locked" },
  { label: "Funding Conditions", icon: Flag, status: "locked" },
];

const OFFER = {
  rate: "5.25%",
  term: "5-yr",
  type: "Fixed",
  monthly: "$1,250.76",
  totalBenefits: "$2,350",
  benefits: [
    { label: "$500 Moving Expense Credit", value: "$500" },
    { label: "2 Months Free Home Insurance", value: "$350" },
    { label: "No Brokerage Fees", value: "$1,200" },
    { label: "Smart Home Starter Kit", value: "$300" },
  ],
};

const NEXT_STEPS = [
  {
    title: "Complete Mortgage Application",
    body: "3 sections remaining: Assets, Liabilities, and Declarations",
    cta: "Continue Application",
    tone: "urgent" as const,
    icon: FileCheck,
  },
  {
    title: "Review Exclusive Offers",
    body: "Explore your Home Life Bundle benefits worth $2,350",
    cta: "View Offers",
    tone: "accent" as const,
    icon: Gift,
  },
  {
    title: "Prepare Documents",
    body: "Get ready to upload documents",
    cta: "See Requirements",
    tone: "neutral" as const,
    icon: Upload,
  },
];

const MILESTONES: {
  title: string;
  body: string;
  meta?: string;
  state: "complete" | "active" | "upcoming" | "locked";
}[] = [
  {
    title: "Pre-Qualification Complete",
    body: "Your qualification summary has been generated",
    state: "complete",
  },
  {
    title: "Application in Progress",
    body: "Complete all sections of your mortgage application",
    meta: "Complete by Jan 20, 2027",
    state: "active",
  },
  {
    title: "Document Upload",
    body: "Upload required documents for verification",
    meta: "Available after application",
    state: "upcoming",
  },
  {
    title: "Lender Review",
    body: "Lenders review your application and send offers",
    meta: "Est. 2–3 business days",
    state: "locked",
  },
  {
    title: "Funding Conditions",
    body: "Complete final requirements to fund your mortgage",
    meta: "Est. 5–10 business days",
    state: "locked",
  },
  {
    title: "Mortgage Funded",
    body: "Your mortgage is approved and ready to close",
    meta: "Est. closing date",
    state: "locked",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────
function ApplicationHub() {
  const appCompletion = 65;
  const sectionsComplete = "0/8";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-lg font-semibold tracking-tight">approvU</span>
          </Link>
          <Link
            to="/internal/borrower-dashboard"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
          >
            Back to Portal
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Left rail */}
          <aside className="space-y-5">
            {/* Application Hub menu */}
            <nav className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="bg-primary px-4 py-3 text-primary-foreground">
                <h2 className="text-sm font-semibold tracking-tight">Application Hub</h2>
              </div>
              <ul className="p-2">
                {HUB_NAV.map((item, idx) => (
                  <li key={item.label}>
                    <button
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        idx === 0
                          ? "bg-primary text-primary-foreground"
                          : item.status === "locked"
                            ? "text-muted-foreground hover:bg-muted/60"
                            : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.status === "locked" && <Lock className="h-3.5 w-3.5" />}
                    </button>
                    {item.progress !== undefined && (
                      <div className="px-3 pb-2 pt-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-secondary"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-right text-[10px] font-medium text-muted-foreground">
                          {item.progress.toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Mortgage Offer widget */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="bg-primary px-4 py-3 text-primary-foreground">
                <h2 className="text-sm font-semibold tracking-tight">Your Mortgage Offers</h2>
              </div>
              <div className="space-y-4 p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">From</p>
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Rate</dt>
                    <dd className="mt-0.5 text-base font-semibold text-foreground">{OFFER.rate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Term</dt>
                    <dd className="mt-0.5 text-base font-semibold text-foreground">{OFFER.term}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="mt-0.5 text-base font-semibold text-foreground">{OFFER.type}</dd>
                  </div>
                </dl>

                <div className="rounded-xl bg-muted p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Monthly Payment
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-foreground">{OFFER.monthly}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Total Benefits</span>
                    <span className="text-base font-semibold text-mint">{OFFER.totalBenefits}</span>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {OFFER.benefits.map((b) => (
                      <li
                        key={b.label}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="flex items-center gap-2 text-foreground">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                            <DollarSign className="h-3.5 w-3.5" />
                          </span>
                          {b.label}
                        </span>
                        <span className="font-semibold text-mint">{b.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <Notice tone="warning" icon={AlertCircle} title="Important Notice">
              Your mortgage offer is based on your pre-qualification information. Changes to your
              details may affect your offered terms.
            </Notice>

            {/* Complete your application */}
            <Notice tone="info" icon={AlertCircle} title="Complete your application">
              You're just a few steps away from securing your exclusive benefits worth $2,350.
            </Notice>
          </aside>

          {/* Main column */}
          <section className="space-y-6">
            <header>
              <h1 className="text-2xl font-semibold text-primary sm:text-3xl">
                Application Overview
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your progress and complete your mortgage application
              </p>
            </header>

            {/* Overall Progress */}
            <Card>
              <h2 className="text-lg font-semibold text-primary">Overall Progress</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You're making great progress! Keep going.
              </p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Application Completion</span>
                <span className="font-semibold text-foreground">{appCompletion}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-secondary"
                  style={{ width: `${appCompletion}%` }}
                />
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Circle className="h-3.5 w-3.5" /> Estimated time remaining: 5–10 minutes
              </p>
            </Card>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={BarChart3}
                tone="secondary"
                label="Application Progress"
                value={`${appCompletion}%`}
                hint="+1% this week"
              />
              <StatCard
                icon={CheckCircle2}
                tone="mint"
                label="Sections Complete"
                value={sectionsComplete}
                hint="8 remaining"
              />
              <StatCard
                icon={DollarSign}
                tone="primary"
                label="Estimated Monthly"
                value={OFFER.monthly}
                hint={`Based on ${OFFER.rate} rate`}
              />
              <StatCard
                icon={Award}
                tone="coral"
                label="Total Benefits"
                value={OFFER.totalBenefits}
                hint="Exclusive offers"
              />
            </div>

            {/* Next Steps */}
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Next Steps</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Priority actions to move your application forward
                  </p>
                </div>
                <span className="rounded-full border border-coral/30 bg-coral/10 px-2.5 py-0.5 text-xs font-semibold text-coral">
                  1 Urgent
                </span>
              </div>

              <ul className="mt-5 space-y-3">
                {NEXT_STEPS.map((s) => (
                  <NextStepRow key={s.title} step={s} />
                ))}
              </ul>
            </Card>

            {/* Application Milestones */}
            <Card>
              <h2 className="text-lg font-semibold text-primary">Application Milestones</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your progress from pre-qualification to funding
              </p>

              <ol className="mt-6 space-y-5">
                {MILESTONES.map((m, i) => (
                  <Milestone key={m.title} milestone={m} isLast={i === MILESTONES.length - 1} />
                ))}
              </ol>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">{children}</div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: "primary" | "secondary" | "mint" | "coral";
  label: string;
  value: string;
  hint?: string;
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    mint: "bg-mint/20 text-foreground",
    coral: "bg-coral/15 text-coral",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NextStepRow({
  step,
}: {
  step: {
    title: string;
    body: string;
    cta: string;
    tone: "urgent" | "accent" | "neutral";
    icon: ComponentType<{ className?: string }>;
  };
}) {
  const Icon = step.icon;
  const accent = {
    urgent: "border-l-secondary bg-secondary/5",
    accent: "border-l-coral bg-coral/5",
    neutral: "border-l-border bg-card",
  }[step.tone];
  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border border-border border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between ${accent}`}
    >
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-background p-2 text-primary shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{step.title}</p>
            {step.tone === "urgent" && (
              <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-coral-foreground">
                Urgent
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{step.body}</p>
        </div>
      </div>
      <button
        className={`shrink-0 inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium ${
          step.tone === "neutral"
            ? "border border-input bg-background text-foreground hover:bg-muted"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {step.cta} <ArrowRight className="ml-1 h-4 w-4" />
      </button>
    </li>
  );
}

function Milestone({
  milestone,
  isLast,
}: {
  milestone: {
    title: string;
    body: string;
    meta?: string;
    state: "complete" | "active" | "upcoming" | "locked";
  };
  isLast: boolean;
}) {
  const state = milestone.state;
  const dot = {
    complete: "bg-mint text-mint-foreground",
    active: "bg-secondary text-secondary-foreground",
    upcoming: "bg-muted text-muted-foreground",
    locked: "bg-muted text-muted-foreground",
  }[state];
  const Glyph =
    state === "complete"
      ? CheckCircle2
      : state === "locked"
        ? Lock
        : state === "upcoming"
          ? Circle
          : Circle;
  const badge = {
    complete: { label: "Complete", cls: "bg-mint/20 text-foreground" },
    active: { label: "Active", cls: "bg-secondary/15 text-secondary" },
    upcoming: { label: "Upcoming", cls: "bg-muted text-muted-foreground" },
    locked: { label: "Locked", cls: "bg-muted text-muted-foreground" },
  }[state];

  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${dot}`}>
          <Glyph className="h-4 w-4" />
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="flex-1 pb-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className={`text-sm font-semibold ${state === "locked" || state === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}
          >
            {milestone.title}
          </p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{milestone.body}</p>
        {milestone.meta && (
          <p className="mt-1.5 text-[11px] text-muted-foreground/80">{milestone.meta}</p>
        )}
      </div>
    </li>
  );
}

function Notice({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "warning" | "info";
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  const cls =
    tone === "warning"
      ? "border-yellow/50 bg-yellow/15"
      : "border-secondary/30 bg-secondary/10";
  const iconCls = tone === "warning" ? "text-foreground" : "text-secondary";
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold ${iconCls}`}>
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <p className="mt-1.5 text-xs text-foreground/80">{children}</p>
    </div>
  );
}
