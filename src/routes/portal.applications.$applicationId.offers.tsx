import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Printer, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import {
  ApplicationShell, NotFoundApplication, getApplicationSummary,
} from "@/components/portal/application-shell";

export const Route = createFileRoute("/portal/applications/$applicationId/offers")({
  head: () => ({ meta: [{ title: "Mortgage Offers — approvU" }] }),
  component: OffersPage,
});

const OFFERS = [
  { id: "OF-1", lender: "Major Bank", rate: "4.59%", type: "5-yr fixed", payment: "$2,358 / mo", highlight: "Best monthly payment", recommended: true },
  { id: "OF-2", lender: "Monoline Lender", rate: "4.74%", type: "5-yr fixed", payment: "$2,402 / mo", highlight: "Most flexible prepayment" },
  { id: "OF-3", lender: "Credit Union", rate: "5.10%", type: "5-yr variable", payment: "$2,488 / mo", highlight: "Best for early renewal" },
];

function OffersPage() {
  const { applicationId } = Route.useParams();
  const summary = getApplicationSummary(applicationId);
  if (!summary) return <NotFoundApplication id={applicationId} />;
  return (
    <ApplicationShell summary={summary} tab="offers">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Mortgage offers tied to this application</h2>
          <p className="mt-1 text-sm text-muted-foreground">Compare and select an offer to move forward with the lender review.</p>
        </div>
        <div className="flex gap-2 print:hidden" data-no-print>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "approvU mortgage offers", url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <Share2 className="h-3.5 w-3.5" /> Share with spouse
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {OFFERS.map((o) => (
          <div key={o.id} className={`rounded-2xl border p-5 ${o.recommended ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
            {o.recommended && (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                <Star className="h-3 w-3" /> Recommended
              </span>
            )}
            <p className="text-xs font-semibold text-secondary">{o.lender}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{o.rate}</p>
            <p className="text-xs text-muted-foreground">{o.type}</p>
            <div className="mt-3 space-y-1 text-xs">
              <Row label="Estimated payment" value={o.payment} />
              <Row label="Highlight" value={o.highlight} />
            </div>
            <button
              onClick={() => toast.success(`${o.lender} offer selected`, { description: "Your advisor has been notified to start instructions." })}
              className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <BadgeCheck className="h-3.5 w-3.5" /> Select this offer
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm">
        <p className="text-foreground">Want to compare more carefully?</p>
        <Link to="/portal/tools/scenario-compare" className="mt-1 inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80">
          Open Scenario Compare <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </div>
    </ApplicationShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}