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
  PageHeader,
  PageShell,
  SaveAndContinueBar,
  TxType,
  fmtMoney,
  inputCls,
} from "@/components/property-financing/shared";

export const Route = createFileRoute(
  "/portal/applications/$applicationId/property-financing/current-mortgage",
)({
  head: () => ({
    meta: [
      { title: "Current Mortgage Details — approvU" },
      { name: "description", content: "Add the mortgages currently registered on this property." },
    ],
  }),
  component: CurrentMortgagePage,
});

type Mortgage = {
  id: string;
  position: string;
  lender: string;
  balance: string;
  rate: string;
  rateType: string;
  payment: string;
  paymentFreq: string;
  termType: string;
  maturityDate: string;
  remainingAmort: string;
  includeInRefi: string;
  prepaymentKnown: string;
  prepaymentAmount: string;
  statementUploaded: string;
  // HELOC
  creditLimit: string;
  amountDrawn: string;
  interestOnly: string;
  securedAgainst: string;
};

const empty = (): Mortgage => ({
  id: `m-${Date.now()}-${Math.random()}`,
  position: "",
  lender: "",
  balance: "",
  rate: "",
  rateType: "",
  payment: "",
  paymentFreq: "",
  termType: "",
  maturityDate: "",
  remainingAmort: "",
  includeInRefi: "",
  prepaymentKnown: "",
  prepaymentAmount: "",
  statementUploaded: "",
  creditLimit: "",
  amountDrawn: "",
  interestOnly: "",
  securedAgainst: "",
});

function CurrentMortgagePage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Refinance";
  const propertyValue = 832000;

  const [mortgageFree, setMortgageFree] = useState(false);
  const [mortgages, setMortgages] = useState<Mortgage[]>([empty()]);

  const totalBalance = mortgages.reduce((s, m) => s + Number(m.balance || 0), 0);
  const equity = Math.max(propertyValue - totalBalance, 0);
  const totalPayment = mortgages.reduce((s, m) => s + Number(m.payment || 0), 0);

  const update = (id: string, p: Partial<Mortgage>) =>
    setMortgages((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const remove = (id: string) => setMortgages((prev) => prev.filter((m) => m.id !== id));

  const allRequiredOk = mortgages.every(
    (m) => m.position && m.lender && m.balance && m.rate && m.rateType && m.payment && m.paymentFreq,
  );

  const groupsDone = [true, mortgageFree || (mortgages.length > 0 && allRequiredOk)];
  const progress = Math.round((groupsDone.filter(Boolean).length / groupsDone.length) * 100);

  const missing = useMemo(() => {
    if (mortgageFree) return [];
    const m: string[] = [];
    if (mortgages.length === 0) m.push("Add at least one mortgage or confirm the property is mortgage-free");
    if (!allRequiredOk) m.push("Fill the required fields for each mortgage (lender, balance, rate, payment)");
    return m;
  }, [mortgageFree, mortgages, allRequiredOk]);

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        title="Current Mortgage Details"
        subtitle="Add the mortgages currently registered on this property."
        tx={tx}
        progress={progress}
      />
      <CompletionSummaryPanel total={groupsDone.length} done={groupsDone.filter(Boolean).length} />

      <FormCard step={1} title="Mortgage Summary" done={groupsDone[0]}>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-4">
          <Stat label="Property value" value={fmtMoney(propertyValue)} />
          <Stat label="Total balance" value={fmtMoney(totalBalance)} />
          <Stat label="Estimated equity" value={fmtMoney(equity)} tone="good" />
          <Stat label="Total monthly payment" value={fmtMoney(totalPayment)} />
        </div>
      </FormCard>

      <FormCard step={2} title="Current Mortgages" done={groupsDone[1]}>
        <label className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs">
          <input
            type="checkbox"
            checked={mortgageFree}
            onChange={(e) => setMortgageFree(e.target.checked)}
          />
          <span className="font-medium text-foreground">This property has no mortgage</span>
          <span className="ml-auto text-[11px] text-muted-foreground">
            Confirm to skip mortgage entry
          </span>
        </label>

        {!mortgageFree && (
          <>
            {mortgages.map((m, i) => (
              <MortgageCard key={m.id} idx={i} m={m} onChange={(p) => update(m.id, p)} onRemove={mortgages.length > 1 ? () => remove(m.id) : undefined} />
            ))}
            <button
              onClick={() => setMortgages((p) => [...p, empty()])}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" /> Add Mortgage
            </button>
            <InfoNote>
              You may be asked to upload a recent mortgage statement for each mortgage listed.
            </InfoNote>
          </>
        )}
      </FormCard>

      <MissingFieldsPanel items={missing} />

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={missing.length === 0}
        onSaveContinue={() =>
          navigate({
            to: "/portal/applications/$applicationId/property-financing/refinance-request",
            params: { applicationId },
          })
        }
      />
    </PageShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone === "good" ? "text-mint-foreground" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function MortgageCard({
  idx,
  m,
  onChange,
  onRemove,
}: {
  idx: number;
  m: Mortgage;
  onChange: (p: Partial<Mortgage>) => void;
  onRemove?: () => void;
}) {
  const isHeloc = m.position === "HELOC";
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Mortgage #{idx + 1}</p>
        {onRemove && (
          <button onClick={onRemove} className="inline-flex items-center gap-1 text-[11px] text-coral hover:underline">
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Mortgage position" required>
          <select className={inputCls} value={m.position} onChange={(e) => onChange({ position: e.target.value })}>
            <option value="">—</option>
            {["First mortgage", "Second mortgage", "HELOC", "Private mortgage", "Other"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Current lender" required>
          <input className={inputCls} value={m.lender} onChange={(e) => onChange({ lender: e.target.value })} />
        </Field>
        <Field label="Outstanding balance" required>
          <NumberInput value={m.balance} onChange={(v) => onChange({ balance: v })} prefix="$" />
        </Field>
        <Field label="Current interest rate" required>
          <NumberInput value={m.rate} onChange={(v) => onChange({ rate: v })} suffix="%" />
        </Field>
        <Field label="Rate type" required>
          <ChoiceGrid value={m.rateType} onChange={(v) => onChange({ rateType: v })} cols={3} options={[
            { value: "Fixed", label: "Fixed" }, { value: "Variable", label: "Variable" }, { value: "Adjustable", label: "Adjustable" },
          ]} />
        </Field>
        <Field label="Monthly payment" required>
          <NumberInput value={m.payment} onChange={(v) => onChange({ payment: v })} prefix="$" suffix="/mo" />
        </Field>
        <Field label="Payment frequency" required>
          <select className={inputCls} value={m.paymentFreq} onChange={(e) => onChange({ paymentFreq: e.target.value })}>
            <option value="">—</option>
            {["Monthly", "Semi-monthly", "Bi-weekly", "Accelerated bi-weekly", "Weekly"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Term type">
          <ChoiceGrid value={m.termType} onChange={(v) => onChange({ termType: v })} options={[
            { value: "Open", label: "Open" }, { value: "Closed", label: "Closed" },
          ]} />
        </Field>
        <Field label="Maturity date">
          <input type="date" className={inputCls} value={m.maturityDate} onChange={(e) => onChange({ maturityDate: e.target.value })} />
        </Field>
        <Field label="Remaining amortization (years)">
          <NumberInput value={m.remainingAmort} onChange={(v) => onChange({ remainingAmort: v })} suffix="yrs" />
        </Field>
        <Field label="Include in refinance / renewal?">
          <select className={inputCls} value={m.includeInRefi} onChange={(e) => onChange({ includeInRefi: e.target.value })}>
            <option value="">—</option>
            <option>Yes, pay out this mortgage</option>
            <option>No, keep this mortgage</option>
            <option>Not sure</option>
          </select>
        </Field>
        <Field label="Prepayment penalty known?">
          <ChoiceGrid value={m.prepaymentKnown} onChange={(v) => onChange({ prepaymentKnown: v })} options={[
            { value: "yes", label: "Yes" }, { value: "no", label: "No" },
          ]} />
        </Field>
        {m.prepaymentKnown === "yes" && (
          <Field label="Prepayment penalty amount">
            <NumberInput value={m.prepaymentAmount} onChange={(v) => onChange({ prepaymentAmount: v })} prefix="$" />
          </Field>
        )}
        <Field label="Mortgage statement uploaded?">
          <ChoiceGrid value={m.statementUploaded} onChange={(v) => onChange({ statementUploaded: v })} options={[
            { value: "yes", label: "Yes" }, { value: "no", label: "No, I’ll upload later" },
          ]} />
        </Field>

        {isHeloc && (
          <>
            <Field label="Credit limit">
              <NumberInput value={m.creditLimit} onChange={(v) => onChange({ creditLimit: v })} prefix="$" />
            </Field>
            <Field label="Amount drawn">
              <NumberInput value={m.amountDrawn} onChange={(v) => onChange({ amountDrawn: v })} prefix="$" />
            </Field>
            <Field label="Interest-only payment?">
              <ChoiceGrid value={m.interestOnly} onChange={(v) => onChange({ interestOnly: v })} options={[
                { value: "yes", label: "Yes" }, { value: "no", label: "No" },
              ]} />
            </Field>
            <Field label="Secured against this property?">
              <ChoiceGrid value={m.securedAgainst} onChange={(v) => onChange({ securedAgainst: v })} options={[
                { value: "yes", label: "Yes" }, { value: "no", label: "No" },
              ]} />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}