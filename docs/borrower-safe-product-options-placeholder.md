# Borrower Safe Product Options Placeholder

## Summary

PR 26B adds a conservative Product Options placeholder to `/portal/offers`.

The placeholder prepares the borrower experience for future product options without showing product cards, lender names, rates, match scores, selected products, fake products, or approval wording.

## Where The Placeholder Appears

| Route            | File                           | Placement                            |
| ---------------- | ------------------------------ | ------------------------------------ |
| `/portal/offers` | `src/routes/portal.offers.tsx` | Below the Product Match Status card. |

No new routes were added.

## Why Options Are Not Shown Yet

Product options are hidden until the backend and approvU advisor workflow can confirm what is borrower-safe to expose.

The placeholder tells borrowers:

- product options come after advisor review
- options will be possible paths, not approvals
- final terms depend on lender review
- the advisor will confirm next steps

## Safe Copy Used

The page continues using shared guardrail copy from:

`src/lib/productMatching/productMatchCopy.ts`

The visible strict guardrail message is:

> These are not approvals. Final terms depend on lender review.

The placeholder also states that it does not show:

- product cards
- lender names
- rates
- match scores
- selected products
- approval decisions

## Safe CTAs

The placeholder includes route-safe CTAs to existing borrower workflow pages:

| CTA                     | Route                               |
| ----------------------- | ----------------------------------- |
| View Application Status | `/portal/application/review-submit` |
| Review Requested Items  | `/portal/application`               |
| Upload Documents        | `/portal/documents`                 |
| Complete Consents       | `/portal/application/consents`      |
| Review & Submit         | `/portal/application/review-submit` |

## Product Match Status Adapter Fallback

`/portal/offers` now calls `getBorrowerProductMatchStatus()` defensively.

Behavior:

1. If the future endpoint returns an allowed safe status, the offers page uses it.
2. If the endpoint is unavailable, returns `404`, fails, or returns no safe status, the page falls back to the existing derived status.
3. No noisy borrower-facing error is shown when the endpoint is unavailable.

This preserves the current conservative scaffold while preparing for future backend integration.

## Future Backend Dependency

Future endpoint:

`GET /v2/borrower/application/product-match-status`

The placeholder should not become product option UI until a borrower-safe product options endpoint exists and returns advisor-reviewed data.

Future dependencies remain deferred:

- borrower-safe product options endpoint
- advisor-reviewed option fields
- selected products endpoint
- lender packaging status endpoint

## QA Steps

1. Open `/portal/offers`.
2. Confirm the Product Options placeholder appears below Product Match Status.
3. Confirm no product cards, lender names, rates, match scores, selected products, fake products, or approval wording appear.
4. Confirm the disclaimer says: "These are not approvals. Final terms depend on lender review."
5. Confirm CTAs route to existing pages:
   - `/portal/application/review-submit`
   - `/portal/application`
   - `/portal/documents`
   - `/portal/application/consents`
6. Confirm the page still works when the product match status endpoint is unavailable.
7. Mock a safe status from the future adapter and confirm the status badge/copy updates without exposing product details.
8. Confirm mobile layout stacks the placeholder and CTA cards without overlap.

## Deferred Items

- real product cards
- lender names
- rates
- match scores
- selected products
- product option API integration
- lender packaging UI
- admin product matching screens
- legal-reviewed product option copy
