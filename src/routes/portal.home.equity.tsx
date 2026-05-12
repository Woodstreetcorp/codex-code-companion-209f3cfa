import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { TrendingUp, MapPin, Home, ArrowRight, Wallet, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/home/equity")({
  head: () => ({
    meta: [
      { title: "Equity & Property — Homeowner Hub" },
      { name: "description", content: "Track home value, equity, and access HELOC or refinance options." },
    ],
  }),
  component: EquityPage,
});

const PROPERTY = {
  address: "78 River Rd, Ottawa, ON",
  purchasePrice: 605_000,
  estimatedValue: 755_000,
  balance: 478_320,
  yoyChange: 6.4,
  neighbourhoodMedian: 738_000,
  comparables: [
    { addr: "82 River Rd", sold: "Apr 2026", price: 762_000, beds: "3 bed / 2 bath" },
    { addr: "14 Birch Lane", sold: "Mar 2026", price: 749_500, beds: "3 bed / 2 bath" },
    { addr: "210 Elm Cres", sold: "Feb 2026", price: 725_000, beds: "3 bed / 1 bath" },
  ],
};

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function EquityPage() {
  const equity = PROPERTY.estimatedValue - PROPERTY.balance;
  const ltv = (PROPERTY.balance / PROPERTY.estimatedValue) * 100;
  const accessible = Math.max(0, PROPERTY.estimatedValue * 0.8 - PROPERTY.balance);
  const totalGain = PROPERTY.estimatedValue - PROPERTY.purchasePrice;

  const [tab, setTab] = useState<"heloc" | "refi">("heloc");

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-secondary/10 via-card to-primary/10">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary">Estimated home value</p>
            <p className="mt-2 text-4xl font-semibold text-foreground">{fmt(PROPERTY.estimatedValue)}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> +{PROPERTY.yoyChange}% YoY · +{fmt(totalGain)} since purchase
            </p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {PROPERTY.address}
            </p>
            <button
              onClick={() => toast.success("Value refreshed from HouseSigma")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <Sparkles className="h-3.5 w-3.5" /> Refresh from market data
            </button>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary">Equity meter</p>
            <p className="mt-2 text-4xl font-semibold text-foreground">{fmt(equity)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{(100 - ltv).toFixed(1)}% equity · {ltv.toFixed(1)}% LTV</p>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${100 - ltv}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>Mortgage {fmt(PROPERTY.balance)}</span>
              <span>Equity {fmt(equity)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Access options */}
      <Card>
        <CardHeader
          title="Tap your equity"
          right={<span className="text-xs text-muted-foreground">Up to {fmt(accessible)} accessible at 80% LTV</span>}
        />
        <div className="mt-3 inline-flex rounded-lg border border-border bg-background p-1">
          <button
            onClick={() => setTab("heloc")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${tab === "heloc" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            HELOC
          </button>
          <button
            onClick={() => setTab("refi")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${tab === "refi" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Refinance
          </button>
        </div>

        {tab === "heloc" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat icon={Wallet} label="Available limit" value={fmt(accessible)} />
            <Stat icon={TrendingUp} label="Indicative rate" value="Prime + 0.50%" />
            <Stat icon={Home} label="Interest only payment" value={`${fmt((accessible * 0.0695) / 12)}/mo`} />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat icon={Wallet} label="Cash-out potential" value={fmt(accessible)} />
            <Stat icon={TrendingUp} label="5-yr fixed refi rate" value="4.34%" />
            <Stat icon={Home} label="Estimated penalty" value={fmt(8_400)} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => toast.success("Pre-qualification request sent to your advisor")}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            See what I qualify for <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            to={tab === "heloc" ? "/portal/tools/home-equity" : "/portal/tools/refinance-savings"}
            className="inline-flex items-center rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Run a calculator
          </Link>
        </div>
      </Card>

      {/* Comps */}
      <Card>
        <CardHeader
          title="Neighbourhood comps"
          right={<span className="text-xs text-muted-foreground">Median sold {fmt(PROPERTY.neighbourhoodMedian)}</span>}
        />
        <ul className="mt-3 divide-y divide-border">
          {PROPERTY.comparables.map((c) => (
            <li key={c.addr} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{c.addr}</p>
                <p className="text-xs text-muted-foreground">{c.beds} · sold {c.sold}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">{fmt(c.price)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}