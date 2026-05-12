import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, LifeBuoy, MessageSquare, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function BrandedErrorPage({
  code,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            approvU
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">{eyebrow}</p>
          <h1 className="mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-7xl font-bold text-transparent sm:text-8xl">
            {code}
          </h1>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">{description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {primaryAction}
            {secondaryAction}
          </div>

          {children && <div className="mt-8">{children}</div>}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">While you're here</p>
          <p className="mt-1 text-sm font-semibold text-foreground">Common destinations</p>
          <ul className="mt-3 space-y-2 text-sm">
            <ShortcutLink to="/" label="Mortgage Snapshot — start here" />
            <ShortcutLink to="/purchase" label="Purchase Mortgage Snapshot" />
            <ShortcutLink to="/refinance" label="Renew, Refinance, or Access Equity" />
            <ShortcutLink to="/portal" label="Borrower Portal sign in" />
          </ul>

          <div className="mt-5 rounded-xl border border-border bg-background p-4">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <LifeBuoy className="h-3.5 w-3.5 text-primary" /> Need a hand?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Our advisors respond within one business day, Monday to Saturday.
            </p>
            <a
              href="mailto:hello@approvu.ca"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <MessageSquare className="h-3.5 w-3.5" /> hello@approvu.ca <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}

function ShortcutLink({ to, label }: { to: "/" | "/purchase" | "/refinance" | "/portal"; label: string }) {
  return (
    <li>
      <Link
        to={to}
        className="group inline-flex items-center gap-1 text-foreground hover:text-primary"
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
      </Link>
    </li>
  );
}
