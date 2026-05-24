# Borrower Staging QA Runbook

## Scope

Use this runbook to validate the borrower staging journey end to end before sign-off. The goal is to confirm that the polished borrower frontend can move from qualification through portal and post-submit states while handling API failures safely.

Recommended browsers:

- Chrome latest desktop
- Safari latest desktop, if available
- Chrome or Safari mobile viewport via DevTools

Recommended test data:

- New borrower email that does not already exist
- Existing borrower email with a known password
- Qualification inputs for purchase, refinance, and pre-purchase paths
- At least one document file under 5 MB for upload checks

## Qualification To Mortgage Snapshot To Account

1. Open the staging borrower qualification entry point.
2. Start a purchase qualification.
3. Complete all required borrower contact fields.
4. Accept required consent/disclosure checkboxes.
5. Submit the qualification.
6. Confirm the UI shows a save/loading state while the intake API runs.
7. Confirm a server public reference is stored for handoff.
8. Confirm the Mortgage Snapshot is generated from the API response.
9. Confirm the snapshot does not promise approval or real lender terms.
10. Select the create-account call to action.
11. Create a new borrower account with matching qualification email.
12. Confirm account-created success state.
13. Sign in with the new account.
14. Confirm login success routes or links to the borrower portal shell.
15. Repeat the flow for refinance and pre-purchase at least once.

Expected result:

- Qualification submits without losing answers.
- Mortgage Snapshot renders server-side readiness, insights, missing items, and next step.
- Create account and login flows show clear success or existing-user messaging.

## Borrower Portal Shell

1. Log in as a borrower with a linked qualification.
2. Open the portal route.
3. Confirm the portal loads borrower name and email.
4. Confirm latest qualification public reference is visible if designed to display.
5. Confirm latest Mortgage Snapshot summary is visible.
6. Confirm placeholder or active cards render for application, documents, offers, and Home Life Bundle areas.
7. Refresh the page.
8. Confirm session-backed portal data reloads from API instead of relying only on sessionStorage.
9. Sign out.
10. Confirm signed-out users see a login or unauthenticated state.

Expected result:

- Portal shell provides a real post-login destination.
- No admin-only data, internal IDs, token hashes, or private notes appear.

## Application Workspace

1. From the portal, open the application workspace or continue-application action.
2. Confirm borrower identity/contact summary is prefilled where supported.
3. Confirm workspace sections are visible and understandable.
4. Confirm incomplete sections are marked as incomplete.
5. Confirm completed sections are marked as complete after saving valid data.
6. Confirm navigation between sections does not lose entered values.

Expected result:

- Borrower can understand what remains before submission.
- Workspace does not expose admin workflow controls.

## Section Save And Restore

For each available application section:

1. Enter valid data.
2. Save the section.
3. Confirm save loading state appears.
4. Confirm success feedback appears.
5. Refresh the page.
6. Reopen the same section.
7. Confirm saved values are restored from backend data.
8. Enter invalid or incomplete data.
9. Confirm validation errors are shown without clearing existing valid values.

Expected result:

- Saved sections survive refresh and navigation.
- Validation failures preserve borrower input.

## Documents

1. Open the documents section.
2. Confirm requested document categories are visible if configured.
3. Upload an allowed file type.
4. Confirm upload progress or saving state appears.
5. Confirm uploaded document appears in the list with status.
6. Refresh the page.
7. Confirm uploaded document metadata persists.
8. Try an unsupported file type or oversized file.
9. Confirm a safe validation error appears.
10. Confirm no local filesystem paths are displayed to the borrower.

Expected result:

- Borrower can upload launch-required documents.
- Document list persists and uses safe status labels.

## Consents

1. Open the consent/disclosure section.
2. Confirm each required consent has clear label text.
3. Accept required consents.
4. Save the section.
5. Refresh and confirm accepted consents remain accepted.
6. Attempt submission with a required consent missing.
7. Confirm submission is blocked with clear messaging.
8. If co-applicant consent appears, confirm it is clearly separate from primary borrower consent.

Expected result:

- Required consents are captured before submission.
- Consent state is tied to the borrower/application context.

## Review And Submit

1. Complete all required application sections.
2. Open review and submit.
3. Confirm section summaries are accurate.
4. Confirm missing or invalid sections are clearly listed.
5. Submit the application.
6. Confirm submit loading state appears.
7. Confirm duplicate clicks are prevented.
8. Confirm success state appears after submission.
9. Refresh the page.
10. Confirm submitted state persists.

Expected result:

- Borrower can submit a complete package once.
- Submitted application remains read-only or clearly locked where appropriate.

## Submitted Status

1. Open portal after application submission.
2. Confirm submitted status is visible.
3. Confirm next-step copy is conservative and clear.
4. Confirm application workspace reflects submitted state.
5. Confirm admin review or lender packaging status displays only borrower-safe information.

Expected result:

- Borrower sees that the application was received.
- No unsupported promises about approval, rates, or lender decisions appear.

## More-Information Response

1. Use a test account/application that has a more-information request from backend/admin.
2. Open the portal.
3. Confirm the request is visible with clear required actions.
4. Open the relevant section.
5. Add or update requested data/documents.
6. Save and resubmit or mark response ready, depending on current workflow.
7. Confirm the status changes from action-required to submitted or pending review.

Expected result:

- Borrower can respond to more-information requests without starting over.

## Product Match Status

1. Open a borrower account with a generated product match status.
2. Confirm product matching status is displayed safely.
3. Confirm pending/manual-review states are understandable.
4. Confirm no real lender offer is shown unless backend explicitly returns safe product options.
5. Confirm missing-data product states direct borrower to the correct application section.

Expected result:

- Product state is transparent but conservative.

## Safe Product Options

When product options are visible:

1. Confirm option labels are borrower-safe.
2. Confirm no unsupported rate guarantee or approval language appears.
3. Confirm each option has a clear status such as pending review, potentially eligible, or selected for packaging.
4. Confirm option details match backend payload.
5. Confirm empty product option state is clear and non-alarming.

Expected result:

- Product options set expectations without overpromising.

## Selected Paths

1. Select or review any borrower path choices shown in the UI.
2. Confirm selection persists after refresh.
3. Confirm selected path appears in portal or application summary if designed.
4. Confirm changing a selected path, if supported, requires an explicit save.
5. Confirm unsupported paths show a safe unavailable/pending message.

Expected result:

- Borrower path selection is clear and persistent.

## Lender Packaging Status

1. Open a borrower with packaging status available.
2. Confirm status labels are borrower-safe.
3. Confirm packaged, pending, blocked, and needs-information states render correctly.
4. Confirm lender-facing/internal package details are not exposed.
5. Confirm next-step instructions are clear.

Expected result:

- Borrower understands packaging progress without seeing internal operations.

## Home Life Bundle Offers

1. Open portal or offers area for a borrower with Home Life Bundle data.
2. Confirm bundle summary appears if backend returns it.
3. Confirm individual offers render with safe labels, value, and availability state.
4. Confirm unavailable or pending offers display conservative fallback copy.
5. Confirm redemption or claim actions are disabled or routed correctly if not yet live.
6. Confirm no mock-only offer data appears as production data.

Expected result:

- Home Life Bundle offer display is clear, safe, and backend-driven where available.

## API Failure States

Validate these states by using staging fixtures, browser throttling, temporary invalid payloads, or backend test toggles.

### 401 Unauthorized

- Trigger by opening protected borrower routes while signed out.
- Expected: user sees login prompt or session expired state.
- Expected: no protected data is shown.

### 419 CSRF Or Session Expired

- Trigger by stale session or missing CSRF token where possible.
- Expected: user sees a recoverable session-expired message.
- Expected: retry or sign-in path is clear.
- Expected: entered form data is not wiped if avoidable.

### 422 Validation Error

- Trigger by submitting incomplete or invalid form data.
- Expected: field-level or section-level errors appear.
- Expected: successful saved data remains intact.
- Expected: raw backend error dumps are not shown.

### 500 Server Error

- Trigger with staging error fixture or temporary backend failure.
- Expected: user sees generic friendly error.
- Expected: no stack trace, SQL, token, or internal route appears.
- Expected: retry guidance is visible.

## DevTools Network Checklist

Open DevTools Network tab and verify:

- Qualification intake calls the Laravel V2 API.
- Snapshot generation/retrieval calls the Laravel V2 API.
- Resume calls use safe token or public reference only.
- Account handoff does not expose password data in responses.
- Login uses `credentials: include` where session auth requires it.
- Portal calls include session cookies where expected.
- Application section saves call backend endpoints and return 2xx on success.
- Document uploads use expected method and content type.
- Consent saves include expected consent identifiers and timestamps where returned.
- Submit action is a single request and duplicate click does not submit twice.
- 401, 419, 422, and 500 responses map to safe UI states.
- No request sends token hashes, internal IDs as bearer tokens, admin notes, or Task Center data.
- No production route calls `/mock` URLs.

## DevTools Console Checklist

Open DevTools Console and verify:

- No uncaught React errors on initial load.
- No hydration or routing errors during navigation.
- No unhandled promise rejections during API failures.
- No sensitive payloads are logged.
- No debug-only console spam remains in production/staging build.
- No missing environment variable errors appear except expected staging configuration warnings.
- No Google Places or map script errors block manual address fallback.

## Mobile And Responsive QA

Test at minimum:

- 390 px mobile width
- 768 px tablet width
- 1280 px desktop width

Checklist:

- Qualification forms fit without horizontal scrolling.
- Address autocomplete and manual fallback are usable on mobile.
- Snapshot cards stack cleanly.
- Portal cards are readable and tappable.
- Application section navigation works on touch devices.
- Document upload controls are accessible on mobile.
- Review and submit summary does not overflow.
- Error messages do not cover primary actions.
- Sticky or fixed actions do not obscure form fields.

## Bug Report Template

Use this template for staging defects:

```text
Title:
Environment: staging
Browser/device:
Viewport:
Borrower account/email:
Application/reference:
Route:
Steps to reproduce:
Expected result:
Actual result:
Screenshots/video:
Network request URL/status:
Console errors:
Severity: blocker / high / medium / low
Notes:
```

## Staging Sign-Off Checklist

Sign off only when all required checks are true:

- Qualification works for purchase, refinance, and pre-purchase.
- Mortgage Snapshot renders from API data.
- Create account works for a new borrower.
- Existing-user login path is clear.
- Login, session check, and logout work.
- Portal shell loads real borrower-safe data.
- Application workspace saves and restores sections.
- Required documents can be uploaded or clearly deferred.
- Required consents block submission when missing.
- Review and submit works once for a complete application.
- Submitted status persists after refresh.
- More-information response path is usable if enabled.
- Product match status is conservative and backend-driven.
- Safe product options do not promise approval or rates.
- Selected paths persist if enabled.
- Lender packaging status is borrower-safe.
- Home Life Bundle offers are safe and not mock-labeled as production.
- 401, 419, 422, and 500 states are handled safely.
- DevTools Network shows no mock production routes.
- DevTools Console has no release-blocking errors.
- Mobile responsive checks pass.
- All staging blockers are closed or explicitly accepted.
