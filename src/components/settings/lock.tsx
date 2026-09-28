import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FaceIdIcon } from '@/components/settings/icons';
import { PillButton, settingsStyles as S } from '@/components/settings/parts';
import { BrandFonts as F, SettingsColors as C } from '@/constants/theme';

const PIN_LENGTH = 4;
/** Pause after the last digit so the fourth dot shows before the step changes. */
const PIN_PAUSE_MS = 250;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/**
 * Create a passcode: type four digits, then type them again. UI only for now, so the
 * passcode is never stored; a match just calls `onSet`.
 */
export function PasscodePage({ onSet }: { onSet: () => void }) {
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  function press(key: string) {
    if (key === '⌫') {
      setPin((current) => current.slice(0, -1));
      setMismatch(false);
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    setMismatch(false);
    if (next.length < PIN_LENGTH) return;
    timer.current = setTimeout(() => {
      if (!first) {
        setFirst(next);
        setPin('');
      } else if (first === next) {
        onSet();
      } else {
        setPin('');
        setFirst(null);
        setMismatch(true);
      }
    }, PIN_PAUSE_MS);
  }

  const message = mismatch ? 'passcodes didn’t match — try again' : first ? 'confirm your passcode' : 'create a 4-digit passcode';

  return (
    <View style={styles.passcode}>
      <Text style={[styles.message, { color: mismatch ? C.orange : 'rgba(255, 255, 255, 0.8)' }]} accessibilityLiveRegion="polite">
        {message}
      </Text>
      <View style={styles.dots} accessible accessibilityLabel={`${pin.length} of ${PIN_LENGTH} digits`}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.keypad}>
        {KEYS.map((key, i) =>
          key ? (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={key === '⌫' ? 'delete' : key}
              onPress={() => press(key)}
              style={({ pressed }) => [styles.key, key === '⌫' && styles.keyClear, pressed && styles.keyPressed]}>
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ) : (
            <View key={i} style={[styles.key, styles.keyClear]} />
          )
        )}
      </View>
    </View>
  );
}

/** Explains Face ID lock and turns it on or off (UI only for now). */
export function FaceIdPage({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <View style={S.stack}>
      <View style={styles.faceHero}>
        <View style={[styles.corner, styles.cornerTop]} />
        <View style={[styles.corner, styles.cornerBottom]} />
        <View style={styles.faceCircle}>
          <FaceIdIcon size={78} strokeWidth={1.6} color={on ? C.lime : C.text} />
        </View>
      </View>
      <View style={S.intro}>
        <Text style={S.heading}>{on ? 'Face ID is on' : 'unlock with a glance'}</Text>
        <Text style={[S.body, styles.faceBody]}>
          your journal stays private. afterdream will ask for Face ID each time you open the app. your face data never leaves your phone.
        </Text>
      </View>
      <PillButton title={on ? 'turn off Face ID' : 'enable Face ID'} color={on ? C.light : C.lime} onPress={onToggle} style={styles.faceButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  passcode: { alignItems: 'center', gap: 30, paddingVertical: 10, paddingHorizontal: 22 },
  message: { fontFamily: F.regular, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 18 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.text },
  dotFilled: { backgroundColor: C.text },
  keypad: { width: 76 * 3 + 28 * 2, flexDirection: 'row', flexWrap: 'wrap', columnGap: 28, rowGap: 16, marginTop: 10 },
  key: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.button, alignItems: 'center', justifyContent: 'center' },
  keyClear: { backgroundColor: 'transparent' },
  keyPressed: { backgroundColor: C.borderSoft },
  keyText: { fontFamily: F.medium, fontSize: 30, lineHeight: 36, color: C.text },
  faceHero: { height: 340, borderRadius: 32, overflow: 'hidden', backgroundColor: C.light, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 80, height: 80, backgroundColor: '#1E1E1E' },
  cornerTop: { left: 0, top: 0, borderBottomRightRadius: 80 },
  cornerBottom: { right: 0, bottom: 0, borderTopLeftRadius: 80 },
  faceCircle: { width: 170, height: 170, borderRadius: 85, backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center' },
  faceBody: { color: 'rgba(255, 255, 255, 0.75)' },
  faceButton: { marginTop: 18 },
});
