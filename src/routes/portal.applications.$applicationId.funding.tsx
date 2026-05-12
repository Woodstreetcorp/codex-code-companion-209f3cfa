import { createFileRoute } from "@tanstack/react-router";
import {
  ApplicationShell,
  NotFoundApplication,
  getApplicationSummary,
} from "@/components/portal/application-shell";
import { FundingConditionsContent } from "@/components/hub/funding-conditions";

export const Route = createFileRoute("/portal/applications/$applicationId/funding")({
  head: () => ({
    meta: [
      { title: "Funding & Closing — approvU" },
      {
        name: "description",
        content:
          "Track every funding condition, document, and milestone between approval and closing day.",
      },
    ],
  }),
  component: FundingPage,
});

function FundingPage() {
  const { applicationId } = Route.useParams();
  const summary = getApplicationSummary(applicationId);
  if (!summary) return <NotFoundApplication id={applicationId} />;

  // Funding & closing only meaningfully unlocks once the application is past
  // approval. Active / Expired files see the locked state explaining what to
  // expect.
  const unlocked = summary.bucket === "Submitted" || summary.bucket === "Completed";

  return (
    <ApplicationShell summary={summary} tab="funding">
      <FundingConditionsContent unlocked={unlocked} />
    </ApplicationShell>
  );
}