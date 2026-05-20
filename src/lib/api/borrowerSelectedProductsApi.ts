import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

export type BorrowerSelectedProduct = {
  public_reference?: string | null;
  product_option_public_reference?: string | null;
  option_label?: string | null;
  product_category?: string | null;
  product_class_label?: string | null;
  path_label?: string | null;
  selection_status?: string | null;
  selected_at?: string | null;
  disclaimer?: string | null;
  [key: string]: unknown;
};

export type BorrowerSelectedProductsResponse = {
  ok?: boolean;
  endpoint_available?: boolean;
  selected_products?: BorrowerSelectedProduct[] | null;
  selected_count?: number | null;
  message?: string | null;
  next_step?: string | null;
  [key: string]: unknown;
};

const SELECTED_PRODUCTS_STORAGE_KEY = "approvu:borrower-selected-products";

function endpointUnavailableResponse(message?: string | null): BorrowerSelectedProductsResponse {
  return {
    ok: false,
    endpoint_available: false,
    selected_products: [],
    selected_count: 0,
    message: message ?? "Selected product paths are not available yet.",
  };
}

function sanitizeSelectedProductsResponse(
  body: BorrowerSelectedProductsResponse,
): BorrowerSelectedProductsResponse {
  return {
    ...body,
    selected_products: Array.isArray(body.selected_products) ? body.selected_products : [],
  };
}

async function parseResponse(response: Response): Promise<BorrowerSelectedProductsResponse> {
  const body = (await response.json().catch(() => ({}))) as BorrowerSelectedProductsResponse & {
    message?: string;
  };

  if (response.status === 404) {
    return endpointUnavailableResponse(body.message);
  }

  if (!response.ok) {
    return {
      ...sanitizeSelectedProductsResponse(body),
      ok: false,
      endpoint_available: true,
      selected_products: [],
      message: body.message ?? "Selected product paths could not be loaded.",
    };
  }

  return {
    ...sanitizeSelectedProductsResponse(body),
    ok: body.ok ?? true,
    endpoint_available: true,
  };
}

export async function listBorrowerSelectedProducts(): Promise<BorrowerSelectedProductsResponse> {
  try {
    const response = await fetchWithLaravelSession(
      buildApiUrl("/v2/borrower/application/selected-products"),
    );

    return parseResponse(response);
  } catch (error) {
    return endpointUnavailableResponse(
      error instanceof Error ? error.message : "Selected product paths could not be loaded.",
    );
  }
}

export async function selectBorrowerProductOption(
  publicReference: string,
): Promise<BorrowerSelectedProductsResponse> {
  try {
    const response = await fetchWithLaravelSession(
      buildApiUrl(
        `/v2/borrower/application/product-options/${encodeURIComponent(publicReference)}/select`,
      ),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    return parseResponse(response);
  } catch (error) {
    return endpointUnavailableResponse(
      error instanceof Error ? error.message : "Product path selection could not be saved.",
    );
  }
}

export function storeBorrowerSelectedProducts(result: BorrowerSelectedProductsResponse): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SELECTED_PRODUCTS_STORAGE_KEY,
    JSON.stringify({
      selected_count: result.selected_count ?? result.selected_products?.length ?? 0,
      stored_at: new Date().toISOString(),
    }),
  );
}
