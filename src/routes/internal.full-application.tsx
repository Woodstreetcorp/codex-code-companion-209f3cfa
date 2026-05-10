import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, FileText, ShieldCheck } from "lucide-react";
import { InternalShell } from "@/components/InternalShell";

export const Route = createFileRoute("/internal/full-application")({
  head: () => ({
    meta: [
      { title: "approvU — Full Mortgage Application" },
      {
        name: "description",
        content:
          "Complete your full mortgage application — personal details, employment, property, and disclosures.",
      },
    ],
  }),
  component: FullApplication,
});

const SECTIONS = [
  { name: "Personal details", status: "complete" as const, summary: "Name, DOB, SIN on file" },
  { name: "Contact & address history", status: "complete" as const, summary: "3 years of address history" },
  { name: "Employment & income", status: "in_progress" as const, summary: "Add 2 years of employment" },
  { name: "Assets & liabilities", status: "todo" as const, summary: "Bank accounts, debts, credit cards" },
  { name: "Property details", status: "todo" as const, summary: "Address, value, taxes, insurance" },
  { name: "Disclosures & consent", status: "todo" as const, summary: "Credit pull authorization, signatures" },
];

function FullApplication() {
  return (
    <InternalShell
      eyebrow="Step 6 of 6"
      title="Complete your full application"
      description="A few more details and you're done. Your information is encrypted and reviewed only by your matched lender."
      currentPath="/internal/full-application"
      prev={{ to: "/internal/borrower-dashboard", label: "Back to dashboard" }}
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 space-y-3">
          {SECTIONS.map((s, i) => (
            <article
              key={s.name}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {s.status === "complete" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-mint" />
                ) : s.status === "in_progress" ? (
                  <Circle className="mt-0.5 h-5 w-5 text-secondary" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Section {i + 1}
                  </p>
                  <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">{s.summary}</p>
                </div>
              </div>
              <button
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                  s.status === "complete"
                    ? "border border-input bg-background hover:bg-muted"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {s.status === "complete" ? "Review" : s.status === "in_progress" ? "Continue" : "Start"}
              </button>
            </article>
          ))}

          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Ready to submit?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Once all sections are complete, submit your application to your matched lender for
              underwriting.
            </p>
            <button
              disabled
              className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground opacity-60"
            >
              Submit application (complete all sections)
            </button>
          </div>
        </section>

        <aside className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Your data is protected</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Bank-grade encryption. Shared only with the lender you select. You can request deletion
              anytime.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-secondary">
              <FileText className="h-5 w-5" />
              <h3 className="text-sm font-semibold">What lenders look at</h3>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground">
              <li>• Verified income & employment</li>
              <li>• Credit history & score</li>
              <li>• Down payment / equity source</li>
              <li>• Property appraisal</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Need help?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A licensed approvU broker can walk you through any section.
            </p>
            <button className="mt-3 w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              Talk to a broker
            </button>
          </div>
        </aside>
      </div>
    </InternalShell>
  );
}