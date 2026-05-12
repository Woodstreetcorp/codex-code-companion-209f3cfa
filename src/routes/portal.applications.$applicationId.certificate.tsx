import { createFileRoute } from "@tanstack/react-router";
import {
  ApplicationShell,
  NotFoundApplication,
  getApplicationSummary,
} from "@/components/portal/application-shell";
import { PreQualifiedCertificateContent } from "@/components/hub/pre-qualified-certificate";

export const Route = createFileRoute("/portal/applications/$applicationId/certificate")({
  head: () => ({
    meta: [
      { title: "Pre-Qualified Certificate — approvU" },
      {
        name: "description",
        content:
          "View, download, and share your approvU pre-qualified certificate with realtors and sellers.",
      },
    ],
  }),
  component: CertificatePage,
});

function CertificatePage() {
  const { applicationId } = Route.useParams();
  const summary = getApplicationSummary(applicationId);
  if (!summary) return <NotFoundApplication id={applicationId} />;
  return (
    <ApplicationShell summary={summary} tab="certificate">
      <PreQualifiedCertificateContent />
    </ApplicationShell>
  );
}
