import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  MessageCircle,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "approvU — My Portal" },
      { name: "description", content: "Track your mortgage application, documents, and offers in one place." },
    ],
  }),
  component: Portal,
});

const applications = [
  {
    id: "APP-2041",
    type: "Purchase",
    address: "123 Maple Ave, Toronto, ON",
    status: "In review",
    progress: 60,
    nextStep: "Upload last 2 pay stubs",
    tone: "primary" as const,
  },
  {
    id: "APP-2009",
    type: "Refinance",
    address: "44 Beachview Rd, Hamilton, ON",
    status: "Snapshot complete",
    progress: 25,
    nextStep: "Book a broker call",
    tone: "secondary" as const,
  },
];

const documents = [
  { name: "Government ID", status: "Received" },
  { name: "Proof of income (T4 / NOA)", status: "Pending" },
  { name: "Recent property tax bill", status: "Pending" },
  { name: "Mortgage statement", status: "Received" },
];

const offers = [
  { lender: "Lender A", rate: "4.79%", term: "5-yr fixed", payment: "$2,341 / mo" },
  { lender: "Lender B", rate: "4.84%", term: "5-yr fixed", payment: "$2,358 / mo" },
  { lender: "Lender C", rate: "5.10%", term: "5-yr variable", payment: "$2,432 / mo" },
];

function Portal() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-semibold tracking-tight">approvU</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Home
            </Link>
            <span className="rounded-md bg-primary/10 px-3 py-1.5 font-medium text-primary">
              My Portal
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">
              Welcome back
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              Your mortgage portal
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Track applications, upload documents, and review possible options from lenders — all in one place.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start a new snapshot <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <Stat icon={Home} label="Active applications" value="2" tone="primary" />
          <Stat icon={FileText} label="Documents pending" value="2 of 4" tone="secondary" />
          <Stat icon={Wallet} label="Possible options" value="3" tone="accent" />
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your applications</h2>
            <span className="text-xs text-muted-foreground">Updated just now</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {applications.map((a) => (
              <article
                key={a.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.tone === "primary"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/15 text-secondary"
                    }`}
                  >
                    {a.type}
                  </span>
                  <span className="text-xs text-muted-foreground">#{a.id}</span>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{a.address}</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{a.status}</span>
                    <span>{a.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-foreground">
                  <Clock className="mt-0.5 h-4 w-4 text-secondary" />
                  <span>
                    <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                      Next step
                    </span>
                    {a.nextStep}
                  </span>
                </div>
                <button className="mt-4 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                  View application <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Documents</h2>
              <button className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                <Upload className="mr-1 h-4 w-4" /> Upload
              </button>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {documents.map((d) => (
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

          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Possible options</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sample options based on your latest snapshot. You may qualify for one or more.
            </p>
            <ul className="mt-4 space-y-3">
              {offers.map((o) => (
                <li
                  key={o.lender}
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.lender}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.term} · {o.payment}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                    {o.rate}
                  </span>
                </li>
              ))}
            </ul>
            <button className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Talk to a broker
            </button>
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Information shown is illustrative — it is not a mortgage approval.
        </p>
      </main>
    </div>
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
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
