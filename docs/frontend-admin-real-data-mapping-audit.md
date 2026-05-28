# Frontend Real-Data Mapping Audit

**Branch:** `audit/frontend-admin-real-data-mapping-cleanup`  
**Date:** 2026-05-28  
**Scope:** `codex-code-companion` (borrower frontend)

---

## Summary

Audit of all borrower portal pages and qualification flows to verify they display real backend data, use no demo/static mock records, and correctly map qualification answers to the backend payload.

**Result:** No demo borrower data found. All portal pages consume the lifecycle state API correctly. Two P0 issues fixed: address question mismatch and dead code in FlowRunner.

---

## Files Audited

| File | Finding |
|------|---------|
| `src/routes/portal.index.tsx` | ✅ Real data. Lifecycle state API, Home Life Bundle API. No demo values. |
| `src/routes/portal.applications.index.tsx` | ✅ Real data. Lifecycle state API. |
| `src/routes/portal.application.tsx` | ✅ Real data. 7 separate application section/summary APIs. |
| `src/routes/portal.offers.tsx` | ✅ Real data. 7 APIs including lifecycle, product match, selected products. |
| `src/components/portal/data.ts` | ✅ Types and empty arrays only. Mock arrays (`ACTIVE`, `SUBMITTED`, `DOCUMENTS`, etc.) already cleared. |
| `src/lib/flows.ts` | ⚠️ Address questions fixed (see P0 Fixes below). |
| `src/components/FlowRunner.tsx` | ⚠️ Dead code removed (see P0 Fixes below). |
| `src/lib/api/borrowerQualificationApi.ts` | ✅ Real endpoints. Known gaps documented below. |
| `src/lib/api/borrowerLifecycleStateApi.ts` | ✅ Clean. Full type coverage, safe helpers. |

---

## Admin Routes

No admin routes exist in this codebase. The `src/routes/` directory contains only borrower-facing routes. Admin functionality lives entirely in the backend (Laravel admin panel), not here.

---

## Qualification Flow Field Mapping

### Purchase flow (`/purchase`)

| Answer key | Type | Backend field | Notes |
|------------|------|--------------|-------|
| `use` | choice | `property_usage` | primary / rental / secondary |
| `firstTime` | choice | `answers.firstTime` | yes / no / unsure |
| `offer` | choice | `answers.offer` | yes / no |
| `address` | text | `city` | **Fixed** — now asks for city, not full address |
| `propertyType` | choice | `answers.propertyType` | detached / semi / condo / multi |
| `units` | choice | `answers.units` | 1–4 |
| `credit` | number | `credit_score_range` | Numeric score sent as string (e.g. "679") |
| `income` | choice | `answers.income` | employed / self / other / combo |
| `selfVerify` | choice | `answers.selfVerify` | tax / bank / unsure (conditional) |
| `price` | currency | `property_value`, `mortgage_amount` | mortgage_amount = price − down |
| `down` | currency | `down_payment` | |
| `ownsResidence` | choice | `answers.ownsResidence` | conditional on rental/secondary use |

### Pre-purchase flow (`/pre-purchase`)

| Answer key | Type | Backend field | Notes |
|------------|------|--------------|-------|
| `locations` | locations | `city` | First entered city extracted |
| `use` | choice | `property_usage` | |
| `propertyType` | choice | `answers.propertyType` | |
| `units` | choice | `answers.units` | |
| `firstTime` | choice | `answers.firstTime` | conditional |
| `credit` | number | `credit_score_range` | |
| `income` | choice | `answers.income` | |
| `selfVerify` | choice | `answers.selfVerify` | conditional |
| `priceRange` | choice | `answers.priceRange` | |
| `specificPrice` | currency | `target_property_value` | conditional |
| `savedDown` | currency | `down_payment` | |

### Refinance flow (`/refinance`)

| Answer key | Type | Backend field | Notes |
|------------|------|--------------|-------|
| `intent` | multi | `answers.intent` | |
| `lowerPaymentIntent` | choice | `answers.lowerPaymentIntent` | conditional |
| `propertyType` | choice | `answers.propertyType` | |
| `address` | text | `city` | **Fixed** — now asks for city |
| `use` | choice | `property_usage` | |
| `value` | currency | `property_value` | |
| `numMortgages` | choice | `answers.numMortgages` | |
| `mortgages` | mortgages | `mortgage_amount` | Sum of balances |
| `wantsEquity` | choice | `answers.wantsEquity` | |
| `cashAmount` | currency | `answers.cashAmount` | conditional |
| `cashout_purposes` | multi | `answers.cashout_purposes` | conditional |
| `other_cashout_purpose_detail` | text | `answers.other_cashout_purpose_detail` | conditional |
| `credit` | number | `credit_score_range` | |
| `income` | choice | `answers.income` | |
| `selfVerify` | choice | `answers.selfVerify` | conditional |

### Global payload fields (all flows)

| Field | Source | Notes |
|-------|--------|-------|
| `transaction_type` | `flowKey` | `pre` → `pre_purchase`; others pass through |
| `province` | hardcoded | `"ON"` — Ontario only, known limitation |
| `consent_version` | constant | `"borrower-qualification-v1"` |
| `source` | constant | `"borrower_frontend"` |
| `answers` | all answers | Full raw answers included |

---

## Known Gaps (Not Fixed — Backend Constraints)

| Gap | Impact | Notes |
|-----|--------|-------|
| `province` hardcoded to `"ON"` | Medium | Only Ontario supported. Document clearly. |
| `credit_score_range` receives numeric score string | Low | Backend stores it in `answers`; field name is aspirational. |
| `income` (numeric) payload field never populated | Low | Income type string is available in `answers.income`; backend uses `answers` object directly. |
| No Google Places / address autocomplete | Medium | Both purchase and refinance `address` questions now explicitly ask for city/municipality, matching what the backend `city` field stores. Full street address is not supported at the backend level either. |
| Disclosures endpoint not implemented | Low | Backend returns zeros with `disclosures_endpoint_not_implemented` warning; frontend renders `0` correctly. |

---

## P0 Fixes Applied

### 1. Address question wording — `src/lib/flows.ts`

**Before (purchase and refinance flows):**
```
title: "Where is the property located?"
subtitle: "Start typing and select your address. Ontario, Canada only for now."
placeholder: "Start typing your address…"
```

**After:**
```
title: "What city is the property in?"
subtitle: "Enter the city or municipality where the property is located. Ontario, Canada only."
placeholder: "e.g. Toronto"
```

**Reason:** The previous wording implied Google Places autocomplete ("Start typing and select your address"), which was never wired up. The `address` answer is sent as the `city` field in the qualification payload — a full street address is not accepted by the backend. The fix aligns the question with what is actually collected and stored.

### 2. Dead code removal — `src/components/FlowRunner.tsx`

Three functions were defined but never called:

| Function | Lines (before) | Why removed |
|----------|---------------|-------------|
| `Review` | 608–717 | `FlowRunner` renders `<MortgageSnapshot>` in the `done` state, not `<Review>`. This component was never mounted. |
| `_legacyDefaultInsights` | 1091–1097 | `_` prefix marks it as intentionally legacy. Duplicate of `defaultInsights()`. |
| `estimatePrincipal` | 1166–1172 | Defined but never called anywhere in the file. |

Also removed `ShieldCheck` from the lucide-react import — it was only used inside the removed `Review` component.

---

## Security Constraints Verified

All portal pages were checked against the security constraints:

- ✅ No internal numeric IDs (`id`, `user_id`, etc.) exposed in any portal page
- ✅ No lender names, product IDs, match scores, or rates shown
- ✅ No admin-only data (notes, task centre, assignments) included
- ✅ `borrower_visible_count` used for offer counts (not raw product match rows)
- ✅ All values come from `public_reference` UUIDs or status strings
- ✅ `storeBorrowerLifecycleState` stores only safe subset (borrower, application, qualification, offer_state, next_best_action)
- ✅ Home Life Bundle card notes "Internal offer IDs, partner metadata, and admin-only fields are not displayed"

---

## Verification

```
bunx --bun tsc --noEmit         → exit 0 (no errors)
bunx --bun prettier --check     → all changed files pass after --write
bunx --bun eslint               → 1 pre-existing warning in FlowRunner.tsx (react-hooks/exhaustive-deps on mortgageValue), not introduced by this change
```
