# Borrower Consent Capture UI

## Route and Page

- Route: `/portal/application/consents`
- File: `src/routes/portal.application.consents.tsx`
- Workspace link: `src/routes/portal.application.tsx`
- API adapter: `src/lib/api/borrowerApplicationConsentsApi.ts`

## Backend Endpoints

- `GET /v2/borrower/application/consents`
- `POST /v2/borrower/application/consents`

Both calls use the shared Laravel session helpers:

- `buildApiUrl`
- `fetchWithLaravelSession`

POST requests go through `fetchWithLaravelSession` so Laravel CSRF handling remains centralized.

## Consent Types

- `privacy`
- `electronic_communication`
- `document_collection`
- `credit_bureau`
- `lender_sharing`
- `application_submission`

## Displayed Consent Text

Version: `v1`

Privacy Consent:
"You agree that approvU may collect, use, and store your personal information to support your mortgage application."

Electronic Communication Consent:
"You agree to receive application-related communications electronically."

Document Collection Consent:
"You agree that approvU may collect and review documents you upload for your mortgage application."

Credit Bureau Consent:
"You authorize approvU or its authorized mortgage professionals to obtain and review credit information where required for mortgage assessment."

Lender Sharing Consent:
"You agree that your application information and supporting documents may be shared with suitable lenders or service providers for mortgage review."

Application Submission Consent:
"You confirm that the information you provide is accurate to the best of your knowledge and may be used to prepare your mortgage application for review."

Final consent wording should be reviewed by the approvU team before public launch.

## Versioning Behavior

The frontend submits `consent_version: "v1"` with the exact text shown on the consent card. Existing backend consent records may display their returned `consent_version`; otherwise the UI shows `v1`.

## Accept Behavior

Each card has an "I agree" action. Accepting a consent posts:

```json
{
  "consent_type": "privacy",
  "accepted": true,
  "consent_version": "v1",
  "consent_text": "Exact consent text shown in the card"
}
```

After a successful POST, the page stores the returned consent summary and refreshes the consent list. Accepted consents show an accepted state and disable the action button. If a POST fails, the card shows a non-blocking error and remains actionable.

## Summary and Readiness

The page displays:

- Accepted count across the six required consent types.
- Backend `consent_summary` counts when present.
- Backend `consent_ready`.
- Backend `next_step` guidance when present.

The application workspace also shows a consent card that links to `/portal/application/consents` and displays readiness when the consent API loads successfully. Consent API failures do not block the main workspace.

## Manual QA Steps

1. Open `/portal/application`.
2. Confirm the Application consents card appears and links to `/portal/application/consents`.
3. Open `/portal/application/consents`.
4. Confirm loading and retry states work by simulating a failed GET.
5. Confirm all six consent cards render with version `v1`.
6. Click "I agree" on a pending consent and confirm the POST payload contains `accepted: true`, `consent_version: "v1"`, and the exact displayed text.
7. Confirm the page refreshes after successful save.
8. Confirm accepted cards show the accepted state.
9. Confirm `consent_ready`, `consent_summary`, and `next_step` display when returned by the backend.

## Deferred Items

- Legal-reviewed final wording.
- Decline UI.
- Revoke UI.
- Co-borrower consent.
- E-sign integration.
- Zoho Sign.
- Application submission UI.
- Admin consent review UI.
