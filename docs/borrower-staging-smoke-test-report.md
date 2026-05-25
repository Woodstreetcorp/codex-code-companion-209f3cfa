# Borrower Staging Smoke Test Report

Executed live borrower staging smoke test. Cross-reference
[borrower-staging-smoke-checklist.md](./borrower-staging-smoke-checklist.md) for the 30-minute smoke
flow.

## 1. Environment Details

| Field                                            | Value                                                                                                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend API URL                                  | Not confirmed. `.com` candidates checked: `https://app.approvu.com/v2/health`, `https://api.approvu.com/v2/health`, `https://api-staging.approvu.com/v2/health`, `https://api.staging.approvu.com/v2/health` |
| Frontend URL                                     | Candidate tested: `https://app.approvu.com`                                                                                                                                                                  |
| API base env value (`VITE_APPROVU_API_BASE_URL`) | Not visible from deployed app; local `.env.example` supports blank same-origin or cross-origin Laravel API origin.                                                                                           |
| Deployment mode                                  | Not confirmed                                                                                                                                                                                                |
| Backend environment                              | Not confirmed; no Laravel `/v2/health` JSON response found.                                                                                                                                                  |
| Frontend branch / commit                         | Not verifiable from live frontend. Local repo at test time: `main` / `2577fe9`                                                                                                                               |
| Backend branch / commit                          | Not verifiable from live API.                                                                                                                                                                                |
| Credentials used                                 | None                                                                                                                                                                                                         |
| Test method                                      | Read-only HTTP probes only; no login credentials, no mutations, no destructive actions.                                                                                                                      |

## 2. Tester / Date

| Field             | Value                                     |
| ----------------- | ----------------------------------------- |
| Tester            | Codex                                     |
| Date              | 2026-05-24                                |
| Start time        | 2026-05-24T23:24:33-04:00                 |
| End time          | 2026-05-24T23:24:33-04:00                 |
| Browser / version | Not reached; HTTP probes from PowerShell. |
| Device / OS       | Windows local test environment            |
| Viewports checked | Not run                                   |

## 3. PASS / FAIL / BLOCKED Summary

| Area                            | PASS | FAIL | BLOCKED | NOT RUN | Notes                                                                                       |
| ------------------------------- | ---- | ---- | ------- | ------- | ------------------------------------------------------------------------------------------- |
| Public routes                   | 0    | 4    | 0       | 0       | Root redirects, transaction entry returns 500, expected public routes return 404/301.       |
| Qualification start route       | 0    | 2    | 0       | 0       | `/transaction-start.php` returns 500; `/start` returns 404.                                 |
| Login / auth                    | 0    | 1    | 2       | 0       | `/login` returns 404; credentialed login was blocked because no credentials were used.      |
| CSRF cookie behavior            | 0    | 1    | 0       | 0       | `/v2/csrf-cookie` on `app.approvu.com` returns 404 HTML.                                    |
| Session cookie behavior         | 0    | 0    | 1       | 0       | Blocked by missing login route/API origin and no credentials.                               |
| Protected portal access         | 0    | 1    | 1       | 0       | `/portal` returns 404; authenticated portal check blocked.                                  |
| Borrower portal summary         | 0    | 0    | 1       | 0       | Blocked by missing portal route/API origin and no authenticated session.                    |
| Mortgage Snapshot display       | 0    | 0    | 1       | 0       | Blocked by failed qualification entry and unconfirmed snapshot API.                         |
| Home Life Bundle detail page    | 0    | 1    | 1       | 0       | `/portal/home-life-bundle` returns 404; authenticated bundle data check blocked.            |
| Redemption UI                   | 0    | 0    | 1       | 1       | Blocked by missing authenticated portal/bundle data; no safe redemption mutation attempted. |
| Logout / sign-out               | 0    | 0    | 1       | 0       | Blocked by no authenticated session.                                                        |
| Mobile / responsive spot checks | 0    | 0    | 0       | 1       | Not practical until frontend routes load.                                                   |
| CORS / session behavior         | 0    | 1    | 1       | 0       | API health/csrf not confirmed; API DNS candidates failed.                                   |
| Error states                    | 0    | 0    | 1       | 0       | UI error states could not be evaluated because routes did not load.                         |
| Console / network errors        | 0    | 0    | 0       | 1       | Browser DevTools checks not run because candidate frontend routes were unavailable.         |
| Total                           | 0    | 11   | 11      | 3       | **NO-GO** until borrower frontend and Laravel API staging origins are confirmed.            |

Status key:

- PASS: expected result matched actual result.
- FAIL: expected result did not match actual result.
- BLOCKED: check could not be run because of missing access, dependency, data, or environment setup.
- NOT RUN: intentionally skipped because it requires credentials, safe test data, browser route access, or
  non-read-only behavior.

## 4. Live URL Probe Results

| URL                                               | HTTP / DNS Result     | Content Type                    | Redirect / Evidence                                   | Status  | Notes                                                                   |
| ------------------------------------------------- | --------------------- | ------------------------------- | ----------------------------------------------------- | ------- | ----------------------------------------------------------------------- |
| `https://app.approvu.com`                         | HTTP 302              | `text/html; charset=UTF-8`      | Redirects to `transaction-start.php`.                 | FAIL    | Host responds, but does not directly serve the Vite borrower app shell. |
| `https://app.approvu.com/transaction-start.php`   | HTTP 500              | `text/html; charset=UTF-8`      | Empty body returned by probe.                         | FAIL    | Likely borrower transaction entry is currently server-erroring.         |
| `https://app.approvu.com/start`                   | HTTP 404              | `text/html; charset=iso-8859-1` | Empty body returned by probe.                         | FAIL    | Expected borrower start route not available.                            |
| `https://app.approvu.com/qualification`           | HTTP 301              | `text/html; charset=iso-8859-1` | Redirects to `http://app.approvu.com/qualification/`. | FAIL    | HTTPS path downgrades to HTTP slash URL.                                |
| `https://app.approvu.com/create-account`          | HTTP 404              | `text/html; charset=iso-8859-1` | Empty body returned by probe.                         | FAIL    | Account handoff route not available.                                    |
| `https://app.approvu.com/login`                   | HTTP 404              | `text/html; charset=iso-8859-1` | Empty body returned by probe.                         | FAIL    | Login route not available.                                              |
| `https://app.approvu.com/resume`                  | HTTP 404              | `text/html; charset=iso-8859-1` | Empty body returned by probe.                         | FAIL    | Resume route not available.                                             |
| `https://app.approvu.com/portal`                  | HTTP 404              | `text/html; charset=iso-8859-1` | Empty body returned by probe.                         | FAIL    | Portal route not available.                                             |
| `https://app.approvu.com/portal/home-life-bundle` | HTTP 404              | `text/html; charset=iso-8859-1` | Empty body returned by probe.                         | FAIL    | Home Life Bundle detail route not available.                            |
| `https://app.approvu.com/v2/health`               | HTTP 404              | `text/html; charset=iso-8859-1` | Empty body returned by probe.                         | FAIL    | Does not return Laravel API JSON.                                       |
| `https://app.approvu.com/v2/csrf-cookie`          | HTTP 404              | `text/html; charset=iso-8859-1` | Empty body returned by probe.                         | FAIL    | CSRF endpoint not available on this host.                               |
| `https://api.approvu.com/v2/health`               | DNS resolution failed | N/A                             | Remote name could not be resolved.                    | BLOCKED | API host candidate does not resolve.                                    |
| `https://api-staging.approvu.com/v2/health`       | DNS resolution failed | N/A                             | Remote name could not be resolved.                    | BLOCKED | API host candidate does not resolve.                                    |
| `https://api.staging.approvu.com/v2/health`       | DNS resolution failed | N/A                             | Remote name could not be resolved.                    | BLOCKED | API host candidate does not resolve.                                    |

## 5. Smoke Test Checklist

| Check ID | Area                         | Expected Result                                                                              | Actual Result                                          | Status  | Notes                                                    |
| -------- | ---------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------- | -------------------------------------------------------- |
| BR-01    | Public routes                | Qualification start route loads without auth and without console errors.                     | Root redirects to `transaction-start.php`; target 500. | FAIL    | Borrower entry is not usable from read-only probe.       |
| BR-02    | Public routes                | Purchase, refinance, and pre-purchase flows can be started.                                  | Flow routes not reachable.                             | FAIL    | `/start` 404; `/qualification` redirects to HTTP path.   |
| BR-03    | Public routes                | Qualification submit creates or resumes a server-side qualification session.                 | Not run.                                               | BLOCKED | Requires working public flow and mutation.               |
| BR-04    | Public routes                | Create-account route loads and preserves public reference handoff.                           | `/create-account` returns 404.                         | FAIL    | Route not deployed at candidate URL.                     |
| BR-05    | Login / auth                 | Login route loads, validates missing fields, and submits to the Laravel login endpoint.      | `/login` returns 404.                                  | FAIL    | Route not deployed at candidate URL.                     |
| BR-06    | Login / auth                 | Valid credentials create an authenticated borrower session.                                  | Not run.                                               | BLOCKED | No credentials used; login page/API not confirmed.       |
| BR-07    | Login / auth                 | Invalid credentials show a borrower-safe error.                                              | Not run.                                               | BLOCKED | Login page/API not confirmed.                            |
| BR-08    | Protected portal access      | `/portal` blocks unauthenticated users or routes them to login.                              | `/portal` returns 404.                                 | FAIL    | Expected protected route not available.                  |
| BR-09    | Protected portal access      | Authenticated borrower can access `/portal`.                                                 | Not run.                                               | BLOCKED | No credentials and portal route unavailable.             |
| BR-10    | Borrower portal summary      | Portal summary shows borrower name/email and latest qualification context.                   | Not run.                                               | BLOCKED | Portal route/API unavailable.                            |
| BR-11    | Borrower portal summary      | Portal sections for application, documents, offers, and Home Life Bundle render safely.      | Not run.                                               | BLOCKED | Portal route unavailable.                                |
| BR-12    | Mortgage Snapshot display    | Snapshot displays before login after qualification completion.                               | Not run.                                               | BLOCKED | Qualification entry failed.                              |
| BR-13    | Mortgage Snapshot display    | Snapshot summary displays in the authenticated portal when available.                        | Not run.                                               | BLOCKED | Portal route/auth unavailable.                           |
| BR-14    | Home Life Bundle detail page | Portal summary card links to the Home Life Bundle detail page.                               | Not run.                                               | BLOCKED | Portal route unavailable.                                |
| BR-15    | Home Life Bundle detail page | Detail page shows assigned bundle, selected offers, and redeemable-code summary.             | `/portal/home-life-bundle` returns 404.                | FAIL    | Route not deployed at candidate URL.                     |
| BR-16    | Home Life Bundle detail page | Detail page does not expose internal IDs, admin-only fields, raw codes, or partner metadata. | Not run.                                               | BLOCKED | Detail page unavailable.                                 |
| BR-17    | Redemption UI                | Claim CTA is visible only when backend marks the code as redeemable.                         | Not run.                                               | BLOCKED | Requires authenticated bundle data.                      |
| BR-18    | Redemption UI                | Redeem request uses a public reference and returns a borrower-safe success or error state.   | Not run.                                               | NOT RUN | Read-only smoke test; no redemption mutation attempted.  |
| BR-19    | Redemption UI                | Selected offers and redeemable-code summary refresh after redemption.                        | Not run.                                               | BLOCKED | Requires redeemable test data and mutation.              |
| BR-20    | Logout / sign-out            | Sign-out calls backend logout and removes protected portal access.                           | Not run.                                               | BLOCKED | No authenticated session.                                |
| BR-21    | Mobile / responsive          | Qualification, snapshot, login, portal, and bundle detail screens fit mobile viewport.       | Not run.                                               | NOT RUN | Frontend routes did not load.                            |
| BR-22    | CORS / session behavior      | Requests target staging API or relative `/v2` path; no localhost or production leakage.      | Not observed.                                          | BLOCKED | App shell/API origin not confirmed.                      |
| BR-23    | CORS / session behavior      | Authenticated requests include cookies and do not fail unexpectedly with 401 or 419.         | Not run.                                               | BLOCKED | No authenticated session/API origin.                     |
| BR-24    | Error states                 | 401 shows login/session state; 419 shows session/refresh guidance.                           | Not run.                                               | BLOCKED | UI routes did not load.                                  |
| BR-25    | Error states                 | 422 validation errors are borrower-safe and near the relevant form.                          | Not run.                                               | BLOCKED | Forms did not load; no mutations attempted.              |
| BR-26    | Error states                 | 500 or network failures show generic borrower-safe errors with no stack traces.              | Server returned 500 for transaction entry.             | BLOCKED | UI handling could not be observed from HTTP probe alone. |

## 6. Public Routes

| Route                                 | Expected                                       | Actual                                              | Status | Notes                                         |
| ------------------------------------- | ---------------------------------------------- | --------------------------------------------------- | ------ | --------------------------------------------- |
| `/`                                   | Public landing or borrower entry renders.      | HTTP 302 to `transaction-start.php`.                | FAIL   | Redirect target returns 500.                  |
| `/transaction-start.php`              | Borrower transaction entry renders.            | HTTP 500.                                           | FAIL   | Public borrower entry is server-erroring.     |
| `/start` or qualification start route | Borrower can begin qualification.              | HTTP 404 at `/start`; HTTP 301 at `/qualification`. | FAIL   | `/qualification` redirects to HTTP slash URL. |
| `/create-account`                     | Account handoff page renders.                  | HTTP 404.                                           | FAIL   | Route not deployed at candidate URL.          |
| `/login`                              | Login page renders.                            | HTTP 404.                                           | FAIL   | Route not deployed at candidate URL.          |
| `/resume` if enabled                  | Resume page accepts public reference or token. | HTTP 404.                                           | FAIL   | Route not deployed at candidate URL.          |

## 7. Login / Auth

| Check         | Expected                                                               | Actual                         | Status  | Notes                                             |
| ------------- | ---------------------------------------------------------------------- | ------------------------------ | ------- | ------------------------------------------------- |
| CSRF cookie   | `GET /v2/csrf-cookie` succeeds before mutating auth calls when needed. | HTTP 404 at `/v2/csrf-cookie`. | FAIL    | Laravel API origin not confirmed.                 |
| Login success | `POST /v2/borrower/login` authenticates valid credentials.             | Not run.                       | BLOCKED | No credentials used; login route/API unavailable. |
| Login failure | Invalid credentials show a safe error.                                 | Not run.                       | BLOCKED | Login route/API unavailable.                      |
| Session check | `GET /v2/borrower/me` confirms authenticated state.                    | Not run.                       | BLOCKED | API origin/session unavailable.                   |

## 8. Protected Portal Access

| Check                  | Expected                                                    | Actual              | Status  | Notes                                 |
| ---------------------- | ----------------------------------------------------------- | ------------------- | ------- | ------------------------------------- |
| Unauthenticated portal | Protected portal route requires login.                      | `/portal` HTTP 404. | FAIL    | Route does not show login redirect.   |
| Authenticated portal   | Portal loads with borrower-safe session data.               | Not run.            | BLOCKED | No credentials and route unavailable. |
| Hard refresh           | Refreshing portal keeps session or routes cleanly to login. | Not run.            | BLOCKED | Portal route unavailable.             |

## 9. Borrower Portal Summary

| Check                     | Expected                                                   | Actual   | Status  | Notes                        |
| ------------------------- | ---------------------------------------------------------- | -------- | ------- | ---------------------------- |
| Borrower identity         | Name/email display safely.                                 | Not run. | BLOCKED | Portal/API/auth unavailable. |
| Latest qualification      | Latest public reference or qualification summary displays. | Not run. | BLOCKED | Portal/API/auth unavailable. |
| Application section       | Application CTA/status displays.                           | Not run. | BLOCKED | Portal route unavailable.    |
| Documents section         | Documents CTA/status displays.                             | Not run. | BLOCKED | Portal route unavailable.    |
| Offers / Home Life Bundle | Offers and bundle summary display safely.                  | Not run. | BLOCKED | Portal route unavailable.    |

## 10. Mortgage Snapshot Display

| Check            | Expected                                              | Actual   | Status  | Notes                            |
| ---------------- | ----------------------------------------------------- | -------- | ------- | -------------------------------- |
| Before login     | Server snapshot displays after qualification.         | Not run. | BLOCKED | Qualification entry unavailable. |
| After login      | Portal snapshot summary matches latest qualification. | Not run. | BLOCKED | Portal/auth unavailable.         |
| Missing snapshot | Empty or pending state is clear and safe.             | Not run. | BLOCKED | Snapshot route/API unavailable.  |

## 11. Home Life Bundle Detail Page

| Check            | Expected                                                                | Actual                               | Status  | Notes                        |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------ | ------- | ---------------------------- |
| Summary          | Assigned bundle status and counts render.                               | `/portal/home-life-bundle` HTTP 404. | FAIL    | Detail route unavailable.    |
| Assignments      | Assignment list renders borrower-safe labels.                           | Not run.                             | BLOCKED | Requires authenticated data. |
| Selected offers  | Selected offers render borrower-safe detail.                            | Not run.                             | BLOCKED | Requires authenticated data. |
| Redeemable codes | Redeemable-code summary hides raw codes unless backend permits display. | Not run.                             | BLOCKED | Requires authenticated data. |
| Back navigation  | Back link returns to portal without session loss.                       | Not run.                             | BLOCKED | Detail page unavailable.     |

## 12. Redemption UI

| Check           | Expected                                                         | Actual   | Status  | Notes                                        |
| --------------- | ---------------------------------------------------------------- | -------- | ------- | -------------------------------------------- |
| CTA gating      | Claim CTA appears only when `redeemable` is true.                | Not run. | BLOCKED | Requires authenticated bundle data.          |
| Redeem request  | Request uses safe public reference only.                         | Not run. | NOT RUN | Read-only smoke test; no mutation attempted. |
| Success         | Success state displays safely and refreshes bundle data.         | Not run. | BLOCKED | Requires redeemable test data.               |
| Error           | Error state is borrower-safe and does not expose internals.      | Not run. | BLOCKED | Requires route/API access.                   |
| Raw code safety | Raw/display code is shown only with explicit backend permission. | Not run. | BLOCKED | Detail page unavailable.                     |

## 13. Logout / Sign-Out

| Check             | Expected                                           | Actual   | Status  | Notes                     |
| ----------------- | -------------------------------------------------- | -------- | ------- | ------------------------- |
| Logout request    | `POST /v2/borrower/logout` succeeds.               | Not run. | BLOCKED | No authenticated session. |
| Post-logout state | Portal content is no longer visible after logout.  | Not run. | BLOCKED | No authenticated session. |
| Back button       | Browser back does not expose stale protected data. | Not run. | BLOCKED | No authenticated session. |

## 14. Mobile / Responsive Spot Checks

| Viewport | Pages Checked                                         | Expected                               | Actual   | Status  | Notes                         |
| -------- | ----------------------------------------------------- | -------------------------------------- | -------- | ------- | ----------------------------- |
| 390 px   | Qualification, snapshot, login, portal, bundle detail | No horizontal overflow; CTAs tappable. | Not run. | NOT RUN | Frontend routes did not load. |
| Tablet   | Portal and application workspace                      | Cards and tables remain usable.        | Not run. | NOT RUN | Frontend routes did not load. |
| Desktop  | Full flow                                             | Layout remains stable.                 | Not run. | NOT RUN | Frontend routes did not load. |

## 15. CORS / Session Behavior

| Check           | Expected                                              | Actual                          | Status  | Notes                                  |
| --------------- | ----------------------------------------------------- | ------------------------------- | ------- | -------------------------------------- |
| API origin      | Requests use staging API or relative `/v2` path only. | No API origin confirmed.        | FAIL    | `/v2/health` returned 404 on app host. |
| Credentials     | Authenticated calls include cookies.                  | Not observed.                   | BLOCKED | No authenticated browser session.      |
| CSRF            | Mutating calls send `X-XSRF-TOKEN` when required.     | `/v2/csrf-cookie` returned 404. | FAIL    | API origin not confirmed.              |
| CORS            | Backend allows only the configured frontend origin.   | Not observed.                   | BLOCKED | API DNS candidates failed.             |
| Cookie settings | Session cookie settings support staging HTTPS.        | Not observed.                   | BLOCKED | No successful session exchange.        |

## 16. Error States

| Error           | Expected UI Behavior                             | Actual                               | Status  | Notes                                               |
| --------------- | ------------------------------------------------ | ------------------------------------ | ------- | --------------------------------------------------- |
| 401             | Route to login or show session-required message. | Not observed.                        | BLOCKED | Routes/API did not load.                            |
| 419             | Show refresh/session guidance.                   | Not observed.                        | BLOCKED | CSRF endpoint unavailable.                          |
| 422             | Show validation copy, not raw JSON.              | Not observed.                        | BLOCKED | No form submission attempted.                       |
| 500             | Show generic support-safe error.                 | Transaction entry returned HTTP 500. | BLOCKED | Browser UI handling could not be observed by probe. |
| Network failure | Preserve borrower context and allow retry.       | Not observed.                        | BLOCKED | App shell unavailable.                              |

## 17. Console / Network Errors

| Check           | Expected                              | Actual   | Status  | Notes                                                |
| --------------- | ------------------------------------- | -------- | ------- | ---------------------------------------------------- |
| Browser console | No uncaught React/router errors.      | Not run. | NOT RUN | Candidate routes did not expose the borrower app UI. |
| Network tab     | Requests target staging backend only. | Not run. | NOT RUN | Browser UI not reached.                              |
| Secrets         | No secrets logged.                    | Not run. | NOT RUN | No authenticated browser session used.               |

## 18. Blockers

| ID   | Check ID            | Description                                                                                       | Owner           | Target Fix                                                                        | Status |
| ---- | ------------------- | ------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------- | ------ |
| B-01 | BR-01, BR-02        | Borrower entry on `app.approvu.com` redirects to `transaction-start.php`, which returns HTTP 500. | Frontend/deploy | Deploy/route the Vite borrower frontend entry or fix the transaction entry error. | Open   |
| B-02 | BR-04, BR-05, BR-08 | Expected borrower routes `/create-account`, `/login`, `/resume`, and `/portal` return 404.        | Frontend/deploy | Configure SPA fallback/routing for deployed borrower frontend routes.             | Open   |
| B-03 | BR-22, API          | No `.com` Laravel `/v2/health` endpoint returned API JSON; API DNS candidates failed.             | Backend/deploy  | Provide the correct Laravel v2 staging API origin and health endpoint.            | Open   |
| B-04 | CSRF/session        | `/v2/csrf-cookie` returned 404 on `app.approvu.com`.                                              | Backend/deploy  | Confirm same-origin proxy or cross-origin API URL for CSRF/session flows.         | Open   |
| B-05 | Auth testing        | No safe staging borrower credentials or test qualification reference were used.                   | QA/product      | Provide safe staging test data after frontend/API reachability is fixed.          | Open   |

## 19. Non-Blocking Issues

| ID    | Check ID | Description                                                                                    | Priority | Follow-up                                                    |
| ----- | -------- | ---------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| NB-01 | Docs     | Deployed frontend branch/commit is not exposed by the live app.                                | P3       | Add build metadata to staging footer or diagnostics if safe. |
| NB-02 | Docs     | Current staging API origin is not documented in the report because no candidate was confirmed. | P2       | Update staging docs once the actual API origin is provided.  |

## 20. Screenshots / Evidence Links

No screenshots were captured because the candidate borrower app UI did not load and no credentials were
used. Sanitized HTTP evidence:

```text
GET https://app.approvu.com
HTTP 302 text/html; charset=UTF-8
Location: transaction-start.php
```

```text
GET https://app.approvu.com/transaction-start.php
HTTP 500 text/html; charset=UTF-8
```

```text
GET https://app.approvu.com/login
HTTP 404 text/html; charset=iso-8859-1
```

```text
GET https://app.approvu.com/portal
HTTP 404 text/html; charset=iso-8859-1
```

```text
GET https://app.approvu.com/v2/health
HTTP 404 text/html; charset=iso-8859-1
```

```text
GET https://api.approvu.com/v2/health
ERROR: The remote name could not be resolved: 'api.approvu.com'
```

## 21. Final Recommendation

| Field                    | Value                               |
| ------------------------ | ----------------------------------- |
| Recommendation           | **NO-GO**                           |
| Blocker count            | 5                                   |
| Non-blocking issue count | 2                                   |
| Evidence attached        | Yes, sanitized HTTP probe excerpts. |
| Tester sign-off          | Codex                               |
| Date                     | 2026-05-24                          |

Final notes:

```text
NO-GO. The borrower frontend staging smoke test cannot proceed beyond reachability. The known app host
responds but does not serve the expected borrower frontend routes, the transaction entry returns HTTP
500, and no Laravel v2 API origin was confirmed. Fix deployment routing/API origin first, then rerun
with safe borrower staging credentials and test data.
```
