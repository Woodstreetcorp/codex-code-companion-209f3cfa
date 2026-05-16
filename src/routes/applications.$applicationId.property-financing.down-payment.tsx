import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveBorrowerApplicationSection } from "@/lib/api/borrowerApplicationSectionsApi";
import {
  ChoiceGrid,
  CompletionSummaryPanel,
  Field,
  FormCard,
  InfoNote,
  MissingFieldsPanel,
  NumberInput,
  PageHeader,
  PageShell,
  SaveAndContinueBar,
  TxType,
  fmtMoney,
  inputCls,
} from "@/components/property-financing/shared";

export const Route = createFileRoute(
  "/applications/$applicationId/property-financing/down-payment",
)({
  head: () => ({
    meta: [
      { title: "Down Payment & Financing — approvU" },
      {
        name: "description",
        content: "Confirm your down payment amount, source of funds, and financing details.",
      },
    ],
  }),
  component: DownPaymentPage,
});

const SOURCE_TYPES = [
  "Personal savings / investments / RRSP / FHSA",
  "Gift from immediate family",
  "Gift from non-immediate family",
  "Government or homebuyer grants",
  "Builder or seller incentives",
  "Funds from outside Canada",
  "Rent-to-own accumulated deposits",
  "Borrowed funds",
  "Sale of existing property",
  "Business funds",
  "Other",
] as const;

type SourceType = (typeof SOURCE_TYPES)[number];

type Source = {
  id: string;
  type: SourceType;
  amount: string;
  borrower: string;
  notes: string;
  // dynamic
  extra: Record<string, string>;
  // when the source row was auto-populated from a declared asset in a borrower's profile
  fromAsset?: { assetId: string; ownerName: string; assetType: string; institution: string };
};

function DownPaymentPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Purchase";

  // ── Save state ────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [saveError, setSaveError] = useState<string | null>(null);

  const propertyValue = 832000; // mock pulled from property/purchase plan
  const [totalDP, setTotalDP] = useState("83000");
  const totalDPNum = Number(totalDP || 0);
  const dpPct = propertyValue ? (totalDPNum / propertyValue) * 100 : 0;
  const requestedMortgage = Math.max(propertyValue - totalDPNum, 0);
  const ltv = propertyValue ? (requestedMortgage / propertyValue) * 100 : 0;

  const [selectedTypes, setSelectedTypes] = useState<SourceType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);

  // Auto-populate sources from declared liquid assets marked for the down payment
  // in the borrower profile (Assets section). The borrower-profile component
  // writes these contributions into localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("approvu:dp-contributions");
      if (!raw) return;
      const list: Array<{
        assetId: string;
        ownerId: string;
        ownerName: string;
        type: string;
        institution: string;
        amount: number;
      }> = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) return;
      const sourceType: SourceType = "Personal savings / investments / RRSP / FHSA";
      setSelectedTypes((prev) => (prev.includes(sourceType) ? prev : [...prev, sourceType]));
      setSources((prev) => {
        const existing = new Set(prev.map((s) => s.fromAsset?.assetId).filter(Boolean));
        const additions: Source[] = list
          .filter((c) => !existing.has(c.assetId) && c.amount > 0)
          .map((c) => ({
            id: `auto-${c.assetId}`,
            type: sourceType,
            amount: String(c.amount),
            borrower: c.ownerName,
            notes: `Auto-filled from declared ${c.type} at ${c.institution} (${c.ownerName}'s profile).`,
            extra: {},
            fromAsset: {
              assetId: c.assetId,
              ownerName: c.ownerName,
              assetType: c.type,
              institution: c.institution,
            },
          }));
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
    } catch {
      // ignore parse errors
    }
  }, []);

  const toggleType = (t: SourceType) => {
    if (selectedTypes.includes(t)) {
      setSelectedTypes((p) => p.filter((x) => x !== t));
      setSources((p) => p.filter((s) => s.type !== t));
    } else {
      setSelectedTypes((p) => [...p, t]);
      setSources((p) => [
        ...p,
        { id: `s-${Date.now()}-${Math.random()}`, type: t, amount: "", borrower: "", notes: "", extra: {} },
      ]);
    }
  };

  const addAnother = (t: SourceType) =>
    setSources((p) => [
      ...p,
      { id: `s-${Date.now()}-${Math.random()}`, type: t, amount: "", borrower: "", notes: "", extra: {} },
    ]);

  const removeSource = (id: string) =>
    setSources((p) => {
      const next = p.filter((s) => s.id !== id);
      // if no remaining of this type, deselect
      const removed = p.find((s) => s.id === id);
      if (removed && !next.some((s) => s.type === removed.type)) {
        setSelectedTypes((t) => t.filter((x) => x !== removed.type));
      }
      return next;
    });

  const updateSource = (id: string, patch: Partial<Source>) =>
    setSources((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const updateExtra = (id: string, key: string, value: string) =>
    setSources((p) => p.map((s) => (s.id === id ? { ...s, extra: { ...s.extra, [key]: value } } : s)));

  const totalSources = sources.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const remaining = totalDPNum - totalSources;

  // ── Section save helper ───────────────────────────────────────────────────
  const buildSectionData = () => ({
    total_down_payment: totalDPNum,
    property_value: propertyValue,
    down_payment_percent: propertyValue ? (totalDPNum / propertyValue) * 100 : 0,
    requested_mortgage: Math.max(propertyValue - totalDPNum, 0),
    source_types: selectedTypes,
    sources: sources.map(({ id: _id, fromAsset: _fa, ...rest }) => rest),
  });

  const saveSection = async (
    status: "in_progress" | "complete",
    nextRoute?: string,
  ) => {
    setSaveStatus("saving");
    setSaveError(null);
    try {
      await saveBorrowerApplicationSection("assets_down_payment", {
        data: buildSectionData(),
        status,
        current_step: "assets_down_payment",
      });
      setSaveStatus("saved");
      if (nextRoute) {
        void navigate({ to: nextRoute });
      }
    } catch (err) {
      setSaveStatus("unsaved");
      setSaveError(
        err instanceof Error ? err.message : "Your down payment section could not be saved.",
      );
    }
  };

  const groupsDone = [
    totalDPNum > 0,
    sources.length > 0,
    Math.abs(remaining) < 1 && sources.every((s) => Number(s.amount) > 0),
  ];
  const progress = Math.round((groupsDone.filter(Boolean).length / groupsDone.length) * 100);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!(totalDPNum > 0)) m.push("Enter your total down payment amount");
    if (sources.length === 0) m.push("Select at least one down payment source");
    if (sources.some((s) => !s.amount || Number(s.amount) <= 0))
      m.push("Enter an amount greater than $0 for each source");
    if (Math.abs(remaining) >= 1 && totalDPNum > 0)
      m.push("Source amounts must equal your total down payment");
    sources.forEach((s) => {
      if (s.type === "Borrowed funds" && !s.extra.monthlyPayment)
        m.push("Borrowed funds need a monthly payment");
    });
    return m;
  }, [totalDPNum, sources, remaining]);

  const canComplete = missing.length === 0;

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        title="Down Payment & Financing"
        subtitle="Confirm your down payment amount, source of funds, and financing details."
        tx={tx}
        progress={progress}
        saveStatus={saveStatus}
      />
      {saveError && (
        <div className="mb-4 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {saveError}
        </div>
      )}

      <CompletionSummaryPanel total={groupsDone.length} done={groupsDone.filter(Boolean).length} />

      <FormCard step={1} title="Down Payment Summary" done={groupsDone[0]}>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-4">
          <SummaryStat label="Property value" value={fmtMoney(propertyValue)} />
          <SummaryStat label="Down payment" value={fmtMoney(totalDPNum)} />
          <SummaryStat label="Down payment %" value={`${dpPct.toFixed(1)}%`} />
          <SummaryStat label="Requested mortgage" value={fmtMoney(requestedMortgage)} />
        </div>
        <Field label="Total down payment amount" required>
          <NumberInput value={totalDP} onChange={setTotalDP} prefix="$" />
        </Field>
        <p className="text-[11px] text-muted-foreground">Estimated LTV: {ltv.toFixed(1)}%</p>
      </FormCard>

      <FormCard step={2} title="Down Payment Sources" done={groupsDone[1]} description="Select all that apply.">
        <ChoiceGrid<SourceType>
          multi
          values={selectedTypes}
          onMultiChange={(v) => {
            // diff-based update
            const removed = selectedTypes.filter((s) => !v.includes(s));
            const added = v.filter((s) => !selectedTypes.includes(s));
            removed.forEach((t) => toggleType(t));
            added.forEach((t) => toggleType(t));
          }}
          cols={2}
          options={SOURCE_TYPES.map((s) => ({ value: s, label: s }))}
        />

        {sources.length > 0 && (
          <div className="mt-4 space-y-3">
            {selectedTypes.map((t) => (
              <div key={t}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">{t}</p>
                  <button
                    type="button"
                    onClick={() => addAnother(t)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add another
                  </button>
                </div>
                <div className="space-y-3">
                  {sources.filter((s) => s.type === t).map((s) => (
                    <SourceCard
                      key={s.id}
                      source={s}
                      onChange={(p) => updateSource(s.id, p)}
                      onExtra={(k, v) => updateExtra(s.id, k, v)}
                      onRemove={() => removeSource(s.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </FormCard>

      <FormCard step={3} title="Source Allocation Check" done={groupsDone[2]}>
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <SummaryStat label="Down payment total" value={fmtMoney(totalDPNum)} />
          <SummaryStat label="Sources entered" value={fmtMoney(totalSources)} />
          <SummaryStat
            label="Remaining to allocate"
            value={fmtMoney(remaining)}
            tone={Math.abs(remaining) < 1 ? "good" : "warn"}
          />
        </div>
        {Math.abs(remaining) >= 1 && totalDPNum > 0 && (
          <InfoNote variant="warning">
            Your down payment sources must equal your total down payment.
          </InfoNote>
        )}
      </FormCard>

      <FormCard title="Document Expectations" description="Based on your down payment sources, you may be asked for:">
        <ul className="list-disc space-y-1 pl-5 text-xs text-foreground/80">
          {selectedTypes.includes("Personal savings / investments / RRSP / FHSA") && <li>90-day bank or investment statements</li>}
          {(selectedTypes.includes("Gift from immediate family") || selectedTypes.includes("Gift from non-immediate family")) && <li>Gift letter and proof of funds</li>}
          {selectedTypes.includes("Government or homebuyer grants") && <li>Grant approval letter</li>}
          {selectedTypes.includes("Sale of existing property") && <li>Sale agreement and closing statement</li>}
          {selectedTypes.includes("Funds from outside Canada") && <li>Source of funds declaration</li>}
          {selectedTypes.includes("Borrowed funds") && <li>Loan agreement and repayment schedule</li>}
          {selectedTypes.length === 0 && <li className="text-muted-foreground">Select sources above to see expected documents.</li>}
        </ul>
      </FormCard>

      <MissingFieldsPanel items={missing} />

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={canComplete}
        onSaveDraft={() => void saveSection("in_progress")}
        onMarkComplete={() => void saveSection("complete")}
        onSaveContinue={() =>
          void saveSection("in_progress", "/internal/full-application")
        }
      />
    </PageShell>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  const cls = tone === "good" ? "text-mint-foreground" : tone === "warn" ? "text-coral" : "text-foreground";
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${cls}`}>{value}</p>
    </div>
  );
}

function SourceCard({
  source,
  onChange,
  onExtra,
  onRemove,
}: {
  source: Source;
  onChange: (p: Partial<Source>) => void;
  onExtra: (k: string, v: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">{source.type}</p>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-[11px] text-coral hover:underline"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Amount from this source" required>
          <NumberInput value={source.amount} onChange={(v) => onChange({ amount: v })} prefix="$" />
        </Field>
        <Field label="Which borrower owns this source?">
          <select
            className={inputCls}
            value={source.borrower}
            onChange={(e) => onChange({ borrower: e.target.value })}
          >
            <option value="">Select borrower</option>
            <option value="primary">Sarah Mitchell (Primary)</option>
            <option value="co">Jamie Scott (Co-Applicant)</option>
            <option value="joint">Joint</option>
          </select>
        </Field>

        {source.type === "Personal savings / investments / RRSP / FHSA" && (
          <>
            <Field label="Account type">
              <select
                className={inputCls}
                value={source.extra.accountType ?? ""}
                onChange={(e) => onExtra("accountType", e.target.value)}
              >
                <option value="">Select</option>
                {["Chequing", "Savings", "TFSA", "RRSP", "FHSA", "Non-Registered Investment"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Financial institution">
              <input
                className={inputCls}
                value={source.extra.fi ?? ""}
                onChange={(e) => onExtra("fi", e.target.value)}
              />
            </Field>
            <Field label="Funds held for 90 days?">
              <select
                className={inputCls}
                value={source.extra.held90 ?? ""}
                onChange={(e) => onExtra("held90", e.target.value)}
              >
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unsure">Not sure</option>
              </select>
            </Field>
          </>
        )}

        {(source.type === "Gift from immediate family" || source.type === "Gift from non-immediate family") && (
          <>
            <Field label="Donor relationship">
              <input className={inputCls} value={source.extra.donorRel ?? ""} onChange={(e) => onExtra("donorRel", e.target.value)} />
            </Field>
            <Field label="Is it repayable?">
              <select className={inputCls} value={source.extra.repayable ?? ""} onChange={(e) => onExtra("repayable", e.target.value)}>
                <option value="">—</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
            <Field label="Donor country">
              <input className={inputCls} value={source.extra.donorCountry ?? ""} onChange={(e) => onExtra("donorCountry", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <InfoNote variant={source.type === "Gift from non-immediate family" ? "warning" : "info"}>
                {source.type === "Gift from non-immediate family"
                  ? "Some lenders may not accept this source. A signed gift letter will be required."
                  : "A signed gift letter will be required."}
              </InfoNote>
            </div>
          </>
        )}

        {source.type === "Government or homebuyer grants" && (
          <>
            <Field label="Program name">
              <input className={inputCls} value={source.extra.program ?? ""} onChange={(e) => onExtra("program", e.target.value)} />
            </Field>
            <Field label="Approval status">
              <select className={inputCls} value={source.extra.status ?? ""} onChange={(e) => onExtra("status", e.target.value)}>
                <option value="">—</option>
                <option>Approved</option>
                <option>Pending</option>
                <option>Applied</option>
              </select>
            </Field>
          </>
        )}

        {source.type === "Builder or seller incentives" && (
          <>
            <Field label="Incentive type">
              <input className={inputCls} value={source.extra.incentiveType ?? ""} onChange={(e) => onExtra("incentiveType", e.target.value)} />
            </Field>
            <Field label="Disclosed in purchase agreement?">
              <select className={inputCls} value={source.extra.disclosed ?? ""} onChange={(e) => onExtra("disclosed", e.target.value)}>
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
          </>
        )}

        {source.type === "Funds from outside Canada" && (
          <>
            <Field label="Country">
              <input className={inputCls} value={source.extra.country ?? ""} onChange={(e) => onExtra("country", e.target.value)} />
            </Field>
            <Field label="Currency">
              <input className={inputCls} value={source.extra.currency ?? ""} onChange={(e) => onExtra("currency", e.target.value)} placeholder="e.g. USD" />
            </Field>
            <Field label="Funds already in Canada?">
              <select className={inputCls} value={source.extra.inCanada ?? ""} onChange={(e) => onExtra("inCanada", e.target.value)}>
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <InfoNote>Additional documentation may be required.</InfoNote>
            </div>
          </>
        )}

        {source.type === "Borrowed funds" && (
          <>
            <Field label="Lender / source">
              <input className={inputCls} value={source.extra.lender ?? ""} onChange={(e) => onExtra("lender", e.target.value)} />
            </Field>
            <Field label="Monthly payment" required>
              <NumberInput
                value={source.extra.monthlyPayment ?? ""}
                onChange={(v) => onExtra("monthlyPayment", v)}
                prefix="$"
                suffix="/mo"
              />
            </Field>
            <Field label="Repayment terms">
              <input className={inputCls} value={source.extra.terms ?? ""} onChange={(e) => onExtra("terms", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <InfoNote variant="warning">Borrowed down payment may affect your qualification.</InfoNote>
            </div>
          </>
        )}

        {source.type === "Sale of existing property" && (
          <>
            <Field label="Property address">
              <input className={inputCls} value={source.extra.propAddress ?? ""} onChange={(e) => onExtra("propAddress", e.target.value)} />
            </Field>
            <Field label="Expected sale proceeds">
              <NumberInput value={source.extra.proceeds ?? ""} onChange={(v) => onExtra("proceeds", v)} prefix="$" />
            </Field>
            <Field label="Firm sale?">
              <select className={inputCls} value={source.extra.firm ?? ""} onChange={(e) => onExtra("firm", e.target.value)}>
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Closing date">
              <input type="date" className={inputCls} value={source.extra.closingDate ?? ""} onChange={(e) => onExtra("closingDate", e.target.value)} />
            </Field>
          </>
        )}

        <div className="sm:col-span-2">
          <Field label="Source notes">
            <textarea
              rows={2}
              className={inputCls}
              value={source.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Anything we should know about this source"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}