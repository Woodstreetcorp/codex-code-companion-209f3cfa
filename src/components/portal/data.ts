import {
  Calculator,
  CalendarDays,
  Clock,
  FileText,
  HelpCircle,
  Home,
  Inbox,
  MessageSquare,
  RefreshCw,
  Settings,
  Wallet,
  ArrowRight,
  Bell,
  CreditCard,
  Eye,
  KeyRound,
  User,
  ScrollText,
  ShieldCheck,
  House,
  Megaphone,
  Plug,
  HeartPulse,
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

// ─── Document Vault (account-wide) ──────────────────────────────────────
export type VaultCategory =
  | "Identity"
  | "Income"
  | "Property"
  | "Banking"
  | "Consent"
  | "Approval"
  | "Commitment"
  | "Closing"
  | "Other";

export type VaultStatus =
  | "Verified"
  | "Under Review"
  | "Received"
  | "Expired"
  | "Archived"
  | "Generated";

export type VaultTab =
  | "all"
  | "application"
  | "reusable"
  | "signed"
  | "approval"
  | "archived";

export type VaultDoc = {
  id: string;
  name: string;
  category: VaultCategory;
  app: string | null;
  appStatus: string | null;
  uploaded: string;
  status: VaultStatus;
  sharedWithLender: boolean;
  reusable: boolean;
  signed: boolean;
  approval: boolean;
  archived: boolean;
};

export const VAULT_DOCUMENTS: VaultDoc[] = [
  {
    id: "DOC-5012",
    name: "Government ID — Driver's Licence",
    category: "Identity",
    app: "APP-2041",
    appStatus: "In Progress",
    uploaded: "May 6, 2026",
    status: "Verified",
    sharedWithLender: true,
    reusable: true,
    signed: false,
    approval: false,
    archived: false,
  },
  {
    id: "DOC-5013",
    name: "Pay stubs — April 2026",
    category: "Income",
    app: "APP-2041",
    appStatus: "In Progress",
    uploaded: "May 6, 2026",
    status: "Under Review",
    sharedWithLender: true,
    reusable: true,
    signed: false,
    approval: false,
    archived: false,
  },
  {
    id: "DOC-5014",
    name: "Notice of Assessment 2024",
    category: "Income",
    app: null,
    appStatus: null,
    uploaded: "Mar 12, 2026",
    status: "Verified",
    sharedWithLender: false,
    reusable: true,
    signed: false,
    approval: false,
    archived: false,
  },
  {
    id: "DOC-5015",
    name: "Credit Bureau Consent",
    category: "Consent",
    app: "APP-2041",
    appStatus: "In Progress",
    uploaded: "May 4, 2026",
    status: "Verified",
    sharedWithLender: true,
    reusable: false,
    signed: true,
    approval: false,
    archived: false,
  },
  {
    id: "DOC-5016",
    name: "Privacy & Disclosure Consent",
    category: "Consent",
    app: "APP-2041",
    appStatus: "In Progress",
    uploaded: "May 4, 2026",
    status: "Verified",
    sharedWithLender: true,
    reusable: false,
    signed: true,
    approval: false,
    archived: false,
  },
  {
    id: "DOC-5017",
    name: "Mortgage Commitment Letter",
    category: "Commitment",
    app: "APP-1801",
    appStatus: "Funded",
    uploaded: "Apr 22, 2026",
    status: "Generated",
    sharedWithLender: true,
    reusable: false,
    signed: true,
    approval: true,
    archived: false,
  },
  {
    id: "DOC-5018",
    name: "Property Appraisal Report",
    category: "Property",
    app: "APP-1801",
    appStatus: "Funded",
    uploaded: "Apr 18, 2026",
    status: "Verified",
    sharedWithLender: true,
    reusable: false,
    signed: false,
    approval: true,
    archived: false,
  },
  {
    id: "DOC-5019",
    name: "Closing Disclosure Statement",
    category: "Closing",
    app: "APP-1801",
    appStatus: "Funded",
    uploaded: "Apr 29, 2026",
    status: "Generated",
    sharedWithLender: true,
    reusable: false,
    signed: true,
    approval: true,
    archived: false,
  },
  {
    id: "DOC-5020",
    name: "Void Cheque — TD Chequing",
    category: "Banking",
    app: null,
    appStatus: null,
    uploaded: "Feb 9, 2026",
    status: "Verified",
    sharedWithLender: false,
    reusable: true,
    signed: false,
    approval: false,
    archived: false,
  },
  {
    id: "DOC-5021",
    name: "Pre-Approval Certificate (2025)",
    category: "Approval",
    app: "APP-1702",
    appStatus: "Expired",
    uploaded: "Nov 2, 2025",
    status: "Archived",
    sharedWithLender: false,
    reusable: false,
    signed: false,
    approval: true,
    archived: true,
  },
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
  | "/portal/messages"
  | "/portal/notifications"
  | "/portal/appointments"
  | "/portal/help"
  | "/portal/home"
  | "/portal/wallet"
  | "/portal/tools"
  | "/portal/disclosures"
  | "/portal/settings";

export const PORTAL_NAV: {
  to: PortalRoutePath;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}[] = [
  { to: "/portal", label: "Overview", icon: Home, exact: true },
  { to: "/portal/applications", label: "Applications", icon: Inbox },
  { to: "/portal/documents", label: "Document Vault", icon: FileText },
  { to: "/portal/messages", label: "Messages", icon: MessageSquare },
  { to: "/portal/notifications", label: "Notifications", icon: Bell },
  { to: "/portal/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/portal/help", label: "Help Center", icon: HelpCircle },
  { to: "/portal/home", label: "Homeowner Hub", icon: House },
  { to: "/portal/wallet", label: "Home Life Wallet", icon: Wallet },
  { to: "/portal/tools", label: "Mortgage Tools", icon: Calculator },
  { to: "/portal/disclosures", label: "Disclosures", icon: ScrollText },
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
  | "/portal/settings/security/activity"
  | "/portal/settings/consents"
  | "/portal/settings/communications"
  | "/portal/settings/notifications"
  | "/portal/settings/privacy"
  | "/portal/settings/connections"
  | "/portal/settings/emergency"
  | "/portal/settings/payment-methods"
  | "/portal/settings/preferences";

export const SETTINGS_NAV: {
  to: SettingsRoutePath;
  label: string;
  icon: typeof Home;
}[] = [
  { to: "/portal/settings/profile", label: "Profile", icon: User },
  { to: "/portal/settings/security", label: "Security", icon: KeyRound },
  { to: "/portal/settings/security/activity", label: "Access Log", icon: ShieldCheck },
  { to: "/portal/settings/consents", label: "Consents", icon: ScrollText },
  { to: "/portal/settings/communications", label: "Communications", icon: Megaphone },
  { to: "/portal/settings/notifications", label: "Notifications", icon: Bell },
  { to: "/portal/settings/privacy", label: "Privacy", icon: Eye },
  { to: "/portal/settings/connections", label: "Connected Accounts", icon: Plug },
  { to: "/portal/settings/emergency", label: "Emergency & Beneficiary", icon: HeartPulse },
  { to: "/portal/settings/payment-methods", label: "Payment Methods", icon: CreditCard },
  { to: "/portal/settings/preferences", label: "Preferences", icon: Settings },
];

// silence unused import warnings (icons re-exported via objects)
void ArrowRight;