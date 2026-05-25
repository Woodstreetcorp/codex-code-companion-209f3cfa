import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgePercent,
  CheckCircle2,
  Gift,
  Loader2,
  ShieldCheck,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  getBorrowerHomeLifeBundleOfferDetail,
  getBorrowerHomeLifeBundlePortalData,
  storeBorrowerHomeLifeBundlePortalData,
  type BorrowerHomeLifeBundleOffer,
  type BorrowerHomeLifeBundlePortalData,
} from "@/lib/api/borrowerHomeLifeBundleApi";

export const Route = createFileRoute("/portal/home-life-bundle")({
  head: () => ({
    meta: [
      { title: "Home Life Bundle — approvU" },
      {
        name: "description",
        content:
          "Review your assigned Home Life Bundle, selected offers, and borrower-safe redeemable code summary.",
      },
    ],
  }),
  component: HomeLifeBundleDetailPage,
});

function HomeLifeBundleDetailPage() {
  const [result, setResult] = useState<BorrowerHomeLifeBundlePortalData | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<BorrowerHomeLifeBundleOffer | null>(null);
  const [selectedOfferReference, setSelectedOfferReference] = useState<string | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBundle() {
      setLoading(true);
      setError(null);
      const response = await getBorrowerHomeLifeBundlePortalData();
      if (!active) return;
      storeBorrowerHomeLifeBundlePortalData(response);
      setResult(response);
      if (!response.endpoint_available || response.ok === false) {
        setError(response.message ?? "Home Life Bundle details could not be loaded.");
      }
      setLoading(false);
    }

    void loadBundle();

    return () => {
      active = false;
    };
  }, []);

  async function viewOfferDetail(offer: BorrowerHomeLifeBundleOffer) {
    const publicReference = offer.public_reference;
    if (!publicReference) {
      setSelectedOffer(offer);
      setSelectedOfferReference(null);
      setOfferError(null);
      return;
    }

    setSelectedOfferReference(publicReference);
    setOfferLoading(true);
    setOfferError(null);
    try {
      const detail = await getBorrowerHomeLifeBundleOfferDetail(publicReference);
      setSelectedOffer(detail ?? offer);
    } catch (failure) {
      setSelectedOffer(offer);
      setOfferError(
        failure instanceof Error
          ? failure.message
          : "This offer detail could not be loaded right now.",
      );
    } finally {
      setOfferLoading(false);
    }
  }

  if (loading) {
    return (
      <PageFrame>
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            Loading your Home Life Bundle
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            We are pulling your assigned bundle, selected offers, and redeemable code summary.
          </p>
        </div>
      </PageFrame>
    );
  }

  if (error || !result?.ok) {
    return (
      <PageFrame>
        <BackLink />
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Home Life Bundle is not available yet
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {error ??
              "Your bundle details may still be preparing. You can continue your mortgage journey from the portal."}
          </p>
        </div>
      </PageFrame>
    );
  }

  const summary = result.summary;
  const assignments = result.assignments;
  const selectedOffers = result.selected_offers;
  const redeemableCodes = result.redeemable_codes;
  const assignedStatus = summary?.assignment_status ?? summary?.status ?? assignments[0]?.status;
  const selectedCount = summary?.selected_offers_count ?? selectedOffers.length;
  const redeemableCount =
    summary?.redeemable_codes_count ?? summary?.redeemable_offers_count ?? redeemableCodes.length;

  return (
    <PageFrame>
      <BackLink />

      <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
                Home Life Bundle
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {summary?.bundle_name ?? assignments[0]?.bundle_name ?? "Your Home Life Bundle"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                {summary?.message ??
                  "Review borrower-safe bundle status, selected offers, and redeemable code summaries tied to your mortgage journey."}
              </p>
            </div>
          </div>
          <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
            {formatValue(assignedStatus ?? "pending")}
          </span>
        </div>

        <dl className="mt-6 grid gap-3 md:grid-cols-3">
          <FactCard
            icon={CheckCircle2}
            label="Assigned bundle status"
            value={formatValue(assignedStatus ?? "pending")}
          />
          <FactCard icon={BadgePercent} label="Selected offers" value={`${selectedCount}`} />
          <FactCard icon={Ticket} label="Redeemable offers/codes" value={`${redeemableCount}`} />
        </dl>

        {summary?.next_step && (
          <p className="mt-5 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            {summary.next_step}
          </p>
        )}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Assigned Bundle">
          {assignments.length > 0 ? (
            <div className="grid gap-3">
              {assignments.map((assignment, index) => (
                <SafeCard
                  key={`${assignment.public_reference ?? assignment.bundle_name ?? "assignment"}-${index}`}
                  title={assignment.bundle_name ?? "Assigned bundle"}
                  eyebrow={formatValue(assignment.status ?? "assigned")}
                  description={assignment.message}
                  facts={[
                    { label: "Assigned", value: assignment.assigned_at },
                    { label: "Expires", value: assignment.expires_at },
                  ]}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No assigned bundle is showing yet." />
          )}
        </Panel>

        <Panel title="Redeemable Codes Summary">
          {redeemableCodes.length > 0 ? (
            <div className="grid gap-3">
              {redeemableCodes.map((code, index) => (
                <SafeCard
                  key={`${code.public_reference ?? code.offer_label ?? "code"}-${index}`}
                  title={code.offer_label ?? code.code_label ?? "Redeemable offer"}
                  eyebrow={formatValue(code.status ?? "pending")}
                  description={
                    code.redeemable === false
                      ? "This offer is not redeemable yet."
                      : "Redeemable when bundle conditions are met."
                  }
                  facts={[{ label: "Expires", value: code.expires_at }]}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No redeemable codes are available yet." />
          )}
        </Panel>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Panel title="Selected Offers">
          {selectedOffers.length > 0 ? (
            <div className="grid gap-3">
              {selectedOffers.map((offer, index) => (
                <button
                  key={`${offer.public_reference ?? offer.offer_label ?? "offer"}-${index}`}
                  type="button"
                  onClick={() => void viewOfferDetail(offer)}
                  className="rounded-xl border border-border bg-background p-4 text-left transition hover:bg-muted"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {formatValue(offer.status ?? "selected")}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-foreground">
                        {offer.offer_label ?? "Selected offer"}
                      </h3>
                    </div>
                    <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                      Details
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[offer.partner_label, formatValue(offer.category)]
                      .filter(Boolean)
                      .join(" · ") || "Borrower-safe offer summary"}
                  </p>
                  {offer.safe_description && (
                    <p className="mt-2 text-xs text-muted-foreground">{offer.safe_description}</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <EmptyState message="No selected Home Life Bundle offers are showing yet." />
          )}
        </Panel>

        <Panel title="Safe Offer Detail">
          {offerLoading ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading safe offer detail...
            </div>
          ) : selectedOffer ? (
            <SafeCard
              title={selectedOffer.offer_label ?? "Selected offer"}
              eyebrow={formatValue(selectedOffer.status ?? "selected")}
              description={
                offerError ??
                selectedOffer.safe_description ??
                "This offer detail only includes borrower-safe information."
              }
              facts={[
                { label: "Partner", value: selectedOffer.partner_label },
                { label: "Category", value: selectedOffer.category },
                { label: "Redeemable", value: boolLabel(selectedOffer.redeemable) },
                { label: "Redemption", value: selectedOffer.redemption_status },
                { label: "Expires", value: selectedOffer.expires_at },
              ]}
            />
          ) : (
            <EmptyState message="Select an offer to review borrower-safe details." />
          )}
          {selectedOfferReference && (
            <p className="mt-3 text-xs text-muted-foreground">
              Reference{" "}
              <span className="font-semibold text-foreground">{selectedOfferReference}</span>
            </p>
          )}
        </Panel>
      </section>

      <p className="mt-5 text-xs text-muted-foreground">
        This page intentionally shows borrower-safe fields only. Internal offer IDs, admin-only
        fields, partner internal metadata, and private operational notes are not displayed.
      </p>
    </PageFrame>
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return <div className="space-y-0">{children}</div>;
}

function BackLink() {
  return (
    <Link
      to="/portal"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to portal
    </Link>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FactCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-secondary" />
        <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </dt>
      </div>
      <dd className="mt-2 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function SafeCard({
  title,
  eyebrow,
  description,
  facts,
}: {
  title: string;
  eyebrow?: string | null;
  description?: string | null;
  facts?: { label: string; value?: string | null }[];
}) {
  const visibleFacts = facts?.filter((fact) => fact.value) ?? [];

  return (
    <article className="rounded-xl border border-border bg-background p-4">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
      {visibleFacts.length > 0 && (
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          {visibleFacts.map((fact) => (
            <div key={fact.label} className="rounded-lg border border-border bg-card px-3 py-2">
              <dt className="font-semibold text-muted-foreground">{fact.label}</dt>
              <dd className="mt-0.5 text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function formatValue(value?: string | null): string {
  if (!value) return "Not available";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function boolLabel(value?: boolean | null): string | null {
  if (value === true) return "Yes";
  if (value === false) return "Not yet";
  return null;
}
