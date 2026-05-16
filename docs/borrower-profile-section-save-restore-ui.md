# Borrower Profile Section Save/Restore UI

## Component and Route

- Component: `src/components/hub/borrower-profile.tsx`
- Route context: `src/routes/internal.full-application.tsx`
- Render path: the full application hub renders the mortgage application workspace, which embeds `BorrowerProfilePage`.

## Backend Endpoints

- `GET /v2/borrower/application/sections/borrower_profile`
- `PATCH /v2/borrower/application/sections/borrower_profile`
- `POST /v2/borrower/application/sections/borrower_profile/initialize` is supported by the shared adapter for future initialize-first flows.

## Section Key

- `borrower_profile`

## Saved Payload Shape

The UI saves only fields already present in the borrower profile form:

```json
{
  "borrower_id": "string",
  "borrower_name": "string",
  "primary_applicant": {
    "first_name": "string",
    "middle_name": "string",
    "last_name": "string",
    "preferred_name": "string",
    "email": "string",
    "phone": "string",
    "alternate_phone": "string",
    "date_of_birth": "string",
    "marital_status": "string",
    "dependents": "string",
    "residency_status": "string",
    "contact_preference": "string",
    "role": "string"
  },
  "address": {
    "street_address": "string",
    "unit": "string",
    "city": "string",
    "province": "string",
    "postal_code": "string",
    "country": "string",
    "housing_status": "string",
    "years_at_address": "string",
    "months_at_address": "string",
    "monthly_housing_payment": "string",
    "mailing_same": true
  },
  "participation": {
    "on_title": "yes | no | empty",
    "on_mortgage": "yes | no | empty",
    "provides_income": "yes | no | empty",
    "provides_down_payment_assets": "yes | no | empty",
    "debts_included": "yes | no | empty",
    "occupying_property": "yes | no | empty"
  }
}
```

## Restore Mapping

The page calls `getBorrowerApplicationSection("borrower_profile")` when the borrower profile component loads.

- `section.effective_data.primary_applicant` restores the personal, contact, and role fields.
- If `primary_applicant` is absent, root-level `effective_data` fields are accepted as a compatibility fallback.
- `section.effective_data.address` restores the current address fields.
- `section.effective_data.participation` restores the yes/no application participation answers.

## Effective Data Behavior

- When `section.data` is present, the UI shows: "Restored from your saved application."
- When no saved `data` exists but `prefill_data`/`effective_data` exists, the UI shows: "Pre-filled from your qualification answers. Please review and save."
- Save Progress writes `status: "in_progress"` with `current_step: "borrower_profile"`.
- Save & Continue writes `status: "complete"` with `current_step: "borrower_profile"` and preserves existing navigation.

## Unsaved Edit Protection

The component tracks local profile edits with a dirty ref. If a restore API response returns after the borrower starts typing, the response is ignored so active edits are not overwritten.

## Restore Error Behavior

If restore fails, the form remains editable and the UI shows:

"We could not restore your saved profile details. You can continue entering them manually."

Save errors use the existing section save banner:

"We could not save this section right now. Please try again."

## Manual QA Steps

1. Open the full application hub and enter the borrower profile section.
2. Confirm saved profile data restores from `effective_data`.
3. Confirm prefilled qualification/profile data displays the prefill banner when no saved data exists.
4. Edit a restored personal field and confirm the footer changes to an unsaved profile state.
5. Click Save Progress from the About or Address section and confirm a PATCH uses `status: "in_progress"`.
6. Click Save & Continue from About or Address and confirm a PATCH uses `status: "complete"` before navigating.
7. Simulate a restore failure and confirm the form stays editable.
8. Type into a field while restore is pending and confirm the late response does not replace the typed value.

## Deferred Items

- Co-borrower profile normalization.
- Field-specific validation.
- Normalized borrower profile tables.
- Consent capture.
- Application submission.
- Admin application review.
- Product matching.
- Selected products.
- Lender submission workflow.
