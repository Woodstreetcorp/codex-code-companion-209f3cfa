# Borrower Packaging Next Steps Polish

## Summary

PR 30B polishes the borrower-facing packaging guidance on `/portal/offers` after a borrower selects an advisor-reviewed product path. The page now explains the progression from selected path to packaging readiness to advisor review without adding lender submission UI or implying approval.

## Page Updated

| Area                               | File                                                 | Behavior                                                                                                     |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Offers and product options         | `src/routes/portal.offers.tsx`                       | Shows safer packaging next-step guidance, selected path progression, readiness blockers, and packaging CTAs. |
| Lender packaging readiness adapter | `src/lib/api/borrowerLenderPackagingReadinessApi.ts` | Reads future readiness data defensively from `/v2/borrower/application/lender-packaging-readiness`.          |

## Backend Endpoint

The UI can consume:

`GET /v2/borrower/application/lender-packaging-readiness`

The adapter fails safely if the endpoint is unavailable. The offers page falls back to borrower-safe guidance and selected-product state instead of showing a noisy error.

## What Happens Next Section

The page now shows a clear three-step progression:

1. Selected path
2. Packaging readiness
3. Advisor review

Borrower-facing copy stays conservative:

- "Your selected path is being prepared for advisor review."
- "This is not a lender approval."
- "Final terms depend on lender review."
- "Your advisor will confirm next steps."

## Packaging Readiness Behavior

The readiness card shows:

- Ready or not ready state
- Selected paths count
- Document summary, if provided
- Consent summary, if provided
- Blockers, if provided
- Next-step copy, if provided
- Conservative disclaimer

If no blockers are returned, the UI shows a positive state that no packaging blockers are showing right now, while still deferring final next steps to the advisor.

## Empty State Behavior

If the borrower has not selected any paths, the offers page keeps the existing placeholder behavior and explains that product options and packaging steps appear only after advisor review and selection. No fake selected products are shown.

## CTAs

The packaging area links to existing borrower routes:

- View Documents: `/portal/documents`
- Review Application Status: `/portal/application/review-submit`
- Review Requested Items: `/portal/application`
- Complete Consents: `/portal/application/consents`
- Back to Application: `/portal/application`

## Guardrails

The page must not show:

- Lender names
- Rates
- Payments
- Approval wording
- Lender submission UI
- Fake lender data
- Product scores

## Manual QA

1. Open `/portal/offers` with no selected products and confirm the placeholder stays conservative.
2. Open `/portal/offers` with selected products and confirm the What happens next section appears.
3. Confirm selected paths still display only borrower-safe fields.
4. Confirm the lender packaging readiness card appears when selected products exist or readiness data is available.
5. Confirm blockers display as action-oriented items without implying approval.
6. Confirm the ready state says advisor packaging review is ready, not lender approval.
7. Confirm all CTAs route to existing pages.
8. Confirm unavailable readiness endpoint does not block the offers page.

## Deferred

- Lender submission workflow
- Lender names
- Rates or payment display
- Product scores
- Final approval details
- Advisor packaging management UI
- Automated end-to-end tests
