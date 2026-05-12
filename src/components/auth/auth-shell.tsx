import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </span>
          approvU
        </Link>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-1 text-xl font-semibold text-foreground">{title}</h1>
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="p-6">{children}</div>
        </div>
        {footer && (
          <div className="mt-4 text-center text-xs text-muted-foreground">{footer}</div>
        )}
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Protected by bank-grade encryption · approvU is a Lovable Cloud-ready experience.
        </p>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[11px] text-coral">{error}</p>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export const primaryBtnCls =
  "inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60";
