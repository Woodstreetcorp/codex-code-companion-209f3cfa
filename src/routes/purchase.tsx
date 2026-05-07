import { createFileRoute } from "@tanstack/react-router";
import { FlowRunner } from "@/components/FlowRunner";

export const Route = createFileRoute("/purchase")({
  head: () => ({
    meta: [
      { title: "Purchase Mortgage Snapshot" },
      { name: "description", content: "See possible mortgage options for your home purchase." },
    ],
  }),
  component: () => <FlowRunner flowKey="purchase" />,
});