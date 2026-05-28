import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AuthField, AuthShell, inputCls, primaryBtnCls } from "@/components/auth/auth-shell";
import {
  clearBorrowerSession,
  getBorrowerSession,
  loginBorrower,
  logoutBorrower,
  storeBorrowerSession,
  type BorrowerSessionResult,
} from "@/lib/api/borrowerAuthApi";
import { initializeCsrfCookie } from "@/lib/api/laravelSession";

const searchSchema = z.object({
  redirect: z.string().optional(),
  ref: z.string().optional(),
  email: z.string().optional(),
});

function normalizeRedirect(value?: string): "/portal" | "/portal/offers" {
  return value === "/portal/offers" ? "/portal/offers" : "/portal";
}

export const Route = createFileRoute("/login")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Sign in to approvU" },
      {
        name: "description",
        content:
          "Sign in to your approvU account to continue your mortgage application and access your portal.",
      },
    ],
  }),
  component: LoginPage,
});

function normalizeBorrowerLoginError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("csrf") || lower.includes("token mismatch") || lower.includes("419")) {
    return "Something went wrong with your session. Please refresh the page and try again.";
  }
  if (lower.includes("throttl") || lower.includes("too many")) {
    return "Too many sign-in attempts. Please wait a moment and try again.";
  }
  return message;
}

function LoginPage() {
  const { redirect, ref, email: emailFromSearch } = Route.useSearch();
  const navigate = useNavigate();
  const postLoginRoute = normalizeRedirect(redirect);
  const [email, setEmail] = useState<string>(emailFromSearch ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<BorrowerSessionResult | null>(null);

  useEffect(() => {
    setEmail((current: string) => current || emailFromSearch || "");
  }, [emailFromSearch]);
  useEffect(() => {
    let active = true;

    async function checkExistingBorrowerSession() {
      setCheckingSession(true);
      try {
        const confirmed = await getBorrowerSession();
        if (!active) return;
        storeBorrowerSession(confirmed);
        setSession(confirmed);
        await navigate({ to: postLoginRoute });
      } catch {
        // No active borrower session. Pre-warm the CSRF token now so it is
        // ready before the user submits the login form. Calling this here
        // (sequentially after the failed GET /me response) ensures the CSRF
        // fetch uses the same session cookie established by this request.
        await initializeCsrfCookie();
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    void checkExistingBorrowerSession();

    return () => {
      active = false;
    };
  }, [navigate, postLoginRoute]);

  const validEmail = /^\S+@\S+\.\S+$/.test(email);
  const valid = validEmail && password.length > 0;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    setError(null);

    if (!valid) return;

    setSubmitting(true);
    try {
      const result = await loginBorrower({ email: email.trim(), password, remember });
      storeBorrowerSession(result);
      setSession(result);

      setCheckingSession(true);
      try {
        const confirmed = await getBorrowerSession();
        storeBorrowerSession(confirmed);
        setSession(confirmed);
        await navigate({ to: postLoginRoute });
      } finally {
        setCheckingSession(false);
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? normalizeBorrowerLoginError(failure.message)
          : "We could not sign you in. Please check your email and password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await logoutBorrower();
      clearBorrowerSession();
      setSession(null);
      setPassword("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "We could not sign you out.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession && !session) {
    return (
      <AuthShell
        eyebrow="Session check"
        title="Checking your borrower session"
        description="If you are already signed in, we will take you back to your saved journey."
      >
        <div className="flex min-h-32 flex-col items-center justify-center text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Confirming your session...</p>
        </div>
      </AuthShell>
    );
  }

  if (session?.user) {
    return (
      <AuthShell
        eyebrow="Signed in"
        title={`Welcome back, ${session.user.name}`}
        description="Your borrower session is active. Continue to your portal to see your saved Mortgage Snapshot and next steps."
        footer={
          <SessionReference
            reference={ref ?? session.latest_qualification?.public_reference ?? undefined}
          />
        }
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            {checkingSession ? "Confirming your session..." : `Signed in as ${session.user.email}.`}
          </p>
          <Link
            to={postLoginRoute}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Continue to your borrower dashboard
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={submitting}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          {error && <p className="text-sm text-coral">{error}</p>}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back to approvU"
      description="Sign in to continue from your saved qualification or Mortgage Snapshot."
      footer={
        <>
          New to approvU?{" "}
          <Link
            to="/create-account"
            search={{ ref, email, redirect: postLoginRoute }}
            className="font-semibold text-primary hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {ref && (
        <p className="mb-4 rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-xs text-muted-foreground">
          Continuing with saved reference{" "}
          <span className="font-semibold text-foreground">{ref}</span>.
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          label="Email address"
          error={touched && !validEmail ? "Enter a valid email." : undefined}
        >
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </AuthField>
        <AuthField
          label="Password"
          error={touched && !password ? "Enter your password." : undefined}
        >
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Your password"
          />
        </AuthField>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="rounded-lg border border-coral/30 bg-coral/5 p-3 text-sm text-coral">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={primaryBtnCls}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

function SessionReference({ reference }: { reference?: string }) {
  if (!reference) return null;

  return (
    <span>
      Saved reference <span className="font-semibold text-foreground">{reference}</span>
    </span>
  );
}
