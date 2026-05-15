# Borrower Document Vault Polish

**Branch:** `codex/borrower-document-vault-polish`  
**File:** `src/routes/portal.documents.tsx`  
**PR scope:** UX polish to the Document Vault's Lender Requests (Document Checklist) tab and the My Uploads tab status labels.

---

## What changed

### 1. My Uploads tab — `DocumentStatusPill`

Borrower-friendlier status labels replacing internal API terminology:

| API status | Before | After |
|---|---|---|
| `uploaded` | "Uploaded" | "Under Review" |
| `reviewed` | "Reviewed" | "Reviewed" *(unchanged)* |
| `rejected` | "Needs attention" | "Needs Attention" *(capitalised)* |

---

### 2. Lender Requests tab — `DocumentRequestStatusPill`

Borrower-friendly labels replacing technical API terms:

| API status | Before | After |
|---|---|---|
| `requested` | "Requested" | "Needs Action" |
| `uploaded` | "Uploaded" | "Waiting for Review" |
| `reviewed` | "Reviewed" | "Complete" |
| `rejected` | "Needs attention" | "Needs Attention" |
| `waived` | "Waived" | "Not Required" |

---

### 3. `REQUEST_STATUS_CONFIG` constant

A module-level map keyed by API status that provides:
- `label` — human-readable status name
- `message` — per-status contextual explanation shown to the borrower below the document title
- `pillTone` — Tailwind classes for the status pill (kept in sync with `DocumentRequestStatusPill`)

```ts
const REQUEST_STATUS_CONFIG: Record<string, { label: string; message: string; pillTone: string }> = {
  requested: { ... },
  rejected:  { ... },
  uploaded:  { ... },
  reviewed:  { ... },
  waived:    { ... },
};
```

---

### 4. `fulfilledDocStatusLabel()` helper

Maps a fulfilled document's own `status` field to a borrower-readable string for display in the fulfilled-document summary box on each request card.

```ts
function fulfilledDocStatusLabel(status?: string | null): string
```

---

### 5. `RequestedDocumentsView` — grouped sections & card polish

**Grouping:** requests are split into four ordered sections rather than a flat list:

| Section | API statuses | Tone |
|---|---|---|
| Needs Action | `requested` | yellow |
| Needs Attention | `rejected` | coral |
| Waiting for Review | `uploaded` | secondary/blue |
| Complete | `reviewed`, `waived` | muted |

**Per-card improvements:**

- **Contextual message** — the `message` from `REQUEST_STATUS_CONFIG` is shown below the document title on every card, giving the borrower plain-language guidance.
- **Fulfilled document summary** — shows filename, upload date, and the fulfilled document's own status (via `fulfilledDocStatusLabel`). Rejected cards use a coral-tinted box with an `AlertCircle` icon; others use a green-tinted box with `CheckCircle2`.
- **Rejected "Re-upload" button** — coral-tinted `ring-1 ring-inset ring-coral/30` styling rather than the standard primary button. The label changes from "Upload" to "Re-upload".
- **Rejection warning banner** — when the upload form is open for a rejected request, a coral banner appears above the file picker reminding the borrower the previous upload was not accepted.
- **Accepted formats note** — `PDF, JPG, JPEG, or PNG · max 10 MB` displayed below the file picker in the inline upload form.
- **Upload success message** — updated to: "Document uploaded for this request. Our team will review it shortly."
- **Empty state** — updated to: "When our team needs documents from you, they will appear here."
- **Complete section dimmed** — `opacity-75` on completed/waived request cards.

**Internal components (function-scoped):**

- `RequestCard` — renders a single request card with all the above logic.
- `SectionHeading` — small section label with count badge.

---

## Files changed

| File | Type |
|---|---|
| `src/routes/portal.documents.tsx` | Modified |
| `docs/borrower-document-vault-polish.md` | New (this file) |

---

## API fields used

All data is sourced from `BorrowerDocumentRequest` (from `@/lib/api/borrowerDocumentApi`). No new API fields were required. The fulfilled document's `status` field was already present but unused before this change.

Safe fields rendered:
- `public_reference`, `title`, `document_type`, `description`, `status`, `required`
- `due_at`, `requested_at`, `qualification_public_reference`
- `fulfilled_document.original_filename`, `fulfilled_document.uploaded_at`, `fulfilled_document.status`

Storage fields (`stored_path`, `stored_filename`, `disk`) are never rendered.
