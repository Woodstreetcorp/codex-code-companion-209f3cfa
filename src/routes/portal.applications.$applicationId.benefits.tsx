import { createFileRoute } from "@tanstack/react-router";
import {
  ApplicationShell,
  NotFoundApplication,
  getApplicationSummary,
} from "@/components/portal/application-shell";
import { ExclusiveOffersContent } from "@/components/hub/exclusive-offers";

export const Route = createFileRoute("/portal/applications/$applicationId/benefits")({
  head: () => ({
    meta: [
      { title: "Exclusive Benefits & Partner Offers — approvU" },
      {
        name: "description",
        content:
          "Activate the Home Life Bundle: exclusive partner offers and benefits unlocked with your mortgage.",
      },
    ],
  }),
  component: BenefitsPage,
});

function BenefitsPage() {
  const { applicationId } = Route.useParams();
  const summary = getApplicationSummary(applicationId);
  if (!summary) return <NotFoundApplication id={applicationId} />;

  // Map application bucket → funding stage gating used by ExclusiveOffersContent
  const fundingStage =
    summary.bucket === "Completed"
      ? "funded"
      : summary.bucket === "Submitted"
      ? "approved"
      : "in_application";

  return (
    <ApplicationShell summary={summary} tab="benefits">
      <ExclusiveOffersContent fundingStage={fundingStage} />
    </ApplicationShell>
  );
}
