import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Gift, Sparkles, X } from "lucide-react";
import {
  CompletionSummaryPanel,
  Field,
  FormCard,
  InfoNote,
  PageHeader,
  PageShell,
  SaveAndContinueBar,
  TxType,
  fmtMoney,
} from "@/components/property-financing/shared";

export const Route = createFileRoute(
  "/portal/applications/$applicationId/mortgage-offers",
)({
  head: () => ({
    meta: [
      { title: "Your Mortgage Offers — approvU" },
      {
        name: "description",
        content: "Review the mortgage offer you selected from your initial qualification.",
      },
    ],
  }),
  component: SelectedMortgageOffersPage,
});

const offer = {
  name: "Best Value Fixed Offer",
  productPath: "Monoline Lender Path",
  rate: 4.89,
  payment: 2358,
  loanAmount: 748024,
  term: "5-Year Fixed",
  rateType: "Fixed",
  ltv: 90,
  bundleName: "HomeStrategy Advantage™",
  bundleValue: 2350,
  benefits: [
    { label: "Home Inspection Credit", value: 500 },
    { label: "Legal Fee Rebate", value: 500 },
    { label: "Moving Expense Credit", value: 500 },
    { label: "Home Insurance Credit", value: 450 },
    { label: "No Appraisal Fee", value: 400 },
  ],
};

function SelectedMortgageOffersPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const tx: TxType = "Purchase";

  const [confirm, setConfirm] = useState<"yes" | "review" | "">("");
  const [showChangeModal, setShowChangeModal] = useState(false);

  const groupsDone = [confirm === "yes"];
  const progress = confirm === "yes" ? 100 : 50;

  return (
    <PageShell>
      <PageHeader
        applicationId={applicationId}
        tx={tx}
        title="Your Mortgage Offers"
        subtitle="Review the mortgage offer you selected from your initial qualification."
        progress={progress}
        saveStatus="saved"
      />

      <CompletionSummaryPanel total={1} done={groupsDone.filter(Boolean).length} />

      <FormCard
        step={1}
        title="Selected Mortgage Offer"
        description="The offer direction you chose during qualification"
      >
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                <Sparkles className="h-3 w-3" /> Selected
              </span>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{offer.name}</h3>
              <p className="text-xs text-muted-foreground">
                {offer.productPath} · {offer.term}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{offer.rate}%</p>
              <p className="text-xs text-muted-foreground">Estimated rate</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Est. payment" value={`${fmtMoney(offer.payment)}/mo`} />
            <Stat label="Loan amount" value={fmtMoney(offer.loanAmount)} />
            <Stat label="Rate type" value={offer.rateType} />
            <Stat label="Estimated LTV" value={`${offer.ltv}%`} />
          </div>
        </div>
      </FormCard>

      <FormCard step={2} title="What This Offer Is Based On">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            ["Transaction type", "Purchase"],
            ["Property value", fmtMoney(832000)],
            ["Down payment", fmtMoney(83976)],
            ["Loan amount", fmtMoney(offer.loanAmount)],
            ["Credit profile", "Strong"],
            ["Income profile", "Salaried"],
            ["Property usage", "Primary residence"],
            ["Location", "Toronto, ON"],
            ["Term preference", "5 years"],
            ["Rate type preference", "Fixed"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium text-foreground">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          These details came from your initial qualification answers. Your final offer may change if your full application details are different.
        </p>
      </FormCard>

      <FormCard step={3} title="Why This Offer May Fit">
        <ul className="space-y-2 text-sm">
          {[
            "Matches your transaction type",
            "Matches your estimated loan amount and LTV",
            "Matches your selected term and rate preference",
            "Includes a Home Life Bundle worth $2,350",
            "Supports your borrower profile based on initial answers",
          ].map((r) => (
            <li key={r} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-foreground" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </FormCard>

      <FormCard step={4} title="Included Home Life Bundle" description={offer.bundleName}>
        <div className="flex items-center justify-between rounded-xl bg-mint/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-mint-foreground" />
            <div>
              <p className="text-sm font-semibold">{offer.bundleName}</p>
              <p className="text-[11px] text-muted-foreground">
                {offer.benefits.length} included benefits
              </p>
            </div>
          </div>
          <p className="text-lg font-bold text-foreground">{fmtMoney(offer.bundleValue)}</p>
        </div>
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
          {offer.benefits.map((b) => (
            <li key={b.label} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{b.label}</span>
              <span className="font-medium">{fmtMoney(b.value)}</span>
            </li>
          ))}
        </ul>
      </FormCard>

      <InfoNote>
        Your selected offer is based on your initial answers. Your final mortgage product, rate, payment, and benefits may change after your full application is verified. If your verified information changes your eligibility, approvU will show you updated options before submission.
      </InfoNote>

      <FormCard step={5} title="Confirm Your Selection" done={confirm === "yes"}>
        <Field label="Do you want to continue with this selected offer as your preliminary mortgage direction?" required>
          <div className="space-y-2">
            {[
              { value: "yes", label: "Yes, continue with this offer" },
              { value: "review", label: "I want to review other options" },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  if (o.value === "review") setShowChangeModal(true);
                  setConfirm(o.value as "yes" | "review");
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${
                  confirm === o.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <span>{o.label}</span>
                {confirm === o.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </Field>
      </FormCard>

      <SaveAndContinueBar
        applicationId={applicationId}
        canComplete={confirm === "yes"}
        nextLabel="Confirm Offer & Continue"
        onSaveContinue={() =>
          navigate({
            to: "/portal/applications/$applicationId/product-review-consent",
            params: { applicationId },
          })
        }
      />

      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold">Change selected offer?</h3>
              <button onClick={() => setShowChangeModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Changing your selected offer may update your Home Life Bundle and submission path. Are you sure you want to review other options?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setConfirm("yes");
                  setShowChangeModal(false);
                }}
                className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
              >
                Keep Current Offer
              </button>
              <button
                onClick={() => setShowChangeModal(false)}
                className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Review Other Offers
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/70 p-2.5">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}