import {
  Award,
  Calculator,
  Clock,
  FileText,
  Home,
  Inbox,
  RefreshCw,
  Settings,
  Wallet,
  ArrowRight,
  Bell,
  CreditCard,
  Eye,
  KeyRound,
  User,
} from "lucide-react";

// ─── Business rules ──────────────────────────────────────────────────────
export const MAX_ACTIVE_APPLICATIONS = 4;
export const ACTIVE_EXPIRY_DAYS = 14;
export const EXPIRED_VISIBILITY_DAYS = 90;

// ─── Types ───────────────────────────────────────────────────────────────
export type AppStatus =
  | "Snapshot Complete"
  | "Application Started"
  | "In Progress"
  | "Waiting for Borrower"
  | "Ready to Submit"
  | "Expiring Soon";

export type SubmittedStage =
  | "Submitted"
  | "Under Review"
  | "Submitted to Lender"
  | "Lender Decision Pending"
  | "Approved"
  | "Conditions in Progress"
  | "Ready for Closing";

export type ActiveApp = {
  id: string;
  type: "Purchase" | "Refinance" | "Pre-Purchase";
  property: string;
  status: AppStatus;
  completion: number;
  daysToExpiry: number;
  nextStep: string;
  lastUpdated: string;
};

export type SubmittedApp = {
  id: string;
  type: "Purchase" | "Refinance";
  property: string;
  stage: SubmittedStage;
  progress: number;
  broker: string;
  conditionsOutstanding: number;
  documentsPending: number;
  nextStep: string;
  lastUpdate: string;
};

export type ExpiredApp = {
  id: string;
  type: string;
  property: string;
  expiredOn: string;
  reactivateUntil: string;
  daysLeftToReactivate: number;
  completion: number;
};

export type CompletedApp = {
  id: string;
  property: string;
  lender: string;
  fundedDate: string;
  amount: string;
  term: string;
  rateType: string;
  maturityDate: string;
  bundleStatus: "Active" | "Pending";
};

// ─── Mock data ───────────────────────────────────────────────────────────
export const ACTIVE: ActiveApp[] = [
  {
    id: "APP-2041",
    type: "Purchase",
    property: "123 Maple Ave, Toronto, ON",
    status: "In Progress",
    completion: 60,
    daysToExpiry: 8,
    nextStep: "Upload last 2 pay stubs",
    lastUpdated: "2 hours ago",
  },
  {
    id: "APP-2009",
    type: "Refinance",
    property: "44 Beachview Rd, Hamilton, ON",
    status: "Snapshot Complete",
    completion: 25,
    daysToExpiry: 12,
    nextStep: "Select a mortgage offer",
    lastUpdated: "Yesterday",
  },
];

export const SUBMITTED: SubmittedApp[] = [
  {
    id: "APP-2033",
    type: "Purchase",
    property: "118 King St W, Toronto, ON",
    stage: "Submitted to Lender",
    progress: 70,
    broker: "Jordan Lee",
    conditionsOutstanding: 3,
    documentsPending: 2,
    nextStep: "Wait for lender decision",
    lastUpdate: "3 days ago",
  },
];

export const EXPIRED: ExpiredApp[] = [
  {
    id: "APP-1988",
    type: "Refinance",
    property: "91 Queen St, London, ON",
    expiredOn: "2026-05-01",
    reactivateUntil: "2026-07-30",
    daysLeftToReactivate: 79,
    completion: 40,
  },
];

export const COMPLETED: CompletedApp[] = [
  {
    id: "APP-1801",
    property: "78 River Rd, Ottawa, ON",
    lender: "Major Bank",
    fundedDate: "2026-04-29",
    amount: "$510,000",
    term: "5 years",
    rateType: "Fixed 4.59%",
    maturityDate: "2031-04-29",
    bundleStatus: "Active",
  },
];

export const DOCUMENTS = [
  { name: "Government ID", app: "APP-2041", status: "Received", due: "—" },
  { name: "Last 2 pay stubs", app: "APP-2041", status: "Requested", due: "May 18" },
  { name: "Most recent NOA", app: "APP-2041", status: "Requested", due: "May 18" },
  { name: "Mortgage statement", app: "APP-2009", status: "Received", due: "—" },
  { name: "Property tax bill", app: "APP-2009", status: "Under Review", due: "—" },
];

export const CONDITIONS = [
  { name: "Confirm employment letter", app: "APP-2033", status: "Outstanding", due: "May 20" },
  { name: "Provide void cheque", app: "APP-2033", status: "Outstanding", due: "May 20" },
  { name: "Property appraisal", app: "APP-2033", status: "Under Review", due: "—" },
];

export const SNAPSHOTS = [
  { id: "SNAP-302", date: "May 8, 2026", type: "Purchase", loan: "$480,000", path: "Major Bank Path", offers: 3, status: "Offer Selected" },
  { id: "SNAP-298", date: "Apr 24, 2026", type: "Refinance", loan: "$320,000", path: "Monoline Lender Path", offers: 3, status: "Snapshot Complete" },
];

// ─── Counts helper ───────────────────────────────────────────────────────
export function getCounts() {
  return {
    active: ACTIVE.length,
    submitted: SUBMITTED.length,
    expired: EXPIRED.length,
    completed: COMPLETED.length,
    docsPending: DOCUMENTS.filter((d) => d.status === "Requested").length,
    docsTotal: DOCUMENTS.length,
    conditions: CONDITIONS.filter((c) => c.status === "Outstanding").length,
    offers: SNAPSHOTS.reduce((s, x) => s + x.offers, 0),
    walletAvailable: COMPLETED.length > 0 ? 4 : 0,
  };
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────
export type PortalRoutePath =
  | "/portal"
  | "/portal/applications"
  | "/portal/documents"
  | "/portal/offers"
  | "/portal/wallet"
  | "/portal/tools"
  | "/portal/settings";

export const PORTAL_NAV: {
  to: PortalRoutePath;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}[] = [
  { to: "/portal", label: "Overview", icon: Home, exact: true },
  { to: "/portal/applications", label: "Applications", icon: Inbox },
  { to: "/portal/documents", label: "Documents", icon: FileText },
  { to: "/portal/offers", label: "Mortgage Offers", icon: Award },
  { to: "/portal/wallet", label: "Home Life Wallet", icon: Wallet },
  { to: "/portal/tools", label: "Mortgage Tools", icon: Calculator },
  { to: "/portal/settings", label: "Settings", icon: Settings },
];

// ─── Calculators metadata ────────────────────────────────────────────────
export type ToolKey =
  | "payment"
  | "affordability"
  | "refinance"
  | "renewal"
  | "equity"
  | "closing";

export const TOOLS: {
  key: ToolKey;
  name: string;
  icon: typeof Home;
  blurb: string;
}[] = [
  { key: "payment", name: "Mortgage Payment", icon: Calculator, blurb: "Estimate monthly payment for any rate, term, and amortization." },
  { key: "affordability", name: "Affordability", icon: Home, blurb: "See the maximum home price you can afford." },
  { key: "refinance", name: "Refinance Savings", icon: RefreshCw, blurb: "Compare your current mortgage to a refinance scenario." },
  { key: "renewal", name: "Renewal Planner", icon: Clock, blurb: "Plan your renewal payment at a new rate." },
  { key: "equity", name: "Home Equity", icon: Wallet, blurb: "Estimate how much equity you can access today." },
  { key: "closing", name: "Closing Costs", icon: FileText, blurb: "Estimate land transfer tax, legal, and closing fees." },
];

// ─── Settings sub-nav ────────────────────────────────────────────────────
export type SettingsRoutePath =
  | "/portal/settings/profile"
  | "/portal/settings/security"
  | "/portal/settings/notifications"
  | "/portal/settings/privacy"
  | "/portal/settings/payment-methods"
  | "/portal/settings/preferences";

export const SETTINGS_NAV: {
  to: SettingsRoutePath;
  label: string;
  icon: typeof Home;
}[] = [
  { to: "/portal/settings/profile", label: "Profile", icon: User },
  { to: "/portal/settings/security", label: "Security", icon: KeyRound },
  { to: "/portal/settings/notifications", label: "Notifications", icon: Bell },
  { to: "/portal/settings/privacy", label: "Privacy", icon: Eye },
  { to: "/portal/settings/payment-methods", label: "Payment Methods", icon: CreditCard },
  { to: "/portal/settings/preferences", label: "Preferences", icon: Settings },
];

// silence unused import warnings (icons re-exported via objects)
void ArrowRight;