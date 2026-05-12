import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Chrome,
  Copy,
  Download,
  Fingerprint,
  KeyRound,
  Laptop,
  LogOut,
  RefreshCw,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
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

const TRUSTED_DEVICES = [
  { id: "TD-1", name: "MacBook Pro · Chrome", added: "Apr 18, 2026", lastUsed: "Active now" },
  { id: "TD-2", name: "iPhone 15 · Safari", added: "Apr 18, 2026", lastUsed: "2 hours ago" },
];

const RECOVERY_SAMPLE = [
  "h7QX-2P9F-LNRA", "K3WB-EJ8M-2DHC", "U2VP-7C4X-MLQR", "B6JK-3NEX-WPYZ",
  "T9RP-AM2K-CXLB", "F4HD-8VN3-EKQU", "M2BC-WLEK-7YJX", "V6PA-9QHM-RBSC",
];

function SecurityPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [mfaMethod, setMfaMethod] = useState<"sms" | "email" | "totp" | "webauthn">("totp");
  const [showCodes, setShowCodes] = useState(false);
  const [trusted, setTrusted] = useState(TRUSTED_DEVICES);

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
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">New sign-in attempt from Calgary, AB</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Blocked by MFA on May 09 · Firefox · IP 203.0.113.x</p>
          </div>
        </div>
        <Link to="/portal/settings/security/activity" className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
          Review access log
        </Link>
      </div>

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

      <SettingPane title="Multi-factor authentication" desc="Add an extra layer of protection. We recommend an authenticator app or a passkey.">
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MfaOption icon={KeyRound} label="Authenticator app (TOTP)" sub="Recommended · Google Authenticator, 1Password, Authy" active={mfaMethod === "totp"} onClick={() => { setMfaMethod("totp"); toast.success("Authenticator app set as primary MFA"); }} />
            <MfaOption icon={Fingerprint} label="Passkey / Security key" sub="WebAuthn · Touch ID, Face ID, YubiKey" active={mfaMethod === "webauthn"} onClick={() => { setMfaMethod("webauthn"); toast.success("Passkey enrollment started"); }} />
            <MfaOption icon={Smartphone} label="SMS verification" sub="Backup · Code sent to your phone" active={mfaMethod === "sms"} onClick={() => setMfaMethod("sms")} />
            <MfaOption icon={ShieldCheck} label="Email verification" sub="Backup · Code sent to your email" active={mfaMethod === "email"} onClick={() => setMfaMethod("email")} />
          </div>
        )}
      </SettingPane>

      <SettingPane title="Recovery codes" desc="One-time use codes to sign in if you lose access to your MFA device. Store them in a password manager.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            8 of 8 codes remaining · Generated <span className="font-medium text-foreground">Apr 18, 2026</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCodes((v) => !v)}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {showCodes ? "Hide codes" : "View codes"}
            </button>
            <button
              onClick={() => { toast.success("New recovery codes generated. Old codes are now invalid."); }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
            <button
              onClick={() => toast.success("Recovery codes downloaded as PDF")}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </div>
        </div>
        {showCodes && (
          <div className="mt-4 grid gap-2 rounded-xl border border-border bg-background p-4 sm:grid-cols-4">
            {RECOVERY_SAMPLE.map((code) => (
              <div key={code} className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 font-mono text-xs">
                <span>{code}</span>
                <button
                  onClick={() => { navigator.clipboard?.writeText(code); toast.success("Code copied"); }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Copy"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SettingPane>

      <SettingPane title="Trusted devices" desc="Skip MFA prompts on devices you've marked as trusted. Revoke at any time.">
        <div className="space-y-2">
          {trusted.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mint/15 text-mint">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">Trusted on {d.added} · {d.lastUsed}</p>
                </div>
              </div>
              <button
                onClick={() => { setTrusted((p) => p.filter((x) => x.id !== d.id)); toast.success(`${d.name} removed from trusted devices`); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-card px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Revoke trust
              </button>
            </div>
          ))}
          {trusted.length === 0 && (
            <p className="rounded-lg border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
              No trusted devices. You'll be prompted for MFA on every sign-in.
            </p>
          )}
        </div>
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

      <SettingPane title="Security activity" desc="Every sign-in, document share, and consent change is logged.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">View the full audit trail with IP addresses, devices, and locations.</p>
          <Link
            to="/portal/settings/security/activity"
            className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open access log
          </Link>
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

function mfaLabel(m: "sms" | "email" | "totp" | "webauthn") {
  return m === "sms"
    ? "SMS verification"
    : m === "email"
      ? "Email verification"
      : m === "totp"
        ? "Authenticator app"
        : "Passkey / WebAuthn";
}