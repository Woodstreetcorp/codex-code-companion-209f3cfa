# Borrower Application Summary UI

**Branch:** `codex/borrower-application-summary-ui`  
**Files changed:** `src/lib/api/borrowerApplicationSummaryApi.ts`, `src/routes/portal.application.tsx`, `src/routeTree.gen.ts`, `src/routes/portal.index.tsx`  
**PR scope:** Application Workspace Summary page for the borrower portal, consuming `GET /v2/borrower/application-summary` (Laravel PR 10A).

---

## Route

| Item | Value |
|---|---|
| Route file | `src/routes/portal.application.tsx` |
| URL | `/portal/application` |
| Route ID | `/portal/application` |
| Parent route | `/portal` (`src/routes/portal.tsx`) |
| Page title | `Application Workspace — approvU` |

---

## API adapter

**File:** `src/lib/api/borrowerApplicationSummaryApi.ts`

### Types exported

| Type | Description |
|---|---|
| `ApplicationState` | `not_started \| in_progress \| needs_attention \| pending_review` |
| `SectionStatus` | `not_started \| in_progress \| needs_attention \| pending_review \| complete` |
| `PrimaryActionType` | `start_qualification \| view_mortgage_snapshot \| upload_documents \| review_application \| string` |
| `QualificationSummary` | safe_token_reference, path, location_city, location_province, started_at, submitted_at |
| `MortgageSnapshotSummary` | snapshot_reference, classification, readiness_status, key_insights_count, missing_items_count |
| `DocumentSummary` | total, requested, uploaded, reviewed, rejected, waived, next_required_document |
| `ApplicationSection` | key, label, status, description |
| `PrimaryAction` | label, action, route_hint |
| `BorrowerApplicationSummary` | Full response shape |

### Functions exported

| Function | Description |
|---|---|
| `getBorrowerApplicationSummary()` | `GET /v2/borrower/application-summary` with `credentials: "include"` |
| `storeBorrowerApplicationSummary(result)` | Caches `application_state`, `completion_percent`, `primary_action` to `sessionStorage` under `approvu:borrower-application-summary` |

### Endpoint

```
GET /v2/borrower/application-summary
Authorization: Laravel web session (credentials: "include")
Accept: application/json
```

---

## Page layout

### States

| State | Trigger | UI |
|---|---|---|
| Loading | API call in flight | Centered `Loader2` spinner + message |
| Error / unauthenticated | `!summary.ok` or fetch failure | Coral icon, error message, "Sign in" CTA → `/login` |
| Loaded | `summary.ok === true` | Full workspace view |

### Loaded layout (top to bottom)

1. **Page header** — "Application Workspace" label, "Your Application" title, subtitle
2. **Messages banner** — yellow, shown when `messages[]` is non-empty (AlertCircle icon per item)
3. **Progress card** — `completion_percent` as numeric + filled progress bar + `ApplicationState` chip
4. **Summary grid** (3 columns) — Qualification / Mortgage Snapshot / Documents panels
5. **Sections grid** — one card per entry in `sections[]` (up to 7), showing label + status badge + description
6. **Primary action CTA** — "Your next step" with `primary_action.label` and Continue link
7. **Quick links** — Document Vault (`/portal/documents`) and Back to portal (`/portal`)

---

## Section status mapping

| API status | Badge label | Badge colour |
|---|---|---|
| `complete` | Complete | Mint tint |
| `in_progress` | In Progress | Secondary/blue tint |
| `needs_attention` | Needs Attention | Coral tint |
| `not_started` | Not Started | Muted/grey |
| `pending_review` | Pending Review | Yellow tint |

---

## Primary action routing

| `action` value | Route |
|---|---|
| `start_qualification` | `/purchase` |
| `view_mortgage_snapshot` | `/portal` |
| `upload_documents` | `/portal/documents` |
| anything else | `/portal` |
| `route_hint` present | use `route_hint` directly |

---

## Portal home integration

`src/routes/portal.index.tsx` — the Application `PlaceholderCard` now passes:
```tsx
actionHref="/portal/application"
actionLabel="Continue Application"
```

This renders the "Continue Application →" link on the portal home card when the card has no `section` data, and also when section data is present (since `PlaceholderCard` shows the link whenever `actionHref` + `actionLabel` are both provided).

---

## routeTree.gen.ts changes

Added `PortalApplicationRoute` to:
- Import block
- Route registration (`PortalApplicationRouteImport.update(...)`)
- `FileRoutesByFullPath` interface
- `FileRoutesByTo` interface
- `FileRoutesById` interface
- `FileRouteTypes.fullPaths` union
- `FileRouteTypes.to` union
- `FileRouteTypes.id` union
- `FileRoutesByPath` declaration block
- `PortalRouteChildren` interface
- `PortalRouteChildren` object

---

## Auth behaviour

The page calls `getBorrowerApplicationSummary()` on mount with `credentials: "include"`. If the Laravel session is absent or expired:
- The API returns a non-OK response (typically 401)
- `parseResponse` throws an error
- The page shows the error state with a "Sign in" link to `/login`

No token storage is required — auth is handled by the Laravel web session cookie.

---

## QA steps

1. Sign in as a borrower with a completed qualification and snapshot
2. Navigate to `/portal/application` — expect progress card, qualification summary, and snapshot summary to be populated
3. Navigate to `/portal` — the Application card should show "Continue Application →" linking to `/portal/application`
4. Sign out and navigate directly to `/portal/application` — expect the error state with "Sign in" button
5. Sign in as a borrower with no qualification — expect empty qualification and snapshot panels, `completion_percent = 5`
6. With outstanding rejected document requests — expect document summary to highlight `rejected` count in coral and `needs_attention` application state
7. With all documents reviewed — expect `completion_percent = 80`, `pending_review` state

---

## Deferred / out of scope

- Deep-link section cards to specific sub-pages (e.g. clicking "Documents" section → `/portal/documents`)
- Real-time polling / WebSocket updates
- Progress animation on initial load
- PDF download of application summary
