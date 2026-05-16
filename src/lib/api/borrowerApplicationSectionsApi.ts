// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicationSectionKey =
  | "borrower_profile"
  | "property"
  | "income"
  | "assets_down_payment"
  | "liabilities";

export type ApplicationSectionStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "needs_attention";

export const ALL_SECTION_KEYS: ApplicationSectionKey[] = [
  "borrower_profile",
  "property",
  "income",
  "assets_down_payment",
  "liabilities",
];

export const SECTION_LABELS: Record<ApplicationSectionKey, string> = {
  borrower_profile: "Borrower Profile",
  property: "Property",
  income: "Income",
  assets_down_payment: "Assets & Down Payment",
  liabilities: "Liabilities",
};

export type ApplicationSection = {
  public_reference?: string | null;
  section_key: ApplicationSectionKey;
  status: ApplicationSectionStatus;
  data?: Record<string, unknown> | null;
  prefill_data?: Record<string, unknown> | null;
  effective_data?: Record<string, unknown> | null;
  completed_at?: string | null;
  last_saved_at?: string | null;
};

export type ApplicationRecord = {
  public_reference?: string | null;
  status?: string | null;
  completion_percent?: number | null;
  current_step?: string | null;
};

export type SectionsSummary = {
  total_sections?: number | null;
  completed_sections?: number | null;
  in_progress_sections?: number | null;
  needs_attention_sections?: number | null;
};

// Response from GET /v2/borrower/application/sections
export type ListSectionsResponse = {
  ok?: boolean;
  application?: ApplicationRecord | null;
  sections?: ApplicationSection[] | null;
  sections_summary?: SectionsSummary | null;
  next_step?: string | null;
  // No application found signals
  found?: boolean;
  next_step_hint?: string;
  message?: string | null;
};

// Response from PATCH /v2/borrower/application/sections/{sectionKey}
export type SaveSectionResponse = {
  ok?: boolean;
  application?: ApplicationRecord | null;
  section?: ApplicationSection | null;
  sections_summary?: SectionsSummary | null;
  next_step?: string | null;
  message?: string | null;
};

// Response from POST /v2/borrower/application
export type EnsureApplicationResponse = {
  ok?: boolean;
  created?: boolean;
  data?: ApplicationRecord | null;
  next_step?: string | null;
  message?: string | null;
};

// Payload for PATCH
export type SaveSectionPayload = {
  data: Record<string, unknown>;
  status?: "in_progress" | "complete" | "needs_attention";
  current_step?: string;
};

// ─── Session storage ─────────────────────────────────────────────────────────

const SECTIONS_STORAGE_KEY = "approvu:borrower-application-sections";

export function storeBorrowerApplicationSections(result: ListSectionsResponse): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SECTIONS_STORAGE_KEY,
    JSON.stringify({
      application: result.application,
      sections_summary: result.sections_summary,
      stored_at: new Date().toISOString(),
    }),
  );
}

export function getStoredSectionsSummary(): SectionsSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SECTIONS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      sections_summary?: SectionsSummary;
    };
    return parsed.sections_summary ?? null;
  } catch {
    return null;
  }
}

// ─── Import shared session helper ────────────────────────────────────────────

import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

// ─── Internal response parser ─────────────────────────────────────────────────

async function parseJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = (body as { errors?: Record<string, string[]> }).errors
      ? Object.values((body as { errors: Record<string, string[]> }).errors)[0]?.[0]
      : undefined;
    throw new Error(firstError ?? (body as { message?: string }).message ?? fallbackMessage);
  }

  return body;
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /v2/borrower/application/sections
 * Returns all 5 sections with their current statuses for the borrower's
 * active mortgage application.
 */
export async function listBorrowerApplicationSections(): Promise<ListSectionsResponse> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/application/sections"));
  return parseJson<ListSectionsResponse>(response, "Application sections could not be loaded.");
}

/**
 * GET /v2/borrower/application/sections/{sectionKey}
 * Returns a single section with its saved data.
 */
export async function getBorrowerApplicationSection(
  sectionKey: ApplicationSectionKey,
): Promise<SaveSectionResponse> {
  const response = await fetchWithLaravelSession(
    buildApiUrl(`/v2/borrower/application/sections/${encodeURIComponent(sectionKey)}`),
  );
  return parseJson<SaveSectionResponse>(response, `Section '${sectionKey}' could not be loaded.`);
}

/**
 * PATCH /v2/borrower/application/sections/{sectionKey}
 * Saves (upserts) section data. Automatically moves the application from
 * draft → in_progress on first save and recalculates completion_percent.
 *
 * CSRF is handled by fetchWithLaravelSession automatically.
 */
export async function saveBorrowerApplicationSection(
  sectionKey: ApplicationSectionKey,
  payload: SaveSectionPayload,
): Promise<SaveSectionResponse> {
  const response = await fetchWithLaravelSession(
    buildApiUrl(`/v2/borrower/application/sections/${encodeURIComponent(sectionKey)}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<SaveSectionResponse>(response, `Section '${sectionKey}' could not be saved.`);
}

/**
 * POST /v2/borrower/application
 * Idempotent get-or-create. Safe to call on every workspace load.
 * Returns next_step: 'start_qualification' if no qualification exists.
 */
export async function ensureBorrowerApplication(): Promise<EnsureApplicationResponse> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/application"), {
    method: "POST",
  });
  return parseJson<EnsureApplicationResponse>(
    response,
    "Your mortgage application could not be created.",
  );
}
