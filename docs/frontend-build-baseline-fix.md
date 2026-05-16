# Frontend Build Baseline Fix

**Branch:** `codex/frontend-build-baseline-fix`  
**PR:** 14A — Fix Build Baseline and PDF Dependency  
**Date:** 2026-05-15  
**Type:** Launch hardening — not a feature PR

---

## Root Cause

`@react-pdf/renderer` was declared in `package.json` at `^4.5.1` and fully resolved in
`bun.lock`, but the package and its 12 sub-packages were **not installed** in `node_modules`.

When Vite/Rollup attempted to bundle `src/components/hub/certificate-pdf.tsx`, it could not
resolve the import:

```
[vite]: Rollup failed to resolve import "@react-pdf/renderer" from
"src/components/hub/certificate-pdf.tsx"
```

This caused every build attempt to fail at the bundling stage, preventing any production
build from completing.

---

## Decision: Install the package (Option A)

The PDF certificate feature is used in two routes:
- `src/routes/portal.applications.$applicationId.certificate.tsx` — the borrower certificate page
- `src/routes/internal.full-application.tsx` — internal preview shell

`pre-qualified-certificate.tsx` eagerly imports `downloadCertificatePdf` from
`certificate-pdf.tsx`, which imports from `@react-pdf/renderer`. Because the import is
**eager** (not dynamic), any build failure in that chain blocks the entire bundle.

**Installing the package was the correct fix** for these reasons:
- The feature is wired into two real routes — removing it would require rerouting
- The package was already in `package.json` and `bun.lock` — it was simply not installed
- `tsc --noEmit` passes cleanly with the package installed (no type errors)
- The build completes in ~57 seconds with the package present

Deferring the PDF feature (Option B) would have required removing or lazily loading imports
in two route files, adding a placeholder UI, and blocking a real borrower-facing screen.
That is more invasive than a `bun install`.

---

## Fix Applied

```bash
bun install
```

This installed the following previously-missing packages from the lockfile:

| Package | Version |
|---------|---------|
| `@react-pdf/renderer` | 4.5.1 |
| `@react-pdf/fns` | 3.1.3 |
| `@react-pdf/font` | 4.0.8 |
| `@react-pdf/image` | 3.1.0 |
| `@react-pdf/layout` | 4.6.1 |
| `@react-pdf/pdfkit` | 5.1.1 |
| `@react-pdf/primitives` | 4.3.0 |
| `@react-pdf/reconciler` | 2.0.0 |
| `@react-pdf/render` | 4.5.1 |
| `@react-pdf/stylesheet` | 6.2.1 |
| `@react-pdf/svg` | 1.1.0 |
| `@react-pdf/textkit` | 6.3.0 |
| `@react-pdf/types` | 2.11.1 |

No source files were modified. `bun.lock` was already correct; no lockfile update was
needed.

---

## Files Changed

| File | Change |
|------|--------|
| `node_modules/@react-pdf/*` | Installed (13 packages, not committed) |
| `docs/frontend-build-baseline-fix.md` | This document (new) |

No `package.json` or `bun.lock` changes — both were already correct.

---

## Build / Type-Check Results

### `bunx tsc --noEmit`
```
✓ Exit code 0 — no type errors
```
TypeScript is fully clean across all 2354 modules including `certificate-pdf.tsx`.

### `bun run build`
```
✓ built in 57.10s
```
All 2354 modules transform successfully. Both `dist/client/` and `dist/server/` are
written without error.

Notable output sizes:
- `dist/server/assets/pre-qualified-certificate-N_Xdkcxb.js` — 3,656 kB (uncompressed)

  `@react-pdf/renderer` is a large library (~3.5 MB uncompressed). This chunk is
  server-side only and is split from the main client bundle by the route-based code
  splitting. Client-side, the PDF download happens on demand via `onClick`. Consider
  lazy-importing `certificate-pdf.tsx` in a future PR to reduce the initial JS payload
  for the certificate route.

### `bunx eslint <changed files>`
No substantive ESLint errors in changed files. All errors in the repo are pre-existing
`Delete \r` (CRLF line-ending) issues that affect every file committed on Windows
before `.gitattributes` was configured. These are not caused by this PR and are tracked
as a separate housekeeping item.

---

## Pre-Existing Issues Confirmed (Not Caused By This PR)

| Issue | Status |
|-------|--------|
| CRLF `\r` lint errors across entire codebase | Pre-existing; `eslint-plugin-prettier` enforces LF; fix requires `.gitattributes` + repo-wide `prettier --write` |
| `.tanstack/tmp` EEXIST on Windows | Pre-existing; TanStack Router generator uses non-atomic mkdir; clears on clean build |
| `.wrangler/deploy` EEXIST on Windows | Pre-existing; Cloudflare vite plugin uses non-atomic mkdir; clears on clean build |

The `.tanstack/tmp` and `.wrangler/deploy` errors **only occur when those directories already
exist from a prior interrupted build**. A clean `dist` + clean `.tanstack/tmp` + clean
`.wrangler/deploy` gives a full successful build. Both directories are in `.gitignore`.

**Workaround for local Windows builds:** Remove stale output before building:
```bash
rm -rf dist .tanstack/tmp .wrangler/deploy
bun run build
```

---

## Deployment Notes

- **No backend changes required**
- **No environment variable changes required**
- `bun install` must be run after cloning or pulling on any environment that does not have
  `node_modules/@react-pdf` installed
- The PDF certificate feature is active in the borrower portal at:
  `/portal/applications/:applicationId/certificate`
- PDF data is currently hardcoded placeholder values (`pre-qualified-certificate.tsx`).
  Wiring to real qualification data is deferred post-soft-launch.

---

## Deferred

| Item | Reason |
|------|--------|
| Lazy-import `certificate-pdf.tsx` to reduce chunk size | Post-soft-launch optimisation |
| Wire PDF with real qualification data | Backend API for cert data not yet built |
| Full PDF/certificate redesign | Post-soft-launch |
| PDF styling polish | Post-soft-launch |
| Server-generated PDF workflow | Post-soft-launch |
| Emailing PDFs | Post-soft-launch |
| CRLF `.gitattributes` fix | Separate housekeeping PR |
| Windows atomic-mkdir issue in TanStack/Cloudflare plugins | Upstream bug; workaround is clean build |
