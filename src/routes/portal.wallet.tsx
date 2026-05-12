import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Gift,
  History,
  Home,
  KeyRound,
  Layers,
  Leaf,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Scale,
  Shield,
  Sparkles,
  Truck,
  Wallet,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { COMPLETED } from "@/components/portal/data";
import { PageHeader, SummaryCard } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/wallet")({
  head: () => ({
    meta: [
      { title: "Home Life Wallet — approvU" },
      {
        name: "description",
        content:
          "View and redeem benefits, credits, and partner offers connected to your funded approvU mortgage.",
      },
    ],
  }),
  component: WalletPage,
});

type Status =
  | "Available"
  | "Expiring Soon"
  | "Redeemed"
  | "Expired"
  | "Pending Activation";

type Benefit = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  value: number;
  status: Status;
  expires?: string;
  redeemedOn?: string;
  code?: string;
  pendingReason?: string;
  partner?: { name: string; website?: string; phone?: string; email?: string; serviceArea?: string };
  instructions?: string[];
  terms?: string[];
  icon: typeof Home;
};

const BUNDLE = {
  name: "HomeStrategy Advantage™",
  applicationId: "APP-1801",
  property: "118 King St W, Toronto, ON",
  fundedDate: "2026-04-29",
  totalValue: 2350,
  redeemed: 500,
  status: "Active" as const,
  expires: "2026-10-29",
};

const BENEFITS: Benefit[] = [
  {
    id: "b1",
    name: "Home Inspection Credit",
    category: "Homeownership Services",
    subcategory: "Inspection",
    value: 500,
    status: "Available",
    expires: "2026-10-29",
    code: "APR-HIN-A7B9X2",
    icon: Home,
    partner: { name: "Pillar Home Inspections", website: "pillarhome.ca", phone: "1-800-555-0102", serviceArea: "Greater Toronto Area" },
    instructions: [
      "Contact the approved home inspection provider.",
      "Share your approvU redemption code at booking.",
      "Complete your inspection within the offer window.",
      "The credit is applied to your invoice automatically.",
    ],
    terms: ["One-time use", "Valid in Ontario", "Non-transferable", "Cannot be combined with other inspection promos"],
  },
  {
    id: "b2",
    name: "Moving Expense Credit",
    category: "Moving Services",
    value: 500,
    status: "Expiring Soon",
    expires: "2026-06-08",
    code: "APR-MOV-K8Q2Z4",
    icon: Truck,
    partner: { name: "TrueNorth Movers", website: "truenorthmovers.ca", phone: "1-888-555-0144" },
    instructions: [
      "Book your move with a participating partner.",
      "Provide your approvU redemption code.",
      "Credit is deducted from your final invoice.",
    ],
    terms: ["Valid for one move", "Within 30 days of closing", "Subject to partner availability"],
  },
  {
    id: "b3",
    name: "Home Insurance Credit",
    category: "Insurance Services",
    value: 450,
    status: "Available",
    expires: "2026-10-29",
    code: "APR-INS-P4M7R1",
    icon: Shield,
    partner: { name: "Maple Home Insurance", website: "mapleinsurance.ca", phone: "1-877-555-0199" },
    instructions: [
      "Get a quote from a participating insurance partner.",
      "Mention your approvU code to apply the credit.",
      "Credit is applied to your first-year premium.",
    ],
    terms: ["First-year premium only", "New policies only", "Eligible properties only"],
  },
  {
    id: "b4",
    name: "No Appraisal Fee",
    category: "Homeownership Services",
    subcategory: "Appraisal",
    value: 400,
    status: "Available",
    expires: "2026-08-29",
    code: "APR-APR-X9T2B6",
    icon: FileText,
    instructions: [
      "If your lender orders an appraisal, this credit covers the fee.",
      "approvU will apply the credit on your behalf.",
    ],
    terms: ["One per mortgage", "Standard residential appraisals only"],
  },
  {
    id: "b5",
    name: "Legal Fee Rebate",
    category: "Legal Services",
    value: 500,
    status: "Redeemed",
    redeemedOn: "2026-05-20",
    code: "APR-LEG-N2W8L5",
    icon: Scale,
    partner: { name: "Hartwell & Co. LLP" },
  },
  {
    id: "b6",
    name: "Smart Home Consultation",
    category: "Smart Home",
    value: 150,
    status: "Pending Activation",
    pendingReason: "Partner assignment pending",
    icon: Zap,
  },
];

const ACTIVITY = [
  { date: "2026-04-29", text: "HomeStrategy Advantage™ activated" },
  { date: "2026-05-01", text: "Home Inspection Credit code generated" },
  { date: "2026-05-03", text: "Legal Fee Rebate viewed" },
  { date: "2026-05-20", text: "Legal Fee Rebate redeemed — $500" },
];

const HUB = [
  { name: "Renewal Planner", icon: Calendar, blurb: "Plan ahead for your mortgage renewal." },
  { name: "Refinance Opportunities", icon: RefreshCw, blurb: "See if refinancing makes sense for you." },
  { name: "Home Insurance Review", icon: Shield, blurb: "Compare and bundle home coverage." },
  { name: "Smart Home Services", icon: Zap, blurb: "Devices and security for your space." },
  { name: "Green Home Upgrades", icon: Leaf, blurb: "Energy efficiency and rebates." },
  { name: "Home Maintenance", icon: Wrench, blurb: "Trusted help for repairs and upkeep." },
];

type Tab = "available" | "redeemed" | "expired" | "pending" | "all";

function WalletPage() {
  const hasFundedMortgage = COMPLETED.length > 0;
  const [tab, setTab] = useState<Tab>("available");
  const [openBenefit, setOpenBenefit] = useState<Benefit | null>(null);

  const counts = useMemo(() => ({
    available: BENEFITS.filter((b) => b.status === "Available" || b.status === "Expiring Soon").length,
    redeemed: BENEFITS.filter((b) => b.status === "Redeemed").length,
    expired: BENEFITS.filter((b) => b.status === "Expired").length,
    pending: BENEFITS.filter((b) => b.status === "Pending Activation").length,
    expiringSoon: BENEFITS.filter((b) => b.status === "Expiring Soon").length,
    availableValue: BENEFITS.filter((b) => b.status === "Available" || b.status === "Expiring Soon").reduce((s, b) => s + b.value, 0),
    redeemedValue: BENEFITS.filter((b) => b.status === "Redeemed").reduce((s, b) => s + b.value, 0),
  }), []);

  if (!hasFundedMortgage) {
    return <LockedWallet />;
  }

  const filtered = BENEFITS.filter((b) => {
    if (tab === "all") return true;
    if (tab === "available") return b.status === "Available" || b.status === "Expiring Soon";
    if (tab === "redeemed") return b.status === "Redeemed";
    if (tab === "expired") return b.status === "Expired";
    return b.status === "Pending Activation";
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "available", label: "Available", count: counts.available },
    { key: "redeemed", label: "Redeemed", count: counts.redeemed },
    { key: "expired", label: "Expired", count: counts.expired },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "all", label: "All Benefits", count: BENEFITS.length },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Home Life Wallet"
        title="Your Home Life Wallet"
        description="Access your available benefits, credits, and partner offers from your funded approvU mortgage."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/portal/applications"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              View Mortgage Details
            </Link>
            <button
              onClick={() => setTab("available")}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Gift className="h-4 w-4" /> View Available Benefits
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard icon={Gift} label="Available" value={`${counts.available}`} tone="primary" />
        <SummaryCard icon={Wallet} label="Available value" value={fmt(counts.availableValue)} tone="secondary" />
        <SummaryCard icon={CheckCircle2} label="Redeemed value" value={fmt(counts.redeemedValue)} tone="mint" />
        <SummaryCard icon={Clock} label="Expiring soon" value={`${counts.expiringSoon}`} tone="yellow" />
        <SummaryCard icon={Layers} label="Active bundles" value="1" tone="primary" />
        <SummaryCard icon={Home} label="Linked mortgages" value={`${COMPLETED.length}`} tone="secondary" />
      </div>

      {/* Active Bundle */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-lg">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute right-10 top-10 opacity-10">
            <Sparkles className="h-32 w-32" />
          </div>
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">
                <BadgeCheck className="h-3.5 w-3.5" /> Active Home Life Bundle
              </div>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">{BUNDLE.name}</h2>
              <p className="mt-1 text-sm text-primary-foreground/85">
                #{BUNDLE.applicationId} · {BUNDLE.property}
              </p>
              <p className="mt-0.5 text-xs text-primary-foreground/70">
                Funded {BUNDLE.fundedDate} · Bundle expires {BUNDLE.expires}
              </p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/80">
                Total bundle value
              </p>
              <p className="mt-1 text-2xl font-semibold">{fmt(BUNDLE.totalValue)}</p>
              <div className="mt-3 flex gap-4 text-xs">
                <div>
                  <p className="text-primary-foreground/70">Available</p>
                  <p className="font-semibold">{fmt(counts.availableValue)}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/70">Redeemed</p>
                  <p className="font-semibold">{fmt(counts.redeemedValue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-border pb-2">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-primary-foreground/20" : "bg-muted-foreground/15"}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyTab tab={tab} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((b) => (
              <BenefitCard key={b.id} b={b} onOpen={() => setOpenBenefit(b)} />
            ))}
          </div>
        )}
      </div>

      {/* Activity log */}
      <section className="mt-10 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <header className="mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Wallet activity</h3>
        </header>
        <ol className="relative space-y-4 border-l border-border pl-5">
          {ACTIVITY.map((a, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
              <p className="text-sm text-foreground">{a.text}</p>
              <p className="text-xs text-muted-foreground">{a.date}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Future hub */}
      <section className="mt-10">
        <header className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">Coming soon</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Homeownership Hub</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            After your mortgage closes, approvU will help you manage more of your homeownership journey.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HUB.map((h) => (
            <div key={h.name} className="relative rounded-2xl border border-border bg-card p-4 opacity-90">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                    <h.icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-foreground">{h.name}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{h.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Benefits are subject to the terms of the applicable Home Life Bundle and partner offer. Some benefits may require verification, partner availability, or location eligibility.
      </p>

      {openBenefit && <BenefitDrawer benefit={openBenefit} onClose={() => setOpenBenefit(null)} />}
    </>
  );
}

function fmt(n: number) {
  return `$${n.toLocaleString()}`;
}

function StatusBadge({ s }: { s: Status }) {
  const map: Record<Status, string> = {
    Available: "bg-mint/20 text-foreground",
    "Expiring Soon": "bg-yellow/35 text-foreground",
    Redeemed: "bg-secondary/15 text-secondary",
    Expired: "bg-muted text-muted-foreground",
    "Pending Activation": "bg-coral/15 text-coral",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[s]}`}>
      {s}
    </span>
  );
}

function BenefitCard({ b, onOpen }: { b: Benefit; onOpen: () => void }) {
  const isAvailable = b.status === "Available" || b.status === "Expiring Soon";
  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
            <b.icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {b.category}{b.subcategory ? ` · ${b.subcategory}` : ""}
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-foreground">{b.name}</h3>
          </div>
        </div>
        <p className="shrink-0 text-lg font-semibold text-foreground">{fmt(b.value)}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge s={b.status} />
        {b.expires && b.status !== "Redeemed" && b.status !== "Expired" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Expires {b.expires}
          </span>
        )}
        {b.redeemedOn && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" /> Redeemed {b.redeemedOn}
          </span>
        )}
      </div>

      {isAvailable && b.code && (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">Redemption code</p>
            <p className="truncate font-mono text-sm font-semibold tracking-wide text-primary">{b.code}</p>
          </div>
          <CopyCode code={b.code} />
        </div>
      )}

      {b.status === "Pending Activation" && (
        <div className="mt-4 rounded-lg bg-muted p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Why pending</p>
          <p className="mt-0.5 text-sm text-foreground">{b.pendingReason}</p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button onClick={onOpen} className="text-xs font-medium text-primary hover:underline">
          View details →
        </button>
        {isAvailable && (
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Gift className="h-4 w-4" /> Redeem
          </button>
        )}
      </div>
    </article>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Try again.");
    }
  };
  return (
    <button
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function EmptyTab({ tab }: { tab: Tab }) {
  const map: Record<Tab, { title: string; body: string }> = {
    available: { title: "No benefits to redeem", body: "All your benefits are either redeemed, pending, or expired." },
    redeemed: { title: "No redeemed benefits yet", body: "Once you use a benefit, it'll appear here with the receipt." },
    expired: { title: "No expired benefits yet", body: "Benefits past their expiry date will appear here." },
    pending: { title: "No pending benefits", body: "Benefits awaiting activation will appear here." },
    all: { title: "No benefits yet", body: "Once your bundle activates, your benefits appear here." },
  };
  const m = map[tab];
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <h3 className="text-sm font-semibold text-foreground">{m.title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{m.body}</p>
    </div>
  );
}

function BenefitDrawer({ benefit, onClose }: { benefit: Benefit; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Benefit details</p>
            <h3 className="mt-0.5 text-base font-semibold text-foreground">{benefit.name}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-5 p-5">
          {/* Overview */}
          <section className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {benefit.category}{benefit.subcategory ? ` · ${benefit.subcategory}` : ""}
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{fmt(benefit.value)}</p>
              </div>
              <StatusBadge s={benefit.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              {benefit.expires && <DT label="Expires" value={benefit.expires} />}
              {benefit.redeemedOn && <DT label="Redeemed" value={benefit.redeemedOn} />}
              <DT label="Bundle" value={BUNDLE.name} />
              <DT label="Application" value={`#${BUNDLE.applicationId}`} />
            </dl>
          </section>

          {/* Code */}
          {benefit.code && benefit.status !== "Pending Activation" && (
            <section>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <KeyRound className="h-4 w-4 text-primary" /> Redemption code
              </h4>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
                <p className="font-mono text-base font-semibold tracking-wider text-primary">{benefit.code}</p>
                <CopyCode code={benefit.code} />
              </div>
            </section>
          )}

          {/* How to redeem */}
          {benefit.instructions && (
            <section>
              <h4 className="mb-2 text-sm font-semibold text-foreground">How to redeem</h4>
              <ol className="space-y-2">
                {benefit.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Partner */}
          {benefit.partner && (
            <section>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Partner</h4>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-sm font-medium text-foreground">{benefit.partner.name}</p>
                {benefit.partner.serviceArea && (
                  <p className="text-xs text-muted-foreground">{benefit.partner.serviceArea}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {benefit.partner.website && (
                    <a className="inline-flex items-center gap-1 font-medium text-primary hover:underline" href={`https://${benefit.partner.website}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3" /> {benefit.partner.website}
                    </a>
                  )}
                  {benefit.partner.phone && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {benefit.partner.phone}</span>
                  )}
                  {benefit.partner.email && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {benefit.partner.email}</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Terms */}
          {benefit.terms && (
            <section>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Terms & conditions</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {benefit.terms.map((t) => (
                  <li key={t} className="flex gap-2"><Check className="mt-0.5 h-3 w-3 shrink-0 text-mint" /> {t}</li>
                ))}
              </ul>
            </section>
          )}

          {(benefit.status === "Available" || benefit.status === "Expiring Soon") && (
            <button
              onClick={() => toast.success(`${benefit.name} marked as redeemed`)}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Mark as redeemed
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function DT({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function LockedWallet() {
  const previews = [
    { name: "Legal fee rebates", icon: Scale },
    { name: "Home inspection credits", icon: Home },
    { name: "Moving credits", icon: Truck },
    { name: "Home insurance offers", icon: Shield },
    { name: "Smart home offers", icon: Zap },
    { name: "Green home upgrades", icon: Leaf },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Home Life Wallet"
        title="Your Home Life Wallet"
        description="Your benefits become available after your mortgage is funded and closed through approvU."
      />
      <section className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-secondary/10 p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          Your Home Life Wallet will unlock after funding
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          When your mortgage is funded and closed through approvU, your Home Life Bundle benefits will appear here, ready to redeem.
        </p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
          {previews.map((p) => (
            <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <p.icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-medium text-foreground">{p.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/portal/applications"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View My Applications <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <button
            onClick={() => toast.success("Starting a new mortgage snapshot…")}
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Start New Mortgage Snapshot
          </button>
        </div>
      </section>
    </>
  );
}