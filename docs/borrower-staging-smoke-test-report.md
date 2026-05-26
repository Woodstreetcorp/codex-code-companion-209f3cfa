# Borrower Staging Smoke Test Report

Executed live borrower staging smoke test. Cross-reference
[borrower-staging-smoke-checklist.md](./borrower-staging-smoke-checklist.md) for the 30-minute smoke
flow.

## 1. Environment Details

> **Current staging note:** the borrower frontend is temporarily deployed on Cloudflare Workers at
> `https://tanstack-start-app.woodstreetcorp.workers.dev`. The planned custom domain
> `https://borrower-staging.approvu.com` is deferred while the DNS/domain strategy is finalized.
>
> `https://app.approvu.com` remains the legacy PHP application. It is not the new borrower frontend
> staging target and was not modified for this smoke test.

| Field                                            | Value                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| Borrower frontend URL                            | `https://tanstack-start-app.woodstreetcorp.workers.dev`               |
| Planned borrower custom domain                   | `https://borrower-staging.approvu.com` deferred                       |
| Backend API URL                                  | `https://api-staging.approvu.com`                                     |
| API base env value (`VITE_APPROVU_API_BASE_URL`) | `https://api-staging.approvu.com`                                     |
| Deployment mode                                  | Temporary Cloudflare Worker staging deployment                        |
| Backend environment                              | Laravel v2 staging confirmed by `/v2/health`                          |
| Frontend branch / commit                         | Not verifiable from live Worker response                              |
| Backend branch / commit                          | Not verifiable from public health response                            |
| Credentials used                                 | None                                                                  |
| Test method                                      | Read-only HTTP probes and CORS preflight; no credentials or mutations |

## 2. Tester / Date

| Field             | Value                                     |
| ----------------- | ----------------------------------------- |
| Tester            | Codex                                     |
| Date              | 2026-05-25                                |
| Browser / version | Not run; HTTP probes from PowerShell/curl |
| Device / OS       | Windows local test environment            |
| Viewports checked | Not run                                   |

## 3. PASS / FAIL / BLOCKED / NOT RUN Summary

| Area                            | PASS | FAIL | BLOCKED | NOT RUN | Notes                                                                                 |
| ------------------------------- | ---- | ---- | ------- | ------- | ------------------------------------------------------------------------------------- |
| Public routes                   | 6    | 0    | 0       | 0       | Worker root, qualification routes, login, and portal route all return HTML 200.       |
| Qualification start route       | 3    | 0    | 0       | 0       | `/pre-purchase`, `/purchase`, and `/refinance` are reachable.                         |
| Login / auth                    | 1    | 0    | 1       | 1       | Login page reachable; credentialed login still needs staging borrower credentials.    |
| CSRF cookie behavior            | 1    | 0    | 0       | 0       | API CSRF endpoint returns 200 with secure SameSite=None cookies.                      |
| Session cookie behavior         | 1    | 0    | 0       | 1       | Cookie attributes confirmed; authenticated session lifecycle not run.                 |
| Protected portal access         | 1    | 0    | 1       | 0       | `/portal` shell route loads; authenticated portal data requires credentials.          |
| Borrower portal summary         | 0    | 0    | 1       | 0       | Requires authenticated staging borrower session/test data.                            |
| Mortgage Snapshot display       | 0    | 0    | 1       | 0       | Full qualification-to-snapshot journey requires safe test borrower data.              |
| Home Life Bundle detail page    | 0    | 0    | 1       | 0       | Requires authenticated staging data.                                                  |
| Redemption UI                   | 0    | 0    | 1       | 1       | Requires redeemable staging data; no mutation attempted.                              |
| Logout / sign-out               | 0    | 0    | 1       | 0       | Requires authenticated session.                                                       |
| Mobile / responsive spot checks | 0    | 0    | 0       | 1       | Not run in this HTTP-only pass.                                                       |
| CORS / session behavior         | 2    | 0    | 0       | 0       | Worker origin is allowed and credentials are enabled.                                 |
| Error states                    | 0    | 0    | 1       | 0       | Requires interactive test data and controlled API failures.                           |
| Console / network errors        | 0    | 0    | 0       | 1       | DevTools pass still needed in browser.                                                |
| API health                      | 1    | 0    | 0       | 0       | `/v2/health` returns staging Laravel API JSON.                                        |
| Total                           | 16   | 0    | 8       | 5       | **CONDITIONAL GO** for technical staging smoke testing; not full production-ready GO. |

Status key:

- PASS: expected result matched actual result.
- FAIL: expected result did not match actual result.
- BLOCKED: check could not be completed because it requires credentials, test data, or a mutation.
- NOT RUN: intentionally skipped in this read-only HTTP pass.

## 4. Live URL Probe Results

| URL                                                                  | Result                         | Content Type       | Status  | Notes                                                        |
| -------------------------------------------------------------------- | ------------------------------ | ------------------ | ------- | ------------------------------------------------------------ |
| `https://tanstack-start-app.woodstreetcorp.workers.dev/`             | 200 OK                         | `text/html`        | PASS    | Worker serves borrower app shell.                            |
| `https://tanstack-start-app.woodstreetcorp.workers.dev/pre-purchase` | 200 OK                         | `text/html`        | PASS    | Pre-purchase route reachable.                                |
| `https://tanstack-start-app.woodstreetcorp.workers.dev/purchase`     | 200 OK                         | `text/html`        | PASS    | Purchase route reachable.                                    |
| `https://tanstack-start-app.woodstreetcorp.workers.dev/refinance`    | 200 OK                         | `text/html`        | PASS    | Refinance route reachable.                                   |
| `https://tanstack-start-app.woodstreetcorp.workers.dev/login`        | 200 OK                         | `text/html`        | PASS    | Login route reachable.                                       |
| `https://tanstack-start-app.woodstreetcorp.workers.dev/portal`       | 200 OK                         | `text/html`        | PASS    | Portal route shell reachable; authenticated data not tested. |
| `https://api-staging.approvu.com/v2/health`                          | 200 OK                         | `application/json` | PASS    | Laravel API JSON returned.                                   |
| `https://api-staging.approvu.com/v2/csrf-cookie`                     | 200 OK                         | `application/json` | PASS    | Secure SameSite=None cookies returned.                       |
| `OPTIONS https://api-staging.approvu.com/v2/borrower/login`          | 204 No Content                 | N/A                | PASS    | Worker origin allowed with credentials.                      |
| `https://borrower-staging.approvu.com`                               | Deferred                       | N/A                | BLOCKED | Custom domain not active for this pass.                      |
| `https://app.approvu.com`                                            | Legacy app; not staging target | N/A                | NOT RUN | Left untouched.                                              |

## 5. CORS / Session Evidence

Read-only CORS preflight:

```text
OPTIONS https://api-staging.approvu.com/v2/borrower/login
Origin: https://tanstack-start-app.woodstreetcorp.workers.dev

HTTP 204 No Content
Access-Control-Allow-Origin: https://tanstack-start-app.woodstreetcorp.workers.dev
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: content-type, accept, x-requested-with, x-csrf-token, x-xsrf-token
Access-Control-Max-Age: 86400
```

CSRF cookie check:

```text
GET https://api-staging.approvu.com/v2/csrf-cookie
HTTP 200 OK
Content-Type: application/json
Set-Cookie: domain=api-staging.approvu.com; secure; samesite=none
```

## 6. API Health Evidence

```text
GET https://api-staging.approvu.com/v2/health
HTTP 200 OK
Content-Type: application/json

{"status":"ok","app":"approvU API","environment":"staging","deployed":true}
```

## 7. Smoke Test Checklist

| Check ID | Area                         | Expected Result                                                                              | Actual Result                                              | Status  | Notes                                                 |
| -------- | ---------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------- | ----------------------------------------------------- |
| BR-01    | Public routes                | Borrower frontend root loads without auth.                                                   | Worker root returns 200 HTML.                              | PASS    | Temporary Worker URL is active.                       |
| BR-02    | Public routes                | Purchase, refinance, and pre-purchase flows can be started.                                  | `/purchase`, `/refinance`, and `/pre-purchase` return 200. | PASS    | HTTP reachability confirmed.                          |
| BR-03    | Public routes                | Qualification submit creates or resumes a server-side qualification session.                 | Not run.                                                   | BLOCKED | Requires safe borrower test data and mutation.        |
| BR-04    | Public routes                | Create-account route loads and preserves public reference handoff.                           | Not run in this pass.                                      | NOT RUN | Public route can be checked in the next browser pass. |
| BR-05    | Login / auth                 | Login route loads.                                                                           | `/login` returns 200 HTML.                                 | PASS    | Credentialed login still needs test credentials.      |
| BR-06    | Login / auth                 | Valid credentials create an authenticated borrower session.                                  | Not run.                                                   | BLOCKED | Requires staging borrower credentials.                |
| BR-07    | Login / auth                 | Invalid credentials show a safe error.                                                       | Not run.                                                   | NOT RUN | No auth mutation attempted.                           |
| BR-08    | Protected portal access      | `/portal` route loads or routes unauthenticated user safely.                                 | `/portal` returns 200 HTML.                                | PASS    | Authenticated data not verified.                      |
| BR-09    | Protected portal access      | Authenticated borrower can access `/portal`.                                                 | Not run.                                                   | BLOCKED | Requires credentials.                                 |
| BR-10    | Borrower portal summary      | Portal summary shows borrower name/email and latest qualification context.                   | Not run.                                                   | BLOCKED | Requires authenticated staging data.                  |
| BR-11    | Mortgage Snapshot display    | Snapshot displays after qualification completion.                                            | Not run.                                                   | BLOCKED | Requires safe qualification test data.                |
| BR-12    | Home Life Bundle detail page | Detail page shows assigned bundle, selected offers, and redeemable-code summary.             | Not run.                                                   | BLOCKED | Requires authenticated staging data.                  |
| BR-13    | Home Life Bundle detail page | Detail page does not expose internal IDs, admin-only fields, raw codes, or partner metadata. | Not run.                                                   | BLOCKED | Requires detail data and browser inspection.          |
| BR-14    | Redemption UI                | Claim CTA is visible only when backend marks the code as redeemable.                         | Not run.                                                   | BLOCKED | Requires redeemable staging data.                     |
| BR-15    | Redemption UI                | Redeem request uses a public reference and returns safe success/error state.                 | Not run.                                                   | NOT RUN | Read-only smoke pass; no mutation attempted.          |
| BR-16    | Logout / sign-out            | Sign-out calls backend logout and removes protected portal access.                           | Not run.                                                   | BLOCKED | Requires authenticated session.                       |
| BR-17    | Mobile / responsive          | Public routes and portal shell fit mobile viewport.                                          | Not run.                                                   | NOT RUN | Needs browser QA pass.                                |
| BR-18    | CORS / session behavior      | Worker origin is allowed by backend CORS.                                                    | Preflight returns 204 with matching origin.                | PASS    | Credentials enabled.                                  |
| BR-19    | CORS / session behavior      | CSRF cookies support cross-origin staging HTTPS.                                             | CSRF endpoint returns secure SameSite=None cookies.        | PASS    | Cookie attributes confirmed.                          |
| BR-20    | Error states                 | 401, 419, 422, and 500 states are borrower-safe.                                             | Not run.                                                   | BLOCKED | Requires interactive browser/API error pass.          |

## 8. Public Routes

| Route           | Expected                         | Actual   | Status | Notes                        |
| --------------- | -------------------------------- | -------- | ------ | ---------------------------- |
| `/`             | Borrower app shell renders.      | 200 HTML | PASS   | Worker URL active.           |
| `/pre-purchase` | Pre-purchase flow route renders. | 200 HTML | PASS   | Reachability confirmed.      |
| `/purchase`     | Purchase flow route renders.     | 200 HTML | PASS   | Reachability confirmed.      |
| `/refinance`    | Refinance flow route renders.    | 200 HTML | PASS   | Reachability confirmed.      |
| `/login`        | Login page route renders.        | 200 HTML | PASS   | Auth mutation not attempted. |
| `/portal`       | Portal shell route renders.      | 200 HTML | PASS   | Auth data not fully tested.  |

## 9. Login / Auth

| Check         | Expected                                                               | Actual                        | Status  | Notes                                      |
| ------------- | ---------------------------------------------------------------------- | ----------------------------- | ------- | ------------------------------------------ |
| CSRF cookie   | `GET /v2/csrf-cookie` succeeds before mutating auth calls when needed. | 200 JSON with secure cookies. | PASS    | `samesite=none`, `secure`, API domain set. |
| Login route   | `/login` renders.                                                      | 200 HTML.                     | PASS    | Worker route reachable.                    |
| Login success | `POST /v2/borrower/login` authenticates valid credentials.             | Not run.                      | BLOCKED | Requires staging borrower credentials.     |
| Login failure | Invalid credentials show a safe error.                                 | Not run.                      | NOT RUN | No auth mutation attempted.                |
| Session check | `GET /v2/borrower/me` confirms authenticated state.                    | Not run.                      | BLOCKED | Requires authenticated session.            |

## 10. Protected Portal Access

| Check                  | Expected                                                    | Actual              | Status  | Notes                                |
| ---------------------- | ----------------------------------------------------------- | ------------------- | ------- | ------------------------------------ |
| Unauthenticated portal | Protected portal route loads shell or routes safely.        | `/portal` 200 HTML. | PASS    | Browser behavior still needs review. |
| Authenticated portal   | Portal loads with borrower-safe session data.               | Not run.            | BLOCKED | Requires credentials/test data.      |
| Hard refresh           | Refreshing portal keeps session or routes cleanly to login. | Not run.            | BLOCKED | Requires browser session.            |

## 11. Borrower Portal Summary

| Check                     | Expected                                                   | Actual   | Status  | Notes                                   |
| ------------------------- | ---------------------------------------------------------- | -------- | ------- | --------------------------------------- |
| Borrower identity         | Name/email display safely.                                 | Not run. | BLOCKED | Requires authenticated staging account. |
| Latest qualification      | Latest public reference or qualification summary displays. | Not run. | BLOCKED | Requires linked qualification data.     |
| Application section       | Application CTA/status displays.                           | Not run. | BLOCKED | Requires authenticated portal API pass. |
| Documents section         | Documents CTA/status displays.                             | Not run. | BLOCKED | Requires authenticated portal API pass. |
| Offers / Home Life Bundle | Offers and bundle summary display safely.                  | Not run. | BLOCKED | Requires authenticated offer data.      |

## 12. Mortgage Snapshot Display

| Check            | Expected                                              | Actual   | Status  | Notes                                  |
| ---------------- | ----------------------------------------------------- | -------- | ------- | -------------------------------------- |
| Before login     | Server snapshot displays after qualification.         | Not run. | BLOCKED | Requires qualification submit data.    |
| After login      | Portal snapshot summary matches latest qualification. | Not run. | BLOCKED | Requires authenticated test account.   |
| Missing snapshot | Empty or pending state is clear and safe.             | Not run. | BLOCKED | Requires controlled staging test data. |

## 13. Home Life Bundle Detail Page

| Check            | Expected                                                                | Actual   | Status  | Notes                                |
| ---------------- | ----------------------------------------------------------------------- | -------- | ------- | ------------------------------------ |
| Summary          | Assigned bundle status and counts render.                               | Not run. | BLOCKED | Requires authenticated staging data. |
| Assignments      | Assignment list renders borrower-safe labels.                           | Not run. | BLOCKED | Requires authenticated data.         |
| Selected offers  | Selected offers render borrower-safe detail.                            | Not run. | BLOCKED | Requires authenticated offer data.   |
| Redeemable codes | Redeemable-code summary hides raw codes unless backend permits display. | Not run. | BLOCKED | Requires redeemable staging data.    |
| Back navigation  | Back link returns to portal without session loss.                       | Not run. | BLOCKED | Requires browser/session test.       |

## 14. Redemption UI

| Check           | Expected                                                         | Actual   | Status  | Notes                                        |
| --------------- | ---------------------------------------------------------------- | -------- | ------- | -------------------------------------------- |
| CTA gating      | Claim CTA appears only when `redeemable` is true.                | Not run. | BLOCKED | Requires authenticated bundle data.          |
| Redeem request  | Request uses safe public reference only.                         | Not run. | NOT RUN | Read-only smoke test; no mutation attempted. |
| Success         | Success state displays safely and refreshes bundle data.         | Not run. | BLOCKED | Requires redeemable test data.               |
| Error           | Error state is borrower-safe and does not expose internals.      | Not run. | BLOCKED | Requires route/API access.                   |
| Raw code safety | Raw/display code is shown only with explicit backend permission. | Not run. | BLOCKED | Requires authenticated data.                 |

## 15. Logout / Sign-Out

| Check             | Expected                                           | Actual   | Status  | Notes                     |
| ----------------- | -------------------------------------------------- | -------- | ------- | ------------------------- |
| Logout request    | `POST /v2/borrower/logout` succeeds.               | Not run. | BLOCKED | No authenticated session. |
| Post-logout state | Portal content is no longer visible after logout.  | Not run. | BLOCKED | No authenticated session. |
| Back button       | Browser back does not expose stale protected data. | Not run. | BLOCKED | No authenticated session. |

## 16. Mobile / Responsive Spot Checks

| Viewport | Pages Checked                                         | Expected                               | Actual   | Status  | Notes                   |
| -------- | ----------------------------------------------------- | -------------------------------------- | -------- | ------- | ----------------------- |
| 390 px   | Qualification, snapshot, login, portal, bundle detail | No horizontal overflow; CTAs tappable. | Not run. | NOT RUN | Needs browser QA pass.  |
| Tablet   | Portal and application workspace                      | Cards and tables remain usable.        | Not run. | NOT RUN | Needs browser QA pass.  |
| Desktop  | Full flow                                             | Layout remains stable.                 | Not run. | NOT RUN | HTTP reachability only. |

## 17. CORS / Session Behavior

| Check           | Expected                                              | Actual                                      | Status | Notes                                       |
| --------------- | ----------------------------------------------------- | ------------------------------------------- | ------ | ------------------------------------------- |
| API origin      | Requests target staging API only.                     | API health confirmed at staging host.       | PASS   | `https://api-staging.approvu.com`.          |
| Credentials     | Cross-origin auth requests can include cookies.       | Preflight allows credentials.               | PASS   | `Access-Control-Allow-Credentials: true`.   |
| CSRF            | CSRF endpoint returns safe cookie setup.              | 200 JSON with secure SameSite=None cookies. | PASS   | Cookie domain is `api-staging.approvu.com`. |
| CORS            | Backend allows the configured Worker frontend origin. | 204 preflight with exact Worker origin.     | PASS   | No wildcard origin observed.                |
| Cookie settings | Session cookie settings support staging HTTPS.        | Secure, SameSite=None observed.             | PASS   | Auth lifecycle still needs credentialed QA. |

## 18. Error States

| Error           | Expected UI Behavior                             | Actual   | Status  | Notes                                |
| --------------- | ------------------------------------------------ | -------- | ------- | ------------------------------------ |
| 401             | Route to login or show session-required message. | Not run. | BLOCKED | Requires browser/auth flow.          |
| 419             | Show refresh/session guidance.                   | Not run. | BLOCKED | Requires controlled CSRF failure.    |
| 422             | Show validation copy, not raw JSON.              | Not run. | BLOCKED | Requires safe validation mutation.   |
| 500             | Show generic support-safe error.                 | Not run. | BLOCKED | Requires controlled backend failure. |
| Network failure | Preserve borrower context and allow retry.       | Not run. | BLOCKED | Requires browser/network simulation. |

## 19. Console / Network Errors

| Check           | Expected                              | Actual   | Status  | Notes                             |
| --------------- | ------------------------------------- | -------- | ------- | --------------------------------- |
| Browser console | No uncaught React/router errors.      | Not run. | NOT RUN | Needs browser DevTools pass.      |
| Network tab     | Requests target staging backend only. | Not run. | NOT RUN | Needs browser DevTools pass.      |
| Secrets         | No secrets logged.                    | Not run. | NOT RUN | No authenticated browser session. |

## 20. Blockers

No current technical blocker for public borrower staging smoke testing.

| ID   | Check ID     | Description                                                                 | Owner      | Target Fix                                            | Status |
| ---- | ------------ | --------------------------------------------------------------------------- | ---------- | ----------------------------------------------------- | ------ |
| B-01 | Auth journey | Full authenticated journey requires staging borrower credentials/test data. | QA/product | Provide safe borrower account and qualification data. | Open   |
| B-02 | Domain       | `https://borrower-staging.approvu.com` custom domain is deferred.           | DevOps     | Finalize domain/DNS strategy when ready.              | Open   |

## 21. Non-Blocking Issues

| ID    | Check ID | Description                                                                                   | Priority | Follow-up                                                  |
| ----- | -------- | --------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| NB-01 | Docs     | Worker URL is temporary and should be replaced once `borrower-staging.approvu.com` is active. | P2       | Update docs and CORS allowlist when custom domain is live. |
| NB-02 | QA       | Browser DevTools, mobile, and authenticated journey checks still need a credentialed QA pass. | P2       | Run interactive smoke test with safe staging data.         |
| NB-03 | Docs     | Deployed frontend branch/commit is not exposed by the live Worker response.                   | P3       | Add safe build metadata to staging diagnostics if needed.  |

## 22. Screenshots / Evidence Links

No screenshots were captured in this read-only HTTP pass. Sanitized HTTP evidence:

```text
GET/HEAD https://tanstack-start-app.woodstreetcorp.workers.dev/
HTTP 200 OK
Content-Type: text/html
```

```text
GET/HEAD https://tanstack-start-app.woodstreetcorp.workers.dev/pre-purchase
HTTP 200 OK
Content-Type: text/html
```

```text
GET/HEAD https://tanstack-start-app.woodstreetcorp.workers.dev/purchase
HTTP 200 OK
Content-Type: text/html
```

```text
GET/HEAD https://tanstack-start-app.woodstreetcorp.workers.dev/refinance
HTTP 200 OK
Content-Type: text/html
```

```text
GET/HEAD https://tanstack-start-app.woodstreetcorp.workers.dev/login
HTTP 200 OK
Content-Type: text/html
```

```text
GET/HEAD https://tanstack-start-app.woodstreetcorp.workers.dev/portal
HTTP 200 OK
Content-Type: text/html
```

```text
GET https://api-staging.approvu.com/v2/health
HTTP 200 OK
Content-Type: application/json
Body includes: {"status":"ok","app":"approvU API","environment":"staging","deployed":true}
```

```text
GET https://api-staging.approvu.com/v2/csrf-cookie
HTTP 200 OK
Content-Type: application/json
Set-Cookie includes: domain=api-staging.approvu.com; secure; samesite=none
```

```text
OPTIONS https://api-staging.approvu.com/v2/borrower/login
Origin: https://tanstack-start-app.woodstreetcorp.workers.dev
HTTP 204 No Content
Access-Control-Allow-Origin: https://tanstack-start-app.woodstreetcorp.workers.dev
Access-Control-Allow-Credentials: true
```

## 23. Final Recommendation

| Field                    | Value                                                |
| ------------------------ | ---------------------------------------------------- |
| Recommendation           | **CONDITIONAL GO** for technical staging smoke tests |
| Blocker count            | 2                                                    |
| Non-blocking issue count | 3                                                    |
| Evidence attached        | Yes, sanitized HTTP/CORS probe excerpts.             |
| Tester sign-off          | Codex                                                |
| Date                     | 2026-05-25                                           |

Final notes:

```text
CONDITIONAL GO for technical borrower staging smoke testing. The temporary Worker frontend URL serves
the borrower routes, the Laravel staging API health and CSRF endpoints respond, and CORS allows the
Worker origin with credentials. This is not a full production-ready GO. The custom
borrower-staging.approvu.com domain is deferred, and the full authenticated borrower journey still
requires safe staging borrower credentials and test qualification/application data.
```
