import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { FaceIdMark } from '@/components/auth/face-id-mark';
import { readBiometricKind, signInWithApple, type DemoSession } from '@/lib/auth';
import { continueLabel, DEMO_ACCOUNT, scanHint, type BiometricKind } from '@/utils/auth-demo';

type AppleSignInSheetProps = {
  visible: boolean;
  /** Backed out without signing in (tap outside, "Not now", or a cancelled scan). */
  onCancel: () => void;
  /** Signed in: the session is already saved. */
  onSignedIn: (session: DemoSession) => void;
  reduceMotion: boolean;
};

/** Apple logo from the design (17 × 20 viewBox). */
const APPLE_PATH =
  'M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z';

/** What afterdream would be given, spelled out before anything is agreed to. */
const SHARED = ['your name, so the app can greet you', 'an email address, so your dreams stay yours'];

/**
 * The sign-in sheet that comes up on "Continue with Apple": it says what would be
 * shared, lets the email be hidden, and then hands over to the phone's own Face ID
 * (or Touch ID) prompt. Nothing leaves the phone — see `@/lib/auth`.
 */
export function AppleSignInSheet({ visible, onCancel, onSignedIn, reduceMotion }: AppleSignInSheetProps) {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<BiometricKind | null>(null);
  const [hideEmail, setHideEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Ask the phone what it can scan, so the button can name it. Re-asked each time the
  // sheet opens, in case biometrics were turned on in Settings meanwhile. The answer
  // arrives in a callback (never straight from the effect body), and clears any
  // message left over from the last time the sheet was open.
  useEffect(() => {
    if (!visible) return;
    let live = true;
    readBiometricKind().then((next) => {
      if (!live) return;
      setKind(next);
      setError('');
    });
    return () => {
      live = false;
    };
  }, [visible]);

  async function handleContinue() {
    if (busy || kind === null) return;
    setBusy(true);
    setError('');
    const result = await signInWithApple({ kind, hideEmail });
    setBusy(false);
    if (result.ok) {
      onSignedIn(result.session);
      return;
    }
    // An empty message means they cancelled the scan: close quietly, no telling-off.
    if (!result.message) {
      onCancel();
      return;
    }
    setError(result.message);
  }

  const motion = reduceMotion ? 0 : 1;
  const email = hideEmail ? DEMO_ACCOUNT.relayEmail : DEMO_ACCOUNT.email;
  const ready = kind !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'fade' : 'slide'}
      statusBarTranslucent
      onRequestClose={busy ? undefined : onCancel}>
      <View style={styles.backdrop}>
        {/* Tapping the dimmed area behind the card backs out, unless a scan is running. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sign in"
          style={styles.dismissArea}
          onPress={busy ? undefined : onCancel}
        />

        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom + 10, 26) }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Svg width={19} height={22} viewBox="0 0 17 20">
              <Path d={APPLE_PATH} fill={NightColors.text} />
            </Svg>
            <Text style={styles.title} accessibilityRole="header">
              Sign in with Apple
            </Text>
          </View>
          <Text style={styles.subtitle}>afterdream would like to use your Apple ID.</Text>

          <View style={styles.rows}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Name</Text>
              <Text style={styles.rowValue}>{DEMO_ACCOUNT.name}</Text>
            </View>
            <View style={styles.divider} />
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: hideEmail }}
              accessibilityLabel="Hide my email"
              onPress={() => setHideEmail((hidden) => !hidden)}
              disabled={busy}
              style={styles.row}>
              <Text style={styles.rowLabel}>Email</Text>
              <View style={styles.emailSide}>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {email}
                </Text>
                <Text style={styles.hideLink}>{hideEmail ? 'Share My Email' : 'Hide My Email'}</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.shared}>
            <Text style={styles.sharedTitle}>What afterdream gets</Text>
            {SHARED.map((line) => (
              <View key={line} style={styles.sharedRow}>
                <View style={styles.bullet} />
                <Text style={styles.sharedText}>{line}</Text>
              </View>
            ))}
            <Text style={styles.sharedNote}>
              Your dreams stay on this phone. Signing in only unlocks the app for you.
            </Text>
          </View>

          <Text style={styles.hint}>{ready ? scanHint(kind) : 'Checking what this phone can scan…'}</Text>
          {!!error && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready || busy }}
            onPress={handleContinue}
            disabled={!ready || busy}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <Animated.View
              style={[
                styles.button,
                {
                  opacity: ready ? 1 : 0.5,
                  transitionProperty: 'opacity',
                  transitionDuration: 250 * motion,
                  transitionTimingFunction: 'ease',
                },
              ]}>
              {busy ? (
                <ActivityIndicator color={BrandColors.ink} />
              ) : (
                <FaceIdMark size={22} color={BrandColors.ink} />
              )}
              <Text style={styles.buttonText}>
                {busy ? 'Waiting for you…' : ready ? continueLabel(kind) : 'Continue'}
              </Text>
            </Animated.View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            disabled={busy}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <Text style={[styles.cancelText, busy && styles.cancelTextOff]}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dismissArea: {
    flex: 1,
  },
  card: {
    paddingTop: 10,
    paddingHorizontal: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#141414',
    gap: 16,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3A3A3A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  title: {
    fontFamily: BrandFonts.semibold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: NightColors.text,
  },
  subtitle: {
    marginTop: -8,
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: NightColors.textSoft,
  },
  rows: {
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
  },
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2E2E2E',
  },
  rowLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    color: NightColors.text,
  },
  emailSide: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rowValue: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    color: NightColors.hint,
  },
  hideLink: {
    marginTop: 2,
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    color: BrandColors.lime,
  },
  shared: {
    gap: 8,
  },
  sharedTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: NightColors.hint,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BrandColors.lime,
  },
  sharedText: {
    flex: 1,
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: NightColors.textSoft,
  },
  sharedNote: {
    marginTop: 2,
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: NightColors.hint,
  },
  hint: {
    textAlign: 'center',
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: NightColors.hint,
  },
  error: {
    marginTop: -10,
    textAlign: 'center',
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#F2A8A8',
  },
  button: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 17,
    color: BrandColors.ink,
  },
  cancel: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    color: NightColors.hint,
  },
  cancelTextOff: {
    color: '#4A4A4A',
  },
  pressed: {
    opacity: 0.85,
  },
});
