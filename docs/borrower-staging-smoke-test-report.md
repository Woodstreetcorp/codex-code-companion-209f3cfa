# Borrower Staging Smoke Test Report

Fill in this template during the live staging smoke test session. Cross-reference
[borrower-staging-smoke-checklist.md](./borrower-staging-smoke-checklist.md) for the expected
30-minute flow and DevTools checks.

---

## 1. Environment Details

| Field                          | Value                      |
| ------------------------------ | -------------------------- |
| **Backend API URL**            |                            |
| **Frontend URL**               |                            |
| **APP_ENV**                    |                            |
| **VITE_APPROVU_API_BASE_URL**  |                            |
| **Deployment mode**            | Cross-origin / Same-origin |
| **Browser / Version**          |                            |
| **Device / OS**                |                            |
| **DevTools open**              | Yes / No                   |
| **Fresh browser profile used** | Yes / No                   |
| **Network tab filtered to**    | `v2/borrower`              |

---

## 2. Tester and Date

| Field                      | Value |
| -------------------------- | ----- |
| **Tester name**            |       |
| **Date**                   |       |
| **Start time**             |       |
| **End time**               |       |
| **Branch / commit tested** |       |

---

## 3. PASS / FAIL / BLOCKED Summary

| Area                            | PASS | FAIL | BLOCKED | N/A |
| ------------------------------- | ---- | ---- | ------- | --- |
| Public Routes                   |      |      |         |     |
| Login / Auth                    |      |      |         |     |
| Protected Portal Access         |      |      |         |     |
| Borrower Portal Summary         |      |      |         |     |
| Mortgage Snapshot Display       |      |      |         |     |
| Home Life Bundle Detail Page    |      |      |         |     |
| Redemption UI                   |      |      |         |     |
| Logout / Sign-Out               |      |      |         |     |
| Mobile / Responsive Spot Checks |      |      |         |     |
| CORS / Session Behavior         |      |      |         |     |
| Error States                    |      |      |         |     |
| **Total**                       |      |      |         |     |

> Status key: **PASS** = result matched expected. **FAIL** = result did not match.
> **BLOCKED** = check could not be run (dependency missing, access error, etc.).
> **N/A** = not applicable to this staging configuration.

---

## 4. Smoke Test Checklist

### 4.1 Public Routes

Covers the qualification intake, Mortgage Snapshot before login, and account handoff. These routes
are unauthenticated and must be reachable without a session.

| ID    | Area                       | Expected Result                                                                                                                                                                     | Actual Result | Status | Notes |
| ----- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| SC-01 | Qualification start        | Qualification start page renders without console errors; purchase, refinance, and pre-purchase paths are reachable.                                                                 |               |        |       |
| SC-02 | Qualification submit       | `POST /v2/borrower/qualification/{type}` succeeds with valid input; backend returns a qualification token or reference; borrower stays in flow.                                     |               |        |       |
| SC-03 | Mortgage Snapshot (public) | `POST /v2/borrower/qualification/snapshot` returns a borrower-safe snapshot; server-rendered snapshot card displays correctly before login.                                         |               |        |       |
| SC-04 | Snapshot resume            | `GET /v2/borrower/qualification/snapshot/{publicReference}` returns the correct snapshot; link-based resume does not error.                                                         |               |        |       |
| SC-05 | Account handoff — new user | `POST /v2/borrower/account-handoff` with a new email returns `account_created`; borrower is directed to set a password or proceed to the portal.                                    |               |        |       |
| SC-06 | Account handoff — existing | `POST /v2/borrower/account-handoff` with an existing email returns `existing_user_login_required`; borrower is directed to login without revealing whether the email is registered. |               |        |       |

---

### 4.2 Login / Auth

| ID    | Area                         | Expected Result                                                                                                                                 | Actual Result | Status | Notes |
| ----- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| SC-07 | CSRF cookie                  | `GET /v2/csrf-cookie` is called before login; `XSRF-TOKEN` cookie is set.                                                                       |               |        |       |
| SC-08 | Login success                | `POST /v2/borrower/login` with valid credentials returns borrower-safe user data; session cookie set with `Secure`, `HttpOnly`, and `SameSite`. |               |        |       |
| SC-09 | Login failure                | Invalid credentials return a borrower-facing error message; no raw 422 JSON or stack trace reaches the UI.                                      |               |        |       |
| SC-10 | Auth guard — unauthenticated | Loading `/portal` without a session redirects to login or shows a clear unauthenticated state; no admin-only data is returned.                  |               |        |       |

---

### 4.3 Protected Portal Access

Covers the authenticated zone including the application workspace, section save/restore, document
upload, consents, review, and submit flows.

| ID    | Area                   | Expected Result                                                                                                                                         | Actual Result | Status | Notes |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| SC-11 | Portal shell load      | `GET /v2/borrower/portal` returns 200 with credentials; portal shell shows borrower name, email, latest qualification, and snapshot summary.            |               |        |       |
| SC-12 | Application workspace  | Application workspace loads with expected sections and no blocking empty state; `GET /v2/borrower/application` returns the in-progress application.     |               |        |       |
| SC-13 | Section save / restore | Updating one section fires `PATCH /v2/borrower/application/sections/{sectionKey}`; refreshing the page and reopening the section restores saved values. |               |        |       |
| SC-14 | Document upload        | `POST /v2/borrower/documents` accepts a file upload; uploaded file appears in `GET /v2/borrower/documents`; upload and review states are borrower-safe. |               |        |       |
| SC-15 | Document requests      | `GET /v2/borrower/document-requests` returns any pending requests; items display labels and required-by context, not internal IDs.                      |               |        |       |
| SC-16 | Consent / disclosure   | Consent step renders required disclosures; `POST /v2/borrower/application/consents` stores acceptance; accepted consent persists after page refresh.    |               |        |       |
| SC-17 | Submission readiness   | `GET /v2/borrower/application/submission-readiness` returns actionable missing-field feedback; incomplete form does not submit.                         |               |        |       |
| SC-18 | Application submit     | `POST /v2/borrower/application/submit` succeeds when complete; success state renders without exposing internal application IDs or admin fields.         |               |        |       |
| SC-19 | Submitted status       | Returning to the portal or application after submission shows submitted status; editable-only CTAs are hidden or disabled.                              |               |        |       |

---

### 4.4 Borrower Portal Summary

| ID    | Area                 | Expected Result                                                                                                                                            | Actual Result | Status | Notes |
| ----- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| SC-20 | Portal cards render  | Portal page shows the latest borrower qualification, application state, document count, and Home Life Bundle summary without internal IDs or admin fields. |               |        |       |
| SC-21 | Offer review status  | `GET /v2/borrower/offer-review-status` returns borrower-safe review state; status card reflects the correct phase (pending, in-review, completed).         |               |        |       |
| SC-22 | Product match status | `GET /v2/borrower/application/product-match-status` renders match state or a safe pending/empty placeholder; no admin match details leak.                  |               |        |       |
| SC-23 | Empty state safety   | A borrower with no application or no bundle assignment sees a safe empty state on each portal card, not a blank page or JS error.                          |               |        |       |

---

### 4.5 Mortgage Snapshot Display

| ID    | Area                  | Expected Result                                                                                                                                        | Actual Result | Status | Notes |
| ----- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------ | ----- |
| SC-24 | Snapshot before login | Server snapshot card renders with borrower-safe summary fields when reached from the qualification flow before account creation.                       |               |        |       |
| SC-25 | Snapshot after login  | Snapshot summary is visible inside the portal shell; values match the latest qualification reference.                                                  |               |        |       |
| SC-26 | Snapshot fallback     | When the API is unavailable or returns an error, a friendly fallback state renders; no raw error details or internal references are shown.             |               |        |       |
| SC-27 | Snapshot field safety | Snapshot display does not include internal IDs, admin override values, partner metadata, or raw engine output beyond what is explicitly borrower-safe. |               |        |       |

---

### 4.6 Home Life Bundle Detail Page

| ID    | Area                    | Expected Result                                                                                                                                                                                 | Actual Result | Status | Notes |
| ----- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| SC-28 | Summary card on portal  | `GET /v2/borrower/home-life-bundle/summary` returns assigned, selected, and redeemable counts; portal card shows these or a clear empty/unassigned state.                                       |               |        |       |
| SC-29 | Detail page loads       | `/portal/home-life-bundle` renders the assigned bundle status, selected offers list, and redeemable code summary without console errors.                                                        |               |        |       |
| SC-30 | Assignments list        | `GET /v2/borrower/home-life-bundle/assignments` returns offer assignment rows; no internal assignment IDs, partner-internal fields, or admin metadata appear in the UI.                         |               |        |       |
| SC-31 | Selected offers list    | `GET /v2/borrower/home-life-bundle/selected-offers` returns selected offer rows with borrower-safe labels, statuses, and descriptions only.                                                     |               |        |       |
| SC-32 | Redeemable code summary | `GET /v2/borrower/home-life-bundle/redeemable-codes/summary` returns the count and state of redeemable codes; raw code values are not shown unless the backend marks them as display-permitted. |               |        |       |
| SC-33 | Offer detail            | `GET /v2/borrower/home-life-bundle/offers/{publicReference}` returns borrower-safe offer description and CTA context; no admin-only fields appear.                                              |               |        |       |
| SC-34 | Claim CTA visibility    | The claim CTA is shown only when the backend marks a code as `redeemable`; codes that are pending, used, or revoked do not show a claim button.                                                 |               |        |       |
| SC-35 | Back navigation         | The detail page links back to `/portal`; navigation does not trigger a JS crash or session drop.                                                                                                |               |        |       |

---

### 4.7 Redemption UI

| ID    | Area                     | Expected Result                                                                                                                                                                              | Actual Result | Status | Notes |
| ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| SC-36 | Redeem request           | `POST /v2/borrower/home-life-bundle/redeemable-codes/{publicReference}/redeem` fires with the public reference only; no internal IDs are sent in the request body or URL.                    |               |        |       |
| SC-37 | Redemption success state | A successful redemption response shows a borrower-safe success message or code reveal if backend permits; summary, assignments, selected offers, and code summary all refresh automatically. |               |        |       |
| SC-38 | Already-redeemed guard   | Attempting to redeem an already-redeemed code shows a safe status message; the UI does not crash or expose the raw duplicate-redemption error.                                               |               |        |       |
| SC-39 | Redemption auth guard    | Calling the redemption endpoint without a session returns 401; the borrower is directed to login, not left on a broken page.                                                                 |               |        |       |

---

### 4.8 Logout / Sign-Out

| ID    | Area                 | Expected Result                                                                                                            | Actual Result | Status | Notes |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| SC-40 | Logout request       | `POST /v2/borrower/logout` fires with credentials and clears the backend session.                                          |               |        |       |
| SC-41 | Post-logout redirect | After logout the borrower is redirected to login or the public landing; no protected portal data remains visible.          |               |        |       |
| SC-42 | Session invalidation | Navigating back to `/portal` after logout returns a 401 from the backend and shows the login state, not stale portal data. |               |        |       |

---

### 4.9 Mobile / Responsive Spot Checks

Set viewport to 390 px wide before running this section.

| ID    | Area                         | Expected Result                                                                                                                         | Actual Result | Status | Notes |
| ----- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| SC-43 | Qualification form           | Qualification fields fit the 390 px viewport; no horizontal scroll, no field overlap, and the keyboard does not obscure the submit CTA. |               |        |       |
| SC-44 | Snapshot cards               | Snapshot cards stack cleanly; text does not overflow card boundaries.                                                                   |               |        |       |
| SC-45 | Login / create-account forms | Login and create-account forms are fully usable with the mobile keyboard; no field or button is clipped off-screen.                     |               |        |       |
| SC-46 | Portal cards                 | Portal cards, document cards, and application section rows do not overflow or overlap at 390 px.                                        |               |        |       |
| SC-47 | Home Life Bundle cards       | Home Life Bundle summary and detail cards stack cleanly; claim CTAs are tappable at mobile size.                                        |               |        |       |
| SC-48 | Primary CTAs visible         | Primary CTAs remain visible and tappable throughout the qualification-to-portal flow at 390 px.                                         |               |        |       |

---

### 4.10 CORS / Session Behavior

| ID    | Area                        | Expected Result                                                                                                                                                                          | Actual Result | Status | Notes |
| ----- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| SC-49 | CORS preflight              | `OPTIONS /v2/borrower/login` with `Origin: <staging-frontend-url>` returns `Access-Control-Allow-Origin: <staging-frontend-url>` (not `*`) and `Access-Control-Allow-Credentials: true`. |               |        |       |
| SC-50 | No localhost leakage        | Network tab shows zero requests sent to `localhost`, a mock host, or a production host during the staging session.                                                                       |               |        |       |
| SC-51 | Session cookie flags        | Session cookie includes `Secure`, `HttpOnly`, and `SameSite` attributes; no session cookie is transmitted over plain HTTP.                                                               |               |        |       |
| SC-52 | CSRF token flow             | Mutating requests (login, section save, document upload, consents, submit, redeem) each send `X-XSRF-TOKEN`; no mutating request receives a `419`.                                       |               |        |       |
| SC-53 | Credentials on portal calls | `GET /v2/borrower/portal` and all authenticated requests include `credentials: "include"`; no 401 appears on authenticated routes after a successful login.                              |               |        |       |
| SC-54 | 401 session recovery        | An expired or cleared session returns 401 from the backend; the UI redirects to login or shows a session-expired prompt without hanging or looping.                                      |               |        |       |

---

### 4.11 Error States

| ID    | Area                    | Expected Result                                                                                                                                              | Actual Result | Status | Notes |
| ----- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------ | ----- |
| SC-55 | 401 — unauthenticated   | A 401 response routes the borrower toward login; no protected page content is partially rendered before the redirect.                                        |               |        |       |
| SC-56 | 419 — CSRF / session    | A 419 response shows a session or refresh message; the borrower can retry without losing context.                                                            |               |        |       |
| SC-57 | 422 — validation        | A 422 response surfaces field-level or page-level validation copy near the relevant form input; raw JSON body is not rendered in the viewport.               |               |        |       |
| SC-58 | 500 — server error      | A 500 response shows a generic borrower-safe support message; no stack trace, file path, SQL query, or internal reference leaks to the UI or console.        |               |        |       |
| SC-59 | Expired reference       | Navigating to a snapshot or offer reference that no longer exists shows a friendly not-found or expired state, not a blank page or uncaught JS error.        |               |        |       |
| SC-60 | Hard refresh mid-flow   | Force-refreshing during an active application or bundle flow restores the correct page state or redirects cleanly; no JS crash or partial render occurs.     |               |        |       |
| SC-61 | Google Maps key missing | If `VITE_GOOGLE_MAPS_API_KEY` is absent or invalid, the address field falls back to a plain text input; the page does not crash and the form remains usable. |               |        |       |

---

## 5. Blockers

> List any failures that prevent the staging deployment from being considered safe for continued
> testing. Each blocker must be resolved before a GO recommendation is issued.

| #    | Check ID | Area | Description | Assigned to | Resolved |
| ---- | -------- | ---- | ----------- | ----------- | -------- |
| B-01 |          |      |             |             | Yes / No |
| B-02 |          |      |             |             | Yes / No |

_Add rows as needed. Remove placeholder rows if no blockers are found._

---

## 6. Non-Blocking Issues

> List any failures or observations that do not block deployment but must be tracked and resolved
> before production launch.

| #     | Check ID | Area | Description | Priority | Ticket / Follow-up |
| ----- | -------- | ---- | ----------- | -------- | ------------------ |
| NB-01 |          |      |             | P2 / P3  |                    |
| NB-02 |          |      |             | P2 / P3  |                    |

_Add rows as needed. Remove placeholder rows if none found._

---

## 7. Screenshots / Evidence

> Attach screenshots, HAR exports, or console recordings for every FAIL or BLOCKED result. Use file
> names that include the check ID (e.g. `SC-37-redemption-success-state.png`).

| Check ID | File / Link | Description |
| -------- | ----------- | ----------- |
|          |             |             |

---

## 8. Final Recommendation

| Field                                    | Value    |
| ---------------------------------------- | -------- |
| **All MUST checks passed**               | Yes / No |
| **Blocker count**                        |          |
| **Non-blocking issue count**             |          |
| **DevTools Network clean**               | Yes / No |
| **DevTools Console clean**               | Yes / No |
| **CORS / session verified**              | Yes / No |
| **Mobile spot checks passed**            | Yes / No |
| **No sensitive data leaked to borrower** | Yes / No |

### Verdict

> Choose one and delete the others.

**GO** — All smoke checks pass. No blockers. Non-blocking issues are tracked. Staging deployment is
confirmed safe for continued borrower QA.

**CONDITIONAL GO** — No P1 blockers. One or more non-blocking issues are open and tracked. Staging
deployment may proceed; issues must be resolved before production launch.

**NO-GO** — One or more blockers are unresolved. Do not proceed to further staging or production
deployment until blockers are cleared and this report is re-run.

---

### Sign-Off

| Field               | Value |
| ------------------- | ----- |
| **Tester**          |       |
| **QA lead review**  |       |
| **Date signed off** |       |

---

_Related documents:_
_[borrower-staging-smoke-checklist.md](./borrower-staging-smoke-checklist.md) — 30-minute flow and DevTools checks_
_[borrower-frontend-staging-environment.md](./borrower-frontend-staging-environment.md) — Staging environment variable setup_
_[home-life-bundle-detail-page.md](./home-life-bundle-detail-page.md) — Home Life Bundle page scope and safe field policy_
