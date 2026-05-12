import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CalendarClock,
  Wrench,
  Receipt,
  ShieldAlert,
  Link2,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader } from "@/components/portal/ui";
import { BankConnectDialog } from "@/components/portal/bank-connect-dialog";

export const Route = createFileRoute("/portal/home/")({
  head: () => ({
    meta: [
      { title: "My Mortgage — Homeowner Hub" },
      { name: "description", content: "Current balance, rate, next payment, and days to maturity." },
    ],
  }),
  component: MyMortgagePage,
});

const MORTGAGE = {
  lender: "Major Bank",
  originalAmount: 510_000,
  balance: 478_320,
  rate: 4.59,
  rateType: "Fixed",
  term: "5 years",
  payment: 2_842,
  frequency: "Monthly",
  nextPaymentDate: "Jun 1, 2026",
  fundedDate: "Apr 29, 2026",
  maturityDate: "Apr 29, 2031",
  paymentNumber: 13,
  totalPayments: 300,
};

function daysUntil(date: string) {
  const ms = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function MyMortgagePage() {
  const [linked, setLinked] = useState(false);
  const daysToMaturity = daysUntil(MORTGAGE.maturityDate);
  const monthsToMaturity = Math.round(daysToMaturity / 30);
  const paidPct = Math.round(((MORTGAGE.originalAmount - MORTGAGE.balance) / MORTGAGE.originalAmount) * 100);

  const reminders = [
    { id: 1, label: "Property tax instalment due", due: "Jun 30, 2026", tone: "yellow" as const, icon: Receipt },
    { id: 2, label: "Home insurance renewal", due: "Aug 14, 2026", tone: "secondary" as const, icon: ShieldAlert },
    { id: 3, label: "Furnace annual service", due: "Oct 1, 2026", tone: "mint" as const, icon: Wrench },
    { id: 4, label: "Smoke detector battery check", due: "Nov 1, 2026", tone: "mint" as const, icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/10">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-secondary">
              Current balance · {MORTGAGE.lender}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground">{fmt(MORTGAGE.balance)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {paidPct}% paid down of {fmt(MORTGAGE.originalAmount)} original
            </p>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${paidPct}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (linked) toast.success("Bank already linked — refreshing balance");
                  else setBankOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Link2 className="h-3.5 w-3.5" />
                {linked ? "Bank linked" : "Link bank for live balance"}
              </button>
              <button
                onClick={() => toast("Manual balance update saved")}
                className="inline-flex items-center rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                Update manually
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <KV label="Rate" value={`${MORTGAGE.rate}% ${MORTGAGE.rateType}`} />
            <KV label="Term" value={MORTGAGE.term} />
            <KV label="Payment" value={`${fmt(MORTGAGE.payment)} / mo`} />
            <KV label="Next payment" value={MORTGAGE.nextPaymentDate} />
          </div>
        </div>
      </Card>

      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={CalendarClock} label="Days to maturity" value={`${daysToMaturity}`} sub={`${monthsToMaturity} months`} />
        <Stat icon={Banknote} label="Payment progress" value={`${MORTGAGE.paymentNumber} / ${MORTGAGE.totalPayments}`} sub="payments made" />
        <Stat icon={TrendingUp} label="Principal paid" value={fmt(MORTGAGE.originalAmount - MORTGAGE.balance)} sub="since funding" />
      </div>

      {/* Renewal nurture + reminders */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Renewal countdown" right={<span className="text-xs text-muted-foreground">Maturity {MORTGAGE.maturityDate}</span>} />
          <RenewalTimeline daysToMaturity={daysToMaturity} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/portal/home/renewal"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start renewal review <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => toast.success("We'll text you 6 months before maturity")}
              className="inline-flex items-center rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              Schedule reminders
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming reminders" />
          <ul className="mt-3 space-y-2">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <r.icon className={`h-4 w-4 ${r.tone === "yellow" ? "text-yellow-foreground" : r.tone === "secondary" ? "text-secondary" : "text-primary"}`} />
                  {r.label}
                </span>
                <span className="text-xs text-muted-foreground">{r.due}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => toast("Reminder added to your calendar")}
            className="mt-3 w-full rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            + Add custom reminder
          </button>
        </Card>
      </div>

      {/* Trigger card */}
      <Card className="border-mint/40 bg-mint/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">You may have access to ~{fmt(98_000)} in equity</p>
              <p className="text-xs text-muted-foreground">Based on estimated home value of $755,000 and current balance.</p>
            </div>
          </div>
          <Link
            to="/portal/home/equity"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Explore options <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Card>

      {/* Property tax / insurance status */}
      <Card>
        <CardHeader title="Property tax & insurance" />
        <p className="mt-1 text-xs text-muted-foreground">Your lender does not collect these on your behalf — track them here.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <PolicyRow
            icon={Receipt}
            title="City of Ottawa property tax"
            sub="Next instalment Jun 30, 2026 · $1,420"
            status="On track"
          />
          <PolicyRow
            icon={ShieldAlert}
            title="Home insurance — Intact"
            sub="Renews Aug 14, 2026 · $1,860/yr"
            status="Action: confirm rebuild value"
            warn
          />
        </div>
      </Card>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Banknote; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function RenewalTimeline({ daysToMaturity }: { daysToMaturity: number }) {
  const milestones = [
    { d: 365, label: "12 mo" },
    { d: 180, label: "6 mo" },
    { d: 90, label: "90 d" },
    { d: 0, label: "Maturity" },
  ];
  return (
    <div className="mt-4">
      <div className="relative h-2 rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-secondary"
          style={{ width: `${Math.min(100, Math.max(0, (1 - daysToMaturity / (365 * 5)) * 100))}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
        {milestones.map((m) => (
          <span key={m.label} className={daysToMaturity <= m.d + 30 ? "font-semibold text-foreground" : ""}>
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PolicyRow({ icon: Icon, title, sub, status, warn }: { icon: typeof Receipt; title: string; sub: string; status: string; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-3 py-3">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${warn ? "bg-yellow/30 text-foreground" : "bg-mint/30 text-foreground"}`}>
        {warn ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
        {status}
      </span>
    </div>
  );
}