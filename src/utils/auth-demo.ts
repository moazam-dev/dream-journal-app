/**
 * The demo sign-in: what the fake "Sign in with Apple" sheet shows, and how the
 * real Face ID / Touch ID check on the phone is described. There is no account
 * system — this only proves the person holding the phone is its owner.
 */

/** The account the demo sheet pretends to sign in with. */
export const DEMO_ACCOUNT = {
  name: 'Moazam',
  email: 'muhammadmoaxzam@gmail.com',
  /** What "Hide My Email" would relay to, shown when they choose to hide it. */
  relayEmail: 'x8k2p9vq4m@privaterelay.appleid.com',
} as const;

/** What the phone can actually ask for. `passcode` means no biometrics are set up. */
export const BIOMETRIC_KINDS = ['face-id', 'touch-id', 'fingerprint', 'iris', 'passcode', 'none'] as const;

export type BiometricKind = (typeof BIOMETRIC_KINDS)[number];

/**
 * `expo-local-authentication`'s `AuthenticationType` values, kept as plain numbers
 * so this file stays free of native imports (and so the tests can run under node).
 */
const FINGERPRINT = 1;
const FACIAL_RECOGNITION = 2;
const IRIS = 3;

type Device = {
  /** Does the phone have a scanner at all (`hasHardwareAsync`)? */
  hasHardware: boolean;
  /** Has the owner enrolled a face or finger (`isEnrolledAsync`)? */
  enrolled: boolean;
  /** `supportedAuthenticationTypesAsync()`. */
  types: number[];
  /** iOS says "Face ID"/"Touch ID"; Android says "fingerprint". */
  ios: boolean;
};

/**
 * Which check this phone will run. Face beats finger when a phone supports both,
 * because that is what iOS itself offers first.
 */
export function biometricKind({ hasHardware, enrolled, types, ios }: Device): BiometricKind {
  if (!hasHardware) return 'none';
  if (!enrolled) return 'passcode';
  if (types.includes(FACIAL_RECOGNITION)) return 'face-id';
  if (types.includes(FINGERPRINT)) return ios ? 'touch-id' : 'fingerprint';
  if (types.includes(IRIS)) return 'iris';
  return 'passcode';
}

const KIND_LABELS: Record<BiometricKind, string> = {
  'face-id': 'Face ID',
  'touch-id': 'Touch ID',
  fingerprint: 'your fingerprint',
  iris: 'your iris',
  passcode: 'your passcode',
  none: 'a tap',
};

/** How to name the check in the middle of a sentence ("continue with Face ID"). */
export function biometricLabel(kind: BiometricKind): string {
  return KIND_LABELS[kind];
}

/** The button on the sheet, which says what is about to happen. */
export function continueLabel(kind: BiometricKind): string {
  if (kind === 'none') return 'Continue';
  return `Continue with ${KIND_LABELS[kind]}`;
}

/** The line above the button, so nothing about the scan is a surprise. */
export function scanHint(kind: BiometricKind): string {
  switch (kind) {
    case 'face-id':
      return 'Look at your iPhone to continue.';
    case 'touch-id':
    case 'fingerprint':
      return 'Rest your finger on the sensor to continue.';
    case 'iris':
      return 'Look at your phone to continue.';
    case 'passcode':
      return 'Your phone will ask for its passcode.';
    case 'none':
      return 'This phone has no scanner, so this step is skipped.';
  }
}

/**
 * Turns a `LocalAuthenticationError` into something worth reading on screen.
 * A cancel is not an error — the sheet just stays open — so it gets an empty string.
 */
export function authErrorMessage(error: string | undefined): string {
  switch (error) {
    case 'user_cancel':
    case 'app_cancel':
    case 'system_cancel':
      return '';
    case 'authentication_failed':
      return "That didn't match. Try again.";
    case 'lockout':
      return 'Too many tries. Unlock your phone with its passcode, then try again.';
    case 'not_enrolled':
    case 'passcode_not_set':
      return 'No face or fingerprint is set up on this phone.';
    case 'not_available':
      return "This phone can't scan, so you can continue without it.";
    case 'user_fallback':
      return 'Use your passcode to continue.';
    default:
      return "That didn't work. Try again.";
  }
}
