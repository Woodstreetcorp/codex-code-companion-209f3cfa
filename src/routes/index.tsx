import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Home, Search, RefreshCw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "approvU — Mortgage Snapshot" },
      {
        name: "description",
        content:
          "approvU's guided mortgage qualification experience. Purchase, readiness, and refinance snapshots.",
      },
    ],
  }),
  component: Index,
});

const flows = [
  {
    to: "/purchase" as const,
    icon: Home,
    title: "Purchase Mortgage Snapshot",
    desc: "Have an offer or actively shopping? See possible mortgage options for your purchase.",
    tone: "primary" as const,
  },
  {
    to: "/pre-purchase" as const,
    icon: Search,
    title: "Mortgage Readiness Check",
    desc: "Thinking about buying soon? See where you stand before you start shopping.",
    tone: "secondary" as const,
  },
  {
    to: "/refinance" as const,
    icon: RefreshCw,
    title: "Refinance Snapshot",
    desc: "Already own? Explore refinance options or possible cash-out scenarios.",
    tone: "accent" as const,
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-semibold tracking-tight">approvU</span>
          </div>
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
            Mortgage Snapshot
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-secondary">
            A conversational mortgage experience
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            See what you{" "}
            <span className="text-primary">may qualify</span> for —
            one question at a time.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Answer a few short questions. We'll show you a personalized snapshot of
            possible mortgage options and next steps. No accounts. No credit checks.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flows.map(({ to, icon: Icon, title, desc, tone }) => (
            <Link
              key={to}
              to={to}
              className="group relative flex flex-col rounded-2xl border-2 border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-secondary hover:shadow-lg"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  tone === "primary"
                    ? "bg-primary/10 text-primary"
                    : tone === "secondary"
                      ? "bg-secondary/15 text-secondary"
                      : "bg-accent/15 text-accent"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{desc}</p>
              <span className="mt-5 inline-flex items-center text-sm font-medium text-primary">
                Start <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 grid gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3 sm:p-8">
          <Trust title="Safe wording" body="We use language like 'may qualify' and 'possible options' — never approval promises." />
          <Trust title="One step at a time" body="Clean, focused questions with real progress so you always know where you are." />
          <Trust title="Built for clarity" body="Designed for borrowers and brokers — modern, mobile-friendly, and trustworthy." />
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} approvU · Information helps us understand your situation — not a mortgage approval.
      </footer>
    </div>
  );
}

function Trust({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
