import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  ChoiceGrid,
  CompletionSummaryPanel,
  Field,
  FormCard,
  InfoNote,
  MissingFieldsPanel,
  NumberInput,
  PROVINCES,
  PageHeader,
  PageShell,
  SaveAndContinueBar,
  TxType,
  inputCls,
} from "@/components/property-financing/shared";

export const Route = createFileRoute(
  "/applications/$applicationId/property-financing/purchase-plan",
)({
  head: () => ({
    meta: [
      { title: "Your Purchase Plan — approvU" },
      { name: "description", content: "Tell us about your buying timeline, target price, and location." },
    ],
  }),
  component: PurchasePlanPage,
});

type Loc = { id: string; city: string; province: string };

function PurchasePlanPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Pre-Purchase";

  const [timeline, setTimeline] = useState("");
  const [target, setTarget] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [confidence, setConfidence] = useState("");
  const [locations, setLocations] = useState<Loc[]>([
    { id: "l-1", city: "", province: "" },
  ]);
  const [hasProperty, setHasProperty] = useState<"yes" | "no" | "">("");
  const [firstTime, setFirstTime] = useState("");
  const [intendedUse, setIntendedUse] = useState("");

  const addLocation = () =>
    setLocations((p) => (p.length >= 5 ? p : [...p, { id: `l-${Date.now()}`, city: "", province: "" }]));
  const updateLoc = (id: string, p: Partial<Loc>) =>
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const removeLoc = (id: string) =>
    setLocations((prev) => prev.filter((l) => l.id !== id));

  const groupsDone = [
    !!timeline,
    !!target,
    locations.some((l) => l.city && l.province),
    !!hasProperty,
    !!firstTime,
    !!intendedUse,
  ];
  const progress = Math.round((groupsDone.filter(Boolean).length / groupsDone.length) * 100);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!timeline) m.push("Choose a buying timeline");
    if (!target) m.push("Enter a target purchase price");
    if (!locations.some((l) => l.city && l.province)) m.push("Add at least one preferred location");
    if (!hasProperty) m.push("Tell us if you already have a property in mind");
    if (!firstTime) m.push("Confirm first-time buyer status");
    if (!intendedUse) m.push("Confirm intended property use");
    return m;
  }, [timeline, target, locations, hasProperty, firstTime, intendedUse]);

  const canComplete = missing.length === 0;

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        title="Your Purchase Plan"
        subtitle="Tell us about your buying timeline, target price, location, and whether you already have a property in mind."
        tx={tx}
        progress={progress}
      />
      <CompletionSummaryPanel total={groupsDone.length} done={groupsDone.filter(Boolean).length} />

      <FormCard step={1} title="Buying Timeline" done={groupsDone[0]}>
        <Field label="When are you hoping to buy?" required>
          <ChoiceGrid
            value={timeline}
            onChange={setTimeline}
            cols={3}
            options={[
              { value: "0-30d", label: "0–30 days" },
              { value: "1-3m", label: "1–3 months" },
              { value: "3-6m", label: "3–6 months" },
              { value: "6-12m", label: "6–12 months" },
              { value: "12m+", label: "More than 12 months" },
              { value: "unsure", label: "Not sure yet" },
            ]}
          />
        </Field>
      </FormCard>

      <FormCard step={2} title="Target Purchase Price" done={groupsDone[1]}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Target purchase price" required>
            <NumberInput value={target} onChange={setTarget} prefix="$" />
          </Field>
          <Field label="Minimum budget">
            <NumberInput value={budgetMin} onChange={setBudgetMin} prefix="$" />
          </Field>
          <Field label="Maximum budget">
            <NumberInput value={budgetMax} onChange={setBudgetMax} prefix="$" />
          </Field>
        </div>
        <Field label="How confident are you in this target price?">
          <ChoiceGrid
            value={confidence}
            onChange={setConfidence}
            cols={4}
            options={[
              { value: "very", label: "Very confident" },
              { value: "somewhat", label: "Somewhat confident" },
              { value: "estimate", label: "Just estimating" },
              { value: "unsure", label: "Not sure" },
            ]}
          />
        </Field>
      </FormCard>

      <FormCard step={3} title="Where Are You Hoping to Buy?" done={groupsDone[2]}>
        <div className="space-y-3">
          {locations.map((l, i) => (
            <div key={l.id} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <Field label={`Preferred city ${i + 1}`} required={i === 0}>
                  <input className={inputCls} value={l.city} onChange={(e) => updateLoc(l.id, { city: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Province" required={i === 0}>
                  <select className={inputCls} value={l.province} onChange={(e) => updateLoc(l.id, { province: e.target.value })}>
                    <option value="">—</option>
                    {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
              <div className="sm:col-span-1 flex items-end">
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLoc(l.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-2 text-[11px] text-coral hover:bg-muted"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {locations.length < 5 && (
          <button
            type="button"
            onClick={addLocation}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add another location
          </button>
        )}
      </FormCard>

      <FormCard step={4} title="Property Selected?" done={groupsDone[3]}>
        <Field label="Do you already have a property you want to purchase?" required>
          <ChoiceGrid<"yes" | "no">
            value={hasProperty as any}
            onChange={setHasProperty}
            options={[
              { value: "yes", label: "Yes, I have a property address" },
              { value: "no", label: "No, I am still shopping" },
            ]}
          />
        </Field>
        {hasProperty === "yes" && (
          <div>
            <InfoNote variant="success">
              Great. We’ll collect the subject property details next so your application can move closer to a purchase application.
            </InfoNote>
            <button
              onClick={() =>
                navigate({
                  to: "/portal/applications/$applicationId/property-financing/property",
                  params: { applicationId },
                })
              }
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Continue to About the Property
            </button>
          </div>
        )}
      </FormCard>

      <FormCard step={5} title="First-Time Buyer" done={groupsDone[4]}>
        <Field label="Is this your first time buying a home in Canada?" required>
          <ChoiceGrid
            value={firstTime}
            onChange={setFirstTime}
            cols={3}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unsure", label: "Not sure" },
            ]}
          />
        </Field>
      </FormCard>

      <FormCard step={6} title="Intended Use" done={groupsDone[5]}>
        <Field label="How do you plan to use the property?" required>
          <ChoiceGrid
            value={intendedUse}
            onChange={setIntendedUse}
            cols={2}
            options={[
              { value: "primary", label: "Primary residence" },
              { value: "investment", label: "Investment / rental" },
              { value: "second", label: "Second home" },
              { value: "ooru", label: "Owner-occupied with rental unit" },
              { value: "unsure", label: "Not sure" },
            ]}
          />
        </Field>
      </FormCard>

      <MissingFieldsPanel items={missing} />

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={canComplete}
        onSaveContinue={() =>
          navigate({
            to:
              hasProperty === "yes"
                ? "/portal/applications/$applicationId/property-financing/property"
                : "/portal/applications/$applicationId/property-financing/target-property",
            params: { applicationId },
          })
        }
      />
    </PageShell>
  );
}