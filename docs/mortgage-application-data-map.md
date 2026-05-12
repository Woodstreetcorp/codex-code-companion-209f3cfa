# Mortgage Application — Full Data Map (Borrower → Admin / Backend)

**Scope:** Borrower frontend (this Lovable project). This document defines every
data field captured during the mortgage application phase that follows the
Mortgage Snapshot — from borrower profile to the offer the borrower selects.
It is the contract Codex will use to wire this frontend to the approvU Admin
platform and the shared database.

> Source files: `src/components/hub/borrower-profile.tsx`,
> `src/components/hub/mortgage-application.tsx`,
> `src/routes/applications.$applicationId.*`,
> `src/routes/internal.full-application.tsx`,
> `src/routes/internal.mortgage-offers.tsx`,
> `src/components/hub/exclusive-offers.tsx`,
> `src/components/hub/lender-response.tsx`,
> `src/components/hub/funding-conditions.tsx`.
>
> Snapshot inputs are documented separately in
> `docs/qualification-flow-data-map.md`. This document picks up where the
> snapshot ends and an `application` is created.

---

## 0. Top-level entities (recommended tables)

| Table | Purpose | Key parent |
|---|---|---|
| `applications` | One row per mortgage application (Purchase / Pre-Purchase / Refinance / Renewal) | `borrower_id` (auth user) |
| `application_applicants` | Borrower + co-borrowers + guarantors on the application | `application_id` |
| `applicant_profiles` | "About" personal/identity/contact per applicant | `applicant_id` |
| `applicant_addresses` | Current + previous addresses (3-yr history) | `applicant_id` |
| `applicant_employment` | Employment + self-employment + other income records | `applicant_id` |
| `applicant_income_sources` | Itemized income lines (base, bonus, OT, commission, rental, etc.) | `employment_id` |
| `applicant_credit_profile` | Credit pull summary, scores, bankruptcy/CP history, consents | `applicant_id` |
| `applicant_liabilities` | Debts (cards, loans, LOC, support, taxes) | `applicant_id` |
| `applicant_assets` | Bank, registered, non-registered, vehicle, business equity, gifts | `applicant_id` |
| `applicant_other_properties` | Properties owned outside this application (with mortgages) | `applicant_id` |
| `application_property` | Subject property (purchase/refi/renewal) details | `application_id` |
| `application_down_payment_sources` | Itemized DP / equity-take-out sources | `application_id` |
| `application_current_mortgage` | Existing mortgage(s) on subject property (refi/renewal/port) | `application_id` |
| `application_mortgage_request` | Borrower's product preferences and priorities | `application_id` |
| `application_qualified_products` | System-curated lender products presented to borrower | `application_id` |
| `application_offer_selection` | The product the borrower selected + consent | `application_id` |
| `application_lender_submission` | Submission to lender + lender response (approved terms) | `application_id` |
| `application_conditions` | Funding conditions (action required / under review / accepted) | `application_id` |
| `application_documents` | Documents tied to the application or vault | `application_id` (nullable for reusable vault docs) |
| `application_consents` | Credit pull, privacy, lender disclosure, e-sign | `application_id` |
| `application_activity_log` | Immutable audit log of every state change & event | `application_id` |

---

## 1. `applications` — application header

| Column | Type | Source UI | Notes |
|---|---|---|---|
| `id` | uuid PK | system | `APP-XXXX` display label generated separately |
| `display_id` | text | system | e.g. `APP-2041` |
| `borrower_id` | uuid FK auth.users | session | Primary applicant (account owner) |
| `type` | enum | snapshot flow | `purchase` \| `pre_purchase` \| `refinance` \| `renewal` |
| `status` | enum | system | `Snapshot Complete` → `Application Started` → `In Progress` → `Waiting for Borrower` → `Ready to Submit` → `Submitted` → `Under Review` → `Submitted to Lender` → `Lender Decision Pending` → `Approved` → `Conditions in Progress` → `Ready for Closing` → `Funded` \| `Expired` |
| `completion_pct` | int 0-100 | derived | Sum of section completion |
| `expires_at` | timestamptz | system | snapshot → app expiry (14 days active rule, see `data.ts`) |
| `created_from_snapshot_id` | uuid FK | snapshot | Links back to qualification snapshot |
| `mortgage_snapshot_json` | jsonb | snapshot | Frozen snapshot payload at time of app creation |
| `last_updated_at` | timestamptz | system | |
| `assigned_advisor_id` | uuid FK admin.users | admin | Broker / advisor on file |
| `lender_path` | text | snapshot | `Major Bank Path` \| `Monoline Lender Path` \| `Credit Union Path` \| `Alt-A Path` \| `Private Path` |

---

## 2. `application_applicants`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `application_id` | uuid FK | |
| `user_id` | uuid FK auth.users (nullable) | Co-borrowers may be invited by email before they create an account |
| `role` | enum | `Primary Applicant` \| `Co-Applicant` \| `Co-Borrower` \| `Guarantor` \| `Spouse / Partner` \| `Non-Applicant Property Owner` |
| `is_primary` | bool | One per application |
| `access_level` | enum | `full` \| `view` \| `signing_only` |
| `invite_status` | enum | `not_sent` \| `invited` \| `accepted` \| `declined` |
| `invite_email` | text | |
| `invited_at` / `accepted_at` | timestamptz | |
| `on_title` | bool | "Will this borrower be on title?" |
| `on_mortgage` | bool | |
| `provides_income` | bool | |
| `provides_down_payment` | bool | |
| `debts_included` | bool | |
| `occupies_property` | bool | |
| `completion_pct` | int | |

---

## 3. `applicant_profiles` — About section

Captured in `BorrowerProfile › AboutSection` (`borrower-profile.tsx` ~ L800).

| Field | Type | Required | UI |
|---|---|---|---|
| `legal_first_name` | text | ✓ | text |
| `legal_middle_name` | text | | text |
| `legal_last_name` | text | ✓ | text |
| `preferred_name` | text | | text |
| `date_of_birth` | date | ✓ | date picker |
| `marital_status` | enum | | `Single` \| `Married` \| `Common-Law` \| `Separated` \| `Divorced` \| `Widowed` |
| `dependents_count` | int | | number |
| `citizenship_status` | enum | | `Canadian Citizen` \| `Permanent Resident` \| `Work Permit` \| `Other` |
| `sin_encrypted` | text | (collected at credit-pull) | tokenized — never plaintext |
| `email` | text | ✓ | unique per user |
| `mobile_phone` | text | ✓ | E.164 |
| `alternate_phone` | text | | |
| `preferred_contact_method` | enum | | `Email` \| `Mobile` \| `SMS` \| `Call` |

---

## 4. `applicant_addresses` — Address section

`AddressSection` requires **3 years total tenure**; previous addresses repeat as needed.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid PK | | |
| `applicant_id` | uuid FK | | |
| `kind` | enum | | `current` \| `previous` \| `mailing` |
| `street_address` | text | ✓ | autocomplete |
| `unit` | text | | |
| `city` | text | ✓ | |
| `province` | enum | ✓ | AB BC MB NB NL NS ON PE QC SK NT NU YT |
| `postal_code` | text | ✓ | A1A 1A1 |
| `country` | enum | ✓ | Canada \| United States \| Other |
| `housing_status` | enum | ✓ | `Own` \| `Rent` \| `Live with family` \| `Employer-provided` \| `Other` |
| `years_at_address` | int | ✓ | |
| `months_at_address` | int | | |
| `monthly_housing_payment` | numeric(12,2) | | |
| `mailing_same_as_current` | bool | | replaces creation of a `mailing` row when true |

---

## 5. `applicant_employment` + `applicant_income_sources`

`IncomeSection` supports 3 employment buckets: **Employed (T4)**, **Self-Employed**, **Other**.

`applicant_employment`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `applicant_id` | uuid FK | |
| `bucket` | enum | `employed` \| `self_employed` \| `other` |
| `employer_name` | text | or business name |
| `business_structure` | enum | `Sole Proprietor` \| `Incorporated Business Owner` \| `Partnership` \| `Freelancer / Contractor` |
| `business_number` | text | CRA |
| `business_address` | text | |
| `job_title` | text | |
| `start_date` | date | |
| `end_date` | date | nullable |
| `is_current` | bool | |
| `employment_status` | enum | `Full-time` \| `Part-time` \| `Contract` \| `Seasonal` \| `On Leave` |
| `employer_phone` | text | |
| `industry` | text | |
| `years_in_industry` | int | |
| `income_trend` | enum | `increasing` \| `stable` \| `declining` |
| `verification_method` | enum | `Fully Verifiable` \| `Stated` \| `T1 Generals` \| `NOA` \| `Bank Statements` |

`applicant_income_sources` (children of an employment record)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `employment_id` | uuid FK | |
| `income_type` | enum | `base` \| `overtime` \| `bonus` \| `commission` \| `tips` \| `dividends` \| `pension` \| `child_support` \| `rental` \| `investment` \| `government_benefit` \| `disability` \| `other` |
| `gross_amount` | numeric(12,2) | |
| `frequency` | enum | `Annual` \| `Monthly` \| `Bi-Weekly` \| `Weekly` \| `Hourly` |
| `include_in_qualifying` | bool | |
| `notes` | text | |

---

## 6. `applicant_credit_profile` + `applicant_liabilities`

Captured in `CreditSection` and `Liability` type (`borrower-profile.tsx` L80).

`applicant_credit_profile`

| Field | Type | Notes |
|---|---|---|
| `applicant_id` | uuid PK | |
| `pull_consent_signed_at` | timestamptz | required before pull |
| `pull_consent_doc_id` | uuid | -> documents |
| `bureau` | enum | `Equifax` \| `TransUnion` |
| `score_range` | enum | `<600` \| `600-650` \| `650-700` \| `700-750` \| `750+` (matches snapshot) |
| `score_numeric` | int | once pulled |
| `pulled_at` | timestamptz | |
| `bankruptcy_history` | bool | |
| `bankruptcy_discharge_date` | date | |
| `consumer_proposal_history` | bool | |
| `consumer_proposal_discharge_date` | date | |
| `collections_open` | bool | |
| `judgments_open` | bool | |

`applicant_liabilities`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `applicant_id` | uuid FK | owner_id |
| `creditor` | text | |
| `type` | enum | `Credit Card` \| `Auto Loan` \| `Student Loan` \| `Personal Loan` \| `Line of Credit` \| `HELOC` \| `Tax Debt` \| `Support / Alimony` \| `Other` |
| `balance` | numeric(12,2) | |
| `monthly_payment` | numeric(12,2) | |
| `shared` | bool | |
| `shared_with_applicant_ids` | uuid[] | |
| `payment_history` | enum | `R1` \| `R2` \| `R3` \| `R4` \| `R5` \| `R7` \| `R8` \| `R9` |
| `payoff_plan` | enum | `payoff_before_closing` \| `leave_open` \| `include_in_loan` |

---

## 7. `applicant_assets`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `applicant_id` | uuid FK | |
| `type` | enum | `Chequing` \| `Savings` \| `TFSA` \| `RRSP` \| `FHSA` \| `Non-Registered` \| `GIC` \| `Stocks/ETF` \| `Crypto` \| `Vehicle` \| `Business Equity` \| `Other` |
| `institution` | text | |
| `value` | numeric(12,2) | |
| `for_down_payment` | numeric(12,2) | dollars allocated to DP |
| `dp_mode` | enum | `amount` \| `pct` |
| `dp_input` | text | raw user input |

---

## 8. `applicant_other_properties` + `other_property_mortgages`

From `OtherProperty` type (`borrower-profile.tsx` L117).

`applicant_other_properties`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `applicant_id` | uuid FK | |
| `address`, `city`, `province`, `postal_code` | text | |
| `current_owner_applicant_ids` | uuid[] | co-owners on this application |
| `plans_to_sell` | enum | `yes` \| `no` |
| `usage` | enum | `Owner-Occupied` \| `Second Home` \| `Rental` \| `Vacation` |
| `type` | enum | `Detached` \| `Semi-Detached` \| `Townhouse` \| `Condo Apt` \| `Condo Town` \| `Multi-Plex (2-4)` \| `Other` |
| `ownership_pct` | int | |
| `ownership_timeframe` | enum | `<1 year` \| `1-3 years` \| `3-5 years` \| `5+ years` |
| `value` | numeric(12,2) | |
| `monthly_rental_income` | numeric(12,2) | |
| `rental_frequency` | enum | `Monthly` \| `Annual` |
| `units_count` | int | |
| `heating_cost` | numeric | + `heating_included_in_condo` (bool) |
| `property_tax` + `property_tax_frequency` | num + enum | `Annual` \| `Monthly` |
| `condo_fee` + `condo_fee_frequency` | num + enum | |
| `monthly_costs` | numeric | misc |
| `mortgage_free` | bool | |
| `include_in_application` | bool | |

`other_property_mortgages` (children)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `other_property_id` | uuid FK | |
| `position` | enum | `First` \| `Second` \| `HELOC` \| `Private` |
| `lender` | text | |
| `balance` | numeric | |
| `rate` | numeric | |
| `rate_type` | enum | `Fixed` \| `Variable` \| `Adjustable` |
| `term_type` | enum | `Open` \| `Closed` \| `Convertible` |
| `maturity_date` | date | |
| `payment` | numeric | |
| `payment_frequency` | enum | see §11 |

---

## 9. `application_property` — subject property

Captured in `applications.$applicationId.property-financing.property.tsx`,
`target-property.tsx`, and `purchase-plan.tsx`. Same table covers all 4 flows
with a discriminator.

| Field | Type | Required | Notes |
|---|---|---|---|
| `application_id` | uuid PK | | one per application |
| `flow` | enum | ✓ | `purchase` \| `pre_purchase` \| `refinance` \| `renewal` |
| `address_known` | bool | | false for `pre_purchase` and early `purchase` |
| `street_number`, `street_name`, `unit`, `city`, `province`, `postal_code`, `country` | text | conditionally | manual or autocomplete |
| `value_or_price` | numeric(12,2) | ✓ | purchase price OR estimated value (refi/renewal) OR target price (pre-purchase range) |
| `value_source` | enum | | `Purchase Agreement` \| `Borrower Estimate` \| `Recent Appraisal` \| `Municipal Assessment` \| `AVM` |
| `usage` | enum | ✓ | `Owner-Occupied` \| `Second Home` \| `Rental` \| `Mixed-Use` |
| `property_type` | enum | ✓ | `Detached` \| `Semi-Detached` \| `Townhouse Freehold` \| `Townhouse Condo` \| `Condo Apartment` \| `Multi-Plex 2-4` \| `Mobile/Modular` \| `Co-op` \| `Acreage` |
| `units_count` | int | if multi-plex | |
| `condo_fee` + `condo_fee_frequency` | num + enum | if condo | |
| `condo_heat_included` | bool | | |
| `property_tax` + `property_tax_frequency` | num + enum | ✓ | |
| `heating_cost` + `heating_frequency` | num + enum | | |
| `rental_income` + `rental_income_frequency` | num + enum | if rental/mixed | |
| `existing_condition` | enum | | `Existing Resale` \| `New Construction` \| `Under Construction` \| `Pre-Construction` |
| `new_construction_type` | enum | | `Detached Build` \| `Builder Spec` \| `Custom Build` |
| `uc_completion_date` | date | | under construction |
| `uc_builder_name` | text | | |
| `uc_progress_advance_required` | bool | | |
| `ownership_share_pct` | int | | per applicant via join table if needed |
| `purchase_close_date` | date | purchase | desired closing |
| `purchase_offer_status` | enum | | `Browsing` \| `Pre-Approval Wanted` \| `Offer Drafted` \| `Offer Submitted` \| `Conditional` \| `Firm` |
| `purchase_conditions` | text[] | | `Financing` \| `Inspection` \| `Status Cert` \| `Sale of Current Home` |
| `target_price_min` / `target_price_max` | numeric | pre_purchase | range slider |
| `target_neighbourhoods` | text[] | pre_purchase | |
| `target_timeframe` | enum | pre_purchase | `0-3 mo` \| `3-6 mo` \| `6-12 mo` \| `12+ mo` |
| `realtor_name`, `realtor_brokerage`, `realtor_phone`, `realtor_email` | text | purchase | |

---

## 10. `application_current_mortgage` (refi / renewal / port)

From `property-financing.current-mortgage.tsx`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `application_id` | uuid FK | | |
| `mortgage_free` | bool | | short-circuits the rest |
| `position` | enum | ✓ | `First` \| `Second` \| `HELOC` \| `Private` |
| `current_lender` | text | ✓ | |
| `outstanding_balance` | numeric(12,2) | ✓ | |
| `current_rate` | numeric(5,3) | ✓ | |
| `rate_type` | enum | ✓ | `Fixed` \| `Variable` \| `Adjustable` |
| `monthly_payment` | numeric(12,2) | ✓ | |
| `payment_frequency` | enum | ✓ | see §11 |
| `term_type` | enum | | `Open` \| `Closed` \| `Convertible` |
| `maturity_date` | date | | |
| `remaining_amortization_years` | int | | |
| `include_in_refi_renewal` | bool | | |
| `prepayment_penalty_known` | bool | | |
| `prepayment_penalty_amount` | numeric | | |
| `mortgage_statement_uploaded` | bool | | -> `application_documents` |
| `heloc_credit_limit` / `heloc_amount_drawn` / `heloc_interest_only` / `heloc_secured_against_subject` | num/bool | if HELOC | |

---

## 11. `application_down_payment_sources` (purchase) / equity sources (refi)

From `property-financing.down-payment.tsx`.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `application_id` | uuid FK | |
| `kind` | enum | `Savings/Investment` \| `Gift` \| `Government Program` \| `Builder/Vendor Incentive` \| `Foreign Funds` \| `Borrowed Funds` \| `Sale Proceeds` \| `Equity Take-Out` |
| `amount` | numeric(12,2) | ✓ |
| `applicant_owner_ids` | uuid[] | which borrowers contribute |
| **Savings** → `account_type`, `institution`, `held_90_days` (bool) | | |
| **Gift** → `donor_relationship`, `is_repayable` (bool), `donor_country` | | |
| **Gov Program** → `program_name`, `approval_status` | | e.g. FHSA, FTHBI, HBP |
| **Incentive** → `incentive_type`, `disclosed_in_apa` (bool) | | |
| **Foreign** → `country`, `currency`, `funds_in_canada` (bool) | | |
| **Borrowed** → `lender_source`, `monthly_payment`, `repayment_terms` | | |
| **Sale Proceeds** → `property_address`, `expected_proceeds`, `firm_sale` (bool), `closing_date` | | |
| `notes` | text | | |

Frequency enum reused across the schema:
`Weekly` \| `Bi-Weekly` \| `Semi-Monthly` \| `Monthly` \| `Accelerated Bi-Weekly` \| `Accelerated Weekly` \| `Annual`.

---

## 12. `application_mortgage_request` — what the borrower wants

From `applications.$applicationId.mortgage-request.tsx` and `product-priority.tsx`.

| Field | Type | Notes |
|---|---|---|
| `application_id` | uuid PK | |
| `priorities` | text[] | up to 3 from: `Lowest Rate`, `Lowest Payment`, `Maximum Flexibility`, `Fastest Closing`, `Trusted Brand`, `Best Bundle/Cash Back`, `Most Prepayment`, `Branch Access` |
| `payment_stability_preference` | enum | `Stability First` \| `Some Variability OK` \| `Lowest Rate Even If Variable` |
| `involvement_level` | enum | `Show me top match` \| `Show me 3 to compare` \| `Show me everything` |
| `preferred_term` | enum | `1-yr` \| `2-yr` \| `3-yr` \| `4-yr` \| `5-yr` \| `7-yr` \| `10-yr` |
| `preferred_rate_type` | enum | `Fixed` \| `Variable` \| `Adjustable` \| `No preference` |
| `preferred_payment_frequency` | enum | see §11 |
| `preferred_amortization_years` | int | 5–35 |
| `max_comfortable_monthly_payment` | numeric | optional cap |
| `must_have_features` | text[] | `Prepay 20/20`, `Skip-a-payment`, `Portability`, `Assumability`, `Cashback`, `Open prepayment`, `Home Life Bundle eligible`, `No CMHC`, `Stated income OK` |
| `avoid_features` | text[] | `Bona-fide sales clause`, `Collateral charge`, `IRD penalty`, `Stress-test only`, `Lender fee` |
| `top_lender_path` | enum | repeats `applications.lender_path` for borrower-stated preference |

---

## 13. `application_qualified_products` — curated list shown to borrower

From `applications.$applicationId.qualified-mortgages.tsx` (and the snapshot `OFFERS` mock).

Each presented product row:

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `application_id` | uuid FK | |
| `lender_id` | uuid FK lenders | |
| `lender_display_name` | text | e.g. "First National Financial" |
| `lender_initials` | text | e.g. "FN" |
| `lender_type_path` | enum | `Major Bank` \| `Monoline Lender` \| `Credit Union` \| `Alt-A` \| `Private` |
| `product_code` | text | lender's internal code |
| `product_name` | text | "FN Dime Best – Uninsured Mtg O/O FRM" |
| `product_classification` | enum | `Prime` \| `Standard` \| `Alt-A` \| `B-Lender` \| `Private` |
| `term_years` | int | |
| `rate_type` | enum | `Fixed` \| `Variable` \| `Adjustable` |
| `rate_pct` | numeric(5,3) | quoted |
| `apr_pct` | numeric(5,3) | |
| `amortization_years` | int | |
| `payment_frequency` | enum | as quoted |
| `monthly_payment` | numeric(12,2) | qualifying scenario |
| `loan_amount` | numeric(12,2) | |
| `closing_costs_estimate` | numeric(12,2) | |
| `lender_fee` | numeric(12,2) | |
| `rate_hold_days` | int | 30 / 60 / 90 / 120 |
| `prepayment_privileges` | text | e.g. "20/20 lump + payment increase" |
| `portability` | bool | |
| `assumability` | bool | |
| `mortgage_status` | enum | `Open` \| `Closed` \| `Convertible` |
| `insurer` | enum | `None (Conventional)` \| `CMHC` \| `Sagen` \| `Canada Guaranty` |
| `insurance_premium` | numeric(12,2) | |
| `bundle_value` | numeric(12,2) | Home Life Bundle benefit |
| `bundle_name` | text | |
| `badge` | text | "Best Overall Value" / "Best for Flexibility" |
| `tagline` | text | borrower-facing line |
| `match_reason` | text | why this product was matched |
| `description` | text | longer copy |
| `is_curated` | bool | among the top 3-5 |
| `rank_score` | numeric | system rank |
| `presented_at` | timestamptz | |
| `expires_at` | timestamptz | rate hold expiry |

---

## 14. `application_offer_selection`

| Field | Type | Notes |
|---|---|---|
| `application_id` | uuid PK | one selection at a time |
| `selected_product_id` | uuid FK qualified_products | |
| `selected_at` | timestamptz | |
| `selected_by_applicant_id` | uuid FK | |
| `consent_to_proceed_signed_at` | timestamptz | "Product Review Consent" page |
| `consent_doc_id` | uuid FK documents | |
| `notes_to_advisor` | text | |
| `prior_selection_history` | jsonb | array of {product_id, selected_at, deselected_at} |

---

## 15. `application_lender_submission` — broker → lender → response

From `internal.full-application.tsx`, `internal.mortgage-offers.tsx` and
`hub/lender-response.tsx`.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `application_id` | uuid FK | |
| `submitted_to_lender_id` | uuid FK | |
| `submitted_at` | timestamptz | |
| `submitted_via` | enum | `Filogix` \| `Velocity` \| `Newton/Lendesk` \| `Direct Portal` \| `Email` |
| `decision` | enum | `pending` \| `approved` \| `approved_with_conditions` \| `declined` \| `cancelled` |
| `decision_at` | timestamptz | |
| `lender_reference_number` | text | |
| `commitment_letter_doc_id` | uuid FK documents | |
| **Approved terms** (mirrors borrower's request, columns `requested_*` and `approved_*` per `lender-response.tsx`) | | |
| `requested_amount` / `approved_amount` | numeric | |
| `requested_rate` / `approved_rate` | numeric | |
| `requested_payment` / `approved_payment` | numeric | |
| `requested_term` / `approved_term` | text | |
| `requested_rate_type` / `approved_rate_type` | enum | |
| `requested_amortization` / `approved_amortization` | int | |
| `requested_frequency` / `approved_frequency` | enum | |
| `requested_lender_fee` / `approved_lender_fee` | numeric | |
| `requested_close_date` / `approved_close_date` | date | |
| `outstanding_conditions_count` | int | derived |
| `bundle_eligibility` | enum | `Eligible` \| `Not Eligible` |
| `change_summary_json` | jsonb | per-field changed flag + note |

---

## 16. `application_conditions`

From `hub/funding-conditions.tsx`.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `application_id` | uuid FK | |
| `lender_submission_id` | uuid FK | |
| `name` | text | "Confirm employment letter" |
| `description` | text | |
| `category` | enum | `Income` \| `Down Payment` \| `Property` \| `Identity` \| `Credit` \| `Insurance` \| `Title/Legal` \| `Other` |
| `status` | enum | `Action Required` \| `Under Review` \| `Accepted` \| `Needs Correction` \| `Overdue` \| `Managed by approvU` |
| `assigned_to` | enum | `borrower` \| `advisor` \| `lender` \| `lawyer` |
| `due_date` | date | |
| `document_id` | uuid FK documents | |
| `resolved_at` | timestamptz | |
| `correction_notes` | text | |

---

## 17. `application_documents` (and Vault overlap)

Mirrors `VAULT_DOCUMENTS` in `src/components/portal/data.ts`.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `application_id` | uuid FK (nullable) | null = reusable vault doc |
| `applicant_id` | uuid FK | uploader / subject |
| `name` | text | |
| `category` | enum | `Identity` \| `Income` \| `Property` \| `Banking` \| `Consent` \| `Approval` \| `Commitment` \| `Closing` \| `Other` |
| `status` | enum | `Verified` \| `Under Review` \| `Received` \| `Expired` \| `Archived` \| `Generated` |
| `storage_path` | text | bucket key |
| `uploaded_at` | timestamptz | |
| `shared_with_lender` | bool | |
| `reusable` | bool | |
| `signed` | bool | e-sign status |
| `is_approval_artifact` | bool | |
| `archived` | bool | |
| `expires_at` | timestamptz | re-fresh policy (e.g. NOA every tax year) |

---

## 18. `application_consents`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `application_id` | uuid FK | |
| `applicant_id` | uuid FK | |
| `kind` | enum | `credit_pull` \| `privacy_disclosure` \| `lender_disclosure` \| `product_review` \| `e_sign_master` \| `marketing` |
| `version` | text | doc template version |
| `signed_at` | timestamptz | |
| `ip` | inet | |
| `user_agent` | text | |
| `document_id` | uuid FK documents | the signed PDF |

---

## 19. `application_activity_log` (audit)

| Field | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `application_id` | uuid FK | |
| `actor_id` | uuid | borrower, advisor, lender, system |
| `actor_role` | enum | `borrower` \| `advisor` \| `lender` \| `system` |
| `event_type` | text | `application_created`, `section_completed`, `document_uploaded`, `consent_signed`, `offer_selected`, `submitted_to_lender`, `lender_decision`, `condition_resolved`, `funded`, etc. |
| `payload_json` | jsonb | event-specific |
| `at` | timestamptz | |

---

## 20. Localisation between borrower frontend and Admin

| Borrower frontend (this Lovable project) | Admin Lovable project | Shared backend table |
|---|---|---|
| Borrower fills `BorrowerProfile` sections | Admin views read-only + override flag per field | `applicant_*` |
| Borrower selects an offer | Admin sees selection + can package for lender submission | `application_offer_selection`, `application_qualified_products` |
| Borrower receives lender decision panel | Admin enters decision + commitment doc | `application_lender_submission` |
| Borrower works conditions queue | Admin assigns / approves / requests correction | `application_conditions` |
| Borrower vault | Admin doc inbox | `application_documents` |
| Borrower consents | Admin compliance pack export | `application_consents` |
| Borrower activity feed (`portal/activity.ts`) | Admin audit trail | `application_activity_log` |

---

## 21. Open items to confirm with Codex / Admin team

1. **Lender catalog** — does Admin own `lenders` and `lender_products` master data, or is it imported from a rate engine (e.g. Lendesk, Newton, Filogix)?
2. **Insurer pricing** — should premium be calculated client-side (we have `src/lib/calculations.ts`) or server-side via insurer API?
3. **Stress-test rate** — confirm OSFI B-20 qualifying rate source (system table vs hardcoded).
4. **PII tokenisation** — SIN, DOB, banking detail must be encrypted at rest; confirm encryption strategy (Supabase Vault vs column-level KMS).
5. **Multi-applicant invite flow** — confirm OTP / magic-link mechanism for co-borrower onboarding.
6. **Document e-sign provider** — DocuSign? OneSpan? Internal? Affects `consents.document_id` lifecycle.
7. **Activity log retention** — regulatory minimum (FSRA / FINTRAC) typically 7 years; confirm policy.

---

_Last updated: 2026-05-12. Maintained alongside `docs/qualification-flow-data-map.md` and `docs/codex-frontend-handoff.md`._