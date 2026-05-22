# Snapshot CTA Account Routing Fix

## Summary

The public qualification flow already shows the Mortgage Snapshot before login or account creation:

1. Borrower starts `/purchase`, `/pre-purchase`, or `/refinance`.
2. `FlowRunner` collects qualification answers.
3. Borrower saves contact/consent details.
4. `FlowRunner` generates and renders `MortgageSnapshot` inline.
5. The snapshot CTA now sends the borrower directly to `/create-account`.

## Change

Updated the bottom Mortgage Snapshot CTA:

- From: `/portal`
- To: `/create-account`

This removes the extra unauthenticated portal stop where borrowers saw a sign-in required screen before finding the account creation path.

## Files Inspected

- `src/components/MortgageSnapshot.tsx`
- `src/routes/create-account.tsx`
- `src/routes/portal.index.tsx`

## Verification Notes

- The snapshot still renders before login/account creation because `FlowRunner` renders `MortgageSnapshot` after qualification submission.
- The account creation page reads the saved qualification handoff from session storage.
- Login behavior and qualification submit behavior were not changed.

## Deferred

- Dedicated standalone public snapshot route.
- Snapshot CTA variants outside the bottom `Unlock My Mortgage Options` CTA.
