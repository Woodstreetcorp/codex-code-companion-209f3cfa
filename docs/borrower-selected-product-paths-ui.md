# Borrower Selected Product Paths UI

## Summary

PR 28B adds borrower UI to select an advisor-reviewed safe product option path and view selected paths on `/portal/offers`.

The UI remains conservative. Selecting a path tells the approvU team which borrower-safe path the borrower wants reviewed for packaging. It is not a lender approval, final offer, or rate commitment.

## Endpoints Used

| Method | Endpoint                                                            | Purpose                                           |
| ------ | ------------------------------------------------------------------- | ------------------------------------------------- |
| `GET`  | `/v2/borrower/application/selected-products`                        | Loads selected product paths.                     |
| `POST` | `/v2/borrower/application/product-options/{publicReference}/select` | Selects one advisor-reviewed product option path. |

Frontend adapter:

- `src/lib/api/borrowerSelectedProductsApi.ts`
- `listBorrowerSelectedProducts()`
- `selectBorrowerProductOption(publicReference)`
- `storeBorrowerSelectedProducts(result)`

The adapter uses `buildApiUrl` and `fetchWithLaravelSession`. If an endpoint is unavailable or fails, it returns an empty unavailable state and the page keeps rendering safely.

## Option Select Behavior

Advisor-reviewed option cards now show:

- `Select this path for advisor review`
- disabled selecting state while the POST request is in flight
- selected state when the option is already selected

After a successful select:

1. The selected-products response is stored.
2. The page shows a success notice.
3. Selected products are refreshed.
4. Product options are refreshed.

If selection fails, the option remains visible and a non-blocking message says the path could not be selected right now.

## Selected Summary

The selected paths summary displays only:

- `option_label`
- `product_category`
- `product_class_label`
- `path_label`
- `selection_status`
- `selected_at`
- `disclaimer`

The summary does not display internal identifiers.

## Prohibited Fields And Language

Do not display:

- lender names
- rates
- payments
- match scores
- product IDs/codes
- approval wording
- lender packaging status
- lender submission status

Do not use:

- Apply now
- Approved
- Guaranteed
- Best rate
- Final offer

Required safe copy:

> This selection tells the approvU team which path you want reviewed for packaging.

> This is not a lender approval.

> Final terms depend on lender review.

## QA Steps

1. Open `/portal/offers` with no selected-products endpoint and confirm the page still renders.
2. Open `/portal/offers` with selected-products endpoint returning no paths and confirm no selected summary appears.
3. Return one advisor-reviewed safe product option and confirm the selection CTA appears.
4. Click `Select this path for advisor review` and confirm the button disables while selecting.
5. Confirm successful selection shows a success notice and selected paths summary.
6. Confirm the selected summary renders only safe fields.
7. Confirm no lender names, rates, payments, match scores, product IDs/codes, approval wording, lender packaging, or lender submission details appear.
8. Confirm failed selection shows a non-blocking error and does not remove the option.
9. Confirm mobile layout stacks selected summary, option cards, and CTAs without overlap.

## Deferred Items

- Lender packaging UI.
- Lender submission workflow.
- Removing or changing selected paths.
- Multiple-choice selection rules.
- Advisor-side selection review.
- Lender names and rates if later approved for display.
- Payment estimate display.
- Match score display.
