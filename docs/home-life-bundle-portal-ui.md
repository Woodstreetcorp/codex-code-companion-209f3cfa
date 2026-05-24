# Home Life Bundle Portal UI Wiring

## Scope

This PR wires the borrower portal overview to the Laravel Home Life Bundle borrower APIs without
redesigning the existing portal UI.

## Frontend Surfaces

- `src/lib/api/borrowerHomeLifeBundleApi.ts`
  - Loads borrower-safe bundle summary data.
  - Loads assignment status, selected offers, and redeemable code summary data.
  - Exposes a safe offer detail helper for future detail surfaces.
  - Stores only summary counts/status in `sessionStorage`.
- `src/routes/portal.index.tsx`
  - Adds a Home Life Bundle summary card to the borrower portal dashboard.
  - Shows assigned bundle status.
  - Shows selected offers summary.
  - Shows redeemable offers/codes summary.
  - Handles loading, unavailable, and empty states without blocking the rest of the portal.

## API Paths Used

- `GET /v2/borrower/home-life-bundle/summary`
- `GET /v2/borrower/home-life-bundle/assignments`
- `GET /v2/borrower/home-life-bundle/selected-offers`
- `GET /v2/borrower/home-life-bundle/redeemable-codes/summary`
- `GET /v2/borrower/home-life-bundle/offers/{publicReference}`

All requests use the shared Laravel session helper with `credentials: "include"` and the configured
`VITE_APPROVU_API_BASE_URL`.

## Borrower-Safe Field Policy

The adapter maps backend responses into explicit borrower-safe fields only:

- public references
- display labels
- statuses
- safe descriptions
- selected/redeemable counts
- assignment and expiry dates

The UI does not render internal IDs, admin-only fields, or partner internal metadata.

## Empty And Failure States

- Missing or unavailable bundle endpoints show a non-blocking unavailable message.
- Empty assignments/offers/codes show conservative empty copy.
- The borrower can continue the mortgage journey even if bundle APIs are temporarily unavailable.

## Deferred

- Full Home Life Bundle detail page.
- Offer redemption actions.
- Partner terms and conditions views.
- Admin partner metadata display.
- Real-time offer status updates.
