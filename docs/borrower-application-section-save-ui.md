# Borrower Application Section Save UI

**Branch:** `codex/borrower-application-section-ui`
**PR:** 15C — Connect Application Workspace Sections to Save APIs
**Date:** 2026-05-16
**Type:** Frontend — no backend changes

**Related backend PR:** Laravel V2 PR 15B — Borrower Application Section Save APIs

---

## Purpose

PR 15B added backend APIs to persist borrower application section data:
- `GET /v2/borrower/application/sections` — list all 5 sections
- `GET /v2/borrower/application/sections/{sectionKey}` — get single section
- `PATCH /v2/borrower/application/sections/{sectionKey}` — save section data

PR 15C connects the existing Lovable frontend pages to those APIs. The Application
Workspace now shows real backend section statuses. Two section forms (Property and
Assets & Down Payment) now save their data to the backend on Save Draft, Mark
Complete, and Save & Continue actions.

---

## Routes / Pages Connected

| Page | File | Backend Section Key | Action |
|------|------|--------------------|----|
| Application Workspace | `portal.application.tsx` | All 5 (list) | Loads and shows real section statuses |
| Target Property Preferences | `applications.$applicationId.property-financing.target-property.tsx` | `property` | Save Draft / Mark Complete / Save & Continue |
| Down Payment & Financing | `applications.$applicationId.property-financing.down-payment.tsx` | `assets_down_payment` | Save Draft / Mark Complete / Save & Continue |

---

## Backend Endpoints Used

| Method | Endpoint | Used by |
|--------|----------|---------|
| `GET` | `/v2/borrower/application/sections` | Application Workspace (on load) |
| `PATCH` | `/v2/borrower/application/sections/property` | Target Property page |
| `PATCH` | `/v2/borrower/application/sections/assets_down_payment` | Down Payment page |

All requests use `credentials: "include"` (Laravel web-session cookie auth) and the
shared `fetchWithLaravelSession` CSRF helper from `laravelSession.ts`.

---

## API Adapter

**File:** `src/lib/api/borrowerApplicationSectionsApi.ts`

### Exported functions

| Function | HTTP | Purpose |
|----------|------|---------|
| `listBorrowerApplicationSections()` | `GET /v2/borrower/application/sections` | Load all section statuses |
| `getBorrowerApplicationSection(key)` | `GET /v2/borrower/application/sections/{key}` | Load single section data |
| `saveBorrowerApplicationSection(key, payload)` | `PATCH /v2/borrower/application/sections/{key}` | Save section |
| `ensureBorrowerApplication()` | `POST /v2/borrower/application` | Get-or-create application |
| `storeBorrowerApplicationSections(result)` | — | Write summary to sessionStorage |
| `getStoredSectionsSummary()` | — | Read cached summary from sessionStorage |

### Exported constants / types

| Export | Purpose |
|--------|---------|
| `ALL_SECTION_KEYS` | Ordered list of 5 section keys |
| `SECTION_LABELS` | Human-readable label per key |
| `ApplicationSectionKey` | Union type of 5 allowed keys |
| `ApplicationSectionStatus` | Union type of 4 statuses |
| `SaveSectionPayload` | Shape of PATCH body |

---

## Section Key Mapping

| Backend key | Label | Frontend route |
|------------|-------|----------------|
| `borrower_profile` | Borrower Profile | `/portal/settings/profile` (closest existing) |
| `property` | Property | `/applications/current/property-financing/target-property` |
| `income` | Income | `/applications/current/property-financing/purchase-plan` |
| `assets_down_payment` | Assets & Down Payment | `/applications/current/property-financing/down-payment` |
| `liabilities` | Liabilities | `/applications/current/mortgage-request` |

`applications/current` is a URL placeholder — the backend resolves the real
application from the authenticated session cookie, not from the URL param.

---

## Save Payload Shape

```typescript
{
  data: Record<string, unknown>,  // Required — free-form section data
  status?: "in_progress" | "complete" | "needs_attention",
  current_step?: string
}
```

### Property section (`property`) — fields sent in `data`

```json
{
  "locations": [{ "city": "Toronto", "province": "ON", "priority": "1" }],
  "property_types": ["Detached"],
  "property_usage": "primary",
  "target_purchase_price": 750000,
  "expected_down_payment": 75000,
  "max_monthly_payment": 3500,
  "considering_new_build": "no",
  "considering_condo": "no",
  "estimated_condo_fee": null
}
```

### Assets & Down Payment section (`assets_down_payment`) — fields sent in `data`

```json
{
  "total_down_payment": 83000,
  "property_value": 832000,
  "down_payment_percent": 9.98,
  "requested_mortgage": 749000,
  "source_types": ["Personal savings / investments / RRSP / FHSA"],
  "sources": [
    {
      "id": "s-1234",
      "type": "Personal savings / investments / RRSP / FHSA",
      "amount": "83000",
      "borrower": "primary",
      "notes": "",
      "extra": { "accountType": "RRSP", "fi": "TD Bank", "held90": "yes" }
    }
  ]
}
```

---

## Status Mapping

| Trigger | `status` sent |
|---------|--------------|
| "Save Draft" button click | `in_progress` |
| "Mark Complete" button click | `complete` |
| "Save & Continue" button click | `in_progress` (+ navigate) |

---

## `current_step` Behaviour

- `property` page sends `current_step: "property"` on every save.
- `assets_down_payment` page sends `current_step: "assets_down_payment"` on every save.
- The backend stores this on `mortgage_applications.current_step`, which the
  workspace uses to restore the borrower's position after a session break.

---

## Application Workspace — Section Status Display

The Application Workspace (`/portal/application`) now:

1. Fetches `GET /v2/borrower/application/sections` in parallel with the existing
   application summary API call.
2. Renders a **5-card "Application sections" grid** with real backend statuses.
3. Each card is a clickable `<Link>` to the relevant section page.
4. The card shows "Start" for `not_started`, "Continue" for anything else.
5. Shows `last_saved_at` timestamp when available.
6. Shows a "X / 5 complete" counter using `sections_summary.completed_sections`.
7. If the sections fetch fails (e.g., no application exists yet), it fails silently —
   the workspace still loads using the application summary data.
8. The progress bar uses backend `completion_percent` (from sections count × 20%)
   when available, falling back to the summary API's value.

---

## What Fields Are Saved as JSON

Fields are intentionally **not validated field-by-field** at this PR stage. The
backend accepts any valid JSON object up to 64 KB. Field-specific validation
(e.g., purchase price must be > 0, down payment % must meet lender minimums) is
deferred to later section-specific PRs.

Currently saved:
- **Property**: locations array, property types, usage, price, down payment, monthly
  payment cap, new build / condo preferences
- **Assets & Down Payment**: total DP amount, property value, source types, source
  detail rows (amounts, types, account types, institution, extra fields)

---

## Validation Intentionally Deferred

| Validation | Reason deferred |
|-----------|-----------------|
| Purchase price format / range | Lender minimums not yet confirmed |
| Down payment % compliance (5%, 20% thresholds) | Will be surfaced during snapshot/submission |
| Income source cross-validation | Requires normalised income table (future PR) |
| GDS/TDS ratio checks | Requires income + liabilities data together |
| Province-specific rules | Not yet confirmed for early launch |

---

## Save State UX

Both connected section pages now show:

- **`saveStatus`** prop on `PageHeader`: `"saved"` / `"unsaved"` / `"saving"` →
  renders "All changes saved" / "Unsaved changes" / "Saving…" in the header
- **Error banner** below PageHeader when save fails — shows the API error message
  with a coral background
- Save Draft → calls API with `status: 'in_progress'`, updates `saveStatus` on success
- Mark Complete → calls API with `status: 'complete'`, updates `saveStatus` on success
- Save & Continue → calls API with `status: 'in_progress'`, then navigates on success

---

## Manual QA Steps

```
1. Sign in as a borrower who has completed a qualification
2. Navigate to /portal/application (Application Workspace)
3. Confirm the 5-section grid renders with "Not Started" badges
4. Click "Property" section card → navigates to target-property form
5. Fill in at least one location (city + province) and one property type
6. Click "Save Draft" → header shows "All changes saved"; check browser DevTools
   Network tab for PATCH /v2/borrower/application/sections/property returning 200
7. Return to /portal/application → Property card should show "In Progress"
8. Return to property page → click "Mark Complete"
   → Property card on workspace shows "Complete", completion_percent jumps to 20%
9. Navigate to /applications/current/property-financing/down-payment
10. Enter a total down payment and one source → click "Save Draft"
    → PATCH /v2/borrower/application/sections/assets_down_payment returns 200
11. Return to workspace → "Assets & Down Payment" shows "In Progress", percent = 20%
12. Mark Down Payment complete → percent = 40%
13. Confirm that signing out and back in still shows saved statuses
    (data is in the backend, not just localStorage)
```

---

## Deferred

| Item | Reason | Target |
|------|--------|--------|
| Borrower Profile section save | No dedicated borrower profile form exists yet | Future PR |
| Income section save | No income form exists outside mortgage-request (complex) | Future PR |
| Liabilities section save | No liabilities form exists yet | Future PR |
| Pre-fill section forms from qualification data | Frontend can read from summary endpoint | Future PR |
| Field-specific validation per section | Field requirements not locked | Post-soft-launch |
| Section data restore on form load | Requires GET section + state hydration on mount | Future PR |
| `applicationId` resolved from backend instead of URL | Backend is session-based; URL param is cosmetic | Future PR |
| Co-borrower sections | Multi-borrower UI not designed | PR 16A |
| Consent capture | Separate concern | PR 15D (backend) |
| Application submission | Separate concern | PR 15E (backend) |
| Frontend toast notifications (vs. error banner) | Nice-to-have polish | Post-soft-launch |
| Offline / retry on save failure | Not needed for soft launch | Post-soft-launch |
