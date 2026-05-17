# Borrower Submitted Status + Feedback UI

## Route and component ownership

- Workspace route: `/portal/application`
- Main file: `src/routes/portal.application.tsx`
- Review and submit route preserved: `/portal/application/review-submit`
- New adapter: `src/lib/api/borrowerApplicationReviewRequestsApi.ts`

This is a frontend-only change. It does not alter backend submission, document, product matching, offer, lender submission, or admin review workflows.

## Backend endpoints used

- `GET /v2/borrower/application/submission-readiness`
  - Existing PR 17B adapter: `getBorrowerApplicationSubmissionReadiness()`
  - Used on the workspace to read the current application status and public reference.
- `GET /v2/borrower/application/review-requests`
  - New adapter: `listBorrowerApplicationReviewRequests()`
  - Used defensively. If the endpoint returns `404`, the adapter returns an unavailable empty response so the workspace remains usable.

## Submitted status mapping

The workspace shows a submitted-status card when readiness status is one of:

| Status                       | Borrower-facing copy                                                        |
| ---------------------------- | --------------------------------------------------------------------------- |
| `borrower_submitted`         | Submitted to approvU for review.                                            |
| `advisor_review`             | Your application is being reviewed by the approvU team.                     |
| `needs_more_information`     | More information is needed before review can continue.                      |
| `ready_for_lender_packaging` | Your application is being prepared for lender packaging.                    |
| `submitted_to_lender`        | Your application has been submitted for lender review.                      |
| `approved`                   | Your application has an approval update. Your advisor will provide details. |
| `declined`                   | Your application has a review update. Your advisor will discuss next steps. |
| `withdrawn`                  | This application has been withdrawn.                                        |
| `closed`                     | This application is closed.                                                 |

The UI keeps the copy conservative and does not imply final mortgage approval, rates, lender commitment, or offer details.

## Status-specific actions

- `needs_more_information`: primary action is `Review Requested Items`, routed to the first open review request when a mapped route exists.
- `borrower_submitted` and `advisor_review`: primary action is `View Application Status`, routed to `/portal/application/review-submit`.
- `ready_for_lender_packaging`: primary action is `View Next Steps`, routed to `/portal/application/review-submit`.
- `submitted_to_lender`, `approved`, and `declined`: primary action is `View Application Status`.
- `withdrawn` and `closed`: no edit or submit CTA is shown in the submitted-status card.

This PR does not enable resubmission.

## Review request response mapping

Expected response shape:

```json
{
  "ok": true,
  "application_public_reference": "APP-123",
  "requests": [],
  "open_count": 0,
  "resolved_count": 0,
  "next_step": "string"
}
```

Each request card displays:

- `title`
- `body` or `message`
- `related_section_key`
- `status`
- `created_at`
- `resolved_at`

## Route hints

Review request action links map `related_section_key` as follows:

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

## Defensive endpoint behavior

If `GET /v2/borrower/application/review-requests` returns `404`, the adapter returns:

- `ok: false`
- `requests: []`
- `open_count: 0`
- `resolved_count: 0`
- `unavailable: true`

The workspace then shows a calm empty/unavailable state. Backend PR 19A or equivalent review-request support must be merged for live admin feedback data.

## Manual QA

1. Open `/portal/application` with no submitted application and confirm the normal workspace still loads.
2. Mock readiness status `borrower_submitted` and confirm the submitted status card appears.
3. Mock readiness status `advisor_review` and confirm the approvU review copy appears.
4. Mock readiness status `needs_more_information` with open review requests and confirm the request panel is prominent.
5. Confirm request route hints navigate to profile, property, income, down payment, liabilities, documents, and consents.
6. Mock `review-requests` returning `404` and confirm the page remains editable/usable with the unavailable empty state.
7. Confirm withdrawn and closed statuses do not show an edit/resubmit CTA.
8. Confirm `/portal/application/review-submit` still works for readiness and final submit flows.

## Deferred

- Reply/comment threads.
- Email/SMS notifications.
- Resubmission workflow.
- File-specific feedback.
- Co-borrower request handling.
- Lender packaging UI.
- Product matching.
