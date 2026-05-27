import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  FileText,
  FolderOpen,
  Gift,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { clearBorrowerSession, logoutBorrower } from "@/lib/api/borrowerAuthApi";
import {
  getBorrowerHomeLifeBundlePortalData,
  storeBorrowerHomeLifeBundlePortalData,
  type BorrowerHomeLifeBundlePortalData,
} from "@/lib/api/borrowerHomeLifeBundleApi";
import {
  getBorrowerPortalSummary,
  storeBorrowerPortalSummary,
  type BorrowerPortalSection,
  type BorrowerPortalSummary,
} from "@/lib/api/borrowerPortalApi";

export const Route = createFileRoute("/portal/")({
  head: () => ({
    meta: [
      { title: "Your approvU Portal" },
      {
        name: "description",
        content: "View your saved Mortgage Snapshot and continue your approvU borrower journey.",
      },
    ],
  }),
  component: BorrowerPortalHome,
});

function BorrowerPortalHome() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<BorrowerPortalSummary | null>(null);
  const [homeLifeBundle, setHomeLifeBundle] = useState<BorrowerHomeLifeBundlePortalData | null>(
    null,
  );
  const [bundleLoading, setBundleLoading] = useState(true);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPortal() {
      setLoading(true);
      setError(null);
      try {
        const result = await getBorrowerPortalSummary();
        if (!active) return;
        storeBorrowerPortalSummary(result);
        setSummary(result);
      } catch (failure) {
        if (!active) return;
        setError(
          failure instanceof Error ? failure.message : "Your borrower portal could not be loaded.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPortal();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadHomeLifeBundle() {
      setBundleLoading(true);
      setBundleError(null);
      const result = await getBorrowerHomeLifeBundlePortalData();
      if (!active) return;
      storeBorrowerHomeLifeBundlePortalData(result);
      setHomeLifeBundle(result);
      if (!result.endpoint_available || result.ok === false) {
        setBundleError(result.message ?? "Home Life Bundle details could not be loaded.");
      }
      setBundleLoading(false);
    }

    void loadHomeLifeBundle();

    return () => {
      active = false;
    };
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await logoutBorrower();
      clearBorrowerSession();
      await navigate({ to: "/login" });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "We could not sign you out.");
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <PortalPanel>
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            Loading your borrower portal
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            We are pulling your saved Mortgage Snapshot and next steps from approvU.
          </p>
        </div>
      </PortalPanel>
    );
  }

  if (error || !summary?.ok) {
    return (
      <PortalPanel>
        <div className="space-y-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Sign in required
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              We could not load your portal
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {error ??
                "Your borrower session may have expired. Sign in again to continue your saved journey."}
            </p>
          </div>
          <Link
            to="/login"
            search={{ redirect: "/portal" }}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Sign in
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </PortalPanel>
    );
  }

  const userName = summary.user?.name || "there";
  const qualification = summary.latest_qualification;
  const snapshot = summary.latest_snapshot;
  const primaryAction = normalizeAction(summary.primary_action?.action);
  const primaryRoute = routeForAction(primaryAction, snapshot?.public_reference);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Borrower portal
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Welcome back, {firstName(userName)}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {summary.message ??
                "Your saved Mortgage Snapshot and next steps are ready when you are."}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sign out
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <SummaryTile label="Name" value={summary.user?.name ?? "Not available"} />
          <SummaryTile label="Email" value={summary.user?.email ?? "Not available"} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <SnapshotCard summary={summary} />
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Continue your journey</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.primary_action?.label ??
              (snapshot ? "View Mortgage Snapshot" : "Start qualification")}
          </p>
          <Link
            to={primaryRoute}
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {summary.primary_action?.label ?? "Continue"}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
          {qualification?.public_reference && (
            <p className="mt-3 text-xs text-muted-foreground">
              Reference{" "}
              <span className="font-semibold text-foreground">
                {qualification.public_reference}
              </span>
            </p>
          )}
        </div>
      </section>

      <section aria-label="Portal sections" className="grid gap-4 md:grid-cols-3">
        <PlaceholderCard
          icon={FileText}
          section={summary.portal_sections?.documents}
          fallbackLabel="Documents"
          fallbackMessage="Upload and manage your mortgage documents securely."
          actionHref="/portal/documents"
          actionLabel="Go to Document Vault"
        />
        <PlaceholderCard
          icon={CheckCircle2}
          section={summary.portal_sections?.offers}
          fallbackLabel="Offers"
          fallbackMessage="Your options will be reviewed after your application details are complete."
          actionHref="/portal/offers"
          actionLabel="View Review Status"
        />
        <PlaceholderCard
          icon={FolderOpen}
          section={summary.portal_sections?.application}
          fallbackLabel="Application"
          fallbackMessage="Your application workspace is being prepared."
          actionHref="/portal/application"
          actionLabel="Continue Application"
        />
      </section>

      <HomeLifeBundleCard result={homeLifeBundle} loading={bundleLoading} error={bundleError} />
    </div>
  );
}

function PortalPanel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">{children}</section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SnapshotCard({ summary }: { summary: BorrowerPortalSummary }) {
  const qualification = summary.latest_qualification;
  const snapshot = summary.latest_snapshot;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
            Mortgage Snapshot
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            {snapshot ? "Snapshot ready" : qualification ? "Snapshot pending" : "No snapshot yet"}
          </h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {snapshot ? <CheckCircle2 className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
        </div>
      </div>

      {qualification ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryTile
            label="Reference"
            value={qualification.public_reference ?? "Not available"}
          />
          <SummaryTile label="Path" value={formatValue(qualification.transaction_type)} />
          <SummaryTile label="Status" value={formatValue(qualification.state)} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Start a borrower qualification to generate your first Mortgage Snapshot.
        </p>
      )}

      {snapshot && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryTile
              label="Lending path"
              value={formatValue(snapshot.preliminary_lending_path)}
            />
            <SummaryTile label="Readiness" value={formatValue(snapshot.readiness_status)} />
          </div>

          <InsightList
            title="Key insights"
            items={snapshot.key_insights}
            empty="No insights yet."
          />
          <InsightList
            title="Missing items"
            items={snapshot.missing_items}
            empty="No missing items listed."
          />
        </div>
      )}
    </div>
  );
}

function PlaceholderCard({
  icon: Icon,
  section,
  fallbackLabel,
  fallbackMessage,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  section?: BorrowerPortalSection | null;
  fallbackLabel: string;
  fallbackMessage: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {section?.label ?? fallbackLabel}
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {formatValue(section?.status ?? "not_started")}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{section?.message ?? fallbackMessage}</p>
      {actionHref && actionLabel && (
        <Link
          to={actionHref}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function HomeLifeBundleCard({
  result,
  loading,
  error,
}: {
  result: BorrowerHomeLifeBundlePortalData | null;
  loading: boolean;
  error: string | null;
}) {
  const summary = result?.summary;
  const selectedOffers = result?.selected_offers ?? [];
  const redeemableCodes = result?.redeemable_codes ?? [];
  const assignments = result?.assignments ?? [];
  const selectedCount = summary?.selected_offers_count ?? selectedOffers.length;
  const redeemableCount =
    summary?.redeemable_codes_count ?? summary?.redeemable_offers_count ?? redeemableCodes.length;
  const assignedStatus = summary?.assignment_status ?? summary?.status ?? assignments[0]?.status;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Home Life Bundle
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {summary?.bundle_name ?? "Your Home Life Bundle"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {loading
                ? "Loading bundle benefits, selected offers, and redeemable codes."
                : error
                  ? error
                  : (summary?.message ??
                    "Track assigned bundle benefits, selected offers, and redeemable codes from your borrower portal.")}
            </p>
          </div>
        </div>

        <Link
          to="/portal/wallet"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Open Wallet
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading Home Life Bundle status...
        </div>
      ) : error ? (
        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Home Life Bundle details are not available right now. Your mortgage journey can continue
          while this refreshes.
        </div>
      ) : !summary && assignments.length === 0 && selectedOffers.length === 0 ? (
        <div className="mt-5 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          No Home Life Bundle assignment is showing yet. Benefits and redeemable offers will appear
          after your file is ready.
        </div>
      ) : (
        <>
          <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
            <BundleFact
              icon={CheckCircle2}
              label="Assigned bundle status"
              value={formatValue(assignedStatus ?? "pending")}
            />
            <BundleFact
              icon={BadgePercent}
              label="Selected offers"
              value={`${selectedCount} selected`}
            />
            <BundleFact
              icon={Ticket}
              label="Redeemable offers/codes"
              value={`${redeemableCount} available`}
            />
          </dl>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <BundleList
              title="Selected offers summary"
              items={selectedOffers.map((offer) => ({
                key: offer.public_reference ?? offer.offer_label ?? "selected-offer",
                label: offer.offer_label ?? "Selected offer",
                meta: [offer.partner_label, formatValue(offer.status)].filter(Boolean).join(" · "),
                description: offer.safe_description,
              }))}
              empty="No selected Home Life offers are showing yet."
            />
            <BundleList
              title="Redeemable offers/codes summary"
              items={redeemableCodes.map((code) => ({
                key: code.public_reference ?? code.offer_label ?? "redeemable-code",
                label: code.offer_label ?? code.code_label ?? "Redeemable offer",
                meta: [
                  formatValue(code.status),
                  code.expires_at ? `Expires ${code.expires_at}` : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
                description:
                  code.redeemable === false
                    ? "This offer is not redeemable yet."
                    : "Redeemable when your offer conditions are met.",
              }))}
              empty="No redeemable codes are available yet."
            />
          </div>

          {summary?.next_step && (
            <p className="mt-4 text-sm text-muted-foreground">{summary.next_step}</p>
          )}
        </>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        This portal card shows borrower-safe bundle status only. Internal offer IDs, partner
        metadata, and admin-only fields are not displayed.
      </p>
    </section>
  );
}

function BundleFact({
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

function BundleList({
  title,
  items,
  empty,
}: {
  title: string;
  items: { key: string; label: string; meta?: string | null; description?: string | null }[];
  empty: string;
}) {
  const visibleItems = items.filter((item) => item.label);

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {visibleItems.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {visibleItems.slice(0, 3).map((item, index) => (
            <li
              key={`${item.key}-${index}`}
              className="rounded-lg border border-border bg-card p-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              {item.meta && <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>}
              {item.description && (
                <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function InsightList({
  title,
  items,
  empty,
}: {
  title: string;
  items?: string[] | null;
  empty: string;
}) {
  const visibleItems = items?.filter(Boolean) ?? [];

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {visibleItems.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {visibleItems.slice(0, 3).map((item) => (
            <li key={item} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function formatValue(value?: string | null): string {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeAction(
  action?: string | null,
): "start_qualification" | "generate_snapshot" | "view_snapshot" {
  if (action === "generate_snapshot" || action === "view_snapshot") return action;
  return "start_qualification";
}

function routeForAction(
  action: "start_qualification" | "generate_snapshot" | "view_snapshot",
  snapshotReference?: string | null,
): "/purchase" | "/portal" {
  if (action === "start_qualification") return "/purchase";
  if (action === "view_snapshot" && snapshotReference) return "/portal";
  return "/portal";
}
