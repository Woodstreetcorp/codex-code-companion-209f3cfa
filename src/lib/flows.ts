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
    }
  | {
      id: string;
      type: "mortgages";
      title: string;
      subtitle?: string;
      showIf?: (a: Record<string, unknown>) => boolean;
    };

// ---------- Shared option sets ----------

const propertyUse: Option[] = [
  {
    value: "primary",
    label: "Primary residence",
    hint: "You will live in the property as your main home.",
  },
  {
    value: "rental",
    label: "Rental / investment property",
    hint: "The property will mainly be rented to tenants.",
  },
  {
    value: "secondary",
    label: "Secondary or vacation home",
    hint: "You will use the property as a second home or vacation property.",
  },
];

const propertyTypes: Option[] = [
  { value: "detached", label: "Detached house", hint: "A standalone single-family home." },
  { value: "semi", label: "Semi-detached / townhouse", hint: "A home that shares one or more walls with neighbours." },
  { value: "condo", label: "Condo apartment", hint: "A unit inside a condo building or complex." },
  { value: "multi", label: "Multi-unit (2–4 units)", hint: "A property with multiple separate legal units." },
];

const unitCountOptions: Option[] = [
  { value: "1", label: "1 unit", hint: "A single-family home, condo, or single-unit dwelling." },
  { value: "2", label: "2 units", hint: "A duplex or property with two separate legal units." },
  { value: "3", label: "3 units", hint: "A triplex or property with three separate legal units." },
  { value: "4", label: "4 units", hint: "A fourplex or property with four separate legal units." },
  { value: "5+", label: "5 or more units", hint: "Larger multi-unit properties typically use commercial financing." },
];

const incomeOptions: Option[] = [
  {
    value: "employed",
    label: "Employed",
    hint: "You receive regular employment income from an employer.",
  },
  {
    value: "self",
    label: "Self-Employed",
    hint: "You earn income through a business, contract work, sole proprietorship, corporation, or professional practice.",
  },
  {
    value: "other",
    label: "Other income",
    hint: "This may include pension, rental income, support income, investment income, or other sources.",
  },
  {
    value: "combo",
    label: "Combination of income sources",
    hint: "You have more than one type of income.",
  },
];

const selfEmployedVerify: Option[] = [
  {
    value: "tax",
    label: "Standard Verification — Tax Documents",
    hint: "Your income can be supported with tax documents such as T1 Generals, NOAs, or business financials.",
  },
  {
    value: "bank",
    label: "Alternative Verification — Bank Statements",
    hint: "Your income may be supported using business or personal bank statements instead of traditional tax documents.",
  },
  {
    value: "unsure",
    label: "Not sure",
    hint: "That's okay. We can still continue and place your file into a review path.",
  },
];

const firstTimeBuyer: Option[] = [
  {
    value: "yes",
    label: "Yes, I am a first-time buyer",
    hint: "You have never owned a home, or you may meet the first-time buyer definition based on your ownership history.",
  },
  {
    value: "no",
    label: "No, I am not a first-time buyer",
    hint: "You currently own a home or have owned one recently.",
  },
  {
    value: "unsure",
    label: "I'm not sure",
    hint: "That's okay. We can still continue and review this later.",
  },
];

const firstTimeBuyerSubtitle =
  "You may be considered a first-time home buyer if you have never owned a home before, or if you have not owned and lived in a home as your principal residence within the last four years. Your final eligibility may depend on lender, insurer, and government program rules.";

const ownsResidence: Option[] = [
  {
    value: "own",
    label: "Yes, I own my residence",
    hint: "You are on title to the home where you currently live.",
  },
  {
    value: "rent",
    label: "No, I am renting",
    hint: "You rent the place where you currently live.",
  },
  {
    value: "other",
    label: "No, someone else owns it",
    hint: "A friend, family member, spouse, or another person owns the home where you live.",
  },
];

const offerStatus: Option[] = [
  { value: "yes", label: "Yes, I have an accepted offer", hint: "You have a signed Agreement of Purchase and Sale." },
  { value: "no", label: "No, not yet", hint: "You're still shopping or exploring options." },
];

const targetPriceRange: Option[] = [
  { value: "u400", label: "Under $400,000", hint: "Lower-range purchase budget." },
  { value: "400-600", label: "$400,000 – $600,000", hint: "Common entry-level range in many markets." },
  { value: "600-900", label: "$600,000 – $900,000", hint: "Mid-range purchase budget." },
  { value: "900-1.2", label: "$900,000 – $1.2M", hint: "Upper mid-range budget." },
  { value: "1.2+", label: "Above $1.2M", hint: "Higher-value property range." },
];

// Credit score is collected as a numeric input with educational ranges.
const creditQuestion: Question = {
  id: "credit",
  type: "number",
  title: "What is your approximate credit score?",
  subtitle:
    "This helps us understand which mortgage options may fit your situation. If you are not sure, enter your best estimate.",
  placeholder: "e.g. 679",
};

// Income block (used in all flows)
const incomeBlock: Question[] = [
  {
    id: "income",
    type: "choice",
    title: "How do you earn income?",
    subtitle: "This helps us understand which lender programs may fit your situation.",
    options: incomeOptions,
  },
  {
    id: "selfVerify",
    type: "choice",
    title: "How can your self-employed income be verified?",
    subtitle:
      "Different lenders review self-employed income in different ways. This helps us understand which lender path may fit.",
    options: selfEmployedVerify,
    showIf: (a) => a.income === "self" || a.income === "combo",
  },
];

const needsOwnsResidence = (a: Record<string, unknown>) =>
  a.use === "rental" || a.use === "secondary";

// ---------- PURCHASE ----------
export const purchaseFlow: Question[] = [
  {
    id: "use",
    type: "choice",
    title: "How will you use the property?",
    subtitle: "This helps us understand which lender programs may fit.",
    options: propertyUse,
  },
  {
    id: "firstTime",
    type: "choice",
    title: "Are you a first-time home buyer in Canada?",
    subtitle: firstTimeBuyerSubtitle,
    options: firstTimeBuyer,
    showIf: (a) => a.use === "primary",
  },
  {
    id: "offer",
    type: "choice",
    title: "Do you have an accepted offer?",
    subtitle: "This helps us understand your purchase timeline.",
    options: offerStatus,
  },
  {
    id: "address",
    type: "text",
    title: "Where is the property located?",
    subtitle: "Start typing and select your address. Ontario, Canada only for now.",
    placeholder: "Start typing your address…",
  },
  {
    id: "propertyType",
    type: "choice",
    title: "What type of property is it?",
    subtitle: "This may affect your available lender options.",
    options: propertyTypes,
  },
  {
    id: "units",
    type: "choice",
    title: "How many units does the property have?",
    subtitle: "Unit count affects which lender programs and down payment rules apply.",
    options: unitCountOptions,
  },
  {
    id: "price",
    type: "currency",
    title: "What is the purchase price?",
    subtitle: "If you don't have an exact number yet, enter your best estimate.",
    prefix: "$",
    placeholder: "650,000",
  },
  {
    id: "down",
    type: "currency",
    title: "How much is your down payment?",
    subtitle: "This helps us understand your loan-to-value position.",
    prefix: "$",
    placeholder: "65,000",
  },
  creditQuestion,
  ...incomeBlock,
  {
    id: "ownsResidence",
    type: "choice",
    title: "Do you own your primary residence?",
    subtitle: "This helps us understand your overall property ownership situation.",
    options: ownsResidence,
    showIf: needsOwnsResidence,
  },
];

// ---------- PRE-APPROVAL ----------
export const prePurchaseFlow: Question[] = [
  {
    id: "location",
    type: "text",
    title: "Where are you planning to buy?",
    subtitle: "City, neighbourhood, or province — anything you have in mind helps.",
    placeholder: "e.g. Toronto, ON",
  },
  {
    id: "priceRange",
    type: "choice",
    title: "What price range are you considering?",
    subtitle: "This helps us understand the size of mortgage you may need.",
    options: targetPriceRange,
  },
  {
    id: "savedDown",
    type: "currency",
    title: "How much have you saved for down payment?",
    subtitle: "This helps us see what's possible based on your savings.",
    prefix: "$",
    placeholder: "50,000",
  },
  {
    id: "use",
    type: "choice",
    title: "How will you use the property?",
    subtitle: "This helps us understand which lender programs may fit.",
    options: propertyUse,
  },
  {
    id: "propertyType",
    type: "choice",
    title: "What type of property are you considering?",
    subtitle: "This may affect your available lender options.",
    options: propertyTypes,
  },
  {
    id: "units",
    type: "choice",
    title: "How many units does the property have?",
    subtitle: "Unit count affects which lender programs and down payment rules apply.",
    options: unitCountOptions,
  },
  {
    id: "firstTime",
    type: "choice",
    title: "Are you a first-time home buyer in Canada?",
    subtitle: firstTimeBuyerSubtitle,
    options: firstTimeBuyer,
    showIf: (a) => a.use === "primary",
  },
  creditQuestion,
  ...incomeBlock,
  {
    id: "ownsResidence",
    type: "choice",
    title: "Do you own your primary residence?",
    subtitle: "This helps us understand your overall property ownership situation.",
    options: ownsResidence,
    showIf: needsOwnsResidence,
  },
];

// ---------- REFINANCE / RENEW / EQUITY ----------
const refinanceIntents: Option[] = [
  { value: "renew", label: "Renew my mortgage", hint: "Your current mortgage term is ending and you want to review your options." },
  { value: "switch", label: "Switch lenders", hint: "You may want to move your mortgage to a different lender." },
  { value: "lower-payment", label: "Lower my monthly payment", hint: "You want to explore ways to reduce your mortgage payment." },
  { value: "better-rate", label: "Get a better rate", hint: "You want to compare available rate options." },
  { value: "cash-out", label: "Access home equity / cash out", hint: "You want to borrow against your home equity." },
  { value: "consolidate", label: "Consolidate debt", hint: "You want to combine higher-interest debts into your mortgage." },
  { value: "heloc", label: "Add a HELOC", hint: "You want access to a revolving home equity line of credit." },
  { value: "unsure", label: "I'm not sure yet", hint: "That's okay. We can help identify possible paths." },
];

const numMortgagesOptions: Option[] = [
  { value: "0", label: "No mortgage / paid off", hint: "The property is mortgage-free." },
  { value: "1", label: "1 mortgage", hint: "There is one mortgage registered on the property." },
  { value: "2", label: "2 mortgages", hint: "There are two mortgages registered on the property." },
  { value: "3", label: "3 mortgages", hint: "There are three mortgages registered on the property." },
];

const cashOutPurposes: Option[] = [
  { value: "renovations", label: "Home renovations", hint: "Funds will be used to renovate or improve the property." },
  { value: "debt", label: "Pay off other debt", hint: "Funds will be used to pay down other debts." },
  { value: "investment", label: "Investment", hint: "Funds will be used for an investment opportunity." },
  { value: "education", label: "Education", hint: "Funds will be used for tuition or education costs." },
  { value: "other", label: "Other", hint: "Funds will be used for another purpose." },
];

const wantsCashOut = (a: Record<string, unknown>) => {
  const intent = a.intent as string[] | undefined;
  return Array.isArray(intent) && (intent.includes("cash-out") || intent.includes("consolidate") || intent.includes("heloc"));
};

// "Lower my monthly payment" alone is ambiguous — ask a follow-up that may
// route the file to REFINANCE_EQUITY_ACCESS.
const lowerPaymentFollowUp: Option[] = [
  {
    value: "review-only",
    label: "Only review my current mortgage terms",
    hint: "You want to review rate or term changes — no additional borrowing.",
  },
  {
    value: "borrow-more",
    label: "I want to borrow additional money",
    hint: "You'd like to access additional funds against your home.",
  },
  {
    value: "consolidate",
    label: "I want to consolidate debts",
    hint: "You'd like to roll other debts into your mortgage.",
  },
  {
    value: "unsure",
    label: "I'm not sure",
    hint: "We'll guide you through possible paths.",
  },
];

const onlyLowerPayment = (a: Record<string, unknown>) => {
  const intent = a.intent as string[] | undefined;
  if (!Array.isArray(intent)) return false;
  if (!intent.includes("lower-payment")) return false;
  // Only show follow-up if user did NOT also pick a hard equity-access trigger.
  return !intent.some((v) => v === "cash-out" || v === "consolidate" || v === "heloc");
};

const wantsAccessEquity: Option[] = [
  { value: "yes", label: "Yes, I'd like to access equity", hint: "You want to borrow additional funds against your home." },
  { value: "no", label: "No, not at this time", hint: "You're not looking to take out additional funds." },
];

export const refinanceFlow: Question[] = [
  {
    id: "intent",
    type: "multi",
    title: "What are you hoping to do with your mortgage?",
    subtitle: "Select all that apply — this helps us tailor your options.",
    options: refinanceIntents,
  },
  {
    id: "lowerPaymentIntent",
    type: "choice",
    title: "Are you hoping to borrow additional money or only review your current mortgage terms?",
    subtitle:
      "Lowering your monthly payment can be done in different ways. This helps us route you to the right path.",
    options: lowerPaymentFollowUp,
    showIf: onlyLowerPayment,
  },
  {
    id: "propertyType",
    type: "choice",
    title: "What type of property are you refinancing?",
    subtitle: "This may affect your available lender options.",
    options: propertyTypes,
  },
  {
    id: "address",
    type: "text",
    title: "Where is the property located?",
    subtitle: "Start typing and select your address. Ontario, Canada only for now.",
    placeholder: "Start typing your address…",
  },
  {
    id: "use",
    type: "choice",
    title: "How do you use the property?",
    subtitle: "This helps us understand which lender programs may fit.",
    options: propertyUse,
  },
  {
    id: "value",
    type: "currency",
    title: "What is your estimated property value?",
    subtitle: "An approximate value is fine.",
    prefix: "$",
    placeholder: "750,000",
  },
  {
    id: "numMortgages",
    type: "choice",
    title: "How many mortgages are currently registered on this property?",
    subtitle:
      "Some homeowners have more than one mortgage registered on the same property. This helps us understand your current equity position.",
    options: numMortgagesOptions,
  },
  {
    id: "mortgages",
    type: "mortgages",
    title: "Tell us about your existing mortgages",
    subtitle:
      "Enter approximate details for each mortgage. If you are not sure of the exact amount, enter your best estimate.",
    showIf: (a) => {
      const n = Number(a.numMortgages);
      return n >= 1 && n <= 3;
    },
  },
  {
    id: "wantsEquity",
    type: "choice",
    title: "Do you want to access equity or cash out?",
    subtitle: "This helps us understand whether you need additional funds.",
    options: wantsAccessEquity,
  },
  {
    id: "cashAmount",
    type: "currency",
    title: "How much cash out do you need?",
    subtitle: "An approximate amount is fine.",
    prefix: "$",
    placeholder: "50,000",
    showIf: (a) => a.wantsEquity === "yes" || wantsCashOut(a),
  },
  {
    id: "cashPurpose",
    type: "choice",
    title: "What will the funds be used for?",
    subtitle: "This helps us understand the purpose of the additional funds.",
    options: cashOutPurposes,
    showIf: (a) => a.wantsEquity === "yes" || wantsCashOut(a),
  },
  creditQuestion,
  ...incomeBlock,
  {
    id: "ownsResidence",
    type: "choice",
    title: "Do you own your primary residence?",
    subtitle: "This helps us understand your overall property ownership situation.",
    options: ownsResidence,
    showIf: needsOwnsResidence,
  },
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
    resultTitle: "Your Mortgage Snapshot",
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
    resultTitle: "Your Refinance Snapshot",
  },
};

export type MortgageEntry = {
  position: number;
  lender: string;
  balance: string;
  payment?: string;
  maturity?: string;
  rate?: string;
};
