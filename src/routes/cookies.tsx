import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/legal-shell";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — approvU" },
      { name: "description", content: "How approvU uses cookies and similar technologies, and how you can manage your preferences." },
      { property: "og:title", content: "Cookie Policy — approvU" },
      { property: "og:description", content: "How approvU uses cookies and similar technologies." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Cookie Policy"
      effective="May 1, 2026"
      version="2026.05"
      related={[
        { to: "/terms", label: "Terms of Use" },
        { to: "/privacy", label: "Privacy Policy" },
      ]}
    >
      <p>
        This Cookie Policy explains how approvU uses cookies and similar technologies on our
        websites and within the borrower portal. It should be read alongside our Privacy Policy.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files placed on your device when you visit a website. We also use
        related technologies such as local storage, pixels, and SDKs. We refer to these
        collectively as "cookies" in this Policy.
      </p>

      <h2>2. Categories we use</h2>
      <h3>Strictly necessary</h3>
      <p>
        Required to operate the Services — including authentication, session management,
        load-balancing, and fraud prevention. These cannot be disabled.
      </p>

      <h3>Functional</h3>
      <p>
        Remember your preferences (language, saved scenarios, recently viewed offers) and
        personalize the experience.
      </p>

      <h3>Performance & analytics</h3>
      <p>
        Help us understand how the Services are used so we can improve them. Examples: page-load
        timings, funnel completion rates, error tracking.
      </p>

      <h3>Marketing</h3>
      <p>
        Used to measure the effectiveness of campaigns and present you with relevant content. We
        only set marketing cookies with your consent.
      </p>

      <h2>3. Managing your preferences</h2>
      <p>
        You can manage non-essential cookies any time from the cookie banner or in{" "}
        <strong>Portal → Settings → Communications</strong>. Most browsers also let you block or
        delete cookies through their settings.
      </p>

      <h2>4. Third-party providers</h2>
      <p>
        We use a small number of vetted providers for analytics, error monitoring, identity
        verification, and customer support. Each provider is bound by data-processing agreements
        consistent with our Privacy Policy.
      </p>

      <h2>5. Do Not Track</h2>
      <p>
        Because there is no consistent industry standard for "Do Not Track" signals, we do not
        currently respond to them. You can still control non-essential cookies through the
        controls described above.
      </p>

      <h2>6. Updates</h2>
      <p>
        We may update this Cookie Policy from time to time. The "Effective" date above will
        reflect the latest version.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about cookies? Reach us at{" "}
        <a href="mailto:privacy@approvu.ca">privacy@approvu.ca</a>.
      </p>
    </LegalShell>
  );
}
