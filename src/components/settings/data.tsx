import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EXPORT_COUNTS, EXPORT_FORMATS, EXPORT_RANGES, type ExportFormat, type ExportRange } from '@/components/settings/content';
import { Card, Chip, Label, PillButton, settingsStyles as S, ToggleCard } from '@/components/settings/parts';
import { BrandFonts as F, SettingsColors as C } from '@/constants/theme';

/** Pick a format and range, then a pretend "ready" screen. UI only: nothing is written. */
export function ExportPage({ onSave }: { onSave: () => void }) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [range, setRange] = useState<ExportRange>('all');
  const [insights, setInsights] = useState(true);
  const [done, setDone] = useState(false);
  const count = EXPORT_COUNTS[range];

  if (done) {
    return (
      <View style={S.stack}>
        <View style={styles.ready}>
          <View style={styles.readyShapes}>
            <View style={styles.readyCircle} />
            <View style={[styles.readyCircle, styles.readyDrop]} />
          </View>
          <Text style={styles.readyTitle}>your export is ready</Text>
          <Text style={styles.readyNote}>
            afterdream-journal.{format} · {count} entries
          </Text>
        </View>
        <PillButton title="save to files" color={C.light} onPress={onSave} />
        <PillButton title="export again" kind="outline" onPress={() => setDone(false)} />
      </View>
    );
  }

  return (
    <View style={S.stack}>
      <Card style={styles.options}>
        <Label>format</Label>
        <View style={styles.formats}>
          {EXPORT_FORMATS.map((option) => {
            const selected = format === option.key;
            const color = selected ? C.ink : C.text;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFormat(option.key)}
                style={[styles.format, { backgroundColor: selected ? C.lime : C.chip }]}>
                <Text style={[styles.formatTitle, { color }]}>{option.title}</Text>
                <Text style={[styles.formatNote, { color }]}>{option.note}</Text>
              </Pressable>
            );
          })}
        </View>
        <Label style={styles.rangeLabel}>range</Label>
        <View style={styles.ranges}>
          {EXPORT_RANGES.map((option) => (
            <Chip
              key={option.key}
              title={option.title}
              selected={range === option.key}
              selectedColor={C.text}
              onPress={() => setRange(option.key)}
              style={styles.range}
            />
          ))}
        </View>
      </Card>
      <ToggleCard title="include insights" note="add afterdream's reading to each entry" on={insights} onPress={() => setInsights(!insights)} />
      <PillButton title={`export ${count} entries`} onPress={() => setDone(true)} />
    </View>
  );
}

/** Warning, a way to export first, and a "type delete" confirmation. UI only: nothing is deleted. */
export function DeleteAccountPage({ onExport, onDelete }: { onExport: () => void; onDelete: () => void }) {
  const [text, setText] = useState('');
  const confirmed = text.trim().toLowerCase() === 'delete';

  return (
    <View style={S.stack}>
      <View style={styles.warning}>
        <View style={styles.warningShapes}>
          <View style={styles.warningDot} />
          <View style={styles.warningRing} />
        </View>
        <Text style={[S.heading, styles.onOrange]}>this can’t be undone</Text>
        <Text style={[S.body, styles.onOrange]}>
          we’ll permanently erase your account, all 42 dream entries, visualizations and patterns. consider exporting first.
        </Text>
      </View>
      <PillButton title="export my entries first" kind="outline" onPress={onExport} style={styles.exportFirst} />
      <Card style={styles.confirm}>
        <Text style={styles.confirmText}>
          type <Text style={styles.confirmWord}>delete</Text> to confirm
        </Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="delete"
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
      </Card>
      <PillButton
        title="delete my account"
        color={confirmed ? C.orange : C.chip}
        textColor={confirmed ? C.ink : 'rgba(255, 255, 255, 0.4)'}
        disabled={!confirmed}
        onPress={onDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: 14 },
  formats: { flexDirection: 'row', gap: 6 },
  format: { flex: 1, height: 84, borderRadius: 22, padding: 14, justifyContent: 'space-between' },
  formatTitle: { fontFamily: F.semibold, fontSize: 18, lineHeight: 21 },
  formatNote: { fontFamily: F.regular, fontSize: 12, lineHeight: 15 },
  rangeLabel: { marginTop: 6 },
  ranges: { flexDirection: 'row', gap: 6 },
  range: { flex: 1, paddingHorizontal: 0 },
  ready: { height: 280, borderRadius: 32, overflow: 'hidden', backgroundColor: C.forest, justifyContent: 'flex-end', padding: 24 },
  readyShapes: { position: 'absolute', left: 24, top: 24, flexDirection: 'row', gap: 8 },
  readyCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.lime },
  readyDrop: { borderBottomRightRadius: 0 },
  readyTitle: { fontFamily: F.medium, fontSize: 30, lineHeight: 32, letterSpacing: -1, color: C.text },
  readyNote: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: 'rgba(255, 255, 255, 0.8)', marginTop: 8 },
  warning: { borderRadius: 32, overflow: 'hidden', backgroundColor: C.orange, padding: 24, gap: 10 },
  warningShapes: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  warningDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.ink },
  warningRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: C.ink },
  onOrange: { color: C.ink },
  exportFirst: { marginTop: 4 },
  confirm: { gap: 12, marginTop: 8 },
  confirmText: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: 'rgba(255, 255, 255, 0.8)' },
  confirmWord: { fontFamily: F.semibold, color: C.text },
  input: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.input,
    color: C.text,
    paddingHorizontal: 16,
    fontFamily: F.medium,
    fontSize: 17,
  },
});
