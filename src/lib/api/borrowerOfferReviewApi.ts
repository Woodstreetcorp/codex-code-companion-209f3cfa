export type OfferReviewStatus =
  | "pending_review"
  | "needs_more_information"
  | "documents_required"
  | "advisor_review_in_progress"
  | "options_pending"
  | "ready_for_advisor_review"
  | string;

export type PreliminaryPathValue =
  | "prime"
  | "alternative"
  | "manual_review"
  | "unknown"
  | string;

export type OfferSectionStatus =
  | "pending"
  | "ready"
  | "needs_attention"
  | "complete"
  | "not_started"
  | string;

export type ReviewStatusPayload = {
  status?: OfferReviewStatus | null;
  label?: string | null;
  message?: string | null;
  next_step?: string | null;
};

export type PreliminaryPath = {
  value?: PreliminaryPathValue | null;
  label?: string | null;
  source?: string | null;
};

export type Readiness = {
  application_ready?: boolean | null;
  snapshot_ready?: boolean | null;
  documents_ready?: boolean | null;
  missing_items?: string[] | null;
};

export type OfferSection = {
  key?: string | null;
  label?: string | null;
  status?: OfferSectionStatus | null;
  message?: string | null;
  action_label?: string | null;
  route_hint?: string | null;
};

export type PrimaryAction = {
  label?: string | null;
  action?: string | null;
  route_hint?: string | null;
};

export type BorrowerOfferReviewSummary = {
  ok?: boolean;
  authenticated?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  review_status?: ReviewStatusPayload | null;
  preliminary_path?: PreliminaryPath | null;
  readiness?: Readiness | null;
  offer_sections?: OfferSection[] | null;
  primary_action?: PrimaryAction | null;
  disclaimers?: string[] | null;
};

const BORROWER_OFFER_REVIEW_STORAGE_KEY = "approvu:borrower-offer-review-status";

function apiBaseUrl(): string {
  return (import.meta.env.VITE_APPROVU_API_BASE_URL ?? "").replace(/\/+$/, "");
}

function endpoint(path: string): string {
  return `${apiBaseUrl()}${path}`;
}

async function parseResponse(
  response: Response,
): Promise<BorrowerOfferReviewSummary> {
  const body = (await response.json().catch(() => ({}))) as BorrowerOfferReviewSummary & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors
      ? Object.values(body.errors)[0]?.[0]
      : undefined;
    throw new Error(
      firstError ??
        (body as { message?: string }).message ??
        "Your offer review status could not be loaded.",
    );
  }

  return body;
}

export async function getBorrowerOfferReviewStatus(): Promise<BorrowerOfferReviewSummary> {
  const response = await fetch(endpoint("/v2/borrower/offer-review-status"), {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  return parseResponse(response);
}

export function storeBorrowerOfferReviewStatus(
  result: BorrowerOfferReviewSummary,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    BORROWER_OFFER_REVIEW_STORAGE_KEY,
    JSON.stringify({
      review_status: result.review_status,
      preliminary_path: result.preliminary_path,
      primary_action: result.primary_action,
      stored_at: new Date().toISOString(),
    }),
  );
}
