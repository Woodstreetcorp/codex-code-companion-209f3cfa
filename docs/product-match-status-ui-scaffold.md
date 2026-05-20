# Product Match Status UI Scaffold

## Where The Scaffold Appears

The conservative product matching status scaffold appears on:

- `src/routes/portal.application.tsx`
- Route: `/portal/application`

The card is intentionally placed in the existing application workspace because that page already owns borrower-facing application status, review requests, documents, consents, and review/submit next steps.

No new routes were added.

## Status Source

There is no dedicated product matching endpoint in this PR. The scaffold derives a conservative UI state from existing frontend data:

- Application status from submission readiness / application summary.
- Open review-request count from the existing review request panel data.

If the current application state does not safely imply matching progress, the card falls back to:

> Product matching will begin after advisor review.

## States And Copy

| Scaffold state              | Derived from                                                                | Headline                                                 | Body copy                                                                                                                                     | Primary CTA               | Secondary CTA  |
| --------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------- |
| `not_ready`                 | Draft, in progress, documents requested, closed/withdrawn, or unknown state | Product matching will begin after advisor review.        | Complete your application, documents, and consents first. Potential mortgage paths are not shown until your file is ready for approvU review. | Continue Application      | View Documents |
| `missing_information`       | Open review requests or `needs_more_information`                            | More information is needed before matching can continue. | The approvU team needs a few updates before potential mortgage paths can be assessed.                                                         | Review Requested Items    | View Documents |
| `advisor_review`            | `borrower_submitted` or `advisor_review`                                    | Your application is being reviewed.                      | The approvU team is reviewing your application details before preparing any product options. Your advisor will confirm next steps.            | View Application Status   | View Documents |
| `options_being_prepared`    | Reserved scaffold state                                                     | Potential mortgage paths are being assessed.             | Your advisor is reviewing possible options. These are not approvals, and final terms depend on lender review.                                 | View Review Status        | None           |
| `options_ready_placeholder` | `ready_for_lender_packaging`                                                | Advisor-reviewed next steps are being prepared.          | Potential mortgage paths may be discussed with your advisor. These are not approvals, and final terms depend on lender review.                | View Next Steps           | View Documents |
| `lender_review_placeholder` | `submitted_to_lender`, `approved`, or `declined`                            | Your file is in lender review status.                    | Final terms depend on lender review. Your advisor will confirm next steps as updates become available.                                        | View Lender Review Status | View Documents |

Every state also shows:

> These are not approvals. Final terms depend on lender review.

## No Lender / Rate / Approval Rule

This scaffold does not show:

- Product cards
- Lender names
- Rates
- Payment estimates
- Match scores
- Selected products
- Fake product data
- Approval wording
- "Best rate" or "guaranteed" language

The card is a status scaffold only.

## Backend Dependency Deferred

Future product matching PRs should add a dedicated borrower-safe endpoint, such as:

- `GET /v2/borrower/application/product-match-status`
- `GET /v2/borrower/application/product-options`

This PR does not call a non-existing product matching endpoint. Once backend product matching exists, this scaffold can be updated to prefer backend status while retaining the same conservative copy rules.

## QA Steps

1. Open `/portal/application` for a draft or in-progress application and confirm the card says product matching begins after advisor review.
2. Simulate or load `needs_more_information` with an open request and confirm the card shows "More information is needed before matching can continue."
3. Simulate `borrower_submitted` or `advisor_review` and confirm the card says the application is being reviewed.
4. Simulate `ready_for_lender_packaging` and confirm the card uses advisor-reviewed placeholder copy without exposing product cards.
5. Simulate `submitted_to_lender` and confirm the card says final terms depend on lender review.
6. Confirm no lender names, rates, approval language, match scores, or fake product data appear.
7. Confirm CTAs route only to existing pages:
   - `/internal/full-application`
   - `/portal/documents`
   - `/portal/application`
   - `/portal/application/review-submit`
8. Confirm mobile layout stacks the copy and CTAs without overlap.

## Deferred Items

- Product matching backend status endpoint.
- Borrower-safe product options endpoint.
- Product option cards.
- Selected product flow.
- Lender names and rates, only if later approved for display.
- Product match score display.
- Admin product matching review UI.
- Lender packaging workflow.
