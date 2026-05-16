import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Plus, Trash2 } from "lucide-react";
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
import {
  getBorrowerApplicationSection,
  saveBorrowerApplicationSection,
} from "@/lib/api/borrowerApplicationSectionsApi";

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
  "Detached",
  "Semi-Detached",
  "Townhouse",
  "Condo",
  "Duplex",
  "Triplex",
  "Fourplex",
  "New Construction",
  "Not sure",
];

type Loc = { id: string; city: string; province: string; priority: string };

// ── Restore state ─────────────────────────────────────────────────────────────

type RestoreSource = "saved" | "prefill" | "none";

function TargetPropertyPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Pre-Purchase";

  // Form state — all start empty; populated by restore useEffect
  const [locations, setLocations] = useState<Loc[]>([
    { id: "l-1", city: "", province: "", priority: "1" },
  ]);
  const [types, setTypes] = useState<string[]>([]);
  const [usage, setUsage] = useState("");
  const [target, setTarget] = useState("");
  const [dpAmount, setDpAmount] = useState("");
  const [maxPayment, setMaxPayment] = useState("");
  const [newBuild, setNewBuild] = useState("");
  const [condoPref, setCondoPref] = useState("");
  const [condoFee, setCondoFee] = useState("");

  // ── Restore state ────────────────────────────────────────────────────────────
  const [loadingRestore, setLoadingRestore] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSource, setRestoreSource] = useState<RestoreSource>("none");

  // Guard: prevent applying restore after the user has made any edit.
  // Set to true the moment any input changes.
  const userEditedRef = useRef(false);

  // ── Save state ───────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Restore on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    getBorrowerApplicationSection("property")
      .then((res) => {
        if (cancelled || userEditedRef.current) return;

        const section = res.section;
        const effective = section?.effective_data as Record<string, unknown> | null | undefined;

        if (!effective || Object.keys(effective).length === 0) {
          setRestoreSource("none");
          return;
        }

        // Determine whether saved data or prefill drove effective_data
        const saved = section?.data;
        const hasSaved = saved != null && !Array.isArray(saved) && Object.keys(saved).length > 0;
        setRestoreSource(hasSaved ? "saved" : "prefill");

        // Map locations → add UI id
        const locs = effective.locations as
          | Array<{ city: string; province: string; priority: string }>
          | undefined;
        if (Array.isArray(locs) && locs.length > 0) {
          setLocations(
            locs.map((l, i) => ({
              id: `r-${i}-${Date.now()}`,
              city: l.city ?? "",
              province: l.province ?? "",
              priority: l.priority ?? String(i + 1),
            })),
          );
        }

        // Property types
        if (Array.isArray(effective.property_types) && effective.property_types.length > 0) {
          setTypes(effective.property_types as string[]);
        }

        // Property usage
        if (typeof effective.property_usage === "string" && effective.property_usage) {
          setUsage(effective.property_usage);
        }

        // Numeric fields → convert to string for controlled inputs
        if (effective.target_purchase_price != null) {
          setTarget(String(effective.target_purchase_price));
        }
        if (effective.expected_down_payment != null) {
          setDpAmount(String(effective.expected_down_payment));
        }
        if (effective.max_monthly_payment != null) {
          setMaxPayment(String(effective.max_monthly_payment));
        }

        // New build / condo preferences
        if (
          typeof effective.considering_new_build === "string" &&
          effective.considering_new_build
        ) {
          setNewBuild(effective.considering_new_build);
        }
        if (typeof effective.considering_condo === "string" && effective.considering_condo) {
          setCondoPref(effective.considering_condo);
        }
        if (effective.estimated_condo_fee != null) {
          setCondoFee(String(effective.estimated_condo_fee));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRestoreError(
            "We could not restore your saved property details. You can continue entering them manually.",
          );
          setRestoreSource("none");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRestore(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const dpPct = Number(target) > 0 ? (Number(dpAmount || 0) / Number(target)) * 100 : 0;

  // ── Location helpers ─────────────────────────────────────────────────────────
  const addLoc = () => {
    userEditedRef.current = true;
    setLocations((p) =>
      p.length >= 5
        ? p
        : [...p, { id: `l-${Date.now()}`, city: "", province: "", priority: String(p.length + 1) }],
    );
  };
  const updateLoc = (id: string, p: Partial<Loc>) => {
    userEditedRef.current = true;
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...p } : l)));
    setSaveStatus("unsaved");
  };
  const removeLoc = (id: string) => {
    userEditedRef.current = true;
    setLocations((prev) => prev.filter((l) => l.id !== id));
    setSaveStatus("unsaved");
  };

  // Mark dirty on any choice/input change
  const markDirty = () => {
    userEditedRef.current = true;
    setSaveStatus("unsaved");
  };

  // ── Section save helper ──────────────────────────────────────────────────────
  const buildSectionData = () => ({
    locations: locations.map(({ city, province, priority }) => ({ city, province, priority })),
    property_types: types,
    property_usage: usage,
    target_purchase_price: target ? Number(target) : null,
    expected_down_payment: dpAmount ? Number(dpAmount) : null,
    max_monthly_payment: maxPayment ? Number(maxPayment) : null,
    considering_new_build: newBuild || null,
    considering_condo: condoPref || null,
    estimated_condo_fee: condoFee ? Number(condoFee) : null,
  });

  const saveSection = async (status: "in_progress" | "complete", nextRoute?: string) => {
    setSaveStatus("saving");
    setSaveError(null);
    try {
      await saveBorrowerApplicationSection("property", {
        data: buildSectionData(),
        status,
        current_step: "property",
      });
      setSaveStatus("saved");
      if (nextRoute) {
        void navigate({ to: nextRoute });
      }
    } catch (err) {
      setSaveStatus("unsaved");
      setSaveError(
        err instanceof Error ? err.message : "Your property section could not be saved.",
      );
    }
  };

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
        saveStatus={saveStatus}
      />

      {/* ── Restore / load banners ─────────────────────────────────────────── */}
      {loadingRestore && (
        <div className="mb-4 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground animate-pulse">
          Loading your saved answers…
        </div>
      )}

      {!loadingRestore && restoreSource !== "none" && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {restoreSource === "saved"
              ? "Restored from your saved application."
              : "Pre-filled from your qualification answers. Please review and save."}
          </span>
        </div>
      )}

      {restoreError && (
        <div className="mb-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {restoreError}
        </div>
      )}

      {saveError && (
        <div className="mb-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {saveError}
        </div>
      )}

      <CompletionSummaryPanel total={groupsDone.length} done={groupsDone.filter(Boolean).length} />

      {/* ── Form cards (slightly muted while loading restore) ──────────────── */}
      <div className={loadingRestore ? "pointer-events-none opacity-60" : ""}>
        <FormCard
          step={1}
          title="Preferred Locations"
          done={groupsDone[0]}
          description="Up to 5 locations."
        >
          <div className="space-y-3">
            {locations.map((l, i) => (
              <div key={l.id} className="grid grid-cols-1 gap-3 sm:grid-cols-7">
                <div className="sm:col-span-3">
                  <Field label="City" required={i === 0}>
                    <input
                      className={inputCls}
                      value={l.city}
                      onChange={(e) => updateLoc(l.id, { city: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Province" required={i === 0}>
                    <select
                      className={inputCls}
                      value={l.province}
                      onChange={(e) => updateLoc(l.id, { province: e.target.value })}
                    >
                      <option value="">—</option>
                      {PROVINCES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="sm:col-span-1">
                  <Field label="Priority">
                    <input
                      className={inputCls}
                      value={l.priority}
                      onChange={(e) => updateLoc(l.id, { priority: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-1 flex items-end">
                  {locations.length > 1 && (
                    <button
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
              onClick={addLoc}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Add another location
            </button>
          )}
        </FormCard>

        <FormCard
          step={2}
          title="Property Type Preference"
          done={groupsDone[1]}
          description="Select all that apply."
        >
          <ChoiceGrid<string>
            multi
            values={types}
            onMultiChange={(v) => {
              markDirty();
              setTypes(v);
            }}
            cols={3}
            options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </FormCard>

        <FormCard step={3} title="Property Usage" done={groupsDone[2]}>
          <Field label="How do you plan to use the property?" required>
            <ChoiceGrid
              value={usage}
              onChange={(v) => {
                markDirty();
                setUsage(v);
              }}
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
              <NumberInput
                value={target}
                onChange={(v) => {
                  markDirty();
                  setTarget(v);
                }}
                prefix="$"
              />
            </Field>
            <Field label="Expected down payment" required>
              <NumberInput
                value={dpAmount}
                onChange={(v) => {
                  markDirty();
                  setDpAmount(v);
                }}
                prefix="$"
              />
            </Field>
            <Field label="Expected down payment %">
              <input className={inputCls} value={`${dpPct.toFixed(1)}%`} readOnly />
            </Field>
            <Field label="Maximum comfortable monthly payment">
              <NumberInput
                value={maxPayment}
                onChange={(v) => {
                  markDirty();
                  setMaxPayment(v);
                }}
                prefix="$"
                suffix="/mo"
              />
            </Field>
          </div>
        </FormCard>

        <FormCard step={5} title="New Build / Condo Preferences" done={groupsDone[4]}>
          <Field label="Are you considering a new construction property?" required>
            <ChoiceGrid
              value={newBuild}
              onChange={(v) => {
                markDirty();
                setNewBuild(v);
              }}
              cols={3}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "maybe", label: "Maybe" },
              ]}
            />
          </Field>
          <Field label="Are you considering a condo?" required>
            <ChoiceGrid
              value={condoPref}
              onChange={(v) => {
                markDirty();
                setCondoPref(v);
              }}
              cols={3}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "maybe", label: "Maybe" },
              ]}
            />
          </Field>
          {(condoPref === "yes" || condoPref === "maybe") && (
            <Field label="Estimated monthly condo fee">
              <NumberInput
                value={condoFee}
                onChange={(v) => {
                  markDirty();
                  setCondoFee(v);
                }}
                prefix="$"
                suffix="/mo"
              />
            </Field>
          )}
        </FormCard>

        <InfoNote>
          Because you do not have a specific property yet, this application may be treated as a
          pre-purchase / pre-approval file. Final approval will require property details later.
        </InfoNote>

        <div className="h-4" />

        <MissingFieldsPanel items={missing} />
      </div>

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={missing.length === 0}
        onSaveDraft={() => void saveSection("in_progress")}
        onMarkComplete={() => void saveSection("complete")}
        onSaveContinue={() =>
          void saveSection(
            "in_progress",
            `/applications/${applicationId}/property-financing/down-payment`,
          )
        }
      />
    </PageShell>
  );
}
