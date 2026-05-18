# Borrower Portal Route Typing Baseline

## Scope

PR 21B fixes the TanStack Router typing baseline for borrower portal application links.

Files updated:

- `src/components/portal/application-shell.tsx`
- `src/routes/portal.applications.$applicationId.index.tsx`
- `src/routes/portal.applications.$applicationId.lender.tsx`

## Issue

`bunx tsc --noEmit` failed because application-scoped links referenced routes that do not exist in `src/routeTree.gen.ts`:

- `/portal/applications/$applicationId/documents`
- `/portal/applications/$applicationId/messages`

The existing generated routes are portal-level routes:

- `/portal/documents`
- `/portal/messages`

## Fix

Documents and messages links now point to the existing portal-level routes.

Application-scoped tabs and links still pass `applicationId` only for routes under:

- `/portal/applications/$applicationId`

Portal-level documents and messages routes do not pass application route params.

## Verification

Run:

```bash
bunx tsc --noEmit
bunx eslint src/components/portal/application-shell.tsx src/routes/portal.applications.$applicationId.index.tsx src/routes/portal.applications.$applicationId.lender.tsx
bunx prettier --check src/components/portal/application-shell.tsx src/routes/portal.applications.$applicationId.index.tsx src/routes/portal.applications.$applicationId.lender.tsx docs/borrower-portal-route-typing-baseline.md
bun run build
git diff --check
```

## Deferred

- Application-specific document and message pages, if the product later needs per-application scoped experiences.
- Any broader portal navigation refactor.
