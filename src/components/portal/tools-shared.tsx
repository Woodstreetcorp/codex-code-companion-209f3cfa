import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, RotateCcw, Save } from "lucide-react";

// ─── Formatting ────────────────────────────────────────────────────────
export function fmtMoney(n: number, frac = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: frac,
    minimumFractionDigits: frac,
  });
}
export function fmtPct(n: number, frac = 1) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(frac)}%`;
}

// ─── Mortgage math ─────────────────────────────────────────────────────
/** Canadian mortgages compound semi-annually; convert to a periodic rate. */
export function periodicRate(annualPct: number, periodsPerYear: number) {
  const i = annualPct / 100;
  const ear = Math.pow(1 + i / 2, 2) - 1;
  return Math.pow(1 + ear, 1 / periodsPerYear) - 1;
}
export function paymentsPerYear(freq: PaymentFreq) {
  switch (freq) {
    case "Monthly": return 12;
    case "Semi-monthly": return 24;
    case "Bi-weekly": return 26;
    case "Accelerated bi-weekly": return 26;
    case "Weekly": return 52;
    case "Accelerated weekly": return 52;
  }
}
export type PaymentFreq =
  | "Monthly"
  | "Semi-monthly"
  | "Bi-weekly"
  | "Accelerated bi-weekly"
  | "Weekly"
  | "Accelerated weekly";

export const PAYMENT_FREQS: PaymentFreq[] = [
  "Monthly", "Semi-monthly", "Bi-weekly", "Accelerated bi-weekly", "Weekly", "Accelerated weekly",
];

/** Standard payment for the chosen frequency. */
export function periodicPayment(
  principal: number,
  annualRatePct: number,
  amortYears: number,
  freq: PaymentFreq,
) {
  const ppy = paymentsPerYear(freq);
  const monthlyR = periodicRate(annualRatePct, 12);
  const monthlyN = amortYears * 12;
  const monthlyPmt =
    monthlyR === 0
      ? principal / monthlyN
      : (principal * monthlyR) / (1 - Math.pow(1 + monthlyR, -monthlyN));
  if (freq === "Accelerated bi-weekly") return monthlyPmt / 2;
  if (freq === "Accelerated weekly") return monthlyPmt / 4;
  // Standard frequencies: equivalent to monthly cost
  if (freq === "Monthly") return monthlyPmt;
  return (monthlyPmt * 12) / ppy;
}

export function monthlyEquivalent(amount: number, freq: PaymentFreq) {
  return (amount * paymentsPerYear(freq)) / 12;
}

/** Amortize: returns end balance and total interest over `years`. */
export function amortize(
  principal: number,
  annualRatePct: number,
  amortYears: number,
  freq: PaymentFreq,
  years: number,
) {
  const ppy = paymentsPerYear(freq);
  const r = periodicRate(annualRatePct, ppy);
  const pmt = periodicPayment(principal, annualRatePct, amortYears, freq);
  let bal = principal;
  let interest = 0;
  let principalPaid = 0;
  const periods = Math.round(ppy * years);
  for (let i = 0; i < periods && bal > 0; i++) {
    const ip = bal * r;
    const pp = Math.min(pmt - ip, bal);
    interest += ip;
    principalPaid += pp;
    bal -= pp;
  }
  return { endingBalance: Math.max(0, bal), totalInterest: interest, totalPrincipal: principalPaid, payment: pmt };
}

/** Periods to pay off, given periodic payment. */
export function periodsToPayoff(principal: number, annualRatePct: number, freq: PaymentFreq, pmt: number) {
  const ppy = paymentsPerYear(freq);
  const r = periodicRate(annualRatePct, ppy);
  if (pmt <= principal * r) return Infinity;
  if (r === 0) return principal / pmt;
  return -Math.log(1 - (principal * r) / pmt) / Math.log(1 + r);
}

// ─── Ontario LTT (simplified, no Toronto MLTT) ────────────────────────
export function ontarioLTT(price: number, firstTimeBuyer: boolean) {
  const brackets: [number, number][] = [
    [55000, 0.005],
    [250000, 0.01],
    [400000, 0.015],
    [2000000, 0.02],
    [Infinity, 0.025],
  ];
  let tax = 0;
  let prev = 0;
  for (const [cap, rate] of brackets) {
    if (price <= prev) break;
    const slab = Math.min(price, cap) - prev;
    tax += slab * rate;
    prev = cap;
  }
  if (firstTimeBuyer) tax = Math.max(0, tax - 4000);
  return Math.round(tax);
}

// ─── Scenario storage (localStorage) ──────────────────────────────────
export type SavedScenario = {
  id: string;
  tool: string;
  name: string;
  createdAt: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
};

const STORE_KEY = "approvu:tool-scenarios";

export function loadScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "[]") as SavedScenario[];
  } catch {
    return [];
  }
}

export function saveScenario(s: Omit<SavedScenario, "id" | "createdAt">): SavedScenario {
  const full: SavedScenario = {
    ...s,
    id: `sc-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  const all = loadScenarios();
  all.unshift(full);
  window.localStorage.setItem(STORE_KEY, JSON.stringify(all.slice(0, 50)));
  return full;
}

export function deleteScenario(id: string) {
  const all = loadScenarios().filter((s) => s.id !== id);
  window.localStorage.setItem(STORE_KEY, JSON.stringify(all));
}

export function useSavedScenarios() {
  const [list, setList] = useState<SavedScenario[]>([]);
  useEffect(() => {
    setList(loadScenarios());
  }, []);
  return {
    list,
    refresh: () => setList(loadScenarios()),
    remove: (id: string) => {
      deleteScenario(id);
      setList(loadScenarios());
    },
  };
}

// ─── Active app prefill ────────────────────────────────────────────────
export type ActiveAppContext = {
  id: string;
  address: string;
  txType: "Purchase" | "Pre-Purchase" | "Refinance" | "Renewal";
  propertyValue: number;
  mortgageAmount: number;
  rate: number;
  amortYears: number;
  monthlyPayment: number;
};

export const ACTIVE_APPS: ActiveAppContext[] = [
  {
    id: "APP-2041",
    address: "123 Maple Ave, Toronto, ON",
    txType: "Purchase",
    propertyValue: 832000,
    mortgageAmount: 748024,
    rate: 4.89,
    amortYears: 25,
    monthlyPayment: 2358,
  },
];

// ─── Shared UI primitives ──────────────────────────────────────────────
export const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

export function NumField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type="number"
          step={step}
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`${inputCls} ${prefix ? "pl-7" : ""} ${suffix ? "pr-10" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[] | { value: T; label: string }[];
}) {
  const opts = (options as readonly (T | { value: T; label: string })[]).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={inputCls}
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 py-2 text-sm">
      <span className="text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition ${
            value ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function ResultRow({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "primary" | "mint" | "coral" }) {
  const cls =
    tone === "primary" ? "text-primary"
    : tone === "mint" ? "text-mint-foreground"
    : tone === "coral" ? "text-coral"
    : "text-foreground";
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${cls}`}>{value}</span>
    </div>
  );
}

export function HeroResult({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/75">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-primary-foreground/80">{sub}</p>}
    </div>
  );
}

export function ToolPageShell({
  title,
  subtitle,
  bestFor,
  children,
  inputs,
  results,
  onReset,
  onSave,
  primaryCta,
  secondaryCta,
  explanation,
}: {
  title: string;
  subtitle: string;
  bestFor?: string;
  children?: ReactNode;
  inputs: ReactNode;
  results: ReactNode;
  onReset?: () => void;
  onSave?: () => void;
  primaryCta?: { label: string; to?: string; onClick?: () => void };
  secondaryCta?: { label: string; to?: string; onClick?: () => void };
  explanation?: ReactNode;
}) {
  return (
    <div className="space-y-5 pb-12">
      <div>
        <Link
          to="/portal/tools"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All tools
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-primary sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {bestFor && (
            <span className="rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-semibold text-secondary">
              Best for {bestFor}
            </span>
          )}
        </div>
      </div>

      {children}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Your details</h2>
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
          <div className="space-y-3">{inputs}</div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Your estimate</h2>
          <div className="space-y-3">{results}</div>

          <div className="mt-5 flex flex-wrap gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Save className="h-3.5 w-3.5" /> Save scenario
              </button>
            )}
            {primaryCta &&
              (primaryCta.to ? (
                <Link
                  to={primaryCta.to}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {primaryCta.label}
                </Link>
              ) : (
                <button
                  onClick={primaryCta.onClick}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {primaryCta.label}
                </button>
              ))}
            {secondaryCta &&
              (secondaryCta.to ? (
                <Link
                  to={secondaryCta.to}
                  className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {secondaryCta.label}
                </Link>
              ) : (
                <button
                  onClick={secondaryCta.onClick}
                  className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {secondaryCta.label}
                </button>
              ))}
          </div>
        </section>
      </div>

      {explanation && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-semibold text-foreground">How this is calculated</h2>
          </div>
          <div className="mt-3 text-xs leading-relaxed text-muted-foreground">{explanation}</div>
        </section>
      )}

      <p className="text-[11px] text-muted-foreground">
        Estimates only. Final figures depend on lender approval, product rules, verified income, and applicable taxes and fees.
      </p>
    </div>
  );
}

export function PrefillFromAppButton({ onPrefill, label = "Use details from my application" }: { onPrefill: (app: ActiveAppContext) => void; label?: string }) {
  if (ACTIVE_APPS.length === 0) return null;
  const app = ACTIVE_APPS[0];
  return (
    <button
      onClick={() => onPrefill(app)}
      className="inline-flex items-center gap-1.5 rounded-md border border-secondary/40 bg-secondary/5 px-3 py-1.5 text-[11px] font-semibold text-secondary hover:bg-secondary/10"
    >
      {label} · {app.id}
    </button>
  );
}