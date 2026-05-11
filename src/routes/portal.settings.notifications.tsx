import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SettingPane, ToggleRow, SelectField } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — approvU Settings" },
      { name: "description", content: "Choose how approvU keeps you informed across email, SMS, and in-app." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [s, setS] = useState({
    email: true, sms: true, inApp: true, phone: false,
    appStatus: true, brokerMsg: true, lender: true, decision: true, funding: true,
    docNew: true, docAccepted: true, docRejected: true, condAdded: true, condDue: true, overdue: true,
    offerNew: true, offerUpd: true, offerSelected: true, offerFinal: true,
    walletNew: true, walletExpiring: true, walletRedeem: false, walletPartner: false,
    mktTips: false, mktOffers: false, mktPartner: false, mktRenewal: true, mktUpdates: false,
    frequency: "Immediately",
  });
  const t = (k: keyof typeof s) => (v: boolean) => setS((p) => ({ ...p, [k]: v }));
  const save = () => toast.success("Notification preferences saved");

  return (
    <div className="space-y-6">
      <SettingPane title="Notification channels" desc="Choose how we reach you. SMS requires a verified phone, email requires a verified email." onSave={save}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="Email notifications" desc="alex.thompson@email.com · Verified" checked={s.email} onChange={t("email")} />
          <ToggleRow title="SMS notifications" desc="(416) 555-0142 · Verified" checked={s.sms} onChange={t("sms")} />
          <ToggleRow title="In-app notifications" desc="Show alerts in your portal" checked={s.inApp} onChange={t("inApp")} />
          <ToggleRow title="Phone call reminders" desc="Only for time-sensitive items" checked={s.phone} onChange={t("phone")} />
        </div>
      </SettingPane>

      <SettingPane title="Application updates" desc="Status changes, broker messages, and lender decisions." onSave={save}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="Application status changes" desc="Any change to your application stage" checked={s.appStatus} onChange={t("appStatus")} />
          <ToggleRow title="Broker / admin messages" desc="Direct messages from your team" checked={s.brokerMsg} onChange={t("brokerMsg")} />
          <ToggleRow title="Lender decision updates" desc="Submissions, approvals, declines" checked={s.lender} onChange={t("lender")} />
          <ToggleRow title="Approval / decline updates" desc="Final outcomes per application" checked={s.decision} onChange={t("decision")} />
          <ToggleRow title="Funding & closing updates" desc="Closing date, funding confirmation" checked={s.funding} onChange={t("funding")} />
        </div>
      </SettingPane>

      <SettingPane title="Documents & conditions" desc="Reminders for uploads, conditions, and approvals." onSave={save}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="New document request" desc="When a document is requested" checked={s.docNew} onChange={t("docNew")} />
          <ToggleRow title="Document accepted" desc="Confirmation when reviewed" checked={s.docAccepted} onChange={t("docAccepted")} />
          <ToggleRow title="Document rejected" desc="When a re-upload is needed" checked={s.docRejected} onChange={t("docRejected")} />
          <ToggleRow title="Condition added" desc="New lender condition on file" checked={s.condAdded} onChange={t("condAdded")} />
          <ToggleRow title="Condition due soon" desc="Within 3 days of due date" checked={s.condDue} onChange={t("condDue")} />
          <ToggleRow title="Overdue reminders" desc="When something past due needs you" checked={s.overdue} onChange={t("overdue")} />
        </div>
        <div className="mt-4 max-w-sm">
          <SelectField
            label="Reminder frequency"
            value={s.frequency}
            onChange={(v) => setS((p) => ({ ...p, frequency: v }))}
            options={["Immediately", "Daily summary", "Every 2 days", "Weekly", "Off"]}
          />
        </div>
      </SettingPane>

      <SettingPane title="Mortgage offers" desc="New offers, updates, and final product changes." onSave={save}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="New mortgage offers" desc="When new offers are matched" checked={s.offerNew} onChange={t("offerNew")} />
          <ToggleRow title="Offer updates" desc="Rate, term, or condition changes" checked={s.offerUpd} onChange={t("offerUpd")} />
          <ToggleRow title="Selected offer changes" desc="Updates to your chosen offer" checked={s.offerSelected} onChange={t("offerSelected")} />
          <ToggleRow title="Final product updates" desc="Once your product is locked" checked={s.offerFinal} onChange={t("offerFinal")} />
        </div>
      </SettingPane>

      <SettingPane title="Home Life Wallet" desc="Benefits, perks, and partner offers in your wallet." onSave={save}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="New benefit available" desc="When a new perk is added" checked={s.walletNew} onChange={t("walletNew")} />
          <ToggleRow title="Benefit expiring soon" desc="Use it before it expires" checked={s.walletExpiring} onChange={t("walletExpiring")} />
          <ToggleRow title="Coupon redeemed" desc="Confirmation of redemption" checked={s.walletRedeem} onChange={t("walletRedeem")} />
          <ToggleRow title="Partner offer updates" desc="Limited-time partner deals" checked={s.walletPartner} onChange={t("walletPartner")} />
        </div>
      </SettingPane>

      <SettingPane title="Marketing preferences" desc="Tips, education, and offers from approvU." onSave={save}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="Mortgage tips & education" desc="Helpful guides and explainers" checked={s.mktTips} onChange={t("mktTips")} />
          <ToggleRow title="Homeownership offers" desc="Curated services for your home" checked={s.mktOffers} onChange={t("mktOffers")} />
          <ToggleRow title="Partner offers" desc="Trusted partner promotions" checked={s.mktPartner} onChange={t("mktPartner")} />
          <ToggleRow title="Renewal & refinance reminders" desc="Stay ahead of key dates" checked={s.mktRenewal} onChange={t("mktRenewal")} />
          <ToggleRow title="Product updates" desc="What's new in your portal" checked={s.mktUpdates} onChange={t("mktUpdates")} />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          You can unsubscribe from marketing messages at any time. We'll still send important account and application notifications.
        </p>
      </SettingPane>
    </div>
  );
}