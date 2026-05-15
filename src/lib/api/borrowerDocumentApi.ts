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

/** Summary of the document that fulfilled a document request. */
export type FulfilledDocumentSummary = {
  id?: number | null;
  document_type?: string | null;
  original_filename?: string | null;
  status?: string | null;
  uploaded_at?: string | null;
};

/**
 * A document request created by an admin on behalf of a lead/session.
 * All fields are nullable — do not assume presence.
 *
 * Statuses: requested | uploaded | reviewed | rejected | waived
 */
export type BorrowerDocumentRequest = {
  public_reference?: string | null;
  document_type?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  required?: boolean | null;
  qualification_public_reference?: string | null;
  requested_at?: string | null;
  due_at?: string | null;
  fulfilled_at?: string | null;
  notes?: string | null;
  fulfilled_document?: FulfilledDocumentSummary | null;
};

export type UploadDocumentPayload = {
  file: File;
  document_type: string;
  qualification_public_reference?: string | null;
  /** When supplied, links this upload to a specific document request. */
  document_request_public_reference?: string | null;
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

export type ListDocumentRequestsResult = {
  ok?: boolean;
  count?: number;
  requests?: BorrowerDocumentRequest[];
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

async function parseListRequestsResponse(response: Response): Promise<ListDocumentRequestsResult> {
  const body = (await response.json().catch(() => ({}))) as ListDocumentRequestsResult & {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    throw new Error(firstError ?? body.message ?? "Your document requests could not be loaded.");
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
 * List document requests (checklist) for the authenticated borrower.
 *
 * GET /v2/borrower/document-requests
 */
export async function listBorrowerDocumentRequests(): Promise<ListDocumentRequestsResult> {
  const response = await fetch(endpoint("/v2/borrower/document-requests"), {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  return parseListRequestsResponse(response);
}

/**
 * Upload a document for the authenticated borrower.
 * Sends a multipart/form-data POST — do NOT set Content-Type manually.
 *
 * POST /v2/borrower/documents
 *
 * When document_request_public_reference is supplied, the backend will
 * link this upload to the matching document request and mark it fulfilled.
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
  if (payload.document_request_public_reference) {
    form.append("document_request_public_reference", payload.document_request_public_reference);
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
