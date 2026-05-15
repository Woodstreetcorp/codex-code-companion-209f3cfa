import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AuthField, AuthShell, inputCls, primaryBtnCls } from "@/components/auth/auth-shell";
import {
  createBorrowerAccountHandoff,
  getSavedQualificationReference,
  storeAccountHandoffResult,
  type BorrowerAccountHandoffResult,
} from "@/lib/api/borrowerAccountHandoffApi";

const searchSchema = z.object({
  ref: z.string().optional(),
  email: z.string().optional(),
});

export const Route = createFileRoute("/create-account")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Create your approvU account" },
      {
        name: "description",
        content: "Create an approvU account to save your Mortgage Snapshot and continue later.",
      },
    ],
  }),
  component: CreateAccountPage,
});

function CreateAccountPage() {
  const { ref, email: emailFromSearch } = Route.useSearch();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState<string>(emailFromSearch ?? "");
  const [reference, setReference] = useState<string>(ref ?? "");
  const [qualificationSessionToken, setQualificationSessionToken] = useState<string | undefined>();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BorrowerAccountHandoffResult | null>(null);

  useEffect(() => {
    const saved = getSavedQualificationReference();
    setReference((current: string) => (ref ?? current) || saved?.public_reference || "");
    setQualificationSessionToken(saved?.qualification_session_token);
  }, [ref]);

  useEffect(() => {
    setEmail((current: string) => current || emailFromSearch || "");
  }, [emailFromSearch]);

  const errors = useMemo(
    () => ({
      firstName: !firstName.trim(),
      lastName: !lastName.trim(),
      email: !/^\S+@\S+\.\S+$/.test(email),
      reference: !reference.trim() && !qualificationSessionToken,
      password: password.length < 8,
      passwordConfirmation: !passwordConfirmation || passwordConfirmation !== password,
      consent: !consent,
    }),
    [
      firstName,
      lastName,
      email,
      reference,
      qualificationSessionToken,
      password,
      passwordConfirmation,
      consent,
    ],
  );
  const valid = !Object.values(errors).some(Boolean);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    setError(null);
    setResult(null);

    if (!valid) return;

    setSubmitting(true);
    const trimmedReference = reference.trim();
    const referenceIsPublic = trimmedReference.toUpperCase().startsWith("QS-");

    try {
      const response = await createBorrowerAccountHandoff({
        qualification_session_token: referenceIsPublic
          ? qualificationSessionToken
          : qualificationSessionToken || trimmedReference,
        public_reference: referenceIsPublic ? trimmedReference : undefined,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        consent_to_create_account: consent,
      });
      storeAccountHandoffResult(response);
      setResult(response);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "We could not create your account right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.status === "account_created") {
    return (
      <AuthShell
        eyebrow="Account created"
        title="Your approvU account is ready"
        description={
          result.message ?? "Your account has been created. You can continue your mortgage journey."
        }
        footer={<ReferenceLine reference={result.public_reference ?? reference} />}
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            You can now sign in with the email and password you created.
          </p>
          <Link
            to="/login"
            search={{ email, ref: result.public_reference ?? reference }}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Sign in to continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (result?.status === "existing_user_login_required") {
    return (
      <AuthShell
        eyebrow="Sign in required"
        title="This email already has an account"
        description={
          result.message ?? "An account already exists for this email. Please sign in to continue."
        }
        footer={<ReferenceLine reference={result.public_reference ?? reference} />}
      >
        <Link
          to="/login"
          search={{ email, ref: result.public_reference ?? reference }}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Sign in to continue
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Save and continue"
      title="Create your approvU account"
      description="Save your Mortgage Snapshot and continue your application later."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ email, ref: reference }}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <AuthField
            label="First name"
            error={touched && errors.firstName ? "Enter your first name." : undefined}
          >
            <input
              className={inputCls}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              placeholder="Jane"
            />
          </AuthField>
          <AuthField
            label="Last name"
            error={touched && errors.lastName ? "Enter your last name." : undefined}
          >
            <input
              className={inputCls}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              placeholder="Borrower"
            />
          </AuthField>
        </div>
        <AuthField
          label="Email address"
          error={touched && errors.email ? "Enter a valid email." : undefined}
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
          label="Resume or secure reference code"
          error={
            touched && errors.reference ? "Enter your QS reference or resume token." : undefined
          }
        >
          <input
            className={inputCls}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            autoComplete="off"
            placeholder="QS-..."
          />
        </AuthField>
        <AuthField
          label="Password"
          error={touched && errors.password ? "Use at least 8 characters." : undefined}
        >
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </AuthField>
        <AuthField
          label="Confirm password"
          error={touched && errors.passwordConfirmation ? "Passwords must match." : undefined}
        >
          <input
            className={inputCls}
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            autoComplete="new-password"
            placeholder="Re-enter your password"
          />
        </AuthField>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>I consent to creating an approvU account using my saved qualification.</span>
        </label>
        {touched && errors.consent && (
          <p className="-mt-2 text-[11px] text-coral">
            Please confirm consent to create your account.
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-coral/30 bg-coral/5 p-3 text-sm text-coral">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} className={primaryBtnCls}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating your account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <Link
          to="/"
          className="inline-flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to start
        </Link>
      </form>
    </AuthShell>
  );
}

function ReferenceLine({ reference }: { reference?: string }) {
  if (!reference) return null;
  return (
    <span>
      Saved reference <span className="font-semibold text-foreground">{reference}</span>
    </span>
  );
}
