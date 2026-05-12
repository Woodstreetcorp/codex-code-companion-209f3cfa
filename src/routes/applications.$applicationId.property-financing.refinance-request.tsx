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
  PageHeader,
  PageShell,
  SaveAndContinueBar,
  TxType,
  fmtMoney,
  inputCls,
} from "@/components/property-financing/shared";

export const Route = createFileRoute(
  "/applications/$applicationId/property-financing/refinance-request",
)({
  head: () => ({
    meta: [
      { title: "Refinance Request — approvU" },
      { name: "description", content: "Tell us how much you want to borrow and what you want to use the refinance for." },
    ],
  }),
  component: RefinanceRequestPage,
});

const PURPOSES = [
  "Lower my rate / payment",
  "Debt consolidation",
  "Home renovation",
  "Access equity / cash-out",
  "Investment",
  "Education expenses",
  "Business purpose",
  "Pay out co-owner / spouse",
  "Switch lender",
  "Other",
];

function RefinanceRequestPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Refinance";

  const propertyValue = 832000;
  const totalCurrentBalance = 412000;

  const [requested, setRequested] = useState("");
  const requestedNum = Number(requested || 0);
  const ltv = propertyValue ? (requestedNum / propertyValue) * 100 : 0;
  const availableEquity = Math.max(propertyValue * 0.8 - totalCurrentBalance, 0);
  const cashOut = Math.max(requestedNum - totalCurrentBalance, 0);

  const [purposes, setPurposes] = useState<string[]>([]);
  const [primaryPurpose, setPrimaryPurpose] = useState("");

  // conditional fields
  const [debts, setDebts] = useState<string[]>([]);
  const [renoAmount, setRenoAmount] = useState("");
  const [renoType, setRenoType] = useState("");
  const [contractor, setContractor] = useState("");
  const [investUse, setInvestUse] = useState("");
  const [investAmount, setInvestAmount] = useState("");
  const [coownerName, setCoownerName] = useState("");
  const [buyout, setBuyout] = useState("");
  const [agreement, setAgreement] = useState("");

  // preferences
  const [term, setTerm] = useState("");
  const [rateType, setRateType] = useState("");
  const [amort, setAmort] = useState("");
  const [paymentFreq, setPaymentFreq] = useState("");
  const [maxPayment, setMaxPayment] = useState("");

  const groupsDone = [
    requestedNum > 0,
    purposes.length > 0 && !!primaryPurpose,
    !!term && !!rateType && !!amort && !!paymentFreq,
  ];
  const progress = Math.round((groupsDone.filter(Boolean).length / groupsDone.length) * 100);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!(requestedNum > 0)) m.push("Enter the new mortgage amount you’re requesting");
    if (purposes.length === 0) m.push("Pick at least one refinance purpose");
    if (!primaryPurpose) m.push("Mark one purpose as your primary reason");
    if (!term) m.push("Choose your desired term");
    if (!rateType) m.push("Choose your desired rate type");
    if (!amort) m.push("Choose your desired amortization");
    if (!paymentFreq) m.push("Choose your desired payment frequency");
    return m;
  }, [requestedNum, purposes, primaryPurpose, term, rateType, amort, paymentFreq]);

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        title="Refinance Request"
        subtitle="Tell us how much you want to borrow and what you want to use the refinance for."
        tx={tx}
        progress={progress}
      />
      <CompletionSummaryPanel total={groupsDone.length} done={groupsDone.filter(Boolean).length} />

      <FormCard step={1} title="Requested New Mortgage" done={groupsDone[0]}>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-4">
          <Stat label="Property value" value={fmtMoney(propertyValue)} />
          <Stat label="Current balance" value={fmtMoney(totalCurrentBalance)} />
          <Stat label="Available equity (80% LTV)" value={fmtMoney(availableEquity)} tone="good" />
          <Stat label="Estimated LTV" value={`${ltv.toFixed(1)}%`} />
        </div>
        <Field label="Requested new mortgage amount" required>
          <NumberInput value={requested} onChange={setRequested} prefix="$" />
        </Field>
        <p className="text-[11px] text-muted-foreground">
          Cash-out amount: <span className="font-semibold text-foreground">{fmtMoney(cashOut)}</span>
        </p>
      </FormCard>

      <FormCard step={2} title="Refinance Purpose" done={groupsDone[1]} description="Select all that apply, then mark your primary reason.">
        <ChoiceGrid<string>
          multi
          values={purposes}
          onMultiChange={(v) => {
            setPurposes(v);
            if (!v.includes(primaryPurpose)) setPrimaryPurpose("");
          }}
          cols={2}
          options={PURPOSES.map((p) => ({ value: p, label: p }))}
        />

        {purposes.length > 0 && (
          <Field label="Primary reason" required>
            <select className={inputCls} value={primaryPurpose} onChange={(e) => setPrimaryPurpose(e.target.value)}>
              <option value="">—</option>
              {purposes.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        )}

        {purposes.includes("Debt consolidation") && (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground">Which debts do you want to pay off?</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Select from your reported liabilities.</p>
            <div className="mt-3 space-y-2">
              {[
                { id: "cc1", label: "Credit Card — TD · $8,200 · $250/mo" },
                { id: "loan", label: "Personal Loan — Scotiabank · $14,500 · $410/mo" },
                { id: "cc2", label: "Credit Card — Amex · $4,300 · $130/mo" },
              ].map((d) => (
                <label key={d.id} className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-xs">
                  <input
                    type="checkbox"
                    checked={debts.includes(d.id)}
                    onChange={(e) =>
                      setDebts((p) => e.target.checked ? [...p, d.id] : p.filter((x) => x !== d.id))
                    }
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {purposes.includes("Home renovation") && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Renovation amount">
              <NumberInput value={renoAmount} onChange={setRenoAmount} prefix="$" />
            </Field>
            <Field label="Renovation type">
              <input className={inputCls} value={renoType} onChange={(e) => setRenoType(e.target.value)} />
            </Field>
            <Field label="Contractor quote available?">
              <select className={inputCls} value={contractor} onChange={(e) => setContractor(e.target.value)}>
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
          </div>
        )}

        {purposes.includes("Investment") && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Intended investment use">
              <input className={inputCls} value={investUse} onChange={(e) => setInvestUse(e.target.value)} />
            </Field>
            <Field label="Amount">
              <NumberInput value={investAmount} onChange={setInvestAmount} prefix="$" />
            </Field>
          </div>
        )}

        {purposes.includes("Pay out co-owner / spouse") && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Co-owner name">
              <input className={inputCls} value={coownerName} onChange={(e) => setCoownerName(e.target.value)} />
            </Field>
            <Field label="Buyout amount">
              <NumberInput value={buyout} onChange={setBuyout} prefix="$" />
            </Field>
            <Field label="Agreement available?">
              <select className={inputCls} value={agreement} onChange={(e) => setAgreement(e.target.value)}>
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
          </div>
        )}
      </FormCard>

      <FormCard step={3} title="Desired Mortgage Preferences" done={groupsDone[2]}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Desired term" required>
            <select className={inputCls} value={term} onChange={(e) => setTerm(e.target.value)}>
              <option value="">—</option>
              {["1 yr", "2 yr", "3 yr", "4 yr", "5 yr", "7 yr", "10 yr"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Desired rate type" required>
            <ChoiceGrid value={rateType} onChange={setRateType} cols={3} options={[
              { value: "Fixed", label: "Fixed" }, { value: "Variable", label: "Variable" }, { value: "Adjustable", label: "Adjustable" },
            ]} />
          </Field>
          <Field label="Desired amortization" required>
            <select className={inputCls} value={amort} onChange={(e) => setAmort(e.target.value)}>
              <option value="">—</option>
              {["15 yr", "20 yr", "25 yr", "30 yr"].map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Desired payment frequency" required>
            <select className={inputCls} value={paymentFreq} onChange={(e) => setPaymentFreq(e.target.value)}>
              <option value="">—</option>
              {["Monthly", "Semi-monthly", "Bi-weekly", "Accelerated bi-weekly", "Weekly"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Maximum comfortable payment">
            <NumberInput value={maxPayment} onChange={setMaxPayment} prefix="$" suffix="/mo" />
          </Field>
        </div>
      </FormCard>

      <FormCard title="Review Impact">
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-3">
          <Stat label="New mortgage amount" value={fmtMoney(requestedNum)} />
          <Stat label="Estimated LTV" value={`${ltv.toFixed(1)}%`} />
          <Stat label="Cash-out amount" value={fmtMoney(cashOut)} tone={cashOut > 0 ? "good" : undefined} />
          <Stat label="Debts to be paid off" value={`${debts.length}`} />
        </div>
        {ltv > 80 && (
          <InfoNote variant="warning">
            Your requested amount may exceed typical refinance LTV limits. We’ll review options with you.
          </InfoNote>
        )}
      </FormCard>

      <MissingFieldsPanel items={missing} />

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={missing.length === 0}
        onSaveContinue={() => navigate({ to: "/internal/full-application" })}
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