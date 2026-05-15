# Borrower Portal Shell

## Route

The authenticated borrower portal shell is available at:

`/portal`

The route reuses the existing TanStack `/portal` route and replaces the old mock overview with a backend-backed launch shell.

## Backend Endpoint

The page calls:

`GET /v2/borrower/portal`

The request uses the existing API base URL environment variable:

`VITE_APPROVU_API_BASE_URL`

Because Laravel uses the web session guard, the portal adapter sends requests with:

`credentials: "include"`

## API Adapter

The frontend adapter is:

`src/lib/api/borrowerPortalApi.ts`

It exports:

- `getBorrowerPortalSummary()`
- `storeBorrowerPortalSummary(result)`

The adapter stores a temporary handoff copy of the portal summary in sessionStorage under:

`approvu:borrower-portal-summary`

This is only a UI handoff cache. Laravel remains the source of truth.

## Page Behavior

The portal page:

- Loads the borrower portal summary on mount.
- Shows a loading state while the request is pending.
- Shows an unauthenticated/error state with a link to `/login` if the request fails.
- Renders borrower name and email.
- Renders latest qualification public reference, path, and state when available.
- Renders latest Mortgage Snapshot summary when available.
- Renders the backend `primary_action` as the continue CTA.
- Renders placeholder cards for documents, offers, and application.
- Provides a sign-out action using the existing borrower logout helper.

## Login Handoff

The existing login success CTA points to:

`/portal`

The success copy now describes the portal as the place to view the saved Mortgage Snapshot and next steps.

## Placeholder Sections

The page renders backend-provided placeholder sections when present:

- Documents
- Offers
- Application

If the backend omits a section, the frontend uses conservative fallback copy:

- Documents: document upload will be available in the next step.
- Offers: options will be reviewed after application details are complete.
- Application: the application workspace is being prepared.

No document upload, offer display, or application workflow is implemented in this PR.

## Manual QA

1. Sign in at `/login` with a borrower account that has a linked qualification.
2. Use the success CTA to continue to `/portal`.
3. Confirm the portal loads borrower name/email and the latest qualification reference.
4. Confirm a linked Mortgage Snapshot appears when the backend returns one.
5. Confirm documents, offers, and application render as placeholder cards.
6. Click sign out and confirm the browser returns to `/login`.
7. Open `/portal` without an authenticated Laravel session and confirm the error state links to `/login`.

## Deferred

- Document upload.
- Admin document review.
- Product matching.
- Offer bundle display.
- Full mortgage application workflow.
- Protected route framework.
- Co-applicant consent.
- Email verification.
- MFA.
- Password reset.
