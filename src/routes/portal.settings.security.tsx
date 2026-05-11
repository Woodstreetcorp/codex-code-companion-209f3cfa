import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Chrome,
  Laptop,
  LogOut,
  Shield,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { SettingPane } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/security")({
  head: () => ({
    meta: [
      { title: "Security — approvU Settings" },
      { name: "description", content: "Password, multi-factor authentication, sessions, and security activity." },
    ],
  }),
  component: SecurityPage,
});

const PWD_RULES = [
  { label: "At least 8 characters", test: (s: string) => s.length >= 8 },
  { label: "One uppercase letter", test: (s: string) => /[A-Z]/.test(s) },
  { label: "One lowercase letter", test: (s: string) => /[a-z]/.test(s) },
  { label: "One number", test: (s: string) => /\d/.test(s) },
  { label: "One symbol", test: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

const SESSIONS = [
  { id: "1", device: "MacBook Pro", browser: "Chrome 124", location: "Toronto, ON", lastActive: "Active now", current: true, icon: Laptop },
  { id: "2", device: "iPhone 15", browser: "Safari 17", location: "Toronto, ON", lastActive: "2 hours ago", current: false, icon: Smartphone },
  { id: "3", device: "Windows PC", browser: "Edge 122", location: "Vancouver, BC", lastActive: "3 days ago", current: false, icon: Chrome },
];

const ACTIVITY = [
  { event: "Successful sign-in", date: "May 11, 2026 · 9:14 AM", device: "MacBook · Chrome", location: "Toronto, ON", status: "ok" as const },
  { event: "Password changed", date: "Apr 18, 2026 · 4:02 PM", device: "MacBook · Chrome", location: "Toronto, ON", status: "ok" as const },
  { event: "MFA enabled", date: "Apr 18, 2026 · 4:00 PM", device: "MacBook · Chrome", location: "Toronto, ON", status: "ok" as const },
  { event: "Failed sign-in attempt", date: "Apr 02, 2026 · 11:32 PM", device: "Unknown · Firefox", location: "Calgary, AB", status: "warn" as const },
];

function SecurityPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [mfaMethod, setMfaMethod] = useState<"sms" | "email" | "app">("sms");

  const passes = PWD_RULES.map((r) => r.test(next));
  const allPass = passes.every(Boolean);
  const matches = next.length > 0 && next === confirm;

  const updatePassword = () => {
    if (!current) return toast.error("Enter your current password");
    if (!allPass) return toast.error("New password doesn't meet requirements");
    if (!matches) return toast.error("Passwords do not match");
    setCurrent(""); setNext(""); setConfirm("");
    toast.success("Password updated successfully");
  };

  return (
    <div className="space-y-6">
      <SettingPane title="Password" desc="Keep your account secure by using a strong password.">
        <div className="grid gap-4 sm:grid-cols-3">
          <PwdField label="Current password" value={current} onChange={setCurrent} />
          <PwdField label="New password" value={next} onChange={setNext} />
          <PwdField label="Confirm new password" value={confirm} onChange={setConfirm} />
        </div>
        <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
          {PWD_RULES.map((r, i) => (
            <li key={r.label} className="flex items-center gap-2 text-xs">
              {passes[i] ? (
                <Check className="h-3.5 w-3.5 text-mint" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={passes[i] ? "text-foreground" : "text-muted-foreground"}>{r.label}</span>
            </li>
          ))}
        </ul>
        {confirm.length > 0 && !matches && (
          <p className="mt-2 text-xs font-medium text-destructive">Passwords do not match.</p>
        )}
        <div className="mt-5 flex justify-end">
          <button
            onClick={updatePassword}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Update password
          </button>
        </div>
      </SettingPane>

      <SettingPane title="Multi-factor authentication" desc="Add an extra layer of protection to your account.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${mfaEnabled ? "bg-mint/15 text-mint" : "bg-muted text-muted-foreground"}`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{mfaEnabled ? "MFA is enabled" : "MFA is disabled"}</p>
              <p className="text-xs text-muted-foreground">
                {mfaEnabled ? `Current method: ${mfaLabel(mfaMethod)} · Last verified May 09, 2026` : "Turn on MFA to better protect your account."}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setMfaEnabled(!mfaEnabled); toast.success(mfaEnabled ? "MFA disabled" : "MFA enabled"); }}
            className={`rounded-md px-3.5 py-2 text-sm font-medium ${mfaEnabled ? "border border-border bg-card text-foreground hover:bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
          >
            {mfaEnabled ? "Disable MFA" : "Enable MFA"}
          </button>
        </div>
        {mfaEnabled && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MfaOption icon={Smartphone} label="SMS verification" sub="Code sent to your phone" active={mfaMethod === "sms"} onClick={() => setMfaMethod("sms")} />
            <MfaOption icon={ShieldCheck} label="Email verification" sub="Code sent to your email" active={mfaMethod === "email"} onClick={() => setMfaMethod("email")} />
            <MfaOption icon={Shield} label="Authenticator app" sub="Coming soon" active={false} disabled onClick={() => {}} />
          </div>
        )}
      </SettingPane>

      <SettingPane title="Active sessions" desc="Devices currently signed in to your account.">
        <div className="space-y-2">
          {SESSIONS.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {s.device}
                    {s.current && (
                      <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mint">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.browser} · {s.location} · {s.lastActive}</p>
                </div>
              </div>
              {!s.current && (
                <button
                  onClick={() => toast.success(`Signed out of ${s.device}`)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => toast.success("Signed out of all other devices")}
            className="rounded-md border border-destructive/40 bg-card px-3.5 py-2 text-sm font-medium text-destructive hover:bg-destructive/5"
          >
            Sign out of all other devices
          </button>
        </div>
      </SettingPane>

      <SettingPane title="Security activity" desc="Recent security events on your account.">
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Device</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Location</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ACTIVITY.map((a, i) => (
                <tr key={i} className="bg-card">
                  <td className="px-3 py-2.5 font-medium text-foreground">{a.event}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.date}</td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell">{a.device}</td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">{a.location}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${a.status === "ok" ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"}`}>
                      {a.status === "ok" ? "Successful" : "Blocked"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingPane>
    </div>
  );
}

function PwdField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}

function MfaOption({
  icon: Icon,
  label,
  sub,
  active,
  disabled,
  onClick,
}: {
  icon: typeof Shield;
  label: string;
  sub: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition disabled:opacity-50 ${active ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted"}`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </button>
  );
}

function mfaLabel(m: "sms" | "email" | "app") {
  return m === "sms" ? "SMS verification" : m === "email" ? "Email verification" : "Authenticator app";
}