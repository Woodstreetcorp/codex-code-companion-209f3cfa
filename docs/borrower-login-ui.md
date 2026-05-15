# Borrower Login UI

## Routes

Updated:

- `/login`

Added for the account handoff sign-in path when not already present on main:

- `/create-account`
- `/create-account?ref=QS-...`

## Backend Endpoints Used

- `POST /v2/borrower/login`
- `GET /v2/borrower/me`
- `POST /v2/borrower/logout`
- `POST /v2/borrower/account-handoff`

All requests use `VITE_APPROVU_API_BASE_URL` and `credentials: "include"` so Laravel's `web` session cookie can be used. Deployment must keep the frontend/backend same-origin or configure session/CORS/CSRF settings to allow credentialed requests safely.

## API Adapter

`src/lib/api/borrowerAuthApi.ts` exports:

- `loginBorrower(payload)`
- `getBorrowerSession()`
- `logoutBorrower()`
- `storeBorrowerSession(result)`
- `clearBorrowerSession()`

Session storage key:

- `approvu:borrower-session`

This storage is only a frontend handoff convenience. The Laravel session remains the source of truth and `/v2/borrower/me` should be used to confirm auth.

## Login Page Behavior

The `/login` page supports:

- email
- password
- optional remember checkbox
- `/login?email=...`
- `/login?ref=QS-...`
- loading state
- invalid credentials/error state
- success state
- sign-out action on success

On successful login, the page stores the safe borrower session response temporarily and then calls `/v2/borrower/me` to confirm the authenticated session.

## Account Handoff Existing-User Path

When `/create-account` receives `existing_user_login_required`, it shows the backend message and links to:

```text
/login?email=borrower@example.com&ref=QS-...
```

Password reset is intentionally deferred.

## Manual QA

1. Open `/login` and confirm missing email/password blocks submission.
2. Submit invalid credentials and confirm a friendly error displays.
3. Submit valid backend credentials and confirm the signed-in success state.
4. Confirm `/v2/borrower/me` is called after login by checking the network panel.
5. Click sign out and confirm the UI returns to the login form.
6. Open `/create-account?ref=QS-...` and submit an existing user email.
7. Confirm the existing-user state links to `/login?email=...&ref=QS-...`.

## Deferred

- Password reset
- MFA
- Email verification
- Full borrower portal
- Protected borrower routes
- Document upload
- Product matching
- Offer bundle display
- Co-applicant consent
