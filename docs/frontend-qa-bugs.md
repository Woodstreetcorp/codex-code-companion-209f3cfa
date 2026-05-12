# Frontend QA Bug List

_Last updated: 2026-05-12._

## Fixed (this and prior passes)

| # | Bug | Route | Severity | Status |
|---|---|---|---|---|
| 1 | Active application card had two equally weighted CTAs | `/portal/applications` | High | Fixed — Continue is primary |
| 2 | Connect Bank Account button did nothing | `/portal/documents`, `/portal/home`, `/portal/settings/connections` | High | Fixed — multi-step dialog |
| 3 | "Send Reminder" co-borrower button dead | `/applications/$id/product-review-consent` | Medium | Fixed |
| 4 | "Learn More" header chip dead | `/applications/$id/qualified-mortgages` | Low | Fixed |
| 5 | "Select this offer" dead | `/portal/applications/$id/offers` | High | Fixed (toast) |
| 6 | "Reschedule" dead | `/portal/appointments` | Medium | Fixed |
| 7 | "Download my data" dead | `/portal/settings/profile` | Medium | Fixed |
| 8 | "Close account" dead (no confirm) | `/portal/settings/profile` | High | Fixed (confirm + toast) |
| 9 | "Verify" contact-row button dead | `/portal/settings/profile` | Medium | Fixed |
| 10 | "Download" receipt button dead | `/portal/settings/payment-methods` | Medium | Fixed |
| 11 | "View details" consent button dead | `/portal/settings/privacy` | Low | Fixed |

## Open — needs DB/API (Codex phase)

| # | Bug | Route | Severity | Status |
|---|---|---|---|---|
| 12 | Submit application has no real persistence | `/applications/$id/submit` | Critical | Needs DB |
| 13 | Documents upload is client-only (no scan, no storage) | `/portal/documents` | Critical | Needs DB + storage |
| 14 | Bank Connect simulates Flinks/Plaid only | bank dialog | High | Needs provider SDK |
| 15 | Messages are local seed only | `/portal/messages` | High | Needs realtime |
| 16 | Notifications are localStorage only | `/portal/notifications` | High | Needs server push |
| 17 | Appointments don't sync to a calendar | `/portal/appointments` | Medium | Needs calendar API |
| 18 | Conditions status changes not persisted | `/portal/applications/$id/conditions` | High | Needs DB |
| 19 | Selected offers not persisted to application state | `/portal/applications/$id/offers` | High | Needs DB |
| 20 | Receipts are toast only (no PDF) | `/portal/settings/payment-methods` | Low | Needs PDF endpoint |
| 21 | Account close / data export are toasts | `/portal/settings/profile` | Medium | Needs compliance flow |
| 22 | Email/phone verification is toast only | `/portal/settings/profile` | Medium | Needs OTP service |
| 23 | No real auth gate on `/portal/*` | all portal routes | Critical | Needs auth |
| 24 | No 2FA enforcement | `/internal/account-handoff` | Critical | Needs auth + OTP |
| 25 | Property values / comps are static mock | `/portal/home/equity` | Medium | Needs AVM |
| 26 | Renewal "shop the market" is toast only | `/portal/home/renewal` | Medium | Needs lender shop pipeline |

## Open — admin frontend not built

| # | Bug | Route | Severity | Status |
|---|---|---|---|---|
| 27 | No admin dashboard exists | `/admin/*` | Critical | Open — needs build phase |
| 28 | No partner directory / growth engine | `/admin/partners` | Critical | Open — needs build phase |
| 29 | No offer builder (standard, partner, bundles) | `/admin/offers` | Critical | Open — needs build phase |
| 30 | No mortgage application command centre | `/admin/applications/$id` | Critical | Open — needs build phase |
| 31 | No condition engine, document vault admin, task center | `/admin/*` | High | Open — needs build phase |
| 32 | No lenders / products / pricing admin | `/admin/products` | High | Open — needs build phase |
| 33 | No roles & permissions UI | `/admin/settings/roles` | High | Open — needs build phase |

## Visual / responsive

No critical layout breaks observed at 360px, 768px, 1024px, and 1440px during the borrower QA pass.
Tables on `/portal/applications` and `/portal/wallet` collapse to cards on mobile. Sidebar
converts to horizontal scroll nav on mobile via `PORTAL_NAV` in `portal.tsx`.

## Accessibility

- Skip-to-content link present on `__root.tsx` ✅
- `aria-live` region for toast announcements ✅
- All form inputs have associated `<label>` elements ✅
- Focus rings preserved on all `Button` and `<button>` variants ✅
- Outstanding: some icon-only buttons (e.g. notification bell mobile) need `aria-label` audit.