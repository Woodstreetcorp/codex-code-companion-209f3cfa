# Borrower Document Upload UI

**Branch:** `codex/borrower-document-upload-ui`  
**Route:** `/portal/documents` → "My Uploads" tab (default tab)  
**Backend depends on:** PR 7A (Laravel V2 document upload API)

---

## UI location

The document upload UI lives inside the existing **Document Vault** at `/portal/documents`.  
It is the first sub-tab: **My Uploads** (shown by default when the page loads).

The portal overview page (`/portal`) also links to the Document Vault via the Documents card.

---

## Backend endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/v2/borrower/documents` | Upload a new document |
| `GET` | `/v2/borrower/documents` | List documents for the authenticated borrower |

Both requests use `credentials: "include"` to send the Laravel web session cookie.

---

## FormData payload (upload)

The upload request is sent as `multipart/form-data`. Do **not** set `Content-Type` manually — the browser sets the correct boundary.

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | `File` | ✅ | PDF, JPG, JPEG, PNG · max 10 MB |
| `document_type` | `string` | ✅ | Must match backend allowlist (see below) |
| `qualification_public_reference` | `string` | ❌ | Read from sessionStorage; sent when available |
| `notes` | `string` | ❌ | Optional borrower notes |

---

## Document type values

These must match the backend `StoreBorrowerDocumentRequest::allowedDocumentTypes()` exactly:

| Value | Display label |
|---|---|
| `identification` | Identification |
| `proof_of_income` | Proof of Income |
| `employment_letter` | Employment Letter |
| `notice_of_assessment` | Notice of Assessment |
| `bank_statement` | Bank Statement |
| `property_tax_bill` | Property Tax Bill |
| `purchase_agreement` | Purchase Agreement |
| `other` | Other |

---

## Session / auth behavior

- Borrower must be authenticated via Laravel web session.
- All API calls include `credentials: "include"`.
- POST requests include `X-CSRF-TOKEN` from `meta[name="csrf-token"]` if present.
- Unauthenticated requests will receive `401` from the backend. The UI shows the error message returned by the API.

---

## `qualification_public_reference` behavior

When the borrower uploads a document, the UI automatically attaches the current qualification public reference if one is available.

**Source priority:**

1. `sessionStorage["approvu:borrower-portal-summary"]` → `latest_qualification.public_reference`

If no reference is found, upload proceeds without it — the backend does not require it.

The backend stores the reference for correlation only; it is never used as a security gate.

---

## Status display

| Backend status | Displayed as | Colour |
|---|---|---|
| `uploaded` | Uploaded | Blue (secondary) |
| `reviewed` | Reviewed | Green (mint) |
| `rejected` | Needs attention | Red (coral) |
| Any other | Raw value | Neutral (muted) |

---

## API adapter

`src/lib/api/borrowerDocumentApi.ts` exports:

- `listBorrowerDocuments(filters?)` — GET list, optional `document_type` filter
- `uploadBorrowerDocument(payload)` — POST with FormData

---

## UX copy

| State | Copy |
|---|---|
| Upload in progress | "Uploading your document…" |
| List loading | "Loading your documents…" |
| Upload success | "Document uploaded successfully." |
| Upload error | API error message, or fallback: "We could not upload this document. Please check the file type and size, then try again." |

---

## Frontend validation

The following are blocked client-side before the API call:

- Missing file → "Please select a file."
- Missing document type → "Please select a document type."
- Unsupported extension (not pdf/jpg/jpeg/png) → "Only PDF, JPG, JPEG, and PNG files are accepted."
- File exceeds 10 MB → "File must not exceed 10 MB."

The backend remains the source of truth and will reject invalid requests regardless.

---

## Manual QA steps

1. Log in as a borrower at `/login`
2. Navigate to `/portal/documents` — the **My Uploads** tab should be selected by default
3. Click **Choose file** and select a valid PDF (< 10 MB)
4. Select a document type from the dropdown
5. Click **Upload document** — expect "Document uploaded successfully." and the list to refresh
6. Verify the uploaded document appears in the list with status "Uploaded"
7. Try uploading a `.docx` file — expect frontend validation error before any API call
8. Try uploading a file > 10 MB — expect frontend validation error
9. Try submitting without selecting a file — expect "Please select a file."
10. Try submitting without a document type — expect "Please select a document type."
11. Click **Refresh** while logged in — expect list to reload
12. Sign out and visit `/v2/borrower/documents` directly — expect `401`
13. Navigate back to `/portal` — expect the Documents card shows "Go to Document Vault" link
14. Verify the Document Vault other tabs (All Documents, Lender Requests, etc.) still work normally

---

## Changed files summary

| File | Change |
|---|---|
| `src/lib/api/borrowerDocumentApi.ts` | New API adapter (list + upload) |
| `src/routes/portal.documents.tsx` | Added "My Uploads" tab with `UploadsView` component |
| `src/routes/portal.index.tsx` | Documents PlaceholderCard now links to `/portal/documents` |
| `docs/borrower-document-upload-ui.md` | This document |

---

## Deferred functionality

- Document request templates (advisor requests specific docs from borrower)
- Admin review comments shown to borrower
- Reject/re-request workflow UI (borrower sees rejection reason, can re-upload)
- Co-applicant / co-borrower documents
- Virus / malware scanning
- OCR / data extraction
- Zoho WorkDrive integration
- Document conditions engine
- Bulk upload
- Download / preview of uploaded documents (no presigned URL yet)
- Full application workflow
- E-sign inbox (mock UI exists, not wired to API)
- Bank & payroll connections (mock UI exists, not wired)
