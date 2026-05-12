# Application Consent & Disclosure Model

> **Codex note:** Profile-level disclosures (`/portal/disclosures`) are NOT
> sufficient to submit a mortgage application. Application-level disclosures
> and per-applicant consents must be tied to `application_id` and
> `applicant_id`. Codex must not treat `/portal/disclosures` as the only
> consent source — it is the global library only. Application gating lives
> at `/portal/applications/:applicationId/disclosures`.

## Two layers of disclosures

### 1. Profile-level disclosures (`user_disclosures`)

Account-wide policies tied to the user, not to any application:

- Privacy Policy
- Terms of Use
- Electronic Signatures & Records Consent
- Communication Consent (CASL)
- General Data Handling Notice
- Marketing Consent (optional)

Surfaced at `/portal/disclosures` (Profile-Level tab).

### 2. Application-level disclosures (`application_disclosures` + `application_applicant_consents`)

Tied to a specific mortgage application and to each applicant on it:

| Disclosure | Required before |
|---|---|
| Mortgage Brokerage Disclosure (Form 1.1) | Lender submission |
| Conflict of Interest Disclosure | Lender submission |
| Cost of Borrowing Disclosure (FCAC) | Final submission |
| Credit Bureau Consent | Credit pull |
| Lender Submission Consent | Lender submission |
| Product Suitability Acknowledgement | Final submission |
| Selected Mortgage Product Consent | Final submission |
| Co-Applicant Consent | Final submission |
| Application Certification | Final submission |
| Funding Condition Acknowledgements | Funding |

Surfaced at:

- `/portal/applications/:applicationId/disclosures`
- Application Hub snapshot → "Product Review & Consent" widget
- `/portal/disclosures` (Application-Level tab) — cross-listed with the
  application id, transaction type, and property

## Statuses

`Not Started`, `Action Required`, `Reviewed`, `Acknowledged`, `Signed`,
`Waived by Admin`, `Expired`.

`Reviewed`, `Acknowledged`, `Signed`, and `Waived by Admin` are treated as
complete by `rollupReadiness()`.

## Submission gating

An application cannot advance unless:

1. Primary applicant has completed all required consents.
2. Each co-applicant / co-borrower / guarantor has completed their own
   required consents — the primary applicant cannot consent on behalf of
   another adult applicant.
3. Credit consent is signed before any credit pull.
4. Lender submission consent is signed before submission to lender.
5. Product review/consent is completed before Submit Application unlocks.

If any required disclosure is incomplete, the borrower portal shows:

> "Some required disclosures and consents are still outstanding. This
> application cannot be submitted until all required parties complete them."

## Co-applicant flow

If a co-applicant has not joined the portal, the primary applicant can:

- Resend invite
- Send e-sign request
- Upload signed consent manually (admin/manual flow)
- Remove co-applicant
- Continue as single applicant (if eligible)

## Future data model

```
disclosure_templates
  id, disclosure_type, title, category, jurisdiction, version,
  effective_date, body_html, pdf_url, status

user_disclosures
  id, user_id, disclosure_template_id, status, reviewed_at, signed_at,
  ip_address, user_agent, consent_method

application_disclosures
  id, application_id, disclosure_template_id, disclosure_type,
  required_before_stage, status, created_at, updated_at

application_applicant_consents
  id, application_id, applicant_id, disclosure_template_id, consent_type,
  consent_status, consent_method, signed_at, signed_ip,
  signed_user_agent, document_id, verified_by_admin_id, verified_at,
  rejection_reason, expires_at
```

## Admin parity

The same application-level records must be visible in the admin project:

- Application Command Centre → Consents tab
- Documents tab (manually uploaded signed copies)
- Activity Log

Admin actions: view consent status per applicant, see disclosure version,
signed timestamp, IP / user agent, upload manually signed consent, mark
manual consent verified, reject invalid consent, add admin note, resend
consent request.

## Frontend mock data

`src/lib/disclosures.ts` ships templates, profile records, and one mock
application bundle (`APP-2026-00256`). Replace with Cloud-backed queries
against the four tables above when the backend lands.