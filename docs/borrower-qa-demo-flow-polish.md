# Borrower QA Demo Flow Polish

## Local Setup Assumptions

- Frontend runs from `codex-code-companion`.
- Laravel V2 backend is running and reachable through the configured frontend API base URL.
- Browser cookies are enabled so the Laravel session and CSRF cookie can be used.
- A QA borrower can either start from a new qualification or sign in with an existing borrower account.
- No frontend test-data mode or mock backend is enabled in this PR.

## Frontend Routes To Test

- `/purchase`
- `/pre-purchase`
- `/refinance`
- `/create-account`
- `/login`
- `/portal`
- `/portal/application`
- `/internal/full-application`
- `/applications/current/property-financing/target-property`
- `/applications/current/property-financing/down-payment`
- `/portal/documents`
- `/portal/application/consents`
- `/portal/application/review-submit`
- `/portal/offers`

## Backend Routes Required

- `POST /v2/borrower/qualification`
- `POST /v2/borrower/account-handoff`
- `POST /v2/borrower/login`
- `GET /v2/borrower/session`
- `GET /v2/borrower/portal`
- `GET /v2/borrower/application`
- `GET /v2/borrower/application-summary`
- `GET /v2/borrower/application/sections`
- `GET /v2/borrower/application/sections/{sectionKey}`
- `PATCH /v2/borrower/application/sections/{sectionKey}`
- `GET /v2/borrower/documents`
- `GET /v2/borrower/document-requests`
- `POST /v2/borrower/documents`
- `GET /v2/borrower/application/consents`
- `POST /v2/borrower/application/consents`
- `GET /v2/borrower/application/submission-readiness`
- `POST /v2/borrower/application/submit`
- `GET /v2/borrower/application/review-requests`
- `POST /v2/borrower/application/review-requests/{reviewNotePublicReference}/respond`

## Full Borrower Flow Checklist

1. Open `/purchase`, `/pre-purchase`, or `/refinance`.
2. Complete the qualification flow and generate the Mortgage Snapshot.
3. Create an account from `/create-account` using the saved `QS-...` reference or session token.
4. Sign in at `/login`.
5. Confirm `/portal` loads the borrower summary and links to application, documents, and offers.
6. Open `/portal/application`.
7. Use `Continue Application` to open `/internal/full-application`.
8. Save borrower profile, income, and liabilities sections.
9. Open target property and down payment section links from the application workspace.
10. Save target property and down payment.
11. Refresh and confirm saved section values restore.
12. Open `/portal/documents` and upload a supported QA document.
13. Open `/portal/application/consents` and accept all required consents.
14. Open `/portal/application/review-submit`.
15. Resolve blockers or confirm blockers are correctly displayed.
16. If ready, confirm accuracy and submit the application.
17. Return to `/portal/application` and confirm submitted status is visible.
18. Open `/portal/offers` and confirm it shows review status without implying live lender offers.

## Admin Flow Checklist

1. In the backend/admin review workflow, move the application into `needs_more_information`.
2. Add a review request tied to one of:
   - `borrower_profile`
   - `property`
   - `income`
   - `assets_down_payment`
   - `liabilities`
   - `documents`
   - `consents`
3. Return to `/portal/application`.
4. Confirm the request appears in `Requests from approvU`.
5. Confirm the request action routes to the relevant existing frontend page.
6. Update the requested section or document.
7. Add a borrower response note.
8. Check the confirmation box and select `Mark as addressed`.
9. Confirm the request refreshes and resolved requests no longer show response controls.

## Common Failure Meanings

- `401` session expired: the borrower session is missing or expired. Sign in again from `/login`.
- `419` CSRF: the Laravel CSRF cookie/session handshake failed. Reload, sign in again, and confirm the backend is serving Sanctum/session cookies for the frontend origin.
- `422` validation/readiness blockers: the request reached the backend, but required fields, consents, sections, documents, or readiness rules are incomplete.
- Endpoint unavailable: the frontend is defensive for some expected endpoints. Confirm the matching backend PR is merged and routes are registered.
- Backend not running: network failures, connection refused, or generic fetch errors usually mean the Laravel server or API base URL is unavailable.

## Recommended DevTools Checks

- Network tab: verify each request uses the expected `/v2/borrower/...` route.
- Network tab: confirm `PATCH` and `POST` requests include cookies and do not fail with `419`.
- Application tab: confirm Laravel session cookies are present for the backend host.
- Console tab: watch for route errors, failed imports, or unhandled promise rejections.
- Disable cache during QA when switching between branches or rebuilding assets.

## Verify Section Saves And Restores

- Save borrower profile, property, income, assets/down payment, and liabilities.
- In Network, confirm `PATCH /v2/borrower/application/sections/{sectionKey}` returns success.
- Refresh the page.
- Confirm each restored section calls `GET /v2/borrower/application/sections/{sectionKey}` where implemented.
- Confirm restored values come from `effective_data`.
- Confirm active edits are not overwritten by late restore responses.

## Verify Submission

- In `/portal/application/review-submit`, confirm blockers match backend readiness.
- Accept all consents and complete required sections/documents.
- Confirm the submit button stays disabled until readiness is true and the accuracy checkbox is selected.
- Submit once.
- Confirm `POST /v2/borrower/application/submit` returns `submitted` or an application payload.
- Confirm submitted status, public reference, and submitted date render in the UI.

## Verify More-Info Response

- Create or expose an open review request from the backend/admin flow.
- Confirm `/portal/application` shows the open request count.
- Confirm the request card links to the related section/document/consent page.
- Add a short borrower note.
- Confirm the acknowledgement checkbox enables `Mark as addressed`.
- Confirm `POST /v2/borrower/application/review-requests/{publicReference}/respond` sends:
  - `response`
  - `mark_addressed: true`
- Confirm the request list refreshes and shows the resolved state if the backend marks it resolved.

## Deferred

- Automated Playwright/Cypress tests.
- Seed data mode.
- Product matching.
- Lender packaging UI.
- Co-borrower workflow.
- Threaded messaging.
- Email/SMS notifications.
