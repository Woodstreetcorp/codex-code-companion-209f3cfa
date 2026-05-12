import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Landmark,
  Lock,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export type BankProvider = "Flinks" | "Plaid" | "Inverite";

export type BankConnectResult = {
  provider: BankProvider;
  institution: string;
  accounts: { id: string; name: string; mask: string; type: "Chequing" | "Savings" }[];
  monthsRetrieved: number;
};

const INSTITUTIONS = [
  { id: "rbc", name: "RBC Royal Bank", color: "#005DAA" },
  { id: "td", name: "TD Canada Trust", color: "#008752" },
  { id: "bmo", name: "BMO Bank of Montreal", color: "#0079C1" },
  { id: "scotia", name: "Scotiabank", color: "#EC111A" },
  { id: "cibc", name: "CIBC", color: "#C41F3E" },
  { id: "nbc", name: "National Bank", color: "#E4002B" },
  { id: "tangerine", name: "Tangerine", color: "#F58220" },
  { id: "desjardins", name: "Desjardins", color: "#00874E" },
  { id: "simplii", name: "Simplii Financial", color: "#A0202C" },
  { id: "eq", name: "EQ Bank", color: "#5B2D90" },
];

const ACCOUNTS_FOR = (instId: string) => [
  { id: `${instId}-chq`, name: "Everyday Chequing", mask: "•• 4421", type: "Chequing" as const },
  { id: `${instId}-sav`, name: "High-Interest Savings", mask: "•• 8870", type: "Savings" as const },
  { id: `${instId}-tfsa`, name: "TFSA Savings", mask: "•• 1209", type: "Savings" as const },
];

type Step = "institution" | "credentials" | "mfa" | "accounts" | "consent" | "pulling" | "success";

export function BankConnectDialog({
  open,
  onOpenChange,
  provider,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  provider: BankProvider;
  onComplete: (result: BankConnectResult) => void;
}) {
  const [step, setStep] = useState<Step>("institution");
  const [institution, setInstitution] = useState<typeof INSTITUTIONS[number] | null>(null);
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [mfa, setMfa] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, boolean>>({});
  const [months, setMonths] = useState(3);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BankConnectResult | null>(null);
  const timer = useRef<number | null>(null);

  // reset on open
  useEffect(() => {
    if (open) {
      setStep("institution");
      setInstitution(null);
      setQuery("");
      setUsername("");
      setPassword("");
      setShowPwd(false);
      setMfa("");
      setSelectedAccounts({});
      setMonths(3);
      setProgress(0);
      setResult(null);
    }
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [open]);

  const filtered = useMemo(
    () => INSTITUTIONS.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const accounts = institution ? ACCOUNTS_FOR(institution.id) : [];
  const selectedCount = Object.values(selectedAccounts).filter(Boolean).length;

  function startPull() {
    setStep("pulling");
    setProgress(0);
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 18 + 6);
        if (next >= 100 && timer.current) {
          window.clearInterval(timer.current);
          const chosen = accounts.filter((a) => selectedAccounts[a.id]);
          const r: BankConnectResult = {
            provider,
            institution: institution!.name,
            accounts: chosen,
            monthsRetrieved: months,
          };
          setResult(r);
          setStep("success");
        }
        return next;
      });
    }, 350);
  }

  function finish() {
    if (result) onComplete(result);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Provider chrome */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-foreground">Secured by {provider}</p>
              <p className="text-[10px] text-muted-foreground">Bank-grade · Read-only · Credentials never stored</p>
            </div>
          </div>
          <span className="rounded-full bg-mint/30 px-2 py-0.5 text-[10px] font-medium text-foreground">
            256-bit TLS
          </span>
        </div>

        <div className="px-5 pb-5 pt-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">{titleFor(step)}</DialogTitle>
            <DialogDescription className="text-xs">{descFor(step, institution?.name)}</DialogDescription>
          </DialogHeader>

          {/* Step body */}
          <div className="mt-4">
            {step === "institution" && (
              <div>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search 250+ Canadian institutions"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <div className="mt-3 grid max-h-72 grid-cols-1 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filtered.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => {
                        setInstitution(i);
                        setStep("credentials");
                      }}
                      className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm hover:border-primary/40 hover:bg-muted"
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold text-white"
                        style={{ backgroundColor: i.color }}
                      >
                        {i.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                      <span className="flex-1 truncate">{i.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="col-span-full py-6 text-center text-xs text-muted-foreground">
                      No institutions match "{query}". Try a shorter name.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === "credentials" && institution && (
              <div className="space-y-3">
                <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Sign in with your <span className="font-medium text-foreground">{institution.name}</span> online banking credentials. They are sent directly to {provider} and never seen by approvU.
                </div>
                <Field label="Username / Card number">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. 4519 •••• •••• 0021"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </Field>
                <Field label="Password">
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 pr-9 text-sm focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Footer
                  onBack={() => setStep("institution")}
                  onNext={() => setStep("mfa")}
                  nextLabel="Continue"
                  nextDisabled={!username || !password}
                />
              </div>
            )}

            {step === "mfa" && (
              <div className="space-y-3">
                <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Your bank requires an additional security step. Enter the one-time code we just sent to your phone, or answer your security question.
                </div>
                <Field label="Security code">
                  <input
                    inputMode="numeric"
                    value={mfa}
                    onChange={(e) => setMfa(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm tracking-widest focus:border-primary focus:outline-none"
                  />
                </Field>
                <Footer
                  onBack={() => setStep("credentials")}
                  onNext={() => {
                    // pre-select chequing
                    const def: Record<string, boolean> = {};
                    accounts.forEach((a) => (def[a.id] = a.type === "Chequing"));
                    setSelectedAccounts(def);
                    setStep("accounts");
                  }}
                  nextLabel="Verify"
                  nextDisabled={mfa.length < 4}
                />
              </div>
            )}

            {step === "accounts" && institution && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {accounts.map((a) => {
                    const checked = !!selectedAccounts[a.id];
                    return (
                      <label
                        key={a.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm ${
                          checked ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setSelectedAccounts((s) => ({ ...s, [a.id]: e.target.checked }))
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.type} · {a.mask}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <Footer
                  onBack={() => setStep("mfa")}
                  onNext={() => setStep("consent")}
                  nextLabel={`Continue (${selectedCount})`}
                  nextDisabled={selectedCount === 0}
                />
              </div>
            )}

            {step === "consent" && (
              <div className="space-y-3">
                <Field label="History to retrieve">
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium ${
                          months === m
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {m} months
                      </button>
                    ))}
                  </div>
                </Field>
                <ul className="space-y-1.5 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <li className="flex gap-2"><ShieldCheck className="h-3.5 w-3.5 text-secondary" /> Read-only access — no funds can move.</li>
                  <li className="flex gap-2"><ShieldCheck className="h-3.5 w-3.5 text-secondary" /> Statements & transactions only — no card numbers.</li>
                  <li className="flex gap-2"><ShieldCheck className="h-3.5 w-3.5 text-secondary" /> You can revoke this access anytime from Settings → Connections.</li>
                </ul>
                <Footer
                  onBack={() => setStep("accounts")}
                  onNext={startPull}
                  nextLabel="I agree — connect"
                />
              </div>
            )}

            {step === "pulling" && (
              <div className="space-y-3 py-4 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Securely retrieving statements…</p>
                <p className="text-xs text-muted-foreground">
                  {institution?.name} · {months} months · {selectedCount} account{selectedCount === 1 ? "" : "s"}
                </p>
                <div className="mx-auto h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {step === "success" && result && (
              <div className="space-y-3 py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint/30">
                  <CheckCircle2 className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{result.institution} connected</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Pulled {result.monthsRetrieved} months of statements from {result.accounts.length} account{result.accounts.length === 1 ? "" : "s"}.
                  </p>
                </div>
                <ul className="mx-auto max-w-xs space-y-1 text-left">
                  {result.accounts.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                      <span className="flex-1">{a.name}</span>
                      <span className="text-muted-foreground">{a.mask}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={finish}
                  className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Footer({
  onBack, onNext, nextLabel, nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-2 flex items-center justify-between">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextLabel} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function titleFor(step: Step) {
  switch (step) {
    case "institution": return "Choose your bank";
    case "credentials": return "Sign in to your bank";
    case "mfa": return "Verify it's you";
    case "accounts": return "Select accounts to share";
    case "consent": return "Confirm & consent";
    case "pulling": return "Connecting…";
    case "success": return "All set";
  }
}
function descFor(step: Step, inst?: string) {
  switch (step) {
    case "institution": return "Your credentials go straight to the bank — approvU never sees them.";
    case "credentials": return inst ? `Use the same details you use at ${inst}.` : "";
    case "mfa": return "Enter the verification code your bank sent.";
    case "accounts": return "Pick the accounts the lender should see for income & down-payment proof.";
    case "consent": return "Read-only access. You can revoke anytime.";
    case "pulling": return "This usually takes 10–20 seconds.";
    case "success": return "Statements have been added to your Document Vault.";
  }
}