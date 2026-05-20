# Borrower Packaging Status API Polish

## Summary

PR 31B polishes `/portal/offers` for the `ready_for_lender_packaging` state after an admin initiates packaging. The borrower sees that the advisor is preparing the package, selected paths remain visible, and the UI avoids lender submission, approval, lender-name, rate, payment, and score language.

## Page Updated

| Area                       | File                           | Behavior                                                                                        |
| -------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Offers and review status   | `src/routes/portal.offers.tsx` | Adds explicit `ready_for_lender_packaging` copy and packaging progress guidance.                |
| Lender packaging readiness | `src/routes/portal.offers.tsx` | Shows advisor-preparation copy when readiness or review status indicates packaging has started. |

## Status Behavior

When `review_status.status` or lender packaging readiness `status` is `ready_for_lender_packaging`, the page shows:

- Review status label: "Package Being Prepared"
- Product match card headline: "Your advisor is preparing your package."
- Packaging readiness headline: "Your advisor is preparing your package"
- Selected path progression remains visible
- Selected paths summary remains visible

The state maps to the existing borrower-safe product match placeholder instead of introducing product cards or lender submission UI.

## Disclaimer Behavior

The packaging state includes explicit borrower-safe copy:

- "This is not a lender submission."
- "This is not a lender approval."
- "Final terms depend on lender review."
- "No lender submission has been completed from this screen."

## Guardrails

The updated page does not show:

- Lender names
- Rates
- Payments
- Approval wording
- Lender submission UI
- Fake lender data
- Product scores
- Product IDs or unsafe product details

## Selected Paths

Selected paths remain visible after packaging starts. The summary continues to display only safe fields already allowed by the selected product paths UI:

- Option label
- Product category
- Product class label
- Path label
- Selection status
- Selected date
- Disclaimer

## Manual QA

1. Load `/portal/offers` with `review_status.status=ready_for_lender_packaging`.
2. Confirm the review status chip says "Package Being Prepared."
3. Confirm the product match card says the advisor is preparing the package.
4. Confirm selected paths remain visible when selected paths exist.
5. Confirm the packaging readiness card includes the no-lender-submission disclaimer.
6. Confirm the page does not show lender names, rates, payments, approvals, scores, or fake lender data.
7. Confirm existing CTAs continue to route to documents, application status, requested items, consents, and application workspace.

## Deferred

- Lender submission workflow
- Advisor packaging management UI
- Lender names or lender-specific details
- Rates or payment estimates
- Approval decisions
- Product scores
- Automated E2E coverage
