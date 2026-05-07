export type Option = { value: string; label: string; hint?: string };

export type Question =
  | {
      id: string;
      type: "choice";
      title: string;
      subtitle?: string;
      options: Option[];
      showIf?: (a: Record<string, string>) => boolean;
    }
  | {
      id: string;
      type: "text" | "currency" | "number";
      title: string;
      subtitle?: string;
      placeholder?: string;
      prefix?: string;
      suffix?: string;
      showIf?: (a: Record<string, string>) => boolean;
    };

const provinces: Option[] = [
  "Ontario",
  "British Columbia",
  "Alberta",
  "Quebec",
  "Manitoba",
  "Saskatchewan",
  "Nova Scotia",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Prince Edward Island",
  "Yukon",
  "Northwest Territories",
  "Nunavut",
].map((p) => ({ value: p, label: p }));

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

const incomeBlock = (): Question[] => [
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

export const purchaseFlow: Question[] = [
  {
    id: "use",
    type: "choice",
    title: "How will you use the property?",
    options: propertyUse,
  },
  {
    id: "firstTime",
    type: "choice",
    title: "Are you a first-time home buyer in Canada?",
    options: yesNo,
  },
  {
    id: "offer",
    type: "choice",
    title: "Do you have an accepted offer?",
    options: [
      { value: "yes", label: "Yes, offer accepted" },
      { value: "soon", label: "Actively shopping" },
      { value: "no", label: "Just exploring" },
    ],
  },
  {
    id: "province",
    type: "choice",
    title: "Where is the property located?",
    subtitle: "Select the province.",
    options: provinces,
  },
  {
    id: "propertyType",
    type: "choice",
    title: "What type of property is it?",
    options: propertyTypes,
  },
  {
    id: "price",
    type: "currency",
    title: "What is the purchase price?",
    placeholder: "650,000",
    prefix: "$",
  },
  {
    id: "down",
    type: "currency",
    title: "How much is your down payment?",
    placeholder: "65,000",
    prefix: "$",
  },
  {
    id: "credit",
    type: "choice",
    title: "What is your approximate credit score?",
    options: credit,
  },
  ...incomeBlock(),
  {
    id: "otherProps",
    type: "choice",
    title: "Do you currently own any other properties?",
    options: yesNo,
  },
];

export const prePurchaseFlow: Question[] = [
  {
    id: "province",
    type: "choice",
    title: "Where are you planning to buy?",
    options: provinces,
  },
  {
    id: "priceRange",
    type: "choice",
    title: "What price range are you considering?",
    options: [
      { value: "u400", label: "Under $400,000" },
      { value: "400-600", label: "$400,000 – $600,000" },
      { value: "600-900", label: "$600,000 – $900,000" },
      { value: "900-1.2", label: "$900,000 – $1.2M" },
      { value: "1.2+", label: "Above $1.2M" },
    ],
  },
  {
    id: "savings",
    type: "currency",
    title: "How much have you saved for down payment?",
    prefix: "$",
    placeholder: "50,000",
  },
  {
    id: "use",
    type: "choice",
    title: "How will you use the property?",
    options: propertyUse,
  },
  {
    id: "propertyType",
    type: "choice",
    title: "What type of property are you considering?",
    options: propertyTypes,
  },
  {
    id: "credit",
    type: "choice",
    title: "What is your approximate credit score?",
    options: credit,
  },
  ...incomeBlock(),
  {
    id: "otherProps",
    type: "choice",
    title: "Do you currently own any other properties?",
    options: yesNo,
  },
];

export const refinanceFlow: Question[] = [
  {
    id: "propertyType",
    type: "choice",
    title: "What type of property are you refinancing?",
    options: propertyTypes,
  },
  {
    id: "province",
    type: "choice",
    title: "Where is the property located?",
    options: provinces,
  },
  {
    id: "use",
    type: "choice",
    title: "How do you use the property?",
    options: propertyUse,
  },
  {
    id: "value",
    type: "currency",
    title: "What is your estimated property value?",
    prefix: "$",
    placeholder: "750,000",
  },
  {
    id: "balance",
    type: "currency",
    title: "What is your current mortgage balance?",
    prefix: "$",
    placeholder: "420,000",
  },
  {
    id: "cashOut",
    type: "choice",
    title: "Do you want to access equity or cash out?",
    options: yesNo,
  },
  {
    id: "cashAmount",
    type: "currency",
    title: "How much cash out do you need?",
    prefix: "$",
    placeholder: "50,000",
    showIf: (a) => a.cashOut === "yes",
  },
  {
    id: "credit",
    type: "choice",
    title: "What is your approximate credit score?",
    options: credit,
  },
  ...incomeBlock(),
];

export type FlowKey = "purchase" | "pre" | "refinance";

export const flows: Record<FlowKey, { title: string; subtitle: string; questions: Question[]; resultTitle: string }> = {
  purchase: {
    title: "Purchase Mortgage Snapshot",
    subtitle: "A quick look at possible options for your home purchase.",
    questions: purchaseFlow,
    resultTitle: "Your Mortgage Snapshot",
  },
  pre: {
    title: "Mortgage Readiness Check",
    subtitle: "See where you stand before you start shopping.",
    questions: prePurchaseFlow,
    resultTitle: "Your Mortgage Readiness Snapshot",
  },
  refinance: {
    title: "Refinance Snapshot",
    subtitle: "Explore possible refinance options for your property.",
    questions: refinanceFlow,
    resultTitle: "Your Refinance Snapshot",
  },
};