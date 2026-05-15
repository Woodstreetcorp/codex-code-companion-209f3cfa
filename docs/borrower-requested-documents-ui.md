# Borrower Requested Documents UI

**Branch:** `codex/borrower-requested-documents-ui`
**Route:** `/portal/documents` → "Lender Requests" tab (wired to real backend)
**Backend depends on:** PR 8A (Laravel V2 document request / checklist foundation)

---

## UI location

The requested documents checklist lives inside the existing **Document Vault** at `/portal/documents`.

The **Lender Requests** tab (previously Lovable mock data) is now wired to the real
`GET /v2/borrower/document-requests` endpoint and renders the borrower's live checklist.

All other tabs remain intact:
- **My Uploads** — real upload/list API (PR 7C)
- **All Documents** — Lovable mock vault
- **E-Sign Inbox** — Lovable mock
- **Bank & Payroll** — Lovable mock
- **Expiring Soon** — derived from Lovable mock vault
- **Sharing Log** — Lovable mock

---

## Backend endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/v2/borrower/document-requests` | List document requests for authenticated borrower |
| `POST` | `/v2/borrower/documents` | Upload a document (optionally linked to a request) |

Both use `credentials: "include"` for Laravel web-session auth.

---

## Document request response shape

```json
{
  "ok": true,
  "count": 2,
  "requests": [
    {
      "public_reference": "DR-ABCDEFGHIJ",
      "document_type": "bank_statement",
      "title": "Please upload your last 3 bank statements",
      "description": null,
      "status": "requested",
      "required": true,
      "qualification_public_reference": "QS-XXXX",
      "requested_at": "2026-05-15T20:00:00+00:00",
      "due_at": null,
      "fulfilled_at": null,
      "notes": null,
      "fulfilled_document": null
    }
  ]
}
```

All fields are treated as nullable. The UI does not assume any field is present.

When a request is fulfilled, `fulfilled_document` contains:
```json
{
  "id": 42,
  "document_type": "bank_statement",
  "original_filename": "bank-statement.pdf",
  "status": "uploaded",
  "uploaded_at": "2026-05-15T21:00:00+00:00"
}
```

---

## Upload-to-request FormData payload

When the borrower uploads a file against a specific request:

```
POST /v2/borrower/documents
Content-Type: multipart/form-data (browser-set boundary)
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | `File` | ✅ | PDF, JPG, JPEG, PNG · max 10 MB |
| `document_type` | `string` | ✅ | Pre-filled from request; must match backend allowlist |
| `document_request_public_reference` | `string` | ✅ | `public_reference` of the matching request |
| `qualification_public_reference` | `string` | ❌ | From request or sessionStorage fallback |
| `notes` | `string` | ❌ | Optional borrower notes |

Do **not** set `Content-Type` manually — the browser adds the correct multipart boundary.

---

## Document request statuses

| Backend status | Displayed as | Visual tone |
|---|---|---|
| `requested` | Requested | Yellow — needs action |
| `uploaded` | Uploaded | Blue (secondary) — waiting for review |
| `reviewed` | Reviewed | Green (mint) — complete |
| `rejected` | Needs attention | Red (coral) — upload again |
| `waived` | Waived | Muted — not required |

Cards with `requested` or `rejected` status show an inline **Upload** action.
Cards with `reviewed` or `waived` status are visually dimmed (opacity-75).

---

## Session / auth behavior

- Borrower must be authenticated via Laravel web session.
- All API calls use `credentials: "include"`.
- POST requests include `X-CSRF-TOKEN` from `meta[name="csrf-token"]` if present.
- Unauthenticated requests receive `401`. The UI shows the API error message.

---

## `qualification_public_reference` behaviour on upload

When uploading against a request:

1. If the request itself has a `qualification_public_reference`, it is sent.
2. Otherwise, `sessionStorage["approvu:borrower-portal-summary"]` → `latest_qualification.public_reference` is used as fallback.
3. If neither is present, the upload proceeds without it.

---

## API adapter

`src/lib/api/borrowerDocumentApi.ts` exports:

| Export | Description |
|---|---|
| `listBorrowerDocuments(filters?)` | GET `/v2/borrower/documents` |
| `listBorrowerDocumentRequests()` | GET `/v2/borrower/document-requests` |
| `uploadBorrowerDocument(payload)` | POST `/v2/borrower/documents` as FormData |
| `BorrowerDocument` | Type for uploaded document |
| `BorrowerDocumentRequest` | Type for checklist request item |
| `FulfilledDocumentSummary` | Type for nested fulfilled doc summary |
| `UploadDocumentPayload` | Includes optional `document_request_public_reference` |
| `ListDocumentRequestsResult` | `{ ok, count, requests[] }` |

---

## UX copy

| State | Copy |
|---|---|
| Requests loading | "Loading your document requests…" |
| Upload in progress | "Uploading…" |
| Upload success | "Document uploaded for this request." |
| Upload error | API error message, or fallback: "We could not upload this document for the request. Please check the file and try again." |
| Empty checklist | "No document requests yet — Your advisor or lender has not requested any specific documents yet." |
| Error loading | "Could not load document requests" + server message + "Try again" link |

---

## Manual QA steps

1. Log in as a borrower at `/login`
2. Navigate to `/portal/documents`
3. Click the **Lender Requests** tab
4. With no backend requests: expect empty state "No document requests yet"
5. Create a document request via the admin API:
   ```
   POST /v2/admin/leads/{lead}/document-requests
   { "document_type": "bank_statement", "title": "3 months bank statements", "required": true }
   ```
   (requires the lead to have a linked session with the borrower's user_id)
6. Refresh the Lender Requests tab — request card should appear with status "Requested"
7. Click **Upload** on the card — upload form expands
8. Select a valid PDF (< 10 MB) and click **Upload document**
9. Expect success banner "Document uploaded for this request."
10. List refreshes — card status should show "Uploaded" and a fulfilled document summary
11. Try uploading `.docx` — expect frontend validation error
12. Try uploading without selecting a file — expect "Please select a file."
13. Switch to **My Uploads** tab — manually uploaded documents still appear correctly
14. Verify existing My Uploads upload form still works (no regression)
15. Verify other tabs (All Documents, E-Sign, Bank & Payroll, Expiring, Sharing Log) are unaffected
16. Sign out and visit `/v2/borrower/document-requests` directly — expect `401`

---

## Changed files

| File | Change |
|---|---|
| `src/lib/api/borrowerDocumentApi.ts` | Added `BorrowerDocumentRequest`, `FulfilledDocumentSummary`, `ListDocumentRequestsResult` types; added `listBorrowerDocumentRequests()`; updated `UploadDocumentPayload` + `uploadBorrowerDocument` for `document_request_public_reference` |
| `src/routes/portal.documents.tsx` | Imported new API types; added `validateUploadFile`, date helpers, `DocumentRequestStatusPill`, `RequestedDocumentsView`; wired "Lender Requests" tab to real backend |
| `docs/borrower-requested-documents-ui.md` | This document |

---

## Deferred functionality

- Admin review comments visible to borrower (rejection reason display)
- Reject/re-request explanation workflow (borrower sees why a document was rejected)
- Document preview / download via presigned URL
- Co-applicant / co-borrower documents
- Document request templates UI (advisor selects from a list of standard requests)
- Notification email to borrower when a new request is created
- Zoho WorkDrive integration
- Virus / malware scanning
- OCR / data extraction
- Conditions engine (linking requests to specific mortgage conditions)
- Bulk upload
- Full application workflow
- E-sign inbox (mock UI exists, not wired to API)
- Bank & payroll connections (mock UI exists, not wired)
- Download / preview of uploaded documents (no presigned URL yet)
- Borrower-visible requests for leads without a linked qualification session (user_id null)
