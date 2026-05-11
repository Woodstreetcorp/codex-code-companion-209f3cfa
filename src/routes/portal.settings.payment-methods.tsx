import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Wallet } from "lucide-react";
import { SettingPane } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/payment-methods")({
  head: () => ({
    meta: [
      { title: "Payment Methods — approvU Settings" },
      { name: "description", content: "Manage saved payment methods, billing address, and payment history." },
    ],
  }),
  component: PaymentMethodsPage,
});

type Card = { id: string; brand: string; last4: string; exp: string; isDefault: boolean };

const HISTORY = [
  { date: "Apr 14, 2026", desc: "Property appraisal — 123 Maple Ave", amount: "$525.00", status: "Paid" as const },
  { date: "Mar 02, 2026", desc: "Application processing fee", amount: "$95.00", status: "Paid" as const },
  { date: "Feb 18, 2026", desc: "Document courier", amount: "$28.50", status: "Refunded" as const },
];

function PaymentMethodsPage() {
  const [cards, setCards] = useState<Card[]>([
    { id: "1", brand: "Visa", last4: "4242", exp: "08/27", isDefault: true },
  ]);
  const [sameAsCurrent, setSameAsCurrent] = useState(true);

  const setDefault = (id: string) => {
    setCards((p) => p.map((c) => ({ ...c, isDefault: c.id === id })));
    toast.success("Default payment method updated");
  };
  const remove = (id: string) => {
    setCards((p) => p.filter((c) => c.id !== id));
    toast.success("Payment method removed");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-secondary/10 via-card to-primary/5 p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Payment methods are optional today</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              You only need a payment method if you choose to pay for an appraisal, service, or marketplace item from approvU. Add one now to make future payments faster.
            </p>
          </div>
        </div>
      </section>

      <SettingPane title="Saved payment methods" desc="Cards you've saved for one-tap payments.">
        <div className="space-y-3">
          {cards.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
              No payment methods saved yet.
            </div>
          )}
          {cards.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-14 items-center justify-center rounded-md bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-primary-foreground">
                  {c.brand}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {c.brand} ending in {c.last4}
                    {c.isDefault && (
                      <span className="ml-2 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mint">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Expires {c.exp}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!c.isDefault && (
                  <button onClick={() => setDefault(c.id)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                    Set default
                  </button>
                )}
                <button onClick={() => remove(c.id)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              const id = String(Date.now());
              setCards((p) => [...p, { id, brand: "Mastercard", last4: "1881", exp: "11/28", isDefault: p.length === 0 }]);
              toast.success("Payment method added");
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add payment method
          </button>
        </div>
      </SettingPane>

      <SettingPane title="Billing address" desc="Where your receipts and statements are sent." onSave={() => toast.success("Billing address saved")}>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5">
          <input
            type="checkbox"
            checked={sameAsCurrent}
            onChange={(e) => setSameAsCurrent(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Same as my current address</p>
            <p className="text-xs text-muted-foreground">123 Maple Avenue, Apt 504, Toronto ON M5V 2T6</p>
          </div>
        </label>
        {!sameAsCurrent && (
          <p className="mt-3 text-xs text-muted-foreground">
            Custom billing address entry is coming soon. For now, contact support to use a different billing address.
          </p>
        )}
      </SettingPane>

      <SettingPane title="Payment history" desc="Recent receipts on your approvU account.">
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {HISTORY.map((h, i) => (
                <tr key={i} className="bg-card">
                  <td className="px-3 py-2.5 text-muted-foreground">{h.date}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{h.desc}</td>
                  <td className="px-3 py-2.5 text-foreground">{h.amount}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${h.status === "Paid" ? "bg-mint/15 text-mint" : "bg-muted text-muted-foreground"}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button className="text-xs font-medium text-primary hover:underline">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingPane>
    </div>
  );
}
