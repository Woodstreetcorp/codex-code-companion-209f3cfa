import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { AuthShell, primaryBtnCls } from "@/components/auth/auth-shell";

const searchSchema = z.object({
  email: z.string().optional(),
  token: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Verify your email — approvU" },
      { name: "description", content: "Confirm your email address to activate your approvU account." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { email, token } = Route.useSearch();
  const [status, setStatus] = useState<"pending" | "verifying" | "success" | "error">(
    token ? "verifying" : "pending"
  );
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (status !== "verifying") return;
    const t = window.setTimeout(() => {
      // Mock policy: token "invalid" fails, anything else succeeds.
      setStatus(token === "invalid" ? "error" : "success");
    }, 800);
    return () => window.clearTimeout(t);
  }, [status, token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  if (status === "verifying") {
    return (
      <AuthShell eyebrow="Verifying" title="Confirming your email…" description="Hang tight — this usually takes just a second.">
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell eyebrow="Email verified" title="You're all set" description="Your email has been confirmed. You can now continue to your approvU portal.">
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-mint-foreground" />
          <button onClick={() => navigate({ to: "/portal" })} className={primaryBtnCls}>
            Continue to portal <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell
        eyebrow="Link invalid"
        title="This verification link can't be used"
        description="The link may have expired or already been used. Request a new verification email to continue."
        footer={<Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}
      >
        <button onClick={() => { setStatus("pending"); setCooldown(30); }} className={primaryBtnCls}>
          <RefreshCw className="h-4 w-4" /> Resend verification email
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Verify email"
      title="Check your inbox"
      description={email
        ? `We've sent a verification link to ${email}. Click the link to activate your approvU account.`
        : "We've sent you a verification email. Click the link in your inbox to activate your approvU account."}
      footer={<Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center rounded-xl border border-border bg-muted/30 py-6">
          <MailCheck className="h-10 w-10 text-primary" />
        </div>
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={() => setCooldown(30)}
          className={primaryBtnCls}
        >
          <RefreshCw className="h-4 w-4" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
        </button>
        <p className="text-center text-[11px] text-muted-foreground">
          Didn't get it? Check spam, or try a different email by signing up again.
        </p>
      </div>
    </AuthShell>
  );
}
