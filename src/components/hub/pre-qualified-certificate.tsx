import {
  ArrowRight,
  Award,
  CheckCircle2,
  FileText,
  Gift,
  Heart,
  Home,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import type { ComponentType } from "react";

const CERT = {
  amount: "$650,000",
  rateRange: "5.25% – 6.15%",
  estimatedMonthly: "$3,580/mo",
  validUntil: "March 24, 2025",
  certificateNumber: "AUP-2024-12-0892",
  issueDate: "December 24, 2024",
  lendersCount: 25,
  productsCount: 12438,
};

const REASSURANCE = [
  { title: "You're a serious buyer.", body: "Show sellers you're ready to make offers confidently." },
  { title: "Zero credit impact.", body: "Unlike lender pre-approvals, this didn't affect your credit score." },
  { title: "Multi-lender advantage.", body: "You're qualified across 25 lenders, not just one." },
  { title: "Fast-track ready.", body: "Turn this into an official pre-approval in 24 hours when you find your home." },
];

type Benefit = {
  icon: ComponentType<{ className?: string }>;
  name: string;
  blurb: string;
  save: string;
};

const BENEFITS: Benefit[] = [
  { icon: FileText, name: "Legal Fees Protection", blurb: "Up to $1,500 in legal fee coverage", save: "Save $1,500" },
  { icon: Home, name: "Home Appraisal Credit", blurb: "Complimentary home appraisal service", save: "Save $500" },
  { icon: ShieldCheck, name: "Home Insurance Discount", blurb: "First year premium discount", save: "Save $850" },
  { icon: Truck, name: "Moving Services Package", blurb: "Professional moving assistance", save: "Save $400" },
];

const TOTAL_BUNDLE_VALUE = "$3,250";

export function PreQualifiedCertificateContent() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-secondary/15 via-secondary/5 to-card p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-card/80 px-3 py-1 text-xs font-semibold text-secondary backdrop-blur">
          <Award className="h-3.5 w-3.5" /> Congratulations!
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-secondary sm:text-5xl">
          You're Pre-Qualified! <span aria-hidden>🎉</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Your dream home just got <span className="font-semibold text-foreground">closer</span>. You're
          pre-qualified for up to <span className="font-semibold text-foreground">{CERT.amount}</span>{" "}
          across {CERT.lendersCount}+ trusted lenders.
        </p>
      </section>

      {/* Certificate */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Sparkles className="h-5 w-5 text-secondary" /> approvU Pre-Qualification Certificate
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Official pre-qualification across multiple lenders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/90">
              <FileText className="h-3.5 w-3.5" /> Download PDF
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
              Share
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Pre-Qualified For</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-secondary">{CERT.amount}</p>
            <p className="mt-4 text-xs font-medium text-muted-foreground">Estimated Rate Range</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{CERT.rateRange}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimated monthly: {CERT.estimatedMonthly}
            </p>
          </div>
          <div className="rounded-2xl bg-secondary/15 p-5">
            <Field label="Valid Until" value={CERT.validUntil} />
            <div className="mt-4 border-t border-secondary/20 pt-4">
              <Field label="Certificate Number" value={CERT.certificateNumber} mono />
            </div>
            <div className="mt-4 border-t border-secondary/20 pt-4">
              <Field label="Issue Date" value={CERT.issueDate} />
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-secondary/5 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Heart className="h-4 w-4 text-secondary" /> What This Means For You
          </h3>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {REASSURANCE.map((r) => (
              <li key={r.title} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{r.title}</span> {r.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bundle */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="bg-gradient-to-r from-primary to-secondary p-5 text-primary-foreground sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Gift className="h-5 w-5" /> Your Home Life Bundle™ Awaits
          </h2>
          <p className="mt-1 text-sm text-primary-foreground/85">
            We've unlocked <span className="font-semibold">{TOTAL_BUNDLE_VALUE} in exclusive benefits</span>{" "}
            to make your home buying journey smoother and more affordable.
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
          {BENEFITS.map((b) => (
            <BenefitRow key={b.name} benefit={b} />
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Bundle Value</p>
            <p className="mt-1 text-3xl font-semibold text-secondary">{TOTAL_BUNDLE_VALUE}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Available when you complete your mortgage application
            </p>
          </div>
          <button className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90">
            Activate Benefits <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Found home CTA */}
      <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <Home className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Found Your Dream Home?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Turn this pre-qualification into an official pre-approval in as little as 24 hours. Upload
          your property details and we'll fast-track your application.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90">
            <Sparkles className="h-4 w-4" /> I Found a Property!
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
            <Search className="h-4 w-4" /> Browse My Qualified Products
          </button>
        </div>
      </section>

      {/* Disclosures */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-secondary" /> Important Information
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-8 text-xs text-muted-foreground">
          <li>This pre-qualification is not a commitment to lend and does not guarantee loan approval.</li>
          <li>Interest rates are estimates based on current market conditions and subject to change.</li>
          <li>Official pre-approval requires income verification, credit check, and lender approval.</li>
          <li>
            Rates shown reflect data from {CERT.productsCount.toLocaleString()} products across{" "}
            {CERT.lendersCount} lending partners as of {CERT.issueDate}.
          </li>
          <li>
            This certificate is valid for 90 days. After this period, you may need to re-qualify based
            on updated financial information.
          </li>
          <li>
            Home Life Bundle™ benefits are subject to terms and conditions and available only when
            completing your mortgage through approvU.
          </li>
        </ul>
      </section>

      <div className="text-center">
        <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4 rotate-180" /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function BenefitRow({ benefit }: { benefit: Benefit }) {
  const Icon = benefit.icon;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
      <span className="rounded-lg bg-secondary/10 p-2 text-secondary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{benefit.name}</p>
          <span className="shrink-0 rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-semibold text-foreground">
            Available
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{benefit.blurb}</p>
        <p className="mt-2 text-sm font-semibold text-secondary">{benefit.save}</p>
      </div>
    </div>
  );
}