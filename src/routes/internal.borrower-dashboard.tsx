import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  FileText,
  Gift,
  Home,
  MessageCircle,
  Upload,
  Wallet,
} from "lucide-react";
import { InternalShell } from "@/components/InternalShell";

export const Route = createFileRoute("/internal/borrower-dashboard")({
  head: () => ({
    meta: [
      { title: "approvU — Borrower Dashboard" },
      {
        name: "description",
        content: "Track your selected mortgage, documents, and next steps in your borrower dashboard.",
      },
    ],
  }),
  component: BorrowerDashboard,
});

const TASKS = [
  { name: "Government ID", status: "Received" },
  { name: "Proof of income (T4 / NOA)", status: "Pending" },
  { name: "Recent property tax bill", status: "Pending" },
  { name: "Mortgage statement", status: "Received" },
  { name: "Void cheque / direct deposit", status: "Pending" },
];

function BorrowerDashboard() {
  return (
    <InternalShell
      eyebrow="Step 5 of 6"
      title="Welcome to your borrower dashboard"
      description="Track your selected option, complete required tasks, and prepare for your full application."
      currentPath="/internal/borrower-dashboard"
      prev={{ to: "/internal/mortgage-offers", label: "Back to options" }}
      next={{ to: "/internal/full-application", label: "Start full application" }}
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Home} label="Selected option" value="Lender A · 4.79%" tone="primary" />
        <Stat icon={FileText} label="Tasks remaining" value="3 of 5" tone="secondary" />
        <Stat icon={Wallet} label="Est. monthly payment" value="$2,341" tone="accent" />
      </section>

      <section className="mt-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Your selected mortgage
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              Lender A — 5-yr fixed @ 4.79%
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Rate held until Aug 12, 2026 · $480,000 mortgage on 123 Maple Ave
            </p>
          </div>
          <Link
            to="/internal/full-application"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue to full application
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Documents & tasks</h2>
            <button className="inline-flex items-center text-sm font-medium text-primary hover:underline">
              <Upload className="mr-1 h-4 w-4" /> Upload
            </button>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {TASKS.map((d) => (
              <li key={d.name} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-3 text-sm text-foreground">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {d.name}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.status === "Received"
                      ? "bg-mint/20 text-foreground"
                      : "bg-yellow/30 text-foreground"
                  }`}
                >
                  {d.status === "Received" && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-secondary">
              <Clock className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Next step</h3>
            </div>
            <p className="mt-2 text-sm text-foreground">
              Upload your last 2 pay stubs and most recent NOA to keep your application moving.
            </p>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <Gift className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Home Life Offer Bundle</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your bundle is reserved. Eligible perks unlock once your application is submitted.
            </p>
            <button className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
              View my offers
            </button>
          </div>

          <button className="inline-flex w-full items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90">
            <MessageCircle className="mr-1.5 h-4 w-4" /> Talk to a broker
          </button>
        </aside>
      </section>
    </InternalShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Home;
  label: string;
  value: string;
  tone: "primary" | "secondary" | "accent";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    accent: "bg-accent/15 text-accent",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}