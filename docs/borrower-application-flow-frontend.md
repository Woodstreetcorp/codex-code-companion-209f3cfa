# Borrower Application Flow Frontend

## Purpose

The borrower portal now has a first-pass mortgage application workspace after the application
summary page. The flow is designed to keep borrowers inside the authenticated portal while showing
real lifecycle state where available and controlled empty states where backend fields are not yet
connected.

## Routes

- `/portal/applications`
- `/portal/applications/:applicationId`
- `/portal/applications/:applicationId/personal-details`
- `/portal/applications/:applicationId/borrowers`
- `/portal/applications/:applicationId/employment`
- `/portal/applications/:applicationId/income`
- `/portal/applications/:applicationId/assets`
- `/portal/applications/:applicationId/liabilities`
- `/portal/applications/:applicationId/credit`
- `/portal/applications/:applicationId/property`
- `/portal/applications/:applicationId/other-properties`
- `/portal/applications/:applicationId/mortgage-request`
- `/portal/applications/:applicationId/financing`
- `/portal/applications/:applicationId/documents`
- `/portal/applications/:applicationId/consents`
- `/portal/applications/:applicationId/review`

## Data Source

The workspace uses the borrower application save/restore API through
`src/lib/api/borrowerApplicationSectionsApi.ts`.

| Purpose              | Endpoint                                               |
| -------------------- | ------------------------------------------------------ |
| Workspace envelope   | `GET /v2/borrower/application/workspace`               |
| Section list         | `GET /v2/borrower/application/sections`                |
| Section restore      | `GET /v2/borrower/application/sections/{sectionKey}`   |
| Section save         | `PATCH /v2/borrower/application/sections/{sectionKey}` |
| Submission readiness | `GET /v2/borrower/application/submission-readiness`    |
| Submit application   | `POST /v2/borrower/application/submit`                 |

All calls use the shared Laravel session helper with `credentials: "include"` and CSRF handling for
mutating requests.

## Current Behavior

- `/portal/applications` remains the application summary page.
- The active application card opens `/portal/applications/:applicationId`.
- Each workspace section has status indicators: Not started, In progress, Completed, or Needs
  attention.
- Overall progress uses backend `progress.percent`, `completedSections`, and `totalSections`.
- Each editable section loads `effective_data` from the backend, hydrates available fields, and
  saves borrower-entered values with `intent: save` or `intent: save_and_continue`.
- Save keeps the borrower on the current section.
- Save and continue follows backend `next_step`.
- Refreshing a section restores saved backend values.
- The review page loads backend submission readiness and disables submit until `ready` is true.

## Section Key Mapping

Canonical borrower-facing section keys:

- `personal-details`
- `borrowers`
- `employment`
- `income`
- `assets`
- `liabilities`
- `credit`
- `property`
- `other-properties`
- `mortgage-request`
- `financing`
- `documents`
- `consents`
- `review`

Legacy frontend/backend compatibility aliases are still accepted by the API client where older
routes import them:

- `borrower_profile` maps to `personal-details`
- `assets_down_payment` maps to `assets`/`financing` depending on the calling context

## Documents And Consents

Documents are not saved into `mortgage_application_sections.data_json`. The documents section reads
dedicated document request data from the borrower document APIs and shows a controlled empty state
when no requests exist.

Consents are not saved into section JSON. The consents section uses
`GET /v2/borrower/application/consents` and `POST /v2/borrower/application/consents` for consent
decisions.

## Known Limitations

- Document upload controls are not embedded in the application section yet; the section currently
  shows request and status data from dedicated document APIs.
- The generic first-pass forms cover the available contract fields. Future PRs can replace them with
  richer per-section layouts without changing the API client.
- `/portal/application` remains as a compatibility route and now understands the expanded section
  vocabulary, but the primary workspace is `/portal/applications/:applicationId`.

## QA Checklist

- Confirm `/portal/applications` loads the real lifecycle application summary.
- Confirm the primary CTA opens `/portal/applications/:applicationId`.
- Confirm every section route loads inside the borrower portal shell.
- Confirm unauthenticated access redirects to `/login` with redirect preserved.
- Confirm no fake borrower names, fake application IDs, fake rates, or fake bundle values appear.
- Confirm section status indicators render without raw object errors.
- Save a section, refresh the browser, and confirm saved values restore.
- Confirm Save and continue follows backend `next_step`.
- Confirm Review & Submit shows completed, incomplete, and blocked readiness items.
- Confirm Submit is disabled when backend readiness fails.
- Confirm Review & Submit shows compliance-safe copy and does not imply approval.
