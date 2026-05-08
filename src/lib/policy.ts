// Centralized segmentation policy — shared across Purchase, Pre-Purchase,
// Refinance flows AND snapshot pages. Codex/PHP can port directly from here.

export type PropertyUsageCode = "OWNER_OCCUPIED" | "RENTAL" | "VACATION";
export type ProgramLane = "INSURED" | "INSURABLE" | "UNINSURABLE";
export type LendingLane = "PRIME_FIT" | "ALTERNATIVE_FIT" | "TAILORED_REVIEW";
export type PrimeSubtype = "PRIME_PLUS" | "STANDARD_PRIME" | null;
export type RefinanceStatus =
  | "WITHIN_REFINANCE_RANGE"
  | "ABOVE_REFINANCE_RANGE"
  | "BALANCE_ABOVE_RANGE";

export interface MinimumDownPaymentPolicy {
  minimum_down_payment_amount: number;
  minimum_down_payment_percent: number;
  purchase_price: number;
  rule_applied_label: string;
  rule_reference_title: string;
  rule_reference_text: string;
  reason: string;
  program_lane?: ProgramLane;
}

export function mapUsage(use?: string): PropertyUsageCode {
  if (use === "rental") return "RENTAL";
  if (use === "secondary") return "VACATION";
  return "OWNER_OCCUPIED";
}

export function getMinimumDownPaymentPolicy(input: {
  property_usage: PropertyUsageCode;
  property_value: number;
  unit_count: number;
  down_payment_amount?: number;
}): MinimumDownPaymentPolicy {
  const { property_usage, property_value, unit_count, down_payment_amount } = input;
  const dp = down_payment_amount ?? 0;

  // RENTAL
  if (property_usage === "RENTAL") {
    if (unit_count === 1) {
      const amt = property_value * 0.2;
      return {
        minimum_down_payment_amount: amt,
        minimum_down_payment_percent: 20,
        purchase_price: property_value,
        rule_applied_label: "Minimum 20% down payment required for rental properties",
        rule_reference_title: "Down Payment Rule Applied",
        rule_reference_text:
          "Single-unit rental properties typically require a higher down payment and fall outside insured programs.",
        reason: "RENTAL_1_UNIT",
        program_lane: "UNINSURABLE",
      };
    }
    if (property_value > 1_000_000) {
      const amt = property_value * 0.2;
      return {
        minimum_down_payment_amount: amt,
        minimum_down_payment_percent: 20,
        purchase_price: property_value,
        rule_applied_label: "Minimum 20% down payment required for rental properties",
        rule_reference_title: "Down Payment Rule Applied",
        rule_reference_text:
          "Rental properties priced above $1M typically fall outside insured/insurable programs.",
        reason: "RENTAL_PRICE_ABOVE_1_M",
        program_lane: "UNINSURABLE",
      };
    }
    const amt = property_value * 0.2;
    return {
      minimum_down_payment_amount: amt,
      minimum_down_payment_percent: 20,
      purchase_price: property_value,
      rule_applied_label: "Minimum 20% down payment required for rental properties",
      rule_reference_title: "Down Payment Rule Applied",
      rule_reference_text:
        "Multi-unit rental properties may qualify for insured/insurable rental programs with at least 20% down.",
      reason: "RENTAL_POLICY_INSURED_INSURABLE_FOR_PURCHASE",
      program_lane: "INSURABLE",
    };
  }

  // VACATION / SECONDARY
  if (property_usage === "VACATION") {
    if (property_value >= 1_500_000) {
      const amt = property_value * 0.2;
      return {
        minimum_down_payment_amount: amt,
        minimum_down_payment_percent: 20,
        purchase_price: property_value,
        rule_applied_label: "20% minimum down payment required for homes at or above $1.5M",
        rule_reference_title: "Down Payment Rule Applied",
        rule_reference_text:
          "Secondary/vacation homes priced at or above $1.5M fall outside insured programs.",
        reason: "VACATION_PRICE_AT_OR_ABOVE_1_5M",
        program_lane: "UNINSURABLE",
      };
    }
    if (dp >= property_value * 0.2) {
      const amt = property_value * 0.2;
      const lane: ProgramLane = property_value <= 1_000_000 ? "INSURABLE" : "UNINSURABLE";
      return {
        minimum_down_payment_amount: amt,
        minimum_down_payment_percent: 20,
        purchase_price: property_value,
        rule_applied_label: "20% down payment may place this secondary property in an insurable path",
        rule_reference_title: "Down Payment Rule Applied",
        rule_reference_text:
          "Secondary/vacation homes with at least 20% down may fit insurable programs (subject to property value).",
        reason:
          property_value <= 1_000_000
            ? "VACATION_DP_GE20_PRICE_LE1M_INSURABLE"
            : "VACATION_DP_GE20_PRICE_GT1M_UNINSURABLE",
        program_lane: lane,
      };
    }
    // Single-unit secondary, less than 20% down — insured path tiers apply.
    return tieredOwnerOccupied(property_value, "VACATION_1_UNIT_INSURED_PATH", "INSURED");
  }

  // OWNER_OCCUPIED
  if (unit_count >= 3 && unit_count <= 4) {
    const amt = property_value * 0.1;
    return {
      minimum_down_payment_amount: amt,
      minimum_down_payment_percent: 10,
      purchase_price: property_value,
      rule_applied_label:
        "10% minimum down payment required for 3–4 unit owner-occupied properties",
      rule_reference_title: "Down Payment Rule Applied",
      rule_reference_text:
        "Owner-occupied 3–4 unit properties have a 10% minimum down payment under standard insured programs.",
      reason: "OO_3_4_UNIT",
      program_lane: dp >= property_value * 0.2 ? "INSURABLE" : "INSURED",
    };
  }
  if (property_value >= 1_500_000) {
    const amt = property_value * 0.2;
    return {
      minimum_down_payment_amount: amt,
      minimum_down_payment_percent: 20,
      purchase_price: property_value,
      rule_applied_label: "20% minimum down payment required for homes at or above $1.5M",
      rule_reference_title: "Down Payment Rule Applied",
      rule_reference_text:
        "Homes priced at or above $1.5M fall outside insured programs and require a 20% minimum down payment.",
      reason: "OO_PRICE_AT_OR_ABOVE_1_5M",
      program_lane: "UNINSURABLE",
    };
  }
  // Owner-occupied 1–2 unit, under $1.5M.
  if (dp >= property_value * 0.2) {
    const amt = property_value * 0.2;
    const lane: ProgramLane = property_value <= 1_000_000 ? "INSURABLE" : "UNINSURABLE";
    return {
      minimum_down_payment_amount: amt,
      minimum_down_payment_percent: 20,
      purchase_price: property_value,
      rule_applied_label:
        property_value <= 1_000_000
          ? "20% down payment places this in an insurable owner-occupied path"
          : "20% down with price above $1M typically falls outside insured/insurable programs",
      rule_reference_title: "Down Payment Rule Applied",
      rule_reference_text:
        "Owner-occupied 1–2 unit homes with at least 20% down may fit insurable programs (subject to property value).",
      reason:
        property_value <= 1_000_000
          ? "OO_DP_GE20_PRICE_LE1M_INSURABLE"
          : "OO_DP_GE20_PRICE_GT1M_UNINSURABLE",
      program_lane: lane,
    };
  }
  return tieredOwnerOccupied(property_value, "OO_TIERED_INSURED", "INSURED");
}

function tieredOwnerOccupied(
  price: number,
  reason: string,
  lane: ProgramLane,
): MinimumDownPaymentPolicy {
  if (price <= 500_000) {
    const amt = price * 0.05;
    return {
      minimum_down_payment_amount: amt,
      minimum_down_payment_percent: 5,
      purchase_price: price,
      rule_applied_label: "5% minimum on homes up to $500,000",
      rule_reference_title: "Down Payment Rule Applied",
      rule_reference_text:
        "Standard insured minimum down payment of 5% applies to homes priced up to $500,000.",
      reason,
      program_lane: lane,
    };
  }
  const amt = 500_000 * 0.05 + (price - 500_000) * 0.1;
  const pct = +((amt / price) * 100).toFixed(2);
  return {
    minimum_down_payment_amount: amt,
    minimum_down_payment_percent: pct,
    purchase_price: price,
    rule_applied_label: "5% on the first $500K + 10% on the amount above $500K",
    rule_reference_title: "Down Payment Rule Applied",
    rule_reference_text:
      "Standard insured tiered minimum: 5% on the first $500,000 plus 10% on the portion between $500,000 and $1.5M.",
    reason,
    program_lane: lane,
  };
}

// ---------- Lane classification ----------

export interface LaneInput {
  credit_score: number;
  income_type?: string; // employed | self | other | combo
  income_verification?: string; // tax | bank | unsure
  meets_minimum_dp: boolean;
  program_lane?: ProgramLane;
}

export function classifyLane(input: LaneInput): LendingLane {
  const { credit_score, income_type, income_verification, meets_minimum_dp } = input;
  if (!meets_minimum_dp) return "TAILORED_REVIEW";
  if (credit_score && credit_score < 500) return "TAILORED_REVIEW";

  const standardIncome =
    income_type === "employed" ||
    (income_type === "self" && income_verification === "tax");
  const bankStmt = income_type === "self" && income_verification === "bank";

  if (credit_score >= 620 && standardIncome) return "PRIME_FIT";
  if (bankStmt && credit_score >= 550) return "ALTERNATIVE_FIT";
  if (credit_score >= 500 && credit_score <= 619) return "ALTERNATIVE_FIT";
  if (credit_score >= 620) return "PRIME_FIT";
  return "TAILORED_REVIEW";
}

export function laneLabel(l: LendingLane): string {
  return l === "PRIME_FIT"
    ? "Prime Fit"
    : l === "ALTERNATIVE_FIT"
      ? "Alternative Fit"
      : "Needs Tailored Review";
}

export function programLaneLabel(p: ProgramLane): string {
  return p === "INSURED" ? "Insured" : p === "INSURABLE" ? "Insurable" : "Uninsurable";
}

// ---------- Refinance equity policy ----------

export interface RefinanceEquityPolicy {
  property_value: number;
  total_existing_mortgage_balance: number;
  cash_out_requested: number;
  total_new_loan_requested: number;
  maximum_loan_allowed: number;
  estimated_ltv: number;
  available_equity: number;
  status: RefinanceStatus;
  snapshot_outcome: string;
  primary_cta: string;
  secondary_cta: string;
}

export function getRefinanceEquityPolicy(input: {
  property_value: number;
  existing_mortgage_balance: number;
  cash_out_requested: number;
}): RefinanceEquityPolicy {
  const { property_value, existing_mortgage_balance, cash_out_requested } = input;
  const max = property_value * 0.8;
  const total_new = existing_mortgage_balance + cash_out_requested;
  const ltv = property_value > 0 ? +((total_new / property_value) * 100).toFixed(1) : 0;
  const equity = Math.max(max - existing_mortgage_balance, 0);

  let status: RefinanceStatus;
  let outcome: string;
  let primary: string;
  let secondary: string;

  if (existing_mortgage_balance > max) {
    status = "BALANCE_ABOVE_RANGE";
    outcome = "Your current mortgage balance appears above the typical refinance range";
    primary = "Continue for Tailored Review";
    secondary = "Adjust My Numbers";
  } else if (total_new <= max) {
    status = "WITHIN_REFINANCE_RANGE";
    outcome = "You're within the estimated refinance range";
    primary = "See My Refinance Options";
    secondary = "Adjust My Numbers";
  } else {
    status = "ABOVE_REFINANCE_RANGE";
    outcome = "Your request may need adjustment";
    primary = "Adjust My Numbers";
    secondary = "Continue for Tailored Review";
  }

  return {
    property_value,
    total_existing_mortgage_balance: existing_mortgage_balance,
    cash_out_requested,
    total_new_loan_requested: total_new,
    maximum_loan_allowed: max,
    estimated_ltv: ltv,
    available_equity: equity,
    status,
    snapshot_outcome: outcome,
    primary_cta: primary,
    secondary_cta: secondary,
  };
}