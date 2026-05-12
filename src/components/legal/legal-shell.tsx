import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function LegalShell({
  eyebrow,
  title,
  effective,
  version,
  children,
  related,
}: {
  eyebrow: string;
  title: string;
  effective: string;
  version: string;
  children: ReactNode;
  related: { to: "/terms" | "/privacy" | "/cookies"; label: string }[];
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Effective {effective} · Version {version}
        </p>

        <article className="prose prose-sm mt-8 max-w-none text-foreground prose-headings:text-foreground prose-headings:font-semibold prose-h2:mt-8 prose-h2:text-lg prose-h3:text-base prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary">
          {children}
        </article>

        <div className="mt-12 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Related legal documents</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.to}>
                <Link
                  to={r.to}
                  className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary"
                >
                  {r.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/portal/disclosures"
                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary"
              >
                Regulatory disclosures
              </Link>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Questions about these documents? Email{" "}
            <a className="font-medium text-primary hover:underline" href="mailto:legal@approvu.ca">legal@approvu.ca</a>.
          </p>
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} approvU. Mortgage brokerage operating in Canada.</span>
          <span className="flex gap-3">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
