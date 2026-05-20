import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";
import type { ProductMatchStatus } from "@/lib/productMatching/productMatchCopy";

export type { ProductMatchStatus };

export type ProductMatchReadiness = {
  application_ready?: boolean | null;
  sections_ready?: boolean | null;
  consents_ready?: boolean | null;
  documents_ready?: boolean | null;
  advisor_review_ready?: boolean | null;
  open_request_count?: number | null;
  missing_items?: string[] | null;
  blockers?: string[] | null;
  [key: string]: unknown;
};

export type ProductMatchNextStep = {
  label?: string | null;
  action?: string | null;
  route_hint?: string | null;
  message?: string | null;
  [key: string]: unknown;
};

export type ProductMatchStatusResponse = {
  ok?: boolean;
  endpoint_available?: boolean;
  application_public_reference?: string | null;
  status?: ProductMatchStatus | null;
  readiness?: ProductMatchReadiness | null;
  next_step?: ProductMatchNextStep | string | null;
  message?: string | null;
  generated_at?: string | null;
  [key: string]: unknown;
};

const PRODUCT_MATCH_STATUS_STORAGE_KEY = "approvu:borrower-product-match-status";

const SAFE_PRODUCT_MATCH_STATUSES: ProductMatchStatus[] = [
  "not_ready",
  "missing_information",
  "advisor_review",
  "options_being_prepared",
  "options_ready_placeholder",
  "lender_review_placeholder",
];

function isProductMatchStatus(value: unknown): value is ProductMatchStatus {
  return (
    typeof value === "string" && SAFE_PRODUCT_MATCH_STATUSES.includes(value as ProductMatchStatus)
  );
}

function sanitizeProductMatchStatusResponse(
  body: ProductMatchStatusResponse,
): ProductMatchStatusResponse {
  return {
    ...body,
    status: isProductMatchStatus(body.status) ? body.status : null,
  };
}

function endpointUnavailableResponse(message?: string | null): ProductMatchStatusResponse {
  return {
    ok: false,
    endpoint_available: false,
    status: null,
    message: message ?? "Product match status is not available yet.",
  };
}

async function parseResponse(response: Response): Promise<ProductMatchStatusResponse> {
  const body = (await response.json().catch(() => ({}))) as ProductMatchStatusResponse & {
    message?: string;
  };

  if (response.status === 404) {
    return endpointUnavailableResponse(body.message);
  }

  if (!response.ok) {
    return {
      ...sanitizeProductMatchStatusResponse(body),
      ok: false,
      endpoint_available: true,
      message: body.message ?? "Product match status could not be loaded.",
    };
  }

  return {
    ...sanitizeProductMatchStatusResponse(body),
    ok: body.ok ?? true,
    endpoint_available: true,
  };
}

export async function getBorrowerProductMatchStatus(): Promise<ProductMatchStatusResponse> {
  try {
    const response = await fetchWithLaravelSession(
      buildApiUrl("/v2/borrower/application/product-match-status"),
    );

    return parseResponse(response);
  } catch (error) {
    return endpointUnavailableResponse(
      error instanceof Error ? error.message : "Product match status could not be loaded.",
    );
  }
}

export function storeBorrowerProductMatchStatus(result: ProductMatchStatusResponse): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    PRODUCT_MATCH_STATUS_STORAGE_KEY,
    JSON.stringify({
      result,
      stored_at: new Date().toISOString(),
    }),
  );
}
