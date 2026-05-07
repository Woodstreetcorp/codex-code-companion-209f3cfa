import { createFileRoute } from "@tanstack/react-router";
import { FlowRunner } from "@/components/FlowRunner";

export const Route = createFileRoute("/pre-purchase")({
  head: () => ({
    meta: [
      { title: "Mortgage Readiness Check" },
      { name: "description", content: "Find out if you're ready to start house hunting." },
    ],
  }),
  component: () => <FlowRunner flowKey="pre" />,
});