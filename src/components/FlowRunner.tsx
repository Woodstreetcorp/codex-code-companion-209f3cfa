import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Plus, Trash2 } from "lucide-react";
import { flows, type FlowKey, type MortgageEntry, type Question } from "@/lib/flows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MortgageSnapshot } from "@/components/MortgageSnapshot";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  calculateMinimumDownPayment,
  formatCAD,
  ltv,
  monthlyPayment,
  parseCurrency,
  analyzeRenewalIntent,
  validateDownPayment,
  downPaymentPercentage,
  type PropertyUsage,
} from "@/lib/calculations";

type AnswerValue = string | string[] | MortgageEntry[];
type Answers = Record<string, AnswerValue>;

function formatCurrency(v: string) {
  const digits = v.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-CA");
}

export function FlowRunner({ flowKey }: { flowKey: FlowKey }) {
  const flow = flows[flowKey];
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [validatedAddresses, setValidatedAddresses] = useState<Record<string, boolean>>({});

  const visible = useMemo(
    () => flow.questions.filter((q) => !q.showIf || q.showIf(answers)),
    [flow.questions, answers],
  );
  const total = visible.length + 1; // + review
  const current: Question | undefined = visible[index];
  const progress = Math.round(((done ? total : index) / total) * 100);

  const rawValue = current ? answers[current.id] : undefined;
  const stringValue = typeof rawValue === "string" ? rawValue : "";
  const arrayValue: string[] = Array.isArray(rawValue)
    ? (rawValue.filter((v) => typeof v === "string") as string[])
    : [];
  const mortgageValue: MortgageEntry[] = Array.isArray(rawValue)
    ? (rawValue.filter((v) => typeof v === "object") as MortgageEntry[])
    : [];

  const canContinue = current
    ? current.type === "choice"
      ? !!stringValue
      : current.type === "multi"
        ? arrayValue.length > 0
        : current.type === "text"
          ? current.id === "address"
            ? !!validatedAddresses[current.id] && stringValue.trim().length > 0
            : stringValue.trim().length > 0
          : current.type === "mortgages"
            ? mortgageValue.length > 0 &&
              mortgageValue.every((m) => m.lender.trim() && m.balance.trim())
            : stringValue.replace(/[^0-9]/g, "").length > 0
    : true;

  // Live validation hint (e.g. down-payment minimum vs purchase price).
  const validationHint = useMemo(() => {
    if (!current) return null;
    if (current.id === "credit") {
      const raw = stringValue.replace(/[^0-9]/g, "");
      if (!raw) return null;
      const score = parseInt(raw, 10);
      if (score < 500) {
        return {
          ok: true,
          message:
            "Scores below 500 may require a more specialized review and may have fewer available options.",
        };
      }
      if (score < 620) {
        return {
          ok: true,
          message: "Alternative lender programs may be available for this range.",
        };
      }
      if (score > 900) {
        return { ok: false, message: "Please enter a valid credit score between 500 and 900." };
      }
      return { ok: true, message: "Great — this falls in the prime lending range." };
    }
    if (flowKey === "purchase" && current.id === "down") {
      const price = parseCurrency(answers.price as string);
      const down = parseCurrency(stringValue);
      if (price > 0 && down > 0) {
        const usage =
          (answers.use as PropertyUsage) ?? "primary";
        const v = validateDownPayment(down, price, usage);
        const pct = downPaymentPercentage(down, price);
        return {
          ok: v.isValid,
          message: v.isValid
            ? `That's ${pct}% down — meets the ${formatCAD(v.minimumRequired)} minimum.`
            : `${v.message} You're short ${formatCAD(v.shortfall)}.`,
        };
      }
    }
    if (flowKey === "refinance" && current.type === "mortgages") {
      const value = parseCurrency(answers.value as string);
      const total = mortgageValue.reduce((s, m) => s + parseCurrency(m.balance), 0);
      if (value > 0 && total > value * 0.8) {
        return {
          ok: true,
          message:
            "Your current mortgage balances appear to be above 80% of the estimated property value. Some refinance options may be limited, and your file may require a more detailed review.",
        };
      }
    }
    return null;
  }, [current, flowKey, answers, stringValue, mortgageValue]);

  const setValue = (v: AnswerValue) => {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current.id]: v }));
  };

  const toggleMulti = (val: string) => {
    const next: string[] = arrayValue.includes(val)
      ? arrayValue.filter((v) => v !== val)
      : [...arrayValue, val];
    setValue(next);
  };

  const setMortgages = (entries: MortgageEntry[]) => {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current.id]: entries }));
  };

  // Auto-initialize the mortgage list to match numMortgages when reaching that step.
  useEffect(() => {
    if (!current || current.type !== "mortgages") return;
    const n = Number(answers.numMortgages);
    if (!(n >= 1 && n <= 3)) return;
    if (mortgageValue.length === n) return;
    const next: MortgageEntry[] = Array.from({ length: n }, (_, i) => {
      const existing = mortgageValue[i];
      return (
        existing ?? {
          position: i + 1,
          lender: "",
          balance: "",
          payment: "",
          maturity: "",
          rate: "",
        }
      );
    });
    setMortgages(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, answers.numMortgages]);

  const next = () => {
    if (index + 1 >= visible.length) setDone(true);
    else setIndex((i) => i + 1);
  };
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  });
  const back = () => {
    if (done) setDone(false);
    else if (index > 0) setIndex((i) => i - 1);
    else navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-5 w-5" />
            approvU
          </Link>
          <span className="text-xs text-muted-foreground">
            Step {done ? total : Math.min(index + 1, total)} of {total}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        {!done && current && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">
              {flow.title}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              {current.title}
            </h1>
            {current.subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{current.subtitle}</p>
            )}

            <div className="mt-8">
              {current.type === "choice" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {current.options.map((opt) => {
                    const selected = stringValue === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setValue(opt.value);
                          setTimeout(() => nextRef.current(), 180);
                        }}
                        className={`group flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-secondary/60 hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected ? "border-primary bg-primary" : "border-border"
                          }`}
                        >
                          {selected && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                        </span>
                        <span>
                          <span className="block font-medium text-foreground">{opt.label}</span>
                          {opt.hint && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {opt.hint}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {current.type === "multi" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {current.options.map((opt) => {
                    const selected = arrayValue.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleMulti(opt.value)}
                        className={`group flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-secondary/60 hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                            selected ? "border-primary bg-primary" : "border-border"
                          }`}
                        >
                          {selected && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                        </span>
                        <span>
                          <span className="block font-medium text-foreground">{opt.label}</span>
                          {opt.hint && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {opt.hint}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {(current.type === "text" || current.type === "currency" || current.type === "number") && (
                <div className="relative max-w-md">
                  {current.prefix && (
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                      {current.prefix}
                    </span>
                  )}
                  <Input
                    autoFocus
                    inputMode={current.type === "text" ? "text" : "numeric"}
                    value={stringValue}
                    onChange={(e) =>
                      setValue(
                        current.type === "currency"
                          ? formatCurrency(e.target.value)
                          : current.id === "credit"
                            ? e.target.value.replace(/[^0-9]/g, "").slice(0, 3)
                            : e.target.value,
                      )
                    }
                    placeholder={current.placeholder}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canContinue) next();
                    }}
                    className={`h-14 text-lg ${current.prefix ? "pl-9" : ""} ${current.id === "credit" ? "text-center text-2xl font-semibold" : ""}`}
                    maxLength={current.id === "credit" ? 3 : undefined}
                  />
                  {current.suffix && (
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                      {current.suffix}
                    </span>
                  )}
                </div>
              )}

              {current.type === "mortgages" && (
                <MortgagesEditor
                  entries={mortgageValue}
                  onChange={setMortgages}
                />
              )}
            </div>
            {current.id === "credit" && <CreditScoreEducation />}
            {validationHint && (
              <p
                className={`mt-3 text-sm ${
                  validationHint.ok ? "text-secondary" : "text-accent"
                }`}
              >
                {validationHint.message}
              </p>
            )}

            <div className="mt-10 flex items-center justify-between">
              <Button variant="ghost" onClick={back}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={next}
                disabled={!canContinue || (validationHint ? !validationHint.ok : false)}
                size="lg"
              >
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {done && (
          <MortgageSnapshot
            flowKey={flowKey}
            answers={answers}
            visible={visible}
            onEdit={back}
          />
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-10 text-center text-xs text-muted-foreground">
        Information shown helps us understand your situation — it is not a mortgage approval.
      </footer>
    </div>
  );
}

function labelFor(q: Question, val: AnswerValue | undefined): string {
  if (val == null) return "—";
  if (q.type === "choice") {
    const v = typeof val === "string" ? val : "";
    return q.options.find((o) => o.value === v)?.label ?? v ?? "—";
  }
  if (q.type === "multi") {
    const arr = (Array.isArray(val) ? val.filter((v) => typeof v === "string") : []) as string[];
    if (arr.length === 0) return "—";
    return arr.map((v) => q.options.find((o) => o.value === v)?.label ?? v).join(", ");
  }
  if (q.type === "mortgages") {
    const arr = (Array.isArray(val) ? val.filter((v) => typeof v === "object") : []) as MortgageEntry[];
    if (!arr.length) return "—";
    return arr
      .map(
        (m) =>
          `#${m.position} ${m.lender || "—"} · $${m.balance || "—"}`,
      )
      .join(" • ");
  }
  if (q.type === "currency") return val ? `$${val as string}` : "—";
  return (typeof val === "string" ? val : "") || "—";
}

function MortgagesEditor({
  entries,
  onChange,
}: {
  entries: MortgageEntry[];
  onChange: (next: MortgageEntry[]) => void;
}) {
  const update = (i: number, patch: Partial<MortgageEntry>) => {
    const next = entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    onChange(next);
  };
  const add = () => {
    if (entries.length >= 3) return;
    onChange([
      ...entries,
      {
        position: entries.length + 1,
        lender: "",
        balance: "",
        payment: "",
        maturity: "",
        rate: "",
      },
    ]);
  };
  const remove = (i: number) => {
    const next = entries.filter((_, idx) => idx !== i).map((e, idx) => ({ ...e, position: idx + 1 }));
    onChange(next);
  };
  const positionLabel = (p: number) =>
    p === 1 ? "First mortgage" : p === 2 ? "Second mortgage" : "Third mortgage";

  return (
    <div className="space-y-4">
      {entries.map((m, i) => (
        <div
          key={i}
          className="rounded-xl border-2 border-border bg-card p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">{positionLabel(m.position)}</p>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Current lender name">
              <Input
                value={m.lender}
                onChange={(e) => update(i, { lender: e.target.value })}
                placeholder="e.g. RBC"
              />
            </Field>
            <Field label="Approximate balance">
              <Input
                inputMode="numeric"
                value={m.balance}
                onChange={(e) => update(i, { balance: formatCurrency(e.target.value) })}
                placeholder="$ 350,000"
              />
            </Field>
            <Field label="Current payment (optional)">
              <Input
                inputMode="numeric"
                value={m.payment ?? ""}
                onChange={(e) => update(i, { payment: formatCurrency(e.target.value) })}
                placeholder="$ 1,800 / month"
              />
            </Field>
            <Field label="Maturity / renewal date (optional)">
              <Input
                value={m.maturity ?? ""}
                onChange={(e) => update(i, { maturity: e.target.value })}
                placeholder="e.g. June 2026"
              />
            </Field>
            <Field label="Interest rate (optional)">
              <Input
                inputMode="decimal"
                value={m.rate ?? ""}
                onChange={(e) => update(i, { rate: e.target.value.replace(/[^0-9.]/g, "") })}
                placeholder="e.g. 5.49"
              />
            </Field>
          </div>
        </div>
      ))}
      {entries.length < 3 && (
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-secondary hover:text-secondary"
        >
          <Plus className="h-4 w-4" /> Add another mortgage
        </button>
      )}
      <p className="text-xs text-muted-foreground">
        If you are not sure of the exact amount, enter your best estimate.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Review({
  flowKey,
  answers,
  visible,
  onBack,
}: {
  flowKey: FlowKey;
  answers: Answers;
  visible: Question[];
  onBack: () => void;
}) {
  const flow = flows[flowKey];
  const insights = computeInsights(flowKey, answers);
  const guidance = computeGuidance(flowKey, answers);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow text-yellow-foreground">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">
              Snapshot ready
            </p>
            <h1 className="text-2xl font-semibold text-foreground">{flow.resultTitle}</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Based on what you shared, you <strong className="text-foreground">may qualify</strong> for
          possible mortgage options. A licensed broker will review your details and walk you
          through next steps.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {insights.map((it) => (
            <SnapshotStat key={it.label} label={it.label} value={it.value} tone={it.tone} />
          ))}
        </div>

        {guidance && (
          <div className="mt-6 rounded-xl border border-border bg-background p-5">
            <h3 className="text-sm font-semibold text-foreground">{guidance.title}</h3>
            {guidance.summary && (
              <p className="mt-1 text-sm text-muted-foreground">{guidance.summary}</p>
            )}
            {guidance.notes.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {guidance.notes.map((n: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            )}
            {guidance.nextSteps && guidance.nextSteps.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Possible next steps
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {guidance.nextSteps.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">Your responses</h2>
          <dl className="mt-3 divide-y divide-border rounded-xl border border-border bg-background">
            {visible.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-muted-foreground">{q.title}</dt>
                <dd className="text-right text-sm font-medium text-foreground">
                  {labelFor(q, answers[q.id])}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Edit answers
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/portal"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground hover:bg-muted"
            >
              View my portal
            </Link>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Talk to a broker
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapshotStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "secondary" | "accent";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    accent: "bg-accent/15 text-accent",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toneCls}`}>
        {label}
      </span>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

type Insight = { label: string; value: string; tone: "primary" | "secondary" | "accent" };

function usageOf(answers: Answers): PropertyUsage {
  const u = (answers.use as string) || (answers.primary === "yes" ? "primary" : "");
  if (u === "rental" || u === "secondary" || u === "primary") return u;
  return "primary";
}

function computeInsights(flowKey: FlowKey, answers: Answers): Insight[] {
  if (flowKey === "purchase") {
    const price = parseCurrency(answers.price as string);
    const down = parseCurrency(answers.down as string);
    const usage = usageOf(answers);
    const out: Insight[] = [];
    if (price > 0) {
      const req = calculateMinimumDownPayment(price, usage);
      out.push({
        label: "Minimum down payment",
        value: formatCAD(req.minimumAmount),
        tone: "primary",
      });
      if (down > 0) {
        const loan = Math.max(price - down, 0);
        out.push({ label: "Loan-to-value", value: `${ltv(loan, price)}%`, tone: "secondary" });
        const est = monthlyPayment(loan, 5.49, 25);
        out.push({
          label: "Est. monthly (5.49% / 25y)",
          value: formatCAD(est),
          tone: "accent",
        });
      } else {
        out.push({ label: "Min %", value: `${req.minimumPercentage}%`, tone: "secondary" });
        out.push({ label: "Next step", value: "Broker call", tone: "accent" });
      }
    }
    return out.length ? out : defaultInsights();
  }

  if (flowKey === "refinance") {
    const mortgages = (Array.isArray(answers.mortgages)
      ? (answers.mortgages as MortgageEntry[]).filter((m) => typeof m === "object")
      : []) as MortgageEntry[];
    const balance = mortgages.reduce((s, m) => s + parseCurrency(m.balance), 0);
    const value = parseCurrency(answers.value as string);
    const out: Insight[] = [];
    const intents = Array.isArray(answers.intent) ? (answers.intent as string[]) : [];
    const renewal = analyzeRenewalIntent(intents, {
      homeValue: value || undefined,
      currentBalance: balance || undefined,
    });
    out.push({
      label: "Recommended path",
      value:
        renewal.recommendedFlow === "refinance"
          ? "Refinance"
          : renewal.recommendedFlow === "hybrid"
            ? "Renewal + Refinance"
            : "Renewal",
      tone: "primary",
    });
    if (balance > 0 && value > 0) {
      out.push({ label: "Current LTV", value: `${ltv(balance, value)}%`, tone: "secondary" });
      out.push({
        label: "Available equity",
        value: formatCAD(Math.max(value * 0.8 - balance, 0)),
        tone: "accent",
      });
    }
    return out.length ? out : defaultInsights();
  }

  // pre-approval
  return defaultInsights();
}

function defaultInsights(): Insight[] {
  return [
    { label: "Estimated readiness", value: "Strong", tone: "primary" },
    { label: "Possible programs", value: "3–5", tone: "secondary" },
    { label: "Next step", value: "Broker call", tone: "accent" },
  ];
}

function CreditScoreEducation() {
  return (
    <div className="mt-6 space-y-4 max-w-md">
      <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-semibold">We work with prime and alternative lenders.</span>{" "}
          Whether you have excellent credit or are working to rebuild, we'll help you find
          mortgage options that fit your situation.
        </p>
      </div>
      <details className="group rounded-lg">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-secondary hover:text-primary transition-colors">
          <span>Understanding credit score ranges</span>
          <ArrowRight className="h-4 w-4 rotate-90 transition-transform group-open:-rotate-90" />
        </summary>
        <div className="mt-3 space-y-4 text-sm">
          <div className="border-l-4 border-mint pl-3">
            <p className="mb-2 font-semibold text-foreground">Prime Mortgage Range (620–900)</p>
            <CreditRow label="780+" hint="Typically qualifies for best rates" />
            <CreditRow label="700–779" hint="Good qualification options" />
            <CreditRow label="650–699" hint="Strong qualification range" />
            <CreditRow label="620–649" hint="Strong qualification range" />
          </div>
          <div className="border-l-4 border-yellow pl-3">
            <p className="mb-2 font-semibold text-foreground">Alternative Mortgage Range (500–619)</p>
            <CreditRow label="550–619" hint="Alternative programs available" />
            <CreditRow label="500–549" hint="Alternative programs available" />
          </div>
          <div className="border-l-4 border-accent pl-3">
            <p className="mb-1 font-semibold text-foreground">Private Range (Below 500)</p>
            <p className="text-xs text-muted-foreground">
              We cannot assist with mortgages in this range at this time.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}

function CreditRow({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

function _legacyDefaultInsights(): Insight[] {
  return [
    { label: "Estimated readiness", value: "Strong", tone: "primary" },
    { label: "Possible programs", value: "3–5", tone: "secondary" },
    { label: "Next step", value: "Broker call", tone: "accent" },
  ];
}

type Guidance = {
  title: string;
  summary?: string;
  notes: string[];
  nextSteps?: string[];
};

function computeGuidance(flowKey: FlowKey, answers: Answers): Guidance | null {
  if (flowKey === "purchase") {
    const price = parseCurrency(answers.price as string);
    const down = parseCurrency(answers.down as string);
    if (!price) return null;
    const usage = usageOf(answers);
    const req = calculateMinimumDownPayment(price, usage);
    const notes: string[] = [
      `Minimum down payment: ${formatCAD(req.minimumAmount)} (${req.minimumPercentage}%).`,
      req.explanation,
    ];
    if (down > 0) {
      const v = validateDownPayment(down, price, usage);
      notes.push(
        v.isValid
          ? `You're putting down ${downPaymentPercentage(down, price)}% — meets the minimum.`
          : `Short by ${formatCAD(v.shortfall)}.`,
      );
    }
    return {
      title: "Down payment guidance",
      summary: "Canadian minimums based on property value and usage.",
      notes,
      nextSteps: [
        "A licensed broker will review your down payment source.",
        "We'll explore lender programs that may fit your scenario.",
      ],
    };
  }

  if (flowKey === "refinance") {
    const mortgages = (Array.isArray(answers.mortgages)
      ? (answers.mortgages as MortgageEntry[]).filter((m) => typeof m === "object")
      : []) as MortgageEntry[];
    const balance = mortgages.reduce((s, m) => s + parseCurrency(m.balance), 0);
    const value = parseCurrency(answers.value as string);
    const intents = Array.isArray(answers.intent) ? (answers.intent as string[]) : [];
    if (!intents.length) return null;
    const r = analyzeRenewalIntent(intents, {
      homeValue: value || undefined,
      currentBalance: balance || undefined,
    });
    return {
      title:
        r.recommendedFlow === "refinance"
          ? "Looks like a refinance"
          : r.recommendedFlow === "hybrid"
            ? "Renewal + refinance"
            : "Looks like a renewal",
      summary: `Estimated timeline: ${r.estimatedTimeline} · Estimated costs: ${r.estimatedCosts}`,
      notes: r.warnings,
      nextSteps: r.nextSteps,
    };
  }

  return null;
}

function estimatePrincipal(targetPayment: number, ratePct: number, years: number): number {
  const r = ratePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return targetPayment * n;
  return (targetPayment * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}
