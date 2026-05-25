# Borrower Staging Smoke Test Report

Use this template during live borrower staging smoke testing. Cross-reference
[borrower-staging-smoke-checklist.md](./borrower-staging-smoke-checklist.md) for the 30-minute smoke
flow.

## 1. Environment Details

| Field                                            | Value                      |
| ------------------------------------------------ | -------------------------- |
| Backend API URL                                  |                            |
| Frontend URL                                     |                            |
| API base env value (`VITE_APPROVU_API_BASE_URL`) |                            |
| Deployment mode                                  | Same-origin / Cross-origin |
| Backend environment                              |                            |
| Frontend branch / commit                         |                            |
| Backend branch / commit                          |                            |

## 2. Tester / Date

| Field             | Value                   |
| ----------------- | ----------------------- |
| Tester            |                         |
| Date              |                         |
| Start time        |                         |
| End time          |                         |
| Browser / version |                         |
| Device / OS       |                         |
| Viewports checked | Desktop / Mobile / Both |

## 3. PASS / FAIL / BLOCKED Summary

| Area                            | PASS | FAIL | BLOCKED | Notes |
| ------------------------------- | ---- | ---- | ------- | ----- |
| Public routes                   |      |      |         |       |
| Login / auth                    |      |      |         |       |
| Protected portal access         |      |      |         |       |
| Borrower portal summary         |      |      |         |       |
| Mortgage Snapshot display       |      |      |         |       |
| Home Life Bundle detail page    |      |      |         |       |
| Redemption UI                   |      |      |         |       |
| Logout / sign-out               |      |      |         |       |
| Mobile / responsive spot checks |      |      |         |       |
| CORS / session behavior         |      |      |         |       |
| Error states                    |      |      |         |       |
| Total                           |      |      |         |       |

Status key:

- PASS: expected result matched actual result.
- FAIL: expected result did not match actual result.
- BLOCKED: check could not be run because of missing access, dependency, data, or environment setup.

## 4. Smoke Test Checklist

| Check ID | Area                         | Expected Result                                                                              | Actual Result | Status | Notes |
| -------- | ---------------------------- | -------------------------------------------------------------------------------------------- | ------------- | ------ | ----- |
| BR-01    | Public routes                | Qualification start route loads without auth and without console errors.                     |               |        |       |
| BR-02    | Public routes                | Purchase, refinance, and pre-purchase flows can be started.                                  |               |        |       |
| BR-03    | Public routes                | Qualification submit creates or resumes a server-side qualification session.                 |               |        |       |
| BR-04    | Public routes                | Create-account route loads and preserves public reference handoff.                           |               |        |       |
| BR-05    | Login / auth                 | Login route loads, validates missing fields, and submits to the Laravel login endpoint.      |               |        |       |
| BR-06    | Login / auth                 | Valid credentials create an authenticated borrower session.                                  |               |        |       |
| BR-07    | Login / auth                 | Invalid credentials show a borrower-safe error.                                              |               |        |       |
| BR-08    | Protected portal access      | `/portal` blocks unauthenticated users or routes them to login.                              |               |        |       |
| BR-09    | Protected portal access      | Authenticated borrower can access `/portal`.                                                 |               |        |       |
| BR-10    | Borrower portal summary      | Portal summary shows borrower name/email and latest qualification context.                   |               |        |       |
| BR-11    | Borrower portal summary      | Portal sections for application, documents, offers, and Home Life Bundle render safely.      |               |        |       |
| BR-12    | Mortgage Snapshot display    | Snapshot displays before login after qualification completion.                               |               |        |       |
| BR-13    | Mortgage Snapshot display    | Snapshot summary displays in the authenticated portal when available.                        |               |        |       |
| BR-14    | Home Life Bundle detail page | Portal summary card links to the Home Life Bundle detail page.                               |               |        |       |
| BR-15    | Home Life Bundle detail page | Detail page shows assigned bundle, selected offers, and redeemable-code summary.             |               |        |       |
| BR-16    | Home Life Bundle detail page | Detail page does not expose internal IDs, admin-only fields, raw codes, or partner metadata. |               |        |       |
| BR-17    | Redemption UI                | Claim CTA is visible only when backend marks the code as redeemable.                         |               |        |       |
| BR-18    | Redemption UI                | Redeem request uses a public reference and returns a borrower-safe success or error state.   |               |        |       |
| BR-19    | Redemption UI                | Selected offers and redeemable-code summary refresh after redemption.                        |               |        |       |
| BR-20    | Logout / sign-out            | Sign-out calls backend logout and removes protected portal access.                           |               |        |       |
| BR-21    | Mobile / responsive          | Qualification, snapshot, login, portal, and bundle detail screens fit mobile viewport.       |               |        |       |
| BR-22    | CORS / session behavior      | Requests target staging API or relative `/v2` path; no localhost or production leakage.      |               |        |       |
| BR-23    | CORS / session behavior      | Authenticated requests include cookies and do not fail unexpectedly with 401 or 419.         |               |        |       |
| BR-24    | Error states                 | 401 shows login/session state; 419 shows session/refresh guidance.                           |               |        |       |
| BR-25    | Error states                 | 422 validation errors are borrower-safe and near the relevant form.                          |               |        |       |
| BR-26    | Error states                 | 500 or network failures show generic borrower-safe errors with no stack traces.              |               |        |       |

## 5. Public Routes

Record routes tested:

| Route                                 | Expected                                       | Actual | Status | Notes |
| ------------------------------------- | ---------------------------------------------- | ------ | ------ | ----- |
| `/`                                   | Public landing or borrower entry renders.      |        |        |       |
| `/start` or qualification start route | Borrower can begin qualification.              |        |        |       |
| `/create-account`                     | Account handoff page renders.                  |        |        |       |
| `/login`                              | Login page renders.                            |        |        |       |
| `/resume` if enabled                  | Resume page accepts public reference or token. |        |        |       |

## 6. Login / Auth

| Check         | Expected                                                               | Actual | Status | Notes |
| ------------- | ---------------------------------------------------------------------- | ------ | ------ | ----- |
| CSRF cookie   | `GET /v2/csrf-cookie` succeeds before mutating auth calls when needed. |        |        |       |
| Login success | `POST /v2/borrower/login` authenticates valid credentials.             |        |        |       |
| Login failure | Invalid credentials show a safe error.                                 |        |        |       |
| Session check | `GET /v2/borrower/me` confirms authenticated state.                    |        |        |       |

## 7. Protected Portal Access

| Check                  | Expected                                                    | Actual | Status | Notes |
| ---------------------- | ----------------------------------------------------------- | ------ | ------ | ----- |
| Unauthenticated portal | Protected portal route requires login.                      |        |        |       |
| Authenticated portal   | Portal loads with borrower-safe session data.               |        |        |       |
| Hard refresh           | Refreshing portal keeps session or routes cleanly to login. |        |        |       |

## 8. Borrower Portal Summary

| Check                     | Expected                                                   | Actual | Status | Notes |
| ------------------------- | ---------------------------------------------------------- | ------ | ------ | ----- |
| Borrower identity         | Name/email display safely.                                 |        |        |       |
| Latest qualification      | Latest public reference or qualification summary displays. |        |        |       |
| Application section       | Application CTA/status displays.                           |        |        |       |
| Documents section         | Documents CTA/status displays.                             |        |        |       |
| Offers / Home Life Bundle | Offers and bundle summary display safely.                  |        |        |       |

## 9. Mortgage Snapshot Display

| Check            | Expected                                              | Actual | Status | Notes |
| ---------------- | ----------------------------------------------------- | ------ | ------ | ----- |
| Before login     | Server snapshot displays after qualification.         |        |        |       |
| After login      | Portal snapshot summary matches latest qualification. |        |        |       |
| Missing snapshot | Empty or pending state is clear and safe.             |        |        |       |

## 10. Home Life Bundle Detail Page

| Check            | Expected                                                                | Actual | Status | Notes |
| ---------------- | ----------------------------------------------------------------------- | ------ | ------ | ----- |
| Summary          | Assigned bundle status and counts render.                               |        |        |       |
| Assignments      | Assignment list renders borrower-safe labels.                           |        |        |       |
| Selected offers  | Selected offers render borrower-safe detail.                            |        |        |       |
| Redeemable codes | Redeemable-code summary hides raw codes unless backend permits display. |        |        |       |
| Back navigation  | Back link returns to portal without session loss.                       |        |        |       |

## 11. Redemption UI

| Check           | Expected                                                         | Actual | Status | Notes |
| --------------- | ---------------------------------------------------------------- | ------ | ------ | ----- |
| CTA gating      | Claim CTA appears only when `redeemable` is true.                |        |        |       |
| Redeem request  | Request uses safe public reference only.                         |        |        |       |
| Success         | Success state displays safely and refreshes bundle data.         |        |        |       |
| Error           | Error state is borrower-safe and does not expose internals.      |        |        |       |
| Raw code safety | Raw/display code is shown only with explicit backend permission. |        |        |       |

## 12. Logout / Sign-Out

| Check             | Expected                                           | Actual | Status | Notes |
| ----------------- | -------------------------------------------------- | ------ | ------ | ----- |
| Logout request    | `POST /v2/borrower/logout` succeeds.               |        |        |       |
| Post-logout state | Portal content is no longer visible after logout.  |        |        |       |
| Back button       | Browser back does not expose stale protected data. |        |        |       |

## 13. Mobile / Responsive Spot Checks

| Viewport | Pages Checked                                         | Expected                               | Actual | Status | Notes |
| -------- | ----------------------------------------------------- | -------------------------------------- | ------ | ------ | ----- |
| 390 px   | Qualification, snapshot, login, portal, bundle detail | No horizontal overflow; CTAs tappable. |        |        |       |
| Tablet   | Portal and application workspace                      | Cards and tables remain usable.        |        |        |       |
| Desktop  | Full flow                                             | Layout remains stable.                 |        |        |       |

## 14. CORS / Session Behavior

| Check           | Expected                                              | Actual | Status | Notes |
| --------------- | ----------------------------------------------------- | ------ | ------ | ----- |
| API origin      | Requests use staging API or relative `/v2` path only. |        |        |       |
| Credentials     | Authenticated calls include cookies.                  |        |        |       |
| CSRF            | Mutating calls send `X-XSRF-TOKEN` when required.     |        |        |       |
| CORS            | Backend allows only the configured frontend origin.   |        |        |       |
| Cookie settings | Session cookie settings support staging HTTPS.        |        |        |       |

## 15. Error States

| Error           | Expected UI Behavior                             | Actual | Status | Notes |
| --------------- | ------------------------------------------------ | ------ | ------ | ----- |
| 401             | Route to login or show session-required message. |        |        |       |
| 419             | Show refresh/session guidance.                   |        |        |       |
| 422             | Show validation copy, not raw JSON.              |        |        |       |
| 500             | Show generic support-safe error.                 |        |        |       |
| Network failure | Preserve borrower context and allow retry.       |        |        |       |

## 16. Blockers

| ID   | Check ID | Description | Owner | Target Fix | Status |
| ---- | -------- | ----------- | ----- | ---------- | ------ |
| B-01 |          |             |       |            |        |

## 17. Non-Blocking Issues

| ID    | Check ID | Description | Priority | Follow-up |
| ----- | -------- | ----------- | -------- | --------- |
| NB-01 |          |             | P2 / P3  |           |

## 18. Screenshots / Evidence Links

| Check ID | Evidence Link | Notes |
| -------- | ------------- | ----- |
|          |               |       |

## 19. Final Recommendation

Choose one:

- GO: All smoke checks passed and no blockers remain.
- CONDITIONAL GO: No launch-blocking borrower issues remain; non-blocking issues are tracked.
- NO-GO: One or more blockers remain.

| Field                    | Value                       |
| ------------------------ | --------------------------- |
| Recommendation           | GO / CONDITIONAL GO / NO-GO |
| Blocker count            |                             |
| Non-blocking issue count |                             |
| Evidence attached        | Yes / No                    |
| Tester sign-off          |                             |
| Date                     |                             |

Final notes:

```text

```
