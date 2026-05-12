# Qualification Flows → Mortgage Snapshot Data Map

Maps every input collected by the three qualification flows (`purchase`, `pre`,
`refinance` — defined in `src/lib/flows.ts`) to the `answers` key it stores
under, its type/options, the conditional logic that controls visibility, and
how the resulting Mortgage Snapshot (`src/components/MortgageSnapshot.tsx` +
`src/lib/calculations.ts` + `src/lib/policy.ts`) consumes it.

Use this as the schema reference when wiring Codex / database persistence.

---

## 1. Master Input Table

| # | Answer Key | Type | Flows | Question | Options / Format | Conditional (`showIf`) | Snapshot Usage |
|---|------------|------|-------|----------|------------------|------------------------|----------------|
| 1 | `use` | choice | purchase, pre, refinance | How will you use the property? | `primary` / `rental` / `secondary` | always | `mapUsage()` → `PRIMARY_RESIDENCE` / `RENTAL_INVESTMENT` / `SECONDARY_VACATION`; drives min-DP policy, mortgage category, bundle name |
| 2 | `firstTime` | choice | purchase, pre | First-time home buyer in Canada? | `yes` / `no` / `unsure` | `use === "primary"` | Bundle name (`SmartStart` if yes); display in Review Answers |
| 3 | `offer` | choice | purchase | Do you have an accepted offer? | `yes` / `no` | always | Drives copy/CTA; not in classifier |
| 4 | `address` | text | purchase, refinance | Property address (Ontario) | free text | always | Display + persisted; not in classifier |
| 5 | `propertyType` | choice | purchase, pre, refinance | Property type | `detached` / `semi` / `condo` / `multi` | always | Display + downstream lender matching |
| 6 | `units` | choice | purchase, pre | Number of units | `1` / `2` / `3` / `4` | always | `Number(units)` → `unit_count` in `getMinimumDownPaymentPolicy`; ≥5 → `COMMERCIAL_OR_TAILORED_REVIEW` |
| 7 | `credit` | number | purchase, pre, refinance | Approximate credit score | integer | always | `getCreditScore` → drives `getCreditPosition`, Prime/Alternative classifier |
| 8 | `income` | choice | purchase, pre, refinance | How do you earn income? | `employed` / `self` / `other` / `combo` | always | `income_type` in `classifyLane`; `getIncomeProfile` label |
| 9 | `selfVerify` | choice | purchase, pre, refinance | Self-employed verification method | `tax` / `bank` / `unsure` | `income === "self"` OR `income === "combo"` | `income_verification`; `bank` downgrades Prime → Alternative |
| 10 | `price` | currency | purchase | Purchase price | CAD | always | `getEffectivePrice` → DP policy, mortgage category, loan, LTV |
| 11 | `down` | currency | purchase | Down payment | CAD | always | `getEffectiveDown` → DP gap check, LTV, lane |
| 12 | `priceRange` | choice | pre | Price range | `u400` / `400-600` / `600-900` / `900-1.2` / `1.2-1.5` / `1.5+` / `specific` | always | `priceRangeMidpoint()` → effective price when not `specific` |
| 13 | `specificPrice` | currency | pre | Target purchase price | CAD | `priceRange === "specific"` | Overrides midpoint in `getEffectivePrice` |
| 14 | `savedDown` | currency | pre | Saved for down payment | CAD | always | Used as effective down when `down` is empty |
| 15 | `locations` | locations | pre | Cities/neighbourhoods (max 5) | `string[]` | always | Display + lender geo routing |
| 16 | `ownsResidence` | choice | purchase, pre, refinance | Own your primary residence? | `own` / `rent` / `other` | `use === "rental"` OR `use === "secondary"` | Display only; future portfolio review |
| 17 | `intent` | multi | refinance | Mortgage intent | `renew` / `switch` / `lower-payment` / `better-rate` / `cash-out` / `consolidate` / `heloc` / `unsure` | always | `analyzeRenewalIntent()` → `renewal` / `refinance` / `hybrid` / `guided`; `cash-out`/`consolidate`/`heloc` force equity-access |
| 18 | `lowerPaymentIntent` | choice | refinance | Borrow more or only review terms? | `review-only` / `borrow-more` / `consolidate` / `unsure` | `intent` includes `lower-payment` AND none of `cash-out`/`consolidate`/`heloc` | Refines renewal vs refinance routing |
| 19 | `value` | currency | refinance | Estimated property value | CAD | always | Denominator for refi LTV; flags input as refi |
| 20 | `numMortgages` | choice | refinance | Mortgages registered | `0` / `1` / `2` / `3` | always | Controls visibility of `mortgages` array |
| 21 | `mortgages` | mortgages | refinance | Existing mortgage details | `MortgageEntry[]` (position, lender, balance, payment, maturity, rate) | `1 ≤ Number(numMortgages) ≤ 3` | Σ `balance` + `cashAmount` ÷ `value` → `estimated_ltv` |
| 22 | `wantsEquity` | choice | refinance | Access equity / cash out? | `yes` / `no` | always | Forces cash-out path; reveals next two fields |
| 23 | `cashAmount` | currency | refinance | Cash out needed | CAD | `wantsEquity === "yes"` OR intent includes `cash-out`/`consolidate`/`heloc` | Added to balance for refi LTV |
| 24 | `cashout_purposes` | multi | refinance | Use of additional funds | `home_renovations` / `debt_consolidation` / `investment` / `education` / `other` | same as `cashAmount` | Display + compliance routing |
| 25 | `other_cashout_purpose_detail` | text | refinance | Describe other use | free text | `cashout_purposes` includes `other` | Display + broker note |

---

## 2. Snapshot Derivations

| Derived Field | Function | Inputs | Output |
|---------------|----------|--------|--------|
| Effective price | `getEffectivePrice` | `price`, `specificPrice`, `priceRange` | CAD |
| Effective down | `getEffectiveDown` | `down`, `savedDown` | CAD |
| Loan amount | inline | price − down | CAD |
| LTV | `ltv()` | loan, price | % |
| Min DP policy | `getMinimumDownPaymentPolicy` | `use`, price, `units`, down | `{ minimum_down_payment_amount, program_lane }` |
| Credit score | `getCreditScore` | `credit` | int |
| Credit position | `getCreditPosition` | score | `Strong Prime` / `Prime` / `Alternative` / `Needs Review` |
| Credit range label | `getCreditRange` | score | display |
| Income profile | `getIncomeProfile` | `income`, `selfVerify` | display |
| Lending lane | `classifyLane` | score, `income`, `selfVerify`, meets-min-DP | `PRIME_FIT` / `ALTERNATIVE_FIT` / `TAILORED_REVIEW` |
| Prime subtype | `classifyPrimeSubtype` | score, `income`, `selfVerify` | `PRIME_PLUS` / `STANDARD_PRIME` |
| Alternative result | `classifyAlternative` | score, `income`, `selfVerify`, txn type, DP %, est. LTV | path + tier |
| Mortgage category | `getMortgageCategory` | flow, price, `use`, `units`, down | `Insured` / `Insurable` / `Uninsurable` / `Refinance` / `Confirming` |
| Lending path | `getLendingPath` | lane + alt downgrade | `Prime Fit` / `Alternative Fit` / `Needs Tailored Review` |
| Next step CTA | `getNextStep` | lending path | display |
| Bundle name | `getBundleName` | flow, `use`, `firstTime` | `SmartStart` / `Investor Advantage` / `Stability Plus` / `Refinance Advantage` |
| Renewal routing | `analyzeRenewalIntent` | `intent`, value, balance | `renewal` / `refinance` / `hybrid` / `guided` |

---

## 3. Flow → Snapshot Component Routing

| Flow | Route | Component | Hero |
|------|-------|-----------|------|
| `purchase` | `/purchase` | `PurchaseSnapshot` | "Your Mortgage Snapshot" — loan amount hero |
| `pre` | `/pre-purchase` | `PurchaseSnapshot` (isPre=true) | "Your Pre-Purchase Snapshot" — estimated qualifying mortgage |
| `refinance` | `/refinance` | `RefinanceSnapshot` | LTV + equity-available hero |

---

## 4. Required Keys Per Flow (for validation / DB NOT NULL)

- **purchase**: `use`, `propertyType`, `units`, `credit`, `income`, `price`, `down` (+ `selfVerify` if self/combo, + `firstTime` if primary, + `ownsResidence` if rental/secondary, + `offer`, + `address`).
- **pre**: `locations`, `use`, `propertyType`, `units`, `credit`, `income`, `priceRange`, `savedDown` (+ `specificPrice` if `priceRange === "specific"`, + `firstTime` if primary, + `ownsResidence` if rental/secondary).
- **refinance**: `intent`, `propertyType`, `address`, `use`, `value`, `numMortgages`, `wantsEquity`, `credit`, `income` (+ `mortgages[]` if 1–3, + `cashAmount` & `cashout_purposes` if equity, + `lowerPaymentIntent` when only `lower-payment` selected).

---

## 5. Codex Wiring Notes

- Persist the full `answers` object as JSONB on `applications.qualification_answers`, then mirror **derived fields** as columns (`lending_path`, `mortgage_category`, `credit_position`, `effective_price`, `effective_down`, `ltv`, `bundle_name`) for indexing and admin filters.
- All derivations live in `src/lib/calculations.ts` and `src/lib/policy.ts` — pure functions; import them in server functions to recompute on submit (never trust client-derived values).
- Persist the `visible` question array so the snapshot can be re-rendered exactly as the borrower saw it (audit trail).
