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
  "/applications/$applicationId/property-financing/target-property",
)({
  head: () => ({
    meta: [
      { title: "Target Property Preferences — approvU" },
      { name: "description", content: "Tell us what type of property you are looking for." },
    ],
  }),
  component: TargetPropertyPage,
});

const PROPERTY_TYPES = [
  "Detached", "Semi-Detached", "Townhouse", "Condo",
  "Duplex", "Triplex", "Fourplex", "New Construction", "Not sure",
];

type Loc = { id: string; city: string; province: string; priority: string };

function TargetPropertyPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Pre-Purchase";

  const [locations, setLocations] = useState<Loc[]>([{ id: "l-1", city: "", province: "", priority: "1" }]);
  const [types, setTypes] = useState<string[]>([]);
  const [usage, setUsage] = useState("");
  const [target, setTarget] = useState("450000");
  const [dpAmount, setDpAmount] = useState("");
  const [maxPayment, setMaxPayment] = useState("");
  const [newBuild, setNewBuild] = useState("");
  const [condoPref, setCondoPref] = useState("");
  const [condoFee, setCondoFee] = useState("");

  const dpPct = Number(target) > 0 ? (Number(dpAmount || 0) / Number(target)) * 100 : 0;

  const addLoc = () => setLocations((p) => (p.length >= 5 ? p : [...p, { id: `l-${Date.now()}`, city: "", province: "", priority: String(p.length + 1) }]));
  const updateLoc = (id: string, p: Partial<Loc>) => setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const removeLoc = (id: string) => setLocations((prev) => prev.filter((l) => l.id !== id));

  const groupsDone = [
    locations.some((l) => l.city && l.province),
    types.length > 0,
    !!usage,
    !!target && !!dpAmount,
    !!newBuild && !!condoPref,
  ];
  const progress = Math.round((groupsDone.filter(Boolean).length / groupsDone.length) * 100);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!locations.some((l) => l.city && l.province)) m.push("Add at least one preferred location");
    if (types.length === 0) m.push("Pick at least one property type");
    if (!usage) m.push("Select intended property usage");
    if (!target) m.push("Confirm your target purchase price");
    if (!dpAmount) m.push("Enter your expected down payment amount");
    if (!newBuild) m.push("Answer the new construction question");
    if (!condoPref) m.push("Answer the condo question");
    return m;
  }, [locations, types, usage, target, dpAmount, newBuild, condoPref]);

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        title="Target Property Preferences"
        subtitle="Tell us what type of property you are looking for so we can guide your mortgage application."
        tx={tx}
        progress={progress}
      />
      <CompletionSummaryPanel total={groupsDone.length} done={groupsDone.filter(Boolean).length} />

      <FormCard step={1} title="Preferred Locations" done={groupsDone[0]} description="Up to 5 locations.">
        <div className="space-y-3">
          {locations.map((l, i) => (
            <div key={l.id} className="grid grid-cols-1 gap-3 sm:grid-cols-7">
              <div className="sm:col-span-3">
                <Field label="City" required={i === 0}>
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
              <div className="sm:col-span-1">
                <Field label="Priority">
                  <input className={inputCls} value={l.priority} onChange={(e) => updateLoc(l.id, { priority: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-1 flex items-end">
                {locations.length > 1 && (
                  <button onClick={() => removeLoc(l.id)} className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-2 text-[11px] text-coral hover:bg-muted">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {locations.length < 5 && (
          <button onClick={addLoc} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Plus className="h-3 w-3" /> Add another location
          </button>
        )}
      </FormCard>

      <FormCard step={2} title="Property Type Preference" done={groupsDone[1]} description="Select all that apply.">
        <ChoiceGrid<string>
          multi
          values={types}
          onMultiChange={setTypes}
          cols={3}
          options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))}
        />
      </FormCard>

      <FormCard step={3} title="Property Usage" done={groupsDone[2]}>
        <Field label="How do you plan to use the property?" required>
          <ChoiceGrid
            value={usage}
            onChange={setUsage}
            cols={3}
            options={[
              { value: "primary", label: "Primary residence" },
              { value: "rental", label: "Rental property" },
              { value: "second", label: "Second home" },
              { value: "mixed", label: "Mixed use" },
              { value: "unsure", label: "Not sure" },
            ]}
          />
        </Field>
      </FormCard>

      <FormCard step={4} title="Budget & Down Payment Readiness" done={groupsDone[3]}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Target purchase price" required>
            <NumberInput value={target} onChange={setTarget} prefix="$" />
          </Field>
          <Field label="Expected down payment" required>
            <NumberInput value={dpAmount} onChange={setDpAmount} prefix="$" />
          </Field>
          <Field label="Expected down payment %">
            <input className={inputCls} value={`${dpPct.toFixed(1)}%`} readOnly />
          </Field>
          <Field label="Maximum comfortable monthly payment">
            <NumberInput value={maxPayment} onChange={setMaxPayment} prefix="$" suffix="/mo" />
          </Field>
        </div>
      </FormCard>

      <FormCard step={5} title="New Build / Condo Preferences" done={groupsDone[4]}>
        <Field label="Are you considering a new construction property?" required>
          <ChoiceGrid
            value={newBuild}
            onChange={setNewBuild}
            cols={3}
            options={[
              { value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "maybe", label: "Maybe" },
            ]}
          />
        </Field>
        <Field label="Are you considering a condo?" required>
          <ChoiceGrid
            value={condoPref}
            onChange={setCondoPref}
            cols={3}
            options={[
              { value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "maybe", label: "Maybe" },
            ]}
          />
        </Field>
        {(condoPref === "yes" || condoPref === "maybe") && (
          <Field label="Estimated monthly condo fee">
            <NumberInput value={condoFee} onChange={setCondoFee} prefix="$" suffix="/mo" />
          </Field>
        )}
      </FormCard>

      <InfoNote>
        Because you do not have a specific property yet, this application may be treated as a pre-purchase / pre-approval file. Final approval will require property details later.
      </InfoNote>

      <div className="h-4" />

      <MissingFieldsPanel items={missing} />

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={missing.length === 0}
        onSaveContinue={() =>
          navigate({
            to: "/applications/$applicationId/property-financing/down-payment",
            params: { applicationId },
          })
        }
      />
    </PageShell>
  );
}