# Borrower Income and Liabilities Section Save UI

## Pages connected

- `src/components/hub/borrower-profile.tsx`
  - Employment & Income section inside the borrower profile flow.
  - Credit & Liabilities section inside the borrower profile flow.
- These sections are rendered from `src/routes/internal.full-application.tsx` through `MortgageApplicationContent`.

## Backend endpoints used

- `PATCH /v2/borrower/application/sections/income`
- `PATCH /v2/borrower/application/sections/liabilities`

## Section keys

- Income: `income`
- Liabilities: `liabilities`

## Income payload fields

The Income section serializes only existing UI state:

- `borrower_id`
- `borrower_name`
- `no_income_declared`
- `income_sources`
  - `id`
  - `type`
  - `source`
  - `jobTitle`
  - `startDate`
  - `grossIncome`
  - `frequency`
  - `verification`
  - `include`

## Liabilities payload fields

The Liabilities section serializes only existing UI state:

- `borrower_id`
- `borrower_name`
- `no_liabilities_declared`
- `credit_details`
  - `creditScore`
  - `scoreSource`
  - `bankruptcy`
  - `bankruptcyType`
  - `bankruptcyActive`
  - `dischargedWhen`
- `liabilities`
  - `id`
  - `ownerId`
  - `creditor`
  - `type`
  - `balance`
  - `monthlyPayment`
  - `shared`
  - `sharedWith`
  - `paymentHistory`
  - `payoffPlan`

## Status behavior

- Section-level `Save Progress` sends `status: "in_progress"`.
- The profile sticky `Save & Continue` action sends `status: "complete"` for Income and Liabilities, then preserves existing next-section navigation after a successful save.
- A local `saved | unsaved | saving` state updates the sticky save message for the active API-backed section.
- Save failures show the non-blocking banner: "We could not save this section right now. Please try again."

## current_step behavior

- Income saves with `current_step: "income"`.
- Liabilities saves with `current_step: "liabilities"`.

## Manual QA steps

1. Open the full application hub and enter the Mortgage Application borrower profile flow.
2. Open Employment & Income, add or remove an income source, and verify the sticky bar reports unsaved changes.
3. Click Save Progress and confirm a PATCH request to `/v2/borrower/application/sections/income` with `status: "in_progress"`.
4. Click Save & Continue from Employment & Income and confirm the PATCH uses `status: "complete"` and advances to the next borrower profile section.
5. Open Credit & Liabilities, edit credit details or add/remove a debt, and verify the sticky bar reports unsaved changes.
6. Click Save Progress and confirm a PATCH request to `/v2/borrower/application/sections/liabilities` with `status: "in_progress"`.
7. Click Save & Continue from Credit & Liabilities and confirm the PATCH uses `status: "complete"` and advances after success.
8. Simulate a failed save and confirm the non-blocking error banner is displayed.

## Deferred items

- Restore/prefill wiring.
- Borrower profile section save UI.
- Field-specific validation.
- Normalized income/liability tables.
- Co-borrower income/liabilities normalization.
- Consent capture.
- Application submission.
- Admin application review.
- Product matching.
- Selected products.
- Lender submission workflow.
