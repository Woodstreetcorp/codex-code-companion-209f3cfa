import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

export type LenderPackagingSummary = {
  total?: number | null;
  ready?: number | null;
  completed?: number | null;
  required?: number | null;
  missing?: number | null;
  pending?: number | null;
  [key: string]: unknown;
};

export type LenderPackagingReadinessResponse = {
  ok?: boolean;
  endpoint_available?: boolean;
  ready?: boolean | null;
  status?: string | null;
  blockers?: string[] | null;
  selected_products_count?: number | null;
  document_summary?: LenderPackagingSummary | null;
  consent_summary?: LenderPackagingSummary | null;
  next_step?: string | null;
  disclaimer?: string | null;
  message?: string | null;
  [key: string]: unknown;
};

const LENDER_PACKAGING_READINESS_STORAGE_KEY = "approvu:lender-packaging-readiness";

function endpointUnavailableResponse(message?: string | null): LenderPackagingReadinessResponse {
  return {
    ok: false,
    endpoint_available: false,
    ready: false,
    blockers: [],
    selected_products_count: 0,
    message: message ?? "Lender packaging readiness is not available yet.",
  };
}

function sanitizeReadinessResponse(
  body: LenderPackagingReadinessResponse,
): LenderPackagingReadinessResponse {
  return {
    ...body,
    blockers: Array.isArray(body.blockers) ? body.blockers : [],
  };
}

async function parseResponse(response: Response): Promise<LenderPackagingReadinessResponse> {
  const body = (await response.json().catch(() => ({}))) as LenderPackagingReadinessResponse & {
    message?: string;
  };

  if (response.status === 404) {
    return endpointUnavailableResponse(body.message);
  }

  if (!response.ok) {
    return {
      ...sanitizeReadinessResponse(body),
      ok: false,
      endpoint_available: true,
      message: body.message ?? "Lender packaging readiness could not be loaded.",
    };
  }

  return {
    ...sanitizeReadinessResponse(body),
    ok: body.ok ?? true,
    endpoint_available: true,
  };
}

export async function getBorrowerLenderPackagingReadiness(): Promise<LenderPackagingReadinessResponse> {
  try {
    const response = await fetchWithLaravelSession(
      buildApiUrl("/v2/borrower/application/lender-packaging-readiness"),
    );

    return parseResponse(response);
  } catch (error) {
    return endpointUnavailableResponse(
      error instanceof Error ? error.message : "Lender packaging readiness could not be loaded.",
    );
  }
}

export function storeBorrowerLenderPackagingReadiness(
  result: LenderPackagingReadinessResponse,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    LENDER_PACKAGING_READINESS_STORAGE_KEY,
    JSON.stringify({
      ready: result.ready,
      status: result.status,
      selected_products_count: result.selected_products_count,
      stored_at: new Date().toISOString(),
    }),
  );
}
