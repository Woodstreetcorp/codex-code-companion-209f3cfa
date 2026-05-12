import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/legal-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — approvU" },
      { name: "description", content: "The terms governing your use of approvU's mortgage qualification, application, and portal services." },
      { property: "og:title", content: "Terms of Use — approvU" },
      { property: "og:description", content: "The terms governing your use of approvU's mortgage services." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Terms of Use"
      effective="May 1, 2026"
      version="2026.05"
      related={[
        { to: "/privacy", label: "Privacy Policy" },
        { to: "/cookies", label: "Cookie Policy" },
      ]}
    >
      <p>
        These Terms of Use ("Terms") govern your access to and use of approvU's websites, borrower
        portal, mortgage qualification tools, and related services (collectively, the "Services").
        By using the Services you agree to be bound by these Terms.
      </p>

      <h2>1. Who we are</h2>
      <p>
        approvU is a licensed mortgage brokerage operating in Canada. Brokerage licensing details
        and the responsible principal broker for your jurisdiction are listed in our regulatory
        disclosures.
      </p>

      <h2>2. Eligibility & accounts</h2>
      <ul>
        <li>You must be the age of majority in your province or territory to use the Services.</li>
        <li>You agree to provide accurate, complete information and to keep it current.</li>
        <li>You are responsible for activity under your account, including credentials and devices.</li>
      </ul>

      <h2>3. Mortgage snapshots & qualification results</h2>
      <p>
        Snapshot results, affordability tools, and pre-qualification certificates are estimates
        based on the information you provide and are <strong>not</strong> a binding mortgage
        approval. Final terms depend on lender underwriting, property appraisal, credit review,
        income verification, and applicable insurer requirements.
      </p>

      <h2>4. Your responsibilities</h2>
      <ul>
        <li>Provide truthful information and supporting documents on request.</li>
        <li>Do not submit information for someone else without their consent.</li>
        <li>Do not attempt to interfere with the Services or access them through automated means.</li>
      </ul>

      <h2>5. Communications & e-signatures</h2>
      <p>
        You consent to receive disclosures, application documents, and notices electronically and
        agree that electronic signatures captured through the Services are legally binding.
      </p>

      <h2>6. Third-party offers</h2>
      <p>
        Lender offers, exclusive partner benefits, and Home Life Bundle products are provided by
        third parties subject to their own terms. We are not responsible for the products or
        services offered by these partners.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The Services, including content, branding, and software, are owned by approvU or our
        licensors and are protected by intellectual-property laws. You may not copy, modify, or
        redistribute them without permission.
      </p>

      <h2>8. Disclaimers & limitation of liability</h2>
      <p>
        The Services are provided on an "as is" and "as available" basis. To the maximum extent
        permitted by law, approvU disclaims all warranties and is not liable for indirect,
        incidental, or consequential damages arising from your use of the Services.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may close your account at any time from the portal. We may suspend or terminate your
        access if you breach these Terms or for compliance, fraud-prevention, or security reasons.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Province of Ontario and the federal laws of
        Canada applicable therein, without regard to conflict-of-laws principles.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes will be communicated through
        the portal and require renewed acceptance.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions? Reach our legal team at{" "}
        <a href="mailto:legal@approvu.ca">legal@approvu.ca</a>.
      </p>
    </LegalShell>
  );
}
