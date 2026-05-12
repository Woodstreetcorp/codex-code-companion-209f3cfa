/**
 * Co-borrower invitation store (mock, localStorage-backed).
 *
 * In production this maps to:
 *   application_co_borrower_invitations
 *     id, application_id, full_name, email, phone, relationship, role,
 *     status (invited|accepted|profile_started|profile_complete|consent_complete|revoked),
 *     invited_at, last_reminder_at, accepted_at, revoked_at, invited_by_user_id
 *
 * Codex will replace the storage layer; the shape and statuses below are the
 * contract the UI relies on.
 */

export type CoBorrowerRole = "co-borrower" | "guarantor" | "co-signer";
export type CoBorrowerRelationship =
  | "spouse"
  | "partner"
  | "parent"
  | "child"
  | "sibling"
  | "friend"
  | "business-partner"
  | "other";

export type CoBorrowerStatus =
  | "invited"
  | "accepted"
  | "profile_started"
  | "profile_complete"
  | "consent_complete"
  | "revoked";

export type CoBorrower = {
  id: string;
  applicationId: string;
  fullName: string;
  email: string;
  phone?: string;
  relationship: CoBorrowerRelationship;
  role: CoBorrowerRole;
  status: CoBorrowerStatus;
  invitedAt: string;
  lastReminderAt?: string;
  acceptedAt?: string;
  revokedAt?: string;
};

const KEY = "approvu.coborrowers.v1";
const listeners = new Set<() => void>();

function readAll(): CoBorrower[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CoBorrower[]) : seed();
  } catch {
    return [];
  }
}

function writeAll(next: CoBorrower[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((l) => l());
  } catch {
    /* ignore */
  }
}

function seed(): CoBorrower[] {
  // Mirrors the BORROWERS array in the consent screen so demos line up.
  const now = new Date();
  const ago = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
  const seeded: CoBorrower[] = [
    {
      id: "cb_jamie",
      applicationId: "APP-2025-001",
      fullName: "Jamie Scott",
      email: "jamie.scott@example.com",
      phone: "(416) 555-0148",
      relationship: "spouse",
      role: "co-borrower",
      status: "invited",
      invitedAt: ago(36),
      lastReminderAt: ago(8),
    },
  ];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(seeded));
  }
  return seeded;
}

export function listCoBorrowers(applicationId: string): CoBorrower[] {
  return readAll().filter((c) => c.applicationId === applicationId);
}

export function subscribeCoBorrowers(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function inviteCoBorrower(
  input: Omit<CoBorrower, "id" | "status" | "invitedAt">,
): CoBorrower {
  const entry: CoBorrower = {
    ...input,
    id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    status: "invited",
    invitedAt: new Date().toISOString(),
  };
  writeAll([entry, ...readAll()]);
  return entry;
}

export function updateCoBorrower(id: string, patch: Partial<CoBorrower>) {
  writeAll(readAll().map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function resendInvite(id: string) {
  updateCoBorrower(id, { lastReminderAt: new Date().toISOString() });
}

export function revokeCoBorrower(id: string) {
  updateCoBorrower(id, { status: "revoked", revokedAt: new Date().toISOString() });
}

export function removeCoBorrower(id: string) {
  writeAll(readAll().filter((c) => c.id !== id));
}

export function statusLabel(s: CoBorrowerStatus): string {
  switch (s) {
    case "invited": return "Invitation sent";
    case "accepted": return "Invitation accepted";
    case "profile_started": return "Profile in progress";
    case "profile_complete": return "Profile complete";
    case "consent_complete": return "Consent complete";
    case "revoked": return "Revoked";
  }
}

export function relationshipLabel(r: CoBorrowerRelationship): string {
  return ({
    spouse: "Spouse",
    partner: "Partner",
    parent: "Parent",
    child: "Child",
    sibling: "Sibling",
    friend: "Friend",
    "business-partner": "Business partner",
    other: "Other",
  } as const)[r];
}

export function roleLabel(r: CoBorrowerRole): string {
  return ({
    "co-borrower": "Co-borrower",
    guarantor: "Guarantor",
    "co-signer": "Co-signer",
  } as const)[r];
}