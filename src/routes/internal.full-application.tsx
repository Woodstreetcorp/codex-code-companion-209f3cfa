import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { z } from "zod";
import { QualificationSummaryContent } from "./portal.applications.$applicationId.qualification-summary";
import { PreQualifiedCertificateContent } from "@/components/hub/pre-qualified-certificate";
import { MortgageApplicationContent } from "@/components/hub/mortgage-application";
import { DocumentUploadContent } from "@/components/hub/document-upload";
import { LenderResponseContent } from "@/components/hub/lender-response";
import { FundingConditionsContent } from "@/components/hub/funding-conditions";
import { ExclusiveOffersContent } from "@/components/hub/exclusive-offers";
import {
  APPLICATION,
  PRE_PURCHASE_WIDGETS,
  PURCHASE_WIDGETS,
  REFINANCE_WIDGETS,
  SELECTED_OFFER,
  type Widget,
} from "@/components/hub/mortgage-application";

const SECTION_SLUGS = [
  "overview",
  "qualification-summary",
  "pre-qualified-certificate",
  "mortgage-application",
  "exclusive-offers",
  "document-upload",
  "lender-response",
  "funding-conditions",
] as const;
type SectionSlug = (typeof SECTION_SLUGS)[number];

const LABEL_TO_SLUG: Record<string, SectionSlug> = {
  "Application Overview": "overview",
  "Qualification Summary": "qualification-summary",
  "Pre-Qualified Certificate": "pre-qualified-certificate",
  "Mortgage Application": "mortgage-application",
  "Exclusive Offers": "exclusive-offers",
  "Document Upload": "document-upload",
  "Lender Response": "lender-response",
  "Funding Conditions": "funding-conditions",
};
const SLUG_TO_LABEL: Record<SectionSlug, string> = Object.fromEntries(
  Object.entries(LABEL_TO_SLUG).map(([k, v]) => [v, k]),
) as Record<SectionSlug, string>;

const SECTION_META: Record<SectionSlug, { title: string; description: string }> = {
  "overview": {
    title: "approvU — Application Hub",
    description:
      "Track your mortgage application progress, complete required sections, and access your exclusive offers.",
  },
  "qualification-summary": {
    title: "approvU — Qualification Summary",
    description: "Review your qualification summary before continuing your mortgage application.",
  },
  "pre-qualified-certificate": {
    title: "approvU — Pre-Qualified Certificate",
    description: "View and download your pre-qualified certificate.",
  },
  "mortgage-application": {
    title: "approvU — Mortgage Application",
    description: "Complete your mortgage application sections to submit for lender review.",
  },
  "exclusive-offers": {
    title: "approvU — Exclusive Offers",
    description: "Explore the Home Life Bundle benefits available with your application.",
  },
  "document-upload": {
    title: "approvU — Document Upload",
    description: "Upload required supporting documents for your mortgage application.",
  },
  "lender-response": {
    title: "approvU — Lender Response",
    description: "Track lender responses and offers for your mortgage application.",
  },
  "funding-conditions": {
    title: "approvU — Funding Conditions",
    description: "Complete the final funding conditions for your mortgage.",
  },
};

export const Route = createFileRoute("/internal/full-application")({
  validateSearch: z.object({
    section: z.enum(SECTION_SLUGS).optional(),
  }),
  head: ({ match }) => {
    const slug = (match.search as { section?: SectionSlug }).section ?? "overview";
    const meta = SECTION_META[slug];
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
      ],
    };
  },
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
  { label: "Document Upload", icon: Upload, status: "active" },
  { label: "Lender Response", icon: MessageCircle, status: "active" },
  { label: "Funding Conditions", icon: Flag, status: "active" },
];

// Bundle benefits surfaced from selected offer
const BUNDLE_BENEFITS = [
  { label: "$500 Moving Expense Credit", value: "$500" },
  { label: "2 Months Free Home Insurance", value: "$350" },
  { label: "No Brokerage Fees", value: "$1,200" },
  { label: "Smart Home Starter Kit", value: "$300" },
];

function widgetsForTx(tx: typeof APPLICATION.type): Widget[] {
  if (tx === "Pre-Purchase") return PRE_PURCHASE_WIDGETS;
  if (tx === "Refinance" || tx === "Renewal") return REFINANCE_WIDGETS;
  return PURCHASE_WIDGETS;
}

function deriveOverview() {
  const widgets = widgetsForTx(APPLICATION.type);
  const total = widgets.length;
  const sectionsComplete = widgets.filter(
    (w) => w.status === "Complete" || w.status === "Selected",
  ).length;
  const remaining = total - sectionsComplete;
  const completion = Math.round(
    widgets.reduce((sum, w) => sum + w.progress, 0) / Math.max(total, 1),
  );

  // Next incomplete actionable widget within the mortgage application
  const nextWidget = widgets.find(
    (w) => !w.locked && w.status !== "Complete" && w.status !== "Selected",
  );
  const lockedRemaining = widgets.filter((w) => w.locked).length;

  return {
    widgets,
    total,
    sectionsComplete,
    remaining,
    completion,
    nextWidget,
    lockedRemaining,
  };
}

type NextStep = {
  title: string;
  body: string;
  cta: string;
  tone: "urgent" | "accent" | "neutral";
  icon: ComponentType<{ className?: string }>;
  section: SectionSlug;
};

function buildNextSteps(): NextStep[] {
  const o = deriveOverview();
  const steps: NextStep[] = [];

  if (o.remaining > 0) {
    steps.push({
      title: "Complete Mortgage Application",
      body: o.nextWidget
        ? `${o.remaining} section${o.remaining === 1 ? "" : "s"} remaining — next: ${o.nextWidget.title}.`
        : `${o.remaining} sections remaining.`,
      cta: "Continue Application",
      tone: "urgent",
      icon: FileCheck,
      section: "mortgage-application",
    });
  } else {
    steps.push({
      title: "Submit Application",
      body: "All required sections are complete — submit for lender review.",
      cta: "Review & Submit",
      tone: "urgent",
      icon: FileCheck,
      section: "mortgage-application",
    });
  }

  steps.push({
    title: "Review Exclusive Offers",
    body: `Explore your Home Life Bundle benefits worth ${SELECTED_OFFER.bundle}.`,
    cta: "View Offers",
    tone: "accent",
    icon: Gift,
    section: "exclusive-offers",
  });

  steps.push({
    title: "Prepare Documents",
    body: "Get ready to upload supporting documents for lender review.",
    cta: "See Requirements",
    tone: "neutral",
    icon: Upload,
    section: "document-upload",
  });

  return steps;
}

function buildMilestones(): {
  title: string;
  body: string;
  meta?: string;
  state: "complete" | "active" | "upcoming" | "locked";
}[] {
  const o = deriveOverview();
  const appComplete = o.remaining === 0;
  return [
    {
      title: "Pre-Qualification Complete",
      body: "Your qualification summary has been generated",
      state: "complete",
    },
    {
      title: "Application in Progress",
      body: appComplete
        ? "All sections complete — ready to submit"
        : `Complete ${o.remaining} of ${o.total} remaining section${o.remaining === 1 ? "" : "s"}`,
      meta: appComplete ? "Ready for submission" : `${o.completion}% complete`,
      state: appComplete ? "complete" : "active",
    },
    {
      title: "Document Upload",
      body: "Upload required documents for verification",
      meta: appComplete ? "Ready to start" : "Available after application",
      state: appComplete ? "active" : "upcoming",
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
}

// ─── Page ────────────────────────────────────────────────────────────────
function ApplicationHub() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const activeSlug: SectionSlug = search.section ?? "overview";
  const activeTab = SLUG_TO_LABEL[activeSlug];
  const setActiveTab = (label: string) => {
    const slug = LABEL_TO_SLUG[label];
    if (!slug) return;
    navigate({
      to: "/internal/full-application",
      search: slug === "overview" ? {} : { section: slug },
    });
  };

  // Derive everything from the Mortgage Application hub data
  const overview = deriveOverview();
  const nextSteps = buildNextSteps();
  const milestones = buildMilestones();
  const urgentCount = nextSteps.filter((s) => s.tone === "urgent").length;
  const totalBenefits = BUNDLE_BENEFITS.reduce(
    (sum, b) => sum + Number(b.value.replace(/[^0-9.]/g, "")),
    0,
  );
  const totalBenefitsFmt = `$${totalBenefits.toLocaleString()}`;
  const hubNav = HUB_NAV.map((item) =>
    item.label === "Mortgage Application"
      ? { ...item, progress: overview.completion }
      : item,
  );

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
                {hubNav.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => item.status !== "locked" && setActiveTab(item.label)}
                      disabled={item.status === "locked"}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        activeTab === item.label
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
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Rate</dt>
                    <dd className="mt-0.5 text-base font-semibold text-foreground">{SELECTED_OFFER.rate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Offer</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-foreground">{SELECTED_OFFER.name}</dd>
                  </div>
                </dl>
                <p className="text-[11px] text-muted-foreground">{SELECTED_OFFER.path}</p>

                <div className="rounded-xl bg-muted p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Monthly Payment
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-foreground">{SELECTED_OFFER.monthly}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Total Benefits</span>
                    <span className="text-base font-semibold text-mint">{totalBenefitsFmt}</span>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {BUNDLE_BENEFITS.map((b) => (
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
              You're just a few steps away from securing your exclusive benefits worth {totalBenefitsFmt}.
            </Notice>
          </aside>

          {/* Main column */}
          <section className="space-y-6">
            {activeTab === "Qualification Summary" ? (
              <QualificationSummaryContent />
            ) : activeTab === "Pre-Qualified Certificate" ? (
              <PreQualifiedCertificateContent />
            ) : activeTab === "Mortgage Application" ? (
              <MortgageApplicationContent />
            ) : activeTab === "Document Upload" ? (
              <DocumentUploadContent />
            ) : activeTab === "Lender Response" ? (
              <LenderResponseContent />
            ) : activeTab === "Funding Conditions" ? (
              <FundingConditionsContent />
            ) : activeTab === "Exclusive Offers" ? (
              <ExclusiveOffersContent />
            ) : activeTab === "Application Overview" ? (
              <>
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
                <span className="font-semibold text-foreground">{overview.completion}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-secondary"
                  style={{ width: `${overview.completion}%` }}
                />
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Circle className="h-3.5 w-3.5" /> {overview.sectionsComplete} of {overview.total} sections complete · Application #{APPLICATION.id}
              </p>
            </Card>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={BarChart3}
                tone="secondary"
                label="Application Progress"
                value={`${overview.completion}%`}
                hint={`Updated ${APPLICATION.lastUpdated}`}
              />
              <StatCard
                icon={CheckCircle2}
                tone="mint"
                label="Sections Complete"
                value={`${overview.sectionsComplete}/${overview.total}`}
                hint={`${overview.remaining} remaining`}
              />
              <StatCard
                icon={DollarSign}
                tone="primary"
                label="Estimated Monthly"
                value={SELECTED_OFFER.monthly}
                hint={`Based on ${SELECTED_OFFER.rate} rate`}
              />
              <StatCard
                icon={Award}
                tone="coral"
                label="Total Benefits"
                value={totalBenefitsFmt}
                hint="Home Life Bundle"
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
                {urgentCount > 0 && (
                  <span className="rounded-full border border-coral/30 bg-coral/10 px-2.5 py-0.5 text-xs font-semibold text-coral">
                    {urgentCount} Urgent
                  </span>
                )}
              </div>

              <ul className="mt-5 space-y-3">
                {nextSteps.map((s) => (
                  <NextStepRow
                    key={s.title}
                    step={s}
                    onClick={() => setActiveTab(SLUG_TO_LABEL[s.section])}
                  />
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
                {milestones.map((m, i) => (
                  <Milestone key={m.title} milestone={m} isLast={i === milestones.length - 1} />
                ))}
              </ol>
            </Card>
              </>
            ) : (
              <Card>
                <h2 className="text-lg font-semibold text-primary">{activeTab}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This section is coming soon.
                </p>
              </Card>
            )}
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
  onClick,
}: {
  step: {
    title: string;
    body: string;
    cta: string;
    tone: "urgent" | "accent" | "neutral";
    icon: ComponentType<{ className?: string }>;
  };
  onClick?: () => void;
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
        onClick={onClick}
        className={`shrink-0 inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium ${
          step.tone === "neutral"
            ? "border border-input bg-background text-foreground hover:bg-muted"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
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
