import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Card } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/home/")({
  head: () => ({
    meta: [
      { title: "Homeowner Hub — approvU" },
      {
        name: "description",
        content:
          "Post-closing resources, renewal reminders, and homeowner tools — unlocks after your mortgage funds.",
      },
    ],
  }),
  component: HomeownerHubPage,
});

const STEPS = [
  "Snapshot",
  "Application",
  "Submitted",
  "Advisor review",
  "Lender decision",
  "Funded",
  "Hub active",
];

function HomeownerHubPage() {
  return (
    <div className="space-y-6">
      {/* Locked state hero */}
      <Card className="bg-gradient-to-br from-muted/60 via-card to-muted/30">
        <div className="flex flex-col items-center gap-4 py-6 text-center sm:py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Homeowner Hub</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Your Homeowner Hub unlocks after your mortgage is funded and closed.
            </p>
          </div>
          <p className="max-w-lg text-sm text-muted-foreground">
            This hub will organize your post-closing resources, Home Life offers, renewal reminders,
            and homeowner tools — available after your first mortgage closes with approvU.
          </p>
        </div>
      </Card>

      {/* Progress path */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Your path to the Homeowner Hub
        </h2>
        <div className="flex flex-wrap items-center gap-1">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  step === "Hub active"
                    ? "bg-muted text-muted-foreground ring-1 ring-border"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step === "Hub active" && <Lock className="h-3 w-3" />}
                {step === "Funded" && <CheckCircle2 className="h-3 w-3 opacity-40" />}
                {step}
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/portal/applications"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue your application <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/portal"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Start Mortgage Snapshot
        </Link>
      </div>
    </div>
  );
}
