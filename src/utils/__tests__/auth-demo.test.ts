/** The demo sign-in's wording and the biometric it picks. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { authErrorMessage, biometricKind, biometricLabel, continueLabel, scanHint } from '../auth-demo.ts';

const device = (over: Partial<Parameters<typeof biometricKind>[0]> = {}) => ({
  hasHardware: true,
  enrolled: true,
  types: [2],
  ios: true,
  ...over,
});

describe('biometricKind', () => {
  it('picks Face ID over a fingerprint when the phone does both', () => {
    assert.equal(biometricKind(device({ types: [1, 2] })), 'face-id');
  });

  it('names the finger check the way each platform does', () => {
    assert.equal(biometricKind(device({ types: [1] })), 'touch-id');
    assert.equal(biometricKind(device({ types: [1], ios: false })), 'fingerprint');
  });

  it('falls back to the passcode when nothing is enrolled, and to none without a scanner', () => {
    assert.equal(biometricKind(device({ enrolled: false })), 'passcode');
    assert.equal(biometricKind(device({ types: [] })), 'passcode');
    assert.equal(biometricKind(device({ hasHardware: false })), 'none');
  });

  it('puts the scanner first: no hardware wins over anything enrolled', () => {
    assert.equal(biometricKind(device({ hasHardware: false, enrolled: true, types: [1, 2] })), 'none');
  });
});

describe('wording', () => {
  it('says what the button is about to do', () => {
    assert.equal(continueLabel('face-id'), 'Continue with Face ID');
    assert.equal(continueLabel('touch-id'), 'Continue with Touch ID');
    assert.equal(continueLabel('none'), 'Continue');
  });

  it('gives every kind a label and a hint', () => {
    for (const kind of ['face-id', 'touch-id', 'fingerprint', 'iris', 'passcode', 'none'] as const) {
      assert.ok(biometricLabel(kind).length > 0);
      assert.ok(scanHint(kind).endsWith('.'));
    }
  });
});

describe('authErrorMessage', () => {
  it('stays quiet when the person cancels', () => {
    assert.equal(authErrorMessage('user_cancel'), '');
    assert.equal(authErrorMessage('app_cancel'), '');
    assert.equal(authErrorMessage('system_cancel'), '');
  });

  it('explains the failures worth explaining', () => {
    assert.match(authErrorMessage('authentication_failed'), /try again/i);
    assert.match(authErrorMessage('lockout'), /passcode/i);
    assert.match(authErrorMessage('not_enrolled'), /set up/i);
    assert.match(authErrorMessage(undefined), /didn't work/i);
  });
});
