import type { ReactNode } from "react";
import type { Home } from "lucide-react";

export function SettingPane({
  title,
  desc,
  children,
  onSave,
  saved,
}: {
  title: string;
  desc: string;
  children: ReactNode;
  onSave?: () => void;
  saved?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="mt-6">{children}</div>
      {onSave && (
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          {saved && <span className="text-xs font-medium text-mint">✓ Saved</span>}
          <button
            onClick={onSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  disabled = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: typeof Home;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div
        className={`mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-primary ${disabled ? "opacity-60" : ""}`}
      >
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground outline-none disabled:cursor-not-allowed"
        />
      </div>
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  icon?: typeof Home;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div
        className={`mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-primary ${disabled ? "opacity-60" : ""}`}
      >
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-foreground outline-none disabled:cursor-not-allowed"
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
    </label>
  );
}

export function Row({ title, desc, action }: { title: string; desc: string; action: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {action}
    </div>
  );
}

export function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition ${checked ? "left-[18px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

export function useSavedFlag() {
  // Tiny helper kept simple; real save handled in route components.
}
