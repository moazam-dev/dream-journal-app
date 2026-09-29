import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { TrialReminder } from '@/components/paywall/trial-reminder';
import { featureGate, noteReminded, useEntitlement } from '@/lib/subscription';
import type { PaidFeature } from '@/utils/subscription';

/** Opens the full paywall over whatever is on screen, saying which feature sent them there. */
export function openPaywall(feature: PaidFeature | null = null) {
  router.push({ pathname: '/paywall', params: feature ? { feature } : {} });
}

/**
 * Guards the paid parts of the app from wherever they're tapped.
 *
 * `guard(feature, run)` either runs straight away, shows the small end-of-trial nudge first,
 * or sends them to the paywall. The screen renders `reminder` somewhere in its tree so the
 * nudge has a home.
 */
export function usePaywall() {
  const entitlement = useEntitlement();
  const [pending, setPending] = useState<PaidFeature | null>(null);
  // Held outside state: it's the thing to do once the nudge is dismissed, not something drawn.
  const run = useRef<(() => void) | null>(null);

  function guard(feature: PaidFeature, open: () => void) {
    switch (featureGate(feature)) {
      case 'open':
        open();
        return;
      case 'paywall':
        openPaywall(feature);
        return;
      case 'remind':
        run.current = open;
        setPending(feature);
    }
  }

  function dismiss(): (() => void) | null {
    if (pending) noteReminded(pending);
    const next = run.current;
    run.current = null;
    setPending(null);
    return next;
  }

  const reminder = (
    <TrialReminder
      feature={pending}
      daysLeft={entitlement.status === 'trial' ? entitlement.daysLeft : 0}
      endsOn={entitlement.status === 'trial' ? entitlement.endsOn : ''}
      onContinue={() => dismiss()?.()}
      onSubscribe={() => {
        const feature = pending;
        // Their answer is the paywall, not the feature: drop what they were on their way to.
        run.current = null;
        dismiss();
        openPaywall(feature);
      }}
    />
  );

  return { guard, reminder, entitlement };
}
