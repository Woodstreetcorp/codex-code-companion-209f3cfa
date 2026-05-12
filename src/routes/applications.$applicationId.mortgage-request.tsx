import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  Pencil,
  Sparkles,
  Users,
  Home,
  Wallet,
  Scale,
  Info,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import {
  ChoiceGrid,
  Field,
  FormCard,
  InfoNote,
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
      { title: "Review Your Mortgage Request — approvU" },
      {
        name: "description",
        content:
          "Review the key details we'll use to match you with qualified mortgage products.",
      },
    ],
  }),
  component: ReviewMortgageRequestPage,
});

const PRIMARY_GOALS = [
  "Lowest rate",
  "Lowest monthly payment",
  "Lowest closing cost",
  "Flexible prepayment options",
  "Faster approval",
  "Best overall value",
  "Cashback or credits",
  "Strong Home Life Bundle",
  "I'm not sure — recommend for me",
];

const STABILITY = [
  { value: "stable", label: "I prefer stable payments" },
  { value: "variable", label: "I am open to variable payments" },
  { value: "unsure", label: "I am not sure" },
] as const;

const CHOICE_STYLE = [
  { value: "recommend", label: "Recommend the best matches for me" },
  { value: "compare", label: "Let me compare a few options" },
  { value: "advanced", label: "I want advanced filters" },
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
  { value: "fixed", label: "Fixed" },
  { value: "variable", label: "Variable" },
  { value: "adjustable", label: "Adjustable" },
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
  { value: "system", label: "System recommended" },
  { value: "25", label: "25 years" },
  { value: "30", label: "30 years" },
  { value: "none", label: "No preference" },
  { value: "other", label: "Other" },
] as const;

const FEATURES = [
  "Portable",
  "Prepayment privileges",
  "Skip-a-payment",
  "Cashback",
  "HELOC available",
  "No lender fee",
  "Fast closing",
  "No appraisal required, if available",
];

function ReviewMortgageRequestPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Purchase";

  // Summary mock — pulled from prior application sections
  const summary = {
    propertyValue: 832000,
    downPayment: 83976,
    downPaymentPct: 10,
    requestedMortgage: 748024,
    ltv: 90,
    propertyUsage: "Primary residence",
    propertyType: "Detached",
    locationCity: "Toronto",
    locationProvince: "ON",
    closingDate: "2026-08-15",
  };

  const qualification = {
    borrowerCount: 2,
    incomeUsed: 168000,
    creditBand: "Strong (720+)",
    documentsStatus: "5 of 7 uploaded",
    monthlyDebt: 850,
    debtsToPayOff: 1,
    otherProperties: 0,
    sourceOfFunds: "Savings + Gift",
  };

  // Simple borrower preferences
  const [goals, setGoals] = useState<string[]>([]);
  const [stability, setStability] = useState<string>("");
  const [choiceStyle, setChoiceStyle] = useState<string>("");

  // Advanced
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [term, setTerm] = useState<string>("none");
  const [rateType, setRateType] = useState<string>("none");
  const [freq, setFreq] = useState<string>("monthly");
  const [amort, setAmort] = useState<string>("system");
  const [maxPayment, setMaxPayment] = useState("");
  const [mustHave, setMustHave] = useState<string[]>([]);
  const [avoid, setAvoid] = useState<string[]>([]);

  const toggleGoal = (g: string) =>
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : prev.length >= 3 ? prev : [...prev, g],
    );
  const toggleIn = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const checklist = useMemo(
    () => [
      { label: "Property & financing details complete", done: true },
      { label: "Borrower profiles complete", done: true },
      { label: "Mortgage amount confirmed", done: summary.requestedMortgage > 0 },
      {
        label: "Product preferences selected or defaults accepted",
        done: goals.length > 0 || !!stability || !!choiceStyle || advancedOpen,
      },
      { label: "No blocking issues", done: true },
    ],
    [goals.length, stability, choiceStyle, advancedOpen, summary.requestedMortgage],
  );
  const allReady = checklist.every((c) => c.done);
  const progress = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        tx={tx}
        title="Review Your Mortgage Request"
        subtitle="We'll use these details to find mortgage products that match your application."
        progress={progress}
        saveStatus="saved"
      />

      <InfoNote>
        You don't need to choose a lender or mortgage strategy on your own. approvU uses your application
        details to show products you may qualify for.
      </InfoNote>

      {/* Section 2 — Summary */}
      <div className="mt-5">
        <FormCard step={1} title="Mortgage Request Summary" description="From the details you've already entered">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <SummaryItem label="Purchase price" value={fmtMoney(summary.propertyValue)} />
            <SummaryItem label="Down payment" value={`${fmtMoney(summary.downPayment)} (${summary.downPaymentPct}%)`} />
            <SummaryItem label="Requested mortgage" value={fmtMoney(summary.requestedMortgage)} />
            <SummaryItem label="Estimated LTV" value={`${summary.ltv}%`} />
            <SummaryItem label="Property usage" value={summary.propertyUsage} />
            <SummaryItem label="Property type" value={summary.propertyType} />
            <SummaryItem label="Location" value={`${summary.locationCity}, ${summary.locationProvince}`} />
            <SummaryItem label="Closing date" value={summary.closingDate} />
            <SummaryItem label="Transaction" value={tx} />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <EditLink to="/applications/$applicationId/property-financing/property" applicationId={applicationId}>
              Edit Property Details
            </EditLink>
            <EditLink to="/applications/$applicationId/property-financing/down-payment" applicationId={applicationId}>
              Edit Financing Details
            </EditLink>
            <EditLink to="/internal/full-application" applicationId={applicationId}>
              Edit Borrower Details
            </EditLink>
          </div>
        </FormCard>

        {/* Section 3 — Key qualification inputs */}
        <FormCard step={2} title="What affects your product matches">
          <p className="text-xs text-muted-foreground">
            These details help determine which mortgage products appear on the next page.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QualCard icon={<Users className="h-4 w-4" />} title="Borrowers"
              rows={[
                ["Applicants", String(qualification.borrowerCount)],
                ["Included income", fmtMoney(qualification.incomeUsed)],
                ["Credit profile", qualification.creditBand],
                ["Documents", qualification.documentsStatus],
              ]} />
            <QualCard icon={<Home className="h-4 w-4" />} title="Property"
              rows={[
                ["Location", `${summary.locationCity}, ${summary.locationProvince}`],
                ["Usage", summary.propertyUsage],
                ["Type", summary.propertyType],
                ["Value", fmtMoney(summary.propertyValue)],
              ]} />
            <QualCard icon={<Wallet className="h-4 w-4" />} title="Financing"
              rows={[
                ["Down payment", `${fmtMoney(summary.downPayment)} (${summary.downPaymentPct}%)`],
                ["LTV", `${summary.ltv}%`],
                ["Source of funds", qualification.sourceOfFunds],
                ["Loan amount", fmtMoney(summary.requestedMortgage)],
              ]} />
            <QualCard icon={<Scale className="h-4 w-4" />} title="Debts & Other Properties"
              rows={[
                ["Monthly debt included", `${fmtMoney(qualification.monthlyDebt)}/mo`],
                ["Debts to be paid off", String(qualification.debtsToPayOff)],
                ["Other properties", String(qualification.otherProperties)],
                ["Other obligations", "—"],
              ]} />
          </div>
        </FormCard>

        {/* Section 4 — Simple preferences */}
        <FormCard step={3} title="A few quick preferences" description="Simple questions — you can skip anything you're not sure about.">
          <Field label="What matters most to you?" hint="Pick up to 3" required>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PRIMARY_GOALS.map((g) => {
                const sel = goals.includes(g);
                const disabled = !sel && goals.length >= 3;
                return (
                  <button key={g} type="button" disabled={disabled} onClick={() => toggleGoal(g)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      sel
                        ? "border-primary bg-primary/5"
                        : disabled
                          ? "border-border bg-muted/30 text-muted-foreground"
                          : "border-border bg-background hover:border-primary/50"
                    }`}>
                    {g}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="How do you feel about payment stability?">
            <ChoiceGrid value={stability} onChange={setStability} options={STABILITY} cols={3} />
            <p className="mt-1 text-[11px] text-muted-foreground">
              <Info className="mr-1 inline h-3 w-3" />
              Fixed means your payment is more predictable. Variable or adjustable rates may change over time.
            </p>
          </Field>

          <Field label="How involved do you want to be in choosing products?">
            <ChoiceGrid value={choiceStyle} onChange={setChoiceStyle} options={CHOICE_STYLE} cols={3} />
          </Field>
        </FormCard>

        {/* Section 5 — Recommended defaults */}
        <FormCard step={4} title="Recommended Defaults">
          <p className="text-xs text-muted-foreground">
            Based on your application, we'll start with common mortgage defaults. You can adjust these under
            Advanced Preferences.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <DefaultItem label="Payment frequency" value="Monthly" />
            <DefaultItem label="Rate type" value="No preference" />
            <DefaultItem label="Term" value="No preference" />
            <DefaultItem label="Amortization" value="System recommended" />
            <DefaultItem label="Product sorting" value="Best Match" />
          </div>
          <button onClick={() => setAdvancedOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <Pencil className="h-3 w-3" /> Edit advanced preferences
          </button>
        </FormCard>

        {/* Section 6 — Advanced accordion */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <div>
              <h2 className="text-sm font-semibold text-foreground">Advanced Preferences</h2>
              <p className="text-xs text-muted-foreground">
                Optional — control rate, term, payment, and product features.
              </p>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${advancedOpen ? "rotate-180" : ""}`} />
          </button>
          {advancedOpen && (
            <div className="space-y-4 border-t border-border p-5">
              <Field label="Preferred term">
                <ChoiceGrid value={term} onChange={setTerm} options={TERMS} cols={4} />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  The term is how long your current mortgage agreement lasts before renewal.
                </p>
              </Field>
              <Field label="Preferred rate type">
                <ChoiceGrid value={rateType} onChange={setRateType} options={RATE_TYPES} cols={4} />
              </Field>
              <Field label="Preferred payment frequency">
                <ChoiceGrid value={freq} onChange={setFreq} options={PAYMENT_FREQ} cols={3} />
              </Field>
              <Field label="Preferred amortization">
                <ChoiceGrid value={amort} onChange={setAmort} options={AMORT} cols={3} />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Amortization is the estimated time to fully repay the mortgage. Available options depend on
                  product and lender rules.
                </p>
              </Field>
              <Field label="Maximum comfortable monthly payment (optional)">
                <NumberInput value={maxPayment} onChange={setMaxPayment} prefix="$" suffix="/mo" />
              </Field>
              <Field label="Must-have product features">
                <ChipMulti options={FEATURES} values={mustHave} onToggle={(v) => toggleIn(mustHave, setMustHave, v)} variant="primary" />
              </Field>
              <Field label="Avoid product features">
                <ChipMulti options={FEATURES} values={avoid} onToggle={(v) => toggleIn(avoid, setAvoid, v)} variant="warn" />
              </Field>
            </div>
          )}
        </section>

        {/* Section 7 — Readiness */}
        <section className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Ready to See Qualified Products?</h2>
          <ul className="mt-3 space-y-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-xs">
                {c.done ? (
                  <CheckCircle2 className="h-4 w-4 text-mint-foreground" />
                ) : (
                  <CircleAlert className="h-4 w-4 text-coral" />
                )}
                <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <button
              onClick={() =>
                navigate({
                  to: "/applications/$applicationId/mortgage-offers",
                  params: { applicationId },
                })
              }
              className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-semibold transition ${
                allReady
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
              disabled={!allReady}
            >
              {allReady ? "See Qualified Products" : "Complete Missing Items"}
            </button>
          </div>
        </section>

        {/* Section 8 — Disclosures */}
        <p className="mb-4 rounded-xl border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
          The products shown on the next page are based on the information in your application. Final approval,
          rate, payment, and benefits may change after lender review and document verification.
        </p>
      </div>

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={allReady}
        nextLabel="See Qualified Products"
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

function EditLink({
  to,
  applicationId,
  children,
}: {
  to: "/applications/$applicationId/property-financing/property" | "/applications/$applicationId/property-financing/down-payment" | "/internal/full-application";
  applicationId: string;
  children: React.ReactNode;
}) {
  if (to === "/internal/full-application") {
    return (
      <Link to={to} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
        <Pencil className="h-3 w-3" /> {children}
      </Link>
    );
  }
  return (
    <Link to={to} params={{ applicationId }} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
      <Pencil className="h-3 w-3" /> {children}
    </Link>
  );
}

function QualCard({
  icon,
  title,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
        {title}
      </div>
      <dl className="mt-2 grid grid-cols-1 gap-1 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DefaultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ChipMulti({
  options,
  values,
  onToggle,
  variant = "primary",
}: {
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
  variant?: "primary" | "warn";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const sel = values.includes(o);
        const selectedCls =
          variant === "primary"
            ? "border-primary bg-primary/10 text-primary"
            : "border-coral bg-coral/10 text-coral";
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              sel ? selectedCls : "border-border bg-background text-foreground hover:border-primary/40"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
