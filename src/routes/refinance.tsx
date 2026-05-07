import { createFileRoute } from "@tanstack/react-router";
import { FlowRunner } from "@/components/FlowRunner";

export const Route = createFileRoute("/refinance")({
  head: () => ({
    meta: [
      { title: "Refinance Snapshot" },
      { name: "description", content: "Explore possible refinance options for your property." },
    ],
  }),
  component: () => <FlowRunner flowKey="refinance" />,
});