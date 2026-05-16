# Borrower Income and Liabilities Section Restore UI

## Component ownership

- Restore behavior lives in `src/components/hub/borrower-profile.tsx`.
- Income and Credit & Liabilities are embedded borrower profile sections, not standalone route pages.

## Route context

- The borrower profile hub renders through `src/routes/internal.full-application.tsx`.

## Restored section keys

- Income: `income`
- Credit & Liabilities: `liabilities`

## effective_data usage

- Both restore calls use `section.effective_data` as the primary restore source.
- Saved `section.data` is only used to determine whether the info banner should say restored from saved application data or pre-filled from qualification data.

## Income field mapping

The Income section restores:

- `no_income_declared` -> no-income checkbox.
- `income_sources` -> existing income source cards.
  - `id`
  - `type`
  - `source`
  - `jobTitle`
  - `startDate`
  - `grossIncome`
  - `frequency`
  - `verification`
  - `include`

## Liabilities field mapping

The Credit & Liabilities section restores:

- `no_liabilities_declared` -> no-liabilities checkbox.
- `credit_details` -> existing credit detail controls.
  - `creditScore`
  - `scoreSource`
  - `bankruptcy`
  - `bankruptcyType`
  - `bankruptcyActive`
  - `dischargedWhen`
- `liabilities` -> existing debt cards.
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

## Loading state behavior

- Income shows a non-blocking loading banner while `getBorrowerApplicationSection("income")` is pending.
- Credit & Liabilities shows a non-blocking loading banner while `getBorrowerApplicationSection("liabilities")` is pending.
- The form remains editable while restore is pending.

## Restore error behavior

- Restore failures show non-blocking error banners.
- The borrower can continue entering or editing values manually if restore fails.

## Dirty-edit protection

- Each section has an edit guard ref.
- Any local edit marks the section dirty.
- Late restore responses are ignored once a borrower has edited that section.

## QA and verification steps

1. Open the full application hub and enter a borrower profile.
2. Navigate to Employment & Income and confirm the loading banner appears while restore is pending.
3. Confirm saved or prefilled income values populate from `effective_data.income_sources`.
4. Edit Income before a delayed restore response resolves and confirm the late response does not overwrite the edit.
5. Navigate to Credit & Liabilities and confirm the loading banner appears while restore is pending.
6. Confirm saved or prefilled credit details and debt cards populate from `effective_data`.
7. Edit Credit & Liabilities before a delayed restore response resolves and confirm the late response does not overwrite the edit.
8. Simulate restore failure and confirm the section remains editable with the restore error banner shown.
9. Confirm Save Progress and Save & Continue still use section keys `income` and `liabilities`.

## Deferred items

- Standalone income route.
- Standalone liabilities route.
- Borrower profile section save UI.
- Field-specific validation.
- Normalized income/liability database tables.
- Co-borrower normalization.
- Consent capture.
- Application submission workflow.
- Admin review.
- Product matching.
- Selected products.
- Lender submission workflow.
- Document upload UI.
- Zoho WorkDrive.
- OCR.
- Virus scanning.
- Legacy/public deployment path changes.
- Unrelated TypeScript route fixes.
