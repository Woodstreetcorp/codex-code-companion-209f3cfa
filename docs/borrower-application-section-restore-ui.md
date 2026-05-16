# Borrower Application Section Restore UI

**Branch:** `codex/borrower-application-section-restore-ui`
**PR:** 15E — Restore Saved Application Section Data into Forms
**Date:** 2026-05-16
**Type:** Frontend restore / prefill — no backend changes

**Related docs:**
- [`docs/borrower-application-section-save-ui.md`](./borrower-application-section-save-ui.md) — PR 15C (save wiring)
- Laravel V2 `docs/launch/borrower-application-section-prefill-restore-api.md` — PR 15D (backend prefill)

---

## Purpose

PR 15C wired the Property and Assets/Down Payment section pages to save data to the
backend. However, when a borrower navigated away and returned, the form showed empty
defaults — their saved data was not restored.

PR 15E adds restore-on-load to both section pages: on mount, each page calls
`GET /v2/borrower/application/sections/{sectionKey}` and populates form state from
`effective_data`. The same endpoint also returns qualification-derived `prefill_data`
so first-time visitors see suggested values based on their qualification flow.

---

## Backend Endpoints Used

| Endpoint | Method | Used for |
|----------|--------|----------|
| `GET /v2/borrower/application/sections/{sectionKey}` | GET | Restore / prefill on page load |
| `PATCH /v2/borrower/application/sections/{sectionKey}` | PATCH | Save section data (unchanged from PR 15C) |
| `POST /v2/borrower/application/sections/{sectionKey}/initialize` | POST | Available in adapter; not used for restore in this PR |

---

## data / prefill_data / effective_data

Every section response from the backend includes three data fields:

| Field | Contents |
|-------|----------|
| `data` | Data the borrower has explicitly saved via PATCH |
| `prefill_data` | Suggested values derived at request time from qualification responses, mortgage profile, and primary borrower record |
| `effective_data` | `data` when the borrower has saved; otherwise `prefill_data` |

**The frontend always reads from `effective_data`.** This means:
- First visit: form is pre-filled from qualification (if any data is available)
- Returning visit: form shows exactly what the borrower last saved

---

## Restore Precedence Rules

```
1. On mount → call GET /v2/borrower/application/sections/{key}
2. effective_data present AND non-empty → apply to form
   a. section.data is non-empty → restoreSource = "saved"
   b. section.data is empty/absent → restoreSource = "prefill"
3. effective_data absent or empty → restoreSource = "none" (keep blank defaults)
4. API call fails → restoreError set; restoreSource = "none"; form stays editable
```

---

## Pages Connected

### Property section
**File:** `src/routes/applications.$applicationId.property-financing.target-property.tsx`
**Section key:** `property`

### Assets / Down Payment section
**File:** `src/routes/applications.$applicationId.property-financing.down-payment.tsx`
**Section key:** `assets_down_payment`

---

## Field Mapping — Property Section

| Backend field (`effective_data`) | Form state |
|----------------------------------|------------|
| `locations[]` | `locations` (UI `id` added per item) |
| `property_types[]` | `types` |
| `property_usage` | `usage` |
| `target_purchase_price` | `target` (string) |
| `expected_down_payment` | `dpAmount` (string) |
| `max_monthly_payment` | `maxPayment` (string) |
| `considering_new_build` | `newBuild` |
| `considering_condo` | `condoPref` |
| `estimated_condo_fee` | `condoFee` (string) |

Fields not in prefill (only in saved data): `max_monthly_payment`, `considering_new_build`,
`considering_condo`, `estimated_condo_fee`.

---

## Field Mapping — Assets / Down Payment Section

| Backend field (`effective_data`) | Form state |
|----------------------------------|------------|
| `total_down_payment` | `totalDP` (string) |
| `property_value` | `propertyValue` (number; used in derived stats) |
| `source_types[]` | `selectedTypes` (only when `restoreSource === "saved"`) |
| `sources[]` | `sources` (with generated `id`; only when `restoreSource === "saved"`) |

Source types and sources are only restored from saved data. Qualification prefill
(`restoreSource === "prefill"`) does not include source breakdowns because qualification
does not capture them. `down_payment_band` from prefill is not mapped to a form field.

---

## Restore UX

### Loading state

While the restore API call is in flight, a subtle "Loading your saved answers…" banner
appears above the form and the form cards are muted (`pointer-events-none opacity-60`).
This prevents user interaction before restore completes and eliminates restore/edit race
conditions.

### Restore banner (non-blocking info)

After a successful restore:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ℹ  Restored from your saved application.                                   │
│    — or —                                                                   │
│    ℹ  Pre-filled from your qualification answers. Please review and save.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

Shown only when `restoreSource !== "none"`. Uses a calm sky-blue style to distinguish
from error banners.

### Restore error (non-blocking)

If the API call fails:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  We could not restore your saved property details. You can continue          │
│  entering them manually.                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

Shown in the existing coral error banner style. The form becomes fully editable
immediately — `loadingRestore` is set to `false` on both success and failure.

---

## Unsaved-Edit Protection

A `userEditedRef` (React `useRef`) tracks whether the user has made any input change:

- Set to `true` on any `onChange` / `onMultiChange` / `addLoc` / `removeLoc` call.
- The restore `useEffect` callback checks `userEditedRef.current` before applying data.
- The form is also disabled while `loadingRestore === true`, preventing any change
  before the API response arrives.

This ensures the API callback can never overwrite text the borrower has typed.

---

## API Adapter Changes

**File:** `src/lib/api/borrowerApplicationSectionsApi.ts`

### `ApplicationSection` type additions

```ts
/** Data the borrower has explicitly saved. */
data?: Record<string, unknown> | null;
/** Suggested values from qualification / profile. */
prefill_data?: Record<string, unknown> | null;
/** effective_data = data (if saved) or prefill_data */
effective_data?: Record<string, unknown> | null;
```

### New function: `initializeBorrowerApplicationSection`

```ts
POST /v2/borrower/application/sections/{sectionKey}/initialize
```

Read-only — does not write to the database. Returns the same shape as
`getBorrowerApplicationSection`. The frontend uses `getBorrowerApplicationSection` for
restore (simpler, idempotent GET); `initializeBorrowerApplicationSection` is available
for future use cases where POST semantics are preferred.

---

## Manual QA Steps

```
1. Complete a qualification so the backend has raw_payload data.
2. POST /v2/borrower/application → create application.
3. Navigate to Target Property page (/applications/.../property-financing/target-property).
4. Observe "Loading your saved answers…" banner briefly, then:
   — If qualification data exists: blue "Pre-filled from your qualification answers." banner.
   — Form fields populated with qualification city/province/price/down payment.
5. Edit a field → userEditedRef is set; saveStatus → "unsaved".
6. Click Save Draft → PATCH sent; banner disappears; "Saved" indicator shown.
7. Navigate away and back.
8. Observe "Loading your saved answers…" then "Restored from your saved application." banner.
9. Form fields show the saved values.

10. Repeat steps 3–9 for Down Payment page (/applications/.../property-financing/down-payment).
11. Disconnect backend or simulate API failure:
    → Restore error banner shown; form is fully editable; no crash.
```

---

## Deferred

| Item | Reason | Target |
|------|--------|--------|
| `borrower_profile` restore UI | Not yet wired | PR 16A |
| `income` restore UI | Not yet wired | PR 16A |
| `liabilities` restore UI | Not yet wired | PR 16A |
| Use `initializeBorrowerApplicationSection` instead of GET | No functional difference today | Future |
| Restore source detail chips ("from RBC RRSP saved 2026-05-15") | Over-engineering for V1 | Post-launch |
| Field-specific restore indicators | Over-engineering for V1 | Post-launch |

---

## Changed Files

| File | Change |
|------|--------|
| `src/lib/api/borrowerApplicationSectionsApi.ts` | Added `prefill_data` / `effective_data` to `ApplicationSection`; added `initializeBorrowerApplicationSection` |
| `src/routes/applications.$applicationId.property-financing.target-property.tsx` | Restore useEffect, restore state flags, restore banner, dirty guard, `useRef` import |
| `src/routes/applications.$applicationId.property-financing.down-payment.tsx` | Restore useEffect, restore state flags, restore banner, dirty guard, restored `propertyValue` from backend |
| `docs/borrower-application-section-restore-ui.md` | This document |

---

## Build / Verification Results

```
✓ Prettier — 0 changes on all 3 changed source files
✓ ESLint — 0 errors, 0 warnings on all 3 changed source files
✓ TypeScript — 0 new errors (3 pre-existing errors in unrelated files)
✓ Build — clean (same pre-existing stale-dir warnings as baseline)
```
