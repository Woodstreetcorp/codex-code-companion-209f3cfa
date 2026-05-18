# Borrower Full Application Cycle Smoke QA Polish

## Routes Audited

- `/portal`
- `/portal/application`
- `/portal/application/consents`
- `/portal/application/review-submit`
- `/portal/documents`
- `/portal/offers`
- `/internal/full-application`
- `/applications/current/property-financing/target-property`
- `/applications/current/property-financing/down-payment`

## CTAs Verified And Fixed

- Application workspace `Continue Application` now routes to `/internal/full-application`, where borrower profile, income, and liabilities are embedded.
- Application workspace section cards now route:
  - `borrower_profile` to `/internal/full-application`
  - `property` to `/applications/current/property-financing/target-property`
  - `income` to `/internal/full-application`
  - `assets_down_payment` to `/applications/current/property-financing/down-payment`
  - `liabilities` to `/internal/full-application`
- Review request cards use the same section routing, so requested items land on existing pages.
- Review submit blocker links normalize backend route hints before rendering.
- Offer review action links normalize backend route hints before rendering.
- Documents and consents CTAs continue to route to `/portal/documents` and `/portal/application/consents`.

## Status Route Hints Verified

Route hints are normalized for common backend values:

- `application`, `application_workspace`
- `review_submit`
- `consents`
- `documents`, `document_vault`
- `offers`, `review_status`
- `borrower_profile`
- `property`
- `income`
- `assets_down_payment`, `down_payment`
- `liabilities`

Unknown route hints fall back to safe existing pages instead of creating new routes.

## State Polish

- Consent loading failures now detect likely session expiry and show a sign-in action.
- Review-submit readiness failures now detect likely session expiry and show a sign-in action.
- Existing retry actions remain available.
- Borrower-facing copy continues to avoid approval, rate, lender commitment, or product matching promises.

## Manual QA Checklist

1. Portal home routes to application workspace, documents, and offers.
2. Application workspace routes to borrower profile/income/liabilities through `/internal/full-application`.
3. Application workspace routes to target property and down payment pages.
4. Application workspace routes to document vault.
5. Application workspace routes to consent capture.
6. Application workspace routes to review and submit.
7. Submitted status shows request panel and primary action.
8. Open request cards route to their related section or document page.
9. Resolved requests remain lower priority and do not show response controls.
10. Offers review page resolves action links without implying live offers.
11. Consent and review-submit error states show retry and sign-in recovery when appropriate.

## Remaining Frontend Gaps

- No automated end-to-end smoke suite yet.
- Some legacy Lovable pages still use mock or static state.
- Per-application document and message pages are not implemented; shared portal-level routes are used.

## Deferred

- Automated Playwright/Cypress tests.
- Product matching.
- Lender packaging UI.
- Co-borrower workflow.
- Threaded messaging.
- Email/SMS notifications.
