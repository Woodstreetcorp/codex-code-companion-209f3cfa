export type BorrowerUser = {
  name: string;
  email: string;
};

export type BorrowerSessionResult = {
  ok: boolean;
  status?: string;
  authenticated?: boolean;
  user?: BorrowerUser;
  latest_qualification?: {
    public_reference?: string | null;
    snapshot_public_reference?: string | null;
  } | null;
  next_step?: string;
};

export type BorrowerLoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

const BORROWER_SESSION_STORAGE_KEY = "approvu:borrower-session";

async function parseResponse(response: Response, fallback: string): Promise<BorrowerSessionResult> {
  const body = (await response.json().catch(() => ({}))) as BorrowerSessionResult & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    throw new Error(firstError ?? body.message ?? fallback);
  }

  return body;
}

export async function loginBorrower(payload: BorrowerLoginPayload): Promise<BorrowerSessionResult> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse(response, "We could not sign you in. Please check your email and password.");
}

export async function getBorrowerSession(): Promise<BorrowerSessionResult> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/me"));

  return parseResponse(response, "Your borrower session could not be loaded.");
}

export async function logoutBorrower(): Promise<BorrowerSessionResult> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/logout"), {
    method: "POST",
  });

  return parseResponse(response, "We could not sign you out right now.");
}

export function storeBorrowerSession(result: BorrowerSessionResult): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    BORROWER_SESSION_STORAGE_KEY,
    JSON.stringify({
      authenticated: result.authenticated ?? result.status === "authenticated",
      user: result.user,
      latest_qualification: result.latest_qualification,
      next_step: result.next_step,
      stored_at: new Date().toISOString(),
    }),
  );
}

export function clearBorrowerSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(BORROWER_SESSION_STORAGE_KEY);
}
