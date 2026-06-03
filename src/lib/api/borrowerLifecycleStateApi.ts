/**
 * borrowerLifecycleStateApi.ts — borrower lifecycle / active-application state.
 *
 * Loads the borrower's current lifecycle snapshot (active application, offer
 * state, and the next best action) from the Laravel backend using the shared
 * web-session auth wrapper. Mirrors the other borrower API adapters.
 */

import { buildApiUrl, fetchWithLaravelSession } from "./laravelSession";

export type LifecycleActiveApplication = {
  public_reference?: string | null;
  next_step?: string | null;
  stage?: string | null;
  status?: string | null;
  state?: string | null;
  offer_selection_required?: boolean | null;
};

export type LifecycleOfferState = {
  status?: string | null;
  requires_offer_selection?: boolean | null;
};

export type LifecycleNextBestAction = {
  message?: string | null;
  label?: string | null;
  route_hint?: string | null;
};

export type BorrowerLifecycleState = {
  ok?: boolean;
  authenticated?: boolean;
  active_application?: LifecycleActiveApplication | null;
  offer_state?: LifecycleOfferState | null;
  next_best_action?: LifecycleNextBestAction | null;
};

const BORROWER_LIFECYCLE_STORAGE_KEY = "approvu:borrower-lifecycle-state";

/**
 * Thrown when the lifecycle endpoint reports the borrower is unauthenticated
 * (401 / 419). Callers use isLifecycleAuthenticatedError() to decide whether
 * the failure should bubble up (sign-in required) or be treated as a soft,
 * non-fatal miss.
 */
export class LifecycleAuthenticationError extends Error {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message);
    this.name = "LifecycleAuthenticationError";
  }
}

export function isLifecycleAuthenticatedError(error: unknown): boolean {
  return error instanceof LifecycleAuthenticationError;
}

async function parseResponse(response: Response): Promise<BorrowerLifecycleState> {
  const body = (await response.json().catch(() => ({}))) as BorrowerLifecycleState & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (response.status === 401 || response.status === 419 || body.authenticated === false) {
    throw new LifecycleAuthenticationError(
      (body as { message?: string }).message ??
        "Your session has expired. Please sign in again.",
    );
  }

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    throw new Error(
      firstError ??
        (body as { message?: string }).message ??
        "Your application state could not be loaded.",
    );
  }

  return body;
}

export async function getBorrowerLifecycleState(): Promise<BorrowerLifecycleState> {
  const response = await fetchWithLaravelSession(buildApiUrl("/v2/borrower/lifecycle-state"));

  return parseResponse(response);
}

export function storeBorrowerLifecycleState(result: BorrowerLifecycleState): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    BORROWER_LIFECYCLE_STORAGE_KEY,
    JSON.stringify({
      active_application: result.active_application,
      offer_state: result.offer_state,
      stored_at: new Date().toISOString(),
    }),
  );
}

/**
 * Formats a raw lifecycle stage/status token into a human-friendly label,
 * e.g. "tailored_review" -> "Tailored review".
 */
export function formatLifecycleStatus(status?: string | null): string {
  if (!status) return "In progress";
  const cleaned = status.replace(/[_-]+/g, " ").trim();
  if (!cleaned) return "In progress";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Returns a safe, non-empty message string, falling back to a default when the
 * backend value is missing or blank.
 */
export function safeLifecycleMessage(
  message?: string | null,
  fallback = "We'll let you know your next step shortly.",
): string {
  const trimmed = message?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}
