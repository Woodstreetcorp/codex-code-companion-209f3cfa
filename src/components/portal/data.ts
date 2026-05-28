import {
  Calculator,
  CalendarDays,
  Clock,
  FileText,
  Gift,
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
export const ACTIVE: ActiveApp[] = [];

export const SUBMITTED: SubmittedApp[] = [];

export const EXPIRED: ExpiredApp[] = [];

export const COMPLETED: CompletedApp[] = [];

export const DOCUMENTS: { name: string; app: string; status: string; due: string }[] = [];

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

export type VaultTab = "all" | "application" | "reusable" | "signed" | "approval" | "archived";

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

export const VAULT_DOCUMENTS: VaultDoc[] = [];

export const CONDITIONS: { name: string; app: string; status: string; due: string }[] = [];

export const SNAPSHOTS: {
  id: string;
  date: string;
  type: string;
  loan: string;
  path: string;
  offers: number;
  status: string;
}[] = [];

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
  | "/portal/home-life-bundle"
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
  { to: "/portal/home-life-bundle", label: "Home Life Bundle", icon: Gift },
  { to: "/portal/tools", label: "Mortgage Tools", icon: Calculator },
  { to: "/portal/disclosures", label: "Disclosures", icon: ScrollText },
  { to: "/portal/settings", label: "Settings", icon: Settings },
];

// ─── Calculators metadata ────────────────────────────────────────────────
export type ToolKey = "payment" | "affordability" | "refinance" | "renewal" | "equity" | "closing";

export const TOOLS: {
  key: ToolKey;
  name: string;
  icon: typeof Home;
  blurb: string;
}[] = [
  {
    key: "payment",
    name: "Mortgage Payment",
    icon: Calculator,
    blurb: "Estimate monthly payment for any rate, term, and amortization.",
  },
  {
    key: "affordability",
    name: "Affordability",
    icon: Home,
    blurb: "See the maximum home price you can afford.",
  },
  {
    key: "refinance",
    name: "Refinance Savings",
    icon: RefreshCw,
    blurb: "Compare your current mortgage to a refinance scenario.",
  },
  {
    key: "renewal",
    name: "Renewal Planner",
    icon: Clock,
    blurb: "Plan your renewal payment at a new rate.",
  },
  {
    key: "equity",
    name: "Home Equity",
    icon: Wallet,
    blurb: "Estimate how much equity you can access today.",
  },
  {
    key: "closing",
    name: "Closing Costs",
    icon: FileText,
    blurb: "Estimate land transfer tax, legal, and closing fees.",
  },
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
