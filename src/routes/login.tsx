import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthShell, AuthField, inputCls, primaryBtnCls } from "@/components/auth/auth-shell";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in to approvU" },
      { name: "description", content: "Sign in to your approvU account to continue your mortgage application and access your portal." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const valid = /^\S+@\S+\.\S+$/.test(email) && password.length > 0;

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back to approvU"
      description="Sign in to continue your mortgage application or access your portal."
      footer={
        <>
          New to approvU?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
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
            navigate({ to: (redirect ?? "/portal") as "/portal" });
          }, 500);
        }}
        className="space-y-4"
      >
        <AuthField label="Email address" error={touched && !/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid email." : undefined}>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
        </AuthField>
        <AuthField label="Password">
          <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Your password" />
        </AuthField>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="h-4 w-4 rounded border-input" /> Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">Forgot password?</Link>
        </div>

        <button type="submit" disabled={submitting} className={primaryBtnCls}>
          {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>) : (<>Sign in <ArrowRight className="h-4 w-4" /></>)}
        </button>
      </form>
    </AuthShell>
  );
}
