# Frontend CSRF Cookie Support & Environment Hardening

**Branch:** `codex/frontend-csrf-env-hardening`  
**PR:** 13B — Borrower Frontend CSRF Cookie Support + .env.example  
**Date:** 2026-05-15  
**Related:** [Backend Hardening](../../approvu-platform/docs/launch/borrower-mvp-environment-hardening.md)

---

## Overview

The borrower SPA authenticates against the Laravel backend using standard web-session auth
(`credentials: "include"`). Before this PR, all API adapters read the CSRF token from a
`<meta name="csrf-token">` tag — a pattern that only works when the SPA is served from a
Laravel Blade template.

Because the borrower portal is a **standalone Vite SPA** with no Blade templates, the meta
tag is never populated. This means all POST/PUT/PATCH/DELETE requests silently omitted the
CSRF token. In production (where `VerifyCsrfToken` is active), every mutating request would
return **419 Page Expired**.

This PR replaces the broken meta-tag approach with Laravel's recommended cookie-based XSRF
flow and centralises all session/CSRF logic in a single shared helper.

---

## Changes

### 1. `src/lib/api/laravelSession.ts` (new)

Shared utilities for Laravel session auth. Exports:

| Export | Purpose |
|--------|---------|
| `getApiBaseUrl()` | Reads `VITE_APPROVU_API_BASE_URL`; strips trailing slash |
| `buildApiUrl(path)` | Prepends base URL; returns relative URL when base is blank |
| `getXsrfTokenFromCookie()` | Reads and URL-decodes the `XSRF-TOKEN` cookie |
| `initializeCsrfCookie()` | Calls `GET /v2/csrf-cookie` if token absent (idempotent) |
| `csrfHeaders()` | Returns `{ 'X-XSRF-TOKEN': token }` or `{}` |
| `fetchWithLaravelSession(url, init)` | Main fetch wrapper — see below |

#### `fetchWithLaravelSession` behaviour

- Always adds `Accept: application/json` and `credentials: "include"`
- For mutating requests (POST/PUT/PATCH/DELETE):
  - Calls `initializeCsrfCookie()` if no token is present yet
  - Adds `X-XSRF-TOKEN` header from the cookie value
- Does **not** auto-add `Content-Type` — callers set it for JSON bodies;
  FormData uploads must omit it (browser sets the multipart boundary)
- Caller-supplied headers always take precedence over defaults, **except**
  `X-XSRF-TOKEN` which is always appended last (cannot be overridden by caller)

#### CSRF cookie flow (end-to-end)

```
1. SPA calls fetchWithLaravelSession() on a mutating endpoint
2. If XSRF-TOKEN cookie is absent → initializeCsrfCookie() fires:
      GET /v2/csrf-cookie (credentials: "include")
      Laravel middleware sets XSRF-TOKEN cookie (not HttpOnly)
3. SPA reads XSRF-TOKEN cookie, URL-decodes the value
4. SPA sends decoded value as X-XSRF-TOKEN header
5. Laravel VerifyCsrfToken validates X-XSRF-TOKEN against session token ✓
```

The `/v2/csrf-cookie` endpoint was added to the Laravel backend in PR 12A
(`codex/borrower-mvp-env-hardening`).

### 2. All 8 API adapters updated

Each adapter had a local `apiBaseUrl()`, `endpoint()`, and `csrfToken()` helper
that duplicated the same logic. All three helpers are now removed and replaced with
imports from `laravelSession.ts`.

| Adapter | Methods changed | Notes |
|---------|----------------|-------|
| `borrowerAuthApi.ts` | `loginBorrower`, `getBorrowerSession`, `logoutBorrower` | `login` and `logout` are POST |
| `borrowerQualificationApi.ts` | `postQualification` (internal) | Covers all 3 flow variants |
| `borrowerAccountHandoffApi.ts` | `createBorrowerAccountHandoff` | POST |
| `borrowerMortgageSnapshotApi.ts` | `generateMortgageSnapshot`, `getMortgageSnapshot` | POST + GET |
| `borrowerDocumentApi.ts` | `listBorrowerDocuments`, `listBorrowerDocumentRequests`, `uploadBorrowerDocument` | FormData upload — no Content-Type |
| `borrowerPortalApi.ts` | `getBorrowerPortalSummary` | GET only |
| `borrowerApplicationSummaryApi.ts` | `getBorrowerApplicationSummary` | GET only |
| `borrowerOfferReviewApi.ts` | `getBorrowerOfferReviewStatus` | GET only |

#### FormData upload — special care

`uploadBorrowerDocument` sends `multipart/form-data`. The `Content-Type` header must **not**
be set manually — the browser sets it automatically with the correct `boundary` parameter.
`fetchWithLaravelSession` does not auto-add `Content-Type`, so this is safe. CSRF is still
injected because the upload is a POST.

### 3. `.env.example` (new)

Documents the two required Vite environment variables:

```dotenv
VITE_APPROVU_API_BASE_URL=   # blank = same-origin; full URL = cross-origin
VITE_GOOGLE_MAPS_API_KEY=    # required for address autocomplete
```

Includes per-deployment commentary explaining when each value is needed and what the
corresponding Laravel backend requirements are for cross-origin mode.

---

## Deployment configuration

### Same-origin (recommended — Cloudways soft launch)

Nginx proxies `/v2/*` to the Laravel backend on the same origin.

```dotenv
VITE_APPROVU_API_BASE_URL=
```

- All `buildApiUrl("/v2/...")` calls produce relative paths (e.g. `/v2/borrower/login`)
- No CORS headers required
- Session cookies are `SameSite=Lax` — no special configuration needed

### Cross-origin

SPA is served from `https://borrower-staging.approvu.com`; API is at `https://api-staging.approvu.com`.

```dotenv
VITE_APPROVU_API_BASE_URL=https://api-staging.approvu.com
```

Laravel backend must have:

```dotenv
FRONTEND_URL=https://borrower-staging.approvu.com
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
```

And `config/cors.php`:
```php
'supports_credentials' => true,
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
```

---

## Local development

```bash
cp .env.example .env
# Edit .env:
#   VITE_APPROVU_API_BASE_URL=http://localhost:8000   (if running Laravel locally)
#   VITE_GOOGLE_MAPS_API_KEY=<your-dev-key>

bun install
bun run dev
```

The Vite dev server proxies nothing by default. For local full-stack development,
either set `VITE_APPROVU_API_BASE_URL` to the Laravel dev server URL, or configure
a Vite proxy in `vite.config.ts`.

---

## Why `X-XSRF-TOKEN` instead of `X-CSRF-TOKEN`

Laravel supports both headers, but the cookie-based flow uses `X-XSRF-TOKEN`:

| Header | Source | When to use |
|--------|--------|-------------|
| `X-CSRF-TOKEN` | `<meta name="csrf-token">` on a Blade page | Laravel Blade apps |
| `X-XSRF-TOKEN` | `XSRF-TOKEN` cookie set by Laravel | SPAs without Blade |

The Axios HTTP client uses `X-XSRF-TOKEN` automatically when it detects the cookie.
This PR implements the same flow manually for the native `fetch` API.

---

## What is deferred

| Item | Reason |
|------|--------|
| Automatic CSRF token refresh on 419 response | Post-soft-launch; 419 currently surfaces as a thrown Error |
| Retry logic on network failure | Post-soft-launch |
| Request cancellation (AbortController) | Post-soft-launch |
| Centralised error boundary / toast integration | UI layer concern, not adapter layer |
