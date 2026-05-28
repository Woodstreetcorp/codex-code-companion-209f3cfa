import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  Banknote,
  Home,
  Lock,
  Scale,
  Shield,
  Store,
  Truck,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/wallet")({
  head: () => ({
    meta: [
      { title: "Home Life Wallet — approvU" },
      {
        name: "description",
        content:
          "Bundle benefits, partner storefront, cashback rewards, referrals, and your loyalty tier — all in one wallet.",
      },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  return <LockedWallet />;
}

function LockedWallet() {
  const previews = [
    { name: "Legal fee rebates", icon: Scale },
    { name: "Home inspection credits", icon: Home },
    { name: "Moving credits", icon: Truck },
    { name: "Home insurance offers", icon: Shield },
    { name: "Smart home offers", icon: Zap },
    { name: "Cashback rewards", icon: Banknote },
    { name: "Referral bonuses", icon: Users },
    { name: "Loyalty tiers", icon: Trophy },
    { name: "Partner storefront", icon: Store },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Home Life Wallet"
        title="Your Home Life Wallet"
        description="Your benefits, cashback, and partner storefront unlock once your mortgage is funded through approvU. Pre-purchase tier perks are available now."
      />

      <section className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-secondary/10 p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          Wallet unlocks after funding
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          You're at the <strong>Pre-purchase</strong> tier. Once your mortgage closes through
          approvU you'll move to <strong>Funded</strong> and unlock bundle credits, partner offers,
          and cashback.
        </p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
          {previews.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <p.icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-medium text-foreground">{p.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/portal/applications"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View My Applications <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <button
            onClick={() => toast.success("Starting a new mortgage snapshot…")}
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Start New Mortgage Snapshot
          </button>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          Your wallet and renewal calendar activate automatically once your mortgage is funded.
        </p>
      </section>
    </>
  );
}
