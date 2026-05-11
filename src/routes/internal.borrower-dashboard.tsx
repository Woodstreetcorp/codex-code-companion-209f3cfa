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
              key={t.key}
              onClick={() => setOpenTool(t.key)}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-xl bg-secondary/15 p-2.5 text-secondary">
                  <t.icon className="h-5 w-5" />
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.blurb}</p>
              </div>
            </button>
          ))}
        </div>
      </DashSection>

      {/* Settings portal */}
      <DashSection id="settings" title="Account Settings" subtitle="Manage your profile, security, notifications, and preferences.">
        <SettingsPortal />
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

// ─── Settings Portal ─────────────────────────────────────────────────────
type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "privacy"
  | "payments"
  | "preferences";

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: typeof Home }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "payments", label: "Payment Methods", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: Settings },
];

function SettingsPortal() {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [profile, setProfile] = useState({
    firstName: "Alex",
    lastName: "Tremblay",
    email: "alex.tremblay@example.com",
    phone: "(416) 555-0142",
    address: "123 Maple Ave, Toronto, ON",
  });
  const [twoFA, setTwoFA] = useState(true);
  const [biometric, setBiometric] = useState(true);
  const [notif, setNotif] = useState({
    emailUpdates: true,
    smsUpdates: true,
    marketing: false,
    rateAlerts: true,
    docReminders: true,
  });
  const [privacy, setPrivacy] = useState({
    shareWithBroker: true,
    analytics: false,
    partnerOffers: true,
  });
  const [prefs, setPrefs] = useState({
    language: "English",
    currency: "CAD",
    theme: "System",
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Tabs */}
        <nav className="flex flex-row gap-1 overflow-x-auto border-b border-border bg-background/40 p-3 md:flex-col md:border-b-0 md:border-r">
          {SETTINGS_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div className="p-5 sm:p-7">
          {tab === "profile" && (
            <SettingPane title="Personal information" desc="This is the information used on your applications.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" value={profile.firstName} onChange={(v) => setProfile({ ...profile, firstName: v })} />
                <Field label="Last name" value={profile.lastName} onChange={(v) => setProfile({ ...profile, lastName: v })} />
                <Field label="Email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} icon={Mail} />
                <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} icon={Smartphone} />
                <div className="sm:col-span-2">
                  <Field label="Mailing address" value={profile.address} onChange={(v) => setProfile({ ...profile, address: v })} />
                </div>
              </div>
            </SettingPane>
          )}

          {tab === "security" && (
            <SettingPane title="Sign-in & security" desc="Protect your account with extra layers of security.">
              <div className="space-y-3">
                <Row
                  title="Password"
                  desc="Last changed 2 months ago"
                  action={<button className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Change</button>}
                />
                <ToggleRow
                  title="Two-factor authentication"
                  desc="Use an authenticator app for sign-in codes."
                  checked={twoFA}
                  onChange={setTwoFA}
                />
                <ToggleRow
                  title="Biometric sign-in"
                  desc="Use Face ID / fingerprint on supported devices."
                  checked={biometric}
                  onChange={setBiometric}
                />
                <Row
                  title="Active sessions"
                  desc="3 devices signed in"
                  action={<button className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Manage</button>}
                />
              </div>
            </SettingPane>
          )}

          {tab === "notifications" && (
            <SettingPane title="Notifications" desc="Choose how we keep you in the loop.">
              <div className="space-y-3">
                <ToggleRow title="Application updates · Email" desc="Status changes, conditions, decisions." checked={notif.emailUpdates} onChange={(v) => setNotif({ ...notif, emailUpdates: v })} />
                <ToggleRow title="Application updates · SMS" desc="Time-sensitive alerts only." checked={notif.smsUpdates} onChange={(v) => setNotif({ ...notif, smsUpdates: v })} />
                <ToggleRow title="Document reminders" desc="Nudge me when docs are due." checked={notif.docReminders} onChange={(v) => setNotif({ ...notif, docReminders: v })} />
                <ToggleRow title="Rate-drop alerts" desc="Tell me when rates drop below my offer." checked={notif.rateAlerts} onChange={(v) => setNotif({ ...notif, rateAlerts: v })} />
                <ToggleRow title="Marketing & tips" desc="Occasional homeownership tips." checked={notif.marketing} onChange={(v) => setNotif({ ...notif, marketing: v })} />
              </div>
            </SettingPane>
          )}

          {tab === "privacy" && (
            <SettingPane title="Privacy & data" desc="Control how your data is used.">
              <div className="space-y-3">
                <ToggleRow title="Share with my broker" desc="Allow my assigned broker to view my full profile." checked={privacy.shareWithBroker} onChange={(v) => setPrivacy({ ...privacy, shareWithBroker: v })} />
                <ToggleRow title="Partner offers" desc="Receive Home Life Bundle partner promotions." checked={privacy.partnerOffers} onChange={(v) => setPrivacy({ ...privacy, partnerOffers: v })} />
                <ToggleRow title="Anonymous analytics" desc="Help us improve approvU with usage data." checked={privacy.analytics} onChange={(v) => setPrivacy({ ...privacy, analytics: v })} />
                <Row title="Download my data" desc="Get a copy of all data we hold." action={<button className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Request</button>} />
                <Row title="Delete my account" desc="Permanently remove your account & data." action={<button className="rounded-md border border-coral/40 bg-coral/10 px-3 py-1.5 text-xs font-medium text-coral hover:bg-coral/20">Delete</button>} />
              </div>
            </SettingPane>
          )}

          {tab === "payments" && (
            <SettingPane title="Payment methods" desc="For appraisals, legal fees, and Home Life Bundle services.">
              <div className="space-y-3">
                <Row
                  title="Visa •••• 4242"
                  desc="Expires 09/28 · Default"
                  action={<button className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Edit</button>}
                />
                <Row
                  title="Pre-authorized debit"
                  desc="TD Chequing •••• 1187"
                  action={<button className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Edit</button>}
                />
                <button className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                  <Plus className="h-4 w-4" /> Add payment method
                </button>
              </div>
            </SettingPane>
          )}

          {tab === "preferences" && (
            <SettingPane title="Preferences" desc="Personalize your experience.">
              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField label="Language" icon={Globe} value={prefs.language} options={["English", "Français"]} onChange={(v) => setPrefs({ ...prefs, language: v })} />
                <SelectField label="Currency" value={prefs.currency} options={["CAD", "USD"]} onChange={(v) => setPrefs({ ...prefs, currency: v })} />
                <SelectField label="Theme" value={prefs.theme} options={["System", "Light", "Dark"]} onChange={(v) => setPrefs({ ...prefs, theme: v })} />
              </div>
            </SettingPane>
          )}

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-mint">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingPane({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, icon: Icon }: { label: string; value: string; onChange: (v: string) => void; icon?: typeof Home }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-primary">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        />
      </div>
    </label>
  );
}

function SelectField({ label, value, options, onChange, icon: Icon }: { label: string; value: string; options: string[]; onChange: (v: string) => void; icon?: typeof Home }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-primary">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        >
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
    </label>
  );
}

function Row({ title, desc, action }: { title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {action}
    </div>
  );
}

function ToggleRow({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition ${checked ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ─── Calculator Modal ────────────────────────────────────────────────────
function fmt(n: number, frac = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: frac, minimumFractionDigits: frac });
}

function monthlyPayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

function CalculatorModal({ toolKey, onClose }: { toolKey: ToolKey; onClose: () => void }) {
  const tool = TOOLS.find((t) => t.key === toolKey)!;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-secondary/15 p-2 text-secondary">
              <tool.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-foreground">{tool.name} Calculator</h3>
              <p className="text-xs text-muted-foreground">{tool.blurb}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {toolKey === "payment" && <PaymentCalc />}
          {toolKey === "affordability" && <AffordabilityCalc />}
          {toolKey === "refinance" && <RefinanceCalc />}
          {toolKey === "renewal" && <RenewalCalc />}
          {toolKey === "equity" && <EquityCalc />}
          {toolKey === "closing" && <ClosingCalc />}
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, suffix, prefix, step = 1 }: { label: string; value: number; onChange: (n: number) => void; suffix?: string; prefix?: string; step?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-primary">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

function ResultBlock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function PaymentCalc() {
  const [price, setPrice] = useState(750000);
  const [down, setDown] = useState(150000);
  const [rate, setRate] = useState(5.25);
  const [amort, setAmort] = useState(25);
  const principal = Math.max(price - down, 0);
  const m = monthlyPayment(principal, rate, amort);
  const total = m * amort * 12;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Home price" value={price} onChange={setPrice} prefix="$" />
        <NumField label="Down payment" value={down} onChange={setDown} prefix="$" />
        <NumField label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.05} />
        <NumField label="Amortization (years)" value={amort} onChange={setAmort} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ResultBlock label="Monthly payment" value={fmt(m, 2)} accent />
        <ResultBlock label="Mortgage amount" value={fmt(principal)} />
        <ResultBlock label="Total paid" value={fmt(total)} />
      </div>
    </>
  );
}

function AffordabilityCalc() {
  const [income, setIncome] = useState(120000);
  const [debts, setDebts] = useState(500);
  const [down, setDown] = useState(80000);
  const [rate, setRate] = useState(5.25);
  const [taxes, setTaxes] = useState(450);
  const [heat, setHeat] = useState(150);
  // GDS 39%, TDS 44% stress test +2%
  const stressRate = rate + 2;
  const monthlyIncome = income / 12;
  const maxGDS = monthlyIncome * 0.39 - taxes - heat;
  const maxTDS = monthlyIncome * 0.44 - taxes - heat - debts;
  const maxPmt = Math.max(0, Math.min(maxGDS, maxTDS));
  // invert payment to principal
  const r = stressRate / 100 / 12;
  const n = 25 * 12;
  const maxLoan = r === 0 ? maxPmt * n : (maxPmt * (1 - Math.pow(1 + r, -n))) / r;
  const maxPrice = maxLoan + down;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Annual household income" value={income} onChange={setIncome} prefix="$" />
        <NumField label="Monthly debt payments" value={debts} onChange={setDebts} prefix="$" />
        <NumField label="Down payment" value={down} onChange={setDown} prefix="$" />
        <NumField label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.05} />
        <NumField label="Property tax (mo)" value={taxes} onChange={setTaxes} prefix="$" />
        <NumField label="Heating (mo)" value={heat} onChange={setHeat} prefix="$" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ResultBlock label="Max home price" value={fmt(maxPrice)} accent />
        <ResultBlock label="Stress-tested at" value={`${stressRate.toFixed(2)}%`} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Uses GDS 39% / TDS 44% with a +2% stress test as a guideline.</p>
    </>
  );
}

function RefinanceCalc() {
  const [balance, setBalance] = useState(420000);
  const [currentRate, setCurrentRate] = useState(6.1);
  const [newRate, setNewRate] = useState(4.95);
  const [years, setYears] = useState(20);
  const cur = monthlyPayment(balance, currentRate, years);
  const next = monthlyPayment(balance, newRate, years);
  const monthlySave = cur - next;
  const totalSave = monthlySave * years * 12;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Current balance" value={balance} onChange={setBalance} prefix="$" />
        <NumField label="Years remaining" value={years} onChange={setYears} />
        <NumField label="Current rate" value={currentRate} onChange={setCurrentRate} suffix="%" step={0.05} />
        <NumField label="New rate" value={newRate} onChange={setNewRate} suffix="%" step={0.05} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ResultBlock label="Monthly savings" value={fmt(monthlySave, 2)} accent />
        <ResultBlock label="New payment" value={fmt(next, 2)} />
        <ResultBlock label="Lifetime savings" value={fmt(totalSave)} />
      </div>
    </>
  );
}

function RenewalCalc() {
  const [balance, setBalance] = useState(380000);
  const [oldRate, setOldRate] = useState(2.49);
  const [newRate, setNewRate] = useState(5.15);
  const [years, setYears] = useState(20);
  const oldP = monthlyPayment(balance, oldRate, years);
  const newP = monthlyPayment(balance, newRate, years);
  const diff = newP - oldP;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Balance at renewal" value={balance} onChange={setBalance} prefix="$" />
        <NumField label="Years remaining" value={years} onChange={setYears} />
        <NumField label="Old rate" value={oldRate} onChange={setOldRate} suffix="%" step={0.05} />
        <NumField label="New rate" value={newRate} onChange={setNewRate} suffix="%" step={0.05} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ResultBlock label="New payment" value={fmt(newP, 2)} accent />
        <ResultBlock label="Old payment" value={fmt(oldP, 2)} />
        <ResultBlock label="Monthly change" value={fmt(diff, 2)} />
      </div>
    </>
  );
}

function EquityCalc() {
  const [value, setValue] = useState(900000);
  const [balance, setBalance] = useState(420000);
  const equity = Math.max(value - balance, 0);
  const accessible = Math.max(value * 0.8 - balance, 0); // 80% LTV
  const ltv = value > 0 ? (balance / value) * 100 : 0;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Estimated home value" value={value} onChange={setValue} prefix="$" />
        <NumField label="Mortgage balance" value={balance} onChange={setBalance} prefix="$" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ResultBlock label="Total equity" value={fmt(equity)} accent />
        <ResultBlock label="Accessible (80% LTV)" value={fmt(accessible)} />
        <ResultBlock label="Current LTV" value={`${ltv.toFixed(1)}%`} />
      </div>
    </>
  );
}

function ClosingCalc() {
  const [price, setPrice] = useState(750000);
  const [firstTime, setFirstTime] = useState(false);
  // Ontario LTT (simplified)
  const ontLTT = (p: number) => {
    let t = 0;
    const brackets: [number, number][] = [
      [55000, 0.005], [195000, 0.01], [150000, 0.015], [1600000, 0.02], [Infinity, 0.025],
    ];
    let rem = p;
    for (const [size, rate] of brackets) {
      const seg = Math.min(rem, size);
      t += seg * rate;
      rem -= seg;
      if (rem <= 0) break;
    }
    return t;
  };
  const ltt = ontLTT(price);
  const rebate = firstTime ? Math.min(ltt, 4000) : 0;
  const legal = 1800;
  const titleIns = 350;
  const inspection = 500;
  const appraisal = 400;
  const total = ltt - rebate + legal + titleIns + inspection + appraisal;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="Purchase price" value={price} onChange={setPrice} prefix="$" />
        <label className="flex items-end gap-2 pb-2">
          <input type="checkbox" checked={firstTime} onChange={(e) => setFirstTime(e.target.checked)} className="h-4 w-4 rounded border-input" />
          <span className="text-sm text-foreground">First-time home buyer (ON)</span>
        </label>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ResultBlock label="Total estimated closing" value={fmt(total)} accent />
        <ResultBlock label="Land transfer tax" value={fmt(ltt - rebate)} />
      </div>
      <div className="mt-3 grid gap-2 rounded-2xl border border-border bg-background p-4 text-sm">
        <CostLine label="Land transfer tax" value={fmt(ltt)} />
        {rebate > 0 && <CostLine label="First-time buyer rebate" value={`− ${fmt(rebate)}`} />}
        <CostLine label="Legal fees" value={fmt(legal)} />
        <CostLine label="Title insurance" value={fmt(titleIns)} />
        <CostLine label="Home inspection" value={fmt(inspection)} />
        <CostLine label="Appraisal" value={fmt(appraisal)} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Estimates only. Ontario rates shown — actual closing costs vary by province and property.</p>
    </>
  );
}

function CostLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
