import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Gift,
  Home,
  Info,
  Lock,
  Mail,
  Package,
  Phone,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────
type OfferStatus =
  | "Locked"
  | "Pending Activation"
  | "Available"
  | "Redeemed"
  | "Expired"
  | "Replaced"
  | "No Longer Eligible";

type ApplicationFundingStage =
  | "in_application"
  | "submitted"
  | "approval_accepted"
  | "in_funding"
  | "funded";

type Benefit = {
  id: string;
  name: string;
  partner: string;
  partnerTier?: "Standard" | "Premium" | "Elite";
  category: string;
  subcategory: string;
  value: number;
  description: string;
  longDescription: string;
  unlockTiming: string;
  expiresAt: string;
  status: OfferStatus;
  redemptionCode?: string;
  redeemedAt?: string;
  icon: ComponentType<{ className?: string }>;
  partnerContact: { phone: string; email: string; website: string; serviceArea: string };
  redemptionSteps: string[];
  terms: string[];
};

// ─── Mock Data ────────────────────────────────────────────────────────────
const SELECTED_OFFER = {
  name: "Best Value Fixed Offer",
  bundle: "HomeStrategy Advantage™",
  productGroup: "5-yr Fixed — Insured",
};

const BENEFITS: Benefit[] = [
  {
    id: "no-appraisal-fees",
    name: "No Appraisal Fees",
    partner: "First National Bank",
    partnerTier: "Premium",
    category: "Homeownership Services",
    subcategory: "Appraisal",
    value: 400,
    description: "Skip the appraisal fee — covered by your lender as part of your mortgage package.",
    longDescription:
      "Your selected lender has waived the standard property appraisal fee for your mortgage. This is automatically applied at closing — no action required on your part.",
    unlockTiming: "After mortgage funding",
    expiresAt: "2026-09-29",
    status: "Locked",
    icon: Home,
    partnerContact: {
      phone: "1-800-555-0140",
      email: "appraisal@firstnationalbank.example",
      website: "https://example.com/first-national",
      serviceArea: "Nationwide",
    },
    redemptionSteps: [
      "Fund your mortgage through approvU to activate this benefit",
      "Your lender automatically applies the appraisal fee waiver at closing",
      "Your closing statement will reflect the $400 credit",
      "No action required on your part",
    ],
    terms: [
      "Valid only for approvU mortgage clients with funded loans",
      "Applies to standard residential property appraisals only",
      "Cannot be combined with other appraisal promotions",
      "Credit is non-transferable",
    ],
  },
  {
    id: "home-inspection-credit",
    name: "Home Inspection Credit",
    partner: "ProInspect Services",
    partnerTier: "Premium",
    category: "Homeownership Services",
    subcategory: "Inspection",
    value: 500,
    description: "Professional home inspection credit with our trusted inspection partner.",
    longDescription:
      "Receive a $500 credit toward a comprehensive home inspection from ProInspect Services. Inspection includes structural, electrical, plumbing, and HVAC evaluation.",
    unlockTiming: "24 hours after mortgage funding",
    expiresAt: "2026-12-15",
    status: "Locked",
    icon: Wrench,
    partnerContact: {
      phone: "1-888-555-0192",
      email: "bookings@proinspect.example",
      website: "https://example.com/proinspect",
      serviceArea: "Major metro areas",
    },
    redemptionSteps: [
      "Fund your mortgage through approvU to activate this benefit",
      "Receive your secure redemption code in your Home Life Wallet",
      "Contact ProInspect Services to book your inspection",
      "Provide your approvU redemption code when booking",
      "Complete inspection within 90 days of closing",
      "Credit applied directly to your invoice",
    ],
    terms: [
      "Valid only for funded approvU mortgage clients",
      "Service must be booked within 90 days of mortgage funding",
      "Applies to standard residential inspections only",
      "Code is tied to your mortgage application ID",
    ],
  },
  {
    id: "legal-fee-rebate",
    name: "Legal Fee Rebate",
    partner: "LegalEase Partners",
    partnerTier: "Premium",
    category: "Homeownership Services",
    subcategory: "Lawyer",
    value: 500,
    description: "Rebate on legal fees for closing services with our preferred legal partner.",
    longDescription:
      "Save $500 on closing legal fees when you use LegalEase Partners for your mortgage closing. Includes title review, document preparation, and registration.",
    unlockTiming: "After mortgage funding",
    expiresAt: "2026-10-30",
    status: "Locked",
    icon: Scale,
    partnerContact: {
      phone: "1-877-555-0123",
      email: "intake@legalease.example",
      website: "https://example.com/legalease",
      serviceArea: "Nationwide",
    },
    redemptionSteps: [
      "Fund your mortgage through approvU to activate this benefit",
      "Receive your secure redemption code in your Home Life Wallet",
      "Engage LegalEase Partners for your closing",
      "Provide your approvU redemption code at engagement",
      "Rebate applied to your final invoice",
    ],
    terms: [
      "Valid for approvU mortgage closings only",
      "Must engage LegalEase Partners before closing date",
      "Cannot be combined with other legal fee promotions",
      "Rebate is non-transferable",
    ],
  },
  {
    id: "moving-credit",
    name: "$500 Moving Expense Credit",
    partner: "Swift Movers Pro",
    partnerTier: "Premium",
    category: "Moving Services",
    subcategory: "Movers",
    value: 500,
    description: "Professional moving services credit to help with your relocation.",
    longDescription:
      "Professional moving services credit to help with your relocation. Includes packing, loading, transportation, and unloading services with our vetted moving partner.",
    unlockTiming: "Immediately after mortgage funding",
    expiresAt: "2026-09-29",
    status: "Locked",
    icon: Truck,
    partnerContact: {
      phone: "1-800-555-0167",
      email: "bookings@swiftmovers.example",
      website: "https://example.com/swiftmovers",
      serviceArea: "Local moves within 100 miles",
    },
    redemptionSteps: [
      "Fund your mortgage through approvU to activate this benefit",
      "Receive your secure redemption code in your Home Life Wallet",
      "Contact Swift Movers Pro to schedule your move",
      "Provide your approvU redemption code when booking",
      "Complete service within 120 days of closing",
      "Credit applied directly to your moving invoice",
    ],
    terms: [
      "Valid only for funded approvU mortgage clients",
      "Code is tied to your mortgage application ID",
      "Valid for local moves within 100 miles",
      "Must book services at least 2 weeks in advance",
      "Credit applies to standard moving services only",
      "Code expires 120 days after mortgage funding",
      "Cannot be transferred, sold, or shared",
    ],
  },
  {
    id: "home-insurance",
    name: "2 Months Free Home Insurance",
    partner: "SecureHome Insurance",
    partnerTier: "Premium",
    category: "Insurance Services",
    subcategory: "Home Insurance",
    value: 450,
    description: "Two months of complimentary home insurance coverage for your new home.",
    longDescription:
      "Get two months of free home insurance from SecureHome Insurance with the purchase of an annual policy. Coverage includes dwelling, personal property, and liability protection.",
    unlockTiming: "48 hours after mortgage funding",
    expiresAt: "2026-11-12",
    status: "Locked",
    icon: Shield,
    partnerContact: {
      phone: "1-855-555-0188",
      email: "newpolicies@securehome.example",
      website: "https://example.com/securehome",
      serviceArea: "Nationwide",
    },
    redemptionSteps: [
      "Fund your mortgage through approvU to activate this benefit",
      "Receive your secure redemption code in your Home Life Wallet",
      "Contact SecureHome Insurance for a quote",
      "Provide your approvU redemption code when purchasing",
      "Two months free applied to your annual policy",
    ],
    terms: [
      "Valid only for funded approvU mortgage clients",
      "Requires purchase of an annual home insurance policy",
      "Code is tied to your mortgage application ID",
      "Cannot be combined with other insurance promotions",
      "Code expires 60 days after mortgage funding",
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function statusBadgeCls(status: OfferStatus) {
  switch (status) {
    case "Available":
      return "bg-mint/20 text-foreground";
    case "Pending Activation":
      return "bg-yellow/20 text-foreground";
    case "Redeemed":
      return "bg-secondary/15 text-secondary";
    case "Expired":
    case "No Longer Eligible":
      return "bg-muted text-muted-foreground";
    case "Replaced":
      return "bg-coral/15 text-coral";
    case "Locked":
    default:
      return "bg-muted text-muted-foreground";
  }
}

function fmtMoney(v: number) {
  return `$${v.toLocaleString()}`;
}

// Apply funding stage to benefits
function applyStage(benefits: Benefit[], stage: ApplicationFundingStage): Benefit[] {
  if (stage !== "funded") return benefits;
  return benefits.map((b) => ({
    ...b,
    status: "Available" as OfferStatus,
    redemptionCode: `APR-${b.subcategory.slice(0, 3).toUpperCase()}-${b.id.slice(0, 4).toUpperCase()}`,
  }));
}

// ─── Main Component ───────────────────────────────────────────────────────
export function ExclusiveOffersContent({
  fundingStage = "in_application",
}: {
  fundingStage?: ApplicationFundingStage;
}) {
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const benefits = useMemo(() => applyStage(BENEFITS, fundingStage), [fundingStage]);

  if (activeOfferId) {
    const benefit = benefits.find((b) => b.id === activeOfferId);
    if (benefit) {
      return (
        <BenefitDetailPage
          benefit={benefit}
          fundingStage={fundingStage}
          onBack={() => setActiveOfferId(null)}
        />
      );
    }
  }

  return (
    <ExclusiveOffersListPage
      benefits={benefits}
      fundingStage={fundingStage}
      onView={(id) => setActiveOfferId(id)}
    />
  );
}

// ─── List Page ────────────────────────────────────────────────────────────
function ExclusiveOffersListPage({
  benefits,
  fundingStage,
  onView,
}: {
  benefits: Benefit[];
  fundingStage: ApplicationFundingStage;
  onView: (id: string) => void;
}) {
  const totalValue = benefits.reduce((sum, b) => sum + b.value, 0);
  const counts = {
    total: benefits.length,
    locked: benefits.filter((b) => b.status === "Locked").length,
    available: benefits.filter((b) => b.status === "Available").length,
    redeemed: benefits.filter((b) => b.status === "Redeemed").length,
    expiringSoon: 0,
  };
  const isFunded = fundingStage === "funded";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-primary sm:text-3xl">
          Your Mortgage Benefits Package
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exclusive benefits included with your selected mortgage product.
        </p>
      </header>

      {/* Header summary */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary-foreground/70">
              Selected Offer
            </p>
            <h2 className="mt-1 text-xl font-semibold">{SELECTED_OFFER.name}</h2>
            <p className="mt-1 text-sm text-primary-foreground/80">
              {SELECTED_OFFER.productGroup} · {SELECTED_OFFER.bundle}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isFunded ? "bg-mint/30 text-primary-foreground" : "bg-primary-foreground/15 text-primary-foreground"
          }`}>
            {isFunded ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {isFunded ? "Active" : "Locked until funding"}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70">
              Included Benefits
            </p>
            <p className="mt-1 text-2xl font-semibold">{counts.total}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70">
              Total Value
            </p>
            <p className="mt-1 text-2xl font-semibold">{fmtMoney(totalValue)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70">
              Bundle
            </p>
            <p className="mt-1 text-sm font-semibold">{SELECTED_OFFER.bundle}</p>
          </div>
        </div>
      </div>

      {/* Locked notice */}
      {!isFunded && <BenefitsLockedNotice fundingStage={fundingStage} />}
      {isFunded && (
        <div className="rounded-2xl border border-mint/40 bg-mint/15 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-mint" />
            Your benefits are now active
          </div>
          <p className="mt-1 text-xs text-foreground/80">
            Your redemption codes are now available. Tap any benefit to view your code and how to redeem.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryStat label="Included" value={String(counts.total)} icon={Package} tone="primary" />
        <SummaryStat label="Total Value" value={fmtMoney(totalValue)} icon={Award} tone="mint" />
        <SummaryStat
          label={isFunded ? "Available" : "Locked"}
          value={isFunded ? String(counts.available) : String(counts.locked)}
          icon={isFunded ? Sparkles : Lock}
          tone={isFunded ? "secondary" : "coral"}
        />
        <SummaryStat label="Redeemed" value={String(counts.redeemed)} icon={CheckCircle2} tone="secondary" />
      </div>

      {/* Disclosure */}
      <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
          <p className="text-xs text-foreground/80">
            Your benefits are based on your selected mortgage offer and initial qualification details.
            Final benefits may change after your full application is reviewed and your mortgage product is confirmed.
          </p>
        </div>
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {benefits.map((b) => (
          <BenefitCard key={b.id} benefit={b} onView={() => onView(b.id)} />
        ))}
      </div>

      {/* Trust panel */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary/10 p-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-primary">Exclusive approvU Benefits</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              These benefits are automatically included with your selected mortgage product and are
              exclusively available to approvU clients. No additional selection is required — simply
              complete your mortgage funding to unlock your benefits.
            </p>
            <p className="mt-2 text-xs text-foreground/70">
              {isFunded
                ? "Your redemption codes are now available in your Home Life Wallet."
                : "Your redemption codes will become available after your mortgage is funded and closed."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub Components ───────────────────────────────────────────────────────
function BenefitsLockedNotice({ fundingStage }: { fundingStage: ApplicationFundingStage }) {
  const cta =
    fundingStage === "submitted"
      ? "View Application Status"
      : fundingStage === "approval_accepted" || fundingStage === "in_funding"
        ? "View Funding Conditions"
        : "Continue Mortgage Application";

  return (
    <div className="rounded-2xl border border-yellow/50 bg-yellow/15 p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-background p-2 text-foreground shadow-sm">
          <Lock className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">Benefits Currently Locked</h3>
          <p className="mt-1 text-sm text-foreground/80">
            These exclusive benefits are included with your selected mortgage product. Complete your
            mortgage application and fund your mortgage through approvU to unlock all benefits and
            receive your redemption codes.
          </p>

          <div className="mt-4 rounded-xl bg-background/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              How to unlock your benefits
            </p>
            <ol className="mt-2 space-y-2 text-xs text-foreground/85">
              {[
                "Complete your mortgage application through approvU",
                "Your application is reviewed and approved",
                "Your mortgage is funded and closed",
                "Access all benefit codes in your Home Life Wallet",
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <button className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {cta} <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: "primary" | "secondary" | "mint" | "coral";
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
    </div>
  );
}

function UnlockCta({ fundingStage }: { fundingStage: ApplicationFundingStage }) {
  if (fundingStage === "submitted") {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="mt-3 inline-flex cursor-not-allowed items-center justify-center rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
      >
        Application Submitted — Awaiting Review
      </button>
    );
  }

  const goToFunding = fundingStage === "approval_accepted" || fundingStage === "in_funding";
  const label = goToFunding ? "View Funding Conditions" : "Continue Mortgage Application";
  const section = goToFunding ? "funding-conditions" : "mortgage-application";

  return (
    <Link
      to="/internal/full-application"
      search={{ section }}
      className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {label}
      <ArrowRight className="ml-1 h-3.5 w-3.5" />
    </Link>
  );
}

function BenefitCard({ benefit, onView }: { benefit: Benefit; onView: () => void }) {
  const Icon = benefit.icon;
  const isLocked = benefit.status === "Locked";
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="relative flex items-start justify-between border-b border-border bg-muted/40 p-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-1.5">
          {benefit.partnerTier === "Premium" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary">
              <Sparkles className="h-3 w-3" />
              Premium
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeCls(benefit.status)}`}>
            {isLocked && <Lock className="h-3 w-3" />}
            {benefit.status}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-foreground">{benefit.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{benefit.partner}</p>
        <p className="mt-3 text-2xl font-semibold text-primary">{fmtMoney(benefit.value)}</p>
        <p className="mt-2 text-xs text-foreground/75 line-clamp-2">{benefit.description}</p>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          Unlocks: {benefit.unlockTiming}
        </p>
        <button
          onClick={onView}
          className="mt-4 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Detail Page ──────────────────────────────────────────────────────────
type Tab = "overview" | "redeem" | "terms";

function BenefitDetailPage({
  benefit,
  fundingStage,
  onBack,
}: {
  benefit: Benefit;
  fundingStage: ApplicationFundingStage;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);
  const Icon = benefit.icon;
  const isLocked = benefit.status === "Locked";
  const isAvailable = benefit.status === "Available";

  const copyCode = () => {
    if (!benefit.redemptionCode) return;
    navigator.clipboard?.writeText(benefit.redemptionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Benefits
      </button>

      {/* Hero Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary via-primary to-secondary p-6 text-primary-foreground shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/15 text-primary-foreground">
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">{benefit.name}</h1>
              <p className="mt-1 text-sm text-primary-foreground/80">
                {benefit.partner}
                {benefit.partnerTier && ` · ${benefit.partnerTier} Partner`}
              </p>
              <p className="mt-0.5 text-xs text-primary-foreground/70">{benefit.category}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isAvailable ? "bg-mint/30 text-primary-foreground" : "bg-primary-foreground/15 text-primary-foreground"
          }`}>
            {isLocked && <Lock className="h-3.5 w-3.5" />}
            {isAvailable && <CheckCircle2 className="h-3.5 w-3.5" />}
            {benefit.status}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70">Value</p>
            <p className="mt-1 text-3xl font-semibold">{fmtMoney(benefit.value)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70">Expires</p>
            <p className="mt-1 text-sm font-semibold">{benefit.expiresAt}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70">Unlocks</p>
            <p className="mt-1 text-sm font-semibold">{benefit.unlockTiming}</p>
          </div>
        </div>

        {isAvailable && benefit.redemptionCode && (
          <div className="mt-5 rounded-xl bg-primary-foreground/10 p-4 backdrop-blur">
            <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70">
              Redemption Code
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-lg font-semibold tracking-wider">{benefit.redemptionCode}</p>
              <div className="flex gap-2">
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary-foreground px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-foreground/90"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy Code"}
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-primary-foreground/30 bg-transparent px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/10">
                  <Phone className="h-3.5 w-3.5" />
                  Contact Partner
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status notice */}
      {isLocked && (
        <div className="rounded-2xl border border-yellow/50 bg-yellow/15 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Benefit Currently Locked</h3>
              <p className="mt-1 text-xs text-foreground/80">
                This benefit unlocks immediately after your mortgage is funded and closed through
                approvU. Complete your mortgage funding to receive your secure redemption code.
              </p>
              <UnlockCta fundingStage={fundingStage} />
            </div>
          </div>
        </div>
      )}
      {isAvailable && (
        <div className="rounded-2xl border border-mint/40 bg-mint/15 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-mint" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Benefit Available</h3>
              <p className="mt-0.5 text-xs text-foreground/80">
                Your redemption code is ready. Follow the steps below to redeem this benefit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex border-b border-border">
          {[
            { id: "overview", label: "Overview" },
            { id: "redeem", label: "How to Redeem" },
            { id: "terms", label: "Terms & Conditions" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                tab === t.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          {tab === "overview" && <OverviewTab benefit={benefit} isLocked={isLocked} />}
          {tab === "redeem" && (
            <RedeemTab
              benefit={benefit}
              isLocked={isLocked}
              copied={copied}
              onCopy={copyCode}
              fundingStage={fundingStage}
            />
          )}
          {tab === "terms" && <TermsTab benefit={benefit} />}
        </div>
      </div>

      {/* Security notice */}
      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold text-foreground">Important Security Notice</p>
            <p className="mt-1 text-xs text-foreground/75">
              All benefit redemption codes are uniquely generated and tied to your specific approvU
              mortgage application. Codes cannot be shared, transferred, sold, or used by other
              individuals. Misuse may result in benefit forfeiture.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ benefit, isLocked }: { benefit: Benefit; isLocked: boolean }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-primary">About This Benefit</h3>
        <p className="mt-2 text-sm text-foreground/85">{benefit.longDescription}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Benefit Details
          </p>
          <dl className="mt-3 space-y-2 text-xs">
            <DetailRow label="Value" value={fmtMoney(benefit.value)} />
            <DetailRow label="Status" value={benefit.status} />
            {benefit.partnerTier && <DetailRow label="Partner Tier" value={benefit.partnerTier} />}
            <DetailRow label="Expires" value={benefit.expiresAt} />
            <DetailRow label="Category" value={benefit.category} />
            <DetailRow label="Subcategory" value={benefit.subcategory} />
            <DetailRow label="Bundle" value={SELECTED_OFFER.bundle} />
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Partner Contact
          </p>
          {isLocked ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Partner contact details unlock after funding.
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-xs text-foreground/85">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                {benefit.partnerContact.phone}
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                {benefit.partnerContact.email}
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                {benefit.partnerContact.website}
              </li>
              <li className="flex items-start gap-2">
                <Home className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                {benefit.partnerContact.serviceArea}
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function RedeemTab({
  benefit,
  isLocked,
  copied,
  onCopy,
  fundingStage,
}: {
  benefit: Benefit;
  isLocked: boolean;
  copied: boolean;
  onCopy: () => void;
  fundingStage: ApplicationFundingStage;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-primary">How to Redeem This Benefit</h3>
        {isLocked && (
          <div className="mt-3 rounded-xl border border-yellow/50 bg-yellow/15 p-4">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 text-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Benefit Currently Locked</p>
                <p className="mt-1 text-xs text-foreground/80">
                  Complete your mortgage funding through approvU to unlock redemption instructions
                  and receive your unique benefit code.
                </p>
                <button className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                  {fundingStage === "approval_accepted" || fundingStage === "in_funding"
                    ? "View Funding Conditions"
                    : "Continue Mortgage Application"}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ol className="space-y-3">
        {benefit.redemptionSteps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <p className="text-sm text-foreground/85">{s}</p>
          </li>
        ))}
      </ol>

      {!isLocked && benefit.redemptionCode && (
        <div className="rounded-xl border border-mint/40 bg-mint/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Redemption Code
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-lg font-semibold tracking-wider text-foreground">
              {benefit.redemptionCode}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy Code"}
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                <Phone className="h-3.5 w-3.5" />
                Contact Partner
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Clock className="h-3.5 w-3.5" /> Important Timeline
        </p>
        <p className="mt-1 text-xs text-foreground/75">
          {isLocked
            ? `Unlocks ${benefit.unlockTiming.toLowerCase()}.`
            : `Unlocks ${benefit.unlockTiming.toLowerCase()}.`}{" "}
          This benefit expires on {benefit.expiresAt}.
        </p>
      </div>
    </div>
  );
}

function TermsTab({ benefit }: { benefit: Benefit }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-primary">Terms & Conditions</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Please review the following terms carefully before redeeming this benefit.
        </p>
      </div>
      <ul className="space-y-2.5">
        {benefit.terms.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
            <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {t}
          </li>
        ))}
      </ul>
      <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
          <p className="text-xs text-foreground/80">
            All benefit redemption codes are uniquely generated and tied to your specific approvU
            mortgage application. Codes cannot be shared, transferred, sold, or used by other
            individuals.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

// Empty state export for downstream use
export function EmptyBenefitsState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Gift className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">No benefits yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Once you select a mortgage offer, your included benefits will appear here.
      </p>
    </div>
  );
}