export type BorrowerAccountHandoffPayload = {
  qualification_session_token?: string;
  public_reference?: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  consent_to_create_account: boolean;
};

export type BorrowerAccountHandoffResult = {
  ok: boolean;
  status: "account_created" | "existing_user_login_required" | string;
  public_reference?: string;
  next_step?: string;
  message?: string;
};

const ACCOUNT_HANDOFF_STORAGE_KEY = "approvu:account-handoff";
const QUALIFICATION_HANDOFF_STORAGE_KEY = "approvu:qualification-session";

function apiBaseUrl(): string {
  return (import.meta.env.VITE_APPROVU_API_BASE_URL ?? "").replace(/\/+$/, "");
}

function endpoint(path: string): string {
  return `${apiBaseUrl()}${path}`;
}

function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
}

function readQualificationHandoff(): {
  qualification_session_token?: string;
  public_reference?: string;
} | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(QUALIFICATION_HANDOFF_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as { qualification_session_token?: string; public_reference?: string };
  } catch {
    return null;
  }
}

export function getSavedQualificationReference(): {
  qualification_session_token?: string;
  public_reference?: string;
} | null {
  return readQualificationHandoff();
}

export async function createBorrowerAccountHandoff(
  payload: BorrowerAccountHandoffPayload,
): Promise<BorrowerAccountHandoffResult> {
  const csrf = csrfToken();
  const response = await fetch(endpoint("/v2/borrower/account-handoff"), {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as BorrowerAccountHandoffResult & {
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    throw new Error(firstError ?? body.message ?? "We could not create your account.");
  }

  return body;
}

export function storeAccountHandoffResult(result: BorrowerAccountHandoffResult): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    ACCOUNT_HANDOFF_STORAGE_KEY,
    JSON.stringify({
      ok: result.ok,
      status: result.status,
      public_reference: result.public_reference,
      next_step: result.next_step,
      stored_at: new Date().toISOString(),
    }),
  );
}
