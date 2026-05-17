export type ConsentType =
  | "privacy"
  | "electronic_communication"
  | "document_collection"
  | "credit_bureau"
  | "lender_sharing"
  | "application_submission";

export type ConsentStatus = "pending" | "accepted" | "declined" | "revoked";

export type BorrowerApplicationConsent = {
  id?: number | string | null;
  public_reference?: string | null;
  consent_type?: ConsentType | string | null;
  status?: ConsentStatus | string | null;
  accepted?: boolean | null;
  consent_version?: string | null;
  consent_text?: string | null;
  accepted_at?: string | null;
  declined_at?: string | null;
  revoked_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ConsentSummary = {
  total?: number | null;
  accepted?: number | null;
  pending?: number | null;
  declined?: number | null;
  revoked?: number | null;
  required_total?: number | null;
  required_accepted?: number | null;
};

export type ConsentPayload = {
  consent_type: ConsentType;
  accepted: boolean;
  consent_version: string;
  consent_text: string;
};

export type ConsentListResponse = {
  ok?: boolean;
  consents?: BorrowerApplicationConsent[] | null;
  consent_summary?: ConsentSummary | null;
  consent_ready?: boolean | null;
  next_step?: string | null;
  message?: string | null;
};

const CONSENTS_STORAGE_KEY = "approvu:borrower-application-consents";

export function storeBorrowerApplicationConsents(result: ConsentListResponse): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    CONSENTS_STORAGE_KEY,
    JSON.stringify({
      consent_summary: result.consent_summary,
      consent_ready: result.consent_ready,
      next_step: result.next_step,
      stored_at: new Date().toISOString(),
    }),
  );
}

import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

async function parseJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    throw new Error(firstError ?? body.message ?? fallbackMessage);
  }

  return body;
}

export async function listBorrowerApplicationConsents(): Promise<ConsentListResponse> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/application/consents"));
  return parseJson<ConsentListResponse>(response, "Application consents could not be loaded.");
}

export async function submitBorrowerApplicationConsent(
  payload: ConsentPayload,
): Promise<ConsentListResponse> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/application/consents"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson<ConsentListResponse>(response, "Application consent could not be saved.");
}
