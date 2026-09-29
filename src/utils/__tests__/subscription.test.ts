/** Trial countdown, the gate each paid feature hits, and the paywall's wording. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  entitlement,
  gateFor,
  isUnlocked,
  lockedHeadline,
  parseRecord,
  PLANS,
  planById,
  reminderHeadline,
  reminderNote,
  startTrial,
  subscribe,
  trialDaysLeft,
  type SubscriptionRecord,
} from '../subscription.ts';

const NOW = new Date('2026-03-10T09:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe('trialDaysLeft', () => {
  it('counts the part-day they are in, so day one reads as seven', () => {
    assert.equal(trialDaysLeft(daysAgo(0), NOW), 7);
    assert.equal(trialDaysLeft(daysAgo(4.5), NOW), 3);
    assert.equal(trialDaysLeft(daysAgo(6.1), NOW), 1);
  });

  it('never goes below zero, and treats a missing or broken date as over', () => {
    assert.equal(trialDaysLeft(daysAgo(30), NOW), 0);
    assert.equal(trialDaysLeft(undefined, NOW), 0);
    assert.equal(trialDaysLeft('not a date', NOW), 0);
  });
});

describe('entitlement', () => {
  it('is "none" before the paywall has been answered', () => {
    assert.deepEqual(entitlement({}, NOW), { status: 'none' });
  });

  it('runs the trial, then expires it, and says which day it ends on', () => {
    // Started 2 days before 10 March, so the week is out on the 15th.
    assert.deepEqual(entitlement({ trialStartedAt: daysAgo(2) }, NOW), {
      status: 'trial',
      daysLeft: 5,
      endsOn: 'mar 15',
    });
    assert.deepEqual(entitlement({ trialStartedAt: daysAgo(9) }, NOW), { status: 'expired' });
  });

  it('lets paying win over a trial that is still running', () => {
    const record = { trialStartedAt: daysAgo(1), plan: 'yearly', subscribedAt: daysAgo(0) } as const;
    assert.deepEqual(entitlement(record, NOW), { status: 'subscribed', plan: 'yearly' });
  });

  it('ignores a half-written subscription (a plan with no date)', () => {
    assert.deepEqual(entitlement({ plan: 'monthly' }, NOW), { status: 'none' });
  });

  it('opens the paid features for a trial or a subscription only', () => {
    assert.equal(isUnlocked({ status: 'trial', daysLeft: 1, endsOn: 'mar 11' }), true);
    assert.equal(isUnlocked({ status: 'subscribed', plan: 'monthly' }), true);
    assert.equal(isUnlocked({ status: 'none' }), false);
    assert.equal(isUnlocked({ status: 'expired' }), false);
  });
});

describe('gateFor', () => {
  it('waves paying dreamers straight through', () => {
    const record = subscribe({}, 'yearly', NOW);
    assert.equal(gateFor(record, 'garden', NOW), 'open');
  });

  it('nudges on the way into a paid feature at any point in the trial', () => {
    assert.equal(gateFor({ trialStartedAt: daysAgo(0) }, 'garden', NOW), 'remind');
    assert.equal(gateFor({ trialStartedAt: daysAgo(1) }, 'garden', NOW), 'remind');
    assert.equal(gateFor({ trialStartedAt: daysAgo(5) }, 'garden', NOW), 'remind');
  });

  it('nudges once per feature per run of the app, not once per tap', () => {
    const record: SubscriptionRecord = { trialStartedAt: daysAgo(5) };
    const seen = new Set<'garden' | 'voice'>();
    assert.equal(gateFor(record, 'garden', NOW, seen), 'remind');
    seen.add('garden');
    // The tenth garden of the sitting stays quiet.
    assert.equal(gateFor(record, 'garden', NOW, seen), 'open');
    // Another feature still gets its own nudge.
    assert.equal(gateFor(record, 'voice', NOW, seen), 'remind');
  });

  it('starts over when the app is opened again (nothing about reminders is saved)', () => {
    const record = parseRecord({ trialStartedAt: daysAgo(5), reminded: { garden: '2026-03-10' } });
    assert.equal('reminded' in record, false);
    // A fresh run means a fresh, empty set.
    assert.equal(gateFor(record, 'garden', NOW), 'remind');
  });

  it('shows the full paywall once the trial is over, or if it never started', () => {
    assert.equal(gateFor({ trialStartedAt: daysAgo(8) }, 'patterns', NOW), 'paywall');
    assert.equal(gateFor({}, 'patterns', NOW), 'paywall');
  });
});

describe('startTrial', () => {
  it('stamps the start, and refuses to restart a trial already taken', () => {
    const started = startTrial({}, NOW);
    assert.equal(started.trialStartedAt, NOW.toISOString());
    const later = new Date(NOW.getTime() + 60_000);
    assert.equal(startTrial(started, later).trialStartedAt, NOW.toISOString());
  });
});

describe('wording', () => {
  it('counts the trial down, and calls the last one the last day', () => {
    assert.equal(reminderHeadline(5), '5 days left');
    assert.equal(reminderHeadline(2), '2 days left');
    assert.equal(reminderHeadline(1), 'last day');
    assert.equal(reminderHeadline(0), 'last day');
  });

  it('names the day everything shuts, and copes when there is no date to name', () => {
    assert.equal(reminderNote('mar 15'), 'plus features lock after mar 15.');
    assert.equal(reminderNote(''), 'plus features lock when the trial ends.');
  });

  it('offers the yearly plan first, flagged, and falls back to it for an unknown id', () => {
    assert.equal(PLANS[0].id, 'yearly');
    assert.equal(PLANS[0].badge, 'save 50%');
    assert.equal(PLANS[1].badge, null);
    assert.equal(planById('monthly').price, '$9.99/month');
  });

  it('names the locked feature above the paywall, and says nothing when nothing sent them', () => {
    assert.equal(lockedHeadline('visualize'), 'dream visuals is locked');
    assert.equal(lockedHeadline(null), null);
  });

});

describe('parseRecord', () => {
  it('keeps what it recognises and drops the rest', () => {
    const parsed = parseRecord({
      trialStartedAt: daysAgo(1),
      plan: 'weekly',
      subscribedAt: 5,
    });
    assert.ok(parsed.trialStartedAt);
    assert.equal(parsed.plan, undefined);
    assert.equal(parsed.subscribedAt, undefined);
  });

  it('reads rubbish as an empty record', () => {
    assert.deepEqual(parseRecord(null), {});
    assert.deepEqual(parseRecord('nope'), {});
  });
});
