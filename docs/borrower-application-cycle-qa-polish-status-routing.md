# Borrower Application Cycle QA Polish + Status Routing

## Route updated

- Main workspace route: `/portal/application`
- Main file: `src/routes/portal.application.tsx`

This PR keeps the existing application workspace layout and polishes status routing, primary CTAs, request panel states, and recovery messaging.

## Status action matrix

| Status                       | Primary action                    | Route                                                       |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------- |
| `draft`                      | Continue Application              | `/portal/application`                                       |
| `in_progress`                | Continue Application              | `/portal/application`                                       |
| `documents_requested`        | Upload Documents                  | `/portal/documents`                                         |
| `borrower_submitted`         | View Submitted Application        | `/portal/application/review-submit`                         |
| `advisor_review`             | View Review Status                | `/portal/application/review-submit`                         |
| `needs_more_information`     | Review Requested Items            | First mapped open request route, else `/portal/application` |
| `ready_for_lender_packaging` | View Next Steps                   | `/portal/application/review-submit`                         |
| `submitted_to_lender`        | View Lender Review Status         | `/portal/application/review-submit`                         |
| `approved`                   | Contact Advisor / View Update     | `/portal/application/review-submit`                         |
| `declined`                   | Contact Advisor / View Next Steps | `/portal/application/review-submit`                         |
| `withdrawn`                  | View Application Status           | `/portal/application/review-submit`                         |
| `closed`                     | View Application Status           | `/portal/application/review-submit`                         |

The copy stays conservative and does not imply mortgage approval details, rates, or lender commitment.

## Request panel behavior

The “Requests from approvU” panel now:

- Shows open request count clearly.
- Shows resolved request count clearly.
- Shows the positive empty state: “No open requests right now.”
- Shows “Thanks — your response was sent to the approvU team.” after a borrower marks a request addressed.
- Refreshes review requests and submission readiness after a response.
- Uses backend `application_status` from response immediately where available.
- Shows resolved requests after open requests with lower visual priority.
- Preserves action links to the related section, document area, or consent page.

## Recovery states

- Endpoint unavailable: the request panel explains that requests could not be checked and keeps the workspace usable.
- Empty state: the request panel shows “No open requests right now.”
- Session expired: the workspace uses “Your session may have expired. Please sign in again.” and links to `/login`.
- Generic fetch error: the workspace shows a non-blocking retry-friendly message where possible and preserves the rest of the workspace when secondary request/status APIs fail.

## Route hints

| Key                                     | Route                                                      |
| --------------------------------------- | ---------------------------------------------------------- |
| `borrower_profile`                      | `/portal/settings/profile`                                 |
| `property`                              | `/applications/current/property-financing/target-property` |
| `income`                                | `/applications/current/property-financing/purchase-plan`   |
| `assets_down_payment` or `down_payment` | `/applications/current/property-financing/down-payment`    |
| `liabilities`                           | `/applications/current/mortgage-request`                   |
| `documents`                             | `/portal/documents`                                        |
| `consents`                              | `/portal/application/consents`                             |

Unknown request keys remain visible without an action link.

## Manual QA scenarios

1. Draft or in-progress application: `/portal/application` shows “Continue Application.”
2. Submitted application: status copy appears and the primary CTA says “View Submitted Application.”
3. `needs_more_information` with an open request: primary CTA says “Review Requested Items” and routes to the mapped item.
4. Borrower marks request addressed: card shows loading, then the panel shows “Thanks — your response was sent to the approvU team.”
5. `advisor_review` with no open requests: panel shows “No open requests right now” and primary CTA says “View Review Status.”
6. Review request endpoint unavailable: workspace remains usable and the request panel shows the unavailable state.
7. Session expired: workspace shows “Your session may have expired. Please sign in again.” with a `/login` link.

## Deferred

- Full automated E2E test suite.
- Threaded messaging.
- Email/SMS notifications.
- Co-borrower request handling.
- Lender packaging UI.
- Product matching.
