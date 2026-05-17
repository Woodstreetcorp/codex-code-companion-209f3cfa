export type ReviewRequestStatus = "open" | "pending" | "resolved" | "closed" | "cancelled" | string;

export type BorrowerApplicationReviewRequest = {
  id?: number | string | null;
  public_reference?: string | null;
  title?: string | null;
  body?: string | null;
  message?: string | null;
  response?: string | null;
  borrower_response?: string | null;
  related_section_key?: string | null;
  status?: ReviewRequestStatus | null;
  created_at?: string | null;
  resolved_at?: string | null;
};

export type ReviewRequestResponsePayload = {
  response?: string;
  mark_addressed: true;
};

export type ReviewRequestResponseResult = {
  ok?: boolean;
  request?: BorrowerApplicationReviewRequest | null;
  application_status?: string | null;
  next_step?: string | null;
  message?: string | null;
};

export type ReviewRequestsResponse = {
  ok?: boolean;
  application_public_reference?: string | null;
  requests?: BorrowerApplicationReviewRequest[] | null;
  open_count?: number | null;
  resolved_count?: number | null;
  next_step?: string | null;
  message?: string | null;
  unavailable?: boolean;
};

const REVIEW_REQUESTS_STORAGE_KEY = "approvu:borrower-application-review-requests";

export function storeBorrowerApplicationReviewRequests(result: ReviewRequestsResponse): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    REVIEW_REQUESTS_STORAGE_KEY,
    JSON.stringify({
      application_public_reference: result.application_public_reference,
      open_count: result.open_count,
      resolved_count: result.resolved_count,
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

export async function listBorrowerApplicationReviewRequests(): Promise<ReviewRequestsResponse> {
  const response = await fetchWithLaravelSession(
    buildApiUrl("/v2/borrower/application/review-requests"),
  );

  if (response.status === 404) {
    return {
      ok: false,
      requests: [],
      open_count: 0,
      resolved_count: 0,
      unavailable: true,
      message: "Application review requests are not available yet.",
    };
  }

  return parseJson<ReviewRequestsResponse>(
    response,
    "Application review requests could not be loaded.",
  );
}

export async function respondToBorrowerApplicationReviewRequest(
  publicReference: string,
  payload: ReviewRequestResponsePayload,
): Promise<ReviewRequestResponseResult> {
  const response = await fetchWithLaravelSession(
    buildApiUrl(
      `/v2/borrower/application/review-requests/${encodeURIComponent(publicReference)}/respond`,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return parseJson<ReviewRequestResponseResult>(
    response,
    "We could not mark this request as addressed right now. Please try again.",
  );
}
