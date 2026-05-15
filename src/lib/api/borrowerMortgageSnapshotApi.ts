export type BorrowerMortgageSnapshot = {
  ok: true;
  public_reference: string;
  transaction_type?: "purchase" | "refinance" | "pre_purchase" | string;
  borrower_name?: string | null;
  city?: string | null;
  province?: string | null;
  property_value?: number | null;
  target_property_value?: number | null;
  mortgage_amount?: number | null;
  down_payment?: number | null;
  income?: number | null;
  credit_score_range?: string | null;
  property_usage?: string | null;
  preliminary_lending_path?: "prime" | "alternative" | "manual_review" | string;
  readiness_status?: "ready_to_review" | "needs_more_information" | "not_enough_data" | string;
  missing_items?: string[];
  key_insights?: string[];
  next_step?: string | null;
  generated_at?: string | null;
  disclaimer?: string | null;
};

type GenerateMortgageSnapshotInput = {
  qualification_session_token?: string;
  public_reference?: string;
};

const SNAPSHOT_HANDOFF_STORAGE_KEY = "approvu:mortgage-snapshot";

function apiBaseUrl(): string {
  return (import.meta.env.VITE_APPROVU_API_BASE_URL ?? "").replace(/\/+$/, "");
}

function endpoint(path: string): string {
  const base = apiBaseUrl();
  return `${base}${path}`;
}

function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
}

async function parseSnapshotResponse(response: Response): Promise<BorrowerMortgageSnapshot> {
  if (!response.ok) {
    let message = "We could not prepare your Mortgage Snapshot right now.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Keep the friendly default.
    }
    throw new Error(message);
  }

  return (await response.json()) as BorrowerMortgageSnapshot;
}

export async function generateMortgageSnapshot(
  payload: GenerateMortgageSnapshotInput,
): Promise<BorrowerMortgageSnapshot> {
  const csrf = csrfToken();
  const response = await fetch(endpoint("/v2/borrower/qualification/snapshot"), {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
    },
    body: JSON.stringify(payload),
  });

  return parseSnapshotResponse(response);
}

export async function getMortgageSnapshot(
  publicReference: string,
): Promise<BorrowerMortgageSnapshot> {
  const response = await fetch(
    endpoint(`/v2/borrower/qualification/snapshot/${encodeURIComponent(publicReference)}`),
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  return parseSnapshotResponse(response);
}

export function storeMortgageSnapshotHandoff(snapshot: BorrowerMortgageSnapshot): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SNAPSHOT_HANDOFF_STORAGE_KEY,
    JSON.stringify({
      public_reference: snapshot.public_reference,
      next_step: snapshot.next_step,
      readiness_status: snapshot.readiness_status,
      stored_at: new Date().toISOString(),
    }),
  );
}
