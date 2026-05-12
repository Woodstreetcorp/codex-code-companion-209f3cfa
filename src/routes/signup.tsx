import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthShell, AuthField, inputCls, primaryBtnCls } from "@/components/auth/auth-shell";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your approvU account" },
      { name: "description", content: "Create an approvU account to save your snapshot, unlock mortgage offers, and manage your application." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const errors = {
    name: !name.trim(),
    email: !/^\S+@\S+\.\S+$/.test(email),
    password: password.length < 8,
    agree: !agree,
  };
  const valid = !errors.name && !errors.email && !errors.password && !errors.agree;

  return (
    <AuthShell
      eyebrow="Create account"
      title="Save your snapshot and continue"
      description="Create your approvU account in under a minute. We'll email a verification link to confirm it's you."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!valid) return;
          setSubmitting(true);
          window.setTimeout(() => {
            navigate({ to: "/verify-email", search: { email } });
          }, 600);
        }}
        className="space-y-4"
      >
        <AuthField label="Full name" error={touched && errors.name ? "Enter your full name." : undefined}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Alex Borrower" />
        </AuthField>
        <AuthField label="Email address" error={touched && errors.email ? "Enter a valid email." : undefined}>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
        </AuthField>
        <AuthField label="Password" error={touched && errors.password ? "Use at least 8 characters." : undefined}>
          <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
        </AuthField>

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-input" />
          <span>
            I agree to approvU's <a className="font-medium text-primary hover:underline" href="#">Terms</a> and <a className="font-medium text-primary hover:underline" href="#">Privacy Policy</a>.
          </span>
        </label>
        {touched && errors.agree && <p className="-mt-2 text-[11px] text-coral">Please accept the terms to continue.</p>}

        <button type="submit" disabled={submitting} className={primaryBtnCls}>
          {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>) : (<>Create account <ArrowRight className="h-4 w-4" /></>)}
        </button>
        <p className="text-center text-[11px] text-muted-foreground">No hard credit check at this stage.</p>
      </form>
    </AuthShell>
  );
}
