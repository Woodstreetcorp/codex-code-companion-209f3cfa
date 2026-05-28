import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OfferBundleAssignment = {
  public_reference?: string | null;
  status?: string | null;
  assigned_at?: string | null;
};

export type OfferBundleDetail = {
  public_reference?: string | null;
  borrower_facing_title?: string | null;
  short_description?: string | null;
  bundle_tier?: string | null;
  estimated_borrower_value?: number | null;
  bundle_badge?: string | null;
  bundle_display_label?: string | null;
  bundle_theme_color?: string | null;
  featured_bundle?: boolean | null;
  item_count?: number | null;
};

export type OfferBundleProgress = {
  total_items?: number | null;
  selected_count?: number | null;
  redeemed_count?: number | null;
};

export type BorrowerOfferBundleSummary = {
  ok: boolean;
  endpoint_available: boolean;
  has_assignment: boolean;
  assignment: OfferBundleAssignment | null;
  bundle: OfferBundleDetail | null;
  progress: OfferBundleProgress | null;
  message?: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function unavailable(message?: string | null): BorrowerOfferBundleSummary {
  return {
    ok: false,
    endpoint_available: false,
    has_assignment: false,
    assignment: null,
    bundle: null,
    progress: null,
    message: message ?? "Offer bundle details are not available yet.",
  };
}

function parseAssignment(source: Record<string, unknown>): OfferBundleAssignment | null {
  const ref = asString(source.public_reference);
  if (!ref) return null;
  return {
    public_reference: ref,
    status: asString(source.status),
    assigned_at: asString(source.assigned_at),
  };
}

function parseBundle(source: Record<string, unknown>): OfferBundleDetail | null {
  const title = asString(source.borrower_facing_title ?? source.bundle_name ?? source.title);
  if (!title) return null;
  return {
    public_reference: asString(source.public_reference),
    borrower_facing_title: title,
    short_description: asString(source.short_description),
    bundle_tier: asString(source.bundle_tier),
    estimated_borrower_value: asNumber(source.estimated_borrower_value),
    bundle_badge: asString(source.bundle_badge),
    bundle_display_label: asString(source.bundle_display_label),
    bundle_theme_color: asString(source.bundle_theme_color),
    featured_bundle: asBoolean(source.featured_bundle),
    item_count: asNumber(source.item_count),
  };
}

function parseProgress(source: Record<string, unknown>): OfferBundleProgress | null {
  const total = asNumber(source.total_items);
  if (total === null) return null;
  return {
    total_items: total,
    selected_count: asNumber(source.selected_count),
    redeemed_count: asNumber(source.redeemed_count),
  };
}

// ── API function ──────────────────────────────────────────────────────────────

/**
 * Fetches the borrower's offer bundle summary.
 *
 * Calls GET /v2/borrower/offers/summary which returns bundle assignment details,
 * estimated borrower value, and item counts. Falls back gracefully if the
 * endpoint is not available or the borrower has no assignment yet.
 */
export async function getBorrowerOfferBundleSummary(): Promise<BorrowerOfferBundleSummary> {
  try {
    const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/offers/summary"));

    if (response.status === 204 || response.status === 404) {
      return {
        ok: true,
        endpoint_available: true,
        has_assignment: false,
        assignment: null,
        bundle: null,
        progress: null,
      };
    }

    if (!response.ok) {
      return unavailable();
    }

    const body = asRecord(await response.json().catch(() => ({})));

    const assignment = parseAssignment(asRecord(body.assignment));
    const bundle = parseBundle(asRecord(body.bundle));
    const progress = parseProgress(asRecord(body.progress));

    return {
      ok: true,
      endpoint_available: true,
      has_assignment: asBoolean(body.has_assignment) ?? assignment !== null,
      assignment,
      bundle,
      progress,
      message: asString(body.message),
    };
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : null);
  }
}

// ── Session storage ───────────────────────────────────────────────────────────

const OFFER_BUNDLE_STORAGE_KEY = "approvu:borrower-offer-bundle";

export function storeBorrowerOfferBundleSummary(result: BorrowerOfferBundleSummary): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    OFFER_BUNDLE_STORAGE_KEY,
    JSON.stringify({
      has_assignment: result.has_assignment,
      assignment_status: result.assignment?.status,
      bundle_title: result.bundle?.borrower_facing_title,
      estimated_borrower_value: result.bundle?.estimated_borrower_value,
      item_count: result.bundle?.item_count,
      stored_at: new Date().toISOString(),
    }),
  );
}
