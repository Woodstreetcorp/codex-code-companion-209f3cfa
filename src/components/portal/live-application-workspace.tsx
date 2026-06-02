import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  FileCheck2,
  HandCoins,
  Home,
  Landmark,
  Loader2,
  PiggyBank,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ALL_SECTION_KEYS,
  SECTION_LABELS,
  getBorrowerApplicationSection,
  getBorrowerApplicationSubmissionReadiness,
  getBorrowerApplicationWorkspace,
  normalizeSectionStatus,
  saveBorrowerApplicationSection,
  submitBorrowerApplication,
  type ApplicationProgress,
  type ApplicationSection,
  type ApplicationSectionKey,
  type ApplicationSectionStatus,
  type BorrowerApplicationSectionResponse,
  type BorrowerApplicationWorkspaceResponse,
  type SubmissionBlocker,
  type SubmissionReadinessResponse,
} from "@/lib/api/borrowerApplicationSectionsApi";
import {
  listBorrowerApplicationConsents,
  submitBorrowerApplicationConsent,
  type ConsentType,
} from "@/lib/api/borrowerApplicationConsentsApi";
import {
  listBorrowerDocumentRequests,
  type BorrowerDocumentRequest,
} from "@/lib/api/borrowerDocumentApi";

type WorkspaceSectionKey = "overview" | ApplicationSectionKey;
type NormalizedStatus = Exclude<ApplicationSectionStatus, "complete">;

type FieldDefinition = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "date" | "number" | "textarea" | "checkbox";
  helper?: string;
};

type SectionDefinition = {
  key: WorkspaceSectionKey;
  label: string;
  shortLabel: string;
  route: string;
  icon: typeof Circle;
  description: string;
  expectedFields: string[];
  fields?: FieldDefinition[];
};

const APPLICATION_SECTIONS: SectionDefinition[] = [
  {
    key: "overview",
    label: "Application Overview",
    shortLabel: "Overview",
    route: "/portal/applications/$applicationId",
    icon: ClipboardCheck,
    description: "Review the current application status and continue the next required section.",
    expectedFields: ["Application status", "Public reference", "Progress", "Next step"],
  },
  {
    key: "personal-details",
    label: "Personal Details",
    shortLabel: "Personal",
    route: "/portal/applications/$applicationId/personal-details",
    icon: Users,
    description: "Confirm your legal identity and contact details.",
    expectedFields: ["Legal name", "Email", "Phone", "Date of birth", "Residency status"],
    fields: [
      { name: "first_name", label: "First name" },
      { name: "last_name", label: "Last name" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "date_of_birth", label: "Date of birth", type: "date" },
      { name: "residency_status", label: "Residency status" },
    ],
  },
  {
    key: "borrowers",
    label: "Borrowers and Co-Borrowers",
    shortLabel: "Borrowers",
    route: "/portal/applications/$applicationId/borrowers",
    icon: Users,
    description: "Confirm the primary borrower and add co-borrower information when needed.",
    expectedFields: ["Primary borrower", "Co-borrowers", "Invite status"],
    fields: [
      { name: "borrower_first_name", label: "Primary borrower first name" },
      { name: "borrower_last_name", label: "Primary borrower last name" },
      { name: "borrower_email", label: "Primary borrower email", type: "email" },
      { name: "co_borrower_name", label: "Co-borrower name", helper: "Optional" },
    ],
  },
  {
    key: "employment",
    label: "Employment",
    shortLabel: "Employment",
    route: "/portal/applications/$applicationId/employment",
    icon: BriefcaseBusiness,
    description: "Provide employment details that support your income profile.",
    expectedFields: ["Employment type", "Employment status", "Employer", "Role", "Start date"],
    fields: [
      { name: "employment_type", label: "Employment type" },
      { name: "employment_status", label: "Employment status" },
      { name: "employer_name", label: "Employer name" },
      { name: "job_title", label: "Job title" },
      { name: "start_date", label: "Start date", type: "date" },
      { name: "probationary", label: "Currently probationary", type: "checkbox" },
    ],
  },
  {
    key: "income",
    label: "Income",
    shortLabel: "Income",
    route: "/portal/applications/$applicationId/income",
    icon: DollarSign,
    description: "Review income sources used for preliminary mortgage analysis.",
    expectedFields: ["Annual income", "Income type", "Verifiable income", "Other income"],
    fields: [
      { name: "annual_income", label: "Annual income", type: "number" },
      { name: "income_type", label: "Income type" },
      { name: "monthly_income", label: "Monthly income", type: "number" },
      { name: "business_income", label: "Business income", type: "number" },
      { name: "rental_income", label: "Rental income", type: "number" },
      { name: "income_verifiable", label: "Income is verifiable", type: "checkbox" },
    ],
  },
  {
    key: "assets",
    label: "Assets",
    shortLabel: "Assets",
    route: "/portal/applications/$applicationId/assets",
    icon: PiggyBank,
    description: "Add funds and assets available for closing or reserves.",
    expectedFields: ["Savings", "Investments", "Gift funds", "RRSP/FHSA", "Other assets"],
    fields: [
      { name: "cash_savings", label: "Cash savings", type: "number" },
      { name: "investments", label: "Investments", type: "number" },
      { name: "rrsp_fhsa", label: "RRSP/FHSA", type: "number" },
      { name: "gift_funds", label: "Gift funds", type: "number" },
      { name: "sale_proceeds", label: "Sale proceeds", type: "number" },
      { name: "other_assets", label: "Other assets", type: "number" },
    ],
  },
  {
    key: "liabilities",
    label: "Liabilities",
    shortLabel: "Liabilities",
    route: "/portal/applications/$applicationId/liabilities",
    icon: CreditCard,
    description: "Capture debts and monthly payments that affect affordability.",
    expectedFields: ["Credit cards", "Car loans", "Student loans", "Lines of credit"],
    fields: [
      { name: "credit_card_balance", label: "Credit card balance", type: "number" },
      { name: "credit_card_payment", label: "Credit card monthly payment", type: "number" },
      { name: "car_loan_balance", label: "Car loan balance", type: "number" },
      { name: "car_loan_payment", label: "Car loan monthly payment", type: "number" },
      { name: "student_loan_balance", label: "Student loan balance", type: "number" },
      { name: "student_loan_payment", label: "Student loan monthly payment", type: "number" },
      { name: "line_of_credit", label: "Line of credit balance", type: "number" },
      { name: "other_debt", label: "Other debt", type: "number" },
    ],
  },
  {
    key: "credit",
    label: "Credit",
    shortLabel: "Credit",
    route: "/portal/applications/$applicationId/credit",
    icon: ShieldCheck,
    description: "Confirm borrower-safe credit profile details.",
    expectedFields: ["Credit range", "Credit consent", "Bankruptcy/proposal flags"],
    fields: [
      { name: "credit_score_range", label: "Credit score range" },
      {
        name: "credit_consent_acknowledged",
        label: "Credit consent acknowledged",
        type: "checkbox",
      },
      {
        name: "bankruptcy_or_proposal",
        label: "Bankruptcy or consumer proposal",
        type: "checkbox",
      },
      { name: "bankruptcy_clear_years", label: "Years since cleared", type: "number" },
      { name: "credit_notes", label: "Credit notes", type: "textarea" },
    ],
  },
  {
    key: "property",
    label: "Subject Property",
    shortLabel: "Property",
    route: "/portal/applications/$applicationId/property",
    icon: Home,
    description: "Confirm the property connected to this mortgage request.",
    expectedFields: ["Address", "City", "Province", "Property type", "Occupancy", "Value"],
    fields: [
      { name: "street_address", label: "Street address" },
      { name: "unit", label: "Unit", helper: "Optional" },
      { name: "city", label: "City" },
      { name: "province", label: "Province" },
      { name: "postal_code", label: "Postal code" },
      { name: "country", label: "Country" },
      { name: "property_type", label: "Property type" },
      { name: "occupancy", label: "Occupancy" },
      { name: "purchase_price_or_value", label: "Purchase price or value", type: "number" },
    ],
  },
  {
    key: "other-properties",
    label: "Other Properties",
    shortLabel: "Other properties",
    route: "/portal/applications/$applicationId/other-properties",
    icon: Building,
    description: "List additional properties you own or finance.",
    expectedFields: ["Other property details", "Mortgage balance", "Rental income"],
    fields: [
      { name: "properties_notes", label: "Other property details", type: "textarea" },
      { name: "estimated_value", label: "Estimated value", type: "number" },
      { name: "mortgage_balance", label: "Mortgage balance", type: "number" },
      { name: "monthly_payment", label: "Monthly payment", type: "number" },
      { name: "rental_income", label: "Rental income", type: "number" },
    ],
  },
  {
    key: "mortgage-request",
    label: "Mortgage Request",
    shortLabel: "Request",
    route: "/portal/applications/$applicationId/mortgage-request",
    icon: Landmark,
    description: "Confirm the type, amount, term, and amortization preference.",
    expectedFields: ["Transaction type", "Loan amount", "Term", "Rate type", "Amortization"],
    fields: [
      { name: "transaction_type", label: "Transaction type" },
      { name: "requested_mortgage_amount", label: "Requested mortgage amount", type: "number" },
      { name: "term_preference", label: "Term preference" },
      { name: "rate_type_preference", label: "Rate type preference" },
      { name: "amortization_years", label: "Amortization years", type: "number" },
      { name: "closing_date", label: "Closing date", type: "date" },
    ],
  },
  {
    key: "financing",
    label: "Financing & Equity",
    shortLabel: "Financing",
    route: "/portal/applications/$applicationId/financing",
    icon: HandCoins,
    description: "Review down payment, refinance equity, and source of funds.",
    expectedFields: ["Down payment", "Equity", "Source of funds", "Closing costs"],
    fields: [
      { name: "down_payment_amount", label: "Down payment amount", type: "number" },
      { name: "down_payment_percent", label: "Down payment percent", type: "number" },
      {
        name: "down_payment_sources",
        label: "Down payment sources",
        helper: "Separate multiple sources with commas",
      },
      { name: "gift_amount", label: "Gift amount", type: "number" },
      { name: "refinance_equity", label: "Refinance equity", type: "number" },
      { name: "closing_cost_reserve", label: "Closing cost reserve", type: "number" },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    shortLabel: "Documents",
    route: "/portal/applications/$applicationId/documents",
    icon: UploadCloud,
    description: "Review requested documents and upload status.",
    expectedFields: ["Requested documents", "Uploaded count", "Review status"],
  },
  {
    key: "consents",
    label: "Consents",
    shortLabel: "Consents",
    route: "/portal/applications/$applicationId/consents",
    icon: ShieldCheck,
    description: "Review and accept required borrower consents.",
    expectedFields: ["Privacy", "Credit bureau", "Lender sharing", "Submission consent"],
  },
  {
    key: "review",
    label: "Review & Submit",
    shortLabel: "Review",
    route: "/portal/applications/$applicationId/review",
    icon: FileCheck2,
    description: "Review readiness and submit when every required item is complete.",
    expectedFields: ["Completed sections", "Documents", "Consents", "Offer selection"],
  },
];

const REQUIRED_CONSENTS: Array<{ type: ConsentType; label: string; text: string }> = [
  {
    type: "privacy",
    label: "Privacy consent",
    text: "I consent to approvU collecting and using my information for my mortgage application.",
  },
  {
    type: "electronic_communication",
    label: "Electronic communication",
    text: "I consent to receiving electronic communications about my mortgage application.",
  },
  {
    type: "document_collection",
    label: "Document collection",
    text: "I consent to secure document collection for mortgage review.",
  },
  {
    type: "credit_bureau",
    label: "Credit bureau",
    text: "I consent to credit bureau checks where required for mortgage review.",
  },
  {
    type: "lender_sharing",
    label: "Lender sharing",
    text: "I consent to sharing my application details with appropriate lenders for review.",
  },
  {
    type: "application_submission",
    label: "Application submission",
    text: "I confirm the information I submit is accurate to the best of my knowledge.",
  },
];

export function BorrowerApplicationWorkspace({
  applicationId,
  activeSection,
}: {
  applicationId: string;
  activeSection: WorkspaceSectionKey;
}) {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<BorrowerApplicationWorkspaceResponse | null>(null);
  const [sectionResponse, setSectionResponse] = useState<BorrowerApplicationSectionResponse | null>(
    null,
  );
  const [readiness, setReadiness] = useState<SubmissionReadinessResponse | null>(null);
  const [documentRequests, setDocumentRequests] = useState<BorrowerDocumentRequest[]>([]);
  const [consentState, setConsentState] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeDefinition = sectionDefinition(activeSection);
  const activeIndex = Math.max(
    APPLICATION_SECTIONS.findIndex((section) => section.key === activeSection),
    0,
  );
  const previous = activeIndex > 0 ? APPLICATION_SECTIONS[activeIndex - 1] : null;
  const next =
    activeIndex < APPLICATION_SECTIONS.length - 1 ? APPLICATION_SECTIONS[activeIndex + 1] : null;

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await getBorrowerApplicationWorkspace();
      setWorkspace(result);

      if (activeSection !== "overview") {
        const sectionResult = await getBorrowerApplicationSection(activeSection);
        setSectionResponse(sectionResult);
        setFormData(formDataFromSection(activeSection, sectionResult.section));
      } else {
        setSectionResponse(null);
        setFormData({});
      }

      if (activeSection === "documents") {
        const documents = await listBorrowerDocumentRequests();
        setDocumentRequests(documents.requests ?? []);
      }

      if (activeSection === "consents") {
        const consents = await listBorrowerApplicationConsents();
        setConsentState(
          Object.fromEntries(
            (consents.consents ?? []).map((consent) => [
              String(consent.consent_type ?? ""),
              String(consent.status ?? ""),
            ]),
          ),
        );
      }

      if (activeSection === "review") {
        setReadiness(await getBorrowerApplicationSubmissionReadiness());
      } else {
        setReadiness(null);
      }
    } catch (failure) {
      const status = (failure as Error & { status?: number }).status;
      if (status === 401) {
        await navigate({
          to: "/login",
          search: {
            redirect:
              activeSection === "overview"
                ? `/portal/applications/${applicationId}`
                : `/portal/applications/${applicationId}/${activeSection}`,
          },
        });
        return;
      }
      setError(safeErrorMessage(failure, "Application workspace could not load."));
    } finally {
      setLoading(false);
    }
  }, [activeSection, applicationId, navigate]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const statusByKey = useMemo(() => buildStatusMap(workspace), [workspace]);
  const progress = workspace?.progress ?? progressFromSummary(workspace?.sections_summary);

  async function handleSave(intent: "save" | "save_and_continue") {
    if (activeSection === "overview") return;
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = buildPayload(activeSection, formData);
      const result = await saveBorrowerApplicationSection(
        activeSection,
        {
          data: payload,
          current_step: activeSection,
          status: intent === "save_and_continue" ? "completed" : "in_progress",
        },
        intent,
      );
      setSectionResponse(result);
      setNotice(result.message ?? "Section saved.");
      setWorkspace(await getBorrowerApplicationWorkspace());

      if (intent === "save_and_continue") {
        await navigateToSection(applicationId, result.next_step ?? next?.key ?? "review", navigate);
      }
    } catch (failure) {
      setError(safeErrorMessage(failure, "This section could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAcceptConsent(type: ConsentType, text: string) {
    setSaving(true);
    setError(null);
    try {
      const result = await submitBorrowerApplicationConsent({
        consent_type: type,
        accepted: true,
        consent_version: "v1",
        consent_text: text,
      });
      setConsentState(
        Object.fromEntries(
          (result.consents ?? []).map((consent) => [
            String(consent.consent_type ?? ""),
            String(consent.status ?? ""),
          ]),
        ),
      );
      setNotice("Consent saved.");
    } catch (failure) {
      setError(safeErrorMessage(failure, "Consent could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await submitBorrowerApplication();
      setNotice(result.message ?? "Application submitted.");
      setReadiness(await getBorrowerApplicationSubmissionReadiness());
    } catch (failure) {
      setError(safeErrorMessage(failure, "Application could not be submitted."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your application workspace...</p>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <AlertCircle className="h-8 w-8 text-coral" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">
          We could not load your application
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{error}</p>
        <Link
          to="/login"
          search={{ redirect: `/portal/applications/${applicationId}` }}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Sign in
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/portal/applications"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Applications
        </Link>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Mortgage application
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {safeText(workspace?.application?.public_reference, applicationId)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Complete each section below. Your progress is saved to your approvU account.
            </p>
          </div>
          <StatusPill status={workspace?.application?.status ?? "in_progress"} />
        </div>

        <ProgressBar progress={progress} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card p-3 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <nav className="space-y-1" aria-label="Application sections">
            {APPLICATION_SECTIONS.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeSection;
              const status = statusByKey[item.key] ?? "not_started";
              return (
                <Link
                  key={item.key}
                  to={item.route}
                  params={{ applicationId }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.shortLabel}</span>
                  <StatusDot status={status} active={isActive} />
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-4">
          {error && <InlineAlert tone="error">{error}</InlineAlert>}
          {notice && <InlineAlert tone="success">{notice}</InlineAlert>}

          <SectionPanel
            applicationId={applicationId}
            section={activeDefinition}
            status={statusByKey[activeDefinition.key] ?? "not_started"}
            sectionResponse={sectionResponse}
            readiness={readiness}
            documentRequests={documentRequests}
            consentState={consentState}
            formData={formData}
            setFormData={setFormData}
            saving={saving}
            submitting={submitting}
            onAcceptConsent={handleAcceptConsent}
            onSubmit={handleSubmit}
          />

          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Save keeps you on this section. Save and continue follows the backend next step.
            </div>
            <div className="flex flex-wrap gap-2">
              {previous && (
                <Link
                  to={previous.route}
                  params={{ applicationId }}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Back
                </Link>
              )}
              {activeSection !== "overview" && activeSection !== "review" && (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave("save")}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                    Save
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave("save_and_continue")}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    Save and continue
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </button>
                </>
              )}
              {activeSection === "overview" && next && (
                <Link
                  to={next.route}
                  params={{ applicationId }}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Continue application
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionPanel({
  applicationId,
  section,
  status,
  sectionResponse,
  readiness,
  documentRequests,
  consentState,
  formData,
  setFormData,
  saving,
  submitting,
  onAcceptConsent,
  onSubmit,
}: {
  applicationId: string;
  section: SectionDefinition;
  status: NormalizedStatus;
  sectionResponse: BorrowerApplicationSectionResponse | null;
  readiness: SubmissionReadinessResponse | null;
  documentRequests: BorrowerDocumentRequest[];
  consentState: Record<string, string>;
  formData: Record<string, string | boolean>;
  setFormData: (value: Record<string, string | boolean>) => void;
  saving: boolean;
  submitting: boolean;
  onAcceptConsent: (type: ConsentType, text: string) => Promise<void>;
  onSubmit: () => Promise<void>;
}) {
  const Icon = section.icon;
  const validation = sectionResponse?.validation;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Application section
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{section.label}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{section.description}</p>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      {validation && hasValidationMessages(validation) && (
        <div className="mt-5">
          <ValidationPanel validation={validation} />
        </div>
      )}

      {section.key === "overview" && <OverviewPanel applicationId={applicationId} />}
      {isEditableSection(section.key) && (
        <EditableSectionForm section={section} formData={formData} setFormData={setFormData} />
      )}
      {section.key === "documents" && <DocumentsPanel requests={documentRequests} />}
      {section.key === "consents" && (
        <ConsentsPanel
          consentState={consentState}
          saving={saving}
          onAcceptConsent={onAcceptConsent}
        />
      )}
      {section.key === "review" && (
        <ReviewPanel readiness={readiness} submitting={submitting} onSubmit={onSubmit} />
      )}
    </section>
  );
}

function EditableSectionForm({
  section,
  formData,
  setFormData,
}: {
  section: SectionDefinition;
  formData: Record<string, string | boolean>;
  setFormData: (value: Record<string, string | boolean>) => void;
}) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {(section.fields ?? []).map((field) => (
        <label key={field.name} className={field.type === "textarea" ? "md:col-span-2" : undefined}>
          <span className="text-sm font-medium text-foreground">{field.label}</span>
          {field.helper && (
            <span className="ml-1 text-xs text-muted-foreground">{field.helper}</span>
          )}
          {field.type === "checkbox" ? (
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3">
              <input
                type="checkbox"
                checked={Boolean(formData[field.name])}
                onChange={(event) =>
                  setFormData({ ...formData, [field.name]: event.currentTarget.checked })
                }
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-muted-foreground">Yes</span>
            </span>
          ) : field.type === "textarea" ? (
            <textarea
              value={String(formData[field.name] ?? "")}
              onChange={(event) =>
                setFormData({ ...formData, [field.name]: event.currentTarget.value })
              }
              rows={4}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : (
            <input
              type={field.type ?? "text"}
              value={String(formData[field.name] ?? "")}
              onChange={(event) =>
                setFormData({ ...formData, [field.name]: event.currentTarget.value })
              }
              className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          )}
        </label>
      ))}
    </div>
  );
}

function OverviewPanel({ applicationId }: { applicationId: string }) {
  return (
    <div className="mt-6 rounded-xl border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-foreground">Recommended path</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Continue through the application sections in order. Each save writes to the Laravel borrower
        application API, so refreshing this page restores your saved values.
      </p>
      <Link
        to="/portal/applications/$applicationId/personal-details"
        params={{ applicationId }}
        className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Start application
      </Link>
    </div>
  );
}

function DocumentsPanel({ requests }: { requests: BorrowerDocumentRequest[] }) {
  if (requests.length === 0) {
    return (
      <EmptyPanel
        title="No documents requested yet"
        body="Document upload wiring is ready to use dedicated document APIs when requests are assigned. Nothing is stored in section JSON."
      />
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {requests.map((request) => (
        <div
          key={request.public_reference ?? request.title ?? request.document_type ?? "document"}
          className="rounded-xl border border-border bg-background p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {safeText(request.title, "Requested document")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {safeText(
                  request.description,
                  "Upload details will appear when this request is active.",
                )}
              </p>
            </div>
            <StatusPill status={request.status ?? "not_started"} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConsentsPanel({
  consentState,
  saving,
  onAcceptConsent,
}: {
  consentState: Record<string, string>;
  saving: boolean;
  onAcceptConsent: (type: ConsentType, text: string) => Promise<void>;
}) {
  return (
    <div className="mt-6 space-y-3">
      {REQUIRED_CONSENTS.map((consent) => {
        const accepted = consentState[consent.type] === "accepted";
        return (
          <div key={consent.type} className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{consent.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{consent.text}</p>
              </div>
              {accepted ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-mint/40 bg-mint/15 px-3 py-1 text-xs font-semibold text-mint-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Accepted
                </span>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onAcceptConsent(consent.type, consent.text)}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  Accept
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewPanel({
  readiness,
  submitting,
  onSubmit,
}: {
  readiness: SubmissionReadinessResponse | null;
  submitting: boolean;
  onSubmit: () => Promise<void>;
}) {
  const blockers = readiness?.blockers ?? [];
  const ready = readiness?.ready === true;

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-border bg-background p-4">
        <h3 className="text-sm font-semibold text-foreground">Submission readiness</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {safeText(
            readiness?.message,
            "approvU checks required sections, documents, consents, and offer selection before submission.",
          )}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Completed sections" value={readiness?.progress?.completedSections ?? 0} />
          <Metric label="Total sections" value={readiness?.progress?.totalSections ?? 14} />
          <Metric label="Progress" value={`${readiness?.progress?.percent ?? 0}%`} />
        </div>
      </div>

      {blockers.length > 0 ? (
        <div className="rounded-xl border border-coral/30 bg-coral/10 p-4">
          <h3 className="text-sm font-semibold text-foreground">Items to resolve</h3>
          <ul className="mt-3 space-y-2">
            {blockers.map((blocker) => (
              <li key={blocker.key ?? blocker.label ?? blocker.message} className="text-sm">
                <span className="font-medium text-foreground">
                  {safeText(blocker.label, "Required item")}
                </span>
                <span className="block text-muted-foreground">
                  {safeText(blocker.message, "This item must be completed before submission.")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <InlineAlert tone="success">No readiness blockers returned by the backend.</InlineAlert>
      )}

      <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4">
        <h3 className="text-sm font-semibold text-foreground">Before submission</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          These are not approvals. Final terms depend on lender review, document verification, and
          underwriting.
        </p>
        <button
          type="button"
          disabled={!ready || submitting}
          onClick={() => void onSubmit()}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Submit application
        </button>
      </div>
    </div>
  );
}

function ValidationPanel({
  validation,
}: {
  validation: NonNullable<BorrowerApplicationSectionResponse["validation"]>;
}) {
  const missing = validation.missingRequiredFields ?? [];
  const warnings = validation.warnings ?? [];
  const blockers = validation.blockingIssues ?? [];

  return (
    <div className="rounded-xl border border-coral/30 bg-coral/10 p-4">
      <h3 className="text-sm font-semibold text-foreground">Section validation</h3>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {missing.map((field) => (
          <li key={`missing-${field}`}>Missing required field: {fieldLabel(field)}</li>
        ))}
        {warnings.map((warning) => (
          <li key={`warning-${warning}`}>{warning}</li>
        ))}
        {blockers.map((blocker) => (
          <li key={`blocker-${blocker}`}>{blocker}</li>
        ))}
      </ul>
    </div>
  );
}

function ProgressBar({ progress }: { progress?: ApplicationProgress | null }) {
  const percent = clampPercent(progress?.percent);
  return (
    <div className="mt-6">
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>Overall application progress</span>
        <span className="font-semibold text-foreground">
          {percent}% ({progress?.completedSections ?? 0}/{progress?.totalSections ?? 14})
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: unknown }) {
  const normalized = normalizeSectionStatus(status);
  const label =
    normalized === "completed"
      ? "Completed"
      : normalized === "needs_attention"
        ? "Needs attention"
        : normalized === "in_progress"
          ? "In progress"
          : "Not started";
  const className =
    normalized === "completed"
      ? "border-mint/40 bg-mint/15 text-mint-foreground"
      : normalized === "needs_attention"
        ? "border-coral/40 bg-coral/10 text-coral"
        : normalized === "in_progress"
          ? "border-secondary/40 bg-secondary/10 text-secondary"
          : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function StatusDot({ status, active }: { status: NormalizedStatus; active: boolean }) {
  const className =
    status === "completed"
      ? active
        ? "bg-primary-foreground"
        : "bg-mint"
      : status === "needs_attention"
        ? "bg-coral"
        : status === "in_progress"
          ? active
            ? "bg-primary-foreground"
            : "bg-secondary"
          : active
            ? "bg-primary-foreground/70"
            : "bg-muted-foreground/40";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

function InlineAlert({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  const className =
    tone === "error"
      ? "border-coral/30 bg-coral/10 text-coral"
      : "border-mint/30 bg-mint/10 text-foreground";
  return <div className={`rounded-xl border p-4 text-sm ${className}`}>{children}</div>;
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function buildStatusMap(
  workspace: BorrowerApplicationWorkspaceResponse | null,
): Record<WorkspaceSectionKey, NormalizedStatus> {
  const map = Object.fromEntries(
    APPLICATION_SECTIONS.map((section) => [section.key, "not_started"]),
  ) as Record<WorkspaceSectionKey, NormalizedStatus>;

  if (workspace?.application) map.overview = "in_progress";

  for (const section of workspace?.sections ?? []) {
    const key = sectionKeyFromApi(section);
    if (key) map[key] = normalizeSectionStatus(section.status);
  }

  return map;
}

function formDataFromSection(
  key: WorkspaceSectionKey,
  section?: ApplicationSection | null,
): Record<string, string | boolean> {
  const values = section?.effective_data ?? section?.data ?? section?.prefill_data ?? {};

  if (key === "borrowers") {
    const borrowers = Array.isArray(values.borrowers) ? values.borrowers : [];
    const primary =
      borrowers.find((borrower) => getRecordValue(borrower, "role") === "primary") ??
      borrowers[0] ??
      {};
    return {
      borrower_first_name: safeText(getRecordValue(primary, "first_name"), ""),
      borrower_last_name: safeText(getRecordValue(primary, "last_name"), ""),
      borrower_email: safeText(getRecordValue(primary, "email"), ""),
      co_borrower_name: safeText(
        borrowers
          .slice(1)
          .map((borrower) =>
            [getRecordValue(borrower, "first_name"), getRecordValue(borrower, "last_name")]
              .filter(Boolean)
              .join(" "),
          )
          .filter(Boolean)
          .join(", "),
        "",
      ),
    };
  }

  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [
      name,
      typeof value === "boolean"
        ? value
        : Array.isArray(value)
          ? value.join(", ")
          : safeText(value, ""),
    ]),
  );
}

function buildPayload(
  key: ApplicationSectionKey,
  formData: Record<string, string | boolean>,
): Record<string, unknown> {
  if (key === "borrowers") {
    const firstName = safeText(formData.borrower_first_name, "");
    const lastName = safeText(formData.borrower_last_name, "");
    const email = safeText(formData.borrower_email, "");
    return {
      borrowers: [
        {
          role: "primary",
          first_name: firstName,
          last_name: lastName,
          email,
          consent_status: "provided",
        },
      ].filter((borrower) => borrower.first_name || borrower.last_name || borrower.email),
      co_borrower_name: safeText(formData.co_borrower_name, ""),
    };
  }

  return Object.fromEntries(
    Object.entries(formData)
      .filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([name, value]) => {
        if (typeof value === "boolean") return [name, value];
        if (numericField(name)) return [name, Number(value)];
        if (name === "down_payment_sources") {
          return [
            name,
            String(value)
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          ];
        }
        return [name, value];
      }),
  );
}

function sectionDefinition(key: WorkspaceSectionKey): SectionDefinition {
  return APPLICATION_SECTIONS.find((section) => section.key === key) ?? APPLICATION_SECTIONS[0];
}

function sectionKeyFromApi(section: ApplicationSection): ApplicationSectionKey | null {
  const key = String(section.section_key ?? section.key ?? "");
  return ALL_SECTION_KEYS.includes(key as ApplicationSectionKey)
    ? (key as ApplicationSectionKey)
    : null;
}

function isEditableSection(key: WorkspaceSectionKey): key is ApplicationSectionKey {
  return (
    key !== "overview" &&
    key !== "documents" &&
    key !== "consents" &&
    key !== "review" &&
    ALL_SECTION_KEYS.includes(key as ApplicationSectionKey)
  );
}

function progressFromSummary(summary?: BorrowerApplicationWorkspaceResponse["sections_summary"]) {
  if (!summary?.total_sections) return { percent: 0, completedSections: 0, totalSections: 14 };
  return {
    percent: Math.round(((summary.completed_sections ?? 0) / summary.total_sections) * 100),
    completedSections: summary.completed_sections ?? 0,
    totalSections: summary.total_sections,
  };
}

function hasValidationMessages(
  validation: NonNullable<BorrowerApplicationSectionResponse["validation"]>,
) {
  return Boolean(
    validation.missingRequiredFields?.length ||
    validation.warnings?.length ||
    validation.blockingIssues?.length,
  );
}

function numericField(name: string): boolean {
  return /amount|income|balance|payment|value|price|percent|years|reserve|proceeds|funds/.test(
    name,
  );
}

function safeText(value: unknown, fallback: string): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function getRecordValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return (value as Record<string, unknown>)[key];
}

function fieldLabel(field: string): string {
  return field.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clampPercent(value: unknown): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

async function navigateToSection(
  applicationId: string,
  sectionKey: string,
  navigate: ReturnType<typeof useNavigate>,
) {
  const matched =
    APPLICATION_SECTIONS.find((section) => section.key === sectionKey) ??
    APPLICATION_SECTIONS.find((section) => section.key === "review")!;
  await navigate({ to: matched.route, params: { applicationId } });
}

function safeErrorMessage(failure: unknown, fallback: string): string {
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}
