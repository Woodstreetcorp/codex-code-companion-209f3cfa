import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  "/applications/$applicationId/property-financing/property",
)({
  head: () => ({
    meta: [
      { title: "About the Property — approvU" },
      {
        name: "description",
        content:
          "Confirm the property address, value, usage, costs, and closing details.",
      },
    ],
  }),
  component: AboutPropertyPage,
});

function AboutPropertyPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();

  // Detect transaction context — purchase vs refinance/renewal would differ
  // Here we treat the route as Purchase by default.
  const tx: TxType = "Purchase";

  // ── Address ────────────────────────────────────────────────
  const [hasAddress, setHasAddress] = useState<"yes" | "no" | "">("");
  const [manualMode, setManualMode] = useState(false);
  const [autocomplete, setAutocomplete] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("Canada");

  // ── Value ───────────────────────────────────────────────────
  const [price, setPrice] = useState("");
  const [valueSource, setValueSource] = useState("");

  // ── Usage ───────────────────────────────────────────────────
  const [usage, setUsage] = useState("");
  const [primary, setPrimary] = useState<"yes" | "no" | "">("");

  // ── Type ────────────────────────────────────────────────────
  const [propertyType, setPropertyType] = useState("");
  const [condoFee, setCondoFee] = useState("");
  const [heatInCondo, setHeatInCondo] = useState<"yes" | "no" | "">("");
  const [units, setUnits] = useState("");
  const [unitsRented, setUnitsRented] = useState<"yes" | "no" | "">("");
  const [rentalIncome, setRentalIncome] = useState("");

  // ── Condition ───────────────────────────────────────────────
  const [condition, setCondition] = useState("");

  // ── Ownership ───────────────────────────────────────────────
  const [ownership, setOwnership] = useState("");

  // ── Costs ───────────────────────────────────────────────────
  const [tax, setTax] = useState("");
  const [heating, setHeating] = useState("");
  const [otherCost, setOtherCost] = useState("");

  // ── Closing ─────────────────────────────────────────────────
  const [closingDate, setClosingDate] = useState("");
  const [financingDate, setFinancingDate] = useState("");
  const [closingFirm, setClosingFirm] = useState<"yes" | "no" | "">("");

  const isCondo = propertyType === "Condo";
  const isMulti = ["Duplex", "Triplex", "Fourplex", "Multi-unit"].includes(
    propertyType,
  );

  const addressOk =
    hasAddress === "yes" &&
    streetNumber &&
    streetName &&
    city &&
    province &&
    postal;

  const groupsDone = [
    !!addressOk,
    !!price && !!valueSource,
    !!usage && !!primary,
    !!propertyType && (!isCondo || !!condoFee) && (!isMulti || !!units),
    !!condition,
    !!ownership,
    !!tax && !!heating,
    !!closingDate,
  ];
  const groupsDoneCount = groupsDone.filter(Boolean).length;
  const progress = Math.round((groupsDoneCount / groupsDone.length) * 100);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!addressOk) m.push("Provide the full property address");
    if (!price) m.push("Enter the purchase price");
    if (!valueSource) m.push("Confirm how the value was determined");
    if (!usage) m.push("Select how the property will be used");
    if (!propertyType) m.push("Select the property type");
    if (!condition) m.push("Select the property condition");
    if (!ownership) m.push("Confirm the ownership structure");
    if (!closingDate) m.push("Provide the expected closing date");
    return m;
  }, [addressOk, price, valueSource, usage, propertyType, condition, ownership, closingDate]);

  const canComplete = missing.length === 0;

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        title="About the Property"
        subtitle="Confirm the property address, value, usage, costs, and closing details."
        tx={tx}
        progress={progress}
        saveStatus="saved"
      />

      <CompletionSummaryPanel total={groupsDone.length} done={groupsDoneCount} />

      <FormCard step={1} title="Property Address" done={groupsDone[0]}>
        <Field label="Do you have the full property address?" required>
          <ChoiceGrid<"yes" | "no">
            value={hasAddress as any}
            onChange={setHasAddress}
            options={[
              { value: "yes", label: "Yes, I have the full address" },
              { value: "no", label: "Not yet" },
            ]}
          />
        </Field>

        {hasAddress === "yes" && (
          <>
            {!manualMode ? (
              <Field label="Search address" hint="Address autocomplete (Google Maps integration coming soon)">
                <input
                  className={inputCls}
                  value={autocomplete}
                  onChange={(e) => setAutocomplete(e.target.value)}
                  placeholder="Start typing the property address"
                />
                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  Enter address manually
                </button>
              </Field>
            ) : null}

            {manualMode && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <Field label="Street number" required>
                    <input className={inputCls} value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Street name" required>
                    <input className={inputCls} value={streetName} onChange={(e) => setStreetName(e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-1">
                  <Field label="Unit">
                    <input className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="City / Town" required>
                    <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-1">
                  <Field label="Province" required>
                    <select className={inputCls} value={province} onChange={(e) => setProvince(e.target.value)}>
                      <option value="">—</option>
                      {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Postal code" required>
                    <input className={inputCls} value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="A1A 1A1" />
                  </Field>
                </div>
                <div className="sm:col-span-6">
                  <Field label="Country">
                    <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
                  </Field>
                </div>
              </div>
            )}
          </>
        )}

        {hasAddress === "no" && (
          <InfoNote variant="warning">
            A property address is usually required before a full purchase application can be submitted. If you don’t have a property yet, switch your application to Pre-Purchase to capture your target preferences instead.
          </InfoNote>
        )}
      </FormCard>

      <FormCard step={2} title="Property Value & Purchase Price" done={groupsDone[1]}>
        <Field label="What is the property purchase price?" required>
          <NumberInput value={price} onChange={setPrice} prefix="$" />
        </Field>
        <Field label="How was this value determined?" required>
          <ChoiceGrid
            value={valueSource}
            onChange={setValueSource}
            cols={3}
            options={[
              { value: "Signed purchase agreement", label: "Signed purchase agreement" },
              { value: "Builder agreement", label: "Builder agreement" },
              { value: "MLS listing", label: "MLS listing" },
              { value: "Market estimate", label: "Market estimate" },
              { value: "Appraisal", label: "Appraisal" },
              { value: "Expert opinion", label: "Expert opinion" },
              { value: "Other", label: "Other" },
            ]}
          />
        </Field>
        {valueSource === "Signed purchase agreement" && (
          <InfoNote>You may be asked to upload the purchase agreement later.</InfoNote>
        )}
      </FormCard>

      <FormCard step={3} title="Property Usage" done={groupsDone[2]}>
        <Field label="How will this property be used?" required>
          <ChoiceGrid
            value={usage}
            onChange={setUsage}
            cols={2}
            options={[
              { value: "Owner-Occupied", label: "Owner-Occupied" },
              { value: "Rental / Investment", label: "Rental / Investment" },
              { value: "Second Home / Vacation", label: "Second Home / Vacation" },
              { value: "Owner-Occupied with Rental Unit", label: "Owner-Occupied with Rental Unit" },
              { value: "Other", label: "Other" },
            ]}
          />
        </Field>
        <Field label="Will this be your primary residence?" required>
          <ChoiceGrid<"yes" | "no">
            value={primary as any}
            onChange={setPrimary}
            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
          />
        </Field>
      </FormCard>

      <FormCard step={4} title="Property Type" done={groupsDone[3]}>
        <Field label="What type of property is it?" required>
          <ChoiceGrid
            value={propertyType}
            onChange={setPropertyType}
            cols={3}
            options={[
              { value: "Detached", label: "Detached" },
              { value: "Semi-Detached", label: "Semi-Detached" },
              { value: "Townhouse", label: "Townhouse" },
              { value: "Condo", label: "Condo" },
              { value: "Duplex", label: "Duplex" },
              { value: "Triplex", label: "Triplex" },
              { value: "Fourplex", label: "Fourplex" },
              { value: "Multi-unit", label: "Multi-unit" },
              { value: "New Construction", label: "New Construction" },
              { value: "Other", label: "Other" },
            ]}
          />
        </Field>

        {isCondo && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Monthly condo fee" required>
              <NumberInput value={condoFee} onChange={setCondoFee} prefix="$" />
            </Field>
            <Field label="Is heat included in the condo fee?">
              <ChoiceGrid<"yes" | "no">
                value={heatInCondo as any}
                onChange={setHeatInCondo}
                options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
              />
            </Field>
          </div>
        )}

        {isMulti && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Number of units" required>
              <NumberInput value={units} onChange={setUnits} />
            </Field>
            <Field label="Will any units be rented?">
              <ChoiceGrid<"yes" | "no">
                value={unitsRented as any}
                onChange={setUnitsRented}
                options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
              />
            </Field>
            {unitsRented === "yes" && (
              <Field label="Estimated monthly rental income">
                <NumberInput value={rentalIncome} onChange={setRentalIncome} prefix="$" />
              </Field>
            )}
          </div>
        )}
      </FormCard>

      <FormCard step={5} title="Property Condition" done={groupsDone[4]}>
        <Field label="What is the property condition?" required>
          <ChoiceGrid
            value={condition}
            onChange={setCondition}
            cols={3}
            options={[
              { value: "Move-In Ready", label: "Move-In Ready" },
              { value: "Minor Repairs Needed", label: "Minor Repairs Needed" },
              { value: "Major Repairs Needed", label: "Major Repairs Needed" },
              { value: "Under Construction", label: "Under Construction" },
              { value: "Newly Built", label: "Newly Built" },
              { value: "Unknown", label: "Unknown" },
            ]}
          />
        </Field>
        {(condition === "Major Repairs Needed" || condition === "Under Construction") && (
          <InfoNote variant="warning">
            Some lenders may require additional review for property condition.
          </InfoNote>
        )}
      </FormCard>

      <FormCard step={6} title="Ownership Structure" done={groupsDone[5]}>
        <Field label="How will the property be owned?" required>
          <ChoiceGrid
            value={ownership}
            onChange={setOwnership}
            cols={3}
            options={[
              { value: "Sole ownership", label: "Sole ownership" },
              { value: "Joint ownership", label: "Joint ownership" },
              { value: "Tenants in common", label: "Tenants in common" },
              { value: "Corporation", label: "Corporation" },
              { value: "Trust", label: "Trust" },
              { value: "Other", label: "Other" },
            ]}
          />
        </Field>
        {(ownership === "Joint ownership" || ownership === "Tenants in common") && (
          <InfoNote>
            We’ll ask you to assign owners and ownership percentages from your application borrowers in the next step.
          </InfoNote>
        )}
      </FormCard>

      <FormCard step={7} title="Ongoing Property Costs" done={groupsDone[6]}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Annual property tax" required>
            <NumberInput value={tax} onChange={setTax} prefix="$" suffix="/yr" />
          </Field>
          <Field label="Monthly heating cost" required>
            <NumberInput value={heating} onChange={setHeating} prefix="$" suffix="/mo" />
          </Field>
          {isCondo && (
            <Field label="Monthly condo fee">
              <NumberInput value={condoFee} onChange={setCondoFee} prefix="$" suffix="/mo" />
            </Field>
          )}
          <Field label="Other monthly property costs">
            <NumberInput value={otherCost} onChange={setOtherCost} prefix="$" suffix="/mo" />
          </Field>
        </div>
      </FormCard>

      <FormCard step={8} title="Closing Details" done={groupsDone[7]}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Expected closing date" required>
            <input type="date" className={inputCls} value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
          </Field>
          <Field label="Financing condition date">
            <input type="date" className={inputCls} value={financingDate} onChange={(e) => setFinancingDate(e.target.value)} />
          </Field>
          <Field label="Is this closing date firm?">
            <ChoiceGrid<"yes" | "no">
              value={closingFirm as any}
              onChange={setClosingFirm}
              options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
            />
          </Field>
        </div>
      </FormCard>

      <MissingFieldsPanel items={missing} />

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={canComplete}
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