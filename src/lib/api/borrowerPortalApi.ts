export type BorrowerPortalUser = {
  name?: string | null;
  email?: string | null;
};

export type BorrowerPortalQualification = {
  public_reference?: string | null;
  transaction_type?: string | null;
  state?: string | null;
  current_or_final_step?: string | null;
  created_at?: string | null;
  submitted_at?: string | null;
  next_step?: string | null;
};

export type BorrowerPortalSnapshot = {
  public_reference?: string | null;
  preliminary_lending_path?: string | null;
  readiness_status?: string | null;
  key_insights?: string[] | null;
  missing_items?: string[] | null;
  next_step?: string | null;
  generated_at?: string | null;
};

export type BorrowerPortalSection = {
  status?: string | null;
  label?: string | null;
  message?: string | null;
};

export type BorrowerPortalSummary = {
  ok?: boolean;
  authenticated?: boolean;
  user?: BorrowerPortalUser | null;
  latest_qualification?: BorrowerPortalQualification | null;
  latest_snapshot?: BorrowerPortalSnapshot | null;
  portal_sections?: {
    documents?: BorrowerPortalSection | null;
    offers?: BorrowerPortalSection | null;
    application?: BorrowerPortalSection | null;
  } | null;
  primary_action?: {
    label?: string | null;
    action?: string | null;
    route_hint?: string | null;
  } | null;
  message?: string | null;
};

import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

const BORROWER_PORTAL_STORAGE_KEY = "approvu:borrower-portal-summary";

async function parseResponse(response: Response): Promise<BorrowerPortalSummary> {
  const body = (await response.json().catch(() => ({}))) as BorrowerPortalSummary & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    throw new Error(firstError ?? body.message ?? "Your borrower portal could not be loaded.");
  }

  return body;
}

export async function getBorrowerPortalSummary(): Promise<BorrowerPortalSummary> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/portal"));

  return parseResponse(response);
}

export function storeBorrowerPortalSummary(result: BorrowerPortalSummary): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    BORROWER_PORTAL_STORAGE_KEY,
    JSON.stringify({
      user: result.user,
      latest_qualification: result.latest_qualification,
      latest_snapshot: result.latest_snapshot,
      primary_action: result.primary_action,
      stored_at: new Date().toISOString(),
    }),
  );
}
