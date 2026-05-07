export type Option = { value: string; label: string; hint?: string };

export type Question =
  | {
      id: string;
      type: "choice";
      title: string;
      subtitle?: string;
      options: Option[];
      showIf?: (a: Record<string, unknown>) => boolean;
    }
  | {
      id: string;
      type: "multi";
      title: string;
      subtitle?: string;
      options: Option[];
      showIf?: (a: Record<string, unknown>) => boolean;
    }
  | {
      id: string;
      type: "text" | "currency" | "number";
      title: string;
      subtitle?: string;
      placeholder?: string;
      prefix?: string;
      suffix?: string;
      showIf?: (a: Record<string, unknown>) => boolean;
    };

const propertyUse: Option[] = [
  { value: "primary", label: "Primary residence", hint: "I will live here" },
  { value: "secondary", label: "Second home", hint: "Vacation or family use" },
  { value: "rental", label: "Rental / investment", hint: "Tenants will occupy" },
];

const propertyTypes: Option[] = [
  { value: "detached", label: "Detached house" },
  { value: "semi", label: "Semi-detached / townhouse" },
  { value: "condo", label: "Condo apartment" },
  { value: "multi", label: "Multi-unit (2–4 units)" },
];

const credit: Option[] = [
  { value: "excellent", label: "Excellent (740+)" },
  { value: "good", label: "Good (680–739)" },
  { value: "fair", label: "Fair (620–679)" },
  { value: "below", label: "Below 620" },
  { value: "unsure", label: "I'm not sure" },
];

const income: Option[] = [
  { value: "employed", label: "Employed", hint: "Salary or hourly wages" },
  { value: "self", label: "Self-employed", hint: "Business owner or contractor" },
  { value: "other", label: "Other income", hint: "Pension, investments, etc." },
];

const selfEmployedVerify: Option[] = [
  { value: "tax", label: "Tax documents", hint: "T1 Generals or Notice of Assessment" },
  { value: "bank", label: "Bank statements", hint: "Recent business deposits" },
];

const yesNo: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const timeframe: Option[] = [
  { value: "0-3", label: "Within 3 months" },
  { value: "3-6", label: "3–6 months" },
  { value: "6-12", label: "6–12 months" },
  { value: "12+", label: "More than a year" },
];

const targetPriceRange: Option[] = [
  { value: "u400", label: "Under $400,000" },
  { value: "400-600", label: "$400,000 – $600,000" },
  { value: "600-900", label: "$600,000 – $900,000" },
  { value: "900-1.2", label: "$900,000 – $1.2M" },
  { value: "1.2+", label: "Above $1.2M" },
];

const locationOptions: Option[] = [
  { value: "downtown", label: "Downtown / urban core" },
  { value: "suburb", label: "Suburban" },
  { value: "rural", label: "Rural" },
  { value: "near-transit", label: "Near transit" },
  { value: "near-schools", label: "Near schools" },
  { value: "waterfront", label: "Waterfront" },
];

const offerStatus: Option[] = [
  { value: "accepted", label: "I have an accepted offer" },
  { value: "shopping", label: "Actively shopping" },
  { value: "exploring", label: "Just exploring" },
];

const incomeBlock: Question[] = [
  {
    id: "income",
    type: "choice",
    title: "How do you earn income?",
    subtitle: "This helps us understand which lender programs may fit.",
    options: income,
  },
  {
    id: "selfVerify",
    type: "choice",
    title: "How can your self-employed income be verified?",
    subtitle: "Lenders typically need one of these.",
    options: selfEmployedVerify,
    showIf: (a) => a.income === "self",
  },
];

// ---------- PURCHASE ----------
export const purchaseFlow: Question[] = [
  {
    id: "annualIncome",
    type: "currency",
    title: "What is your annual household income?",
    subtitle: "Before taxes, from all borrowers on the application.",
    prefix: "$",
    placeholder: "120,000",
  },
  {
    id: "monthlyDebt",
    type: "currency",
    title: "What are your total monthly debt payments?",
    subtitle: "Car loans, credit cards, lines of credit, student loans, etc.",
    prefix: "$",
    placeholder: "750",
  },
  {
    id: "credit",
    type: "choice",
    title: "What is your approximate credit score?",
    options: credit,
  },
  {
    id: "address",
    type: "text",
    title: "What is the property address?",
    subtitle: "Street, city, and province — we'll keep this private.",
    placeholder: "123 Main St, Toronto, ON",
  },
  {
    id: "propertyType",
    type: "choice",
    title: "What type of property is it?",
    options: propertyTypes,
  },
  {
    id: "firstTime",
    type: "choice",
    title: "Are you a first-time home buyer in Canada?",
    options: yesNo,
  },
  {
    id: "primary",
    type: "choice",
    title: "Will this be your primary residence?",
    options: yesNo,
  },
  {
    id: "offer",
    type: "choice",
    title: "What is your offer status?",
    options: offerStatus,
  },
  {
    id: "price",
    type: "currency",
    title: "What is the purchase price?",
    prefix: "$",
    placeholder: "650,000",
  },
  {
    id: "down",
    type: "currency",
    title: "How much is your down payment?",
    subtitle: "We'll show your loan-to-value in the snapshot.",
    prefix: "$",
    placeholder: "65,000",
  },
];

// ---------- PRE-APPROVAL ----------
export const prePurchaseFlow: Question[] = [
  {
    id: "annualIncome",
    type: "currency",
    title: "What is your annual household income?",
    prefix: "$",
    placeholder: "120,000",
  },
  {
    id: "monthlyDebt",
    type: "currency",
    title: "What are your total monthly debt payments?",
    prefix: "$",
    placeholder: "750",
  },
  {
    id: "priceRange",
    type: "choice",
    title: "What target price range are you considering?",
    options: targetPriceRange,
  },
  {
    id: "use",
    type: "choice",
    title: "How will you use the property?",
    options: propertyUse,
  },
  {
    id: "location",
    type: "multi",
    title: "Where are you looking?",
    subtitle: "Select all that apply.",
    options: locationOptions,
  },
  {
    id: "timeframe",
    type: "choice",
    title: "When do you hope to buy?",
    options: timeframe,
  },
  {
    id: "firstTime",
    type: "choice",
    title: "Are you a first-time home buyer in Canada?",
    options: yesNo,
    showIf: (a) => a.use === "primary",
  },
  {
    id: "primary",
    type: "choice",
    title: "Will this be your primary residence?",
    options: yesNo,
  },
  {
    id: "credit",
    type: "choice",
    title: "What is your approximate credit score?",
    options: credit,
  },
  ...incomeBlock,
];

// ---------- REFINANCE / RENEW / EQUITY ----------
const refinanceIntents: Option[] = [
  { value: "renew", label: "Renew my mortgage" },
  { value: "switch", label: "Switch lenders" },
  { value: "lower-payment", label: "Lower my monthly payment" },
  { value: "better-rate", label: "Get a better rate" },
  { value: "cash-out", label: "Access home equity / cash out" },
  { value: "consolidate", label: "Consolidate debt" },
  { value: "heloc", label: "Add a HELOC" },
  { value: "unsure", label: "I'm not sure yet" },
];

const cashOutPurposes: Option[] = [
  { value: "renovations", label: "Home renovations" },
  { value: "debt", label: "Pay off other debt" },
  { value: "investment", label: "Investment" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const wantsCashOut = (a: Record<string, unknown>) => {
  const intent = a.intent as string[] | undefined;
  return Array.isArray(intent) && (intent.includes("cash-out") || intent.includes("consolidate") || intent.includes("heloc"));
};

const wantsRenew = (a: Record<string, unknown>) => {
  const intent = a.intent as string[] | undefined;
  return Array.isArray(intent) && intent.includes("renew");
};

export const refinanceFlow: Question[] = [
  {
    id: "intent",
    type: "multi",
    title: "What are you hoping to do with your mortgage?",
    subtitle: "Select all that apply — we'll tailor the rest.",
    options: refinanceIntents,
  },
  {
    id: "renewalDate",
    type: "text",
    title: "When does your current mortgage come up for renewal?",
    subtitle: "An approximate month and year is fine.",
    placeholder: "e.g. June 2026",
    showIf: wantsRenew,
  },
  {
    id: "balance",
    type: "currency",
    title: "What is your current mortgage balance?",
    prefix: "$",
    placeholder: "420,000",
  },
  {
    id: "value",
    type: "currency",
    title: "What is your estimated home value?",
    prefix: "$",
    placeholder: "750,000",
  },
  {
    id: "cashAmount",
    type: "currency",
    title: "How much equity would you like to access?",
    prefix: "$",
    placeholder: "50,000",
    showIf: wantsCashOut,
  },
  {
    id: "cashPurpose",
    type: "choice",
    title: "What will the funds be used for?",
    options: cashOutPurposes,
    showIf: wantsCashOut,
  },
  {
    id: "use",
    type: "choice",
    title: "How do you use the property?",
    options: propertyUse,
  },
  {
    id: "propertyType",
    type: "choice",
    title: "What type of property is it?",
    options: propertyTypes,
  },
  {
    id: "primary",
    type: "choice",
    title: "Is this your primary residence?",
    options: yesNo,
  },
  {
    id: "credit",
    type: "choice",
    title: "What is your approximate credit score?",
    options: credit,
  },
  ...incomeBlock,
];

export type FlowKey = "purchase" | "pre" | "refinance";

export const flows: Record<
  FlowKey,
  { title: string; subtitle: string; questions: Question[]; resultTitle: string }
> = {
  purchase: {
    title: "Purchase Mortgage Snapshot",
    subtitle: "A quick look at possible options for your home purchase.",
    questions: purchaseFlow,
    resultTitle: "Your Purchase Snapshot",
  },
  pre: {
    title: "Mortgage Readiness Check",
    subtitle: "See where you stand before you start shopping.",
    questions: prePurchaseFlow,
    resultTitle: "Your Mortgage Readiness Snapshot",
  },
  refinance: {
    title: "Renew, Refinance, or Access Equity",
    subtitle: "Explore possible options for renewing, refinancing, or unlocking equity.",
    questions: refinanceFlow,
    resultTitle: "Your Mortgage Snapshot",
  },
};
