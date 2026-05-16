export type ApplicationState =
  | "not_started"
  | "in_progress"
  | "needs_attention"
  | "pending_review";

export type SectionStatus =
  | "not_started"
  | "in_progress"
  | "needs_attention"
  | "pending_review"
  | "complete";

export type PrimaryActionType =
  | "start_qualification"
  | "view_mortgage_snapshot"
  | "upload_documents"
  | "review_application"
  | string;

export type QualificationSummary = {
  safe_token_reference?: string | null;
  path?: string | null;
  location_city?: string | null;
  location_province?: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
};

export type MortgageSnapshotSummary = {
  snapshot_reference?: string | null;
  classification?: string | null;
  readiness_status?: string | null;
  key_insights_count?: number | null;
  missing_items_count?: number | null;
};

export type DocumentSummary = {
  total?: number | null;
  requested?: number | null;
  uploaded?: number | null;
  reviewed?: number | null;
  rejected?: number | null;
  waived?: number | null;
  next_required_document?: string | null;
};

export type ApplicationSection = {
  key?: string | null;
  label?: string | null;
  status?: SectionStatus | null;
  description?: string | null;
};

export type PrimaryAction = {
  label?: string | null;
  action?: PrimaryActionType | null;
  route_hint?: string | null;
};

export type BorrowerApplicationSummary = {
  ok?: boolean;
  authenticated?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  application_state?: ApplicationState | null;
  completion_percent?: number | null;
  qualification_summary?: QualificationSummary | null;
  mortgage_snapshot_summary?: MortgageSnapshotSummary | null;
  document_summary?: DocumentSummary | null;
  sections?: ApplicationSection[] | null;
  primary_action?: PrimaryAction | null;
  messages?: string[] | null;
};

import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

const BORROWER_APPLICATION_SUMMARY_STORAGE_KEY =
  "approvu:borrower-application-summary";

async function parseResponse(
  response: Response,
): Promise<BorrowerApplicationSummary> {
  const body = (await response.json().catch(() => ({}))) as BorrowerApplicationSummary & {
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
        "Your application summary could not be loaded.",
    );
  }

  return body;
}

export async function getBorrowerApplicationSummary(): Promise<BorrowerApplicationSummary> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/application-summary"));

  return parseResponse(response);
}

export function storeBorrowerApplicationSummary(
  result: BorrowerApplicationSummary,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    BORROWER_APPLICATION_SUMMARY_STORAGE_KEY,
    JSON.stringify({
      application_state: result.application_state,
      completion_percent: result.completion_percent,
      primary_action: result.primary_action,
      stored_at: new Date().toISOString(),
    }),
  );
}
