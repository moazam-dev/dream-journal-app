import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, VoiceColors } from '@/constants/theme';
import type { TranscriptEntry } from '@/lib/deepgram/types';

type VoiceTranscriptProps = {
  entries: TranscriptEntry[];
};

/** Live transcript of the conversation (kept on the phone only, for this session). */
export function VoiceTranscript({ entries }: VoiceTranscriptProps) {
  const scrollRef = useRef<ScrollView>(null);

  if (entries.length === 0) return <View style={styles.placeholder} />;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      // Always show the latest line.
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
      {entries.map((entry) => {
        const isUser = entry.role === 'user';
        return (
          <View key={entry.id} style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
            <Text style={styles.speaker}>{isUser ? 'You' : 'Companion'}</Text>
            <Text style={styles.text}>{entry.text}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: 2,
  },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: VoiceColors.surface,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: VoiceColors.userBubble,
  },
  speaker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: VoiceColors.textSecondary,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    color: VoiceColors.text,
  },
});
