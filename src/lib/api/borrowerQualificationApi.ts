import type { FlowKey, MortgageEntry } from "@/lib/flows";
import { parseCurrency } from "@/lib/calculations";
import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

export type AnswerValue = string | string[] | MortgageEntry[];
export type QualificationAnswers = Record<string, AnswerValue>;

export type QualificationContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  consentAccepted: boolean;
};

export type BorrowerQualificationResponse = {
  ok: true;
  qualification_session_token: string;
  public_reference: string;
  next_step: "snapshot_pending";
  message: string;
};

type BorrowerQualificationPayload = {
  transaction_type: "purchase" | "refinance" | "pre_purchase";
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  province?: string;
  city?: string;
  property_value?: number;
  target_property_value?: number;
  mortgage_amount?: number;
  down_payment?: number;
  income?: number;
  credit_score_range?: string;
  property_usage?: string;
  consent_accepted: boolean;
  consent_version: string;
  source: string;
  answers: QualificationAnswers;
};

const CONSENT_VERSION = "borrower-qualification-v1";
const HANDOFF_STORAGE_KEY = "approvu:qualification-session";

function flowTransactionType(flowKey: FlowKey): BorrowerQualificationPayload["transaction_type"] {
  return flowKey === "pre" ? "pre_purchase" : flowKey;
}

function firstString(value: AnswerValue | undefined): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string" && entry.trim());
    return typeof first === "string" ? first.trim() : undefined;
  }
  return undefined;
}

function sumMortgageBalances(value: AnswerValue | undefined): number | undefined {
  if (!Array.isArray(value)) return undefined;
  const total = value.reduce((sum, entry) => {
    if (typeof entry !== "object" || entry === null || !("balance" in entry)) return sum;
    return sum + parseCurrency(String(entry.balance ?? ""));
  }, 0);
  return total > 0 ? total : undefined;
}

function optionalNumber(value: number): number | undefined {
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function buildPayload(
  flowKey: FlowKey,
  answers: QualificationAnswers,
  contact: QualificationContact,
): BorrowerQualificationPayload {
  const purchasePrice = parseCurrency(answers.price as string);
  const refinanceValue = parseCurrency(answers.value as string);
  const prePurchaseSpecificPrice = parseCurrency(answers.specificPrice as string);
  const downPayment = parseCurrency((answers.down as string) || (answers.savedDown as string));
  const mortgageBalances = sumMortgageBalances(answers.mortgages);
  const propertyValue =
    flowKey === "purchase" ? purchasePrice : flowKey === "refinance" ? refinanceValue : undefined;
  const targetPropertyValue = flowKey === "pre" ? prePurchaseSpecificPrice || undefined : undefined;
  const mortgageAmount =
    flowKey === "refinance"
      ? mortgageBalances
      : purchasePrice > 0
        ? Math.max(purchasePrice - downPayment, 0)
        : undefined;

  return {
    transaction_type: flowTransactionType(flowKey),
    first_name: contact.firstName.trim(),
    last_name: contact.lastName.trim(),
    email: contact.email.trim(),
    phone: contact.phone?.trim() || undefined,
    province: "ON",
    city:
      firstString(answers.locations) ??
      firstString(answers.location) ??
      firstString(answers.address),
    property_value: optionalNumber(propertyValue ?? 0),
    target_property_value: optionalNumber(targetPropertyValue ?? 0),
    mortgage_amount: optionalNumber(mortgageAmount ?? 0),
    down_payment: optionalNumber(downPayment),
    credit_score_range: firstString(answers.credit),
    property_usage: firstString(answers.use),
    consent_accepted: contact.consentAccepted,
    consent_version: CONSENT_VERSION,
    source: "borrower_frontend",
    answers,
  };
}

async function postQualification(
  path: string,
  payload: BorrowerQualificationPayload,
): Promise<BorrowerQualificationResponse> {
  const response = await fetchWithLaravelSession(buildApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "We could not save your qualification right now. Please try again.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Keep the friendly default.
    }
    throw new Error(message);
  }

  return (await response.json()) as BorrowerQualificationResponse;
}

export function submitPurchaseQualification(
  answers: QualificationAnswers,
  contact: QualificationContact,
): Promise<BorrowerQualificationResponse> {
  return postQualification(
    "/v2/borrower/qualification/purchase",
    buildPayload("purchase", answers, contact),
  );
}

export function submitRefinanceQualification(
  answers: QualificationAnswers,
  contact: QualificationContact,
): Promise<BorrowerQualificationResponse> {
  return postQualification(
    "/v2/borrower/qualification/refinance",
    buildPayload("refinance", answers, contact),
  );
}

export function submitPrePurchaseQualification(
  answers: QualificationAnswers,
  contact: QualificationContact,
): Promise<BorrowerQualificationResponse> {
  return postQualification(
    "/v2/borrower/qualification/pre-purchase",
    buildPayload("pre", answers, contact),
  );
}

export function submitQualification(
  flowKey: FlowKey,
  answers: QualificationAnswers,
  contact: QualificationContact,
): Promise<BorrowerQualificationResponse> {
  if (flowKey === "purchase") return submitPurchaseQualification(answers, contact);
  if (flowKey === "refinance") return submitRefinanceQualification(answers, contact);
  return submitPrePurchaseQualification(answers, contact);
}

export function storeQualificationHandoff(result: BorrowerQualificationResponse): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    HANDOFF_STORAGE_KEY,
    JSON.stringify({
      qualification_session_token: result.qualification_session_token,
      public_reference: result.public_reference,
      next_step: result.next_step,
      saved_at: new Date().toISOString(),
    }),
  );
}
