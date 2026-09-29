import { File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import {
  entitlement,
  gateFor,
  parseRecord,
  startTrial,
  subscribe as subscribeRecord,
  type Entitlement,
  type Gate,
  type PaidFeature,
  type PlanId,
  type SubscriptionRecord,
} from '@/utils/subscription';

/**
 * Whether the paid features are open, saved on the phone only (a small JSON file next to
 * profile.json). There is no store receipt behind this yet: "pay now" is a local switch, so
 * the paywall and its reminders can be built and walked through before billing is wired up.
 *
 * The rules live in `@/utils/subscription`; this file is the copy on disk and the way screens
 * hear about changes.
 */

function recordFile() {
  return new File(Paths.document, 'subscription.json');
}

/** Read once, then kept in memory: the record changes rarely and screens read it on every render. */
let cached: SubscriptionRecord | null = null;
const listeners = new Set<() => void>();

/**
 * Which paid features have already shown the trial reminder since the app came up. Kept in
 * memory on purpose, never on disk: opening the app again should nudge again.
 */
let remindedThisRun = new Set<PaidFeature>();

/**
 * Coming back to the app counts as opening it, so the first paid tap after a trip to another
 * app nudges too. A cold launch clears the set by virtue of this module being new.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'active') remindedThisRun = new Set();
});

function read(): SubscriptionRecord {
  if (cached) return cached;
  try {
    const file = recordFile();
    cached = file.exists ? parseRecord(JSON.parse(file.textSync())) : {};
  } catch {
    cached = {};
  }
  return cached;
}

/** Saves `next` and tells every screen. Failing to write isn't worth blocking on, so it's only logged. */
function write(next: SubscriptionRecord): void {
  cached = next;
  try {
    const file = recordFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(next));
  } catch (error) {
    console.warn('Could not save the subscription', error);
  }
  for (const listen of listeners) listen();
}

function listen(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Everything saved so far (possibly empty). */
export function loadSubscription(): SubscriptionRecord {
  return read();
}

/** Starts the free trial. Does nothing if one has already been taken. */
export function beginTrial(): void {
  const next = startTrial(read(), new Date());
  if (next !== read()) write(next);
}

/** Records the plan they picked. */
export function beginSubscription(plan: PlanId): void {
  write(subscribeRecord(read(), plan, new Date()));
}

/** Notes that `feature` has nudged, so it stays quiet until the app is opened again. */
export function noteReminded(feature: PaidFeature): void {
  remindedThisRun.add(feature);
}

/** Where they stand right now, read straight off the record (no React). */
export function currentEntitlement(): Entitlement {
  return entitlement(read(), new Date());
}

/** What tapping `feature` should do: let them in, nudge them, or stop at the paywall. */
export function featureGate(feature: PaidFeature): Gate {
  return gateFor(read(), feature, new Date(), remindedThisRun);
}

/** True once the paywall has been answered — the way Home knows not to show it again. */
export function hasAnsweredPaywall(): boolean {
  return currentEntitlement().status !== 'none';
}

/** Re-renders whenever the record changes, so unlocking on the paywall lights the app up at once. */
export function useEntitlement(): Entitlement {
  const record = useSyncExternalStore(listen, read, read);
  // A new Date() on every render would break the store's snapshot equality, so derive from the record.
  return entitlement(record, new Date());
}

/** Tests and the dev reset only: forgets the trial, the plan and this run's reminders. */
export function resetSubscription(): void {
  remindedThisRun = new Set();
  try {
    const file = recordFile();
    if (file.exists) file.delete();
  } catch {
    // Nothing saved, or it can't be removed — either way the record below is the truth.
  }
  write({});
}
