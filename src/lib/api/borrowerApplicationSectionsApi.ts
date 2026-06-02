import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

export type ApplicationSectionKey =
  | "personal-details"
  | "borrower_profile"
  | "borrowers"
  | "employment"
  | "income"
  | "assets"
  | "assets_down_payment"
  | "liabilities"
  | "credit"
  | "property"
  | "other-properties"
  | "mortgage-request"
  | "financing"
  | "documents"
  | "consents"
  | "review";

export type ApplicationSectionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "complete"
  | "needs_attention";

export const ALL_SECTION_KEYS: ApplicationSectionKey[] = [
  "personal-details",
  "borrowers",
  "employment",
  "income",
  "assets",
  "liabilities",
  "credit",
  "property",
  "other-properties",
  "mortgage-request",
  "financing",
  "documents",
  "consents",
  "review",
];

export const SECTION_LABELS: Record<ApplicationSectionKey, string> = {
  "personal-details": "Personal Details",
  borrower_profile: "Personal Details",
  borrowers: "Borrowers and Co-Borrowers",
  employment: "Employment",
  income: "Income",
  assets: "Assets",
  assets_down_payment: "Assets",
  liabilities: "Liabilities",
  credit: "Credit",
  property: "Subject Property",
  "other-properties": "Other Properties",
  "mortgage-request": "Mortgage Request",
  financing: "Financing & Equity",
  documents: "Documents",
  consents: "Consents",
  review: "Review & Submit",
};

export type ApplicationProgress = {
  percent?: number | null;
  completedSections?: number | null;
  totalSections?: number | null;
};

export type ApplicationSectionValidation = {
  missingRequiredFields?: string[] | null;
  warnings?: string[] | null;
  blockingIssues?: string[] | null;
};

export type ApplicationSection = {
  public_reference?: string | null;
  section_key?: ApplicationSectionKey | string | null;
  key?: ApplicationSectionKey | string | null;
  label?: string | null;
  status?: ApplicationSectionStatus | string | null;
  data?: Record<string, unknown> | null;
  prefill_data?: Record<string, unknown> | null;
  effective_data?: Record<string, unknown> | null;
  completed_at?: string | null;
  last_saved_at?: string | null;
  isRequired?: boolean | null;
  route?: string | null;
};

export type ApplicationRecord = {
  public_reference?: string | null;
  status?: string | null;
  completion_percent?: number | null;
  current_step?: string | null;
  [key: string]: unknown;
};

export type SectionsSummary = {
  total_sections?: number | null;
  completed_sections?: number | null;
  in_progress_sections?: number | null;
  needs_attention_sections?: number | null;
  incomplete_sections?: number | null;
};

export type BorrowerApplicationWorkspaceResponse = {
  ok?: boolean;
  workspace_type?: string | null;
  application?: ApplicationRecord | null;
  sections?: ApplicationSection[] | null;
  sections_summary?: SectionsSummary | null;
  currentSection?: string | null;
  next_step?: string | null;
  nextStep?: string | null;
  progress?: ApplicationProgress | null;
  documents?: {
    uploaded?: number | null;
    required?: number | null;
    [key: string]: unknown;
  } | null;
  consents?: {
    signed?: number | null;
    required?: number | null;
    [key: string]: unknown;
  } | null;
  sectionData?: Record<string, unknown> | null;
  validation?: ApplicationSectionValidation | null;
  message?: string | null;
};

export type ListSectionsResponse = BorrowerApplicationWorkspaceResponse;

export type BorrowerApplicationSectionResponse = {
  ok?: boolean;
  application?: ApplicationRecord | null;
  section?: ApplicationSection | null;
  sectionKey?: string | null;
  status?: ApplicationSectionStatus | string | null;
  data?: Record<string, unknown> | null;
  prefill_data?: Record<string, unknown> | null;
  effective_data?: Record<string, unknown> | null;
  validation?: ApplicationSectionValidation | null;
  progress?: ApplicationProgress | null;
  sections_summary?: SectionsSummary | null;
  next_step?: string | null;
  message?: string | null;
};

export type SaveSectionResponse = BorrowerApplicationSectionResponse;

export type SaveSectionIntent = "save" | "save_and_continue";

export type SaveSectionPayload = {
  data: Record<string, unknown>;
  status?: "in_progress" | "completed" | "complete" | "needs_attention";
  current_step?: string;
  intent?: SaveSectionIntent;
};

export type EnsureApplicationResponse = {
  ok?: boolean;
  created?: boolean;
  data?: ApplicationRecord | null;
  next_step?: string | null;
  message?: string | null;
};

export type SubmissionBlocker = {
  key?: string | null;
  label?: string | null;
  message?: string | null;
  route_hint?: string | null;
};

export type SubmissionReadinessResponse = {
  ok?: boolean;
  application_public_reference?: string | null;
  ready?: boolean | null;
  status?: string | null;
  blockers?: SubmissionBlocker[] | null;
  sections_summary?: SectionsSummary | null;
  consent_summary?: Record<string, unknown> | null;
  document_summary?: Record<string, unknown> | null;
  progress?: ApplicationProgress | null;
  next_step?: string | null;
  message?: string | null;
};

export type SubmissionResponse = {
  ok?: boolean;
  submitted?: boolean | null;
  already_submitted?: boolean | null;
  application?: ApplicationRecord | null;
  next_step?: string | null;
  message?: string | null;
  blockers?: SubmissionBlocker[] | null;
};

const SECTIONS_STORAGE_KEY = "approvu:borrower-application-sections";

export function normalizeSectionStatus(
  status: unknown,
): Exclude<ApplicationSectionStatus, "complete"> {
  const normalized = String(status ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (["complete", "completed", "done", "accepted"].includes(normalized)) return "completed";
  if (["needs_attention", "blocked", "missing", "action_required"].includes(normalized)) {
    return "needs_attention";
  }
  if (["in_progress", "started", "draft", "pending_review"].includes(normalized)) {
    return "in_progress";
  }
  return "not_started";
}

export function storeBorrowerApplicationSections(result: ListSectionsResponse): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SECTIONS_STORAGE_KEY,
    JSON.stringify({
      application: result.application,
      sections_summary: result.sections_summary,
      progress: result.progress,
      stored_at: new Date().toISOString(),
    }),
  );
}

export function getStoredSectionsSummary(): SectionsSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SECTIONS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { sections_summary?: SectionsSummary };
    return parsed.sections_summary ?? null;
  } catch {
    return null;
  }
}

async function parseJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    const error = new Error(firstError ?? body.message ?? fallbackMessage);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return body;
}

export async function getBorrowerApplicationWorkspace(): Promise<BorrowerApplicationWorkspaceResponse> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/application/workspace"));
  const result = await parseJson<BorrowerApplicationWorkspaceResponse>(
    response,
    "Application workspace could not be loaded.",
  );
  storeBorrowerApplicationSections(result);
  return result;
}

export async function getBorrowerApplicationSections(): Promise<ListSectionsResponse> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/application/sections"));
  const result = await parseJson<ListSectionsResponse>(
    response,
    "Application sections could not be loaded.",
  );
  storeBorrowerApplicationSections(result);
  return result;
}

export const listBorrowerApplicationSections = getBorrowerApplicationSections;

export async function getBorrowerApplicationSection(
  sectionKey: ApplicationSectionKey,
): Promise<BorrowerApplicationSectionResponse> {
  const response = await fetchWithLaravelSession(
    buildApiUrl(`/v2/borrower/application/sections/${encodeURIComponent(sectionKey)}`),
  );
  return parseJson<BorrowerApplicationSectionResponse>(
    response,
    `Section '${sectionKey}' could not be loaded.`,
  );
}

export async function saveBorrowerApplicationSection(
  sectionKey: ApplicationSectionKey,
  payload: Omit<SaveSectionPayload, "intent">,
  intent: SaveSectionIntent = "save",
): Promise<SaveSectionResponse> {
  const response = await fetchWithLaravelSession(
    buildApiUrl(`/v2/borrower/application/sections/${encodeURIComponent(sectionKey)}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, intent }),
    },
  );
  return parseJson<SaveSectionResponse>(response, `Section '${sectionKey}' could not be saved.`);
}

export async function initializeBorrowerApplicationSection(
  sectionKey: ApplicationSectionKey,
): Promise<BorrowerApplicationSectionResponse> {
  const response = await fetchWithLaravelSession(
    buildApiUrl(`/v2/borrower/application/sections/${encodeURIComponent(sectionKey)}/initialize`),
    { method: "POST" },
  );
  return parseJson<BorrowerApplicationSectionResponse>(
    response,
    `Section '${sectionKey}' could not be initialized.`,
  );
}

export async function ensureBorrowerApplication(): Promise<EnsureApplicationResponse> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/application"), {
    method: "POST",
  });
  return parseJson<EnsureApplicationResponse>(
    response,
    "Your mortgage application could not be created.",
  );
}

export async function getBorrowerApplicationSubmissionReadiness(): Promise<SubmissionReadinessResponse> {
  const response = await fetchWithLaravelSession(
    buildApiUrl("/v2/borrower/application/submission-readiness"),
  );
  return parseJson<SubmissionReadinessResponse>(
    response,
    "Application submission readiness could not be loaded.",
  );
}

export async function submitBorrowerApplication(): Promise<SubmissionResponse> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/application/submit"), {
    method: "POST",
  });
  return parseJson<SubmissionResponse>(response, "Application could not be submitted.");
}
