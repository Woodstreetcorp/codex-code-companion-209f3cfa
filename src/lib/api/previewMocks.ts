/**
 * previewMocks.ts — demo data for the Lovable preview environment.
 *
 * The borrower portal normally talks to a Laravel backend over /v2/*. In the
 * Lovable preview there is no backend, so instead of returning auth failures we
 * return realistic demo payloads here. This lets every portal page render with
 * placeholder data and removes the login / create-account wall in preview.
 *
 * Only active when isUnconfiguredPreview() is true (Lovable host + no
 * VITE_APPROVU_API_BASE_URL). Real deployments never reach this code.
 */

const DEMO_USER = { name: "Alex Demo", email: "alex@demo.approvu.ca" };

const DEMO_QUALIFICATION = {
  public_reference: "QS-DEMO-1024",
  snapshot_public_reference: "SN-DEMO-2048",
  transaction_type: "purchase",
  state: "submitted",
  current_or_final_step: "product_review",
  created_at: "2026-05-20T14:00:00Z",
  submitted_at: "2026-05-22T09:30:00Z",
  next_step: "product_review",
};

const DEMO_SNAPSHOT = {
  public_reference: "SN-DEMO-2048",
  preliminary_lending_path: "Prime — A Lender",
  readiness_status: "ready",
  key_insights: [
    "Your estimated qualifying amount is strong for your target price range.",
    "Your credit profile supports prime lender pricing.",
    "A 20% down payment avoids default insurance.",
  ],
  missing_items: [],
  next_step: "Review your matched product options",
  generated_at: "2026-05-22T09:35:00Z",
};

const DEMO_PORTAL_SECTIONS = {
  documents: {
    status: "complete",
    label: "Documents",
    message: "All required documents received.",
  },
  offers: {
    status: "ready",
    label: "Offers",
    message: "Your matched product options are ready to review.",
  },
  application: {
    status: "submitted",
    label: "Application",
    message: "Your application has been submitted for review.",
  },
};

/** Default body for any /v2/* endpoint we do not explicitly mock. */
const DEFAULT_OK = {
  ok: true,
  authenticated: true,
  endpoint_available: true,
};

type MockEntry = Record<string, unknown>;

function exactMocks(): Record<string, MockEntry> {
  return {
    "/v2/borrower/me": {
      ok: true,
      status: "authenticated",
      authenticated: true,
      user: DEMO_USER,
      latest_qualification: DEMO_QUALIFICATION,
      next_step: "portal",
    },
    "/v2/borrower/login": {
      ok: true,
      status: "authenticated",
      authenticated: true,
      user: DEMO_USER,
      latest_qualification: DEMO_QUALIFICATION,
      next_step: "portal",
    },
    "/v2/borrower/logout": { ok: true, status: "signed_out", authenticated: false },
    "/v2/borrower/portal": {
      ok: true,
      authenticated: true,
      user: DEMO_USER,
      latest_qualification: DEMO_QUALIFICATION,
      latest_snapshot: DEMO_SNAPSHOT,
      portal_sections: DEMO_PORTAL_SECTIONS,
      primary_action: {
        label: "Review your matched products",
        action: "review_products",
        route_hint: "/portal/offers",
      },
      message: "Your saved Mortgage Snapshot and next steps are ready when you are.",
    },
    "/v2/borrower/offers/summary": {
      ok: true,
      endpoint_available: true,
      has_assignment: true,
      assignment: {
        public_reference: "OB-DEMO-3001",
        status: "assigned",
        assigned_at: "2026-05-23T10:00:00Z",
      },
      bundle: {
        public_reference: "OB-DEMO-3001",
        borrower_facing_title: "Your Home Life Bundle",
        short_description: "Curated savings on services for your new home.",
        bundle_tier: "premium",
        estimated_borrower_value: 1850,
        bundle_badge: "Featured",
        bundle_display_label: "Premium Bundle",
        bundle_theme_color: "#2dd4a8",
        featured_bundle: true,
        item_count: 6,
      },
      progress: { total_items: 6, selected_count: 3, redeemed_count: 1 },
    },
    "/v2/borrower/lifecycle-state": {
      ok: true,
      authenticated: true,
      state: "product_review",
      label: "Reviewing your options",
      next_step: "Review your matched product options",
    },
  };
}

/**
 * Resolve a demo response body for a given request, or undefined to let the
 * caller use a generic fallback. `url` may be absolute or relative and may
 * include a query string.
 */
export function resolvePreviewMock(method: string, url: string): MockEntry {
  const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0].replace(/\/+$/, "");
  const exact = exactMocks();
  if (path in exact) return exact[path];
  // Snapshot detail / generate endpoints.
  if (path.startsWith("/v2/borrower/qualification/snapshot")) {
    return { ok: true, snapshot: DEMO_SNAPSHOT };
  }
  return DEFAULT_OK;
}
