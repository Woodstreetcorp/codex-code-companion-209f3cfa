# Borrower More Information Response UI

## Route and page updated

- Route: `/portal/application`
- Main file: `src/routes/portal.application.tsx`
- API adapter: `src/lib/api/borrowerApplicationReviewRequestsApi.ts`

This PR extends the existing “Requests from approvU” panel so borrowers can respond to open more-information requests and mark them addressed.

## Backend endpoints used

- `GET /v2/borrower/application/review-requests`
- `POST /v2/borrower/application/review-requests/{publicReference}/respond`

The POST uses the shared Laravel session helpers:

- `buildApiUrl`
- `fetchWithLaravelSession`

CSRF handling remains inside `fetchWithLaravelSession`.

## Response payload

```json
{
  "response": "Optional borrower note",
  "mark_addressed": true
}
```

The response note is optional. The borrower must confirm they reviewed the request and updated the relevant information where needed before the action is enabled.

## Request card behavior

Open requests show:

- Request title.
- Request body or message.
- Related section key.
- Status.
- Created date.
- Action link to the related section or document area.
- Response textarea with placeholder: “Add a short note about what you updated...”
- Confirmation checkbox.
- `Mark as addressed` button.
- Per-card loading, success, and error states.

After a successful response, the workspace refreshes review requests and submission readiness so updated request counts and application status can display.

## Resolved state behavior

Resolved or closed requests:

- Show resolved styling.
- Show `resolved_at` when present.
- Show the borrower response if the backend returns `response` or `borrower_response`.
- Hide the response form and mark-addressed button.

## Route hints

Request action links use the existing section route mapping:

| Key                                     | Route                                                      |
| --------------------------------------- | ---------------------------------------------------------- |
| `borrower_profile`                      | `/portal/settings/profile`                                 |
| `property`                              | `/applications/current/property-financing/target-property` |
| `income`                                | `/applications/current/property-financing/purchase-plan`   |
| `assets_down_payment` or `down_payment` | `/applications/current/property-financing/down-payment`    |
| `liabilities`                           | `/applications/current/mortgage-request`                   |
| `documents`                             | `/portal/documents`                                        |
| `consents`                              | `/portal/application/consents`                             |

Unknown keys render without an action link.

## Defensive behavior

If the GET endpoint is unavailable, the PR 18B empty/unavailable panel remains in place.

If the POST endpoint fails or is unavailable, the request stays visible and the card shows:

> We could not mark this request as addressed right now. Please try again.

Requests without a `public_reference` show the response form disabled for submission with a note that a request reference is required.

## Manual QA

1. Open `/portal/application` with an open request and confirm the response textarea appears.
2. Confirm `Mark as addressed` is disabled until the confirmation checkbox is checked.
3. Add a response note and submit. Confirm the button shows a loading state.
4. Confirm requests and submission readiness refresh after success.
5. Confirm a backend `application_status` update, such as `advisor_review`, updates the workspace status copy.
6. Confirm a POST failure shows the non-blocking error and does not remove the request.
7. Confirm resolved requests do not show the response form.
8. Confirm returned borrower response text appears for resolved requests.
9. Confirm route hints navigate to the related section, documents, or consents.

## Deferred

- Threaded messaging.
- Email/SMS notifications.
- File-specific comments.
- Co-borrower request handling.
- Admin response review workflow.
- Lender packaging UI.
- Product matching.
