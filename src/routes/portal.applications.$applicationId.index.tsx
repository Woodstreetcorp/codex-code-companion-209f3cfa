import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, FileText, ListChecks, MessageSquare, Sparkles } from "lucide-react";
import {
  ApplicationShell,
  NotFoundApplication,
  getApplicationSummary,
} from "@/components/portal/application-shell";

export const Route = createFileRoute("/portal/applications/$applicationId/")({
  head: () => ({
    meta: [
      { title: "Application Snapshot — approvU" },
      { name: "description", content: "Snapshot of your mortgage application progress, signals, and next steps." },
    ],
  }),
  component: SnapshotPage,
});

function SnapshotPage() {
  const { applicationId } = Route.useParams();
  const summary = getApplicationSummary(applicationId);
  if (!summary) return <NotFoundApplication id={applicationId} />;
  const base = `/portal/applications/${applicationId}`;

  return (
    <ApplicationShell summary={summary} tab="snapshot">
      {/* Next best action */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/10 via-card to-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-secondary/15 p-2.5 text-secondary"><Sparkles className="h-5 w-5" /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary">Next best action</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{summary.nextStep}</p>
            <p className="text-xs text-muted-foreground">Stay on track toward funding.</p>
          </div>
        </div>
        <Link to={`${base}/conditions`} className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          View open items <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Tile to={`${base}/offers`} icon={BadgeCheck} title="Mortgage Offers" body="Compare lender offers tied to this application." />
        <Tile to={`${base}/documents`} icon={FileText} title="Documents" body={`${summary.documentsPending} pending · view requests and uploads.`} />
        <Tile to={`${base}/conditions`} icon={ListChecks} title="Conditions" body={`${summary.conditionsOutstanding} outstanding · track lender conditions.`} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Qualification summary</p>
          <p className="mt-1 text-sm text-muted-foreground">A friendly overview of your initial path, selected offer, and what we still need to verify.</p>
          <Link to={`${base}/qualification-summary`} className="mt-3 inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80">
            Open qualification summary <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Need help?</p>
          <p className="mt-1 text-sm text-muted-foreground">Reach out to your broker or our support team — we'll get back within one business day.</p>
          <Link to={`${base}/messages`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
            <MessageSquare className="h-3.5 w-3.5" /> Open messages
          </Link>
        </div>
      </div>
    </ApplicationShell>
  );
}

function Tile({ to, icon: Icon, title, body }: { to: string; icon: typeof BadgeCheck; title: string; body: string }) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm">
      <Icon className="h-5 w-5 text-secondary" />
      <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      <span className="mt-3 inline-flex items-center text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
        Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </span>
    </Link>
  );
}