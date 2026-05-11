import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Gift,
  Home,
  Inbox,
  Lock,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Upload,
  Wallet,
  Bell,
  ShieldCheck,
  User,
  CreditCard,
  KeyRound,
  Eye,
  X,
  Check,
  Smartphone,
  Mail,
  Globe,
} from "lucide-react";

type ToolKey =
  | "payment"
  | "affordability"
  | "refinance"
  | "renewal"
  | "equity"
  | "closing";

export const Route = createFileRoute("/internal/borrower-dashboard")({
  head: () => ({
    meta: [
      { title: "approvU — Your Mortgage & Home Portal" },
      {
        name: "description",
        content:
          "Track applications, upload documents, review mortgage offers, and access Home Life benefits in one place.",
      },
    ],
  }),
  component: BorrowerDashboard,
});

// ─── Business rules ──────────────────────────────────────────────────────
const MAX_ACTIVE_APPLICATIONS = 4;
const ACTIVE_EXPIRY_DAYS = 14;
const EXPIRED_VISIBILITY_DAYS = 90;

// ─── Mock data ───────────────────────────────────────────────────────────
type AppStatus =
  | "Snapshot Complete"
  | "Application Started"
  | "In Progress"
  | "Waiting for Borrower"
  | "Ready to Submit"
  | "Expiring Soon";

type SubmittedStage =
  | "Submitted"
  | "Under Review"
  | "Submitted to Lender"
  | "Lender Decision Pending"
  | "Approved"
  | "Conditions in Progress"
  | "Ready for Closing";

type ActiveApp = {
  id: string;
  type: "Purchase" | "Refinance" | "Pre-Purchase";
  property: string;
  status: AppStatus;
  completion: number;
  daysToExpiry: number;
  nextStep: string;
  lastUpdated: string;
};

type SubmittedApp = {
  id: string;
  type: "Purchase" | "Refinance";
  property: string;
  stage: SubmittedStage;
  progress: number;
  broker: string;
  conditionsOutstanding: number;
  documentsPending: number;
  nextStep: string;
  lastUpdate: string;
};

type ExpiredApp = {
  id: string;
  type: string;
  property: string;
  expiredOn: string;
  reactivateUntil: string;
  daysLeftToReactivate: number;
  completion: number;
};

type CompletedApp = {
  id: string;
  property: string;
  lender: string;
  fundedDate: string;
  amount: string;
  term: string;
  rateType: string;
  maturityDate: string;
  bundleStatus: "Active" | "Pending";
};

const ACTIVE: ActiveApp[] = [
  {
    id: "APP-2041",
    type: "Purchase",
    property: "123 Maple Ave, Toronto, ON",
    status: "In Progress",
    completion: 60,
    daysToExpiry: 8,
    nextStep: "Upload last 2 pay stubs",
    lastUpdated: "2 hours ago",
  },
  {
    id: "APP-2009",
    type: "Refinance",
    property: "44 Beachview Rd, Hamilton, ON",
    status: "Snapshot Complete",
    completion: 25,
    daysToExpiry: 12,
    nextStep: "Select a mortgage offer",
    lastUpdated: "Yesterday",
  },
];

const SUBMITTED: SubmittedApp[] = [
  {
    id: "APP-2033",
    type: "Purchase",
    property: "118 King St W, Toronto, ON",
    stage: "Submitted to Lender",
    progress: 70,
    broker: "Jordan Lee",
    conditionsOutstanding: 3,
    documentsPending: 2,
    nextStep: "Wait for lender decision",
    lastUpdate: "3 days ago",
  },
];

const EXPIRED: ExpiredApp[] = [
  {
    id: "APP-1988",
    type: "Refinance",
    property: "91 Queen St, London, ON",
    expiredOn: "2026-05-01",
    reactivateUntil: "2026-07-30",
    daysLeftToReactivate: 79,
    completion: 40,
  },
];

const COMPLETED: CompletedApp[] = [
  // Empty in this mock; toggle to demo wallet
];

const DOCUMENTS = [
  { name: "Government ID", app: "APP-2041", status: "Received", due: "—" },
  { name: "Last 2 pay stubs", app: "APP-2041", status: "Requested", due: "May 18" },
  { name: "Most recent NOA", app: "APP-2041", status: "Requested", due: "May 18" },
  { name: "Mortgage statement", app: "APP-2009", status: "Received", due: "—" },
  { name: "Property tax bill", app: "APP-2009", status: "Under Review", due: "—" },
];

const CONDITIONS = [
  { name: "Confirm employment letter", app: "APP-2033", status: "Outstanding", due: "May 20" },
  { name: "Provide void cheque", app: "APP-2033", status: "Outstanding", due: "May 20" },
  { name: "Property appraisal", app: "APP-2033", status: "Under Review", due: "—" },
];

const SNAPSHOTS = [
  {
    id: "SNAP-302",
    date: "May 8, 2026",
    type: "Purchase",
    loan: "$480,000",
    path: "Major Bank Path",
    offers: 3,
    status: "Offer Selected",
  },
  {
    id: "SNAP-298",
    date: "Apr 24, 2026",
    type: "Refinance",
    loan: "$320,000",
    path: "Monoline Lender Path",
    offers: 3,
    status: "Snapshot Complete",
  },
];

const TOOLS: { key: ToolKey; name: string; icon: typeof Home; blurb: string }[] = [
  { key: "payment", name: "Mortgage Payment", icon: Calculator, blurb: "Estimate monthly payment for any rate, term, and amortization." },
  { key: "affordability", name: "Affordability", icon: Home, blurb: "See the maximum home price you can afford." },
  { key: "refinance", name: "Refinance Savings", icon: RefreshCw, blurb: "Compare your current mortgage to a refinance scenario." },
  { key: "renewal", name: "Renewal Planner", icon: Clock, blurb: "Plan your renewal payment at a new rate." },
  { key: "equity", name: "Home Equity", icon: Wallet, blurb: "Estimate how much equity you can access today." },
  { key: "closing", name: "Closing Costs", icon: FileText, blurb: "Estimate land transfer tax, legal, and closing fees." },
];

// ─── Component ───────────────────────────────────────────────────────────
function BorrowerDashboard() {
  const [reactivateModal, setReactivateModal] = useState<ExpiredApp | null>(null);
  const [maxModal, setMaxModal] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [openTool, setOpenTool] = useState<ToolKey | null>(null);

  const counts = useMemo(
    () => ({
      active: ACTIVE.length,
      submitted: SUBMITTED.length,
      expired: EXPIRED.length,
      completed: COMPLETED.length,
      docsPending: DOCUMENTS.filter((d) => d.status === "Requested").length,
      docsTotal: DOCUMENTS.length,
      conditions: CONDITIONS.filter((c) => c.status === "Outstanding").length,
      offers: SNAPSHOTS.reduce((s, x) => s + x.offers, 0),
      walletAvailable: COMPLETED.length > 0 ? 4 : 0,
    }),
    [],
  );

  const handleStartSnapshot = () => {
    if (counts.active >= MAX_ACTIVE_APPLICATIONS) {
      setMaxModal(true);
    } else {
      window.location.href = "/";
    }
  };

  const NAV: { id: string; label: string; icon: typeof Home; badge?: string | number }[] = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "submitted", label: "Submitted", icon: ArrowRight, badge: counts.submitted || undefined },
    { id: "active", label: "Active", icon: Inbox, badge: `${counts.active}/${MAX_ACTIVE_APPLICATIONS}` },
    { id: "expired", label: "Expired", icon: Clock, badge: counts.expired || undefined },
    { id: "documents", label: "Documents & Conditions", icon: FileText, badge: counts.docsPending + counts.conditions || undefined },
    { id: "offers", label: "Mortgage Offers", icon: Award, badge: counts.offers || undefined },
    { id: "wallet", label: "Home Life Wallet", icon: Wallet },
    { id: "tools", label: "Mortgage Tools", icon: Calculator },
    { id: "settings", label: "Account Settings", icon: Settings },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-semibold tracking-tight">approvU</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="relative rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-coral" />
            </button>
            <button
              onClick={() => scrollTo("settings")}
              aria-label="Account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-primary-foreground shadow-sm"
            >
              AT
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            Borrower Portal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your Mortgage &amp; Home Portal
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Track applications, manage documents, review mortgage offers, and access Home Life
            benefits — all in one calm place.
          </p>
        </div>

      {/* Mobile section nav */}
      <nav
        aria-label="Dashboard sections"
        className="sticky top-[57px] z-30 -mx-4 mb-6 flex gap-1.5 overflow-x-auto border-b border-border bg-background/90 px-4 py-2 backdrop-blur lg:hidden"
      >
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => scrollTo(n.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeSection === n.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        {/* Desktop sticky side menu */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sections
            </p>
            <ul className="space-y-1">
              {NAV.map((n) => {
                const active = activeSection === n.id;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => scrollTo(n.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <n.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                      <span className="flex-1 truncate">{n.label}</span>
                      {n.badge !== undefined && n.badge !== 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          {n.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <div className="min-w-0">
      {/* Welcome / Hero */}
      <section id="overview" className="scroll-mt-24 rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-secondary/5 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">
              Welcome back, Alex
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              Pick up where you left off.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              You have {counts.active} active {counts.active === 1 ? "application" : "applications"}{" "}
              and {counts.docsPending} pending {counts.docsPending === 1 ? "document" : "documents"}{" "}
              to send.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleStartSnapshot}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Start a New Mortgage Snapshot
            </button>
            {ACTIVE.length > 0 && (
              <Link
                to="/internal/full-application"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Continue Application <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Next Best Action */}
        <NextBestAction
          title="Upload last 2 pay stubs"
          related="APP-2041 · Purchase"
          due="Due May 18, 2026"
          ctaLabel="Upload Now"
        />
      </section>

      {/* Alerts */}
      {(counts.expired > 0 || ACTIVE.some((a) => a.daysToExpiry <= 3)) && (
        <section className="mt-6 space-y-2">
          {ACTIVE.filter((a) => a.daysToExpiry <= 3).map((a) => (
            <Alert key={a.id} tone="warning">
              <AlertTriangle className="h-4 w-4" />
              {a.id} expires in {a.daysToExpiry} {a.daysToExpiry === 1 ? "day" : "days"}. Submit
              it to keep it active.
            </Alert>
          ))}
          {EXPIRED.map((e) => (
            <Alert key={e.id} tone="info">
              <Clock className="h-4 w-4" />
              Expired application {e.id} can be reactivated until {e.reactivateUntil}.
            </Alert>
          ))}
        </section>
      )}

      {/* Summary Cards */}
      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          icon={Inbox}
          label="Active"
          value={`${counts.active} of ${MAX_ACTIVE_APPLICATIONS}`}
          tone="primary"
        />
        <SummaryCard icon={ArrowRight} label="Submitted" value={String(counts.submitted)} tone="secondary" />
        <SummaryCard
          icon={FileText}
          label="Documents"
          value={`${counts.docsPending} of ${counts.docsTotal}`}
          tone="yellow"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Conditions"
          value={String(counts.conditions)}
          tone="coral"
        />
        <SummaryCard icon={Award} label="Offers" value={String(counts.offers)} tone="mint" />
        <SummaryCard
          icon={Wallet}
          label="Wallet"
          value={counts.walletAvailable === 0 ? "Locked" : `${counts.walletAvailable} available`}
          tone="primary"
        />
      </section>

      {/* Submitted Applications */}
      {SUBMITTED.length > 0 && (
        <DashSection
          id="submitted"
          title="Submitted Applications"
          subtitle="Applications submitted for review, lender matching, or fulfillment."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {SUBMITTED.map((s) => (
              <SubmittedCard key={s.id} app={s} />
            ))}
          </div>
        </DashSection>
      )}

      {/* Active Applications */}
      <DashSection
        id="active"
        title="Active Applications"
        subtitle="Applications you started but have not submitted yet."
        right={
          <span className="text-xs text-muted-foreground">
            {counts.active} of {MAX_ACTIVE_APPLICATIONS}
          </span>
        }
      >
        {ACTIVE.length === 0 ? (
          <EmptyState
            title="No active applications"
            body="Start with a quick mortgage snapshot to see your personalized mortgage offers."
            ctaLabel="Start a New Mortgage Snapshot"
            onClick={handleStartSnapshot}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ACTIVE.map((a) => (
              <ActiveCard key={a.id} app={a} />
            ))}
          </div>
        )}
      </DashSection>

      {/* Expired */}
      {EXPIRED.length > 0 && (
        <DashSection
          id="expired"
          title="Expired Applications"
          subtitle={`Not completed within ${ACTIVE_EXPIRY_DAYS} days. You can reactivate within ${EXPIRED_VISIBILITY_DAYS} days.`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {EXPIRED.map((e) => (
              <ExpiredCard key={e.id} app={e} onReactivate={() => setReactivateModal(e)} />
            ))}
          </div>
        </DashSection>
      )}

      {/* Completed */}
      {COMPLETED.length > 0 && (
        <DashSection
          id="completed"
          title="Completed Applications"
          subtitle="Mortgages funded and closed through approvU."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {COMPLETED.map((c) => (
              <CompletedCard key={c.id} app={c} />
            ))}
          </div>
        </DashSection>
      )}

      {/* Documents & Conditions */}
      <DashSection id="documents" title="Documents & Conditions" subtitle="Pending borrower actions across your applications.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Documents"
              right={
                <button className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                  <Upload className="mr-1 h-4 w-4" /> Upload Documents
                </button>
              }
            />
            <ul className="mt-2 divide-y divide-border">
              {DOCUMENTS.map((d) => (
                <li key={d.name} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.app} · Due {d.due}
                    </p>
                  </div>
                  <StatusPill status={d.status} />
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Conditions"
              right={
                <button className="text-sm font-medium text-primary hover:underline">
                  View Conditions
                </button>
              }
            />
            <ul className="mt-2 divide-y divide-border">
              {CONDITIONS.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.app} · Due {c.due}
                    </p>
                  </div>
                  <StatusPill status={c.status} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </DashSection>

      {/* Mortgage Offers / Snapshot History */}
      <DashSection
        id="offers"
        title="Mortgage Offers"
        subtitle="Review preliminary offers from your latest mortgage snapshot."
      >
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                You selected: 5-yr Fixed · Major Bank Path
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Continue your full application to verify your final mortgage products.
              </p>
            </div>
            <Link
              to="/internal/mortgage-offers"
              className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              View Mortgage Offers
            </Link>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Snapshot history
            </p>
            <ul className="mt-3 space-y-2">
              {SNAPSHOTS.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.type} · {s.loan}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.date} · {s.path} · {s.offers} offers
                    </p>
                  </div>
                  <StatusPill status={s.status} />
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </DashSection>

      {/* Home Life Wallet */}
      <DashSection
        id="wallet"
        title="Home Life Wallet"
        subtitle="Access your benefits, coupons, and partner offers after your mortgage funds."
      >
        {COMPLETED.length === 0 ? (
          <Card>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Wallet locked</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Your Home Life benefits will appear here after your mortgage is funded and
                    closed.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Activates at funding
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Legal Fee Rebate",
                "Appraisal Fee Credit",
                "Home Inspection Credit",
                "Moving Expense Credit",
              ].map((b) => (
                <div
                  key={b}
                  className="rounded-xl border border-dashed border-border bg-background p-3 text-xs text-muted-foreground"
                >
                  <Gift className="mb-1.5 h-4 w-4" />
                  {b}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">
              Wallet active — see benefits in your funded mortgage details.
            </p>
          </Card>
        )}
      </DashSection>

      {/* Calculators */}
      <DashSection id="tools" title="Mortgage Tools" subtitle="Plan ahead with quick calculators.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <button
              key={t.name}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex items-center gap-3">
                <span className="rounded-xl bg-secondary/15 p-2 text-secondary">
                  <t.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-foreground">{t.name}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </DashSection>

      {/* Settings link */}
      <DashSection id="settings" title="Account Settings" subtitle="Manage profile, contact, security, and preferences.">
        <Card>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                <Settings className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Profile, security & notifications</p>
                <p className="text-xs text-muted-foreground">
                  Personal info · Password · Email & SMS preferences · Privacy
                </p>
              </div>
            </div>
            <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted">
              Open Settings
            </button>
          </div>
        </Card>
      </DashSection>

      {reactivateModal && (
        <Modal onClose={() => setReactivateModal(null)} title="Reactivate application">
          <p className="text-sm text-muted-foreground">
            Reactivating <span className="font-medium text-foreground">{reactivateModal.id}</span>{" "}
            will restore it to your active list and reset the {ACTIVE_EXPIRY_DAYS}-day window.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setReactivateModal(null)}
              className="rounded-md border border-input bg-background px-3.5 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => setReactivateModal(null)}
              className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reactivate
            </button>
          </div>
        </Modal>
      )}

      {maxModal && (
        <Modal onClose={() => setMaxModal(false)} title="You've reached the active limit">
          <p className="text-sm text-muted-foreground">
            You already have {MAX_ACTIVE_APPLICATIONS} active applications. Please complete,
            submit, or close one before starting a new application.
          </p>
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setMaxModal(false)}
              className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Got it
            </button>
          </div>
        </Modal>
      )}

      {openTool && (
        <CalculatorModal toolKey={openTool} onClose={() => setOpenTool(null)} />
      )}
        </div>
      </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Internal prototype — illustrative only. Not a mortgage approval.
        </p>
      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────
function DashSection({
  id,
  title,
  subtitle,
  right,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">{children}</div>
  );
}

function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {right}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Home;
  label: string;
  value: string;
  tone: "primary" | "secondary" | "yellow" | "coral" | "mint";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    yellow: "bg-yellow/30 text-foreground",
    coral: "bg-coral/15 text-coral",
    mint: "bg-mint/20 text-foreground",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function NextBestAction({
  title,
  related,
  due,
  ctaLabel,
}: {
  title: string;
  related: string;
  due: string;
  ctaLabel: string;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-secondary/30 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-secondary/15 p-2 text-secondary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">
            Next best action
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">
            {related} · {due}
          </p>
        </div>
      </div>
      <button className="inline-flex items-center justify-center rounded-md bg-secondary px-3.5 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90">
        {ctaLabel} <ArrowRight className="ml-1 h-4 w-4" />
      </button>
    </div>
  );
}

function ActiveCard({ app }: { app: ActiveApp }) {
  const expiringSoon = app.daysToExpiry <= 3;
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {app.type}
        </span>
        <span className="text-xs text-muted-foreground">#{app.id}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{app.property}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Updated {app.lastUpdated}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{app.status}</span>
          <span className="font-medium text-foreground">{app.completion}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-secondary" style={{ width: `${app.completion}%` }} />
        </div>
      </div>

      <div
        className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          expiringSoon ? "bg-yellow/40 text-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        {expiringSoon ? `Expires in ${app.daysToExpiry} days` : `${app.daysToExpiry} days left`}
      </div>

      <div className="mt-4 rounded-lg bg-muted p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Next step
        </p>
        <p className="mt-0.5 text-sm text-foreground">{app.nextStep}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/internal/full-application"
          className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue Application
        </Link>
        <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
          View Snapshot
        </button>
      </div>
    </article>
  );
}

function SubmittedCard({ app }: { app: SubmittedApp }) {
  return (
    <article className="flex flex-col rounded-2xl border border-secondary/30 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-medium text-secondary">
          {app.type} · Submitted
        </span>
        <span className="text-xs text-muted-foreground">#{app.id}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{app.property}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Broker: {app.broker} · Updated {app.lastUpdate}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{app.stage}</span>
          <span className="font-medium text-foreground">{app.progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-mint" style={{ width: `${app.progress}%` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-muted p-2">
          <p className="text-muted-foreground">Conditions</p>
          <p className="font-semibold text-foreground">{app.conditionsOutstanding} outstanding</p>
        </div>
        <div className="rounded-lg bg-muted p-2">
          <p className="text-muted-foreground">Documents</p>
          <p className="font-semibold text-foreground">{app.documentsPending} pending</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-muted p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Next step
        </p>
        <p className="mt-0.5 text-sm text-foreground">{app.nextStep}</p>
      </div>

      <button className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        View Application Hub <ArrowRight className="ml-1 h-4 w-4" />
      </button>
    </article>
  );
}

function ExpiredCard({
  app,
  onReactivate,
}: {
  app: ExpiredApp;
  onReactivate: () => void;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {app.type} · Expired
        </span>
        <span className="text-xs text-muted-foreground">#{app.id}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{app.property}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Expired {app.expiredOn} · {app.completion}% complete
      </p>
      <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-coral/15 px-2.5 py-1 text-xs font-medium text-coral">
        <Clock className="h-3.5 w-3.5" /> Reactivate by {app.reactivateUntil} ({app.daysLeftToReactivate}d left)
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onReactivate}
          className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" /> Reactivate Application
        </button>
        <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
          Start New Snapshot
        </button>
      </div>
    </article>
  );
}

function CompletedCard({ app }: { app: CompletedApp }) {
  return (
    <article className="flex flex-col rounded-2xl border border-mint/30 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-mint/20 px-2.5 py-0.5 text-xs font-medium text-foreground">
          Funded · {app.lender}
        </span>
        <span className="text-xs text-muted-foreground">#{app.id}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{app.property}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Funded {app.fundedDate}</p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Stat2 label="Amount" value={app.amount} />
        <Stat2 label="Term" value={app.term} />
        <Stat2 label="Rate" value={app.rateType} />
        <Stat2 label="Maturity" value={app.maturityDate} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          View Mortgage Details
        </button>
        <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
          View Wallet Benefits
        </button>
      </div>
    </article>
  );
}

function Stat2({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Received: "bg-mint/20 text-foreground",
    Accepted: "bg-mint/20 text-foreground",
    Completed: "bg-mint/20 text-foreground",
    Requested: "bg-yellow/30 text-foreground",
    Pending: "bg-yellow/30 text-foreground",
    Outstanding: "bg-coral/15 text-coral",
    Overdue: "bg-coral/15 text-coral",
    "Needs Correction": "bg-coral/15 text-coral",
    "Under Review": "bg-secondary/15 text-secondary",
    Uploaded: "bg-secondary/15 text-secondary",
    "Snapshot Complete": "bg-muted text-muted-foreground",
    "Offer Selected": "bg-primary/10 text-primary",
    "Offer Viewed": "bg-secondary/15 text-secondary",
    Expired: "bg-muted text-muted-foreground",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "warning" | "info";
  children: React.ReactNode;
}) {
  const cls =
    tone === "warning"
      ? "border-yellow bg-yellow/15 text-foreground"
      : "border-secondary/30 bg-secondary/10 text-foreground";
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${cls}`}
      role="status"
    >
      {children}
    </div>
  );
}

function EmptyState({
  title,
  body,
  ctaLabel,
  onClick,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      <button
        onClick={onClick}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="mr-1.5 h-4 w-4" /> {ctaLabel}
      </button>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
