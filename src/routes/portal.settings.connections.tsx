import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CalendarDays,
  Chrome,
  Apple,
  Building2,
  Plug,
  Trash2,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";
import { SettingPane, Row } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/connections")({
  head: () => ({
    meta: [
      { title: "Connected Accounts — approvU Settings" },
      { name: "description", content: "Manage banking, identity, and calendar connections that streamline your application." },
    ],
  }),
  component: ConnectionsPage,
});

type Conn = {
  id: string;
  name: string;
  desc: string;
  status: "Connected" | "Disconnected" | "Action required";
  lastSync?: string;
  scope?: string;
  icon: typeof Banknote;
};

function ConnectionsPage() {
  const [banking, setBanking] = useState<Conn[]>([
    {
      id: "td-flinks",
      name: "TD Canada Trust · Chequing ••3421",
      desc: "Auto-pulls 90 days of statements via Flinks. No credentials are stored.",
      status: "Connected",
      lastSync: "Today, 8:14 AM",
      scope: "Read transactions, balance",
      icon: Banknote,
    },
    {
      id: "rbc-flinks",
      name: "RBC · Savings ••8800",
      desc: "Used for down-payment verification.",
      status: "Action required",
      lastSync: "May 4 — re-auth needed",
      scope: "Read transactions",
      icon: Banknote,
    },
  ]);

  const [identity, setIdentity] = useState<Conn[]>([
    { id: "google", name: "Google", desc: "Sign in with Google · alex.thompson@gmail.com", status: "Connected", icon: Chrome },
    { id: "apple", name: "Apple", desc: "Sign in with Apple", status: "Disconnected", icon: Apple },
  ]);

  const [productivity, setProductivity] = useState<Conn[]>([
    {
      id: "gcal",
      name: "Google Calendar",
      desc: "Auto-add advisor calls, signing appointments, and renewal reminders.",
      status: "Connected",
      scope: "Read + write events on the 'approvU' calendar",
      icon: CalendarDays,
    },
    { id: "ical", name: "Apple Calendar (iCloud)", desc: "Subscribe via secure ICS feed.", status: "Disconnected", icon: CalendarDays },
  ]);

  const flip = (
    list: Conn[],
    setter: (v: Conn[]) => void,
    id: string,
    target: Conn["status"],
  ) => setter(list.map((c) => (c.id === id ? { ...c, status: target, lastSync: target === "Connected" ? "Just now" : c.lastSync } : c)));

  return (
    <div className="space-y-6">
      <SettingPane title="Banking & income" desc="Connect a bank to auto-pull statements and pay history. We use Flinks; nothing is stored on our servers.">
        <div className="space-y-3">
          {banking.map((c) => (
            <ConnRow key={c.id} c={c}
              onConnect={() => { flip(banking, setBanking, c.id, "Connected"); toast.success(`${c.name} reconnected`); }}
              onDisconnect={() => { flip(banking, setBanking, c.id, "Disconnected"); toast(`${c.name} disconnected`); }}
            />
          ))}
          <button
            onClick={() => toast("Choose your bank in the secure Flinks window")}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            <Building2 className="h-4 w-4" /> Add another bank account
          </button>
        </div>
      </SettingPane>

      <SettingPane title="Sign-in providers" desc="Use Google or Apple to sign in. Disconnecting won't delete your approvU account.">
        <div className="space-y-3">
          {identity.map((c) => (
            <ConnRow key={c.id} c={c}
              onConnect={() => { flip(identity, setIdentity, c.id, "Connected"); toast.success(`${c.name} connected`); }}
              onDisconnect={() => { flip(identity, setIdentity, c.id, "Disconnected"); toast(`${c.name} disconnected`); }}
            />
          ))}
        </div>
      </SettingPane>

      <SettingPane title="Calendar & productivity" desc="Sync key dates so nothing slips between your inbox and the closing date.">
        <div className="space-y-3">
          {productivity.map((c) => (
            <ConnRow key={c.id} c={c}
              onConnect={() => { flip(productivity, setProductivity, c.id, "Connected"); toast.success(`${c.name} connected`); }}
              onDisconnect={() => { flip(productivity, setProductivity, c.id, "Disconnected"); toast(`${c.name} disconnected`); }}
            />
          ))}
        </div>
      </SettingPane>

      <Row
        title="What happens when I disconnect?"
        desc="We immediately stop syncing new data. Documents already pulled remain in your vault unless you delete them."
        action={<Plug className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  );
}

function ConnRow({ c, onConnect, onDisconnect }: { c: Conn; onConnect: () => void; onDisconnect: () => void }) {
  const tone =
    c.status === "Connected"
      ? "bg-mint/30 text-foreground"
      : c.status === "Action required"
        ? "bg-coral/15 text-coral"
        : "bg-muted text-muted-foreground";
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <c.icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{c.name}</p>
          <p className="text-xs text-muted-foreground">{c.desc}</p>
          {(c.lastSync || c.scope) && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {c.lastSync && <span>Last sync: {c.lastSync}</span>}
              {c.lastSync && c.scope && <span> · </span>}
              {c.scope && <span>Scope: {c.scope}</span>}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
          {c.status === "Connected" && <CheckCircle2 className="h-3 w-3" />}
          {c.status}
        </span>
        {c.status === "Connected" ? (
          <button onClick={onDisconnect} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
            <Trash2 className="h-3.5 w-3.5" /> Disconnect
          </button>
        ) : (
          <button onClick={onConnect} className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="h-3.5 w-3.5" /> {c.status === "Action required" ? "Reconnect" : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}