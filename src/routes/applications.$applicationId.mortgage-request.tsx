import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
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
  "/applications/$applicationId/mortgage-request",
)({
  head: () => ({
    meta: [
      { title: "Mortgage Request — approvU" },
      {
        name: "description",
        content: "Confirm how much you want to borrow and your mortgage preferences.",
      },
    ],
  }),
  component: MortgageRequestPage,
});

const PURPOSE_PURCHASE = [
  { value: "primary", label: "Buy a primary residence" },
  { value: "investment", label: "Buy an investment property" },
  { value: "second", label: "Buy a second home" },
  { value: "new-construction", label: "Buy a new construction property" },
  { value: "other", label: "Other" },
] as const;

const TERMS = [
  { value: "1", label: "1 year" },
  { value: "2", label: "2 years" },
  { value: "3", label: "3 years" },
  { value: "4", label: "4 years" },
  { value: "5", label: "5 years" },
  { value: "7", label: "7 years" },
  { value: "10", label: "10 years" },
  { value: "none", label: "No preference" },
] as const;

const RATE_TYPES = [
  { value: "fixed", label: "Fixed", description: "Stable payments" },
  { value: "variable", label: "Variable", description: "Floats with prime" },
  { value: "adjustable", label: "Adjustable", description: "Payment may change" },
  { value: "none", label: "No preference" },
] as const;

const PAYMENT_FREQ = [
  { value: "monthly", label: "Monthly" },
  { value: "semi", label: "Semi-monthly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "accel-bi", label: "Accelerated bi-weekly" },
  { value: "weekly", label: "Weekly" },
] as const;

const AMORT = [
  { value: "25", label: "25 years" },
  { value: "30", label: "30 years" },
  { value: "none", label: "No preference" },
  { value: "other", label: "Other" },
] as const;

const GOALS = [
  "Lowest rate",
  "Lowest monthly payment",
  "Lower upfront costs",
  "Faster approval",
  "Flexible prepayment options",
  "Fixed payment stability",
  "Ability to refinance later",
  "Cashback or credits",
  "Home Life Bundle benefits",
  "Best overall value",
  "Avoid lender fees",
  "Keep closing simple",
];

function MortgageRequestPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Purchase";

  // Mock summary values from Property & Financing
  const summary = {
    propertyValue: 832000,
    downPayment: 83976,
    requestedDefault: 748024,
    ltv: 90,
    location: "Toronto, ON",
    usage: "Primary residence",
  };

  const [requested, setRequested] = useState(String(summary.requestedDefault));
  const [purpose, setPurpose] = useState("");
  const [terms, setTerms] = useState<string[]>([]);
  const [rateType, setRateType] = useState("");
  const [freq, setFreq] = useState("");
  const [maxPayment, setMaxPayment] = useState("");
  const [amort, setAmort] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const reqNum = Number(requested) || 0;
  const significantChange = Math.abs(reqNum - summary.requestedDefault) / summary.requestedDefault > 0.1;

  const groupsDone = [
    reqNum > 0,
    !!purpose,
    terms.length > 0,
    !!rateType,
    !!freq,
    goals.length > 0,
  ];
  const progress = Math.round((groupsDone.filter(Boolean).length / groupsDone.length) * 100);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!(reqNum > 0)) m.push("Confirm your requested mortgage amount");
    if (!purpose) m.push("Select a mortgage purpose");
    if (terms.length === 0) m.push("Select at least one term preference");
    if (!rateType) m.push("Select a rate type preference");
    if (!freq) m.push("Select a payment frequency");
    if (goals.length === 0) m.push("Select at least one mortgage goal");
    return m;
  }, [reqNum, purpose, terms, rateType, freq, goals]);

  const canComplete = missing.length === 0;

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        tx={tx}
        title="Mortgage Request"
        subtitle="Confirm how much you want to borrow and your mortgage preferences."
        progress={progress}
        saveStatus="saved"
      />

      <CompletionSummaryPanel total={groupsDone.length} done={groupsDone.filter(Boolean).length} />

      <FormCard step={1} title="Request Summary" description="From your Property & Financing details">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <SummaryItem label="Property value" value={fmtMoney(summary.propertyValue)} />
          <SummaryItem label="Down payment" value={fmtMoney(summary.downPayment)} />
          <SummaryItem label="Requested mortgage" value={fmtMoney(summary.requestedDefault)} />
          <SummaryItem label="Estimated LTV" value={`${summary.ltv}%`} />
          <SummaryItem label="Property usage" value={summary.usage} />
          <SummaryItem label="Transaction" value={tx} />
          <SummaryItem label="Location" value={summary.location} />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <Link
            to="/applications/$applicationId/property-financing/property"
            params={{ applicationId }}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <Pencil className="h-3 w-3" /> Edit Property Details
          </Link>
          <Link
            to="/applications/$applicationId/property-financing/down-payment"
            params={{ applicationId }}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <Pencil className="h-3 w-3" /> Edit Financing Details
          </Link>
        </div>
      </FormCard>

      <FormCard step={2} title="Loan Amount Confirmation" done={reqNum > 0}>
        <Field
          label="Requested mortgage amount"
          required
          hint="This amount may be adjusted after your full application is reviewed."
        >
          <NumberInput value={requested} onChange={setRequested} prefix="$" />
        </Field>
        {significantChange && (
          <InfoNote variant="warning">
            You changed the requested amount significantly from your initial estimate. This will be flagged for review.
          </InfoNote>
        )}
      </FormCard>

      <FormCard step={3} title="Mortgage Purpose" done={!!purpose}>
        <Field label="What is the main purpose of this mortgage request?" required>
          <ChoiceGrid value={purpose} onChange={setPurpose} options={PURPOSE_PURCHASE} cols={2} />
        </Field>
      </FormCard>

      <FormCard step={4} title="Term Preference" done={terms.length > 0}>
        <Field label="What mortgage term are you most interested in?" hint="Select all you're open to" required>
          <ChoiceGrid<string>
            multi
            values={terms}
            onMultiChange={setTerms}
            options={TERMS as unknown as { value: string; label: string }[]}
            cols={4}
          />
        </Field>
      </FormCard>

      <FormCard step={5} title="Rate & Payment Preferences" done={!!rateType && !!freq}>
        <Field label="Preferred rate type" required>
          <ChoiceGrid value={rateType} onChange={setRateType} options={RATE_TYPES} cols={2} />
        </Field>
        <p className="text-[11px] text-muted-foreground">
          Fixed rates offer payment stability. Variable or adjustable rates may change over time.
        </p>
        <Field label="Preferred payment frequency" required>
          <ChoiceGrid value={freq} onChange={setFreq} options={PAYMENT_FREQ} cols={3} />
        </Field>
        <Field label="Maximum comfortable monthly payment (optional)">
          <NumberInput value={maxPayment} onChange={setMaxPayment} prefix="$" suffix="/mo" />
        </Field>
      </FormCard>

      <FormCard step={6} title="Amortization Preference" done={!!amort}>
        <Field label="Preferred amortization period">
          <ChoiceGrid value={amort} onChange={setAmort} options={AMORT} cols={4} />
        </Field>
        <InfoNote>
          The amortization available to you depends on mortgage type, lender/product rules, insurance status, first-time buyer status, new construction status, and final approval.
        </InfoNote>
      </FormCard>

      <FormCard step={7} title="Mortgage Goals" done={goals.length > 0} description="Pick up to 3 things that matter most">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GOALS.map((g) => {
            const sel = goals.includes(g);
            const disabled = !sel && goals.length >= 3;
            return (
              <button
                key={g}
                type="button"
                disabled={disabled}
                onClick={() =>
                  setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
                }
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  sel
                    ? "border-primary bg-primary/5"
                    : disabled
                      ? "border-border bg-muted/30 text-muted-foreground"
                      : "border-border bg-background hover:border-primary/50"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </FormCard>

      <FormCard step={8} title="Broker Review Notes">
        <Field label="Anything you want approvU to know before we review your application?">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Example: I prefer a 5-year fixed rate, but I'm open to lower payment options."
            className={`${inputCls} min-h-24`}
          />
        </Field>
      </FormCard>

      <MissingFieldsPanel items={missing} />

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={canComplete}
        nextLabel="Save & Continue to Mortgage Offers"
        onSaveContinue={() =>
          navigate({
            to: "/applications/$applicationId/mortgage-offers",
            params: { applicationId },
          })
        }
      />
    </PageShell>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}