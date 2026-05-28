import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { HeartPulse, Trash2, ShieldCheck, Plus } from "lucide-react";
import { SettingPane, Field, SelectField, ToggleRow } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Contact & Beneficiary — approvU Settings" },
      {
        name: "description",
        content:
          "Add an emergency contact and beneficiary so we can support your file during life events.",
      },
    ],
  }),
  component: EmergencyPage,
});

type Person = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  share: "Status only" | "Full file" | "On request";
};

function EmergencyPage() {
  const [emergency, setEmergency] = useState<Person[]>([]);
  const [beneficiary, setBeneficiary] = useState({
    name: "",
    relationship: "Spouse",
    dob: "",
    sin: "",
    share: "100",
    notes: "",
  });
  const [trustedReleases, setTrustedReleases] = useState({
    incapacity: true,
    death: true,
    divorce: false,
  });

  const updateEmergency = (id: string, patch: Partial<Person>) =>
    setEmergency((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-6">
      <SettingPane
        title="Emergency contact"
        desc="Someone we can reach if we can't reach you about a time-sensitive item (closing date, funding, etc.)."
        onSave={() => toast.success("Emergency contact saved")}
      >
        <div className="space-y-4">
          {emergency.map((p) => (
            <div key={p.id} className="space-y-3 rounded-xl border border-border bg-background p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Full name"
                  value={p.name}
                  onChange={(v) => updateEmergency(p.id, { name: v })}
                />
                <SelectField
                  label="Relationship"
                  value={p.relationship}
                  onChange={(v) => updateEmergency(p.id, { relationship: v })}
                  options={[
                    "Spouse",
                    "Partner",
                    "Parent",
                    "Sibling",
                    "Adult child",
                    "Friend",
                    "Lawyer",
                    "Other",
                  ]}
                />
                <Field
                  label="Phone"
                  value={p.phone}
                  onChange={(v) => updateEmergency(p.id, { phone: v })}
                />
                <Field
                  label="Email"
                  value={p.email}
                  type="email"
                  onChange={(v) => updateEmergency(p.id, { email: v })}
                />
              </div>
              <SelectField
                label="What can we share with them?"
                value={p.share}
                onChange={(v) => updateEmergency(p.id, { share: v as Person["share"] })}
                options={["Status only", "Full file", "On request"]}
              />
              {emergency.length > 1 && (
                <button
                  onClick={() => setEmergency((l) => l.filter((x) => x.id !== p.id))}
                  className="inline-flex items-center gap-1 text-xs text-coral hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() =>
              setEmergency((l) => [
                ...l,
                {
                  id: `p${Date.now()}`,
                  name: "",
                  relationship: "Spouse",
                  phone: "",
                  email: "",
                  share: "Status only",
                },
              ])
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add another contact
          </button>
        </div>
      </SettingPane>

      <SettingPane
        title="Beneficiary"
        desc="Used by mortgage life insurance and survivor benefits in the Home Life bundle. You can update this any time."
        onSave={() => toast.success("Beneficiary saved")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Beneficiary name"
            value={beneficiary.name}
            onChange={(v) => setBeneficiary({ ...beneficiary, name: v })}
          />
          <SelectField
            label="Relationship"
            value={beneficiary.relationship}
            onChange={(v) => setBeneficiary({ ...beneficiary, relationship: v })}
            options={[
              "Spouse",
              "Partner",
              "Parent",
              "Sibling",
              "Adult child",
              "Trust / Estate",
              "Other",
            ]}
          />
          <Field
            label="Date of birth"
            value={beneficiary.dob}
            type="date"
            onChange={(v) => setBeneficiary({ ...beneficiary, dob: v })}
          />
          <Field
            label="SIN (optional, encrypted)"
            value={beneficiary.sin}
            onChange={(v) => setBeneficiary({ ...beneficiary, sin: v })}
          />
          <Field
            label="Allocation %"
            value={beneficiary.share}
            type="number"
            onChange={(v) => setBeneficiary({ ...beneficiary, share: v })}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2 text-xs text-foreground">
          <ShieldCheck className="h-4 w-4 text-secondary" />
          Beneficiary details are encrypted at rest and only released under the trusted-release
          rules below.
        </div>
      </SettingPane>

      <SettingPane
        title="Life-event handling"
        desc="Decide when approvU is allowed to share your file with your emergency contact or estate without further authorization."
        onSave={() => toast.success("Release rules saved")}
      >
        <div className="grid gap-3 sm:grid-cols-1">
          <ToggleRow
            title="Incapacity (medical)"
            desc="Release the file once a licensed physician confirms incapacity in writing."
            checked={trustedReleases.incapacity}
            onChange={(v) => setTrustedReleases({ ...trustedReleases, incapacity: v })}
          />
          <ToggleRow
            title="Death"
            desc="Release file to estate trustee with certified death certificate."
            checked={trustedReleases.death}
            onChange={(v) => setTrustedReleases({ ...trustedReleases, death: v })}
          />
          <ToggleRow
            title="Divorce / separation"
            desc="Release joint-applicant scope to your lawyer with court order."
            checked={trustedReleases.divorce}
            onChange={(v) => setTrustedReleases({ ...trustedReleases, divorce: v })}
          />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-mint/15 px-3 py-2 text-xs text-foreground">
          <HeartPulse className="h-4 w-4 text-primary" />
          You can revoke or change these rules at any time. Each release is logged in your access
          log.
        </div>
      </SettingPane>
    </div>
  );
}
