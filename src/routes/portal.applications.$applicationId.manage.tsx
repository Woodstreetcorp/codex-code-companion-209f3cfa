import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  ApplicationShell,
  NotFoundApplication,
  getApplicationSummary,
} from "@/components/portal/application-shell";
import { notify } from "@/components/portal/activity";
import {
  getApplicationState,
  reactivateApplication,
  reasonLabel,
  setApplicationState,
  subscribeApplicationState,
  WITHDRAW_REASONS,
  type ApplicationState,
  type WithdrawReason,
} from "@/lib/application-status";

export const Route = createFileRoute("/portal/applications/$applicationId/manage")({
  head: () => ({
    meta: [
      { title: "Manage Application — approvU" },
      {
        name: "description",
        content:
          "Pause, withdraw, or reactivate your mortgage application — and review any decline notes.",
      },
    ],
  }),
  component: ManagePage,
});

function ManagePage() {
  const { applicationId } = Route.useParams();
  const summary = getApplicationSummary(applicationId);
  const [state, setState] = useState<ApplicationState>(() =>
    getApplicationState(applicationId),
  );
  const navigate = useNavigate();

  useEffect(() => {
    setState(getApplicationState(applicationId));
    return subscribeApplicationState(() =>
      setState(getApplicationState(applicationId)),
    );
  }, [applicationId]);

  if (!summary) return <NotFoundApplication id={applicationId} />;

  const isWithdrawn = state.state === "withdrawn";
  const isPaused = state.state === "paused";

  function pause() {
    if (!confirm("Pause this application? Your advisor will stop new lender outreach until you reactivate.")) return;
    setApplicationState({ applicationId, state: "paused" });
    notify({
      category: "Application",
      title: "Application paused",
      body: "We'll hold off on new lender outreach until you reactivate.",
      tone: "info",
    });
  }

  function reactivate() {
    reactivateApplication(applicationId);
    notify({
      category: "Application",
      title: "Application reactivated",
      body: "Welcome back — your advisor has been notified.",
      tone: "success",
    });
  }

  return (
    <ApplicationShell summary={summary} tab="manage">
      <StatusBanner state={state} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Pause / Reactivate */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-secondary/15 p-2 text-secondary">
              {isPaused ? <PlayCircle className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />}
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-foreground">
                {isPaused ? "Reactivate application" : "Pause application"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {isPaused
                  ? "Pick up where you left off — your advisor will resume lender outreach."
                  : "Temporarily hold your file. We'll keep your data and offers warm."}
              </p>
              {isWithdrawn ? (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Application is withdrawn — reactivate below to resume.
                </p>
              ) : isPaused ? (
                <button
                  onClick={reactivate}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <PlayCircle className="h-3.5 w-3.5" /> Reactivate
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <PauseCircle className="h-3.5 w-3.5" /> Pause
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Privacy / data */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-mint/25 p-2 text-mint-foreground">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Your data is yours</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Withdrawing stops lender outreach immediately. Your file stays in your Vault for 90 days
                so you can reactivate or export it. Request full deletion from Settings → Privacy.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Withdraw / Reactivate */}
      <section className="mt-6 rounded-2xl border border-coral/30 bg-coral/5 p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-coral/15 p-2 text-coral">
            <Ban className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">
              {isWithdrawn ? "Reactivate withdrawn application" : "Withdraw application"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isWithdrawn
                ? `You withdrew this application on ${new Date(state.changedAt).toLocaleDateString()}. ${reasonLabel(state.reasonCode)}`
                : "We'll cancel any in-flight lender outreach. Selected offers will be released."}
            </p>

            {isWithdrawn ? (
              <button
                onClick={() => {
                  reactivate();
                  navigate({ to: "/portal/applications/$applicationId", params: { applicationId } });
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <PlayCircle className="h-3.5 w-3.5" /> Reactivate this application
              </button>
            ) : (
              <WithdrawForm
                onSubmit={(reason, note) => {
                  setApplicationState({
                    applicationId,
                    state: "withdrawn",
                    reasonCode: reason,
                    reasonText: note || undefined,
                  });
                  notify({
                    category: "Application",
                    title: "Application withdrawn",
                    body: reasonLabel(reason),
                    tone: "info",
                  });
                }}
              />
            )}
          </div>
        </div>
      </section>
    </ApplicationShell>
  );
}

function WithdrawForm({
  onSubmit,
}: {
  onSubmit: (reason: WithdrawReason, note: string) => void;
}) {
  const [reason, setReason] = useState<WithdrawReason | "">("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!reason) return;
    if (!window.confirm("Withdraw this application? This will stop all lender outreach.")) return;
    onSubmit(reason, note);
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-foreground">Why are you withdrawing?</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {WITHDRAW_REASONS.map((r) => {
            const sel = reason === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                  sel
                    ? "border-coral bg-coral/10 text-foreground"
                    : "border-border bg-background text-foreground hover:border-coral/50"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">
          Anything else we should know? <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-coral/30"
          placeholder="Helps us improve the experience for next time."
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          I understand this stops lender outreach. My data stays in my Vault for 90 days; I can
          reactivate or request full deletion at any time.
        </span>
      </label>

      <button
        type="submit"
        disabled={!reason || !confirm}
        className="inline-flex items-center gap-1.5 rounded-md bg-coral px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Ban className="h-3.5 w-3.5" /> Withdraw application
      </button>
    </form>
  );
}

function StatusBanner({ state }: { state: ApplicationState }) {
  if (state.state === "active") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-mint/40 bg-mint/10 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">Application is active</p>
          <p className="text-xs text-muted-foreground">
            Your file is moving forward. Use the controls below to pause or withdraw if your plans change.
          </p>
        </div>
      </div>
    );
  }
  if (state.state === "paused") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
        <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-200" />
        <div>
          <p className="text-sm font-semibold text-foreground">Application is paused</p>
          <p className="text-xs text-muted-foreground">
            Paused on {new Date(state.changedAt).toLocaleDateString()} — lender outreach is on hold until you reactivate.
          </p>
        </div>
      </div>
    );
  }
  if (state.state === "withdrawn") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-coral/30 bg-coral/5 p-4">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
        <div>
          <p className="text-sm font-semibold text-foreground">Application withdrawn</p>
          <p className="text-xs text-muted-foreground">
            Withdrawn on {new Date(state.changedAt).toLocaleDateString()}.
            {state.reasonCode ? ` Reason: ${reasonLabel(state.reasonCode)}.` : ""}
            {state.reasonText ? ` Note: "${state.reasonText}"` : ""}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-coral/30 bg-coral/5 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
      <div>
        <p className="text-sm font-semibold text-foreground">Lender declined</p>
        <p className="text-xs text-muted-foreground">
          See the Lender tab for details and discuss next steps with your advisor.
        </p>
      </div>
    </div>
  );
}