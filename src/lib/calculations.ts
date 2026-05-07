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

// ---------- Down payment validation & guidance ----------

export interface DownPaymentValidation {
  isValid: boolean;
  message: string;
  minimumRequired: number;
  shortfall: number;
}

export function validateDownPayment(
  downPaymentAmount: number,
  propertyValue: number,
  usage: PropertyUsage,
): DownPaymentValidation {
  const req = calculateMinimumDownPayment(propertyValue, usage);
  if (downPaymentAmount < req.minimumAmount) {
    return {
      isValid: false,
      message: `Minimum down payment is ${formatCAD(req.minimumAmount)} (${req.minimumPercentage}%). ${req.explanation}`,
      minimumRequired: req.minimumAmount,
      shortfall: req.minimumAmount - downPaymentAmount,
    };
  }
  return {
    isValid: true,
    message: "Down payment meets the minimum requirement.",
    minimumRequired: req.minimumAmount,
    shortfall: 0,
  };
}

export function downPaymentPercentage(down: number, value: number): number {
  if (value <= 0) return 0;
  return +((down / value) * 100).toFixed(2);
}

export function getDownPaymentGuidance(
  propertyValue: number,
  usage: PropertyUsage,
): string[] {
  const req = calculateMinimumDownPayment(propertyValue, usage);
  const tips: string[] = [
    `Minimum: ${formatCAD(req.minimumAmount)} (${req.minimumPercentage}%)`,
    req.explanation,
  ];
  if (usage === "rental") tips.push("Investment properties require higher down payments to qualify.");
  else if (propertyValue > 1_500_000) tips.push("Homes over $1.5M are not insurable — 20% minimum applies.");
  else if (propertyValue > 500_000) tips.push("A tiered down payment structure applies above $500K.");
  else tips.push("First-time buyer programs may also be available.");
  return tips;
}

// ---------- Refinance recommendation analysis ----------

export interface RefinanceRecommendation extends RefiSavings {
  rateReduction: number;
  analysis: string;
}

export function analyzeRefinance(opts: {
  currentBalance: number;
  currentPayment: number;
  currentRatePct: number;
  yearsRemaining: number;
  newRatePct: number;
  newTermYears: number;
  closingCosts?: number;
  prepaymentPenalty?: number;
}): RefinanceRecommendation {
  const base = refinanceSavings(opts);
  const rateReduction = +(opts.currentRatePct - opts.newRatePct).toFixed(2);
  const minRateReduction = 0.5;
  const maxBreakEvenYears = 5;
  let analysis = "";
  let recommend = base.recommend;

  if (rateReduction < minRateReduction) {
    recommend = false;
    analysis = `Rate reduction of ${rateReduction}% is below the recommended minimum of ${minRateReduction}%. Possible option: wait for better rates.`;
  } else if (base.monthlySavings <= 0) {
    recommend = false;
    analysis = "This option would increase your monthly payment. May not be ideal unless you need to access equity.";
  } else if (base.breakEvenMonths / 12 > maxBreakEvenYears) {
    recommend = false;
    analysis = `Break-even of ${(base.breakEvenMonths / 12).toFixed(1)} years exceeds the ${maxBreakEvenYears}-year guideline. Consider only if you plan to stay long-term.`;
  } else if (base.lifetimeSavings > 0) {
    recommend = true;
    analysis = `Possible savings of ${formatCAD(base.monthlySavings)}/month, breaking even in ~${Math.ceil(base.breakEvenMonths)} months. Estimated lifetime savings: ${formatCAD(base.lifetimeSavings)}.`;
  } else {
    analysis = "Marginal savings. Review your long-term plans before proceeding.";
  }
  return { ...base, recommend, rateReduction, analysis };
}

// ---------- Renewal vs refinance routing ----------

export type RenewalIntent =
  | "renew" | "switch" | "lower-payment" | "better-rate"
  | "cash-out" | "consolidate" | "heloc" | "unsure";

export interface RenewalAnalysis {
  recommendedFlow: "renewal" | "refinance" | "hybrid" | "guided";
  isRefinance: boolean;
  documentationLevel: "minimal" | "standard" | "full";
  estimatedTimeline: string;
  estimatedCosts: string;
  warnings: string[];
  nextSteps: string[];
  availableEquity?: number;
  needsFollowUp?: boolean;
}

export function analyzeRenewalIntent(
  intents: string[],
  opts: { homeValue?: number; currentBalance?: number } = {},
): RenewalAnalysis {
  const set = new Set(intents);
  // Hard refinance triggers — equity access or borrowing additional funds.
  // HELOC is ALWAYS treated as equity-access, even alongside renewal goals.
  const hardRefinanceTriggers = ["heloc", "cash-out", "equity", "consolidate", "additional-funds"];
  const isRefinance = hardRefinanceTriggers.some((t) => set.has(t));

  // "Lower monthly payment" alone is ambiguous — ask a follow-up unless a
  // hard refinance trigger is also present.
  const onlyLowerPayment =
    !isRefinance && set.has("lower-payment") &&
    !["renew", "switch", "better-rate"].some((t) => set.has(t));

  // "I'm not sure" alone routes to a guided review.
  if (!isRefinance && set.size === 1 && set.has("unsure")) {
    return {
      recommendedFlow: "guided",
      isRefinance: false,
      documentationLevel: "minimal",
      estimatedTimeline: "Flexible",
      estimatedCosts: "Reviewed during your guided session",
      warnings: [
        "We'll walk through your situation together to identify the best path forward.",
      ],
      nextSteps: [
        "A licensed broker will help you clarify your goals.",
        "We'll review renewal, switch, and refinance options based on your needs.",
      ],
    };
  }

  if (onlyLowerPayment) {
    return {
      recommendedFlow: "guided",
      isRefinance: false,
      documentationLevel: "standard",
      estimatedTimeline: "30–90 days",
      estimatedCosts: "Depends on the path you choose",
      warnings: [
        "There are a few ways to lower your payment — a quick follow-up will help us match the right path.",
      ],
      nextSteps: [
        "We'll ask whether you want to extend your amortization, change rate type, or restructure your mortgage.",
        "Some options can be handled at renewal; others require a refinance.",
      ],
      needsFollowUp: true,
    };
  }

  const equity =
    opts.homeValue && opts.currentBalance
      ? Math.max(opts.homeValue * 0.8 - opts.currentBalance, 0)
      : undefined;

  if (isRefinance) {
    const reasons: string[] = [];
    if (set.has("heloc")) reasons.push("adding a HELOC");
    if (set.has("cash-out") || set.has("equity")) reasons.push("accessing home equity");
    if (set.has("consolidate")) reasons.push("consolidating debt");
    if (set.has("additional-funds")) reasons.push("borrowing additional funds");
    if (set.has("lower-payment")) reasons.push("lowering monthly payment");
    return {
      // Refinance trigger always wins — even if the user also selected renew.
      recommendedFlow: "refinance",
      isRefinance: true,
      documentationLevel: "full",
      estimatedTimeline: "60–90 days",
      estimatedCosts: "$2,000 – $4,000 (more if breaking early)",
      warnings: [
        `${reasons.join(", ")} typically requires a full refinance, not a simple renewal.`,
        "At renewal you can only change the interest rate and rate type.",
        "An appraisal and full income/credit verification are usually required.",
      ],
      nextSteps: [
        "We'll estimate your available equity (typically up to 80% of home value).",
        "We'll estimate any prepayment penalties from your current lender.",
        "We'll guide you through the required documents.",
        "We'll coordinate the home appraisal.",
      ],
      availableEquity: equity,
    };
  }

  return {
    recommendedFlow: "renewal",
    isRefinance: false,
    documentationLevel: "minimal",
    estimatedTimeline: "30–60 days",
    estimatedCosts: "$0 – $500",
    warnings: [
      "Good news — these changes can typically be made at renewal with no penalties.",
      set.has("switch")
        ? "Switching lenders at renewal is usually free; the new lender often covers costs."
        : "We'll help you negotiate the best possible renewal terms.",
    ],
    nextSteps: [
      "Compare offers from top lenders.",
      "Verify credit qualifies for best-tier rates.",
      "Choose between fixed and variable for your situation.",
      "Select an optimal term length.",
    ],
    availableEquity: equity,
  };
}
