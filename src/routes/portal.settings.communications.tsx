import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageSquare, Smartphone, Bell as BellIcon, Phone } from "lucide-react";
import { SettingPane, SelectField } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/communications")({
  head: () => ({
    meta: [
      { title: "Communication Preferences — approvU Settings" },
      { name: "description", content: "Choose which channel — email, SMS, push, or in-app — receives each type of notification." },
    ],
  }),
  component: CommunicationsPage,
});

const CHANNELS = [
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
  { key: "push", label: "Push", icon: Smartphone },
  { key: "inApp", label: "In-app", icon: BellIcon },
] as const;
type ChannelKey = typeof CHANNELS[number]["key"];

const EVENTS: { key: string; label: string; desc: string; group: string }[] = [
  { key: "appStatus", label: "Application status changes", desc: "Stage transitions and decisions", group: "Application" },
  { key: "brokerMsg", label: "Advisor messages", desc: "New messages from your broker", group: "Application" },
  { key: "lender", label: "Lender decision updates", desc: "Submissions, approvals, declines", group: "Application" },
  { key: "funding", label: "Funding & closing", desc: "Closing date confirmations", group: "Application" },
  { key: "docNew", label: "Document requested", desc: "New uploads needed", group: "Documents" },
  { key: "docReview", label: "Document review result", desc: "Accepted or rejected", group: "Documents" },
  { key: "docExpiry", label: "Document expiring", desc: "Pay stubs / NOAs going stale", group: "Documents" },
  { key: "condDue", label: "Condition due soon", desc: "Within 3 days of due date", group: "Documents" },
  { key: "offerNew", label: "New mortgage offers", desc: "When a lender match arrives", group: "Offers & rates" },
  { key: "rateAlert", label: "Rate alert triggers", desc: "Your watched rate is hit", group: "Offers & rates" },
  { key: "renewal", label: "Renewal reminders", desc: "12, 6, and 90 day touchpoints", group: "Offers & rates" },
  { key: "wallet", label: "Home Life Wallet perks", desc: "New benefits and expiry warnings", group: "Wallet & rewards" },
  { key: "referral", label: "Referral activity", desc: "Friends signing up or funding", group: "Wallet & rewards" },
  { key: "security", label: "Security alerts", desc: "Sign-in attempts, device changes", group: "Account & security" },
  { key: "policy", label: "Policy & disclosure updates", desc: "New versions to review", group: "Account & security" },
  { key: "marketing", label: "Tips & education", desc: "Optional educational content", group: "Marketing" },
];

type Matrix = Record<string, Record<ChannelKey, boolean>>;

const DEFAULTS: Matrix = Object.fromEntries(
  EVENTS.map((e) => [
    e.key,
    {
      email: e.group !== "Marketing",
      sms: ["security", "condDue", "funding", "rateAlert"].includes(e.key),
      push: ["brokerMsg", "appStatus", "offerNew", "rateAlert", "security"].includes(e.key),
      inApp: true,
    },
  ]),
) as Matrix;

function CommunicationsPage() {
  const [matrix, setMatrix] = useState<Matrix>(DEFAULTS);
  const [quietHours, setQuietHours] = useState({ start: "9:00 PM", end: "7:00 AM" });
  const [digest, setDigest] = useState("Real-time");

  const toggle = (eventKey: string, channel: ChannelKey) =>
    setMatrix((m) => ({ ...m, [eventKey]: { ...m[eventKey], [channel]: !m[eventKey][channel] } }));

  const groups = Array.from(new Set(EVENTS.map((e) => e.group)));

  return (
    <div className="space-y-6">
      <SettingPane
        title="Channel × event matrix"
        desc="Pick exactly which channel delivers each event type. Disable a channel everywhere to silence it."
        onSave={() => toast.success("Communication preferences saved")}
      >
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Event</th>
                {CHANNELS.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <c.icon className="h-3.5 w-3.5" /> {c.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={`g-${g}`}>
                  <td colSpan={5} className="bg-muted/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-secondary">
                    {g}
                  </td>
                </tr>
              )).flatMap((header, gi) => [
                header,
                ...EVENTS.filter((e) => e.group === groups[gi]).map((e) => (
                  <tr key={e.key} className="border-t border-border">
                    <td className="px-3 py-2.5 align-top">
                      <p className="font-medium text-foreground">{e.label}</p>
                      <p className="text-xs text-muted-foreground">{e.desc}</p>
                    </td>
                    {CHANNELS.map((c) => (
                      <td key={c.key} className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${e.label} via ${c.label}`}
                          checked={matrix[e.key][c.key]}
                          onChange={() => toggle(e.key, c.key)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                      </td>
                    ))}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </SettingPane>

      <SettingPane title="Delivery rules" desc="Quiet hours and digest cadence apply to all channels except security alerts." onSave={() => toast.success("Delivery rules saved")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Quiet hours start" value={quietHours.start} onChange={(v) => setQuietHours((q) => ({ ...q, start: v }))} options={["Off", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"]} />
          <SelectField label="Quiet hours end" value={quietHours.end} onChange={(v) => setQuietHours((q) => ({ ...q, end: v }))} options={["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"]} />
          <SelectField label="Email digest cadence" value={digest} onChange={setDigest} options={["Real-time", "Daily summary", "Weekly digest"]} />
        </div>
      </SettingPane>

      <SettingPane title="Verified delivery channels" desc="Add or verify channels in your profile to use them above.">
        <div className="grid gap-3 sm:grid-cols-2">
          <ChannelStatus icon={Mail} label="alex.thompson@email.com" status="Verified email" />
          <ChannelStatus icon={MessageSquare} label="(416) 555-0142" status="Verified SMS" />
          <ChannelStatus icon={Smartphone} label="iPhone 16 Pro · approvU mobile" status="Push enabled" />
          <ChannelStatus icon={Phone} label="Voice calls — only for time-sensitive items" status="Off" warn />
        </div>
      </SettingPane>
    </div>
  );
}

function ChannelStatus({ icon: Icon, label, status, warn }: { icon: typeof Mail; label: string; status: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${warn ? "bg-muted text-muted-foreground" : "bg-mint/30 text-foreground"}`}>{status}</span>
    </div>
  );
}