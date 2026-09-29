import { File, Paths } from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { authErrorMessage, biometricKind, DEMO_ACCOUNT, type BiometricKind } from '@/utils/auth-demo';

/**
 * A stand-in for signing in. There is no server, no Apple ID and no token: the sheet
 * asks for consent, the phone's own Face ID (or Touch ID) confirms its owner is here,
 * and the result is a small JSON file next to the profile. Swap this file out when a
 * real Sign in with Apple and a real account arrive.
 */
export type DemoSession = {
  name: string;
  /** The relay address when they chose "Hide My Email". */
  email: string;
  emailHidden: boolean;
  /** How the phone confirmed them, for the Settings line. */
  method: BiometricKind;
  /** When they signed in, as an ISO date-time. */
  signedInAt: string;
};

function sessionFile() {
  return new File(Paths.document, 'session.json');
}

/** The saved demo session, or `null` when nobody has signed in (or it can't be read). */
export function loadSession(): DemoSession | null {
  try {
    const file = sessionFile();
    if (!file.exists) return null;
    const session = JSON.parse(file.textSync()) as unknown;
    if (!session || typeof session !== 'object') return null;
    const { name, email } = session as Partial<DemoSession>;
    return typeof name === 'string' && typeof email === 'string' ? (session as DemoSession) : null;
  } catch {
    return null;
  }
}

/** Saves the session. Failing to write isn't worth blocking sign-in for, so it's only logged. */
function saveSession(session: DemoSession): void {
  try {
    const file = sessionFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(session));
  } catch (error) {
    console.warn('Could not save the session', error);
  }
}

/** Forgets the demo session (used by a future "sign out"). */
export function signOut(): void {
  try {
    const file = sessionFile();
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Could not clear the session', error);
  }
}

/**
 * What this phone will ask for. Asked before the sheet is shown, so the button can
 * say "Continue with Face ID" rather than guessing.
 */
export async function readBiometricKind(): Promise<BiometricKind> {
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    return biometricKind({ hasHardware, enrolled, types, ios: Platform.OS === 'ios' });
  } catch {
    return 'none';
  }
}

export type SignInResult =
  /** Signed in: the session is on disk. */
  | { ok: true; session: DemoSession }
  /** Not signed in. `message` is empty when they simply cancelled the scan. */
  | { ok: false; message: string };

/**
 * Runs the phone's Face ID / Touch ID prompt, then writes the demo session.
 * On a phone with no scanner (a simulator, or biometrics turned off) there is nothing
 * to scan, so the consent on the sheet is taken as the sign-in.
 */
export async function signInWithApple({
  kind,
  hideEmail,
}: {
  kind: BiometricKind;
  hideEmail: boolean;
}): Promise<SignInResult> {
  if (kind !== 'none') {
    let result: LocalAuthentication.LocalAuthenticationResult;
    try {
      result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to afterdream',
        cancelLabel: 'Cancel',
        // Let the phone fall back to its passcode, so a failed scan isn't a dead end.
        disableDeviceFallback: false,
      });
    } catch (error) {
      console.warn('Could not run the biometric check', error);
      return { ok: false, message: authErrorMessage(undefined) };
    }
    if (!result.success) return { ok: false, message: authErrorMessage(result.error) };
  }

  const session: DemoSession = {
    name: DEMO_ACCOUNT.name,
    email: hideEmail ? DEMO_ACCOUNT.relayEmail : DEMO_ACCOUNT.email,
    emailHidden: hideEmail,
    method: kind,
    signedInAt: new Date().toISOString(),
  };
  saveSession(session);
  return { ok: true, session };
}
