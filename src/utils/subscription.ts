import { shortDate } from './today.ts';

/**
 * Who may open the paid parts of Afterdream, and what the paywall says.
 *
 * Pure rules only (no React Native, no disk): `src/lib/subscription.ts` keeps the record on
 * the phone, the screens read it through `useEntitlement`. Kept apart so `npm test` can run it.
 */

/** How long the free trial runs once they tap "try 7 days free". */
export const TRIAL_DAYS = 7;

export type PlanId = 'yearly' | 'monthly';

export type Plan = {
  id: PlanId;
  /** Shown on the row ("yearly"). */
  name: string;
  /** What it charges ("$59.99/year"). */
  price: string;
  /** The same money per week, so the two rows compare. */
  week: string;
  /** Corner flag, or null for no flag. */
  badge: string | null;
};

/** The two rows on the paywall, in the order the design lists them. */
export const PLANS: readonly Plan[] = [
  { id: 'yearly', name: 'yearly', price: '$59.99/year', week: '$1.15/week', badge: 'save 50%' },
  { id: 'monthly', name: 'monthly', price: '$9.99/month', week: '$2.31/week', badge: null },
] as const;

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

/** The parts of the app the subscription pays for. Writing and reading dreams stays free. */
export const PAID_FEATURES = ['voice', 'garden', 'visualize', 'patterns', 'capsules'] as const;
export type PaidFeature = (typeof PAID_FEATURES)[number];

/** What each locked feature is called in the reminder, in the app's lowercase voice. */
const FEATURE_NAMES: Record<PaidFeature, string> = {
  voice: 'the voice agent',
  garden: 'your dream garden',
  visualize: 'dream visuals',
  patterns: 'your patterns',
  capsules: 'time capsules',
};

export function featureName(feature: PaidFeature): string {
  return FEATURE_NAMES[feature];
}

/** What's kept on the phone. Every field is optional: an empty record means "never seen the paywall". */
export type SubscriptionRecord = {
  /** When "try 7 days free" was tapped, as an ISO timestamp. */
  trialStartedAt?: string;
  /** Set once they pay. */
  plan?: PlanId;
  subscribedAt?: string;
};

export type Entitlement =
  /** Straight out of onboarding: the paywall hasn't been answered yet. */
  | { status: 'none' }
  /** `endsOn` is the day the week runs out, written the way the reminder says it ("mar 15"). */
  | { status: 'trial'; daysLeft: number; endsOn: string }
  | { status: 'expired' }
  | { status: 'subscribed'; plan: PlanId };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole days left of the trial, rounded up, so the last part-day still reads "1 day left".
 * Never negative; an unreadable start date counts as over.
 */
export function trialDaysLeft(trialStartedAt: string | undefined, now: Date): number {
  if (!trialStartedAt) return 0;
  const started = Date.parse(trialStartedAt);
  if (Number.isNaN(started)) return 0;
  const endsAt = started + TRIAL_DAYS * DAY_MS;
  return Math.max(0, Math.ceil((endsAt - now.getTime()) / DAY_MS));
}

/** The moment the free week runs out, or null if no trial was ever taken. */
export function trialEndsAt(trialStartedAt: string | undefined): Date | null {
  if (!trialStartedAt) return null;
  const started = Date.parse(trialStartedAt);
  if (Number.isNaN(started)) return null;
  return new Date(started + TRIAL_DAYS * DAY_MS);
}

/** Where they stand right now. Paying always wins, even if a trial is still running. */
export function entitlement(record: SubscriptionRecord, now: Date): Entitlement {
  if (record.plan && record.subscribedAt) return { status: 'subscribed', plan: record.plan };
  if (!record.trialStartedAt) return { status: 'none' };
  const daysLeft = trialDaysLeft(record.trialStartedAt, now);
  if (daysLeft <= 0) return { status: 'expired' };
  const endsAt = trialEndsAt(record.trialStartedAt);
  return { status: 'trial', daysLeft, endsOn: endsAt ? shortDate(endsAt) : '' };
}

/** True while the paid features open. */
export function isUnlocked(ent: Entitlement): boolean {
  return ent.status === 'trial' || ent.status === 'subscribed';
}

/** "3 days", "1 day", "today" — how much of the week is left. */
export function daysLeftLabel(daysLeft: number): string {
  if (daysLeft <= 0) return 'today';
  if (daysLeft === 1) return '1 day';
  return `${daysLeft} days`;
}

/** The big line on the reminder: "3 days left", or "last day" on the way out. */
export function reminderHeadline(daysLeft: number): string {
  return daysLeft <= 1 ? 'last day' : `${daysLeft} days left`;
}

/** The line under it, naming the day everything shuts: "plus features lock after mar 15." */
export function reminderNote(endsOn: string): string {
  return endsOn ? `plus features lock after ${endsOn}.` : 'plus features lock when the trial ends.';
}

/**
 * What tapping a paid feature should do:
 * - "open": they've paid, or this feature has already been reminded about since the app opened.
 * - "remind": they're on the free trial — the small sheet says how long is left, then lets
 *   them through. Once per feature per run of the app, so the tenth visualize in a sitting is
 *   quiet but reopening the app nudges again.
 * - "paywall": the trial is over (or was never started) — the full paywall, no way past it.
 *
 * `remindedThisRun` is what has already nudged since the app came up; it is deliberately not
 * saved to disk, so a fresh launch starts over.
 */
export type Gate = 'open' | 'remind' | 'paywall';

export function gateFor(
  record: SubscriptionRecord,
  feature: PaidFeature,
  now: Date,
  remindedThisRun: ReadonlySet<PaidFeature> = new Set(),
): Gate {
  const ent = entitlement(record, now);
  if (ent.status === 'subscribed') return 'open';
  if (ent.status !== 'trial') return 'paywall';
  return remindedThisRun.has(feature) ? 'open' : 'remind';
}

/** The record after "try 7 days free". Starting a second trial doesn't reset the first. */
export function startTrial(record: SubscriptionRecord, now: Date): SubscriptionRecord {
  if (record.trialStartedAt) return record;
  return { ...record, trialStartedAt: now.toISOString() };
}

/** The record after they pay. */
export function subscribe(record: SubscriptionRecord, plan: PlanId, now: Date): SubscriptionRecord {
  return { ...record, plan, subscribedAt: now.toISOString() };
}

/** Reads anything off disk back as a record, dropping fields that aren't the right shape. */
export function parseRecord(value: unknown): SubscriptionRecord {
  if (!value || typeof value !== 'object') return {};
  const raw = value as Record<string, unknown>;
  const record: SubscriptionRecord = {};
  if (typeof raw.trialStartedAt === 'string') record.trialStartedAt = raw.trialStartedAt;
  if (raw.plan === 'yearly' || raw.plan === 'monthly') record.plan = raw.plan;
  if (typeof raw.subscribedAt === 'string') record.subscribedAt = raw.subscribedAt;
  return record;
}

/** The line above the paywall's title when they got there by tapping something locked. */
export function lockedHeadline(feature: PaidFeature | null): string | null {
  return feature ? `${featureName(feature)} is locked` : null;
}
