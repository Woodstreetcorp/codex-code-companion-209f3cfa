export type SubmissionBlocker = {
  key?: string | null;
  label?: string | null;
  message?: string | null;
  route_hint?: string | null;
};

export type SubmissionSummary = {
  total?: number | null;
  completed?: number | null;
  pending?: number | null;
  required?: number | null;
  accepted?: number | null;
  requested?: number | null;
  uploaded?: number | null;
  reviewed?: number | null;
  missing?: number | null;
  [key: string]: unknown;
};

export type SubmittedApplication = {
  public_reference?: string | null;
  status?: string | null;
  submitted_at?: string | null;
  completion_percent?: number | null;
  current_step?: string | null;
};

export type SubmissionReadinessResponse = {
  ok?: boolean;
  application_public_reference?: string | null;
  ready?: boolean | null;
  status?: string | null;
  blockers?: SubmissionBlocker[] | null;
  sections_summary?: SubmissionSummary | null;
  consent_summary?: SubmissionSummary | null;
  document_summary?: SubmissionSummary | null;
  next_step?: string | null;
  message?: string | null;
};

export type SubmissionResponse = {
  ok?: boolean;
  submitted?: boolean | null;
  application?: SubmittedApplication | null;
  next_step?: string | null;
  message?: string | null;
  readiness?: SubmissionReadinessResponse | null;
  blockers?: SubmissionBlocker[] | null;
};

const SUBMISSION_STORAGE_KEY = "approvu:borrower-application-submission";

export function storeBorrowerApplicationSubmission(
  result: SubmissionReadinessResponse | SubmissionResponse,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SUBMISSION_STORAGE_KEY,
    JSON.stringify({
      result,
      stored_at: new Date().toISOString(),
    }),
  );
}

import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

async function parseJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    throw new Error(firstError ?? body.message ?? fallbackMessage);
  }

  return body;
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
