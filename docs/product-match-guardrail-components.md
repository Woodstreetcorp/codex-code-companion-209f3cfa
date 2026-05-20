# Product Match Guardrail Components

## Purpose

PR 25D creates shared frontend copy helpers for borrower-facing product matching status areas.

The goal is to keep product matching language conservative until a borrower-safe backend product matching contract exists. Future product option UI should reuse these helpers instead of writing one-off copy that could accidentally imply approval, final rates, lender commitments, or fake product availability.

## Shared Copy File

Shared copy lives in:

`src/lib/productMatching/productMatchCopy.ts`

Exports:

- `ProductMatchStatus`
- `ProductMatchCta`
- `ProductMatchStatusCopy`
- `PRODUCT_MATCH_CTA_LABELS`
- `PRODUCT_MATCH_DISCLAIMER`
- `getProductMatchStatusCopy(status, overrides?)`
- `getProductMatchDisclaimer()`

The helper returns borrower-safe labels, headlines, body copy, and default CTAs for each product matching status. Pages may override CTA routes or labels when their local route context requires it.

## Statuses

| Status                      | Meaning                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `not_ready`                 | The borrower file is not ready for product matching status beyond application progress. |
| `missing_information`       | More information or documents are needed before matching can continue.                  |
| `advisor_review`            | The application is being reviewed by the approvU team.                                  |
| `options_being_prepared`    | Potential mortgage paths are being assessed, without showing product details.           |
| `options_ready_placeholder` | Advisor-reviewed next steps are being prepared, without exposing option cards.          |
| `lender_review_placeholder` | The file is in lender review status, without final terms or lender commitments.         |

## Prohibited Language

Do not add borrower-facing product matching copy that includes:

- "You are approved"
- "Guaranteed"
- "Best rate"
- "Lowest rate"
- "Lender has approved you"
- "Final offer"
- "Locked rate"
- lender names
- product cards before advisor-reviewed backend support
- match scores
- selected products
- fake product, rate, or lender data

The shared disclaimer is:

> These are not approvals. Final terms depend on lender review.

## Where Used

| Page                  | File                                | Usage                                                                            |
| --------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `/portal/application` | `src/routes/portal.application.tsx` | Uses shared status copy for the application workspace Product Match Status card. |
| `/portal/offers`      | `src/routes/portal.offers.tsx`      | Uses shared status copy for the offers/review Product Match Status scaffold.     |

## Future Usage Rules

1. Use `getProductMatchStatusCopy()` for all borrower-facing product matching status copy.
2. Use `getProductMatchDisclaimer()` anywhere product matching progress is mentioned.
3. Override CTA routes locally only when the page has better context, such as an open review request route.
4. Do not introduce lender names, rates, match scores, product cards, selected products, or approval language until a future backend contract explicitly supports borrower-safe display.
5. Keep future product option cards separate from these status helpers, but reuse the same disclaimer and prohibited-language rules.
6. If legal or business review changes the safe wording, update the shared helper first so all product matching surfaces stay aligned.

## Verification Notes

Manual QA should confirm:

- `/portal/application` still shows the same Product Match Status card behavior.
- `/portal/offers` shows conservative product match status language instead of preliminary lending-path details.
- Both pages include the shared disclaimer.
- No lender names, rates, match scores, fake product data, selected products, or approval promises appear.

## Deferred Items

- product matching backend status endpoint
- borrower-safe product option cards
- selected products UI
- lender packaging status UI
- admin product matching screens
- legal-reviewed product option copy
