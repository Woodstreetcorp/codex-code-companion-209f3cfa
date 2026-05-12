/**
 * Borrower-side application status overrides (mock, localStorage-backed).
 *
 * Production mapping:
 *   application_status_events
 *     id, application_id, kind (withdrawn|paused|reactivated|declined),
 *     reason_code, reason_text, occurred_at, actor_user_id
 *   applications.status (canonical)
 */

export type ApplicationStateKind =
  | "active"
  | "withdrawn"
  | "paused"
  | "declined";

export type WithdrawReason =
  | "no-longer-buying"
  | "found-another-lender"
  | "timing-changed"
  | "personal-circumstance"
  | "rates-not-right"
  | "other";

export type ApplicationState = {
  applicationId: string;
  state: ApplicationStateKind;
  reasonCode?: WithdrawReason;
  reasonText?: string;
  changedAt: string;
};

const KEY = "approvu.appstate.v1";
const listeners = new Set<() => void>();

function readAll(): Record<string, ApplicationState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, ApplicationState>) : {};
  } catch {
    return {};
  }
}

function writeAll(next: Record<string, ApplicationState>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((l) => l());
  } catch {
    /* ignore */
  }
}

export function getApplicationState(applicationId: string): ApplicationState {
  const all = readAll();
  return (
    all[applicationId] ?? {
      applicationId,
      state: "active",
      changedAt: new Date(0).toISOString(),
    }
  );
}

export function subscribeApplicationState(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setApplicationState(input: Omit<ApplicationState, "changedAt">) {
  const all = readAll();
  all[input.applicationId] = { ...input, changedAt: new Date().toISOString() };
  writeAll(all);
}

export function reactivateApplication(applicationId: string) {
  setApplicationState({ applicationId, state: "active" });
}

export const WITHDRAW_REASONS: { value: WithdrawReason; label: string }[] = [
  { value: "no-longer-buying", label: "I'm no longer buying / refinancing right now" },
  { value: "found-another-lender", label: "I went with another lender" },
  { value: "timing-changed", label: "My timing changed" },
  { value: "personal-circumstance", label: "Personal circumstance changed" },
  { value: "rates-not-right", label: "Rates / terms aren't right for me" },
  { value: "other", label: "Other" },
];

export function reasonLabel(r?: WithdrawReason): string {
  if (!r) return "";
  return WITHDRAW_REASONS.find((x) => x.value === r)?.label ?? r;
}