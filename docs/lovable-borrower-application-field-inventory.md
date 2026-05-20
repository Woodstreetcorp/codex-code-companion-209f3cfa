# Lovable Borrower Application Field Inventory

## 1. Executive Summary

This is a frontend-only inventory of the current Lovable borrower application forms and the API payloads already wired in the approvU frontend. The application section API currently covers `borrower_profile`, `property`, `income`, `assets_down_payment`, and `liabilities`. Documents, consents, review/submit, and review-request responses use separate borrower APIs.

Main findings:

- Borrower profile, target property, income, assets/down payment, and liabilities are saved and restored.
- Income and Credit & Liabilities are embedded in `src/components/hub/borrower-profile.tsx`, rendered from `src/routes/internal.full-application.tsx`.
- Target property and down payment are standalone property-financing route files.
- Some Lovable hub areas are still local-only: profile Assets, Other Properties, and the hub Review & Consent declarations.
- Payload naming is mixed: property/profile use mostly snake_case, while income/liability nested objects include camelCase keys.
- Several drawer fields are used only to calculate compact saved objects and are not restored as editable detailed fields.

## 2. Route/Component Inventory

| Section               | Frontend File                                                                   | Route                                                             | Backend section_key   | Save wired? | Restore wired? | Notes                                                                                      |
| --------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------- | ----------- | -------------- | ------------------------------------------------------------------------------------------ |
| Borrower profile      | `src/components/hub/borrower-profile.tsx`                                       | `/internal/full-application`                                      | `borrower_profile`    | Yes         | Yes            | Saves About and Address through one section payload.                                       |
| Target property       | `src/routes/applications.$applicationId.property-financing.target-property.tsx` | `/applications/$applicationId/property-financing/target-property` | `property`            | Yes         | Yes            | Workspace uses `/applications/current/property-financing/target-property` as a route hint. |
| Income                | `src/components/hub/borrower-profile.tsx`                                       | `/internal/full-application`                                      | `income`              | Yes         | Yes            | Saves compact `income_sources`.                                                            |
| Assets / down payment | `src/routes/applications.$applicationId.property-financing.down-payment.tsx`    | `/applications/$applicationId/property-financing/down-payment`    | `assets_down_payment` | Yes         | Yes            | Separate from local-only profile Assets.                                                   |
| Liabilities           | `src/components/hub/borrower-profile.tsx`                                       | `/internal/full-application`                                      | `liabilities`         | Yes         | Yes            | Saves credit details plus visible liabilities.                                             |
| Documents             | `src/routes/portal.documents.tsx`                                               | `/portal/documents`                                               | None                  | Yes         | Yes            | Uses document-specific endpoints.                                                          |
| Consents              | `src/routes/portal.application.consents.tsx`                                    | `/portal/application/consents`                                    | None                  | Yes         | Yes            | Uses consent-specific endpoints.                                                           |
| Review / submit       | `src/routes/portal.application.review-submit.tsx`                               | `/portal/application/review-submit`                               | None                  | Yes         | Yes            | Uses readiness and submit endpoints.                                                       |
| Workspace/status      | `src/routes/portal.application.tsx`                                             | `/portal/application`                                             | Multiple              | Indirect    | Indirect       | Displays section cards, summaries, review requests, and route hints.                       |

## 3. Borrower Profile Fields

Component: `src/components/hub/borrower-profile.tsx`

Save function: `saveBorrowerProfileSection()`

Restore function: `getBorrowerApplicationSection("borrower_profile")`

Section key: `borrower_profile`

Payload root:

- `borrower_id`
- `borrower_name`
- `primary_applicant`
- `address`
- `participation`

| UI label                                          | State variable                                      | Field type           | Default value                   | Validation currently present                        | API payload key currently sent               | Restore function/key                          | Notes                                                                      |
| ------------------------------------------------- | --------------------------------------------------- | -------------------- | ------------------------------- | --------------------------------------------------- | -------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| Legal first name                                  | `profileDetails.first_name`                         | Text                 | First token from applicant name | Required marker                                     | `primary_applicant.first_name`               | `effective_data.primary_applicant.first_name` | Root-level effective_data fallback exists.                                 |
| Legal middle name                                 | `profileDetails.middle_name`                        | Text                 | `""`                            | None                                                | `primary_applicant.middle_name`              | Same                                          | Optional.                                                                  |
| Legal last name                                   | `profileDetails.last_name`                          | Text                 | Remaining applicant name        | Required marker                                     | `primary_applicant.last_name`                | Same                                          |                                                                            |
| Preferred name                                    | `profileDetails.preferred_name`                     | Text                 | `""`                            | None                                                | `primary_applicant.preferred_name`           | Same                                          | Optional.                                                                  |
| Date of birth                                     | `profileDetails.date_of_birth`                      | Date                 | `""`                            | Required marker                                     | `primary_applicant.date_of_birth`            | Same                                          | No age check.                                                              |
| Marital status                                    | `profileDetails.marital_status`                     | Select               | `"Married"`                     | None                                                | `primary_applicant.marital_status`           | Same                                          | Options include Single, Married, Common-Law, Separated, Divorced, Widowed. |
| Number of dependents                              | `profileDetails.dependents`                         | Text                 | `"0"`                           | None                                                | `primary_applicant.dependents`               | Same                                          | String value.                                                              |
| Citizenship / Residency                           | `profileDetails.residency_status`                   | Select               | `"Canadian Citizen"`            | None                                                | `primary_applicant.residency_status`         | Same                                          |                                                                            |
| Email                                             | `profileDetails.email`                              | Email                | Applicant email or `""`         | Required marker                                     | `primary_applicant.email`                    | Same                                          | Browser input type only.                                                   |
| Mobile phone                                      | `profileDetails.phone`                              | Text                 | `""`                            | Required marker                                     | `primary_applicant.phone`                    | Same                                          |                                                                            |
| Alternate phone                                   | `profileDetails.alternate_phone`                    | Text                 | `""`                            | None                                                | `primary_applicant.alternate_phone`          | Same                                          | Optional.                                                                  |
| Preferred contact method                          | `profileDetails.contact_preference`                 | Select               | `"Email"`                       | None                                                | `primary_applicant.contact_preference`       | Same                                          | Email, Mobile, SMS, Call.                                                  |
| Role on this application                          | `profileDetails.role`                               | Select               | Applicant role                  | None                                                | `primary_applicant.role`                     | Same                                          | Duplicates applicant role metadata.                                        |
| Street address                                    | `addressDetails.street_address`                     | Address autocomplete | `""`                            | Required marker                                     | `address.street_address`                     | `effective_data.address.street_address`       | Previous-address prompt is local-only.                                     |
| Unit / Suite                                      | `addressDetails.unit`                               | Text                 | `""`                            | None                                                | `address.unit`                               | Same                                          |                                                                            |
| City                                              | `addressDetails.city`                               | Text                 | `""`                            | Required marker                                     | `address.city`                               | Same                                          |                                                                            |
| Province                                          | `addressDetails.province`                           | Select               | `"AB"`                          | Required marker                                     | `address.province`                           | Same                                          | Canadian provinces/territories.                                            |
| Postal code                                       | `addressDetails.postal_code`                        | Text                 | `""`                            | Required marker                                     | `address.postal_code`                        | Same                                          |                                                                            |
| Country                                           | `addressDetails.country`                            | Select               | `"Canada"`                      | Required marker                                     | `address.country`                            | Same                                          | Canada, United States, Other.                                              |
| Housing status                                    | `addressDetails.housing_status`                     | Select               | `"Own"`                         | Required marker                                     | `address.housing_status`                     | Same                                          | Own, Rent, Live with family, Employer-provided, Other.                     |
| Years at address                                  | `addressDetails.years_at_address`                   | Text                 | `"3"`                           | Required marker; previous-address prompt if under 3 | `address.years_at_address`                   | Same                                          | Previous addresses are not captured.                                       |
| Months at address                                 | `addressDetails.months_at_address`                  | Text                 | `""`                            | None                                                | `address.months_at_address`                  | Same                                          |                                                                            |
| Monthly housing payment                           | `addressDetails.monthly_housing_payment`            | Text amount          | `""`                            | None                                                | `address.monthly_housing_payment`            | Same                                          | String amount.                                                             |
| Mailing address is the same as current address    | `addressDetails.mailing_same`                       | Checkbox             | `true`                          | None                                                | `address.mailing_same`                       | Same                                          | No alternate mailing address fields.                                       |
| Will this borrower be on title?                   | `participationDetails.on_title`                     | Yes/No               | `""`                            | Warns on No                                         | `participation.on_title`                     | `effective_data.participation.on_title`       | Values `yes`, `no`, empty.                                                 |
| Will this borrower be on the mortgage?            | `participationDetails.on_mortgage`                  | Yes/No               | `""`                            | None                                                | `participation.on_mortgage`                  | Same                                          |                                                                            |
| Will this borrower provide income?                | `participationDetails.provides_income`              | Yes/No               | `""`                            | None                                                | `participation.provides_income`              | Same                                          |                                                                            |
| Will this borrower provide down payment / assets? | `participationDetails.provides_down_payment_assets` | Yes/No               | `""`                            | None                                                | `participation.provides_down_payment_assets` | Same                                          |                                                                            |
| Will this borrower's debts be included?           | `participationDetails.debts_included`               | Yes/No               | `""`                            | None                                                | `participation.debts_included`               | Same                                          |                                                                            |
| Is this borrower occupying the property?          | `participationDetails.occupying_property`           | Yes/No               | `""`                            | None                                                | `participation.occupying_property`           | Same                                          |                                                                            |

## 4. Property Fields

File: `src/routes/applications.$applicationId.property-financing.target-property.tsx`

Save function: `saveSection()`

Restore function: `getBorrowerApplicationSection("property")`

Section key: `property`

| UI label                             | State variable         | Field type      | Default value | Validation currently present | API payload key currently sent | Restore function/key                   | Notes                                                 |
| ------------------------------------ | ---------------------- | --------------- | ------------- | ---------------------------- | ------------------------------ | -------------------------------------- | ----------------------------------------------------- |
| Preferred location city              | `locations[].city`     | Text            | `""`          | At least one city/province   | `locations[].city`             | `effective_data.locations[].city`      | Local UI id is not saved.                             |
| Preferred location province          | `locations[].province` | Select          | `""`          | At least one city/province   | `locations[].province`         | `effective_data.locations[].province`  |                                                       |
| Location priority                    | `locations[].priority` | Text            | `"1"`         | None                         | `locations[].priority`         | `effective_data.locations[].priority`  | Defaults by index on restore fallback.                |
| Property types                       | `types`                | Multi-choice    | `[]`          | Required                     | `property_types`               | `effective_data.property_types`        | Includes Detached, Condo, New Construction, Not sure. |
| How do you plan to use the property? | `usage`                | Choice          | `""`          | Required                     | `property_usage`               | `effective_data.property_usage`        |                                                       |
| Target purchase price                | `target`               | Number input    | `""`          | Required                     | `target_purchase_price`        | `effective_data.target_purchase_price` | Number or null.                                       |
| Expected down payment                | `dpAmount`             | Number input    | `""`          | Required                     | `expected_down_payment`        | `effective_data.expected_down_payment` | Duplicates down-payment total concept.                |
| Expected down payment %              | `dpPct`                | Derived display | `0`           | Derived                      | Not sent                       | Derived                                | Display only.                                         |
| Maximum comfortable monthly payment  | `maxPayment`           | Number input    | `""`          | None                         | `max_monthly_payment`          | `effective_data.max_monthly_payment`   | Number or null.                                       |
| Considering new construction?        | `newBuild`             | Choice          | `""`          | Required                     | `considering_new_build`        | `effective_data.considering_new_build` | String or null.                                       |
| Considering a condo?                 | `condoPref`            | Choice          | `""`          | Required                     | `considering_condo`            | `effective_data.considering_condo`     | String or null.                                       |
| Estimated monthly condo fee          | `condoFee`             | Number input    | `""`          | Conditional                  | `estimated_condo_fee`          | `effective_data.estimated_condo_fee`   | Number or null.                                       |

## 5. Income Fields

File: `src/components/hub/borrower-profile.tsx`

Save function: `saveIncomeSection()`

Restore function: `getBorrowerApplicationSection("income")`

Section key: `income`

Payload root:

- `borrower_id`
- `borrower_name`
- `no_income_declared`
- `income_sources`

| UI label                    | State variable          | Field type            | Default value           | Validation currently present          | API payload key currently sent  | Restore function/key                 | Notes                                                      |
| --------------------------- | ----------------------- | --------------------- | ----------------------- | ------------------------------------- | ------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| I have no income to declare | `noneIncome`            | Checkbox              | `false`                 | None                                  | `no_income_declared`            | `effective_data.no_income_declared`  |                                                            |
| Income source id            | `income[].id`           | Generated/restored id | Seed/restored/generated | None                                  | `income_sources[].id`           | `effective_data.income_sources[].id` | UI id is persisted.                                        |
| Income type                 | `income[].type`         | Derived text          | Selected/seed type      | Required indirectly                   | `income_sources[].type`         | Same                                 | Employment type, business structure, or other income type. |
| Source / employer / payer   | `income[].source`       | Derived text          | `""` or seed source     | Required for employed/self-employed   | `income_sources[].source`       | Same                                 | Other income falls back to type.                           |
| Job title                   | `income[].jobTitle`     | Text                  | `""`                    | None                                  | `income_sources[].jobTitle`     | Same                                 | camelCase key.                                             |
| Start date                  | `income[].startDate`    | Date/text             | `""`                    | None                                  | `income_sources[].startDate`    | Same                                 | camelCase key.                                             |
| Gross income                | `income[].grossIncome`  | Number                | Computed/entered        | Required > 0 in drawer                | `income_sources[].grossIncome`  | Same                                 | camelCase key.                                             |
| Frequency                   | `income[].frequency`    | Select/derived        | `"Annual"`              | Restore constrained to allowed values | `income_sources[].frequency`    | Same                                 | Annual, Monthly, Bi-Weekly, Weekly, Hourly.                |
| Verification                | `income[].verification` | Select/derived        | Drawer default          | None                                  | `income_sources[].verification` | Same                                 |                                                            |
| Include                     | `income[].include`      | Boolean               | `true`                  | None                                  | `income_sources[].include`      | Same                                 | Used in included-income summary.                           |

Detailed income drawer fields currently captured before compaction:

| Drawer area                | UI labels / state variables                                                                                                                                    | Persisted mapping                                                                                                          | Notes                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Category                   | `category` from Employed, Self-Employed, Other Income                                                                                                          | No direct key                                                                                                              | Chooses builder path.                                                          |
| Employed overview          | `employmentType`, `employerName`, `jobTitle`, `industry`, `employmentStatus`, `startDate`, `onLeave`                                                           | `employmentType` -> `type`; `employerName` -> `source`; `jobTitle`; `startDate`; `employmentStatus` affects `verification` | `industry` and `onLeave` are not persisted.                                    |
| Employed income components | `components`, `baseSalary`, `overtimeIncluded`, `overtimeAmount`, `bonusIncluded`, `bonusAmount`, `commissionIncluded`, `commissionAmount`, `commissionTenure` | Amounts roll up to `grossIncome`                                                                                           | Component selections and tenure are not persisted.                             |
| Self-employed overview     | `seType`, `employerName`, `jobTitle`, `industry`, `startDate`, `ownershipPct`, `gstRegistered`, `businessNumber`, `employees`, `businessAddress`               | `seType` -> `type`; `employerName` -> `source`; `jobTitle`; `startDate`                                                    | Most business detail fields are not persisted.                                 |
| Self-employed income       | `seIncomeBasis`, `grossBusiness`, `netIncome`, `twoYearAvg`, `addBacks`, `incomeTrend`, `seVerification`, `accountantName`, `accountantContact`                | `netIncome` -> `grossIncome`; `seVerification` -> `verification`                                                           | Net income is saved under `grossIncome`; accountant details are not persisted. |
| Other income               | `otherType`, `otherSource`, `otherAmount`, `otherFrequency`, `otherStart`, `otherDuration`, `otherContinuance`, `otherVerification`                            | `type`, `source`, `grossIncome`, `frequency`, `startDate`, `verification`                                                  | Duration and continuance are not persisted.                                    |

## 6. Assets / Down Payment Fields

File: `src/routes/applications.$applicationId.property-financing.down-payment.tsx`

Save function: `saveSection()`

Restore function: `getBorrowerApplicationSection("assets_down_payment")`

Section key: `assets_down_payment`

Payload root:

- `total_down_payment`
- `property_value`
- `down_payment_percent`
- `requested_mortgage`
- `source_types`
- `sources`

| UI label                         | State variable                   | Field type               | Default value     | Validation currently present | API payload key currently sent   | Restore function/key                         | Notes                         |
| -------------------------------- | -------------------------------- | ------------------------ | ----------------- | ---------------------------- | -------------------------------- | -------------------------------------------- | ----------------------------- |
| Total down payment amount        | `totalDP`                        | Number input             | `""`              | Required > 0                 | `total_down_payment`             | `effective_data.total_down_payment`          | Number.                       |
| Property value                   | `propertyValue`                  | Restored/derived display | `0`               | None                         | `property_value`                 | `effective_data.property_value`              | Not directly editable here.   |
| Down payment percent             | `dpPct`                          | Derived display          | `0`               | Derived                      | `down_payment_percent`           | Derived                                      | Saved as number.              |
| Requested mortgage               | `requestedMortgage`              | Derived display          | `0`               | Derived                      | `requested_mortgage`             | Derived                                      | Saved as number.              |
| Down payment source types        | `selectedTypes`                  | Multi-choice             | `[]`              | At least one source required | `source_types`                   | `effective_data.source_types` for saved data |                               |
| Source type                      | `sources[].type`                 | Source choice            | New selected type | Indirect                     | `sources[].type`                 | `effective_data.sources[].type`              | Local id removed before save. |
| Amount from this source          | `sources[].amount`               | Text amount              | `""`              | Required > 0                 | `sources[].amount`               | Same                                         | String in source object.      |
| Which borrower owns this source? | `sources[].borrower`             | Text/select-like         | `""`              | None                         | `sources[].borrower`             | Same                                         |                               |
| Source notes                     | `sources[].notes`                | Textarea                 | `""`              | None                         | `sources[].notes`                | Same                                         |                               |
| Account type                     | `sources[].extra.accountType`    | Conditional text/select  | `""`              | Conditional                  | `sources[].extra.accountType`    | Same                                         | Savings/investment source.    |
| Financial institution            | `sources[].extra.fi`             | Conditional text         | `""`              | Conditional                  | `sources[].extra.fi`             | Same                                         | Savings/investment source.    |
| Funds held for 90 days?          | `sources[].extra.held90`         | Conditional yes/no       | `""`              | Conditional                  | `sources[].extra.held90`         | Same                                         | Savings/investment source.    |
| Donor relationship               | `sources[].extra.donorRel`       | Conditional text/select  | `""`              | Conditional                  | `sources[].extra.donorRel`       | Same                                         | Gift source.                  |
| Is it repayable?                 | `sources[].extra.repayable`      | Conditional yes/no       | `""`              | Conditional                  | `sources[].extra.repayable`      | Same                                         | Gift source.                  |
| Donor country                    | `sources[].extra.donorCountry`   | Conditional text/select  | `""`              | Conditional                  | `sources[].extra.donorCountry`   | Same                                         | Gift source.                  |
| Program name                     | `sources[].extra.program`        | Conditional text         | `""`              | Conditional                  | `sources[].extra.program`        | Same                                         | Grant source.                 |
| Approval status                  | `sources[].extra.status`         | Conditional select       | `""`              | Conditional                  | `sources[].extra.status`         | Same                                         | Grant source.                 |
| Incentive type                   | `sources[].extra.incentiveType`  | Conditional text/select  | `""`              | Conditional                  | `sources[].extra.incentiveType`  | Same                                         | Builder/seller incentive.     |
| Disclosed in purchase agreement? | `sources[].extra.disclosed`      | Conditional yes/no       | `""`              | Conditional                  | `sources[].extra.disclosed`      | Same                                         | Builder/seller incentive.     |
| Country                          | `sources[].extra.country`        | Conditional text/select  | `""`              | Conditional                  | `sources[].extra.country`        | Same                                         | Funds outside Canada.         |
| Currency                         | `sources[].extra.currency`       | Conditional text/select  | `""`              | Conditional                  | `sources[].extra.currency`       | Same                                         | Funds outside Canada.         |
| Funds already in Canada?         | `sources[].extra.inCanada`       | Conditional yes/no       | `""`              | Conditional                  | `sources[].extra.inCanada`       | Same                                         | Funds outside Canada.         |
| Lender/source                    | `sources[].extra.lender`         | Conditional text         | `""`              | Conditional                  | `sources[].extra.lender`         | Same                                         | Borrowed funds.               |
| Monthly payment                  | `sources[].extra.monthlyPayment` | Conditional amount       | `""`              | Required for borrowed funds  | `sources[].extra.monthlyPayment` | Same                                         |                               |
| Repayment terms                  | `sources[].extra.terms`          | Conditional text         | `""`              | Conditional                  | `sources[].extra.terms`          | Same                                         | Borrowed funds.               |
| Property address                 | `sources[].extra.propAddress`    | Conditional text         | `""`              | Conditional                  | `sources[].extra.propAddress`    | Same                                         | Sale of existing property.    |
| Expected sale proceeds           | `sources[].extra.proceeds`       | Conditional amount       | `""`              | Conditional                  | `sources[].extra.proceeds`       | Same                                         | Sale of existing property.    |
| Firm sale?                       | `sources[].extra.firm`           | Conditional yes/no       | `""`              | Conditional                  | `sources[].extra.firm`           | Same                                         | Sale of existing property.    |
| Closing date                     | `sources[].extra.closingDate`    | Conditional date         | `""`              | Conditional                  | `sources[].extra.closingDate`    | Same                                         | Sale of existing property.    |

Local-only Assets in `borrower-profile.tsx`:

| UI label                    | State variable                                 | Field type           | Default value          | Validation currently present | API payload key currently sent | Notes                                                 |
| --------------------------- | ---------------------------------------------- | -------------------- | ---------------------- | ---------------------------- | ------------------------------ | ----------------------------------------------------- |
| I have no assets to declare | `noneAssets`                                   | Checkbox             | `false`                | None                         | Not sent                       | Local-only.                                           |
| Asset type                  | `assets[].type`                                | Select               | `"Savings account"`    | None                         | Not sent                       | Duplicates down-payment source concepts.              |
| Institution / name          | `assets[].institution`                         | Text                 | `""`                   | Required                     | Not sent                       | Local-only.                                           |
| Current value               | `assets[].value`                               | Amount               | `""`                   | Required > 0                 | Not sent                       | Local-only.                                           |
| Down payment use            | `assets[].forDownPayment`, `dpMode`, `dpInput` | Radio/amount/percent | `""`, `"amount"`, `""` | Conditional                  | Not sent to section API        | Can populate localStorage `approvu:dp-contributions`. |

## 7. Liabilities Fields

File: `src/components/hub/borrower-profile.tsx`

Save function: `saveLiabilitiesSection()`

Restore function: `getBorrowerApplicationSection("liabilities")`

Section key: `liabilities`

Payload root:

- `borrower_id`
- `borrower_name`
- `no_liabilities_declared`
- `credit_details`
- `liabilities`

| UI label                                  | State variable                                     | Field type         | Default value | Validation currently present              | API payload key currently sent    | Restore function/key                        | Notes                                                                         |
| ----------------------------------------- | -------------------------------------------------- | ------------------ | ------------- | ----------------------------------------- | --------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| I have no liabilities or debts to declare | `noneLiab`                                         | Checkbox           | `false`       | None                                      | `no_liabilities_declared`         | `effective_data.no_liabilities_declared`    |                                                                               |
| What is your current credit score?        | `creditDetails.creditScore`                        | Number input       | `""`          | Warning if outside 300-850                | `credit_details.creditScore`      | `effective_data.credit_details.creditScore` | camelCase key.                                                                |
| Where did you check your credit score?    | `creditDetails.scoreSource`                        | Radio group        | `""`          | None                                      | `credit_details.scoreSource`      | Same                                        | camelCase key.                                                                |
| Consumer Proposal or Bankruptcy?          | `creditDetails.bankruptcy`                         | Yes/No             | `""`          | Conditional fields                        | `credit_details.bankruptcy`       | Same                                        |                                                                               |
| Which one applies?                        | `creditDetails.bankruptcyType`                     | Radio              | `""`          | Conditional                               | `credit_details.bankruptcyType`   | Same                                        | `bankruptcy` or `consumer_proposal`.                                          |
| Is it still active?                       | `creditDetails.bankruptcyActive`                   | Yes/No             | `""`          | Conditional                               | `credit_details.bankruptcyActive` | Same                                        |                                                                               |
| When was it discharged?                   | `creditDetails.dischargedWhen`                     | Radio              | `""`          | Conditional                               | `credit_details.dischargedWhen`   | Same                                        |                                                                               |
| Liability id                              | `visibleLiabilities[].id`                          | Generated/restored | Generated     | None                                      | `liabilities[].id`                | `effective_data.liabilities[].id`           | UI id persists.                                                               |
| Owner id                                  | `visibleLiabilities[].ownerId`                     | Derived            | Applicant id  | None                                      | `liabilities[].ownerId`           | Same                                        | Used for shared debt ownership.                                               |
| Type of debt                              | `type` -> `liabilities[].type`                     | Select             | `""`          | Required                                  | `liabilities[].type`              | Same                                        | Credit Card, LOC, Auto Loan, Student Loan, Payday Loan, Personal Loan, Other. |
| Name of lender                            | `creditor` -> `liabilities[].creditor`             | Text               | `""`          | Required                                  | `liabilities[].creditor`          | Same                                        |                                                                               |
| Outstanding balance                       | `balance` -> `liabilities[].balance`               | Amount             | `""`          | Required, number >= 0                     | `liabilities[].balance`           | Same                                        | Number.                                                                       |
| Monthly payment                           | `monthlyPayment` -> `liabilities[].monthlyPayment` | Amount             | `""`          | Required marker                           | `liabilities[].monthlyPayment`    | Same                                        | Number or 0.                                                                  |
| Shared with another applicant?            | `shared` -> `liabilities[].shared`                 | Checkbox           | `false`       | If shared, requires selected co-applicant | `liabilities[].shared`            | Same                                        |                                                                               |
| Shared co-applicants                      | `sharedWith` -> `liabilities[].sharedWith`         | Checkbox list      | `[]`          | Required when shared                      | `liabilities[].sharedWith`        | Same                                        | Applicant ids.                                                                |
| Payment History / Performance             | `paymentHistory` -> `liabilities[].paymentHistory` | Select             | `""`          | Required                                  | `liabilities[].paymentHistory`    | Same                                        | R1/R2/R3/R4/R5/R7/R8/R9.                                                      |
| Pay off before closing?                   | `payoffPlan` -> `liabilities[].payoffPlan`         | Radio              | `""`          | Required                                  | `liabilities[].payoffPlan`        | Same                                        | `payoff_before_closing`, `leave_open`, `include_in_loan`.                     |

Local-only Other Properties in `borrower-profile.tsx`:

| UI label group            | State variables                                                                                                             | Validation currently present         | API payload key currently sent | Notes       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------ | ----------- |
| No other properties       | `noneProps`                                                                                                                 | None                                 | Not sent                       | Local-only. |
| Property address          | `address`, `city`, `province`, `postalCode`                                                                                 | Address, city, value required        | Not sent                       | Local-only. |
| Ownership details         | `currentOwners`, `plansToSell`, `usage`, `type`, `ownership`, `ownershipTimeframe`, `numberOfUnits`, `include`              | At least one owner                   | Not sent                       | Local-only. |
| Property value and income | `value`, `monthlyRental`, `rentalFrequency`                                                                                 | Value required                       | Not sent                       | Local-only. |
| Carrying costs            | `heating`, `heatingIncludedInCondo`, `propertyTax`, `propertyTaxFrequency`, `condoFee`, `condoFeeFrequency`, `monthlyCosts` | None                                 | Not sent                       | Local-only. |
| Mortgages                 | `mortgageFree`, `mortgages[].position/lender/balance/rate/rateType/termType/maturityDate/payment/paymentFrequency`          | Lender required unless mortgage-free | Not sent                       | Local-only. |

## 8. Documents Fields

File: `src/routes/portal.documents.tsx`

Adapter: `src/lib/api/borrowerDocumentApi.ts`

Backend section key: none.

Endpoints:

- `GET /v2/borrower/documents`
- `GET /v2/borrower/document-requests`
- `POST /v2/borrower/documents`

| UI label                                        | State variable                                                       | Field type      | Default value           | Validation currently present           | API payload key currently sent               | Restore/list key                                                        | Notes                              |
| ----------------------------------------------- | -------------------------------------------------------------------- | --------------- | ----------------------- | -------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| Choose file                                     | `file` or `uploadFile`                                               | File input      | `null`                  | Required; PDF/JPG/JPEG/PNG; size check | `file`                                       | `documents[].original_filename`, `fulfilled_document.original_filename` | Multipart upload.                  |
| Document type                                   | `documentType` or `req.document_type`                                | Select/derived  | `""` for general upload | Required                               | `document_type`                              | `documents[].document_type`, `requests[].document_type`                 | Backend allowlist-aligned options. |
| Notes                                           | `notes` or `uploadNotes`                                             | Textarea        | `""`                    | None                                   | `notes` when non-empty                       | `documents[].notes`, `requests[].notes`                                 |                                    |
| Document request reference                      | `req.public_reference`                                               | Hidden/derived  | Backend value           | Conditional                            | `document_request_public_reference`          | `requests[].public_reference`                                           | Links upload to a request.         |
| Qualification reference                         | Optional adapter payload                                             | Hidden/optional | Not visible             | None                                   | `qualification_public_reference` if supplied | `documents[].qualification_public_reference`                            | Adapter support only.              |
| Request title/description/status                | `req.title`, `req.description`, `req.status`                         | Read-only       | Backend value           | None                                   | Not sent                                     | `requests[]`                                                            | Display only.                      |
| Request required/requested/due/fulfilled fields | `req.required`, `req.requested_at`, `req.due_at`, `req.fulfilled_at` | Read-only       | Backend value           | None                                   | Not sent                                     | `requests[]`                                                            | Display only.                      |

## 9. Consent Fields

File: `src/routes/portal.application.consents.tsx`

Adapter: `src/lib/api/borrowerApplicationConsentsApi.ts`

Backend section key: none.

Endpoints:

- `GET /v2/borrower/application/consents`
- `POST /v2/borrower/application/consents`

Every consent card posts `accepted: true`, `consent_version: "v1"`, and `consent_text` equal to the displayed purpose.

| UI label                         | Consent type / state source | Field type             | Default value | Validation currently present | API payload key currently sent                                | Restore/list key  | Notes                                           |
| -------------------------------- | --------------------------- | ---------------------- | ------------- | ---------------------------- | ------------------------------------------------------------- | ----------------- | ----------------------------------------------- |
| Privacy Consent                  | `privacy`                   | Button acknowledgement | Pending       | Disabled after accepted      | `consent_type`, `accepted`, `consent_version`, `consent_text` | `consents[]`      | Purpose text is displayed and submitted.        |
| Electronic Communication Consent | `electronic_communication`  | Button acknowledgement | Pending       | Disabled after accepted      | Same                                                          | Same              |                                                 |
| Document Collection Consent      | `document_collection`       | Button acknowledgement | Pending       | Disabled after accepted      | Same                                                          | Same              |                                                 |
| Credit Bureau Consent            | `credit_bureau`             | Button acknowledgement | Pending       | Disabled after accepted      | Same                                                          | Same              | Duplicates local hub credit consent concept.    |
| Lender Sharing Consent           | `lender_sharing`            | Button acknowledgement | Pending       | Disabled after accepted      | Same                                                          | Same              |                                                 |
| Application Submission Consent   | `application_submission`    | Button acknowledgement | Pending       | Disabled after accepted      | Same                                                          | Same              |                                                 |
| Consent readiness                | `result.consent_ready`      | Read-only              | Backend value | None                         | Not sent                                                      | `consent_ready`   | Summary display.                                |
| Consent summary                  | `result.consent_summary`    | Read-only              | Backend value | None                         | Not sent                                                      | `consent_summary` | Accepted, required, pending, declined, revoked. |
| Next step                        | `result.next_step`          | Read-only              | Backend value | None                         | Not sent                                                      | `next_step`       | Display only.                                   |

Local-only Review & Consent fields in `borrower-profile.tsx`:

| UI label                                                                                             | State variable       | Field type | Default value | API payload key currently sent | Notes                                 |
| ---------------------------------------------------------------------------------------------------- | -------------------- | ---------- | ------------- | ------------------------------ | ------------------------------------- |
| I confirm the information I provided is accurate to the best of my knowledge.                        | `consents.accuracy`  | Checkbox   | `false`       | Not sent                       | Local-only.                           |
| I understand approvU may use this information to assess mortgage options and prepare my application. | `consents.use`       | Checkbox   | `false`       | Not sent                       | Local-only.                           |
| I understand each applicant must provide their own consent.                                          | `consents.each`      | Checkbox   | `false`       | Not sent                       | Local-only.                           |
| I authorize approvU to use my information for this mortgage application.                             | `consents.authorize` | Checkbox   | `false`       | Not sent                       | Local-only.                           |
| I consent to a credit check for mortgage qualification and application purposes.                     | `consents.credit`    | Checkbox   | `false`       | Not sent                       | Local-only; overlaps `credit_bureau`. |

## 10. Review / Submit Fields

File: `src/routes/portal.application.review-submit.tsx`

Adapter: `src/lib/api/borrowerApplicationSubmissionApi.ts`

Backend section key: none.

Endpoints:

- `GET /v2/borrower/application/submission-readiness`
- `POST /v2/borrower/application/submit`

| UI label                                                                    | State variable                                      | Field type        | Default value | Validation currently present    | API payload key currently sent | Restore/list key                                   | Notes                                    |
| --------------------------------------------------------------------------- | --------------------------------------------------- | ----------------- | ------------- | ------------------------------- | ------------------------------ | -------------------------------------------------- | ---------------------------------------- |
| Application status                                                          | `readiness.status`                                  | Read-only         | Backend value | None                            | Not sent                       | `status`                                           | Display only.                            |
| Application reference                                                       | `readiness.application_public_reference`            | Read-only         | Backend value | None                            | Not sent                       | `application_public_reference`                     | Display only.                            |
| Readiness                                                                   | `ready` derived from `readiness.ready` and blockers | Read-only         | Backend value | Submit disabled unless ready    | Not sent                       | `ready`, `blockers`                                |                                          |
| Blockers                                                                    | `readiness.blockers[]`                              | Read-only cards   | Backend value | Resolve link if route available | Not sent                       | `blockers[].key/label/message/route_hint`          | Route hints normalized locally.          |
| Section summary                                                             | `readiness.sections_summary`                        | Read-only summary | Backend value | None                            | Not sent                       | `sections_summary`                                 | Display only.                            |
| Consent summary                                                             | `readiness.consent_summary`                         | Read-only summary | Backend value | None                            | Not sent                       | `consent_summary`                                  | Display only.                            |
| Document summary                                                            | `readiness.document_summary`                        | Read-only summary | Backend value | None                            | Not sent                       | `document_summary`                                 | Display only.                            |
| I confirm the information provided is accurate to the best of my knowledge. | `confirmed`                                         | Checkbox          | `false`       | Required before submit          | Not sent                       | Not restored                                       | UI-only gate.                            |
| Submit Application                                                          | `submitting`                                        | Button/loading    | `false`       | Requires ready and confirmed    | No body payload                | Submit response                                    | Backend infers application from session. |
| Submitted confirmation                                                      | `submitted.application`                             | Read-only         | Backend value | None                            | Not sent                       | `application.public_reference/status/submitted_at` | Confirmation state.                      |

## 11. Save/Restore Coverage Matrix

| Area                                   | UI captures data? | Save function                                 | Restore function                                       | Backend key / endpoint     | Coverage                    |
| -------------------------------------- | ----------------- | --------------------------------------------- | ------------------------------------------------------ | -------------------------- | --------------------------- |
| Borrower profile personal/contact/role | Yes               | `saveBorrowerProfileSection()`                | `getBorrowerApplicationSection("borrower_profile")`    | `borrower_profile`         | Saved/restored.             |
| Borrower profile address               | Yes               | Same                                          | Same                                                   | `borrower_profile`         | Saved/restored.             |
| Borrower participation                 | Yes               | Same                                          | Same                                                   | `borrower_profile`         | Saved/restored.             |
| Previous address                       | Prompt only       | None                                          | None                                                   | None                       | Not persisted.              |
| Target property                        | Yes               | Target property `saveSection()`               | `getBorrowerApplicationSection("property")`            | `property`                 | Saved/restored.             |
| Income compact source records          | Yes               | `saveIncomeSection()`                         | `getBorrowerApplicationSection("income")`              | `income`                   | Saved/restored.             |
| Detailed income drawer fields          | Yes               | Compacted                                     | Compact restore only                                   | `income`                   | Partially persisted.        |
| Down payment route                     | Yes               | Down-payment `saveSection()`                  | `getBorrowerApplicationSection("assets_down_payment")` | `assets_down_payment`      | Saved/restored.             |
| Profile Assets sub-section             | Yes               | Local state only                              | None                                                   | None                       | Local-only.                 |
| Liabilities and credit details         | Yes               | `saveLiabilitiesSection()`                    | `getBorrowerApplicationSection("liabilities")`         | `liabilities`              | Saved/restored.             |
| Other Properties sub-section           | Yes               | Local state only                              | None                                                   | None                       | Local-only.                 |
| Hub Review & Consent declarations      | Yes               | Local completion only                         | None                                                   | None                       | Local-only.                 |
| Consent capture page                   | Yes               | `submitBorrowerApplicationConsent()`          | `listBorrowerApplicationConsents()`                    | Consent endpoints          | Saved/listed.               |
| Document uploads                       | Yes               | `uploadBorrowerDocument()`                    | `listBorrowerDocuments()`                              | Document endpoints         | Uploaded/listed.            |
| Document requests                      | Yes               | `uploadBorrowerDocument()` with request ref   | `listBorrowerDocumentRequests()`                       | Document request endpoints | Uploaded/listed.            |
| Review submit                          | Yes               | `submitBorrowerApplication()`                 | `getBorrowerApplicationSubmissionReadiness()`          | Submission endpoints       | Submitted/readiness listed. |
| More-information response              | Yes               | `respondToBorrowerApplicationReviewRequest()` | `listBorrowerApplicationReviewRequests()`              | Review request endpoints   | Responded/listed.           |

## 12. Drift / Duplicate Register

| Finding                                                                    | Location                                                  | Impact                                                                                                                                      | Recommended cleanup                                                                |
| -------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Detailed income drawer fields are compacted and not restored individually. | `borrower-profile.tsx`                                    | Industry, leave status, component breakdowns, self-employed business details, accountant details, and continuance data are lost after save. | Decide whether compact income sources are sufficient or expand the section schema. |
| Income and liability nested payloads use camelCase.                        | `income_sources[]`, `credit_details`, `liabilities[]`     | Mixed schema style with snake_case sections.                                                                                                | Normalize in a dedicated schema PR.                                                |
| Self-employed net income saves as `grossIncome`.                           | Income drawer                                             | Semantic drift for downstream use.                                                                                                          | Rename or add explicit self-employed income fields.                                |
| Profile Assets are local-only.                                             | `borrower-profile.tsx`                                    | Borrower-entered assets do not restore from section API.                                                                                    | Persist them or steer borrowers to down-payment route.                             |
| Other Properties are local-only.                                           | `borrower-profile.tsx`                                    | Detailed owned-property data can disappear on reload.                                                                                       | Add a persisted section or mark as deferred.                                       |
| Hub Review & Consent duplicates the API-backed consent page.               | `borrower-profile.tsx` and `/portal/application/consents` | Local consents do not satisfy backend consent readiness.                                                                                    | Make the consent page the source of truth.                                         |
| Credit consent exists twice.                                               | `consents.credit` and `credit_bureau`                     | Confusing duplicate consent state.                                                                                                          | Remove/reword local credit consent.                                                |
| Target property expected down payment duplicates down-payment total.       | Property route and down-payment route                     | Values can diverge.                                                                                                                         | Reconcile or share values through backend effective data.                          |
| Down-payment `propertyValue` is restored but not editable.                 | Down-payment route                                        | Derived calculations show zero until backend provides value.                                                                                | Pull from property section or show a stronger route hint.                          |
| Previous address prompt has no persisted fields.                           | Borrower profile Address                                  | UI suggests required data that cannot be entered/persisted.                                                                                 | Add previous address fields or soften prompt.                                      |
| Seed/mock borrower values remain.                                          | Borrower profile seed income/liabilities/assets           | Demo data can look like real borrower-saved data.                                                                                           | Replace with backend prefill or empty defaults before production.                  |
| Review-submit confirmation is UI-only.                                     | Review-submit route                                       | Confirmation is not posted as a field.                                                                                                      | Confirm backend submit audit is sufficient.                                        |

## 13. Recommended Frontend Cleanup PRs

1. Normalize application section payload naming.
2. Decide whether full income drawer details should be persisted.
3. Persist or remove local-only profile Assets.
4. Persist or explicitly defer Other Properties.
5. Make `/portal/application/consents` the sole borrower consent source of truth.
6. Reconcile target property down payment with assets/down-payment total.
7. Complete previous address collection or remove the incomplete prompt.
8. Replace seed values with backend prefill or empty production-safe defaults.
9. Add automated smoke coverage for save, restore, consent, document, and submit route hints.
