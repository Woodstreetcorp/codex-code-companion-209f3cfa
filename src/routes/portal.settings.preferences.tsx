import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SettingPane, SelectField, ToggleRow } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/preferences")({
  head: () => ({
    meta: [
      { title: "Preferences — approvU Settings" },
      { name: "description", content: "Personalize your portal, mortgage, accessibility, and regional preferences." },
    ],
  }),
  component: PreferencesPage,
});

function PreferencesPage() {
  const [portal, setPortal] = useState({ landing: "Overview", theme: "System default", density: "Comfortable" });
  const [mortgage, setMortgage] = useState({
    rate: "Fixed", term: "5 years", frequency: "Monthly", risk: "Balanced", style: "Detailed",
  });
  const [bundle, setBundle] = useState({ insurance: true, smart: false, green: true, moving: true, legal: false, maintenance: true });
  const [a11y, setA11y] = useState({ largerText: false, reduceMotion: false, highContrast: false, screenReader: false });
  const [region, setRegion] = useState({ province: "Ontario", timezone: "America/Toronto", language: "English" });
  const t = <T,>(setter: (fn: (p: T) => T) => void, k: keyof T) => (v: boolean) => setter((p) => ({ ...p, [k]: v }));
  const save = (label: string) => () => toast.success(`${label} saved`);

  return (
    <div className="space-y-6">
      <SettingPane title="Portal preferences" desc="Tune how the portal looks and feels for you." onSave={save("Portal preferences")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Default landing page"
            value={portal.landing}
            onChange={(v) => setPortal((p) => ({ ...p, landing: v }))}
            options={["Overview", "Applications", "Documents", "Wallet"]}
          />
          <SelectField
            label="Theme"
            value={portal.theme}
            onChange={(v) => setPortal((p) => ({ ...p, theme: v }))}
            options={["System default", "Light", "Dark (coming soon)"]}
          />
          <SelectField
            label="Dashboard density"
            value={portal.density}
            onChange={(v) => setPortal((p) => ({ ...p, density: v }))}
            options={["Comfortable", "Compact"]}
          />
        </div>
      </SettingPane>

      <SettingPane title="Mortgage preferences" desc="We'll use these to personalize your offers and reminders." onSave={save("Mortgage preferences")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Preferred rate type" value={mortgage.rate} onChange={(v) => setMortgage((p) => ({ ...p, rate: v }))} options={["Fixed", "Variable", "No preference"]} />
          <SelectField label="Preferred term length" value={mortgage.term} onChange={(v) => setMortgage((p) => ({ ...p, term: v }))} options={["1 year", "2 years", "3 years", "4 years", "5 years", "No preference"]} />
          <SelectField label="Payment frequency" value={mortgage.frequency} onChange={(v) => setMortgage((p) => ({ ...p, frequency: v }))} options={["Monthly", "Semi-monthly", "Bi-weekly", "Accelerated bi-weekly", "Weekly"]} />
          <SelectField label="Risk comfort level" value={mortgage.risk} onChange={(v) => setMortgage((p) => ({ ...p, risk: v }))} options={["Conservative", "Balanced", "Flexible"]} />
          <SelectField label="Communication style" value={mortgage.style} onChange={(v) => setMortgage((p) => ({ ...p, style: v }))} options={["Detailed", "Concise", "Visual-first"]} />
        </div>
      </SettingPane>

      <SettingPane title="Home Life preferences" desc="Tell us which homeownership perks you'd like to see." onSave={save("Home Life preferences")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="Home insurance offers" desc="Bundle and shop coverage" checked={bundle.insurance} onChange={t(setBundle, "insurance")} />
          <ToggleRow title="Smart home offers" desc="Devices and security" checked={bundle.smart} onChange={t(setBundle, "smart")} />
          <ToggleRow title="Green home upgrades" desc="Energy & efficiency rebates" checked={bundle.green} onChange={t(setBundle, "green")} />
          <ToggleRow title="Moving services" desc="Movers, storage, supplies" checked={bundle.moving} onChange={t(setBundle, "moving")} />
          <ToggleRow title="Legal services" desc="Real-estate lawyers" checked={bundle.legal} onChange={t(setBundle, "legal")} />
          <ToggleRow title="Home maintenance" desc="Cleaning, HVAC, repairs" checked={bundle.maintenance} onChange={t(setBundle, "maintenance")} />
        </div>
      </SettingPane>

      <SettingPane title="Accessibility" desc="Adjust the portal to work better for you." onSave={save("Accessibility")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow title="Larger text" desc="Increase base font size" checked={a11y.largerText} onChange={t(setA11y, "largerText")} />
          <ToggleRow title="Reduce motion" desc="Minimize animations" checked={a11y.reduceMotion} onChange={t(setA11y, "reduceMotion")} />
          <ToggleRow title="High contrast mode" desc="Boost contrast for readability" checked={a11y.highContrast} onChange={t(setA11y, "highContrast")} />
          <ToggleRow title="Screen reader optimization" desc="Verbose labels & landmarks" checked={a11y.screenReader} onChange={t(setA11y, "screenReader")} />
        </div>
      </SettingPane>

      <SettingPane title="Regional preferences" desc="Set how dates, times, and currency are displayed." onSave={save("Regional preferences")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Province"
            value={region.province}
            onChange={(v) => setRegion((p) => ({ ...p, province: v }))}
            options={["Ontario", "British Columbia", "Alberta", "Saskatchewan", "Manitoba", "Quebec", "New Brunswick", "Nova Scotia", "Prince Edward Island", "Newfoundland and Labrador", "Yukon", "Northwest Territories", "Nunavut"]}
          />
          <SelectField
            label="Time zone"
            value={region.timezone}
            onChange={(v) => setRegion((p) => ({ ...p, timezone: v }))}
            options={["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg", "America/Halifax", "America/St_Johns"]}
          />
          <SelectField
            label="Language"
            value={region.language}
            onChange={(v) => setRegion((p) => ({ ...p, language: v }))}
            options={["English", "French"]}
          />
          <div>
            <span className="text-xs font-medium text-muted-foreground">Currency</span>
            <div className="mt-1 rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">CAD (fixed)</div>
          </div>
        </div>
      </SettingPane>
    </div>
  );
}