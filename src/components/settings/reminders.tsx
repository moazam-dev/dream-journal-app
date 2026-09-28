import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { REMINDER_TIMES, WEEK_LETTERS } from '@/components/settings/content';
import { Card, Chip, Label, settingsStyles as S, Toggle, ToggleCard } from '@/components/settings/parts';
import { BrandFonts as F, SettingsColors as C } from '@/constants/theme';

const GHOST = require('@/assets/images/ghost-body.png');

export type ReminderSettings = { on: boolean; time: string; days: boolean[]; bedtime: boolean };

type RemindersPageProps = { value: ReminderSettings; onChange: (next: ReminderSettings) => void };

/** Morning reminder (time and days), the bedtime nudge, and how the notification will look. */
export function RemindersPage({ value, onChange }: RemindersPageProps) {
  const { on, time, days, bedtime } = value;
  const set = (patch: Partial<ReminderSettings>) => onChange({ ...value, ...patch });

  return (
    <View style={S.stack}>
      <View style={styles.hero}>
        <View style={styles.heroCorner} />
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>morning reminder</Text>
          <Text style={styles.heroNote}>dreams fade within minutes — a nudge helps you catch them</Text>
        </View>
        <View style={styles.heroRow}>
          <Text style={styles.heroState}>{on ? `on · ${time}` : 'off'}</Text>
          <Toggle on={on} onPress={() => set({ on: !on })} label="morning reminder" />
        </View>
      </View>

      <Card style={[styles.picker, { opacity: on ? 1 : 0.4 }]}>
        <Label>time</Label>
        <View style={styles.times}>
          {REMINDER_TIMES.map((option) => (
            <Chip key={option} title={option} selected={time === option} onPress={() => set({ time: option })} />
          ))}
        </View>
        <Label style={styles.daysLabel}>days</Label>
        <View style={styles.days}>
          {WEEK_LETTERS.map((letter, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityState={{ selected: days[i] }}
              onPress={() => set({ days: days.map((day, j) => (j === i ? !day : day)) })}
              style={[styles.day, { backgroundColor: days[i] ? C.text : C.chip }]}>
              <Text style={[styles.dayText, { color: days[i] ? C.ink : C.text }]}>{letter}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <ToggleCard title="bedtime nudge" note="set an intention before sleep · 10:30pm" on={bedtime} onPress={() => set({ bedtime: !bedtime })} />

      <Text style={styles.previewLabel}>preview</Text>
      <View style={styles.notice}>
        <View style={styles.noticeIcon}>
          <Image source={GHOST} style={styles.noticeGhost} contentFit="contain" tintColor={C.ink} />
        </View>
        <View style={styles.noticeBody}>
          <View style={styles.noticeTop}>
            <Text style={styles.noticeApp}>afterdream</Text>
            <Text style={styles.noticeTime}>{time}</Text>
          </View>
          <Text style={styles.noticeText}>good morning — what did you dream about?</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 32, overflow: 'hidden', backgroundColor: C.violet, padding: 22, gap: 16 },
  heroCorner: { position: 'absolute', right: 0, top: 0, width: 90, height: 90, borderBottomLeftRadius: 90, backgroundColor: C.lilac },
  heroText: { gap: 6, maxWidth: 240 },
  heroTitle: { fontFamily: F.medium, fontSize: 24, lineHeight: 27, letterSpacing: -0.6, color: C.text },
  heroNote: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: 'rgba(255, 255, 255, 0.8)' },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroState: { fontFamily: F.medium, fontSize: 16, lineHeight: 20, color: C.text },
  picker: { gap: 14 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  daysLabel: { marginTop: 6 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: F.semibold, fontSize: 14, lineHeight: 17 },
  previewLabel: { fontFamily: F.medium, fontSize: 13, lineHeight: 16, color: 'rgba(255, 255, 255, 0.5)', paddingTop: 14, paddingHorizontal: 14, paddingBottom: 4 },
  notice: { borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  noticeIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  noticeGhost: { width: 24, height: 24 },
  noticeBody: { flex: 1, gap: 4 },
  noticeTop: { flexDirection: 'row', justifyContent: 'space-between' },
  noticeApp: { fontFamily: F.semibold, fontSize: 14, lineHeight: 17, color: C.text },
  noticeTime: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: C.muted },
  noticeText: { fontFamily: F.regular, fontSize: 14, lineHeight: 18, color: 'rgba(255, 255, 255, 0.85)' },
});
