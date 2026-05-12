import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/legal-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — approvU" },
      { name: "description", content: "How approvU collects, uses, shares, and protects your personal information across our mortgage services." },
      { property: "og:title", content: "Privacy Policy — approvU" },
      { property: "og:description", content: "How approvU handles your personal information." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Privacy Policy"
      effective="May 1, 2026"
      version="2026.05"
      related={[
        { to: "/terms", label: "Terms of Use" },
        { to: "/cookies", label: "Cookie Policy" },
      ]}
    >
      <p>
        approvU is committed to protecting your privacy. This Policy describes how we collect,
        use, disclose, and safeguard personal information in connection with our mortgage
        qualification, application, and portal services. We comply with the Personal Information
        Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy laws.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Identification:</strong> name, date of birth, government ID, contact details.</li>
        <li><strong>Financial:</strong> income, assets, debts, credit information, banking details.</li>
        <li><strong>Property:</strong> address, value, mortgage details for purchase, refinance, or renewal.</li>
        <li><strong>Employment:</strong> employer, role, tenure, and verification documents.</li>
        <li><strong>Co-borrower information:</strong> data shared with their consent.</li>
        <li><strong>Technical:</strong> device, IP address, usage analytics, and audit logs.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To assess mortgage qualification and present lender options.</li>
        <li>To submit applications to lenders and insurers and manage funding.</li>
        <li>To verify identity, prevent fraud, and meet regulatory obligations (FINTRAC, FCAC, provincial regulators).</li>
        <li>To service your account, send notifications, and improve our products.</li>
      </ul>

      <h2>3. Consent</h2>
      <p>
        We collect your express consent for credit checks, lender submissions, and the sharing of
        documents with third parties such as lawyers and appraisers. You may withdraw consent
        subject to legal and contractual restrictions.
      </p>

      <h2>4. Sharing your information</h2>
      <p>We share information with:</p>
      <ul>
        <li>Lenders, insurers, and underwriters considering your application.</li>
        <li>Service providers (identity verification, document storage, e-signature, analytics).</li>
        <li>Real estate professionals and lawyers when you request introductions.</li>
        <li>Regulators, law enforcement, and courts when legally required.</li>
      </ul>

      <h2>5. International transfers</h2>
      <p>
        Some service providers process information outside Canada. When this occurs, your
        information may be subject to the laws of those jurisdictions. We require safeguards
        consistent with Canadian privacy standards.
      </p>

      <h2>6. Retention</h2>
      <p>
        We retain personal information for as long as needed to provide the Services and to
        comply with legal, regulatory, and audit obligations — typically a minimum of seven (7)
        years from the end of the broker–client relationship.
      </p>

      <h2>7. Your rights</h2>
      <ul>
        <li>Access and correct your personal information from the portal.</li>
        <li>Request a copy of your file or withdraw consent where permitted.</li>
        <li>File a complaint with our Privacy Officer or with the Office of the Privacy Commissioner of Canada.</li>
      </ul>

      <h2>8. Security</h2>
      <p>
        We use encryption in transit and at rest, role-based access controls, and continuous
        monitoring. No system is perfectly secure — please notify us promptly of any suspected
        unauthorized access.
      </p>

      <h2>9. Privacy Officer</h2>
      <p>
        approvU Privacy Officer · <a href="mailto:privacy@approvu.ca">privacy@approvu.ca</a>
      </p>

      <h2>10. Changes</h2>
      <p>
        We will post updates to this Policy and notify you of material changes through the portal.
      </p>
    </LegalShell>
  );
}
