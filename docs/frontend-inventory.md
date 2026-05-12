# Frontend Routes & Actions Inventory

_Last updated: 2026-05-12. Source of truth for Codex handoff. All "needs DB" items are marked._

Legend: ✅ working (mock) · 🟡 partial / placeholder · 🔌 needs DB/API · ❌ not built

## Marketing / Public

| Route | Page | Primary actions | Status | Storage key | Codex dep |
|---|---|---|---|---|---|
| `/` | Landing | Start qualification, login | ✅ | – | auth |
| `/purchase` | Purchase funnel | Continue to qualification | ✅ | – | – |
| `/refinance` | Refinance funnel | Continue to qualification | ✅ | – | – |
| `/pre-purchase` | Snapshot intake | Compute snapshot, save scenario | ✅ | `approvu.scenarios` | snapshot persistence |

## Internal (linear prototype demo)

| Route | Page | Primary actions | Status | Storage key | Codex dep |
|---|---|---|---|---|---|
| `/internal/full-application` | All hub sections single-scroll | Section nav | ✅ | – | – |
| `/internal/borrower-dashboard` | Dashboard demo | Continue / view | ✅ | – | – |
| `/internal/mortgage-offers` | Offer cards | Select offer | 🟡 | – | offer selection API |
| `/internal/account-handoff` | 2FA + account creation | Continue | 🟡 | – | auth + OTP |

## Borrower Application Flow (`/applications/$applicationId/*`)

| Route | Page | Primary actions | Status | Storage key | Codex dep |
|---|---|---|---|---|---|
| `/property-financing/property` | Property type | Save & next | ✅ | `approvu.app.<id>` | application table |
| `/property-financing/target-property` | Target | Save & next | ✅ | same | – |
| `/property-financing/purchase-plan` | Plan | Save & next | ✅ | same | – |
| `/property-financing/down-payment` | Down payment | Save & next | ✅ | same | – |
| `/property-financing/current-mortgage` | Current mortgage | Save & next | ✅ | same | – |
| `/property-financing/refinance-request` | Refi request | Save & next | ✅ | same | – |
| `/property-financing/renewal-preferences` | Renewal | Save & next | ✅ | same | – |
| `/mortgage-request` | Loan amount/term | Save & next | ✅ | same | – |
| `/qualified-mortgages` | Product matches | Learn more, prioritize | ✅ | same | product engine |
| `/product-priority` | Prioritize | Reorder, save | ✅ | same | – |
| `/product-review-consent` | Consent | Send reminder, sign | ✅ | same | e-sign provider |
| `/submit` | Submit | Submit application | 🟡 | same | submission API |

## Borrower Portal (`/portal/*`)

| Route | Page | Primary actions | Status | Storage key | Codex dep |
|---|---|---|---|---|---|
| `/portal` / `/portal/index` | Hub landing | Quick actions, bank connect | ✅ | `approvu.activity` | – |
| `/portal/applications` | Active + previous list | Continue, view | ✅ | – | applications table |
| `/portal/applications/$id` | Application overview | View sections | ✅ | – | – |
| `/portal/applications/$id/qualification-summary` | Summary | – | ✅ | – | – |
| `/portal/applications/$id/offers` | Offers per app | Select offer | 🟡 | – | offer/lender API |
| `/portal/applications/$id/conditions` | Conditions | Upload, mark done | 🟡 | – | conditions table |
| `/portal/home` (+/equity, /renewal) | Homeowner hub | Equity tab, renewal toggles | ✅ | local | property AVM, lender shop |
| `/portal/wallet` | Wallet | View receipts, redeem | ✅ | – | payments + offers |
| `/portal/documents` | Doc vault | Upload, bank connect | 🟡 | – | storage + scan |
| `/portal/messages` | Inbox | Send/read | 🟡 | local | realtime channel |
| `/portal/appointments` | Appointments | Reschedule, book | 🟡 | – | calendar integration |
| `/portal/notifications` | Notifications | Mark read | ✅ | `approvu.activity` | server push |
| `/portal/help` | Help | Contact | ✅ | – | – |
| `/portal/disclosures` | Disclosures | Read | ✅ | – | – |
| `/portal/settings` | Settings index | – | ✅ | – | – |
| `/portal/settings/profile` | Profile | Edit, verify, download data, close acct | 🟡 | – | profile + PIPEDA |
| `/portal/settings/communications` | Comms prefs | Toggle | ✅ | local | – |
| `/portal/settings/notifications` | Notif prefs | Toggle | ✅ | local | – |
| `/portal/settings/preferences` | App prefs | Toggle | ✅ | local | – |
| `/portal/settings/security` (+/activity) | Security | Change password, view sessions | 🟡 | – | auth |
| `/portal/settings/payment-methods` | Cards | Add, download receipt | 🟡 | – | Stripe |
| `/portal/settings/connections` | Connected accts | Bank connect, disconnect | 🟡 | local | Flinks/Plaid |
| `/portal/settings/consents` | Consents | Manage | ✅ | local | – |
| `/portal/settings/emergency` | Emergency contact | Edit | ✅ | local | – |
| `/portal/settings/privacy` | Privacy | View details, manage | ✅ | local | – |

## Mortgage Tools (`/portal/tools/*`)

All 14 tools are ✅ working with mock inputs and `approvu.scenarios` persistence:
affordability, payment-calculator, closing-costs, debt-consolidation, down-payment,
home-equity, insurance-premium, land-transfer-tax, portability, prepayment,
refinance-savings, renewal-comparison, rent-vs-buy, scenario-compare, stress-test,
plus `/saved` (list) and `/portal/tools` (index).

## Admin Frontend

> **Note:** Admin routes are intentionally **not part of this borrower/frontend project**.
> The admin panel is being built in a **separate Lovable project** and will be merged
> by Codex later. See [`project-boundary.md`](./project-boundary.md).

The following surfaces from the QA brief have no routes in `src/routes/` here
because they belong to the separate Admin Lovable project:

- Admin Dashboard, Sidebar, Top nav
- Partner Growth Engine, Partners, Offer Partners, Marketing Attribution
- Standard Offers, Partner Offers, Offer Bundles
- Qualification Sessions / Results, Mortgage Snapshots admin views
- Applications list, Mortgage Application Command Centre
- Borrower Profiles (admin), Subject Property, Other Properties, Financing & Equity (admin)
- Mortgage Request (admin), Qualification Analysis, Product Eligibility Trace
- Qualified Products, Product Submission Queue
- Conditions, Documents, Notes, Consents, Decline/Cancellation, Activity Log
- Condition Engine, Document Vault, Task Center, Property Intelligence
- Lenders, Products, Rate/Pricing profiles, Settings, Roles & Permissions

Recommendation: do not build admin surfaces in this project. Codex will merge
the borrower frontend with the separate Admin Lovable project before backend wiring.