# Borrower Application Review & Submit UI

## Route and Page

- Route: `/portal/application/review-submit`
- Page file: `src/routes/portal.application.review-submit.tsx`
- Workspace link: `src/routes/portal.application.tsx`
- API adapter: `src/lib/api/borrowerApplicationSubmissionApi.ts`

## Backend Endpoints

- `GET /v2/borrower/application/submission-readiness`
- `POST /v2/borrower/application/submit`

Both endpoints use the shared Laravel session helpers:

- `buildApiUrl`
- `fetchWithLaravelSession`

The submit POST goes through `fetchWithLaravelSession` so CSRF handling stays centralized.

## Readiness Response Mapping

The page loads readiness on mount and maps:

- `application_public_reference` to the application reference display.
- `ready` to the ready/not-ready badge and submit gating.
- `status` to the application status display.
- `blockers[]` to borrower-facing blocker cards.
- `sections_summary` to the Application sections summary panel.
- `consent_summary` to the Consents summary panel.
- `document_summary` to the Documents summary panel.
- `next_step` to a next-step guidance card.
- `message` to the readiness status copy.

All fields are treated as optional.

## Blocker Mapping

Each blocker card displays:

- `key`
- `label`
- `message`
- `route_hint`

When `route_hint` is present, the card links to that route. If no route hint is present, the UI derives a fallback:

- Consent blockers -> `/portal/application/consents`
- Document blockers -> `/portal/documents`
- Section blockers -> `/portal/application`

The page uses borrower-friendly framing:

"Before you can submit, please complete the items below."

It also clarifies:

"Submitting sends your application package to the approvU team for review. It is not a mortgage approval or lender commitment."

## Submit Behavior

Submission is enabled only when:

- Readiness says `ready: true`.
- No blockers are present.
- The borrower checks: "I confirm the information provided is accurate to the best of my knowledge."
- No submit request is already in progress.

On submit, the UI calls `submitBorrowerApplication()`.

On success, the UI shows a submitted confirmation with:

- Application public reference.
- Status.
- Submitted timestamp.
- Links back to `/portal/application`, `/portal/documents`, and `/portal/offers`.

On validation-style failure, the UI refreshes readiness and shows the returned blocker/error context. On other failures, it shows a non-blocking error message and leaves the page usable.

## Application Workspace Integration

`/portal/application` includes a Review & Submit card linking to `/portal/application/review-submit`. This preserves the existing workspace layout and does not change document, offer, or backend submission workflows.

## Manual QA Steps

1. Open `/portal/application`.
2. Confirm the Review & Submit card appears and links to `/portal/application/review-submit`.
3. Open `/portal/application/review-submit`.
4. Confirm loading and retry states work when readiness fails.
5. Confirm not-ready applications show blocker cards with action links.
6. Confirm summary panels render section, consent, and document readiness data.
7. Confirm Submit Application is disabled when not ready.
8. Confirm Submit Application is disabled until the confirmation checkbox is checked.
9. Submit a ready application and confirm the submitted confirmation state renders.
10. Confirm repeated submit clicks are blocked while submission is in progress.

## Deferred Items

- Real product matching.
- Selected products.
- Lender submission workflow.
- Co-borrower submission workflow.
- E-sign / Zoho Sign.
- Admin application review UI.
