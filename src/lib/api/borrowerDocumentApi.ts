// ─── Types ────────────────────────────────────────────────────────────────────

export type BorrowerDocument = {
  id?: number | null;
  document_type?: string | null;
  original_filename?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  status?: string | null;
  notes?: string | null;
  qualification_public_reference?: string | null;
  uploaded_at?: string | null;
};

export type UploadDocumentPayload = {
  file: File;
  document_type: string;
  qualification_public_reference?: string | null;
  notes?: string | null;
};

export type ListDocumentsResult = {
  ok?: boolean;
  count?: number;
  documents?: BorrowerDocument[];
};

export type UploadDocumentResult = {
  ok?: boolean;
  status?: string;
  document?: BorrowerDocument;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apiBaseUrl(): string {
  return (import.meta.env.VITE_APPROVU_API_BASE_URL ?? "").replace(/\/+$/, "");
}

function endpoint(path: string): string {
  return `${apiBaseUrl()}${path}`;
}

/**
 * Read the Laravel CSRF token from the page meta tag, if present.
 * Laravel web-session auth requires this on state-changing requests.
 */
function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
}

async function parseListResponse(response: Response): Promise<ListDocumentsResult> {
  const body = (await response.json().catch(() => ({}))) as ListDocumentsResult & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    throw new Error(firstError ?? body.message ?? "Your documents could not be loaded.");
  }

  return body;
}

async function parseUploadResponse(response: Response): Promise<UploadDocumentResult> {
  const body = (await response.json().catch(() => ({}))) as UploadDocumentResult & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    throw new Error(
      firstError ??
        body.message ??
        "We could not upload this document. Please check the file type and size, then try again.",
    );
  }

  return body;
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * List uploaded documents for the authenticated borrower.
 * Optionally filter by document_type.
 *
 * GET /v2/borrower/documents
 */
export async function listBorrowerDocuments(filters?: {
  document_type?: string;
}): Promise<ListDocumentsResult> {
  const params = new URLSearchParams();
  if (filters?.document_type) {
    params.set("document_type", filters.document_type);
  }

  const url = endpoint("/v2/borrower/documents") + (params.size > 0 ? `?${params.toString()}` : "");

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  return parseListResponse(response);
}

/**
 * Upload a document for the authenticated borrower.
 * Sends a multipart/form-data POST — do NOT set Content-Type manually.
 *
 * POST /v2/borrower/documents
 */
export async function uploadBorrowerDocument(
  payload: UploadDocumentPayload,
): Promise<UploadDocumentResult> {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("document_type", payload.document_type);

  if (payload.qualification_public_reference) {
    form.append("qualification_public_reference", payload.qualification_public_reference);
  }
  if (payload.notes) {
    form.append("notes", payload.notes);
  }

  const csrf = csrfToken();

  const response = await fetch(endpoint("/v2/borrower/documents"), {
    method: "POST",
    credentials: "include",
    // Content-Type is intentionally omitted — browser sets it with the correct boundary
    headers: {
      Accept: "application/json",
      ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
    },
    body: form,
  });

  return parseUploadResponse(response);
}
