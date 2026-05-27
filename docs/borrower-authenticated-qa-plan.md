# Borrower Authenticated QA Plan

## 1. Purpose

This plan defines the manual QA steps needed to validate the authenticated borrower journey on staging after public route smoke testing has passed conditionally.

Full authenticated QA is currently blocked until staging has a borrower test account plus saved qualification/application data. Do not use production borrower data.

## 2. Current Staging URLs

| System            | URL                                                     | Notes                            |
| ----------------- | ------------------------------------------------------- | -------------------------------- |
| Borrower frontend | `https://tanstack-start-app.woodstreetcorp.workers.dev` | Temporary Cloudflare Workers URL |
| Laravel API       | `https://api-staging.approvu.com`                       | Staging backend API              |
| Legacy app        | `https://app.approvu.com`                               | Out of scope; do not touch       |

Known staging limitations:

- Borrower Worker URL is temporary.
- `borrower-staging.approvu.com` custom domain is deferred.
- Authenticated QA requires safe staging accounts and saved test data.
- Do not record passwords, cookies, CSRF tokens, session values, or personal borrower information.

## 3. Test Accounts Needed

| Account type                        | Purpose                                                      | Required? | Notes                                           |
| ----------------------------------- | ------------------------------------------------------------ | --------- | ----------------------------------------------- |
| New borrower account                | Validate create-account handoff from qualification/snapshot  | Yes       | Use non-sensitive staged data                   |
| Existing borrower account           | Validate login and existing-account handling                 | Yes       | Must have known safe test email alias           |
| Borrower with saved qualification   | Validate resume and portal summary                           | Yes       | Should include public reference only in reports |
| Borrower with application workspace | Validate application summary/documents/consents if available | Yes       | Use synthetic data                              |
| Borrower with Home Life Bundle data | Validate offers/redemption if module is present              | Optional  | Mark BLOCKED if data is not seeded              |

Never include real passwords in QA notes. Refer to accounts by alias, such as `borrower-test-a`.

## 4. Test Data Required

| Data                                 | Needed for                                | Status  | Notes                                     |
| ------------------------------------ | ----------------------------------------- | ------- | ----------------------------------------- |
| Completed pre-purchase qualification | Pre-purchase QA, snapshot QA              | BLOCKED | Requires staging borrower intake data     |
| Completed purchase qualification     | Purchase QA, snapshot QA                  | BLOCKED | Include subject property/address answers  |
| Completed refinance qualification    | Refinance QA, snapshot QA                 | BLOCKED | Include current property/mortgage answers |
| Server-generated Mortgage Snapshot   | Snapshot and portal QA                    | BLOCKED | Should be linked to safe public reference |
| Linked borrower user session         | Login/portal QA                           | BLOCKED | Account handoff or seeded user required   |
| Application workspace                | Application summary/documents/consents QA | BLOCKED | Use synthetic application                 |
| Document request/upload examples     | Documents QA                              | BLOCKED | Do not upload sensitive files             |
| Product match or safe offer result   | Product/offer QA                          | BLOCKED | Use conservative staging data             |
| Home Life Bundle assignment/code     | Bundle/redemption QA                      | BLOCKED | Use backend-safe borrower offer data only |

## 5. Safe Non-Sensitive Borrower Profiles

Use fictional borrower profiles only.

| Profile   | Scenario      | Suggested data shape                                                                      |
| --------- | ------------- | ----------------------------------------------------------------------------------------- |
| Profile A | Pre-purchase  | First-time buyer, Ontario city/province preference, no property address                   |
| Profile B | Purchase      | Buyer with target property address, down payment, income, and credit range                |
| Profile C | Refinance     | Existing homeowner with current property value, mortgage amount, income, and credit range |
| Profile D | Manual review | Incomplete income/property/credit answers to validate missing-item handling               |

Do not use real SINs, bank details, employer details, government IDs, credit reports, tax files, or borrower documents.

## 6. Qualification Flow QA

| ID      | Flow         | Check                              | Expected result                                       | Status  | Notes                           |
| ------- | ------------ | ---------------------------------- | ----------------------------------------------------- | ------- | ------------------------------- |
| QUAL-01 | Pre-purchase | Start `/pre-purchase`              | Route loads and accepts safe staged answers           | NOT RUN |                                 |
| QUAL-02 | Pre-purchase | Submit valid answers               | Backend intake request succeeds                       | BLOCKED | Requires test data/account plan |
| QUAL-03 | Purchase     | Start `/purchase`                  | Route loads and captures launch-critical fields       | NOT RUN |                                 |
| QUAL-04 | Purchase     | Address/contact/consent validation | Required fields block submit until complete           | NOT RUN |                                 |
| QUAL-05 | Purchase     | Submit valid answers               | Qualification session token/public reference returned | BLOCKED | Do not record raw token         |
| QUAL-06 | Refinance    | Start `/refinance`                 | Route loads and captures refinance fields             | NOT RUN |                                 |
| QUAL-07 | Refinance    | Submit valid answers               | Backend intake request succeeds                       | BLOCKED |                                 |
| QUAL-08 | All flows    | API failure state                  | User-friendly error appears and answers are preserved | NOT RUN |                                 |

## 7. Mortgage Snapshot QA

| ID      | Check                                   | Expected result                                                              | Status  | Notes                             |
| ------- | --------------------------------------- | ---------------------------------------------------------------------------- | ------- | --------------------------------- |
| SNAP-01 | Snapshot generation after qualification | Frontend calls backend snapshot API                                          | BLOCKED | Requires successful qualification |
| SNAP-02 | Snapshot display                        | Renders server snapshot values, path, readiness, insights, and missing items | BLOCKED |                                   |
| SNAP-03 | Missing data scenario                   | Shows `needs_more_information` or missing-items guidance                     | BLOCKED |                                   |
| SNAP-04 | API failure fallback                    | Friendly warning appears and local fallback does not crash                   | NOT RUN |                                   |
| SNAP-05 | Snapshot public reference storage       | Safe reference is stored for handoff only                                    | BLOCKED | Do not record session token       |

## 8. Account Handoff QA

| ID      | Check                     | Expected result                                          | Status  | Notes                                  |
| ------- | ------------------------- | -------------------------------------------------------- | ------- | -------------------------------------- |
| ACCT-01 | Open create-account route | Page loads with safe handoff data if available           | NOT RUN |                                        |
| ACCT-02 | Missing required fields   | Validation blocks submit                                 | NOT RUN |                                        |
| ACCT-03 | Password mismatch         | Friendly validation error appears                        | NOT RUN |                                        |
| ACCT-04 | Missing consent           | Submit is blocked                                        | NOT RUN |                                        |
| ACCT-05 | New account handoff       | Backend creates borrower account and returns safe result | BLOCKED | Requires valid qualification reference |
| ACCT-06 | Existing account handoff  | Shows `existing_user_login_required` and sign-in path    | BLOCKED | Requires existing staged user          |
| ACCT-07 | Response safety           | No internal IDs, token hashes, or password data exposed  | BLOCKED |                                        |

## 9. Borrower Login QA

| ID       | Check               | Expected result                                           | Status  | Notes                            |
| -------- | ------------------- | --------------------------------------------------------- | ------- | -------------------------------- |
| LOGIN-01 | Open `/login`       | Login page loads                                          | NOT RUN |                                  |
| LOGIN-02 | Missing credentials | Validation blocks submit                                  | NOT RUN |                                  |
| LOGIN-03 | Invalid credentials | Safe error appears                                        | NOT RUN |                                  |
| LOGIN-04 | Valid credentials   | Login succeeds using Laravel session auth                 | BLOCKED | Requires staged borrower account |
| LOGIN-05 | Session check       | `/me` or portal session check confirms authenticated user | BLOCKED |                                  |
| LOGIN-06 | Logout              | Session clears and protected routes require login         | BLOCKED |                                  |

## 10. Borrower Portal QA

| ID        | Check                        | Expected result                                                      | Status  | Notes          |
| --------- | ---------------------------- | -------------------------------------------------------------------- | ------- | -------------- |
| PORTAL-01 | Unauthenticated `/portal`    | Shows login/error state or redirects safely                          | NOT RUN |                |
| PORTAL-02 | Authenticated `/portal`      | Portal shell loads with borrower summary                             | BLOCKED | Requires login |
| PORTAL-03 | Latest qualification summary | Public reference and transaction type display safely                 | BLOCKED |                |
| PORTAL-04 | Latest snapshot summary      | Snapshot readiness/path/insights display safely                      | BLOCKED |                |
| PORTAL-05 | Placeholder sections         | Documents, offers, and application sections render conservative copy | BLOCKED |                |
| PORTAL-06 | Sign out                     | Sign-out action clears session                                       | BLOCKED |                |

## 11. Documents QA

| ID     | Check                     | Expected result                                         | Status  | Notes                               |
| ------ | ------------------------- | ------------------------------------------------------- | ------- | ----------------------------------- |
| DOC-01 | Documents section visible | Section is present or marked unavailable                | BLOCKED |                                     |
| DOC-02 | Document request list     | Requested/uploaded/reviewed states display if supported | BLOCKED |                                     |
| DOC-03 | Upload behavior           | Upload is safe or intentionally unavailable             | BLOCKED | Use non-sensitive sample files only |
| DOC-04 | Error state               | Failed upload/list calls show safe errors               | BLOCKED |                                     |

## 12. Application Summary QA

| ID     | Check                             | Expected result                                         | Status  | Notes |
| ------ | --------------------------------- | ------------------------------------------------------- | ------- | ----- |
| APP-01 | Application summary route/section | Summary loads or shows not-yet-available state          | BLOCKED |       |
| APP-02 | Borrower details summary          | Shows only safe staged borrower data                    | BLOCKED |       |
| APP-03 | Property/financing summary        | Values match staged answers where available             | BLOCKED |       |
| APP-04 | Review/submit state               | Submitted or more-information statuses render correctly | BLOCKED |       |

## 13. Product Match and Offer Display QA

| ID       | Check                 | Expected result                                                   | Status  | Notes |
| -------- | --------------------- | ----------------------------------------------------------------- | ------- | ----- |
| OFFER-01 | Product match status  | Conservative pending/review status appears where appropriate      | BLOCKED |       |
| OFFER-02 | Safe product options  | No rate/approval promises unless backend explicitly provides them | BLOCKED |       |
| OFFER-03 | Selected path display | Selected/pending paths are clear and conservative                 | BLOCKED |       |
| OFFER-04 | API failure state     | Offer/product errors do not crash portal                          | BLOCKED |       |

## 14. Home Life Bundle and Redemption QA

| ID     | Check                    | Expected result                                                 | Status  | Notes |
| ------ | ------------------------ | --------------------------------------------------------------- | ------- | ----- |
| HLB-01 | Bundle summary           | Summary card appears if assigned, otherwise safe empty state    | BLOCKED |       |
| HLB-02 | Bundle detail page       | Detail route shows assigned bundle and selected offers          | BLOCKED |       |
| HLB-03 | Redeemable code summary  | Shows safe code summary without internal IDs                    | BLOCKED |       |
| HLB-04 | Redemption CTA           | Appears only when backend says redeemable                       | BLOCKED |       |
| HLB-05 | Redemption success/error | UI refreshes safely and does not expose raw code unless allowed | BLOCKED |       |

## 15. Error and Validation States

| ID     | Check                           | Expected result                                     | Status  | Notes |
| ------ | ------------------------------- | --------------------------------------------------- | ------- | ----- |
| ERR-01 | 401 unauthenticated             | User sees login/session guidance                    | NOT RUN |       |
| ERR-02 | 419 CSRF/session                | Friendly retry/session message or safe fallback     | NOT RUN |       |
| ERR-03 | 422 validation                  | Field-level or clear form validation appears        | NOT RUN |       |
| ERR-04 | 500 backend error               | Safe generic error appears; no stack traces/secrets | NOT RUN |       |
| ERR-05 | Network offline/API unavailable | User-friendly failure state appears                 | NOT RUN |       |

## 16. Mobile and Browser Checks

| ID        | Check                  | Expected result                                         | Status  | Notes |
| --------- | ---------------------- | ------------------------------------------------------- | ------- | ----- |
| DEVICE-01 | Chrome desktop         | Core authenticated journey works                        | BLOCKED |       |
| DEVICE-02 | Safari or Edge desktop | Core authenticated journey works                        | BLOCKED |       |
| DEVICE-03 | Mobile viewport        | Login, portal, snapshot, and bundle views remain usable | BLOCKED |       |
| DEVICE-04 | Tablet viewport        | Portal layout remains usable                            | BLOCKED |       |
| DEVICE-05 | Console check          | No blocking console errors                              | NOT RUN |       |

## 17. API, CORS, and Session Checks

| ID     | Check                        | Expected result                                                        | Status  | Notes                       |
| ------ | ---------------------------- | ---------------------------------------------------------------------- | ------- | --------------------------- |
| API-01 | `GET /v2/health`             | API returns staging health JSON                                        | NOT RUN |                             |
| API-02 | `GET /v2/csrf-cookie`        | CSRF endpoint responds with secure staging cookies                     | NOT RUN | Do not record cookie values |
| API-03 | Worker origin CORS preflight | Allows exact Worker origin with credentials                            | NOT RUN |                             |
| API-04 | Mutating requests            | Use CSRF/session behavior expected by backend                          | NOT RUN |                             |
| API-05 | Session persistence          | Authenticated user remains logged in after refresh                     | BLOCKED | Requires staged account     |
| API-06 | Secrets check                | No passwords, tokens, cookies, or internal IDs exposed in console/logs | NOT RUN |                             |

Example CORS preflight:

```bash
curl -I -X OPTIONS \
  -H "Origin: https://tanstack-start-app.woodstreetcorp.workers.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-XSRF-TOKEN, Content-Type" \
  https://api-staging.approvu.com/v2/borrower/login
```

## 18. Result Summary

| Area                        | Status  | Notes                                                                     |
| --------------------------- | ------- | ------------------------------------------------------------------------- |
| Test accounts               | BLOCKED |                                                                           |
| Test data                   | BLOCKED |                                                                           |
| Qualification flows         | NOT RUN |                                                                           |
| Mortgage Snapshot           | BLOCKED |                                                                           |
| Account handoff             | BLOCKED |                                                                           |
| Borrower login              | BLOCKED |                                                                           |
| Borrower portal             | BLOCKED |                                                                           |
| Documents                   | BLOCKED |                                                                           |
| Application summary         | BLOCKED |                                                                           |
| Product match/offers        | BLOCKED |                                                                           |
| Home Life Bundle/redemption | BLOCKED |                                                                           |
| Error states                | NOT RUN |                                                                           |
| Mobile/browser              | BLOCKED |                                                                           |
| API/CORS/session            | NOT RUN |                                                                           |
| Overall recommendation      | BLOCKED | Requires staged borrower account and saved qualification/application data |

## QA Notes

- Tester:
- Date/time:
- Browser/device:
- Borrower test account alias:
- Qualification public reference, if safe to record:
- Blockers:
- Non-blocking issues:
- Evidence links:
- Final recommendation:
