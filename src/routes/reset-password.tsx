import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell, AuthField, inputCls, primaryBtnCls } from "@/components/auth/auth-shell";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Set a new approvU password" },
      { name: "description", content: "Choose a new password for your approvU account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const errors = {
    password: password.length < 8,
    confirm: confirm !== password,
  };
  const valid = !errors.password && !errors.confirm;
  const tokenMissing = !token;

  return (
    <AuthShell
      eyebrow="Reset password"
      title="Choose a new password"
      description={tokenMissing
        ? "This link is missing a reset token. Request a new password reset email to continue."
        : "Pick a strong password you haven't used before. You'll be signed in automatically once it's saved."}
      footer={
        <>
          <Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
        </>
      }
    >
      {tokenMissing ? (
        <Link to="/forgot-password" className={primaryBtnCls}>Request a new link <ArrowRight className="h-4 w-4" /></Link>
      ) : done ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-mint-foreground" />
          <h2 className="text-base font-semibold text-foreground">Password updated</h2>
          <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
          <button onClick={() => navigate({ to: "/login" })} className={primaryBtnCls}>
            Continue to sign in <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!valid) return;
            setSubmitting(true);
            window.setTimeout(() => { setSubmitting(false); setDone(true); }, 600);
          }}
          className="space-y-4"
        >
          <AuthField label="New password" error={touched && errors.password ? "Use at least 8 characters." : undefined}>
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
          </AuthField>
          <AuthField label="Confirm new password" error={touched && errors.confirm ? "Passwords don't match." : undefined}>
            <input className={inputCls} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Re-enter your new password" />
          </AuthField>
          <button type="submit" disabled={submitting} className={primaryBtnCls}>
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : (<>Update password <ArrowRight className="h-4 w-4" /></>)}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
