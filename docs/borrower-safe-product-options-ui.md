# Borrower Safe Product Options UI

## Summary

PR 27B adds borrower-safe product options UI to `/portal/offers` using the future borrower-safe product options endpoint. Options render only when the backend reports options are available and the returned items are explicitly advisor-reviewed.

The UI remains conservative: it does not show lender names, rates, payment amounts, match scores, product IDs, selected product details, fake products, or approval language.

## Endpoint Used

- `GET /v2/borrower/application/product-options`

Frontend adapter:

- `src/lib/api/borrowerProductOptionsApi.ts`
- `getBorrowerProductOptions()`
- `storeBorrowerProductOptions(result)`

The adapter uses `buildApiUrl` and `fetchWithLaravelSession`. If the endpoint is unavailable, returns `404`, or throws, it returns an empty unavailable state rather than surfacing a noisy borrower-facing error.

## Fields Rendered

Option cards render only these borrower-safe fields:

- `option_label`
- `product_category`
- `product_class_label`
- `path_label`
- `advisor_reviewed`
- `notes`
- `documents_needed`
- `created_at`
- `disclaimer`

The page only renders option cards for items where:

- `advisor_reviewed === true`

If no advisor-reviewed items are available, the existing Product Options placeholder remains visible.

## Prohibited Fields

The borrower UI intentionally does not render:

- lender name
- rate
- payment
- match score
- product ID/code
- selected product details
- approval language
- lender submission details

Copy remains anchored to:

> These are not approvals. Final terms depend on lender review.

## Empty And Unavailable Behavior

| Condition                                      | Behavior                                                      |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Endpoint unavailable                           | Preserve current Product Options placeholder.                 |
| Endpoint returns error                         | Preserve current Product Options placeholder.                 |
| `options_available` is false                   | Preserve current Product Options placeholder.                 |
| No options returned                            | Preserve current Product Options placeholder.                 |
| Options returned but none are advisor-reviewed | Preserve current Product Options placeholder.                 |
| Advisor-reviewed options returned              | Render safe option cards below the product match status card. |

No red error is shown when only the product options endpoint is unavailable.

## CTAs

Safe CTAs on rendered option cards:

- View Documents: `/portal/documents`
- View Application Status: `/portal/application/review-submit`
- Review Requested Items: `/portal/application`

No select, apply, submit-to-lender, or product-selection CTA is included in this PR.

## QA Steps

1. Open `/portal/offers` with the product options endpoint unavailable and confirm the existing placeholder still appears.
2. Return `options_available: false` and confirm no option cards render.
3. Return `options_available: true` with an empty `options` array and confirm no option cards render.
4. Return options with `advisor_reviewed: false` and confirm no option cards render.
5. Return an option with `advisor_reviewed: true` and safe fields populated.
6. Confirm the card shows only label, category, class, path, notes, documents needed, created date, and disclaimer.
7. Confirm no lender names, rates, payment amounts, match scores, product IDs/codes, selected product details, or approval wording appear.
8. Confirm CTAs route to documents, application status, and requested items.
9. Confirm mobile layout stacks option cards and CTAs without overlap.

## Deferred Items

- Selected-products workflow.
- Product selection CTA.
- Lender packaging UI.
- Lender names and rates, if later approved for display.
- Match score display.
- Payment estimate display.
- Admin product matching review UI.
