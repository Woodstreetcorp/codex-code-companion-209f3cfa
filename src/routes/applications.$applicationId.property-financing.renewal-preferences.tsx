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
  "/applications/$applicationId/property-financing/renewal-preferences",
)({
  head: () => ({
    meta: [
      { title: "Renewal Preferences — approvU" },
      { name: "description", content: "Tell us what you want from your upcoming mortgage renewal." },
    ],
  }),
  component: RenewalPreferencesPage,
});

function RenewalPreferencesPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Renewal";

  const currentLender = "Scotiabank";
  const currentBalance = 412000;
  const currentRate = 5.19;
  const currentPayment = 2480;
  const maturityDate = "2026-09-15";
  const daysToMaturity = Math.max(
    Math.ceil((new Date(maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    0,
  );

  const [goal, setGoal] = useState("");
  const [term, setTerm] = useState("");
  const [rateType, setRateType] = useState("");
  const [paymentFreq, setPaymentFreq] = useState("");
  const [amort, setAmort] = useState("");
  const [maxPayment, setMaxPayment] = useState("");
  const [borrowMore, setBorrowMore] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const [extraPurpose, setExtraPurpose] = useState("");
  const [switchLender, setSwitchLender] = useState("");

  const groupsDone = [
    !!goal,
    !!term && !!rateType && !!paymentFreq && !!amort,
    !!borrowMore,
    !!switchLender,
  ];
  const progress = Math.round((groupsDone.filter(Boolean).length / groupsDone.length) * 100);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!goal) m.push("Choose your renewal goal");
    if (!term) m.push("Choose preferred term");
    if (!rateType) m.push("Choose preferred rate type");
    if (!paymentFreq) m.push("Choose preferred payment frequency");
    if (!amort) m.push("Choose desired amortization");
    if (!borrowMore) m.push("Tell us if you want to borrow additional money");
    if (!switchLender) m.push("Tell us if you’re open to switching lenders");
    return m;
  }, [goal, term, rateType, paymentFreq, amort, borrowMore, switchLender]);

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        title="Renewal Preferences"
        subtitle="Tell us what you want from your upcoming mortgage renewal."
        tx={tx}
        progress={progress}
      />
      <CompletionSummaryPanel total={groupsDone.length} done={groupsDone.filter(Boolean).length} />

      <FormCard step={1} title="Renewal Summary">
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-3">
          <Stat label="Current lender" value={currentLender} />
          <Stat label="Current balance" value={fmtMoney(currentBalance)} />
          <Stat label="Current rate" value={`${currentRate}%`} />
          <Stat label="Current payment" value={`${fmtMoney(currentPayment)}/mo`} />
          <Stat label="Maturity date" value={maturityDate} />
          <Stat label="Days to maturity" value={`${daysToMaturity} days`} />
        </div>
      </FormCard>

      <FormCard step={2} title="Renewal Goal" done={groupsDone[0]}>
        <Field label="What is your main renewal goal?" required>
          <ChoiceGrid
            value={goal}
            onChange={setGoal}
            cols={2}
            options={[
              { value: "lower-rate", label: "Get a lower rate" },
              { value: "lower-payment", label: "Lower my monthly payment" },
              { value: "payoff-faster", label: "Pay off mortgage faster" },
              { value: "switch", label: "Switch lender" },
              { value: "heloc", label: "Add HELOC" },
              { value: "cash-out", label: "Access equity / cash-out" },
              { value: "consolidate", label: "Consolidate debt" },
              { value: "simple", label: "Keep things simple" },
              { value: "unsure", label: "Not sure" },
            ]}
          />
        </Field>
      </FormCard>

      <FormCard step={3} title="Preferred Terms" done={groupsDone[1]}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Preferred term" required>
            <select className={inputCls} value={term} onChange={(e) => setTerm(e.target.value)}>
              <option value="">—</option>
              {["1 yr", "2 yr", "3 yr", "4 yr", "5 yr", "7 yr", "10 yr"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Preferred rate type" required>
            <ChoiceGrid value={rateType} onChange={setRateType} cols={3} options={[
              { value: "Fixed", label: "Fixed" }, { value: "Variable", label: "Variable" }, { value: "Adjustable", label: "Adjustable" },
            ]} />
          </Field>
          <Field label="Preferred payment frequency" required>
            <select className={inputCls} value={paymentFreq} onChange={(e) => setPaymentFreq(e.target.value)}>
              <option value="">—</option>
              {["Monthly", "Semi-monthly", "Bi-weekly", "Accelerated bi-weekly", "Weekly"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Desired amortization" required>
            <select className={inputCls} value={amort} onChange={(e) => setAmort(e.target.value)}>
              <option value="">—</option>
              {["15 yr", "20 yr", "25 yr", "30 yr"].map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Maximum comfortable payment">
            <NumberInput value={maxPayment} onChange={setMaxPayment} prefix="$" suffix="/mo" />
          </Field>
        </div>
      </FormCard>

      <FormCard step={4} title="Cash-Out / Refinance Check" done={groupsDone[2]}>
        <Field label="Do you want to borrow additional money at renewal?" required>
          <ChoiceGrid
            value={borrowMore}
            onChange={setBorrowMore}
            cols={3}
            options={[
              { value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Not sure" },
            ]}
          />
        </Field>
        {borrowMore === "yes" && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Additional amount requested">
                <NumberInput value={extraAmount} onChange={setExtraAmount} prefix="$" />
              </Field>
              <Field label="Purpose of additional funds">
                <input className={inputCls} value={extraPurpose} onChange={(e) => setExtraPurpose(e.target.value)} />
              </Field>
            </div>
            <InfoNote>This may convert your renewal into a refinance-style request.</InfoNote>
          </>
        )}
      </FormCard>

      <FormCard step={5} title="Switching Lender" done={groupsDone[3]}>
        <Field label="Are you open to switching lenders if it improves your terms?" required>
          <ChoiceGrid
            value={switchLender}
            onChange={setSwitchLender}
            cols={3}
            options={[
              { value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "maybe", label: "Maybe" },
            ]}
          />
        </Field>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}