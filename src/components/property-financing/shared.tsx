import { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Inbox,
  Lock,
  Save,
  Sparkles,
} from "lucide-react";

export type TxType = "Purchase" | "Pre-Purchase" | "Refinance" | "Renewal";

export const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

export function txBadgeClass(tx: TxType) {
  switch (tx) {
    case "Purchase":
      return "bg-secondary/15 text-secondary";
    case "Pre-Purchase":
      return "bg-mint/20 text-mint-foreground";
    case "Refinance":
      return "bg-primary/15 text-primary";
    case "Renewal":
      return "bg-coral/15 text-coral";
  }
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20 pb-32">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}

export function PageHeader({
  applicationId,
  title,
  subtitle,
  tx,
  progress,
  saveStatus = "saved",
}: {
  applicationId: string;
  title: string;
  subtitle: string;
  tx: TxType;
  progress: number;
  saveStatus?: "saved" | "unsaved" | "saving";
}) {
  const saveLabel =
    saveStatus === "saved"
      ? "All changes saved"
      : saveStatus === "saving"
        ? "Saving…"
        : "Unsaved changes";
  const saveColor =
    saveStatus === "saved"
      ? "text-mint-foreground"
      : saveStatus === "saving"
        ? "text-muted-foreground"
        : "text-coral";

  return (
    <header className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <Link
        to="/internal/full-application"
        search={{ section: "mortgage-application" }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Application Hub
      </Link>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${txBadgeClass(
                tx,
              )}`}
            >
              <Sparkles className="h-3 w-3" /> {tx}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              Application #{applicationId}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 font-medium ${saveColor}`}>
              <CircleCheck className="h-3.5 w-3.5" /> {saveLabel}
            </span>
          </div>
          <div className="w-full sm:w-44">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  progress === 100 ? "bg-mint" : "bg-secondary"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function FormCard({
  step,
  title,
  description,
  children,
  done,
}: {
  step?: number | string;
  title: string;
  description?: string;
  children: ReactNode;
  done?: boolean;
}) {
  return (
    <section className="mb-5 rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          {step !== undefined && (
            <span
              className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                done
                  ? "bg-mint text-mint-foreground"
                  : "bg-secondary/15 text-secondary"
              }`}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : step}
            </span>
          )}
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-coral">*</span>}
      </span>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-coral">{error}</p>}
    </label>
  );
}

export function ChoiceGrid<T extends string>({
  value,
  onChange,
  options,
  cols = 2,
  multi,
  values,
  onMultiChange,
}: {
  value?: T;
  onChange?: (v: T) => void;
  options: readonly { value: T; label: string; description?: string }[];
  cols?: 1 | 2 | 3 | 4;
  multi?: boolean;
  values?: T[];
  onMultiChange?: (vs: T[]) => void;
}) {
  const colsCls = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 md:grid-cols-4" }[cols];
  const isSel = (v: T) => (multi ? values?.includes(v) : value === v);
  const toggle = (v: T) => {
    if (multi) {
      const set = new Set(values ?? []);
      set.has(v) ? set.delete(v) : set.add(v);
      onMultiChange?.(Array.from(set));
    } else {
      onChange?.(v);
    }
  };
  return (
    <div className={`grid grid-cols-1 gap-2 ${colsCls}`}>
      {options.map((opt) => {
        const selected = isSel(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
              selected
                ? "border-primary bg-primary/5 text-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/40"
            }`}
          >
            <span className="block font-medium">{opt.label}</span>
            {opt.description && (
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {opt.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function InfoNote({
  variant = "info",
  children,
}: {
  variant?: "info" | "warning" | "success";
  children: ReactNode;
}) {
  const styles =
    variant === "warning"
      ? "border-coral/30 bg-coral/5 text-foreground"
      : variant === "success"
        ? "border-mint/40 bg-mint/10 text-foreground"
        : "border-secondary/30 bg-secondary/5 text-foreground";
  return (
    <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${styles}`}>
      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function MissingFieldsPanel({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-coral/30 bg-coral/5 p-4">
      <p className="text-sm font-semibold text-foreground">
        Before you can mark this section complete:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/80">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export function SaveAndContinueBar({
  applicationId,
  canComplete,
  onSaveDraft,
  onSaveContinue,
  onMarkComplete,
  nextLabel = "Save & Continue",
}: {
  applicationId: string;
  canComplete: boolean;
  onSaveDraft?: () => void;
  onSaveContinue?: () => void;
  onMarkComplete?: () => void;
  nextLabel?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <button
          onClick={() =>
            navigate({
              to: "/internal/full-application",
              search: { section: "mortgage-application" },
            })
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Back to application hub"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Hub
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={onSaveDraft ?? onSaveContinue}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Save draft and stay on this page"
          >
            <Save className="h-3.5 w-3.5" /> Save Draft
          </button>
          {canComplete && (
            <button
              onClick={onMarkComplete ?? onSaveContinue}
              className="inline-flex items-center gap-1.5 rounded-md bg-mint px-3 py-2 text-xs font-semibold text-mint-foreground hover:bg-mint/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
            </button>
          )}
          <button
            onClick={onSaveContinue}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {nextLabel} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="sr-only">App {applicationId}</div>
    </div>
  );
}

export function CompletionSummaryPanel({
  total,
  done,
}: {
  total: number;
  done: number;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Section completion</span>
        <span className="text-foreground">
          {done} of {total} groups · {pct}%
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${pct === 100 ? "bg-mint" : "bg-secondary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "0"}
        className={`${inputCls} ${prefix ? "pl-7" : ""} ${suffix ? "pr-10" : ""}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

export const PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

export function fmtMoney(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

// ─── Shared status surfaces ────────────────────────────────────────────
export function LockedState({
  title,
  reason,
  unlocksWhen,
  action,
}: {
  title: string;
  reason?: string;
  unlocksWhen?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      {reason && <p className="mt-1 text-xs text-muted-foreground">{reason}</p>}
      {unlocksWhen && (
        <p className="mt-2 inline-block rounded-full bg-background px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Unlocks {unlocksWhen}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center">
      <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15 text-secondary">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      {body && <p className="mt-1 text-xs text-muted-foreground">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function SuccessState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-mint/30 bg-mint/10 p-6 text-center">
      <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-mint">
        <CheckCircle2 className="h-5 w-5 text-mint-foreground" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      {body && <p className="mt-1 text-xs text-muted-foreground">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function SaveStatusBadge({ status }: { status: "saved" | "saving" | "unsaved" }) {
  const cfg = {
    saved: { label: "All changes saved", cls: "text-mint-foreground" },
    saving: { label: "Saving…", cls: "text-muted-foreground" },
    unsaved: { label: "Unsaved changes", cls: "text-coral" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.cls}`}>
      <CircleCheck className="h-3.5 w-3.5" /> {cfg.label}
    </span>
  );
}