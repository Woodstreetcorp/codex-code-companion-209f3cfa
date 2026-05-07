// Mortgage calculation utilities — ported from approvU reference build.
// Frontend-only. No external deps.

export type PropertyUsage = "primary" | "secondary" | "rental";

export interface DownPaymentRequirement {
  minimumAmount: number;
  minimumPercentage: number;
  explanation: string;
  breakdown: { range: string; percentage: number; amount: number }[];
}

export function formatCAD(n: number): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function parseCurrency(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return isFinite(n) ? n : 0;
}

// Canadian CMHC-style minimum down payment tiers.
export function calculateMinimumDownPayment(
  propertyValue: number,
  usage: PropertyUsage,
): DownPaymentRequirement {
  if (usage === "rental") {
    const amount = propertyValue * 0.2;
    return {
      minimumAmount: amount,
      minimumPercentage: 20,
      explanation: "20% minimum for investment / rental properties.",
      breakdown: [{ range: "Full property value", percentage: 20, amount }],
    };
  }
  if (propertyValue <= 500_000) {
    const amount = propertyValue * 0.05;
    return {
      minimumAmount: amount,
      minimumPercentage: 5,
      explanation: "5% minimum for homes under $500,000.",
      breakdown: [{ range: "Up to $500,000", percentage: 5, amount }],
    };
  }
  if (propertyValue <= 1_500_000) {
    const first = 500_000 * 0.05;
    const rest = (propertyValue - 500_000) * 0.1;
    const amount = first + rest;
    return {
      minimumAmount: amount,
      minimumPercentage: +((amount / propertyValue) * 100).toFixed(2),
      explanation: "5% on the first $500K, 10% on the portion above.",
      breakdown: [
        { range: "First $500,000", percentage: 5, amount: first },
        { range: "Above $500,000", percentage: 10, amount: rest },
      ],
    };
  }
  const amount = propertyValue * 0.2;
  return {
    minimumAmount: amount,
    minimumPercentage: 20,
    explanation: "20% minimum for homes over $1,500,000.",
    breakdown: [{ range: "Full property value", percentage: 20, amount }],
  };
}

export function monthlyPayment(
  principal: number,
  annualRatePct: number,
  years: number,
): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
}

export interface RefiSavings {
  newMonthlyPayment: number;
  monthlySavings: number;
  lifetimeSavings: number;
  breakEvenMonths: number;
  recommend: boolean;
}

export function refinanceSavings(opts: {
  currentBalance: number;
  currentPayment: number;
  currentRatePct: number;
  yearsRemaining: number;
  newRatePct: number;
  newTermYears: number;
  closingCosts?: number;
  prepaymentPenalty?: number;
}): RefiSavings {
  const { currentBalance, currentPayment, yearsRemaining, newRatePct, newTermYears } = opts;
  const newPayment = monthlyPayment(currentBalance, newRatePct, newTermYears);
  const monthlySavings = currentPayment - newPayment;
  const totalCosts = (opts.closingCosts ?? 0) + (opts.prepaymentPenalty ?? 0);
  const currentTotal = currentPayment * yearsRemaining * 12;
  const newTotal = newPayment * newTermYears * 12 + totalCosts;
  const lifetimeSavings = currentTotal - newTotal;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(totalCosts / monthlySavings) : Infinity;
  return {
    newMonthlyPayment: newPayment,
    monthlySavings,
    lifetimeSavings,
    breakEvenMonths,
    recommend: monthlySavings > 0 && lifetimeSavings > 0,
  };
}

export function ltv(balance: number, value: number): number {
  if (value <= 0) return 0;
  return +((balance / value) * 100).toFixed(1);
}
