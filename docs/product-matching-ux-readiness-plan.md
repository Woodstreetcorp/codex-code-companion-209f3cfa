# Product Matching UX Readiness Plan

## 1. Executive Summary

Product matching UX must be conservative because borrowers can easily read product options as approval signals. At this stage, the frontend should help borrowers understand progress and next steps without implying a lender decision, final eligibility, guaranteed pricing, or mortgage approval.

The borrower experience should keep a clear distinction between review status and qualified products:

- Review status explains where the application is in the approvU workflow.
- Qualified products, once available, should represent advisor-reviewed possible paths only.
- Product options should not be shown until the backend and advisor workflow can safely confirm what is borrower-safe to expose.

No lender names, final rates, approval language, guaranteed terms, or underwriting conclusions should be shown too early. Product matching output should be treated as a guided review layer until lender submission and lender response workflows exist.

## 2. Current Frontend Inventory

| Page                                                              | Current role                                                                                                              | Relevance to product matching                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `/portal/application`                                             | Main borrower application workspace with status, section cards, documents, consents, review requests, and next-step CTAs. | Best place to show product matching status once application is submitted or advisor-reviewed.          |
| `/portal/application/review-submit`                               | Borrower readiness and final submit flow.                                                                                 | Should remain focused on submission readiness, not product options.                                    |
| `/portal/offers`                                                  | Existing offers/review-style page.                                                                                        | Candidate destination for future product options or a placeholder until `/portal/options` exists.      |
| `/portal/documents`                                               | Document vault and document request upload flow.                                                                          | Product matching and lender packaging may create document requests.                                    |
| `/portal/application/consents`                                    | Consent acceptance flow.                                                                                                  | Product matching should respect consent readiness and not proceed if required consents are incomplete. |
| `/internal/full-application`                                      | Embedded full borrower application hub.                                                                                   | Source of borrower profile, income, liabilities, assets, and other borrower-entered details.           |
| `/applications/$applicationId/property-financing/target-property` | Target property preferences section.                                                                                      | Product matching inputs include property intent, price, usage, and property type.                      |
| `/applications/$applicationId/property-financing/down-payment`    | Down payment and source-of-funds section.                                                                                 | Product matching inputs include down payment, source types, LTV, and requested mortgage.               |

## 3. Future Borrower Journey

```text
Submitted application
-> advisor review
-> product matching pending
-> advisor-reviewed options
-> borrower selects products
-> lender packaging
-> lender submission
```

Borrower-facing UX should make this journey feel guided and transparent, while keeping product details appropriately gated until the approvU team has reviewed them.

## 4. Borrower-Facing States

| State                       | Headline                                    | Body copy                                                                                                                | Primary CTA               | Secondary CTA     | What not to show                                                                |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| Not ready for matching      | Complete your application first             | Product matching starts after your application sections, documents, and consents are ready for review.                   | Continue Application      | View Requirements | Product cards, rates, lender names, approval language.                          |
| Missing information         | More information is needed                  | The approvU team needs a few updates before potential mortgage paths can be assessed.                                    | Review Requested Items    | Upload Documents  | Product recommendations, match scores, lender names.                            |
| Advisor review in progress  | Your application is being reviewed          | The approvU team is reviewing your application details before preparing any product options.                             | View Application Status   | View Documents    | Any product-specific details or implied timelines.                              |
| Options being prepared      | Potential mortgage paths are being assessed | Your advisor is reviewing possible mortgage paths. These are not approvals and final terms depend on lender review.      | View Review Status        | Contact Advisor   | Final rates, lender approvals, guaranteed eligibility.                          |
| Options ready for review    | Advisor-reviewed options are ready          | Your advisor has prepared potential mortgage paths for you to review. These are not lender approvals.                    | Review Options            | View Application  | Final lender commitments, guaranteed payments, underwriting notes.              |
| Selected products confirmed | Your selected paths are saved               | Your selected product paths are saved for advisor review and packaging. Final terms depend on lender review.             | View Selected Options     | View Documents    | Final approval language or lender commitment.                                   |
| Submitted to lender         | Submitted for lender review                 | Your application package has been submitted for lender review. Your advisor will share updates as they become available. | View Lender Review Status | View Documents    | "Approved", "guaranteed", final rate claims unless returned by lender workflow. |

## 5. Safe Wording Library

Approved wording examples:

- "Your application is being reviewed."
- "Potential mortgage paths are being assessed."
- "Your advisor is reviewing possible options."
- "These are not approvals."
- "Final terms depend on lender review."
- "Submitting to a lender does not guarantee approval."
- "Your advisor will confirm next steps."
- "This estimate is for planning only."
- "Additional documents may be required before lender review."

Avoid:

- "You are approved"
- "Guaranteed"
- "Best rate"
- "Lender has approved you"
- "You qualify for this lender"
- "Final offer"
- "Locked rate"
- "Lowest payment"
- "No conditions"

## 6. Product Option Card Design Plan

Borrower-safe future card fields:

| Field                 | Purpose                                                                                     | Notes                                                           |
| --------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Product category      | High-level path such as insured, conventional, alternative, renewal, refinance.             | Avoid exposing internal lender/product codes.                   |
| Path label            | Borrower-friendly label such as "Lower down payment path" or "Flexible income review path". | Should be advisor-reviewed copy.                                |
| Term placeholder      | General term range or "Term to be confirmed".                                               | Avoid final term promises.                                      |
| Payment estimate      | Planning estimate only if backend and compliance rules allow later.                         | Must be clearly marked as estimate, not approval.               |
| Conditions/notes      | Borrower-safe conditions such as documents needed or advisor review notes.                  | Avoid underwriting internals.                                   |
| Advisor review badge  | Signals the option was reviewed by approvU before display.                                  | Useful trust marker without approval implication.               |
| Documents needed      | High-level required documents connected to `/portal/documents`.                             | Should link to document vault if actionable.                    |
| Select for review CTA | Lets borrower choose a path for advisor/lender packaging.                                   | Copy should avoid "apply now" until submission workflow exists. |

Hidden or deferred fields:

- Lender name
- Final rate
- Compensation
- Underwriting notes
- Internal rule scores
- Internal exception notes
- Product IDs
- Lender-specific eligibility reason codes
- Rate hold details

## 7. Admin-Facing UX Plan

Future admin screens should support review, curation, and packaging before borrower exposure.

| Admin screen               | Purpose                                                       | Key UX needs                                                                 |
| -------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Candidate products table   | Show generated matches and rule outcomes.                     | Filter by product category, eligibility state, confidence, and missing data. |
| Rule pass/fail reasons     | Explain why a product was included or excluded.               | Human-readable reasons with expandable technical detail.                     |
| Advisor override panel     | Let advisors include, exclude, or annotate candidate options. | Require reason capture for overrides.                                        |
| Selected products cart     | Track borrower/advisor-selected paths for packaging.          | Clear selected state, ordering, and packaging readiness.                     |
| Lender packaging checklist | Prepare selected paths for lender submission.                 | Documents, consents, application completeness, and advisor notes.            |

## 8. Route Plan

Proposed future borrower routes:

- `/portal/options`
  - Product match status and safe overview.
- `/portal/options/review`
  - Advisor-reviewed borrower-safe options.
- `/portal/options/selected`
  - Borrower-selected paths and packaging status.

Potential future admin routes:

- `/admin/applications/:applicationId/product-matches`
- `/admin/applications/:applicationId/product-matches/candidates`
- `/admin/applications/:applicationId/product-matches/selected`
- `/admin/applications/:applicationId/lender-packaging`

Do not implement these routes until backend product matching contracts are available.

## 9. API Contract Wishlist

Future frontend API needs:

| Endpoint                                                                       | Purpose                                     | Notes                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------ |
| `GET /v2/borrower/application/product-match-status`                            | Borrower-safe matching state.               | Should include status, message, next_step, and readiness blockers.       |
| `GET /v2/borrower/application/product-options`                                 | Borrower-safe advisor-reviewed options.     | Must omit hidden/deferred fields.                                        |
| `POST /v2/borrower/application/product-options/{publicReference}/select`       | Select a product path for review/packaging. | Should be idempotent or safely retryable.                                |
| `GET /v2/borrower/application/selected-products`                               | Show selected product paths.                | Should include packaging status and document needs.                      |
| `GET /v2/admin/applications/{applicationId}/candidate-products`                | Admin candidate products table.             | Admin-only; can include internal rule output.                            |
| `POST /v2/admin/applications/{applicationId}/candidate-products/{id}/override` | Advisor include/exclude override.           | Require reason and audit trail.                                          |
| `POST /v2/admin/applications/{applicationId}/selected-products`                | Admin selected-products cart.               | Supports advisor-assisted selection.                                     |
| `GET /v2/admin/applications/{applicationId}/lender-packaging-readiness`        | Packaging checklist.                        | Connects documents, consents, selected products, and application status. |

## 10. UX Risks

| Risk                             | Example                                                            | Mitigation                                                                                  |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| False approval signal            | Borrower sees an option card and believes they are approved.       | Use "potential path", "advisor-reviewed", and "not an approval" copy consistently.          |
| Rate misunderstanding            | Borrower interprets an estimate as a guaranteed rate.              | Hide rates until explicitly approved for display; label estimates clearly.                  |
| Lender name exposure             | Borrower sees lender names before advisor review.                  | Keep lender names hidden until the advisor/lender workflow allows exposure.                 |
| Borrower confusion               | Borrower cannot tell whether they are reviewing status or options. | Separate `/portal/application` status from future `/portal/options` paths.                  |
| Compliance risk                  | UI implies suitability, guarantee, or final terms.                 | Require legal/business review of product option copy before launch.                         |
| Stale product data               | Borrower sees outdated matches after application changes.          | Include generated_at, expires_at, and refresh-required states.                              |
| Missing data creates bad matches | Incomplete income or liabilities drive poor results.               | Block matching or show missing-info state until readiness is sufficient.                    |
| Advisor bypass                   | Raw product candidates appear directly to borrower.                | Add advisor-reviewed flag and backend gating before borrower-safe endpoint returns options. |

## 11. Phased Frontend PR Plan

| PR                                       | Scope                                                                             | Expected output                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| PR 25B: Product Match Status UI          | Add borrower-safe product match status to application workspace.                  | Status card only; no product cards.                             |
| PR 26B: Borrower Safe Product Options UI | Add `/portal/options` or equivalent options review once borrower-safe API exists. | Advisor-reviewed option cards with conservative copy.           |
| PR 27B: Selected Products UI             | Add selected product paths and selection confirmation.                            | Selected paths summary and packaging next steps.                |
| PR 28B: Lender Packaging Status UI       | Add borrower-facing packaging and lender submission status.                       | Documents needed, packaging progress, lender submission status. |

## 12. Manual QA Checklist for Future

- No matches: borrower sees neutral status and advisor guidance, not failure language.
- Missing info: borrower sees requested sections/documents and clear CTAs.
- Advisor review pending: borrower sees review-in-progress copy with no product details.
- Options being prepared: borrower sees conservative matching-pending status.
- Options ready: borrower sees only advisor-reviewed borrower-safe option fields.
- Selected products: borrower sees selected paths without final approval language.
- Lender submitted: borrower sees lender review status without implying approval.
- Declined path: borrower sees next-step/advisor copy without product promises.
- Mobile view: option cards, status cards, and CTAs remain readable and non-overlapping.
- Endpoint unavailable: borrower sees recoverable copy and safe fallback links.
- Stale data: borrower sees refresh-required or advisor-review-required messaging.

## 13. Final Recommendation

The first frontend implementation PR after backend product matching foundation should be PR 25B: Product Match Status UI.

Start with status only. Do not expose product cards, rates, lender names, match scores, or selection CTAs until the backend can return borrower-safe, advisor-reviewed product option data. This keeps the borrower experience useful while protecting against approval-signal, compliance, and stale-data risks.
