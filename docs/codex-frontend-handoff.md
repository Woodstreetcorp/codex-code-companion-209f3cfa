# Codex Frontend → Backend Handoff

_Last updated: 2026-05-12. Tells Codex what to wire next._

## Important Codex Merge Context

- This Lovable project is the **borrower / frontend project only**.
- It should **not** be expected to contain admin routes.
- **Do not treat missing admin routes here as bugs.** They live in a separate
  Admin Lovable project.
- The admin frontend code will arrive from a **separate Lovable project**.
- Codex must **merge both Lovable projects first**, then perform final database
  wiring against the unified codebase.
- Borrower routes must remain under `/`, `/qualification`, `/portal`, and
  `/applications`.
- Admin routes (from the other project) should later live under `/admin` or
  `/internal/admin` after the merge.
- See [`project-boundary.md`](./project-boundary.md) for the full in-scope /
  out-of-scope breakdown.

## 1. Tables needed (Lovable Cloud / Supabase)

- `profiles` (1:1 `auth.users`) — name, phone, addresses, KYC status
- `user_roles` (separate table, app_role enum) — borrower, advisor, admin, partner
- `applications` — borrower, status, type (purchase/refi/renewal), stage, timestamps
- `application_steps` — per-step JSON payload from `/applications/$id/property-financing/*`, mortgage-request, qualified-mortgages, product-priority, consent
- `properties` — subject + other; AVM cache
- `mortgages` — current mortgages / lender / balance / renewal date
- `qualified_products` — output of product engine per application
- `selected_products` — borrower's prioritized choices
- `submissions` — to lender, status (sent/approved/declined/conditional)
- `conditions` — per submission, status (open/uploaded/accepted/rejected)
- `documents` — storage refs, scan status, linked to application/condition
- `bank_connections` — provider (Flinks/Plaid), account refs, statement pulls
- `messages` — channels per application
- `notifications` — per user, read state
- `appointments` — borrower ↔ advisor, calendar event id
- `consents` — typed consent log (PIPEDA, Quebec Law 25, credit pull, product review)
- `activity_log` — append-only audit (already mocked via `approvu.activity` localStorage)
- `scenarios` — saved tool runs (today: `approvu.scenarios` localStorage)
- `payment_methods` / `receipts` — Stripe customer + invoices
- `partners`, `partner_offers`, `standard_offers`, `offer_bundles` — admin offer engine (admin UI not yet built)
- `lenders`, `products`, `rate_profiles` — pricing matrix (admin UI not yet built)

## 2. API endpoints / server functions needed

| Endpoint | Used by | Method |
|---|---|---|
| `getApplications`, `getApplication(id)` | `/portal/applications`, `/portal/applications/$id` | GET |
| `saveApplicationStep(id, step, payload)` | every `/applications/$id/*` step | POST |
| `submitApplication(id)` | `/applications/$id/submit` | POST |
| `runProductEngine(id)` | `qualified-mortgages` | POST |
| `selectOffer(applicationId, productId)` | `/portal/applications/$id/offers` | POST |
| `listConditions(applicationId)` / `uploadCondition(...)` | conditions page | GET/POST |
| `uploadDocument(file, meta)` + virus scan webhook | `/portal/documents` | POST |
| `connectBank(provider)` callback handler | bank-connect dialog | POST + webhook |
| `listMessages(channel)` / `sendMessage` (realtime) | `/portal/messages` | WS |
| `listNotifications` / `markRead` | `/portal/notifications` | GET/POST |
| `bookAppointment` / `rescheduleAppointment` | `/portal/appointments` | POST |
| `requestEmailVerify` / `requestPhoneVerify` (OTP) | settings/profile | POST |
| `requestDataExport` / `requestAccountClose` | settings/profile | POST |
| `getReceiptPdf(id)` | settings/payment-methods | GET |
| `addPaymentMethod` (Stripe SetupIntent) | settings/payment-methods | POST |
| `getActivityLog(applicationId)` | activity feed | GET |
| `recordConsent(type, version)` | consent screens | POST |

## 3. Auth / RLS dependencies

- All `/portal/*` routes require authenticated session; redirect unauth → `/` or login modal.
- `/applications/$id/*` routes require borrower owns the application OR is assigned advisor/admin.
- 2FA enforced before reaching `/portal` (replace `/internal/account-handoff` placeholder).
- RLS:
  - borrower: `select/update where user_id = auth.uid()` on profile, applications, documents, etc.
  - advisor: `select/update where assigned_advisor_id = auth.uid()` (via `user_roles.has_role`)
  - admin: full access via `has_role(auth.uid(), 'admin')` SECURITY DEFINER function
- Storage bucket `documents` private; signed URLs only.
- Storage bucket `partner-offer-assets` (when admin built) public.

## 4. Real CRUD actions to replace mocks

- Application step Save → `saveApplicationStep`
- Bank Connect simulated pipeline → real Flinks/Plaid SDK
- Document upload toast → real upload + scan
- Offer "Select this offer" toast → `selectOffer` + status change
- Condition status changes → `updateCondition`
- Messages local seed → realtime channel
- Notifications local seed → server push + read state
- Appointment Reschedule toast → calendar API (Google + iCal)
- Receipt download toast → PDF endpoint
- Account close / data export toasts → compliance workflow
- Verification toasts → OTP service (Twilio/Resend)
- Saved scenarios localStorage → `scenarios` table (keep localStorage as offline cache)
- Activity log dual-write (already wired via `recordActivity`) → also persist server-side

## 5. Mock data sources to replace

| Mock | File | Replace with |
|---|---|---|
| `ACTIVE_APPS`, `PREVIOUS_APPS` | `src/components/portal/data.ts` | `getApplications` query |
| Activity feed seed | `src/components/portal/activity.ts` | server-fetched + dual-write kept |
| Saved scenarios | `localStorage["approvu.scenarios"]` | `scenarios` table (cache locally) |
| Bank connect provider list | `bank-connect-dialog.tsx` | provider config from server |
| Document seed list | `portal.documents.tsx` | `documents` query |
| Messages seed | `portal.messages.tsx` | realtime channel |
| Notifications seed | `portal.notifications.tsx` | server push |
| Appointments seed | `portal.appointments.tsx` | calendar query |
| Wallet receipts | `portal.wallet.tsx` | `receipts` query |
| Renewal touchpoints | `portal.home.renewal.tsx` | server-driven schedule |
| Equity comps | `portal.home.equity.tsx` | AVM API |
| Snapshot/qualification calc | `src/lib/calculations.ts` | server-side product engine |

## 6. Frontend components ready for wiring (no UI work needed)

- `src/components/portal/application-shell.tsx` — accepts application data via prop
- `src/components/portal/bank-connect-dialog.tsx` — onSuccess callback ready for real provider
- `src/components/hub/document-upload.tsx` — accepts file array + onUpload prop
- `src/components/hub/lender-response.tsx`, `funding-conditions.tsx`, `mortgage-application.tsx` — pure presentational, accept data
- `src/components/portal/tools-shared.tsx` — `saveScenario` is the single seam to replace
- `src/components/portal/activity.ts` — `recordActivity` is the single seam to dual-write
- All 14 tool routes — no API calls, accept defaults via search params
- All settings panes — local state only; one `useEffect` per pane to load + one mutation to save

## 7. Out-of-scope for Codex (needs design + build first)

The entire admin surface (see `frontend-inventory.md` § Admin Frontend) is
**out of scope for this project**. Codex should not invent admin routes here
and should not flag their absence as a bug. The admin shell, partner directory,
offer builder, application command centre, etc. are being built in a separate
Lovable project and will be merged in before backend wiring on the admin side.
## Disclosures & consents (added)

Profile-level disclosures (`/portal/disclosures`) are NOT sufficient to
submit a mortgage application. Application-level disclosures and
per-applicant consents must be tied to `application_id` and `applicant_id`
and live at `/portal/applications/:applicationId/disclosures`. Codex must
not treat `/portal/disclosures` as the only consent source. Full model and
submission gating in `docs/application-consent-disclosure-model.md`.
