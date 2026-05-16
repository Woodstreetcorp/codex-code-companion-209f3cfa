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
 *   - initializeCsrfCookie()  — calls GET /v2/csrf-cookie if token absent
 *   - csrfHeaders()           — returns { 'X-XSRF-TOKEN': token } or {}
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

// ── CSRF cookie helpers ───────────────────────────────────────────────────────

/**
 * Reads the XSRF-TOKEN cookie set by Laravel's VerifyCsrfToken middleware.
 * The value is URL-encoded by the browser; we decode it before use.
 * Returns an empty string in SSR environments or when the cookie is absent.
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
 * Ensures the XSRF-TOKEN cookie is set by calling GET /v2/csrf-cookie.
 * Skips the request if the cookie is already present (idempotent).
 * Errors are swallowed — the subsequent mutation will fail with 419
 * rather than crashing the app at initialization time.
 */
export async function initializeCsrfCookie(): Promise<void> {
  if (getXsrfTokenFromCookie() !== "") return;

  try {
    await fetch(buildApiUrl("/v2/csrf-cookie"), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    // Non-fatal. The caller will get a 419 if CSRF is still required.
  }
}

/**
 * Returns the X-XSRF-TOKEN header object to include on mutating requests.
 * Returns an empty object when no token is available (SSR or cookie absent).
 */
export function csrfHeaders(): Record<string, string> {
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
 *   - Calls initializeCsrfCookie() if XSRF-TOKEN cookie is absent
 *   - Adds X-XSRF-TOKEN header from the cookie value
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
  const method = ((init.method ?? "GET") as string).toUpperCase();
  const isMutating =
    method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

  // Resolve the X-XSRF-TOKEN for mutating requests.
  const xsrfHeader: Record<string, string> = {};
  if (isMutating) {
    await initializeCsrfCookie();
    const token = getXsrfTokenFromCookie();
    if (token) xsrfHeader["X-XSRF-TOKEN"] = token;
  }

  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...flattenHeaders(init.headers),
      ...xsrfHeader, // always last so it is not overridden by caller headers
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
