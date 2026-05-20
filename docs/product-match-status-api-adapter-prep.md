# Product Match Status API Adapter Prep

## Purpose

PR 25E prepares the borrower frontend for a future borrower-safe product match status endpoint without changing the current conservative scaffold behavior.

This is adapter and documentation prep only. It does not add product cards, lender names, rates, match scores, selected products, fake product data, or approval wording.

## Future Endpoint

Future endpoint:

`GET /v2/borrower/application/product-match-status`

Frontend adapter:

`src/lib/api/borrowerProductMatchStatusApi.ts`

Exports:

- `getBorrowerProductMatchStatus()`
- `storeBorrowerProductMatchStatus(result)`
- `ProductMatchStatus`
- `ProductMatchReadiness`
- `ProductMatchStatusResponse`
- `ProductMatchNextStep`

The adapter uses:

- `buildApiUrl`
- `fetchWithLaravelSession`

## Response Shape

Expected future response shape:

```json
{
  "ok": true,
  "endpoint_available": true,
  "application_public_reference": "APP-123",
  "status": "advisor_review",
  "readiness": {
    "application_ready": true,
    "sections_ready": true,
    "consents_ready": true,
    "documents_ready": true,
    "advisor_review_ready": false,
    "open_request_count": 0,
    "missing_items": []
  },
  "next_step": {
    "label": "View Application Status",
    "action": "view_status",
    "route_hint": "/portal/application/review-submit",
    "message": "Your advisor will confirm next steps."
  },
  "message": "Your application is being reviewed.",
  "generated_at": "2026-05-20T12:00:00Z"
}
```

All fields are optional on the frontend. The adapter sanitizes `status` to the allowed borrower-safe status list.

## Allowed Safe Statuses

- `not_ready`
- `missing_information`
- `advisor_review`
- `options_being_prepared`
- `options_ready_placeholder`
- `lender_review_placeholder`

Unknown statuses are treated as `null` by the adapter so current UI can fall back to derived scaffold status.

## Safe Fallback Behavior

The endpoint may not exist yet.

If the endpoint returns `404`, the adapter returns:

```json
{
  "ok": false,
  "endpoint_available": false,
  "status": null,
  "message": "Product match status is not available yet."
}
```

If the network request fails, the adapter also returns a non-throwing fallback response. This lets future UI keep using the current conservative derived status without noisy borrower-facing errors.

Other non-OK responses return a typed `ok: false` response with `endpoint_available: true` and any backend message when available.

## Current Integration

The adapter is intentionally not wired into `/portal/application` or `/portal/offers` in this PR.

Current pages continue using conservative derived statuses from existing application status, review request, readiness, and offer review data. This avoids calling a future endpoint before backend support is live.

## No Product Cards Rule

This PR does not show:

- product cards
- lender names
- rates
- payment estimates
- match scores
- selected products
- fake product data
- approval language

The shared guardrail copy remains in:

`src/lib/productMatching/productMatchCopy.ts`

## When To Wire Fully

Wire the adapter into `/portal/application` or `/portal/offers` only after the backend endpoint exists and returns borrower-safe status data.

Suggested future behavior:

1. Load the existing derived scaffold status immediately.
2. Call `getBorrowerProductMatchStatus()` in the background.
3. If `endpoint_available` is true and `status` is one of the allowed safe statuses, use that status.
4. If unavailable, missing, or invalid, keep the current derived status.
5. Do not show endpoint-unavailable errors to borrowers unless product match status becomes a required workflow step.

## QA Steps

1. Import the adapter in a local scratch branch or test harness.
2. Mock a 200 response for each allowed safe status and confirm `status` is preserved.
3. Mock an unknown status and confirm the returned `status` is `null`.
4. Mock a 404 and confirm `endpoint_available` is false and no exception is thrown.
5. Mock a network failure and confirm a fallback response is returned.
6. Confirm `/portal/application` still uses the existing conservative Product Match Status card.
7. Confirm `/portal/offers` still avoids lender names, rates, match scores, fake data, and approval wording.

## Deferred Items

- backend product match status endpoint
- full route integration
- product option cards
- selected products UI
- lender packaging status UI
- admin product matching review screens
- legal-reviewed borrower-safe product option copy
