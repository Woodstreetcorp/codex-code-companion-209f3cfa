# Full Application UX/UI & Routing Optimization

This is a broad, multi-page audit. To keep it shippable and reviewable, I'll work in **4 focused phases**, each ending in a verifiable improvement. After each phase you can stop me, redirect, or continue.

## Phase 1 — Routing & Navigation Audit (highest impact, lowest risk)

Goal: every Back / Continue / Save & Continue / View Details / Edit / "Back to Application Hub" button goes to the correct destination, and locked sections cannot be entered.

- Audit `src/components/property-financing/shared.tsx` (PageHeader, SaveAndContinueBar, breadcrumb back-links) and confirm every page uses the canonical `?section=…` deep-link back to `/internal/full-application`.
- Audit each route in `src/routes/applications.$applicationId.*` for:
  - correct `prev` / `next` targets in the order: Property → Down Payment → Mortgage Request → Qualified Products → Product Priority → Mortgage Offers → Product Review & Consent → Submit → Document Upload → Lender Response → Funding Conditions.
  - Save Draft = no nav, Save & Continue = next incomplete required section.
- Audit hub widgets in `src/components/hub/*` (mortgage-application, document-upload, lender-response, funding-conditions, exclusive-offers, borrower-profile) for Edit / View Details targets.
- Enforce locked-state guards: Product Review & Consent, Submit, Document Upload, Lender Response, Funding Conditions, Exclusive Offers — disabled buttons + tooltip explaining why.

Deliverable: a fix list of every button changed, plus consistent locked-state UI.

## Phase 2 — Progress, Completion Logic & Locked/Empty/Success States

- Make hub-level progress reflect actual required-field completion of each widget (not optional fields).
- "I have none to declare" properly marks Liabilities / Assets / Other Properties as complete.
- Add unified components in `src/components/property-financing/shared.tsx`:
  - `LockedState` (icon + reason + what unlocks it)
  - `EmptyState` (icon + helper copy + primary CTA)
  - `SuccessState` (post-submission, post-upload, post-acceptance)
  - `SaveStatusBadge` ("All changes saved" / "Unsaved changes")
- Add a persistent "Next Best Action" card to `/internal/full-application` that points to the highest-priority incomplete required section.

## Phase 3 — Copy, Hierarchy & Borrower-Friendly Language

- Replace technical labels per the brief ("Submit to lender" → "Submit application to approvU for review", "Condition engine" → "Requested documents and conditions", etc.).
- Add helper microcopy: "You can save and return later", "Final rate may change after review", "Each applicant must complete their own profile and consent", locked-section explanations.
- Tighten section headers, hint text, and CTA labels for consistency.
- No layout rewrites — copy + small hierarchy tweaks only.

## Phase 4 — Visual Polish & Brand Tokens

- Confirm tokens in `src/styles.css` map to brand palette (Primary `#005467`, Secondary `#00A3B6`, mint = success, amber = warning, coral = critical only). Adjust tokens, not component classes.
- Consistent status badges (Complete / In Progress / Locked / Action needed / Missing).
- Consistent progress bar treatment (teal accent).
- Mobile pass at 375px: sticky bottom CTA on long forms, card padding/spacing tightened, no horizontal overflow.
- Accessibility pass: focus rings, aria-labels on icon-only buttons, contrast on muted text.

## What I will NOT change
- Mortgage business logic, qualification math, ratios, product matching.
- Data models for borrower profile, properties, assets, liabilities (already finalized in earlier turns).
- Backend / Lovable Cloud schema.

## Technical notes
- All routing is TanStack Router file-based; back-to-hub links must use `to="/internal/full-application" search={{ section: "mortgage-application" }}`.
- Locked guards are UI-only; true server-side gating would need backend logic — I'll flag it at the end if relevant.
- Mobile review uses the 375px viewport via preview_ui.

## Suggested order of approval
Approve all 4 phases to run sequentially, OR pick the phase(s) you want first. Phase 1 alone is the single biggest UX win and is recommended as the starting point.

At the end you'll get:
1. Summary of changes
2. List of every route/button fixed
3. Flagged items needing backend/database support