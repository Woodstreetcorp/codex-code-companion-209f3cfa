# Borrower Qualification API Adapter

Status: Frontend integration note for the Laravel V2 borrower qualification intake API.

## Configuration

Set the Laravel API base URL with:

```bash
VITE_APPROVU_API_BASE_URL=https://your-laravel-host.example
```

For same-origin deployments, the variable may be left empty and the adapter will post to relative `/v2/borrower/...` routes.

The adapter sends cookies with `credentials: "include"` and will include an `X-CSRF-TOKEN` header when a `csrf-token` meta tag is present. Cross-origin deployment still needs the Laravel host to allow the frontend origin and the intake routes to be configured for browser POSTs.

## Adapter

The adapter lives at:

```text
src/lib/api/borrowerQualificationApi.ts
```

It exposes:

- `submitPurchaseQualification`
- `submitRefinanceQualification`
- `submitPrePurchaseQualification`
- `submitQualification`

Each function posts the existing flow answers to the matching Laravel V2 endpoint:

- `POST /v2/borrower/qualification/purchase`
- `POST /v2/borrower/qualification/refinance`
- `POST /v2/borrower/qualification/pre-purchase`

## Flow Behavior

When a borrower completes the local question flow, the UI now shows a small contact and consent step before displaying the existing Mortgage Snapshot preview.

Required before submit:

- first name
- last name
- email
- consent checkbox

On success, the frontend stores the returned `qualification_session_token` and `public_reference` in `sessionStorage` under `approvu:qualification-session`. This is temporary handoff storage for the next PR and is not treated as the source of truth.

The existing Mortgage Snapshot UI and calculations remain local in this PR. Server-side Snapshot rendering is deferred.

## Mortgage Snapshot API Rendering

After qualification intake succeeds, the frontend now calls:

```text
POST /v2/borrower/qualification/snapshot
```

using the returned `qualification_session_token` and `public_reference`. The adapter lives at:

```text
src/lib/api/borrowerMortgageSnapshotApi.ts
```

It exposes:

- `generateMortgageSnapshot`
- `getMortgageSnapshot`
- `storeMortgageSnapshotHandoff`

When the API returns a Snapshot, the existing Mortgage Snapshot page shows the server-generated path, readiness status, key insights, missing items, next step, and public reference. The local browser calculation remains visible as a fallback/preview layer and is still used if the server Snapshot call fails.

The Snapshot public reference is stored temporarily in `sessionStorage` under `approvu:mortgage-snapshot` for future save/resume and account handoff work. This is handoff storage only; the Laravel Snapshot record remains the source of truth.

## Deferred

- Server-side Mortgage Snapshot rendering.
- Save/resume UI.
- Account creation/login handoff.
- Full borrower portal integration.
- Document upload.
- Product matching.
- Offer bundle display.
- Co-applicant consent.
