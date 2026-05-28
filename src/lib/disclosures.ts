// Shared disclosure + consent data model and mock library used by the borrower
// portal (global + application-specific). Profile-level disclosures are tied to
// the user account; application-level disclosures are tied to a specific
// mortgage application and the applicants on it.

export type DisclosureCategory =
  | "Privacy"
  | "Brokerage"
  | "Cost of Borrowing"
  | "Conflicts"
  | "Suitability"
  | "Regulatory"
  | "Communication"
  | "Marketing"
  | "Credit"
  | "Lender Submission"
  | "Product"
  | "Co-Applicant"
  | "Certification"
  | "Funding";

export type DisclosureScope = "profile" | "application";

export type ConsentStatus =
  | "Not Started"
  | "Action Required"
  | "Reviewed"
  | "Acknowledged"
  | "Signed"
  | "Waived by Admin"
  | "Expired";

export type RequiredBeforeStage =
  | "credit_pull"
  | "lender_submission"
  | "final_submission"
  | "funding"
  | "none";

export type AppliesTo = "primary_applicant" | "co_applicant" | "all_applicants" | "application";

export type DisclosureTemplate = {
  id: string;
  disclosureType: string;
  title: string;
  category: DisclosureCategory;
  jurisdiction: string;
  version: string;
  effective: string;
  pdfUrl?: string;
  whyRequired?: string;
  scope: DisclosureScope;
};

export type ProfileDisclosureRecord = {
  templateId: string;
  status: ConsentStatus;
  reviewedAt?: string;
  signedAt?: string;
  ip?: string;
  userAgent?: string;
  consentMethod?: "electronic" | "manual_upload" | "in_person";
};

export type ApplicantConsentRecord = {
  applicantId: string;
  applicantName: string;
  role: "primary" | "co_applicant" | "guarantor";
  status: ConsentStatus;
  signedAt?: string;
  signedIp?: string;
  consentMethod?: "electronic" | "manual_upload" | "in_person";
  expiresAt?: string;
};

export type ApplicationDisclosureRecord = {
  templateId: string;
  appliesTo: AppliesTo;
  requiredBeforeStage: RequiredBeforeStage;
  status: ConsentStatus; // overall (rolled up across applicants)
  applicantConsents: ApplicantConsentRecord[];
};

export type ApplicationDisclosureBundle = {
  applicationId: string;
  property: string;
  transactionType: "Purchase" | "Refinance" | "Renewal" | "Pre-Purchase";
  applicants: { id: string; name: string; role: ApplicantConsentRecord["role"] }[];
  disclosures: ApplicationDisclosureRecord[];
};

// ---------- Profile-level templates ----------
export const PROFILE_TEMPLATES: DisclosureTemplate[] = [
  {
    id: "TPL-PRIV-1",
    disclosureType: "privacy_policy",
    title: "approvU Privacy Policy",
    category: "Privacy",
    jurisdiction: "Canada (PIPEDA / Quebec Law 25)",
    version: "v3.2",
    effective: "Jan 15, 2026",
    scope: "profile",
    whyRequired: "How we collect, use, store and share your personal information.",
  },
  {
    id: "TPL-TOU-1",
    disclosureType: "terms_of_use",
    title: "Terms of Use",
    category: "Regulatory",
    jurisdiction: "Canada",
    version: "v2.0",
    effective: "Jan 15, 2026",
    scope: "profile",
    whyRequired: "Rules and obligations for using the approvU platform.",
  },
  {
    id: "TPL-ESIGN-1",
    disclosureType: "electronic_signatures",
    title: "Electronic Signatures & Records Consent",
    category: "Regulatory",
    jurisdiction: "PIPEDA · Provincial e-signature acts",
    version: "v2.1",
    effective: "Jan 12, 2025",
    scope: "profile",
    whyRequired: "You agree to transact and receive records electronically.",
  },
  {
    id: "TPL-COMM-1",
    disclosureType: "communication_consent",
    title: "Communication Consent",
    category: "Communication",
    jurisdiction: "CASL",
    version: "v1.3",
    effective: "Mar 1, 2026",
    scope: "profile",
    whyRequired: "Lets approvU send you transactional messages by email, SMS and push.",
  },
  {
    id: "TPL-DATA-1",
    disclosureType: "data_handling",
    title: "General Data Handling Notice",
    category: "Privacy",
    jurisdiction: "Canada",
    version: "v1.1",
    effective: "Feb 12, 2026",
    scope: "profile",
    whyRequired: "Summary of how data is stored, retained, and deleted.",
  },
  {
    id: "TPL-MKT-1",
    disclosureType: "marketing_consent",
    title: "Marketing Consent (optional)",
    category: "Marketing",
    jurisdiction: "CASL",
    version: "v1.0",
    effective: "Apr 1, 2026",
    scope: "profile",
    whyRequired: "Optional — receive offers, partner promotions, and product updates.",
  },
];

// ---------- Application-level templates ----------
export const APPLICATION_TEMPLATES: DisclosureTemplate[] = [
  {
    id: "TPL-BROK-1",
    disclosureType: "mortgage_brokerage_disclosure",
    title: "Mortgage Brokerage Disclosure (Form 1.1)",
    category: "Brokerage",
    jurisdiction: "Ontario · FSRA",
    version: "v2024.1",
    effective: "Jul 1, 2024",
    scope: "application",
    whyRequired: "Discloses our brokerage relationship, services and compensation.",
  },
  {
    id: "TPL-CONF-1",
    disclosureType: "conflict_of_interest",
    title: "Conflict of Interest Disclosure",
    category: "Conflicts",
    jurisdiction: "All provinces",
    version: "v1.4",
    effective: "Mar 10, 2026",
    scope: "application",
    whyRequired: "Lender referral fees, volume bonuses, and other potential conflicts.",
  },
  {
    id: "TPL-COB-1",
    disclosureType: "cost_of_borrowing",
    title: "Cost of Borrowing Disclosure (FCAC)",
    category: "Cost of Borrowing",
    jurisdiction: "Federally regulated",
    version: "v2026.1",
    effective: "Feb 1, 2026",
    scope: "application",
    whyRequired: "APR, total cost of credit, and prepayment terms for your selected product.",
  },
  {
    id: "TPL-CREDIT-1",
    disclosureType: "credit_bureau_consent",
    title: "Credit Bureau Consent",
    category: "Credit",
    jurisdiction: "PIPEDA",
    version: "v2.0",
    effective: "Feb 14, 2026",
    scope: "application",
    whyRequired: "Required before approvU pulls your credit report from Equifax / TransUnion.",
  },
  {
    id: "TPL-LENDER-1",
    disclosureType: "lender_submission_consent",
    title: "Lender Submission Consent",
    category: "Lender Submission",
    jurisdiction: "All provinces",
    version: "v1.2",
    effective: "Mar 5, 2026",
    scope: "application",
    whyRequired: "Authorizes approvU to submit your application package to selected lenders.",
  },
  {
    id: "TPL-SUIT-1",
    disclosureType: "product_suitability",
    title: "Product Suitability Acknowledgement",
    category: "Suitability",
    jurisdiction: "Ontario · FSRA",
    version: "v1.0",
    effective: "Apr 1, 2026",
    scope: "application",
    whyRequired: "Confirms the recommended mortgage product is suitable for your situation.",
  },
  {
    id: "TPL-PROD-1",
    disclosureType: "selected_mortgage_product_consent",
    title: "Selected Mortgage Product Consent",
    category: "Product",
    jurisdiction: "All provinces",
    version: "v1.0",
    effective: "Apr 1, 2026",
    scope: "application",
    whyRequired: "Confirms the specific lender, rate, and term you've chosen.",
  },
  {
    id: "TPL-COAPP-1",
    disclosureType: "co_applicant_consent",
    title: "Co-Applicant Consent",
    category: "Co-Applicant",
    jurisdiction: "All provinces",
    version: "v1.1",
    effective: "Feb 1, 2026",
    scope: "application",
    whyRequired: "Each co-applicant or guarantor must individually authorize this application.",
  },
  {
    id: "TPL-CERT-1",
    disclosureType: "application_certification",
    title: "Application Certification",
    category: "Certification",
    jurisdiction: "All provinces",
    version: "v1.0",
    effective: "Mar 1, 2026",
    scope: "application",
    whyRequired: "Signed certification that the information you provided is accurate.",
  },
  {
    id: "TPL-FUND-1",
    disclosureType: "funding_condition_acknowledgement",
    title: "Funding Condition Acknowledgements",
    category: "Funding",
    jurisdiction: "All provinces",
    version: "v1.0",
    effective: "Apr 1, 2026",
    scope: "application",
    whyRequired: "Acknowledges any final funding conditions imposed by the lender.",
  },
];

export const ALL_TEMPLATES: DisclosureTemplate[] = [...PROFILE_TEMPLATES, ...APPLICATION_TEMPLATES];

export function templateById(id: string): DisclosureTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

// ---------- Profile records (populated from live API — no static data) ----------
export const PROFILE_RECORDS: ProfileDisclosureRecord[] = [];

// ---------- Application bundles (populated from live API — no static data) ----------
export const APPLICATION_BUNDLES: ApplicationDisclosureBundle[] = [];

export function getApplicationBundle(id: string): ApplicationDisclosureBundle | undefined {
  return APPLICATION_BUNDLES.find((b) => b.applicationId === id);
}

// ---------- Readiness rollup ----------
export type Readiness = {
  ready: boolean;
  blockingCount: number;
  items: { label: string; ok: boolean; status: ConsentStatus; templateId: string }[];
};

const COMPLETE: ConsentStatus[] = ["Reviewed", "Acknowledged", "Signed", "Waived by Admin"];

export function isComplete(s: ConsentStatus): boolean {
  return COMPLETE.includes(s);
}

export function rollupReadiness(bundle: ApplicationDisclosureBundle): Readiness {
  const items = bundle.disclosures.map((d) => {
    const tpl = templateById(d.templateId);
    const allOk = d.applicantConsents.every((a) => isComplete(a.status));
    return {
      label: tpl?.title ?? d.templateId,
      ok: allOk,
      status: d.status,
      templateId: d.templateId,
    };
  });
  const blocking = items.filter((i) => !i.ok).length;
  return { ready: blocking === 0, blockingCount: blocking, items };
}

export function statusTone(status: ConsentStatus): string {
  switch (status) {
    case "Signed":
    case "Acknowledged":
    case "Reviewed":
      return "bg-mint/15 text-mint";
    case "Action Required":
      return "bg-amber-500/15 text-amber-600";
    case "Not Started":
      return "bg-muted text-muted-foreground";
    case "Waived by Admin":
      return "bg-secondary/15 text-secondary";
    case "Expired":
      return "bg-destructive/15 text-destructive";
  }
}

export function stageLabel(stage: RequiredBeforeStage): string {
  switch (stage) {
    case "credit_pull":
      return "Credit pull";
    case "lender_submission":
      return "Lender submission";
    case "final_submission":
      return "Final submission";
    case "funding":
      return "Funding";
    case "none":
      return "—";
  }
}

export function appliesToLabel(a: AppliesTo): string {
  switch (a) {
    case "primary_applicant":
      return "Primary applicant";
    case "co_applicant":
      return "Co-applicant";
    case "all_applicants":
      return "All applicants";
    case "application":
      return "Application";
  }
}
