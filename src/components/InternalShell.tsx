import { Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

const STEPS = [
  { to: "/internal/account-handoff", label: "Account Handoff", step: 3 },
  { to: "/internal/mortgage-options", label: "Mortgage Options", step: 4 },
  { to: "/internal/borrower-dashboard", label: "Borrower Dashboard", step: 5 },
  { to: "/internal/full-application", label: "Full Application", step: 6 },
] as const;

export function InternalShell({
  eyebrow,
  title,
  description,
  currentPath,
  prev,
  next,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  currentPath: (typeof STEPS)[number]["to"];
  prev?: { to: string; label: string };
  next?: { to: string; label: string };
  children: ReactNode;
}) {
  const currentIdx = STEPS.findIndex((s) => s.to === currentPath);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-semibold tracking-tight">approvU</span>
          </Link>
          <span className="rounded-md bg-accent/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            Internal Prototype
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Journey progress */}
        <ol className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-6">
          {[
            { label: "Qualification", step: 1 },
            { label: "Snapshot", step: 2 },
            ...STEPS.map((s) => ({ label: s.label, step: s.step })),
          ].map((s) => {
            const active = s.step === STEPS[currentIdx]?.step;
            const done = s.step < (STEPS[currentIdx]?.step ?? 0);
            return (
              <li
                key={s.label}
                className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : done
                      ? "border-mint bg-mint/15 text-foreground"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span className="block text-[10px] uppercase tracking-widest opacity-70">
                  Step {s.step}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="mt-10">{children}</div>

        <nav className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          {prev ? (
            <Link
              to={prev.to as "/"}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> {prev.label}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={next.to as "/"}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {next.label} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Internal prototype — illustrative only. Not a mortgage approval.
        </p>
      </main>
    </div>
  );
}