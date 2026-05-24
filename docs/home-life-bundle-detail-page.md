# Home Life Bundle Detail Page

## Scope

This PR adds a borrower-safe Home Life Bundle detail page at `/portal/home-life-bundle`.
The page preserves the existing borrower portal visual language and does not add redemption
actions, admin metadata, or partner-management views.

## Borrower APIs Used

- `GET /v2/borrower/home-life-bundle/summary`
- `GET /v2/borrower/home-life-bundle/assignments`
- `GET /v2/borrower/home-life-bundle/selected-offers`
- `GET /v2/borrower/home-life-bundle/redeemable-codes/summary`
- `GET /v2/borrower/home-life-bundle/offers/{publicReference}`

All API calls use the shared Laravel session helper with `credentials: "include"` and
`VITE_APPROVU_API_BASE_URL`.

## Page Behavior

- Shows assigned bundle status.
- Shows selected offers.
- Shows redeemable code summary.
- Loads safe standard offer detail when the borrower selects an offer.
- Links back to `/portal`.
- Shows loading, error, and empty states.

## Safe Field Policy

The adapter maps responses into explicit borrower-safe display fields only:

- public references
- labels
- statuses
- borrower-safe descriptions
- dates
- selected/redeemable summary counts

The page does not render internal IDs, admin-only fields, partner internal metadata, private notes,
or operational assignment data.

## Deferred

- Offer redemption actions.
- Partner terms and conditions detail pages.
- Full Home Life Wallet replacement.
- Real-time bundle status updates.
- Admin-only bundle diagnostics.
