import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FEEDBACK_MOODS, FEEDBACK_TAGS } from '@/components/settings/content';
import { Card, Label, PillButton, settingsStyles as S, shapeStyle } from '@/components/settings/parts';
import { BrandFonts as F, SettingsColors as C } from '@/constants/theme';

/** A mood, some tags and a note, then a thank-you card. UI only: nothing is sent. */
export function FeedbackPage() {
  const [mood, setMood] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <View style={S.stack}>
        <View style={styles.thanks}>
          <View style={styles.drips}>
            <View style={styles.drip} />
            <View style={[styles.drip, styles.dripShort]} />
            <View style={styles.drip} />
          </View>
          <Text style={styles.thanksTitle}>thank you</Text>
          <Text style={[S.body, styles.thanksNote]}>we read every note. yours helps shape what afterdream becomes.</Text>
        </View>
      </View>
    );
  }

  const toggleTag = (tag: string) => setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));

  return (
    <View style={S.stack}>
      <Card style={styles.moodCard}>
        <Text style={styles.question}>how’s afterdream feeling?</Text>
        <View style={styles.moods}>
          {FEEDBACK_MOODS.map((option, i) => {
            const selected = mood === i;
            return (
              <Pressable
                key={option.title}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setMood(i)}
                style={[styles.mood, { backgroundColor: selected ? C.text : C.chip }]}>
                <View style={[styles.moodShape, shapeStyle(option.shape, 24), { backgroundColor: option.color }]} />
                <Text style={[styles.moodText, { color: selected ? C.ink : C.text }]}>{option.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.moreCard}>
        <Label>tell us more</Label>
        <View style={styles.tags}>
          {FEEDBACK_TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => toggleTag(tag)}
                style={[styles.tag, { backgroundColor: on ? C.lilac : 'transparent', borderColor: on ? C.lilac : C.borderSoft }]}>
                <Text style={[styles.tagText, { color: on ? C.ink : C.text }]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="what would make afterdream better?"
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          multiline
          textAlignVertical="top"
          style={styles.note}
        />
      </Card>

      <PillButton title="send feedback" onPress={() => setSent(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  moodCard: { gap: 14 },
  question: { fontFamily: F.medium, fontSize: 20, lineHeight: 23, color: C.text },
  moods: { flexDirection: 'row', gap: 6 },
  mood: { flex: 1, height: 76, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  moodShape: { width: 24, height: 24 },
  moodText: { fontFamily: F.medium, fontSize: 13, lineHeight: 16 },
  moreCard: { gap: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, justifyContent: 'center' },
  tagText: { fontFamily: F.medium, fontSize: 14, lineHeight: 17 },
  note: {
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.input,
    color: C.text,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: F.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  thanks: { height: 360, borderRadius: 32, overflow: 'hidden', backgroundColor: C.lilac, justifyContent: 'flex-end', padding: 24 },
  drips: { position: 'absolute', left: 24, right: 24, top: 0, flexDirection: 'row', gap: 10 },
  drip: { flex: 1, height: 90, borderBottomLeftRadius: 45, borderBottomRightRadius: 45, backgroundColor: C.violet },
  dripShort: { height: 60 },
  thanksTitle: { fontFamily: F.medium, fontSize: 32, lineHeight: 34, letterSpacing: -1, color: C.ink },
  thanksNote: { color: C.ink, marginTop: 8 },
});
