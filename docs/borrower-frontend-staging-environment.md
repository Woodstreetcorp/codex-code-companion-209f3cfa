# Borrower Frontend Staging Environment

This document captures the staging configuration needed for the borrower frontend to connect to the
Laravel v2 backend API.

## Required Environment Variables

| Variable                    | Required                                 | Purpose                                                                  |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `VITE_APPROVU_API_BASE_URL` | Yes for cross-origin staging             | Laravel backend API origin. Borrower API paths are appended under `/v2`. |
| `VITE_GOOGLE_MAPS_API_KEY`  | Yes when address autocomplete is enabled | Google Maps JavaScript / Places key for borrower address autocomplete.   |

For same-origin staging deployments, `VITE_APPROVU_API_BASE_URL` may be blank. In that mode the app
uses relative `/v2/...` URLs and the web server should proxy those requests to Laravel.

For cross-origin staging deployments, set `VITE_APPROVU_API_BASE_URL` to the Laravel API origin only:

```env
VITE_APPROVU_API_BASE_URL=https://api-staging.approvu.com
```

Do not hardcode localhost, staging, or production URLs in source code.

## API Base URL Behavior

The borrower frontend uses the shared helper at `src/lib/api/laravelSession.ts`.

`buildApiUrl(path)` combines:

1. `VITE_APPROVU_API_BASE_URL`, with trailing slashes removed; and
2. the supplied `/v2/...` API path.

If `VITE_APPROVU_API_BASE_URL` is blank, `buildApiUrl("/v2/borrower/portal")` returns the relative
path `/v2/borrower/portal`.

## Session and Credential Handling

Borrower APIs use Laravel web-session authentication. The shared `fetchWithLaravelSession()` helper
adds:

```ts
credentials: "include";
```

This is used by the borrower login/auth APIs, borrower portal API, application APIs, document APIs,
Mortgage Snapshot APIs, and Home Life Bundle APIs.

Staging must be configured so that:

- Laravel CORS allows the exact borrower frontend origin.
- Credentialed requests are enabled on the backend.
- Session cookies use HTTPS-compatible settings.
- The frontend API base URL points to the same backend origin that issues the session cookie.

## CSRF Behavior

For mutating requests such as login, account handoff, section save, document upload, consents,
selected products, and Home Life Bundle redemption, `fetchWithLaravelSession()`:

1. calls `GET /v2/csrf-cookie` when the `XSRF-TOKEN` cookie is missing;
2. reads the `XSRF-TOKEN` cookie in the browser;
3. sends the decoded token as `X-XSRF-TOKEN`; and
4. sends the actual request with `credentials: "include"`.

CSRF initialization errors are non-fatal in the helper; if Laravel still requires CSRF, the mutation
will fail normally with a session or CSRF error such as `419`.

## Key Borrower API Clients

- `src/lib/api/borrowerAuthApi.ts` uses `/v2/borrower/login`, `/v2/borrower/me`, and
  `/v2/borrower/logout`.
- `src/lib/api/borrowerPortalApi.ts` uses `/v2/borrower/portal`.
- `src/lib/api/borrowerQualificationApi.ts` uses public qualification intake routes under
  `/v2/borrower/qualification`.
- `src/lib/api/borrowerMortgageSnapshotApi.ts` uses server-side Mortgage Snapshot routes.
- `src/lib/api/borrowerApplicationSectionsApi.ts` uses application save/restore routes.
- `src/lib/api/borrowerDocumentApi.ts` uses document and document-request routes.
- `src/lib/api/borrowerHomeLifeBundleApi.ts` uses Home Life Bundle summary, assignment, offer detail,
  redeemable code summary, and redemption routes.

## Staging Verification Checklist

1. Configure `VITE_APPROVU_API_BASE_URL` in the staging frontend host.
2. Configure the Laravel backend CORS/frontend origin to the exact borrower frontend URL.
3. Open DevTools Network and confirm borrower requests target the staging Laravel host or relative
   `/v2` path, depending on deployment mode.
4. Confirm login calls `POST /v2/borrower/login` with credentials.
5. Confirm authenticated portal calls `GET /v2/borrower/portal` with credentials.
6. Confirm Home Life Bundle calls use `/v2/borrower/home-life-bundle/...` and do not expose internal
   IDs or raw codes unless the backend explicitly permits display.
7. Confirm a mutating request calls `GET /v2/csrf-cookie` first when the CSRF cookie is missing.
8. Confirm expected errors are handled safely:
   - `401` means login/session is required.
   - `419` means CSRF/session refresh is required.
   - `422` means validation failed.
   - `500` should show a generic borrower-safe error.

## Deferred

- Automated staging smoke tests for CORS, CSRF, and session-cookie behavior.
- Consolidating endpoint-specific docs into one generated API client reference.
- Replacing temporary sessionStorage handoff keys with a protected portal state layer.
