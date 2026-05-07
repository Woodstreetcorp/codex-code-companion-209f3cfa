// Mortgage calculation utilities — ported from approvU reference build.
// Frontend-only. No external deps.

export type PropertyUsage = "primary" | "secondary" | "rental";

// ---------- Mortgage path classification (purchase segmentation) ----------

export type ClassificationPropertyUsage =
  | "PRIMARY_RESIDENCE"
  | "SECONDARY_VACATION"
  | "RENTAL_INVESTMENT";

export type IncomeVerificationMethod =
  | "standard"
  | "bank_statements"
  | "stated"
  | "other";

export type MortgageCategory = "INSURED" | "INSURABLE" | "UNINSURABLE";

export type BorrowerClassification =
  | "PRIME_PLUS"
  | "STANDARD_PRIME"
  | "ALTERNATIVE_PLUS"
  | "STANDARD_ALTERNATIVE"
  | "TAILORED_REVIEW";

export type LendingPath =
  | "PRIME"
  | "ALTERNATIVE"
  | "TAILORED_REVIEW"
  | "DOWN_PAYMENT_GAP"
  | "COMMERCIAL_OR_TAILORED_REVIEW";

export interface ClassificationInput {
  purchase_price: number;
  down_payment_amount: number;
  down_payment_percent?: number; // optional; derived if missing
  credit_score: number;
  property_usage: ClassificationPropertyUsage;
  number_of_units: number;
  income_source?: string;
  income_verification_method: IncomeVerificationMethod;
}

export interface ClassificationResult {
  required_minimum_down_payment: number;
  required_minimum_down_payment_percent: number;
  down_payment_gap_amount: number;
  down_payment_status: "MEETS_MINIMUM" | "BELOW_MINIMUM";
  mortgage_category: MortgageCategory | null;
  borrower_classification: BorrowerClassification;
  lending_path: LendingPath;
  snapshot_message: string;
  next_step: string;
}

function requiredMinimumDownPayment(
  price: number,
  usage: ClassificationPropertyUsage,
  units: number,
): { amount: number; percent: number } {
  if (units >= 5) {
    return { amount: price * 0.25, percent: 25 };
  }
  if (usage === "RENTAL_INVESTMENT") {
    return { amount: price * 0.2, percent: 20 };
  }
  if (usage === "SECONDARY_VACATION") {
    return { amount: price * 0.2, percent: 20 };
  }
  // PRIMARY_RESIDENCE
  if (units >= 3) {
    return { amount: price * 0.1, percent: 10 };
  }
  // 1–2 unit primary: standard CMHC tiers
  if (price < 500_000) {
    return { amount: price * 0.05, percent: 5 };
  }
  if (price < 1_500_000) {
    const amount = 500_000 * 0.05 + (price - 500_000) * 0.1;
    return { amount, percent: +((amount / price) * 100).toFixed(2) };
  }
  return { amount: price * 0.2, percent: 20 };
}

export function classifyMortgagePath(input: ClassificationInput): ClassificationResult {
  const {
    purchase_price,
    down_payment_amount,
    credit_score,
    property_usage,
    number_of_units,
    income_verification_method,
  } = input;

  const dpPercent =
    input.down_payment_percent ??
    (purchase_price > 0 ? +((down_payment_amount / purchase_price) * 100).toFixed(2) : 0);

  const req = requiredMinimumDownPayment(purchase_price, property_usage, number_of_units);
  const gap = Math.max(req.amount - down_payment_amount, 0);
  const meets = down_payment_amount + 0.01 >= req.amount;

  // Step 1.5 — commercial routing for 5+ units (overrides everything else).
  if (number_of_units >= 5) {
    return {
      required_minimum_down_payment: req.amount,
      required_minimum_down_payment_percent: req.percent,
      down_payment_gap_amount: gap,
      down_payment_status: meets ? "MEETS_MINIMUM" : "BELOW_MINIMUM",
      mortgage_category: null,
      borrower_classification: "TAILORED_REVIEW",
      lending_path: "COMMERCIAL_OR_TAILORED_REVIEW",
      snapshot_message:
        "Properties with 5 or more units fall outside standard residential lending and need a commercial or tailored review.",
      next_step: "We'll connect you with a broker who specializes in commercial multi-unit financing.",
    };
  }

  // Step 2 — down payment gap.
  if (!meets) {
    return {
      required_minimum_down_payment: req.amount,
      required_minimum_down_payment_percent: req.percent,
      down_payment_gap_amount: gap,
      down_payment_status: "BELOW_MINIMUM",
      mortgage_category: null,
      borrower_classification: "TAILORED_REVIEW",
      lending_path: "DOWN_PAYMENT_GAP",
      snapshot_message: `Your down payment is ${formatCAD(gap)} short of the ${formatCAD(req.amount)} minimum (${req.percent}%) required for this property.`,
      next_step:
        "We'll review options to bridge the down payment gap or explore a different price range.",
    };
  }

  // Step 3 — mortgage category.
  let mortgage_category: MortgageCategory;
  if (
    dpPercent < 20 &&
    purchase_price < 1_500_000 &&
    property_usage === "PRIMARY_RESIDENCE" &&
    number_of_units <= 2
  ) {
    mortgage_category = "INSURED";
  } else if (
    dpPercent >= 20 &&
    property_usage === "PRIMARY_RESIDENCE" &&
    number_of_units <= 4
  ) {
    mortgage_category = "INSURABLE";
  } else {
    mortgage_category = "UNINSURABLE";
  }

  // Step 4 — borrower classification.
  let borrower_classification: BorrowerClassification;
  if (credit_score >= 680 && income_verification_method === "standard") {
    borrower_classification = "PRIME_PLUS";
  } else if (credit_score >= 620) {
    borrower_classification = "STANDARD_PRIME";
  } else if (credit_score >= 550) {
    borrower_classification = "ALTERNATIVE_PLUS";
  } else if (credit_score >= 500) {
    borrower_classification = "STANDARD_ALTERNATIVE";
  } else {
    borrower_classification = "TAILORED_REVIEW";
  }

  // Step 5 — downgrade rules.
  let lending_path: LendingPath;
  const downgradeNotes: string[] = [];

  if (property_usage === "RENTAL_INVESTMENT" && dpPercent < 20) {
    borrower_classification = "TAILORED_REVIEW";
    downgradeNotes.push("Rental property with less than 20% down requires a tailored review.");
  }
  if (property_usage === "SECONDARY_VACATION" && dpPercent < 20) {
    borrower_classification = "TAILORED_REVIEW";
    downgradeNotes.push("Secondary/vacation property with less than 20% down requires a tailored review.");
  }
  if (property_usage === "PRIMARY_RESIDENCE" && number_of_units >= 3 && dpPercent < 10) {
    borrower_classification = "TAILORED_REVIEW";
    downgradeNotes.push("3–4 unit owner-occupied with less than 10% down requires a tailored review.");
  }

  // Self-employed with bank statements: route toward Alternative tiers.
  if (income_verification_method === "bank_statements") {
    if (borrower_classification === "PRIME_PLUS" || borrower_classification === "STANDARD_PRIME") {
      borrower_classification = credit_score >= 650 ? "ALTERNATIVE_PLUS" : "STANDARD_ALTERNATIVE";
      downgradeNotes.push("Self-employed with bank statements typically routes to Alternative lending.");
    }
  }

  if (borrower_classification === "TAILORED_REVIEW") {
    lending_path = "TAILORED_REVIEW";
  } else if (
    borrower_classification === "ALTERNATIVE_PLUS" ||
    borrower_classification === "STANDARD_ALTERNATIVE"
  ) {
    lending_path = "ALTERNATIVE";
  } else {
    lending_path = "PRIME";
  }

  const pathLabel =
    lending_path === "PRIME"
      ? "prime lenders"
      : lending_path === "ALTERNATIVE"
        ? "alternative lenders"
        : "a tailored review";

  const snapshot_message =
    `Based on a ${formatCAD(purchase_price)} ${property_usage.toLowerCase().replace("_", " ")} ` +
    `with ${formatCAD(down_payment_amount)} (${dpPercent}%) down, your file looks ${mortgage_category.toLowerCase()} ` +
    `and may qualify with ${pathLabel}.` +
    (downgradeNotes.length ? ` Note: ${downgradeNotes.join(" ")}` : "");

  const next_step =
    lending_path === "PRIME"
      ? "We'll compare offers from top prime lenders and confirm your best rate."
      : lending_path === "ALTERNATIVE"
        ? "We'll match you with alternative lenders that fit your income and credit profile."
        : "A licensed broker will review your file and outline a tailored path forward.";

  return {
    required_minimum_down_payment: req.amount,
    required_minimum_down_payment_percent: req.percent,
    down_payment_gap_amount: 0,
    down_payment_status: "MEETS_MINIMUM",
    mortgage_category,
    borrower_classification,
    lending_path,
    snapshot_message,
    next_step,
  };
}


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
