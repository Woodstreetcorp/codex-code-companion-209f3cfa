# Borrower Offer Review UI

**Branch:** `codex/borrower-offer-review-ui`  
**Files changed:** `src/lib/api/borrowerOfferReviewApi.ts`, `src/routes/portal.offers.tsx`, `src/routeTree.gen.ts`, `src/routes/portal.index.tsx`  
**PR scope:** Offers & Review Status page for the borrower portal, consuming `GET /v2/borrower/offer-review-status` (Laravel PR 11A).

---

## Route

| Item | Value |
|---|---|
| Route file | `src/routes/portal.offers.tsx` |
| URL | `/portal/offers` |
| Route ID | `/portal/offers` |
| Parent route | `/portal` (`src/routes/portal.tsx`) |
| Page title | `Offers & Review Status — approvU` |

---

## API adapter

**File:** `src/lib/api/borrowerOfferReviewApi.ts`

### Types exported

| Type | Description |
|---|---|
| `OfferReviewStatus` | Union of review status strings |
| `PreliminaryPathValue` | `prime \| alternative \| manual_review \| unknown \| string` |
| `OfferSectionStatus` | `pending \| ready \| needs_attention \| complete \| not_started \| string` |
| `ReviewStatusPayload` | `{ status, label, message, next_step }` |
| `PreliminaryPath` | `{ value, label, source }` |
| `Readiness` | `{ application_ready, snapshot_ready, documents_ready, missing_items }` |
| `OfferSection` | `{ key, label, status, message, action_label, route_hint }` |
| `PrimaryAction` | `{ label, action, route_hint }` |
| `BorrowerOfferReviewSummary` | Full response shape |

### Functions exported

| Function | Description |
|---|---|
| `getBorrowerOfferReviewStatus()` | `GET /v2/borrower/offer-review-status` with `credentials: "include"` |
| `storeBorrowerOfferReviewStatus(result)` | Caches `review_status`, `preliminary_path`, `primary_action` to `sessionStorage` under `approvu:borrower-offer-review-status` |

### Endpoint

```
GET /v2/borrower/offer-review-status
Authorization: Laravel web session (credentials: "include")
Accept: application/json
```

---

## Page layout

### States

| State | Trigger | UI |
|---|---|---|
| Loading | API call in flight | Centered `Loader2` spinner + message |
| Error / unauthenticated | `!summary.ok` or fetch failure | Coral icon, error message, "Sign in" CTA → `/login` |
| Loaded | `summary.ok === true` | Full review status view |

### Loaded layout (top to bottom)

1. **Page header** — "Offers & review status" label, "Your Mortgage Options" title, conservative subtitle
2. **Review status card** — status chip + label + message from `review_status`
3. **Preliminary path card** — path label, path description, source, yellow "not an approval" note
4. **Readiness checklist** — three rows: qualification on file, snapshot generated, documents resolved; `missing_items[]` list below
5. **Review sections grid** — 2-column grid of `offer_sections[]` cards with status badges and action links
6. **Primary action CTA** — "Your next step" with `primary_action.label` and Continue link
7. **Conservative disclaimer** — muted box, text sourced directly from API `disclaimers[]`
8. **Quick links** — Document Vault, Application Workspace, Back to portal

---

## Review status mapping

| `status` value | Displayed label | Chip colour |
|---|---|---|
| `pending_review` | Pending Review | Muted/grey |
| `needs_more_information` | More Information Needed | Yellow |
| `documents_required` | Documents Required | Coral |
| `advisor_review_in_progress` | Advisor Review in Progress | Secondary/blue |
| `options_pending` | Options Pending | Secondary/blue |
| `ready_for_advisor_review` | Ready for Advisor Review | Mint |

---

## Preliminary path mapping

| `value` | Displayed label | Description shown |
|---|---|---|
| `prime` | Prime | Standard institutional mortgage products are likely applicable |
| `alternative` | Alternative | Lenders specialising in non-traditional profiles may be suitable |
| `manual_review` | Manual Review | Case-by-case assessment required |
| `unknown` | Not yet determined | Path has not yet been determined |

A yellow note is always shown: "This helps guide the review process. It is not an approval decision."

---

## Offer section status mapping

| `status` | Badge label | Badge colour |
|---|---|---|
| `pending` | Pending | Secondary/blue |
| `ready` | Ready | Mint |
| `needs_attention` | Needs Attention | Coral |
| `complete` | Complete | Mint |
| `not_started` | Not Started | Muted/grey |

---

## Primary action routing

The page resolves `primary_action.route_hint` directly. Valid hints that start with `/portal`, `/purchase`, or `/refinance` are used as-is. All others fall back to `/portal`.

| `action` value | Typical `route_hint` |
|---|---|
| `start_qualification` | `/purchase` |
| `view_mortgage_snapshot` | `/portal` |
| `upload_documents` | `/portal/documents` |
| `await_advisor_review` | `/portal/documents` or `/portal/application` |
| `continue_application` | `/portal/application` |

---

## Readiness behaviour

Three boolean flags from `readiness` drive a checklist:

| Flag | Checklist item |
|---|---|
| `application_ready` | Qualification on file |
| `snapshot_ready` | Mortgage Snapshot generated |
| `documents_ready` | Document requests resolved |

`readiness.missing_items[]` is shown as a bulleted list below the checklist when non-empty.

---

## Disclaimer behaviour

`disclaimers[]` from the API is rendered verbatim in a muted box at the bottom of the page.
The disclaimer text is **never rewritten** into approval-like language.

Current backend disclaimer:  
> "This is not a mortgage approval or lender commitment. Your options will be reviewed based on your complete application details and supporting documents."

---

## What is intentionally not shown

| Item | Reason |
|---|---|
| Real lender offers | No lender matching yet — deferred |
| Rates | No product matching — deferred |
| Payment estimates | No product matching — deferred |
| Lender names / product IDs | Never returned by this backend endpoint |
| Offer comparison table | Deferred until real product matching is in place |
| Approval decisions | The API never returns approval language |

The existing `portal.applications.$applicationId.offers.tsx` page (which shows static mock offer cards) is deliberately separate and not linked from this page.

---

## Portal home integration

`src/routes/portal.index.tsx` — the Offers `PlaceholderCard` now passes:

```tsx
actionHref="/portal/offers"
actionLabel="View Review Status"
```

---

## routeTree.gen.ts changes

Added `PortalOffersRoute` to:
- Import block
- Route registration (`PortalOffersRouteImport.update(...)`)
- `FileRoutesByFullPath` interface
- `FileRoutesByTo` interface
- `FileRoutesById` interface
- `FileRouteTypes.fullPaths` union
- `FileRouteTypes.to` union
- `FileRouteTypes.id` union
- `FileRoutesByPath` declaration block
- `PortalRouteChildren` interface
- `PortalRouteChildren` object

---

## Auth behaviour

The page calls `getBorrowerOfferReviewStatus()` on mount with `credentials: "include"`. If the Laravel session is absent or expired the API returns a non-OK response (typically 401) and the page shows the error state with a "Sign in" link to `/login`.

---

## Manual QA steps

1. Sign in as a borrower with no qualification → page shows "Pending Review" chip, all readiness checks unchecked, "Start qualification" CTA.
2. Borrow with qualification but no snapshot → "More Information Needed", readiness: application ✓, snapshot ✗, documents ✓.
3. Borrower with outstanding document requests → "Documents Required", documents_ready = ✗.
4. Borrower with uploaded documents pending review → "Advisor Review in Progress".
5. Borrower with all documents reviewed → "Ready for Advisor Review", all three readiness checks ✓.
6. Confirm disclaimer block is always present.
7. Portal home Offers card shows "View Review Status →" link to `/portal/offers`.
8. Sign out and navigate directly to `/portal/offers` → error state with "Sign in" button.
9. Confirm no rates, no lender names, no offer prices appear anywhere on the page.

---

## Deferred / out of scope

- Real lender product matching
- Real mortgage offers, rates, and payment calculations
- Offer comparison table
- Lender submission workflow
- Offer bundle display
- Partner / lender routing
- Advisor review admin write-back UI
- Advanced underwriting rule display
