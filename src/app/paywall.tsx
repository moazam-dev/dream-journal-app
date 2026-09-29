import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { PaywallView } from '@/components/paywall/paywall-view';
import { beginSubscription, beginTrial } from '@/lib/subscription';
import { lockedHeadline, PAID_FEATURES, type PaidFeature, type PlanId } from '@/utils/subscription';

/**
 * "/paywall", from the Afterdream Paywall design. It comes up twice:
 *
 * - once on the way in, after the loading screen and before Home (`first=1`), where ✕ means
 *   "maybe later" and drops them on Home with the paid parts still shut;
 * - and whenever a paid feature is tapped after the trial has run out, where ✕ just goes back.
 */
export default function PaywallScreen() {
  const { feature, first } = useLocalSearchParams<{ feature?: string; first?: string }>();
  const firstRun = first === '1';
  const locked = PAID_FEATURES.includes(feature as PaidFeature) ? (feature as PaidFeature) : null;

  /** On the way in there is nothing behind this screen, so it replaces itself with Home. */
  const leave = useCallback(() => {
    if (firstRun) router.replace('/home');
    else if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, [firstRun]);

  // Android's back button means "maybe later" here, the same as ✕.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        leave();
        return true;
      });
      return () => sub.remove();
    }, [leave])
  );

  function handleTrial() {
    beginTrial();
    leave();
  }

  function handleSubscribe(plan: PlanId) {
    beginSubscription(plan);
    leave();
  }

  return (
    <>
      <StatusBar style="light" />
      <PaywallView
        headline={lockedHeadline(locked)}
        onClose={leave}
        onTrial={handleTrial}
        onSubscribe={handleSubscribe}
      />
    </>
  );
}
