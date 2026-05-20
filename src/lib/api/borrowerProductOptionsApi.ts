import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

export type BorrowerProductOption = {
  public_reference?: string | null;
  option_label?: string | null;
  product_category?: string | null;
  product_class_label?: string | null;
  path_label?: string | null;
  advisor_reviewed?: boolean | null;
  notes?: string | string[] | null;
  documents_needed?: string[] | null;
  created_at?: string | null;
  disclaimer?: string | null;
  [key: string]: unknown;
};

export type BorrowerProductOptionsResponse = {
  ok?: boolean;
  endpoint_available?: boolean;
  options_available?: boolean | null;
  options?: BorrowerProductOption[] | null;
  message?: string | null;
  next_step?: string | null;
  generated_at?: string | null;
  [key: string]: unknown;
};

const PRODUCT_OPTIONS_STORAGE_KEY = "approvu:borrower-product-options";

function endpointUnavailableResponse(message?: string | null): BorrowerProductOptionsResponse {
  return {
    ok: false,
    endpoint_available: false,
    options_available: false,
    options: [],
    message: message ?? "Product options are not available yet.",
  };
}

function sanitizeProductOptionsResponse(
  body: BorrowerProductOptionsResponse,
): BorrowerProductOptionsResponse {
  return {
    ...body,
    options: Array.isArray(body.options) ? body.options : [],
  };
}

async function parseResponse(response: Response): Promise<BorrowerProductOptionsResponse> {
  const body = (await response.json().catch(() => ({}))) as BorrowerProductOptionsResponse & {
    message?: string;
  };

  if (response.status === 404) {
    return endpointUnavailableResponse(body.message);
  }

  if (!response.ok) {
    return {
      ...sanitizeProductOptionsResponse(body),
      ok: false,
      endpoint_available: true,
      options_available: false,
      message: body.message ?? "Product options could not be loaded.",
    };
  }

  return {
    ...sanitizeProductOptionsResponse(body),
    ok: body.ok ?? true,
    endpoint_available: true,
  };
}

export async function getBorrowerProductOptions(): Promise<BorrowerProductOptionsResponse> {
  try {
    const response = await fetchWithLaravelSession(
      buildApiUrl("/v2/borrower/application/product-options"),
    );

    return parseResponse(response);
  } catch (error) {
    return endpointUnavailableResponse(
      error instanceof Error ? error.message : "Product options could not be loaded.",
    );
  }
}

export function storeBorrowerProductOptions(result: BorrowerProductOptionsResponse): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    PRODUCT_OPTIONS_STORAGE_KEY,
    JSON.stringify({
      options_available: result.options_available,
      options_count: result.options?.length ?? 0,
      generated_at: result.generated_at,
      stored_at: new Date().toISOString(),
    }),
  );
}
