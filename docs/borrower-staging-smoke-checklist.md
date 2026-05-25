# Borrower Staging Smoke Checklist

This checklist is a 30-minute staging pass for the borrower launch path. It is intended to catch
broken routing, API integration failures, stale session handoff, and obvious responsive issues before
a deeper QA run.

## Setup

- Use a fresh browser profile or incognito window.
- Open DevTools before starting.
- Set the viewport once to desktop and once to mobile before sign-off.
- Confirm the frontend is pointed at the staging Laravel API.
- Keep the Network tab filtered to `v2/borrower`.

## 30-Minute Flow

| Time      | Area                           | Smoke Check                                                       | Expected Result                                                                                   |
| --------- | ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 0-3 min   | Qualification start            | Start purchase, refinance, or pre-purchase qualification.         | Flow renders without console errors and accepts borrower input.                                   |
| 3-6 min   | Qualification submit           | Complete required contact, consent, and qualification fields.     | Submit succeeds, backend returns a qualification token/reference, and borrower stays in the flow. |
| 6-9 min   | Mortgage Snapshot before login | Continue to the Mortgage Snapshot.                                | Server snapshot renders when available; fallback state is friendly if API fails.                  |
| 9-12 min  | Create account                 | Use the create-account handoff from the snapshot.                 | Account creation succeeds for a new email, or existing-user messaging points to login.            |
| 12-14 min | Login                          | Sign in with the staged borrower account.                         | Login succeeds, session is stored as temporary handoff only, and CTA points to the portal.        |
| 14-17 min | Portal shell                   | Open `/portal`.                                                   | Borrower name/email, latest qualification, snapshot summary, and placeholders render.             |
| 17-20 min | Application workspace          | Open the application workspace from the portal or primary action. | Workspace loads with expected sections and no blocking empty state.                               |
| 20-22 min | Section save/restore           | Update one application section, save, refresh, and reopen.        | Saved values restore from the backend or documented section state.                                |
| 22-24 min | Documents                      | Open documents from portal/application.                           | Upload/review UI renders; empty and uploaded states are safe and borrower-facing.                 |
| 24-25 min | Consents                       | Complete the consent/disclosure step if available.                | Required consent cannot be skipped; accepted consent persists after refresh.                      |
| 25-26 min | Review submit                  | Open review and submit the application.                           | Submit path validates missing fields, then shows success when complete.                           |
| 26-27 min | Submitted status               | Return to portal/application after submit.                        | Submitted status is visible and no editable-only CTA is misleading.                               |
| 27-28 min | Home Life Bundle summary       | Open portal Home Life Bundle card.                                | Summary loads with safe assigned/selected/redeemable counts or a clear empty state.               |
| 28-29 min | Home Life Bundle detail page   | Open `/portal/home-life-bundle`.                                  | Assigned bundle, selected offers, safe detail, and redeemable code summaries render.              |
| 29-30 min | Error states                   | Force one failed API call or use an expired reference.            | UI shows a friendly error and does not expose internal IDs or raw backend details.                |

## DevTools Network Checklist

- `POST /v2/borrower/qualification/*` returns success for the selected qualification path.
- `POST /v2/borrower/qualification/snapshot` returns a borrower-safe snapshot payload.
- `POST /v2/borrower/account-handoff` returns either `account_created` or
  `existing_user_login_required`.
- `POST /v2/borrower/login` includes credentials and returns borrower-safe user data.
- `GET /v2/borrower/portal` includes credentials and does not return `401` after login.
- Application, document, consent, review, submit, and Home Life Bundle requests do not expose
  internal IDs, admin-only fields, partner internal metadata, password data, token hashes, or raw
  redemption codes unless the backend explicitly permits display.
- `401` routes the borrower toward login.
- `419` shows a session/refresh message or allows a clean retry.
- `422` shows validation copy near the relevant form.
- `500` shows a generic support-friendly error, not a stack trace.

## DevTools Console Checklist

- No uncaught React errors.
- No route-tree or loader errors.
- No mixed-content or CORS errors.
- No missing Google Maps API key crash; address fallback remains usable.
- No sensitive tokens, hashes, raw codes, or internal identifiers are logged.

## Mobile Smoke

- Qualification fields fit in a 390px-wide viewport.
- Snapshot cards stack cleanly.
- Create-account and login forms are usable with the mobile keyboard.
- Portal cards, document cards, application sections, and Home Life Bundle cards do not overflow.
- Primary CTAs remain visible and tappable.

## Sign-Off

- Qualification creates a server session.
- Mortgage Snapshot is visible before login.
- Account creation or existing-user login path works.
- Portal shell shows the latest borrower state.
- Application workspace opens and saves at least one section.
- Documents, consents, review, submit, submitted status, and more-information states are reachable.
- Home Life Bundle summary and detail pages render safe borrower data.
- Error states for `401`, `419`, `422`, and `500` are acceptable for staging.
- DevTools Network and Console checks are clean enough for a deeper QA pass.
