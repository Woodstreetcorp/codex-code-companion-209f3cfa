/**
 * laravelSession.ts — shared utilities for the borrower SPA Laravel session auth.
 *
 * Background
 * ----------
 * The borrower portal is a standalone Vite SPA. It authenticates against the
 * Laravel backend using standard web-session auth (credentials: "include").
 * Laravel's VerifyCsrfToken middleware requires a valid CSRF token on every
 * state-changing request (POST / PUT / PATCH / DELETE).
 *
 * Because the SPA is not served from a Laravel Blade template, there is no
 * <meta name="csrf-token"> tag available. Instead:
 *
 *   1. The SPA calls GET /v2/csrf-cookie.
 *      Laravel's middleware attaches the XSRF-TOKEN cookie (not HttpOnly).
 *   2. The SPA reads the cookie value with JavaScript.
 *   3. The SPA sends the decoded value as the X-XSRF-TOKEN header on all
 *      state-changing requests.
 *   4. Laravel validates X-XSRF-TOKEN against the session CSRF token. ✓
 *
 * This module exports:
 *   - getApiBaseUrl()         — reads VITE_APPROVU_API_BASE_URL
 *   - buildApiUrl(path)       — combines base URL with path
 *   - getXsrfTokenFromCookie() — reads and decodes the XSRF-TOKEN cookie
 *   - initializeCsrfCookie()  — calls GET /v2/csrf-cookie if token absent;
 *                               caches raw token from body for cross-origin
 *   - csrfHeaders()           — returns X-CSRF-TOKEN (cross-origin, raw token)
 *                               or X-XSRF-TOKEN (same-origin, cookie) or {}
 *   - fetchWithLaravelSession() — main fetch wrapper for all API calls
 *
 * Same-origin deployment
 * ----------------------
 * Set VITE_APPROVU_API_BASE_URL="" (blank) when the frontend and backend are
 * served from the same origin (recommended for Cloudways soft launch).
 * All fetch calls will use relative paths.
 *
 * Cross-origin deployment
 * -----------------------
 * Set VITE_APPROVU_API_BASE_URL=https://api.approvu.ca.
 * The Laravel backend must have FRONTEND_URL set to the SPA origin and
 * supports_credentials=true in config/cors.php. Session cookies require
 * SESSION_SAME_SITE=none and SESSION_SECURE_COOKIE=true over HTTPS.
 */

// ── Base URL ──────────────────────────────────────────────────────────────────

import { resolvePreviewMock } from "./previewMocks";

/**
 * Returns the API base URL without a trailing slash.
 * Empty string signals same-origin deployment (relative fetch paths).
 */
export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_APPROVU_API_BASE_URL ?? "").replace(/\/+$/, "");
}

/**
 * Combines the API base URL with an absolute path (must start with '/').
 * Returns a relative URL when VITE_APPROVU_API_BASE_URL is blank.
 */
export function buildApiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

/**
 * Detects an "unconfigured preview" environment: a Lovable preview host with no
 * VITE_APPROVU_API_BASE_URL set. In that case there is no Laravel backend, so
 * relative /v2/* requests would hit the app's own SSR server and return 500
 * ("Only HTML requests are supported here"). We short-circuit those calls to a
 * synthetic 401 so the app's existing auth handling (redirect to /login) runs
 * without surfacing hard 500 errors.
 *
 * Production same-origin deployments (e.g. Cloudways) are NOT on a lovable host,
 * so they are unaffected and continue to use relative /v2/* paths against Laravel.
 */
export function isUnconfiguredPreview(): boolean {
  if (getApiBaseUrl() !== "") return false;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith(".lovableproject.com") || host.endsWith(".lovable.app");
}

// ── CSRF cookie helpers ───────────────────────────────────────────────────────

/**
 * In-memory CSRF token cache for cross-origin deployments.
 *
 * When the SPA runs on a different domain from the API (e.g. a Cloudflare
 * Workers deployment at workers.dev vs. api-staging.approvu.com),
 * document.cookie on the SPA's domain cannot read cookies set by the API
 * domain. This means getXsrfTokenFromCookie() always returns "" and the
 * X-XSRF-TOKEN header is never sent — resulting in a 419 CSRF mismatch.
 *
 * To handle this, GET /v2/csrf-cookie also returns the raw CSRF token in its
 * JSON body as { token: "..." }. initializeCsrfCookie() extracts and caches
 * it here for the lifetime of the page. csrfHeaders() then uses X-CSRF-TOKEN
 * (which Laravel validates directly without decryption, unlike X-XSRF-TOKEN
 * which expects the encrypted cookie value).
 *
 * Same-origin deployments fall through to the XSRF-TOKEN cookie path and are
 * unaffected by this change.
 */
let _csrfTokenFromBody: string | null = null;

/**
 * Reads the XSRF-TOKEN cookie set by Laravel's VerifyCsrfToken middleware.
 * The value is URL-encoded by the browser; we decode it before use.
 * Returns an empty string in SSR environments or when the cookie is absent.
 *
 * Note: in cross-origin deployments this always returns "" because the cookie
 * is set on the API domain, not the SPA domain. Use _csrfTokenFromBody in
 * that case (populated by initializeCsrfCookie from the response body).
 */
export function getXsrfTokenFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Ensures a CSRF token is available before any mutating request.
 *
 * Idempotent: skips the network call when the token is already cached
 * (either in memory from the response body or from the cookie for same-origin).
 *
 * On success in cross-origin deployments, extracts { token } from the JSON
 * response body and caches it in _csrfTokenFromBody so that csrfHeaders()
 * can include it as X-CSRF-TOKEN on the next mutation.
 *
 * Errors are swallowed — the subsequent mutation will fail with 419
 * rather than crashing the app at initialization time.
 */
export async function initializeCsrfCookie(): Promise<void> {
  // Already have a token from the response body (cross-origin path).
  if (_csrfTokenFromBody !== null) return;
  // Already have a readable cookie (same-origin path).
  if (getXsrfTokenFromCookie() !== "") return;

  // No backend in this preview — skip the network call to avoid a 500.
  if (isUnconfiguredPreview()) return;

  try {
    const res = await fetch(buildApiUrl("/v2/csrf-cookie"), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    // Cross-origin: parse the raw token from the response body.
    // Laravel returns { ok: true, token: "<csrf_token()>" } so the SPA can
    // cache it when document.cookie is unreadable across domains.
    if (res.ok) {
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (typeof json.token === "string" && json.token) {
        _csrfTokenFromBody = json.token;
      }
    }
  } catch {
    // Non-fatal. The caller will get a 419 if CSRF is still required.
  }
}

/**
 * Returns the CSRF header object to include on mutating requests.
 *
 * Cross-origin path (token from response body):
 *   Returns { "X-CSRF-TOKEN": token }
 *   Laravel validates this header against the session token directly
 *   (no decryption), matching the raw csrf_token() value we send.
 *
 * Same-origin path (token from XSRF-TOKEN cookie):
 *   Returns { "X-XSRF-TOKEN": token }
 *   Laravel decrypts the encrypted cookie value and compares it.
 *
 * Returns {} when no token is available (SSR or uninitialised).
 */
export function csrfHeaders(): Record<string, string> {
  if (_csrfTokenFromBody !== null) return { "X-CSRF-TOKEN": _csrfTokenFromBody };
  const token = getXsrfTokenFromCookie();
  return token ? { "X-XSRF-TOKEN": token } : {};
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

/**
 * Main fetch wrapper for all borrower API calls.
 *
 * Always:
 *   - Adds Accept: application/json
 *   - Adds credentials: "include"
 *
 * For mutating requests (POST / PUT / PATCH / DELETE):
 *   - Calls initializeCsrfCookie() to ensure a CSRF token is available
 *   - Adds X-CSRF-TOKEN header (cross-origin: raw token from body) or
 *     X-XSRF-TOKEN header (same-origin: encrypted cookie value)
 *
 * Content-Type:
 *   - Callers set Content-Type: application/json for JSON bodies
 *   - FormData uploads must NOT set Content-Type — the browser sets it
 *     with the correct multipart boundary. This wrapper preserves that
 *     behavior by not auto-inserting Content-Type.
 *
 * Usage:
 *   const response = await fetchWithLaravelSession(
 *     buildApiUrl("/v2/borrower/login"),
 *     { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
 *   );
 */
export async function fetchWithLaravelSession(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  // No backend in this preview — return realistic demo data so every portal
  // page renders without a login/account wall instead of hitting the SSR
  // server (500) or failing auth (401).
  if (isUnconfiguredPreview()) {
    const method = ((init.method ?? "GET") as string).toUpperCase();
    const body = resolvePreviewMock(method, url);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const method = ((init.method ?? "GET") as string).toUpperCase();
  const isMutating =
    method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

  // Resolve the correct CSRF header for mutating requests.
  // csrfHeaders() returns X-CSRF-TOKEN (raw token, cross-origin) or
  // X-XSRF-TOKEN (encrypted cookie, same-origin) as appropriate.
  const csrfHeader: Record<string, string> = {};
  if (isMutating) {
    await initializeCsrfCookie();
    Object.assign(csrfHeader, csrfHeaders());
  }

  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...flattenHeaders(init.headers),
      ...csrfHeader, // always last so it is not overridden by caller headers
    },
  });
}

// ── Internal ──────────────────────────────────────────────────────────────────

/**
 * Normalises the HeadersInit union into a plain Record for object spread.
 */
function flattenHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers) as Record<string, string>;
  }
  return headers as Record<string, string>;
}
