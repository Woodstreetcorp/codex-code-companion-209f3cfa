import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles,
  UserCircle2, KeyRound, RefreshCw, X, Loader2,
} from "lucide-react";
import { InternalShell } from "@/components/InternalShell";

export const Route = createFileRoute("/internal/account-handoff")({
  head: () => ({
    meta: [
      { title: "approvU — Sign in to save your snapshot" },
      {
        name: "description",
        content:
          "Create an account or sign in to securely save your mortgage snapshot and unlock your personalized mortgage offers.",
      },
    ],
  }),
  component: AccountHandoff,
});

// ─── Mock snapshot context ──────────────────────────────────────────────
const SNAPSHOT = {
  txType: "Refinance",
  propertyValue: "$780,000",
  cashOut: "$60,000",
  province: "Ontario",
  status: "Workable",
  path: "Monoline Lender · Best-rate path",
};

type Tab = "create" | "signin";
type Stage = "form" | "verify" | "success";

function AccountHandoff() {
  const [tab, setTab] = useState<Tab>("create");
  const [stage, setStage] = useState<Stage>("form");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <InternalShell
      eyebrow="Step 3 of 6"
      title="Save your snapshot and unlock your mortgage offers"
      description="Create an account or sign in to securely save your mortgage snapshot and continue to your personalized mortgage offers."
      currentPath="/internal/account-handoff"
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Auth card */}
        <section className="lg:col-span-3 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <Tabs tab={tab} onChange={setTab} disabled={stage !== "form"} />
            <div className="p-6">
              {stage === "form" && tab === "create" && (
                <CreateAccountForm
                  submitting={submitting}
                  onSubmit={(e) => {
                    setEmail(e);
                    setSubmitting(true);
                    window.setTimeout(() => {
                      setSubmitting(false);
                      setStage("verify");
                    }, 700);
                  }}
                />
              )}
              {stage === "form" && tab === "signin" && (
                <SignInForm
                  submitting={submitting}
                  onSubmit={(e) => {
                    setEmail(e);
                    setSubmitting(true);
                    window.setTimeout(() => {
                      setSubmitting(false);
                      setStage("verify");
                    }, 700);
                  }}
                />
              )}
              {stage === "verify" && (
                <TwoFactorVerification
                  email={email}
                  onBack={() => setStage("form")}
                  onSuccess={() => setStage("success")}
                />
              )}
              {stage === "success" && <SuccessState />}
            </div>
          </div>

          <SecurityAssuranceCard />
        </section>

        {/* Right column */}
        <aside className="lg:col-span-2 space-y-4">
          <WhyCreateAccountCard />
          <SnapshotSummaryCard />
          <WhatHappensNextCard currentStage={stage} />
        </aside>
      </div>
    </InternalShell>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────
function Tabs({
  tab, onChange, disabled,
}: { tab: Tab; onChange: (t: Tab) => void; disabled: boolean }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "create", label: "Create account" },
    { id: "signin", label: "Sign in" },
  ];
  return (
    <div role="tablist" className="grid grid-cols-2 border-b border-border">
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(t.id)}
            className={`relative px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {active && <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Create account form ────────────────────────────────────────────────
function CreateAccountForm({
  submitting, onSubmit,
}: { submitting: boolean; onSubmit: (email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);

  const strength = passwordStrength(password);
  const errors = {
    name: !name.trim(),
    email: !isValidEmail(email),
    password: password.length < 8,
    agree: !agree,
  };
  const valid = !errors.name && !errors.email && !errors.password && !errors.agree;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) onSubmit(email);
      }}
      className="space-y-4"
    >
      <Field
        icon={UserCircle2}
        label="Full name"
        placeholder="Alex Borrower"
        value={name}
        onChange={setName}
        error={touched && errors.name ? "Please enter your full name." : undefined}
        autoComplete="name"
      />
      <Field
        icon={Mail}
        label="Email address"
        placeholder="you@example.com"
        type="email"
        value={email}
        onChange={setEmail}
        error={touched && errors.email ? "Please enter a valid email." : undefined}
        autoComplete="email"
      />
      <Field
        icon={Lock}
        label="Password"
        placeholder="At least 8 characters"
        type={show ? "text" : "password"}
        value={password}
        onChange={setPassword}
        error={touched && errors.password ? "Use at least 8 characters." : undefined}
        autoComplete="new-password"
        rightSlot={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      {password.length > 0 && <PasswordStrengthBar level={strength} />}

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input"
        />
        <span>
          I agree to approvU's{" "}
          <a className="font-medium text-primary hover:underline" href="#">Terms of Use</a>{" "}
          and{" "}
          <a className="font-medium text-primary hover:underline" href="#">Privacy Policy</a>.
        </span>
      </label>
      {touched && errors.agree && (
        <p className="-mt-2 text-[11px] text-coral">Please accept the terms to continue.</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>) :
          (<>Create account & continue <ArrowRight className="h-4 w-4" /></>)}
      </button>

      <p className="text-center text-[11px] text-muted-foreground">
        Takes less than a minute. No hard credit check at this stage.
      </p>

      <SocialDivider />
      <SocialButtons />
    </form>
  );
}

// ─── Sign in form ───────────────────────────────────────────────────────
function SignInForm({
  submitting, onSubmit,
}: { submitting: boolean; onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);

  const valid = isValidEmail(email) && password.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) onSubmit(email);
      }}
      className="space-y-4"
    >
      <Field
        icon={Mail}
        label="Email address"
        placeholder="you@example.com"
        type="email"
        value={email}
        onChange={setEmail}
        error={touched && !isValidEmail(email) ? "Please enter a valid email." : undefined}
        autoComplete="email"
      />
      <Field
        icon={Lock}
        label="Password"
        placeholder="Your password"
        type={show ? "text" : "password"}
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        rightSlot={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 text-muted-foreground">
          <input type="checkbox" className="h-4 w-4 rounded border-input" />
          Remember me
        </label>
        <a href="#" className="font-medium text-primary hover:underline">Forgot password?</a>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>) :
          (<>Sign in & continue <ArrowRight className="h-4 w-4" /></>)}
      </button>

      <SocialDivider />
      <SocialButtons />
    </form>
  );
}

// ─── 2FA verification ───────────────────────────────────────────────────
function TwoFactorVerification({
  email, onBack, onSuccess,
}: { email: string; onBack: () => void; onSuccess: () => void }) {
  const LENGTH = 6;
  const [code, setCode] = useState<string[]>(Array(LENGTH).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(10 * 60); // 10 minutes
  const [trustDevice, setTrustDevice] = useState(false);

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);
  useEffect(() => {
    if (expiresIn <= 0) return;
    const t = window.setInterval(() => setExpiresIn((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [expiresIn]);

  const locked = attempts >= 5;
  const expired = expiresIn === 0;
  const value = code.join("");
  const complete = value.length === LENGTH;

  const handleChange = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    setError(null);
    if (v && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };
  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!txt) return;
    e.preventDefault();
    const next = Array(LENGTH).fill("");
    for (let i = 0; i < txt.length; i++) next[i] = txt[i];
    setCode(next);
    refs.current[Math.min(txt.length, LENGTH - 1)]?.focus();
  };

  const verify = () => {
    if (locked || expired) return;
    setVerifying(true);
    window.setTimeout(() => {
      setVerifying(false);
      // Mock policy: any 6-digit code accepted, but "000000" is rejected for demo realism.
      if (value === "000000") {
        setAttempts((a) => a + 1);
        setError("Invalid code. Please check and try again.");
        return;
      }
      onSuccess();
    }, 700);
  };

  const resend = () => {
    if (cooldown > 0 || resendCount >= 3) return;
    setResendCount((r) => r + 1);
    setCooldown(30);
    setExpiresIn(10 * 60);
    setError(null);
    setCode(Array(LENGTH).fill(""));
    refs.current[0]?.focus();
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" /> Back to sign in
      </button>

      <div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-lg font-semibold text-foreground">Verify it's you</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          We sent a 6-digit verification code to{" "}
          <span className="font-medium text-foreground">{maskEmail(email)}</span>. Enter it below
          to continue.
        </p>
      </div>

      <div onPaste={handlePaste} className="flex justify-between gap-2">
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            disabled={locked || expired || verifying}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            className="h-12 w-full rounded-lg border border-input bg-background text-center text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-coral/40 bg-coral/5 p-2 text-[11px] text-coral">
          {error}
        </p>
      )}
      {locked && (
        <p className="rounded-lg border border-coral/40 bg-coral/5 p-2 text-[11px] text-coral">
          Too many attempts. Please wait before trying again, or return to sign in.
        </p>
      )}
      {expired && !locked && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900">
          This code has expired. Request a new one.
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Code expires in{" "}
          <span className="font-medium text-foreground">{fmtSeconds(expiresIn)}</span>
        </span>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resendCount >= 3}
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          <RefreshCw className="h-3 w-3" />
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : resendCount >= 3
              ? "Resend limit reached"
              : "Resend code"}
        </button>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground">
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(e) => setTrustDevice(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input"
        />
        <span>
          <span className="font-medium">Trust this device for 30 days.</span>{" "}
          <span className="text-muted-foreground">
            Skip 2-step verification on this browser. Only use on devices you own.
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={verify}
        disabled={!complete || verifying || locked || expired}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {verifying ? (<><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>) :
          (<>Verify & continue <ArrowRight className="h-4 w-4" /></>)}
      </button>

      <p className="text-center text-[11px] text-muted-foreground">
        Prototype: any 6-digit code works (try <code className="rounded bg-muted px-1">123456</code>).
      </p>
    </div>
  );
}

// ─── Success state ──────────────────────────────────────────────────────
function SuccessState() {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) return;
    const t = window.setTimeout(() => setCount((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [count]);
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-mint/20 text-mint-foreground">
        <CheckCircle2 className="h-6 w-6 text-mint" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Account verified</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Your snapshot has been saved to your approvU account. Redirecting you to your mortgage
        offers in {count}s…
      </p>
      <Link
        to="/internal/mortgage-offers"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Continue to mortgage offers <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ─── Right column cards ─────────────────────────────────────────────────
function WhyCreateAccountCard() {
  const items = [
    "Save and revisit your mortgage snapshot anytime",
    "Unlock your personalized Mortgage Offers",
    "Track your mortgage application progress",
    "Upload documents securely",
    "Access your Home Life Bundle after funding",
  ];
  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-accent">
        <Sparkles className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Why create an account?</h3>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-foreground">
        {items.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-mint" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SnapshotSummaryCard() {
  const rows: [string, string][] = [
    ["Transaction", SNAPSHOT.txType],
    ["Property value", SNAPSHOT.propertyValue],
    ["Cash-out", SNAPSHOT.cashOut],
    ["Province", SNAPSHOT.province],
    ["Status", SNAPSHOT.status],
    ["Estimated path", SNAPSHOT.path],
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground">Your snapshot summary</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Pulled from the snapshot you just completed.
      </p>
      <dl className="mt-3 space-y-1.5 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium text-foreground text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WhatHappensNextCard({ currentStage }: { currentStage: Stage }) {
  const steps = useMemo(
    () => [
      { id: "form", label: "Create your account or sign in" },
      { id: "verify", label: "Verify your account securely" },
      { id: "save", label: "Save your mortgage snapshot" },
      { id: "offers", label: "Review your personalized Mortgage Offers" },
    ],
    [],
  );
  const activeIdx =
    currentStage === "form" ? 0 : currentStage === "verify" ? 1 : currentStage === "success" ? 2 : 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground">What happens next</p>
      <ol className="mt-3 space-y-2.5">
        {steps.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <li key={s.id} className="flex items-start gap-3 text-xs">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  done
                    ? "border-mint bg-mint/20 text-mint-foreground"
                    : active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-3 w-3 text-mint" /> : i + 1}
              </span>
              <span className={active ? "font-medium text-foreground" : "text-muted-foreground"}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SecurityAssuranceCard() {
  const items = [
    "Two-factor authentication helps protect your account",
    "Your snapshot and application data are encrypted in transit and at rest",
    "No hard credit check at account creation",
    "You can save your progress and return anytime",
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Built for mortgage-level security</h3>
      </div>
      <ul className="mt-3 grid gap-2 text-xs text-foreground sm:grid-cols-2">
        {items.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-mint" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Field & helpers ────────────────────────────────────────────────────
function Field({
  icon: Icon, label, placeholder, type = "text", value, onChange, error, rightSlot, autoComplete,
}: {
  icon: typeof Mail; label: string; placeholder: string; type?: string;
  value: string; onChange: (v: string) => void; error?: string;
  rightSlot?: React.ReactNode; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div
        className={`mt-1.5 flex items-center gap-2 rounded-md border bg-background px-3 py-2 ${
          error ? "border-coral" : "border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        }`}
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        {rightSlot}
      </div>
      {error && <p className="mt-1 text-[11px] text-coral">{error}</p>}
    </label>
  );
}

function PasswordStrengthBar({ level }: { level: 0 | 1 | 2 | 3 | 4 }) {
  const labels = ["Very weak", "Weak", "Okay", "Strong", "Excellent"];
  const colors = ["bg-coral", "bg-coral/70", "bg-amber-400", "bg-mint", "bg-mint"];
  return (
    <div className="-mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i < level ? colors[level] : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Password strength: {labels[level]}</p>
    </div>
  );
}

function SocialDivider() {
  return (
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or continue with
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        <GoogleIcon /> Google
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        <AppleIcon /> Apple
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.6 12.227c0-.709-.063-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.5h3.227c1.886-1.737 2.986-4.296 2.986-7.341z" fill="#4285F4"/>
      <path d="M12 22c2.7 0 4.964-.895 6.618-2.432l-3.227-2.5c-.895.6-2.04.955-3.391.955-2.605 0-4.81-1.759-5.595-4.123H3.064v2.59A9.997 9.997 0 0 0 12 22z" fill="#34A853"/>
      <path d="M6.405 13.9a5.99 5.99 0 0 1 0-3.8V7.51H3.064a10 10 0 0 0 0 8.98l3.341-2.59z" fill="#FBBC05"/>
      <path d="M12 5.977c1.468 0 2.786.504 3.823 1.495l2.864-2.864C16.96 2.991 14.696 2 12 2 8.094 2 4.71 4.245 3.064 7.51l3.341 2.59C7.19 7.736 9.395 5.977 12 5.977z" fill="#EA4335"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.39 2.21-1.18 3.04-.84.93-2.21 1.65-3.36 1.55-.13-1.11.43-2.27 1.16-3.05.83-.86 2.27-1.5 3.38-1.54zM20.5 17.06c-.55 1.27-.81 1.83-1.51 2.95-.98 1.55-2.36 3.49-4.07 3.5-1.52.02-1.91-.99-3.97-.98-2.07.01-2.49 1-4.01.97-1.71-.03-3.02-1.78-4-3.34C.21 16.42-.13 11.65 1.78 9.1c1.34-1.79 3.45-2.83 5.43-2.83 2.02 0 3.29 1.11 4.96 1.11 1.62 0 2.6-1.11 4.94-1.11 1.77 0 3.65.97 4.99 2.65-4.39 2.41-3.68 8.69-1.6 8.14z"/>
    </svg>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────
function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
function passwordStrength(p: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}
function maskEmail(e: string) {
  if (!e || !e.includes("@")) return "your email";
  const [user, domain] = e.split("@");
  const head = user.slice(0, 2);
  return `${head}${"•".repeat(Math.max(2, user.length - 2))}@${domain}`;
}
function fmtSeconds(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
