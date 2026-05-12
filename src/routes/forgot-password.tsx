import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell, AuthField, inputCls, primaryBtnCls } from "@/components/auth/auth-shell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your approvU password" },
      { name: "description", content: "Request a password reset link for your approvU account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);
  const valid = /^\S+@\S+\.\S+$/.test(email);

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Reset your password"
      description="Enter the email tied to your approvU account. We'll send a secure link to set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-mint-foreground" />
          <h2 className="text-base font-semibold text-foreground">Check your inbox</h2>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a password reset link. It will expire in 30 minutes.
          </p>
          <button
            type="button"
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!valid) return;
            setSubmitting(true);
            window.setTimeout(() => { setSubmitting(false); setSent(true); }, 600);
          }}
          className="space-y-4"
        >
          <AuthField label="Email address" error={touched && !valid ? "Enter a valid email." : undefined}>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
          </AuthField>
          <button type="submit" disabled={submitting} className={primaryBtnCls}>
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending link…</>) : (<>Send reset link <ArrowRight className="h-4 w-4" /></>)}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            For your security, we don't reveal whether an email is registered.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
