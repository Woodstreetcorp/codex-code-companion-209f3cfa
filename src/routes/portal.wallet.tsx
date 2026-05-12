import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight, BadgeCheck, Banknote, Calendar, Check, CheckCircle2, Clock, Copy,
  ExternalLink, FileText, Gift, History, Home, KeyRound, Layers, Leaf, Lock,
  Mail, Package, Phone, RefreshCw, Scale, Search, Send, Shield, Sparkles,
  Store, Trophy, Truck, Users, Wallet, Wrench, X, Zap,
} from "lucide-react";
import { COMPLETED } from "@/components/portal/data";
import { PageHeader, SummaryCard } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/wallet")({
  head: () => ({
    meta: [
      { title: "Home Life Wallet — approvU" },
      { name: "description", content: "Bundle benefits, partner storefront, cashback rewards, referrals, and your loyalty tier — all in one wallet." },
    ],
  }),
  component: WalletPage,
});

// ─── Types ──────────────────────────────────────────────────────────────
type RedemptionStatus = "Available" | "Requested" | "Confirmed" | "Delivered" | "Expired" | "Locked";
type Tier = "Pre-purchase" | "Funded" | "Renewing" | "Homeowner";

type Benefit = {
  id: string;
  name: string;
  category: string;
  value: number;
  status: RedemptionStatus;
  expires?: string;
  redeemedOn?: string;
  code?: string;
  unlockTier: Tier;
  partner?: { name: string; website?: string; phone?: string; email?: string; serviceArea?: string };
  instructions?: string[];
  terms?: string[];
  icon: typeof Home;
};

type StorefrontOffer = {
  id: string;
  name: string;
  partner: string;
  category: string;
  perk: string;
  cashback?: number;
  unlockTier: Tier;
  icon: typeof Home;
};

type LedgerEntry = { date: string; description: string; amount: number; type: "earned" | "redeemed" | "pending" };

// ─── Mock data ──────────────────────────────────────────────────────────
const TIERS: { key: Tier; label: string; threshold: number; perks: string }[] = [
  { key: "Pre-purchase", label: "Pre-purchase", threshold: 0, perks: "Tools, education, partner discounts" },
  { key: "Funded",       label: "Funded",       threshold: 1000, perks: "Closing-cost credits, partner offers" },
  { key: "Renewing",     label: "Renewing",     threshold: 2500, perks: "Renewal bonus, rate-watch alerts" },
  { key: "Homeowner",    label: "Homeowner",    threshold: 5000, perks: "Premium concierge, exclusive partners" },
];

const BUNDLE = {
  name: "HomeStrategy Advantage™",
  applicationId: "APP-1801",
  property: "118 King St W, Toronto, ON",
  fundedDate: "2026-04-29",
  totalValue: 2350,
  status: "Active" as const,
  expires: "2026-10-29",
  currentTier: "Funded" as Tier,
  cashbackBalance: 142.5,
  lifetimeEarned: 642.5,
  payoutMethod: "e-Transfer · alex.t@email.com",
};

const BENEFITS: Benefit[] = [
  { id: "b1", name: "Home Inspection Credit",  category: "Homeownership", value: 500, status: "Available", expires: "2026-10-29", code: "APR-HIN-A7B9X2", unlockTier: "Funded", icon: Home,
    partner: { name: "Pillar Home Inspections", website: "pillarhome.ca", phone: "1-800-555-0102", serviceArea: "GTA" },
    instructions: ["Contact the approved provider.", "Share your code at booking.", "Credit applied to invoice."],
    terms: ["One-time use", "Valid in Ontario", "Non-transferable"] },
  { id: "b2", name: "Moving Expense Credit",   category: "Moving",        value: 500, status: "Requested", expires: "2026-06-08", code: "APR-MOV-K8Q2Z4", unlockTier: "Funded", icon: Truck,
    partner: { name: "TrueNorth Movers", website: "truenorthmovers.ca", phone: "1-888-555-0144" } },
  { id: "b3", name: "Home Insurance Credit",   category: "Insurance",     value: 450, status: "Confirmed", expires: "2026-10-29", code: "APR-INS-P4M7R1", unlockTier: "Funded", icon: Shield,
    partner: { name: "Maple Home Insurance", website: "mapleinsurance.ca" } },
  { id: "b4", name: "No Appraisal Fee",        category: "Homeownership", value: 400, status: "Delivered", redeemedOn: "2026-04-30", code: "APR-APR-X9T2B6", unlockTier: "Funded", icon: FileText },
  { id: "b5", name: "Legal Fee Rebate",        category: "Legal",         value: 500, status: "Delivered", redeemedOn: "2026-05-20", code: "APR-LEG-N2W8L5", unlockTier: "Funded", icon: Scale,
    partner: { name: "Hartwell & Co. LLP" } },
  { id: "b6", name: "Smart Home Consultation", category: "Smart Home",    value: 150, status: "Available", expires: "2026-09-29", code: "APR-SMH-D2Y8K1", unlockTier: "Funded", icon: Zap },
  { id: "b7", name: "Renewal Bonus Credit",    category: "Renewal",       value: 750, status: "Locked", unlockTier: "Renewing", icon: RefreshCw },
  { id: "b8", name: "Concierge Home Services", category: "Maintenance",   value: 300, status: "Locked", unlockTier: "Homeowner", icon: Wrench },
];

const STOREFRONT: StorefrontOffer[] = [
  { id: "s1", name: "15% off home insurance",       partner: "Maple Home Insurance", category: "Insurance",  perk: "15% first-year discount",   cashback: 0,   unlockTier: "Pre-purchase", icon: Shield },
  { id: "s2", name: "$50 cashback on first move",   partner: "TrueNorth Movers",     category: "Moving",     perk: "$50 cashback",              cashback: 50,  unlockTier: "Funded",       icon: Truck },
  { id: "s3", name: "Free internet activation",     partner: "FibreLink",            category: "Utilities",  perk: "$0 install + 3 mo free",    cashback: 0,   unlockTier: "Funded",       icon: Zap },
  { id: "s4", name: "Smart thermostat – 30% off",   partner: "Nest Canada",          category: "Smart Home", perk: "30% off + free install",    cashback: 0,   unlockTier: "Funded",       icon: Zap },
  { id: "s5", name: "Energy audit + rebate",        partner: "GreenHome Co.",        category: "Energy",     perk: "Free audit + $200 rebate",  cashback: 200, unlockTier: "Funded",       icon: Leaf },
  { id: "s6", name: "Annual maintenance plan",      partner: "Handyman+",            category: "Maintenance",perk: "20% off + 2 free visits",   cashback: 0,   unlockTier: "Homeowner",    icon: Wrench },
  { id: "s7", name: "Property tax review",          partner: "TaxLine",              category: "Finance",    perk: "Free review",                cashback: 0,   unlockTier: "Pre-purchase", icon: FileText },
  { id: "s8", name: "Storage – 2 months free",      partner: "EasyStore",            category: "Moving",     perk: "2 months free locker",       cashback: 0,   unlockTier: "Funded",       icon: Package },
];

const LEDGER: LedgerEntry[] = [
  { date: "2026-05-22", description: "Cashback — TrueNorth Movers booking",        amount:  50.00, type: "pending" },
  { date: "2026-05-15", description: "Cashback — GreenHome energy audit rebate",   amount: 200.00, type: "earned" },
  { date: "2026-05-10", description: "Referral bonus — Jordan B. funded",          amount: 150.00, type: "earned" },
  { date: "2026-05-03", description: "Cashback — Maple Insurance enrolment",       amount:  45.00, type: "earned" },
  { date: "2026-04-29", description: "Welcome bundle activation",                  amount: 200.00, type: "earned" },
  { date: "2026-05-20", description: "Cashback redeemed to e-Transfer",            amount:-300.00, type: "redeemed" },
];

const REFERRALS = {
  code: "ALEX-HOME-2026",
  link: "https://approvu.ca/r/ALEX-HOME-2026",
  rewardEach: 150,
  invited: 4,
  signedUp: 3,
  funded: 1,
  pending: [
    { name: "Jordan B.", stage: "Funded",        rewardEarned: 150 },
    { name: "Sam K.",    stage: "Application",   rewardEarned:   0 },
    { name: "Priya R.",  stage: "Snapshot",      rewardEarned:   0 },
  ],
};

const ACTIVITY = [
  { date: "2026-05-22", text: "Moving Expense Credit redemption requested" },
  { date: "2026-05-20", text: "Legal Fee Rebate delivered — $500" },
  { date: "2026-05-15", text: "GreenHome rebate confirmed — $200 cashback" },
  { date: "2026-05-10", text: "Jordan B. funded via your referral — $150 bonus" },
  { date: "2026-04-29", text: "HomeStrategy Advantage™ bundle activated" },
];

// ─── Page ──────────────────────────────────────────────────────────────
type Tab = "bundle" | "storefront" | "rewards" | "referrals" | "activity";

function WalletPage() {
  const hasFundedMortgage = COMPLETED.length > 0;
  const [tab, setTab] = useState<Tab>("bundle");
  const [openBenefit, setOpenBenefit] = useState<Benefit | null>(null);
  const [benefits, setBenefits] = useState(BENEFITS);

  const counts = useMemo(() => ({
    available: benefits.filter((b) => b.status === "Available").length,
    inFlight:  benefits.filter((b) => b.status === "Requested" || b.status === "Confirmed").length,
    delivered: benefits.filter((b) => b.status === "Delivered").length,
    locked:    benefits.filter((b) => b.status === "Locked").length,
    availableValue: benefits.filter((b) => b.status === "Available").reduce((s, b) => s + b.value, 0),
    deliveredValue: benefits.filter((b) => b.status === "Delivered").reduce((s, b) => s + b.value, 0),
  }), [benefits]);

  if (!hasFundedMortgage) return <LockedWallet />;

  const updateStatus = (id: string, status: RedemptionStatus) => {
    setBenefits((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  return (
    <>
      <PageHeader
        eyebrow="Home Life Wallet"
        title="Your Home Life Wallet"
        description="Bundle benefits, partner storefront, cashback rewards, referrals, and loyalty perks tied to your funded approvU mortgage."
        right={
          <Link
            to="/portal/applications"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            View Mortgage Details
          </Link>
        }
      />

      {/* Loyalty hero */}
      <LoyaltyHero />

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard icon={Gift}          label="Available"        value={`${counts.available}`}             tone="primary" />
        <SummaryCard icon={Wallet}        label="Available value"  value={fmt(counts.availableValue)}        tone="secondary" />
        <SummaryCard icon={CheckCircle2}  label="Delivered value"  value={fmt(counts.deliveredValue)}        tone="mint" />
        <SummaryCard icon={Clock}         label="In progress"      value={`${counts.inFlight}`}              tone="yellow" />
        <SummaryCard icon={Banknote}      label="Cashback balance" value={fmt(BUNDLE.cashbackBalance)}       tone="primary" />
        <SummaryCard icon={Layers}        label="Locked tiers"     value={`${counts.locked}`}                tone="coral" />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap items-center gap-1 border-b border-border pb-2">
        {([
          { k: "bundle",     l: "Bundle",          icon: Sparkles },
          { k: "storefront", l: "Partner Storefront", icon: Store },
          { k: "rewards",    l: "Cashback & Rewards", icon: Banknote },
          { k: "referrals",  l: "Referrals",       icon: Users },
          { k: "activity",   l: "Activity",        icon: History },
        ] as const).map((t) => {
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.l}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "bundle"     && <BundleTab benefits={benefits} onOpen={setOpenBenefit} onUpdate={updateStatus} />}
        {tab === "storefront" && <StorefrontTab />}
        {tab === "rewards"    && <RewardsTab />}
        {tab === "referrals"  && <ReferralsTab />}
        {tab === "activity"   && <ActivityTab />}
      </div>

      <p className="mt-10 text-center text-[11px] text-muted-foreground">
        Benefits, cashback, and referral rewards are subject to bundle, partner, and program terms. Some perks require eligibility verification.
      </p>

      {openBenefit && (
        <BenefitDrawer
          benefit={openBenefit}
          onClose={() => setOpenBenefit(null)}
          onUpdate={(s) => { updateStatus(openBenefit.id, s); setOpenBenefit({ ...openBenefit, status: s }); }}
        />
      )}
    </>
  );
}

// ─── Loyalty Hero ───────────────────────────────────────────────────────
function LoyaltyHero() {
  const idx = TIERS.findIndex((t) => t.key === BUNDLE.currentTier);
  const next = TIERS[idx + 1];
  const earned = BUNDLE.lifetimeEarned;
  const toNext = next ? Math.max(0, next.threshold - earned) : 0;
  const progress = next ? Math.min(100, ((earned - TIERS[idx].threshold) / (next.threshold - TIERS[idx].threshold)) * 100) : 100;

  return (
    <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-lg">
      <div className="relative p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute right-10 top-10 opacity-10"><Sparkles className="h-32 w-32" /></div>

        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">
              <Trophy className="h-3.5 w-3.5" /> Loyalty tier · {BUNDLE.currentTier}
            </div>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">{BUNDLE.name}</h2>
            <p className="mt-1 text-sm text-primary-foreground/85">#{BUNDLE.applicationId} · {BUNDLE.property}</p>
            <p className="mt-0.5 text-xs text-primary-foreground/70">Funded {BUNDLE.fundedDate} · Bundle expires {BUNDLE.expires}</p>

            {/* Tier rail */}
            <ol className="mt-5 grid grid-cols-4 gap-2 text-[11px]">
              {TIERS.map((t, i) => {
                const reached = i <= idx;
                return (
                  <li key={t.key} className={`rounded-lg border px-2 py-1.5 ${
                    reached ? "border-primary-foreground/40 bg-primary-foreground/15" : "border-primary-foreground/15 bg-primary-foreground/5 opacity-70"
                  }`}>
                    <div className="flex items-center gap-1 font-semibold">
                      {reached ? <BadgeCheck className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {t.label}
                    </div>
                    <p className="mt-0.5 text-[10px] text-primary-foreground/75">{t.perks}</p>
                  </li>
                );
              })}
            </ol>

            {next && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-primary-foreground/85">
                  <span>{fmt(earned)} earned</span>
                  <span>{fmt(toNext)} to <strong>{next.label}</strong></span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
                  <div className="h-full rounded-full bg-primary-foreground" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="self-start rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/80">Cashback balance</p>
            <p className="mt-1 text-3xl font-semibold">{fmt(BUNDLE.cashbackBalance)}</p>
            <p className="mt-1 text-[11px] text-primary-foreground/75">Lifetime earned {fmt(BUNDLE.lifetimeEarned)}</p>
            <button
              onClick={() => toast.success("Payout requested via " + BUNDLE.payoutMethod)}
              className="mt-3 w-full rounded-md bg-primary-foreground px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-foreground/90"
            >
              Request payout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Bundle Tab ─────────────────────────────────────────────────────────
function BundleTab({ benefits, onOpen, onUpdate }: {
  benefits: Benefit[]; onOpen: (b: Benefit) => void; onUpdate: (id: string, s: RedemptionStatus) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {benefits.map((b) => <BenefitCard key={b.id} b={b} onOpen={() => onOpen(b)} onUpdate={(s) => onUpdate(b.id, s)} />)}
    </div>
  );
}

function BenefitCard({ b, onOpen, onUpdate }: { b: Benefit; onOpen: () => void; onUpdate: (s: RedemptionStatus) => void }) {
  const isLocked = b.status === "Locked";
  const isAvailable = b.status === "Available";

  return (
    <article className={`group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition ${
      isLocked ? "border-dashed border-border opacity-75" : "border-border hover:border-primary/30 hover:shadow-md"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            isLocked ? "bg-muted text-muted-foreground" : "bg-gradient-to-br from-primary/15 to-secondary/15 text-primary"
          }`}>
            {isLocked ? <Lock className="h-5 w-5" /> : <b.icon className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{b.category}</p>
            <h3 className="mt-0.5 text-sm font-semibold text-foreground">{b.name}</h3>
          </div>
        </div>
        <p className="shrink-0 text-lg font-semibold text-foreground">{fmt(b.value)}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RedemptionPill s={b.status} />
        {b.expires && b.status !== "Delivered" && b.status !== "Locked" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Expires {b.expires}
          </span>
        )}
        {b.redeemedOn && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" /> {b.redeemedOn}
          </span>
        )}
        {isLocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-[11px] font-medium text-coral">
            <Lock className="h-3 w-3" /> Unlocks at {b.unlockTier}
          </span>
        )}
      </div>

      {/* Status timeline for in-flight items */}
      {(b.status === "Requested" || b.status === "Confirmed" || b.status === "Delivered") && (
        <RedemptionTimeline status={b.status} />
      )}

      {isAvailable && b.code && (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">Redemption code</p>
            <p className="truncate font-mono text-sm font-semibold tracking-wide text-primary">{b.code}</p>
          </div>
          <CopyCode code={b.code} />
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button onClick={onOpen} className="text-xs font-medium text-primary hover:underline">View details →</button>
        {isAvailable && (
          <button
            onClick={() => { onUpdate("Requested"); toast.success(`${b.name} — claim requested`); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Gift className="h-4 w-4" /> Claim
          </button>
        )}
        {isLocked && (
          <Link to="/portal/tools" className="text-xs font-medium text-muted-foreground hover:text-foreground">How to unlock →</Link>
        )}
      </div>
    </article>
  );
}

function RedemptionTimeline({ status }: { status: RedemptionStatus }) {
  const steps: RedemptionStatus[] = ["Requested", "Confirmed", "Delivered"];
  const idx = steps.indexOf(status);
  return (
    <ol className="mt-4 flex items-center gap-1">
      {steps.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="flex flex-1 items-center gap-1">
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <div className={`h-px flex-1 ${i < idx ? "bg-primary" : "bg-border"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function RedemptionPill({ s }: { s: RedemptionStatus }) {
  const map: Record<RedemptionStatus, string> = {
    Available: "bg-mint/20 text-foreground",
    Requested: "bg-yellow/35 text-foreground",
    Confirmed: "bg-secondary/15 text-secondary",
    Delivered: "bg-primary/10 text-primary",
    Expired:   "bg-muted text-muted-foreground",
    Locked:    "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[s]}`}>{s}</span>;
}

// ─── Storefront Tab ─────────────────────────────────────────────────────
function StorefrontTab() {
  const cats = ["All", ...Array.from(new Set(STOREFRONT.map((o) => o.category)))];
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const tierIdx = TIERS.findIndex((t) => t.key === BUNDLE.currentTier);

  const filtered = STOREFRONT.filter((o) => {
    if (cat !== "All" && o.category !== cat) return false;
    if (query && !`${o.name} ${o.partner}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search partners or offers"
            className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-2 text-sm"
          />
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((o) => {
          const oIdx = TIERS.findIndex((t) => t.key === o.unlockTier);
          const locked = oIdx > tierIdx;
          return (
            <article key={o.id} className={`flex flex-col rounded-2xl border bg-card p-5 shadow-sm ${
              locked ? "border-dashed opacity-75" : "border-border hover:border-primary/30"
            }`}>
              <div className="flex items-start justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  locked ? "bg-muted text-muted-foreground" : "bg-secondary/15 text-secondary"
                }`}>
                  {locked ? <Lock className="h-4 w-4" /> : <o.icon className="h-4 w-4" />}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {o.category}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{o.name}</h3>
              <p className="text-xs text-muted-foreground">{o.partner}</p>
              <p className="mt-2 text-sm font-medium text-primary">{o.perk}</p>
              {(o.cashback ?? 0) > 0 && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-mint-foreground">
                  <Banknote className="h-3 w-3" /> +{fmt(o.cashback!)} cashback
                </p>
              )}
              <div className="mt-auto pt-4">
                {locked ? (
                  <p className="text-[11px] font-medium text-muted-foreground">Unlocks at {o.unlockTier} tier</p>
                ) : (
                  <button
                    onClick={() => toast.success(`${o.partner} — partner offer activated`)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Activate <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No partner offers match.
          </div>
        )}
      </div>
    </>
  );
}

// ─── Rewards Tab ───────────────────────────────────────────────────────
function RewardsTab() {
  const earned    = LEDGER.filter((e) => e.type === "earned").reduce((s, e) => s + e.amount, 0);
  const pending   = LEDGER.filter((e) => e.type === "pending").reduce((s, e) => s + e.amount, 0);
  const redeemed  = LEDGER.filter((e) => e.type === "redeemed").reduce((s, e) => s + Math.abs(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard icon={Banknote}     label="Available balance" value={fmt(BUNDLE.cashbackBalance)} tone="primary" />
        <SummaryCard icon={Sparkles}     label="Lifetime earned"   value={fmt(earned + redeemed + pending)} tone="secondary" />
        <SummaryCard icon={Clock}        label="Pending"           value={fmt(pending)}                tone="yellow" />
        <SummaryCard icon={CheckCircle2} label="Paid out"          value={fmt(redeemed)}               tone="mint" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Payout method</h3>
            <p className="text-xs text-muted-foreground">{BUNDLE.payoutMethod}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/portal/settings/payment-methods" className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted">
              Change method
            </Link>
            <button
              onClick={() => toast.success(`Payout of ${fmt(BUNDLE.cashbackBalance)} requested`)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Request payout
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Rewards ledger</h3>
        </header>
        <ul className="divide-y divide-border">
          {LEDGER.map((e, i) => (
            <li key={i} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-foreground">{e.description}</p>
                <p className="text-[11px] text-muted-foreground">{e.date} · <span className="capitalize">{e.type}</span></p>
              </div>
              <p className={`shrink-0 text-sm font-semibold ${
                e.type === "redeemed" ? "text-coral" : e.type === "pending" ? "text-muted-foreground" : "text-mint-foreground"
              }`}>
                {e.amount > 0 ? "+" : ""}{fmt(Math.abs(e.amount))}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ─── Referrals Tab ──────────────────────────────────────────────────────
function ReferralsTab() {
  const [email, setEmail] = useState("");
  const sendInvite = () => {
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    toast.success(`Invite sent to ${email}`);
    setEmail("");
  };
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/15 via-card to-primary/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">Refer & Earn</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
              Both get {fmt(REFERRALS.rewardEach)} when they fund
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Share your link with friends or family. You earn {fmt(REFERRALS.rewardEach)} cashback and they receive a bundle bump on their first mortgage.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <RefStat label="Invited"   value={REFERRALS.invited} />
            <RefStat label="Signed up" value={REFERRALS.signedUp} />
            <RefStat label="Funded"    value={REFERRALS.funded} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Your code</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-semibold text-primary">{REFERRALS.code}</p>
              <CopyCode code={REFERRALS.code} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Share link</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-foreground">{REFERRALS.link}</p>
              <CopyCode code={REFERRALS.link} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@email.com"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={sendInvite}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" /> Send invite
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Your referrals</h3>
        </header>
        <ul className="divide-y divide-border">
          {REFERRALS.pending.map((r) => (
            <li key={r.name} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {r.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">Stage: {r.stage}</p>
                </div>
              </div>
              <p className={`text-sm font-semibold ${r.rewardEarned ? "text-mint-foreground" : "text-muted-foreground"}`}>
                {r.rewardEarned ? `+${fmt(r.rewardEarned)}` : "Pending"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RefStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card/70 px-3 py-2">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Activity Tab ──────────────────────────────────────────────────────
function ActivityTab() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
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
  );
}

// ─── Drawer & helpers ──────────────────────────────────────────────────
function BenefitDrawer({ benefit, onClose, onUpdate }: { benefit: Benefit; onClose: () => void; onUpdate: (s: RedemptionStatus) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <aside className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
          <section className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{benefit.category}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{fmt(benefit.value)}</p>
              </div>
              <RedemptionPill s={benefit.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              {benefit.expires && <DT label="Expires" value={benefit.expires} />}
              {benefit.redeemedOn && <DT label="Redeemed" value={benefit.redeemedOn} />}
              <DT label="Bundle" value={BUNDLE.name} />
              <DT label="Application" value={`#${BUNDLE.applicationId}`} />
            </dl>
            {(benefit.status === "Requested" || benefit.status === "Confirmed" || benefit.status === "Delivered") && (
              <div className="mt-4"><RedemptionTimeline status={benefit.status} /></div>
            )}
          </section>

          {benefit.code && benefit.status !== "Locked" && (
            <section>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><KeyRound className="h-4 w-4 text-primary" /> Redemption code</h4>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
                <p className="font-mono text-base font-semibold tracking-wider text-primary">{benefit.code}</p>
                <CopyCode code={benefit.code} />
              </div>
            </section>
          )}

          {benefit.instructions && (
            <section>
              <h4 className="mb-2 text-sm font-semibold text-foreground">How to redeem</h4>
              <ol className="space-y-2">
                {benefit.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {benefit.partner && (
            <section>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Partner</h4>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-sm font-medium text-foreground">{benefit.partner.name}</p>
                {benefit.partner.serviceArea && <p className="text-xs text-muted-foreground">{benefit.partner.serviceArea}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {benefit.partner.website && (
                    <a className="inline-flex items-center gap-1 font-medium text-primary hover:underline" href={`https://${benefit.partner.website}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3" /> {benefit.partner.website}
                    </a>
                  )}
                  {benefit.partner.phone && <span className="inline-flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {benefit.partner.phone}</span>}
                  {benefit.partner.email && <span className="inline-flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {benefit.partner.email}</span>}
                </div>
              </div>
            </section>
          )}

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

          {/* Status actions */}
          {benefit.status === "Available" && (
            <button onClick={() => { onUpdate("Requested"); toast.success("Claim requested"); }}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Request redemption
            </button>
          )}
          {benefit.status === "Requested" && (
            <button onClick={() => { onUpdate("Confirmed"); toast.success("Partner confirmed"); }}
              className="w-full rounded-md bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90">
              Mark as confirmed
            </button>
          )}
          {benefit.status === "Confirmed" && (
            <button onClick={() => { onUpdate("Delivered"); toast.success("Marked delivered"); }}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Mark as delivered
            </button>
          )}
          {benefit.status === "Locked" && (
            <p className="rounded-md bg-muted p-3 text-center text-xs text-muted-foreground">
              Unlocks at the <strong>{benefit.unlockTier}</strong> loyalty tier.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch { toast.error("Couldn't copy"); }
  };
  return (
    <button onClick={copy} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
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

function fmt(n: number) {
  if (Math.abs(n) >= 1 && !Number.isInteger(n)) return `$${n.toFixed(2)}`;
  return `$${n.toLocaleString()}`;
}

function LockedWallet() {
  const previews = [
    { name: "Legal fee rebates",    icon: Scale },
    { name: "Home inspection credits", icon: Home },
    { name: "Moving credits",       icon: Truck },
    { name: "Home insurance offers", icon: Shield },
    { name: "Smart home offers",    icon: Zap },
    { name: "Cashback rewards",     icon: Banknote },
    { name: "Referral bonuses",     icon: Users },
    { name: "Loyalty tiers",        icon: Trophy },
    { name: "Partner storefront",   icon: Store },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Home Life Wallet"
        title="Your Home Life Wallet"
        description="Your benefits, cashback, and partner storefront unlock once your mortgage is funded through approvU. Pre-purchase tier perks are available now."
      />
      <section className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-secondary/10 p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lock className="h-6 w-6" /></div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">Wallet unlocks after funding</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          You're at the <strong>Pre-purchase</strong> tier. Once your mortgage closes through approvU you'll move to <strong>Funded</strong> and unlock bundle credits, partner offers, and cashback.
        </p>
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
          {previews.map((p) => (
            <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary"><p.icon className="h-4 w-4" /></span>
              <p className="text-sm font-medium text-foreground">{p.name}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/portal/applications" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            View My Applications <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <button onClick={() => toast.success("Starting a new mortgage snapshot…")}
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Start New Mortgage Snapshot
          </button>
        </div>
        <p className="mt-6 text-[11px] text-muted-foreground">Calendar view in your dashboard tracks renewal dates automatically.</p>
        <Calendar className="hidden" />
      </section>
    </>
  );
}
