export type ProductMatchStatus =
  | "not_ready"
  | "missing_information"
  | "advisor_review"
  | "options_being_prepared"
  | "options_ready_placeholder"
  | "lender_review_placeholder";

export type ProductMatchCta = {
  label: string;
  route: string;
};

export type ProductMatchStatusCopy = {
  badge: string;
  headline: string;
  body: string;
  primaryCta: ProductMatchCta | null;
  secondaryCta: ProductMatchCta | null;
};

type ProductMatchStatusCopyOverrides = Partial<
  Omit<ProductMatchStatusCopy, "primaryCta" | "secondaryCta">
> & {
  primaryCta?: ProductMatchCta | null;
  secondaryCta?: ProductMatchCta | null;
};

export const PRODUCT_MATCH_CTA_LABELS = {
  continueApplication: "Continue Application",
  applicationWorkspace: "Application Workspace",
  reviewRequestedItems: "Review Requested Items",
  viewApplicationStatus: "View Application Status",
  viewDocuments: "View Documents",
  viewReviewStatus: "View Review Status",
  viewNextSteps: "View Next Steps",
  viewLenderReviewStatus: "View Lender Review Status",
} as const;

export const PRODUCT_MATCH_DISCLAIMER =
  "These are not approvals. Final terms depend on lender review.";

// Guardrail: do not introduce approval, guarantee, final rate, best-rate, lender-name,
// product-card, match-score, or selected-product language into borrower-facing copy here.
const PRODUCT_MATCH_STATUS_COPY: Record<ProductMatchStatus, ProductMatchStatusCopy> = {
  not_ready: {
    badge: "Not ready",
    headline: "Product matching will begin after advisor review.",
    body: "Complete your application, documents, and consents first. Potential mortgage paths are not shown until your file is ready for approvU review.",
    primaryCta: {
      label: PRODUCT_MATCH_CTA_LABELS.continueApplication,
      route: "/portal/application",
    },
    secondaryCta: { label: PRODUCT_MATCH_CTA_LABELS.viewDocuments, route: "/portal/documents" },
  },
  missing_information: {
    badge: "Information needed",
    headline: "More information is needed before matching can continue.",
    body: "The approvU team needs a few updates before potential mortgage paths can be assessed.",
    primaryCta: {
      label: PRODUCT_MATCH_CTA_LABELS.reviewRequestedItems,
      route: "/portal/application",
    },
    secondaryCta: { label: PRODUCT_MATCH_CTA_LABELS.viewDocuments, route: "/portal/documents" },
  },
  advisor_review: {
    badge: "Advisor review",
    headline: "Your application is being reviewed.",
    body: "The approvU team is reviewing your application details before preparing any product options. Your advisor will confirm next steps.",
    primaryCta: {
      label: PRODUCT_MATCH_CTA_LABELS.viewApplicationStatus,
      route: "/portal/application/review-submit",
    },
    secondaryCta: { label: PRODUCT_MATCH_CTA_LABELS.viewDocuments, route: "/portal/documents" },
  },
  options_being_prepared: {
    badge: "Preparing options",
    headline: "Potential mortgage paths are being assessed.",
    body: "Your advisor is reviewing possible options. These are not approvals, and final terms depend on lender review.",
    primaryCta: {
      label: PRODUCT_MATCH_CTA_LABELS.viewReviewStatus,
      route: "/portal/application/review-submit",
    },
    secondaryCta: null,
  },
  options_ready_placeholder: {
    badge: "Advisor reviewed",
    headline: "Advisor-reviewed next steps are being prepared.",
    body: "Potential mortgage paths may be discussed with your advisor. These are not approvals, and final terms depend on lender review.",
    primaryCta: {
      label: PRODUCT_MATCH_CTA_LABELS.viewNextSteps,
      route: "/portal/application/review-submit",
    },
    secondaryCta: { label: PRODUCT_MATCH_CTA_LABELS.viewDocuments, route: "/portal/documents" },
  },
  lender_review_placeholder: {
    badge: "Lender review",
    headline: "Your file is in lender review status.",
    body: "Final terms depend on lender review. Your advisor will confirm next steps as updates become available.",
    primaryCta: {
      label: PRODUCT_MATCH_CTA_LABELS.viewLenderReviewStatus,
      route: "/portal/application/review-submit",
    },
    secondaryCta: { label: PRODUCT_MATCH_CTA_LABELS.viewDocuments, route: "/portal/documents" },
  },
};

export function getProductMatchStatusCopy(
  status: ProductMatchStatus,
  overrides: ProductMatchStatusCopyOverrides = {},
): ProductMatchStatusCopy {
  return {
    ...PRODUCT_MATCH_STATUS_COPY[status],
    ...overrides,
  };
}

export function getProductMatchDisclaimer(): string {
  return PRODUCT_MATCH_DISCLAIMER;
}
