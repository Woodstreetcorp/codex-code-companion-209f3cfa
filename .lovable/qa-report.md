# Frontend QA Report — Borrower Portal & Application Flows

Scope: `/portal/*`, `/applications/*`, `/internal/*`, marketing routes.
Admin surfaces (Partner Directory, Offer Builder, etc.) intentionally **out of scope** — those routes do not exist in the codebase yet.

## Fixed in this pass (9 dead buttons wired)

| Surface | Element | Behavior added |
|---|---|---|
| `/applications/$id/product-review-consent` | "Send Reminder" per co-borrower | toast confirmation per name |
| `/applications/$id/qualified-mortgages` | "Learn More" header chip | opens docs in new tab |
| `/portal/applications/$id/offers` | "Select this offer" per card | toast + advisor-notified copy |
| `/portal/appointments` | "Reschedule" per upcoming | toast confirmation |
| `/portal/settings/profile` | "Download my data" | toast confirmation |
| `/portal/settings/profile` | "Close account" | `window.confirm` → toast |
| `/portal/settings/profile` | "Verify" per contact row | toast confirmation |
| `/portal/settings/payment-methods` | "Download" per receipt row | toast confirmation |
| `/portal/settings/privacy` | "View details" per consent | toast (placeholder for doc viewer) |

## Verified clickable / no action needed
- Top nav (notifications bell, avatar → profile) ✓
- Sidebar / mobile horizontal nav (PORTAL_NAV) ✓
- Support FAB (chat / call / book / help) ✓
- Skip-to-content link + `aria-live` region ✓
- Application card CTAs reordered: **Continue application** primary, View hub secondary
- Bank Connect dialog (multi-step) wired in Documents, Home, Settings → Connections
- All 14 tools render and update local state on input
- Saved scenarios hub list/rename/share/push functional via localStorage
- Renewal page touchpoint toggles, equity tab switcher, comp list ✓
- Settings panes (communications, connections, emergency, notifications, payment-methods, preferences, privacy, security, profile) all interactive
- Empty/loading/toast states present in: documents, messages, appointments, notifications, applications hub

## Known limitations (need backend in Codex phase)

These work as **prototype-grade interactions** but will need real APIs:

| Feature | What's mocked today | Needs |
|---|---|---|
| Application persistence | localStorage + module seed | DB writes per step |
| Document upload | client-only file picker + toast | S3-style upload + virus scan + advisor notification |
| Bank connect | simulated Flinks/Plaid pipeline | real provider SDK + webhook to ingest statements |
| Offer selection | toast only | Application status change + lender notification + audit log |
| Messages | local seed array | realtime channel (WebSocket / Supabase realtime) |
| Notifications | localStorage activity feed | server-pushed notifications + read state per device |
| Appointments | local list | calendar integration (Google/iCal), advisor availability |
| Receipt downloads | toast only | PDF generation endpoint |
| Account close / data export | toast only | Compliance workflow (PIPEDA/Law 25) |
| Verification (email/phone) | toast only | OTP service |
| Property value / comps | static mock | HouseSigma or AVM API |
| Renewal review | toast only | Lender shopping pipeline |

## Route map (for Codex handoff)

### Portal hub
- `/portal` — landing
- `/portal/applications` — list
- `/portal/applications/$applicationId` — overview
- `/portal/applications/$applicationId/qualification-summary`
- `/portal/applications/$applicationId/offers`
- `/portal/applications/$applicationId/conditions`
- `/portal/documents` — vault + bank connect
- `/portal/wallet` — Home Life bundle
- `/portal/messages`
- `/portal/notifications`
- `/portal/appointments`
- `/portal/help`
- `/portal/disclosures`

### Homeowner Hub
- `/portal/home` — My Mortgage
- `/portal/home/renewal`
- `/portal/home/equity`

### Tools (14)
- `/portal/tools` — landing with recommendations
- `/portal/tools/saved` — saved scenarios hub
- affordability, payment-calculator, stress-test, scenario-compare, prepayment, refinance-savings, renewal-comparison, debt-consolidation, home-equity, rent-vs-buy, down-payment, closing-costs, land-transfer-tax, insurance-premium, portability

### Settings
- `/portal/settings/profile`
- `/portal/settings/notifications`
- `/portal/settings/communications`
- `/portal/settings/payment-methods`
- `/portal/settings/preferences`
- `/portal/settings/privacy`
- `/portal/settings/consents`
- `/portal/settings/security` + `/portal/settings/security/activity`
- `/portal/settings/connections`
- `/portal/settings/emergency`

### Application flow
- `/applications/$applicationId/property-financing/{purchase-plan,target-property,property,down-payment,current-mortgage,refinance-request,renewal-preferences}`
- `/applications/$applicationId/{mortgage-request,product-priority,product-review-consent,qualified-mortgages,submit}`

### Marketing & internal demo
- `/`, `/purchase`, `/refinance`, `/pre-purchase`
- `/internal/full-application`, `/internal/mortgage-offers`, `/internal/account-handoff`

## Recommendation before Codex handoff

1. **Build admin surface first** as separate effort — doesn't exist yet.
2. **Replace `localStorage` mocks** in `src/components/portal/data.ts` and `src/components/portal/activity.ts` with API-backed hooks. Both already have well-typed shapes.
3. **Document upload** in `src/routes/portal.documents.tsx` is the most complex stub — wire to real storage early.
