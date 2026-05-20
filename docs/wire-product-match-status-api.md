# Wire Product Match Status API

## Summary

PR 26D wires the defensive borrower product match status adapter into the existing conservative product match status areas. The UI still does not show product cards, product names, lender names, rates, match scores, selected product details, or approval language.

## Endpoint Used

- `GET /v2/borrower/application/product-match-status`

The request is made through `getBorrowerProductMatchStatus()`, which uses `buildApiUrl` and `fetchWithLaravelSession`.

## Pages Updated

| Page                  | Behavior                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/portal/application` | Loads product match status in the product match status card without blocking the main application workspace.   |
| `/portal/offers`      | Uses the product match status response for the status scaffold and product options placeholder when available. |

## Fallback Behavior

If the endpoint is unavailable, returns `endpoint_available: false`, fails, or returns an unknown/null status, the pages fall back to their existing derived status from application/review state.

No red error is shown for product match endpoint unavailability. The borrower continues to see the current safe placeholder copy.

## Safe Fields Displayed

Only these aggregate fields may be displayed when present:

- `status`
- `borrower_visible_count`
- `advisor_reviewed_count`
- `last_matched_at`

Status labels and body copy continue to come from `src/lib/productMatching/productMatchCopy.ts`.

## Prohibited Fields

The UI intentionally does not display:

- product names
- lender names
- rates
- payment terms
- match scores
- product IDs
- selected product details
- approval decisions or approval-like wording

The disclaimer remains visible:

> These are not approvals. Final terms depend on lender review.

## QA Steps

1. Open `/portal/application` with the product match endpoint unavailable and confirm the card falls back to safe derived copy.
2. Open `/portal/offers` with the endpoint unavailable and confirm the placeholder still renders without a noisy error.
3. Mock or verify an API response with a safe status and confirm the status copy updates from the shared guardrail helper.
4. Include `borrower_visible_count`, `advisor_reviewed_count`, and `last_matched_at` in a response and confirm only those aggregate values render.
5. Confirm no lender names, rates, product names, match scores, product IDs, selected products, or approval wording appears.

## Deferred Items

- Product option cards.
- Borrower product selection.
- Lender names and final rates, if business/legal later allows them.
- Match score display.
- Admin product matching workflow UI.
- Lender packaging UI.
