import { toast } from "sonner";

/**
 * Activity feed: lightweight localStorage-backed log so toasts also persist
 * into the notifications feed ("dual-write"). Components can subscribe to
 * updates via `subscribeActivity` to refresh in-place.
 */

export type ActivityCategory =
  | "Application"
  | "Document"
  | "Offer"
  | "Condition"
  | "Message"
  | "Wallet"
  | "System"
  | "Security";

export type ActivityEntry = {
  id: string;
  category: ActivityCategory;
  title: string;
  body?: string;
  href?: string;
  at: string; // ISO
  read: boolean;
};

const KEY = "approvu.activity.feed.v1";
const MAX = 100;
const listeners = new Set<() => void>();

function readAll(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: ActivityEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
    listeners.forEach((l) => l());
  } catch {
    /* quota or disabled storage – ignore */
  }
}

export function getActivity(): ActivityEntry[] {
  return readAll();
}

export function subscribeActivity(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function markActivityRead(id?: string) {
  const all = readAll();
  writeAll(id ? all.map((e) => (e.id === id ? { ...e, read: true } : e)) : all.map((e) => ({ ...e, read: true })));
}

export function clearActivity() {
  writeAll([]);
}

/**
 * Dual-write: shows a toast AND appends to the activity feed.
 * Replaces the common pattern of `toast.success("...")` for events users
 * should be able to find again later.
 */
export function notify(opts: {
  category: ActivityCategory;
  title: string;
  body?: string;
  href?: string;
  tone?: "success" | "info" | "error";
}) {
  const { category, title, body, href, tone = "info" } = opts;
  const entry: ActivityEntry = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category,
    title,
    body,
    href,
    at: new Date().toISOString(),
    read: false,
  };
  writeAll([entry, ...readAll()]);

  const description = body;
  if (tone === "success") toast.success(title, { description });
  else if (tone === "error") toast.error(title, { description });
  else toast(title, { description });
}