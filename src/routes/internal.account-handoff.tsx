import { createFileRoute } from "@tanstack/react-router";
import { Mail, Lock, UserCircle2, Sparkles, CheckCircle2 } from "lucide-react";
import { InternalShell } from "@/components/InternalShell";

export const Route = createFileRoute("/internal/account-handoff")({
  head: () => ({
    meta: [
      { title: "approvU — Account Handoff" },
      {
        name: "description",
        content:
          "Create your approvU account to save your snapshot and unlock your personalized mortgage options.",
      },
    ],
  }),
  component: AccountHandoff,
});

function AccountHandoff() {
  return (
    <InternalShell
      eyebrow="Step 3 of 6"
      title="Save your snapshot — create your account"
      description="Your snapshot is ready. Create a free approvU account to securely save your numbers and unlock your personalized mortgage options."
      currentPath="/internal/account-handoff"
      next={{ to: "/internal/mortgage-offers", label: "Continue to options" }}
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Create your account</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Takes less than a minute. No credit check at this step.
          </p>

          <div className="mt-5 space-y-4">
            <Field icon={UserCircle2} label="Full name" placeholder="Alex Borrower" />
            <Field icon={Mail} label="Email" placeholder="you@example.com" type="email" />
            <Field icon={Lock} label="Create a password" placeholder="••••••••" type="password" />

            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input" />
              <span>
                I agree to approvU's terms of use and privacy policy. I understand this is a
                prototype and no real account is created.
              </span>
            </label>

            <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Create account & save snapshot
            </button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or continue with
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
                Google
              </button>
              <button className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
                Apple
              </button>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Why create an account?</h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {[
                "Save and revisit your snapshot anytime",
                "Unlock your tailored Mortgage Offers",
                "Track documents and lender progress",
                "Access your Home Life Offer Bundle",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-mint" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground shadow-sm">
            <p className="font-medium text-foreground">Your snapshot summary</p>
            <dl className="mt-3 space-y-1.5">
              <Row k="Type" v="Refinance" />
              <Row k="Property value" v="$780,000" />
              <Row k="Cash out" v="$60,000" />
              <Row k="Status" v="Workable" />
            </dl>
          </div>
        </aside>
      </div>
    </InternalShell>
  );
}

function Field({
  icon: Icon,
  label,
  placeholder,
  type = "text",
}: {
  icon: typeof Mail;
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        />
      </div>
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt>{k}</dt>
      <dd className="font-medium text-foreground">{v}</dd>
    </div>
  );
}