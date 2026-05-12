import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Mail, MessageSquare, Phone, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/home/renewal")({
  head: () => ({
    meta: [
      { title: "Renewal Review — Homeowner Hub" },
      { name: "description", content: "Plan your mortgage renewal with one-click review and shop the market." },
    ],
  }),
  component: RenewalPage,
});

const CURRENT = { balance: 478_320, rate: 4.59, payment: 2_842, amortRemaining: 22 };
const TODAY_RATES = [
  { id: "fixed5", label: "5-yr fixed", rate: 4.19 },
  { id: "var5", label: "5-yr variable", rate: 4.85 },
  { id: "fixed3", label: "3-yr fixed", rate: 4.34 },
];

function pmt(p: number, r: number, years: number) {
  const n = years * 12;
  const i = r / 100 / 12;
  return (p * i) / (1 - Math.pow(1 + i, -n));
}

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function RenewalPage() {
  const [selected, setSelected] = useState("fixed5");
  const [touchpoints, setTouchpoints] = useState({ t12: true, t6: true, t90: true });

  const newPayment = useMemo(() => {
    const r = TODAY_RATES.find((x) => x.id === selected)!.rate;
    return pmt(CURRENT.balance, r, CURRENT.amortRemaining);
  }, [selected]);
  const delta = newPayment - CURRENT.payment;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="One-click renewal review" right={<RefreshCw className="h-4 w-4 text-secondary" />} />
        <p className="mt-1 text-sm text-muted-foreground">
          We'll shop your renewal across 30+ lenders and bring back the best 3 options. No commitment, no hard credit pull.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TODAY_RATES.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={`rounded-xl border p-4 text-left transition ${
                selected === r.id ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{r.label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{r.rate}%</p>
              <p className="text-xs text-muted-foreground">est. {fmt(pmt(CURRENT.balance, r.rate, CURRENT.amortRemaining))}/mo</p>
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-3">
          <Comp label="Current payment" value={`${fmt(CURRENT.payment)}/mo`} sub={`${CURRENT.rate}%`} />
          <Comp label="New payment" value={`${fmt(newPayment)}/mo`} sub={TODAY_RATES.find((r) => r.id === selected)!.label} />
          <Comp
            label="Difference"
            value={`${delta >= 0 ? "+" : ""}${fmt(delta)}/mo`}
            sub={delta >= 0 ? "increase" : "savings"}
            tone={delta >= 0 ? "warn" : "good"}
          />
        </div>
        <button
          onClick={() => toast.success("Renewal review started — you'll hear back within 1 business day")}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Start my renewal review <ArrowRight className="h-4 w-4" />
        </button>
      </Card>

      <Card>
        <CardHeader title="Renewal nurture timeline" />
        <p className="mt-1 text-sm text-muted-foreground">Choose when we should reach out before maturity.</p>
        <ul className="mt-3 space-y-2">
          {([
            ["t12", "12 months out", "Strategy call + early-bird offers"],
            ["t6", "6 months out", "Lender shop & comparison"],
            ["t90", "90 days out", "Lock-in best rate, prepare paperwork"],
          ] as const).map(([k, t, d]) => (
            <li key={k} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">{t}</p>
                <p className="text-xs text-muted-foreground">{d}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={touchpoints[k]}
                  onChange={(e) => setTouchpoints({ ...touchpoints, [k]: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-muted-foreground">{touchpoints[k] ? "On" : "Off"}</span>
              </label>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Talk to your advisor" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/portal/appointments" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">
            <Phone className="h-4 w-4" /> Book 15-min call
          </Link>
          <Link to="/portal/messages" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">
            <MessageSquare className="h-4 w-4" /> Send a message
          </Link>
          <button
            onClick={() => toast("Email sent to your advisor")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Mail className="h-4 w-4" /> Email advisor
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-mint/15 px-3 py-2 text-xs text-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          90% of approvU renewals close at a rate lower than the bank's first offer.
        </div>
      </Card>
    </div>
  );
}

function Comp({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "good" | "warn" }) {
  const cls = tone === "good" ? "text-primary" : tone === "warn" ? "text-coral" : "text-foreground";
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${cls}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}