import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { VoiceInput } from '@/components/voice-input';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useDreamRecorder } from '@/hooks/use-dream-recorder';
import { analyzeDream, createDream } from '@/services/dreams';
import type { Dream } from '@/types/dream';
import { getErrorMessage } from '@/utils/errors';

/** What the screen is doing: waiting for input, saving the dream, or waiting for the AI. */
type Step = 'idle' | 'saving' | 'reflecting';

const BUTTON_TITLES: Record<Step, string> = {
  idle: 'Save Dream',
  saving: 'Saving…',
  reflecting: 'Reflecting on your dream…',
};

/** Record Dream screen ("/record"). */
export default function RecordDreamScreen() {
  const [text, setText] = useState('');
  const [step, setStep] = useState<Step>('idle');

  // Speaking is an alternative to typing: the words are added to the text box,
  // where the user can still edit them before saving.
  const voice = useDreamRecorder((spokenText) => {
    setText((current) => (current.trim() ? `${current.trim()}\n\n${spokenText}` : spokenText));
  });

  const isBusy = step !== 'idle';
  const isVoiceBusy = voice.phase !== 'idle';
  const canSave = text.trim().length > 0 && !isVoiceBusy;

  async function handleSave() {
    // 1. Save the dream itself. If this fails, stay here and keep the text.
    setStep('saving');
    let dream: Dream;
    try {
      dream = await createDream(text);
    } catch (error) {
      Alert.alert('Could not save your dream', getErrorMessage(error));
      setStep('idle');
      return;
    }

    // 2. Ask for the AI reflection. If this fails the dream is still saved,
    //    and the Dream Detail screen shows a "Try again" button.
    setStep('reflecting');
    try {
      await analyzeDream(dream.id);
    } catch (error) {
      console.warn('AI reflection failed:', getErrorMessage(error));
    }

    // 3. Open the dream. `replace` so "back" returns to Home, not this form.
    router.replace({ pathname: '/dream/[id]', params: { id: dream.id, tab: 'analysis' } });
  }

  return (
    <Screen style={styles.screen}>
      {/* Don't let the user leave halfway through saving. */}
      <Stack.Screen options={{ headerBackVisible: !isBusy, gestureEnabled: !isBusy }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <Text style={styles.title}>What did you dream?</Text>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="I was flying over a city made of glass..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          autoFocus
          editable={!isBusy && !isVoiceBusy}
          textAlignVertical="top"
        />

        <VoiceInput
          phase={voice.phase}
          durationMillis={voice.durationMillis}
          error={voice.error}
          disabled={isBusy}
          onStart={voice.start}
          onStop={voice.stopAndTranscribe}
          onCancel={voice.cancel}
        />

        <AppButton
          title={BUTTON_TITLES[step]}
          onPress={handleSave}
          disabled={!canSave}
          loading={isBusy}
        />

        {step === 'reflecting' && (
          <Text style={styles.hint}>Your dream is saved. The AI reflection takes a few seconds.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
  },
  input: {
    minHeight: 240,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text,
  },
  hint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
