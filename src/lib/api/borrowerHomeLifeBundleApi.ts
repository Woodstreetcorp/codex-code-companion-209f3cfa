import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

export type BorrowerHomeLifeBundleSummary = {
  public_reference?: string | null;
  bundle_name?: string | null;
  status?: string | null;
  assignment_status?: string | null;
  selected_offers_count?: number | null;
  redeemable_codes_count?: number | null;
  redeemable_offers_count?: number | null;
  message?: string | null;
  next_step?: string | null;
  updated_at?: string | null;
};

export type BorrowerHomeLifeBundleAssignment = {
  public_reference?: string | null;
  bundle_name?: string | null;
  status?: string | null;
  assigned_at?: string | null;
  expires_at?: string | null;
  message?: string | null;
};

export type BorrowerHomeLifeBundleOffer = {
  public_reference?: string | null;
  offer_label?: string | null;
  partner_label?: string | null;
  category?: string | null;
  status?: string | null;
  selected_at?: string | null;
  redeemable?: boolean | null;
  redemption_status?: string | null;
  expires_at?: string | null;
  safe_description?: string | null;
};

export type BorrowerHomeLifeBundleCodeSummary = {
  public_reference?: string | null;
  offer_label?: string | null;
  code_label?: string | null;
  status?: string | null;
  expires_at?: string | null;
  redeemable?: boolean | null;
};

export type BorrowerHomeLifeBundlePortalData = {
  ok: boolean;
  endpoint_available: boolean;
  summary: BorrowerHomeLifeBundleSummary | null;
  assignments: BorrowerHomeLifeBundleAssignment[];
  selected_offers: BorrowerHomeLifeBundleOffer[];
  redeemable_codes: BorrowerHomeLifeBundleCodeSummary[];
  message?: string | null;
};

export type BorrowerHomeLifeBundleRedemptionResult = {
  ok: boolean;
  status?: string | null;
  message?: string | null;
  public_reference?: string | null;
  code_label?: string | null;
  display_code?: string | null;
};

const HOME_LIFE_BUNDLE_STORAGE_KEY = "approvu:borrower-home-life-bundle";

const ENDPOINTS = {
  summary: "/v2/borrower/home-life-bundle/summary",
  assignments: "/v2/borrower/home-life-bundle/assignments",
  selectedOffers: "/v2/borrower/home-life-bundle/selected-offers",
  redeemableCodes: "/v2/borrower/home-life-bundle/redeemable-codes/summary",
  offerDetail: (publicReference: string) =>
    `/v2/borrower/home-life-bundle/offers/${encodeURIComponent(publicReference)}`,
  redeemCode: (publicReference: string) =>
    `/v2/borrower/home-life-bundle/redeemable-codes/${encodeURIComponent(publicReference)}/redeem`,
};

function unavailable(message?: string | null): BorrowerHomeLifeBundlePortalData {
  return {
    ok: false,
    endpoint_available: false,
    summary: null,
    assignments: [],
    selected_offers: [],
    redeemable_codes: [],
    message: message ?? "Home Life Bundle details are not available yet.",
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function listFrom(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(asRecord);
  return [];
}

async function fetchJson(path: string): Promise<Record<string, unknown> | null> {
  const response = await fetchWithLaravelSession(buildApiUrl(path));
  const body = (await response.json().catch(() => ({}))) as unknown;

  if (response.status === 404) return null;

  if (!response.ok) {
    const record = asRecord(body);
    throw new Error(asString(record.message) ?? "Home Life Bundle details could not be loaded.");
  }

  return asRecord(body);
}

function sanitizeSummary(
  body: Record<string, unknown> | null,
): BorrowerHomeLifeBundleSummary | null {
  if (!body) return null;
  const source = asRecord(body.summary ?? body.bundle ?? body);

  return {
    public_reference: asString(source.public_reference),
    bundle_name: asString(source.bundle_name ?? source.name ?? source.label),
    status: asString(source.status),
    assignment_status: asString(source.assignment_status),
    selected_offers_count: asNumber(source.selected_offers_count),
    redeemable_codes_count: asNumber(source.redeemable_codes_count),
    redeemable_offers_count: asNumber(source.redeemable_offers_count),
    message: asString(source.message),
    next_step: asString(source.next_step),
    updated_at: asString(source.updated_at),
  };
}

function sanitizeAssignments(
  body: Record<string, unknown> | null,
): BorrowerHomeLifeBundleAssignment[] {
  if (!body) return [];
  const rows = listFrom(body.assignments ?? body.data ?? body.items);

  return rows.map((source) => ({
    public_reference: asString(source.public_reference),
    bundle_name: asString(source.bundle_name ?? source.name ?? source.label),
    status: asString(source.status),
    assigned_at: asString(source.assigned_at),
    expires_at: asString(source.expires_at),
    message: asString(source.message),
  }));
}

function sanitizeOffers(body: Record<string, unknown> | null): BorrowerHomeLifeBundleOffer[] {
  if (!body) return [];
  const rows = listFrom(body.selected_offers ?? body.offers ?? body.data ?? body.items);

  return rows.map((source) => ({
    public_reference: asString(source.public_reference),
    offer_label: asString(source.offer_label ?? source.title ?? source.label),
    partner_label: asString(source.partner_label ?? source.partner_name),
    category: asString(source.category),
    status: asString(source.status),
    selected_at: asString(source.selected_at),
    redeemable: asBoolean(source.redeemable),
    redemption_status: asString(source.redemption_status),
    expires_at: asString(source.expires_at),
    safe_description: asString(source.safe_description ?? source.description),
  }));
}

function sanitizeCodes(body: Record<string, unknown> | null): BorrowerHomeLifeBundleCodeSummary[] {
  if (!body) return [];
  const rows = listFrom(body.redeemable_codes ?? body.codes ?? body.data ?? body.items);

  return rows.map((source) => ({
    public_reference: asString(source.public_reference),
    offer_label: asString(source.offer_label ?? source.title ?? source.label),
    code_label: asString(source.code_label ?? source.label),
    status: asString(source.status),
    expires_at: asString(source.expires_at),
    redeemable: asBoolean(source.redeemable),
  }));
}

export async function getBorrowerHomeLifeBundlePortalData(): Promise<BorrowerHomeLifeBundlePortalData> {
  try {
    const [summaryBody, assignmentsBody, selectedOffersBody, redeemableCodesBody] =
      await Promise.all([
        fetchJson(ENDPOINTS.summary),
        fetchJson(ENDPOINTS.assignments),
        fetchJson(ENDPOINTS.selectedOffers),
        fetchJson(ENDPOINTS.redeemableCodes),
      ]);

    if (!summaryBody && !assignmentsBody && !selectedOffersBody && !redeemableCodesBody) {
      return unavailable();
    }

    return {
      ok: true,
      endpoint_available: true,
      summary: sanitizeSummary(summaryBody),
      assignments: sanitizeAssignments(assignmentsBody),
      selected_offers: sanitizeOffers(selectedOffersBody),
      redeemable_codes: sanitizeCodes(redeemableCodesBody),
      message: asString(summaryBody?.message),
    };
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : null);
  }
}

export async function getBorrowerHomeLifeBundleOfferDetail(
  publicReference: string,
): Promise<BorrowerHomeLifeBundleOffer | null> {
  const body = await fetchJson(ENDPOINTS.offerDetail(publicReference));
  return sanitizeOffers(body)[0] ?? sanitizeOffers({ offers: [body] })[0] ?? null;
}

export async function redeemBorrowerHomeLifeBundleCode(
  publicReference: string,
): Promise<BorrowerHomeLifeBundleRedemptionResult> {
  const response = await fetchWithLaravelSession(
    buildApiUrl(ENDPOINTS.redeemCode(publicReference)),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_reference: publicReference }),
    },
  );
  const body = asRecord(await response.json().catch(() => ({})));

  if (!response.ok) {
    throw new Error(asString(body.message) ?? "This offer could not be claimed right now.");
  }

  const canDisplayCode =
    asBoolean(body.can_display_code) === true ||
    asBoolean(body.display_code_allowed) === true ||
    asBoolean(body.expose_code) === true;

  return {
    ok: asBoolean(body.ok) ?? true,
    status: asString(body.status),
    message: asString(body.message),
    public_reference: asString(body.public_reference),
    code_label: asString(body.code_label),
    display_code: canDisplayCode
      ? asString(body.display_code ?? body.redemption_code ?? body.code)
      : null,
  };
}

export function storeBorrowerHomeLifeBundlePortalData(
  result: BorrowerHomeLifeBundlePortalData,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    HOME_LIFE_BUNDLE_STORAGE_KEY,
    JSON.stringify({
      endpoint_available: result.endpoint_available,
      assignment_status: result.summary?.assignment_status ?? result.summary?.status,
      assignments_count: result.assignments.length,
      selected_offers_count: result.selected_offers.length,
      redeemable_codes_count: result.redeemable_codes.length,
      stored_at: new Date().toISOString(),
    }),
  );
}
