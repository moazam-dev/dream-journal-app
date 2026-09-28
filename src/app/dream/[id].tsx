import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { DreamAnalysis } from '@/components/dream/dream-analysis';
import { animate, EASE_OUT, FADE, TOAST } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { useDream } from '@/hooks/use-dreams';
import { isVoiceAgentAvailable } from '@/lib/deepgram/native-audio';
import { analyzeDream } from '@/services/dreams';
import { getErrorMessage } from '@/utils/errors';
import { analysisState, colorFill, dreamColor, dreamHeadline, toldAt } from '@/utils/entries';
import { dreamMood } from '@/utils/visualize';

type DreamTab = 'transcript' | 'analysis';

const TOAST_MS = 2600;

/**
 * A dream's page ("/dream/<id>"), opened from its row on Entries: the dream in its card
 * colour, then two tabs — the transcript as it was told, and afterdream's analysis.
 * "visualize" at the bottom shows its picture full screen, painting it if needed (and
 * reading it first, since the picture is painted from the reading).
 */
export default function DreamScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: DreamTab }>();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { dream, loading, error, reload, setDream } = useDream(id);

  const [tabShown, setTab] = useState<DreamTab>(tab === 'analysis' ? 'analysis' : 'transcript');
  const [switchWidth, setSwitchWidth] = useState(0);
  const [reading, setReading] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const pillWidth = Math.max(0, (switchWidth - 8) / 2);
  const footerBottom = Math.max(insets.bottom, 16);

  function showToast(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((current) => ({ id: (current?.id ?? 0) + 1, text }));
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/entries');
  }

  /** Has afterdream read the dream. Returns whether the reading is there now. */
  async function read(): Promise<boolean> {
    if (reading) return false;
    setReading(true);
    try {
      setDream(await analyzeDream(id));
      return true;
    } catch (err) {
      console.warn('Could not read the dream', getErrorMessage(err));
      // The server marks the dream as failed too; show the retry.
      setDream((current) => (current ? { ...current, analysis_status: 'failed' } : current));
      showToast('couldn’t read it — try again');
      return false;
    } finally {
      setReading(false);
    }
  }

  async function visualize() {
    if (!dream || reading) return;
    if (dream.analysis_status !== 'completed' && !(await read())) return;
    router.push({ pathname: '/painting/[id]', params: { id: dream.id, from: 'dream' } });
  }

  if (!dream) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <TopBar onBack={goBack} />
        <View style={styles.status}>
          {loading ? (
            <Animated.Text style={[styles.statusText, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 300 })]}>
              finding your dream…
            </Animated.Text>
          ) : error ? (
            <>
              <Text style={styles.statusTitle}>couldn’t reach this dream.</Text>
              <Text style={styles.statusText}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={reload} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]}>
                <Text style={styles.statusButtonText}>try again</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.statusTitle}>this dream is gone.</Text>
              <Text style={styles.statusText}>it may have been deleted.</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  const state = analysisState(dream, reading);
  const mood = dreamMood(dream);
  const people = dream.people ?? [];
  const places = dream.places ?? [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <TopBar
        onBack={goBack}
        onTalk={isVoiceAgentAvailable() ? () => router.push({ pathname: '/voice', params: { dreamId: dream.id } }) : undefined}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: footerBottom + 56 + 40 }]}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, colorFill(dreamColor(dream))]}>
          <View style={styles.heroTop}>
            <Text style={styles.heroDate}>{toldAt(dream)}</Text>
            {mood && (
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{mood}</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroTitle} accessibilityRole="header">
            {dreamHeadline(dream)}
          </Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switch} accessibilityRole="tablist" onLayout={(event) => setSwitchWidth(event.nativeEvent.layout.width)}>
            {/* Placed once the switch is measured, so it starts under the right tab (without sliding there). */}
            {pillWidth > 0 && (
              <Animated.View
                style={[
                  styles.switchPill,
                  { width: pillWidth, transform: [{ translateX: tabShown === 'analysis' ? pillWidth : 0 }] },
                  !reduceMotion && { transitionProperty: 'transform', transitionDuration: 400, transitionTimingFunction: EASE_OUT },
                ]}
              />
            )}
            <SwitchButton label="transcript" selected={tabShown === 'transcript'} reduceMotion={reduceMotion} onPress={() => setTab('transcript')} />
            <SwitchButton label="analysis" selected={tabShown === 'analysis'} reduceMotion={reduceMotion} onPress={() => setTab('analysis')} />
          </View>
        </View>

        <Animated.View key={tabShown} style={[styles.body, animate(reduceMotion, { animationName: FADE, animationDuration: 300 })]}>
          {tabShown === 'transcript' ? (
            <View style={styles.transcript}>
              <Text style={styles.transcriptText} selectable>
                {dream.dream_text.trim()}
              </Text>
              {people.length > 0 && <Tags label="who was there" tags={people} />}
              {places.length > 0 && <Tags label="where it was" tags={places} />}
            </View>
          ) : (
            <DreamAnalysis dream={dream} state={state} reduceMotion={reduceMotion} onRead={read} />
          )}
        </Animated.View>
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.footer, { paddingBottom: footerBottom }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: reading, disabled: reading }}
          accessibilityHint="Shows the dream as a picture, full screen."
          disabled={reading}
          onPress={visualize}
          style={({ pressed }) => [styles.visualize, pressed && styles.visualizePressed, reading && styles.visualizeBusy]}>
          <View style={styles.moon}>
            <View style={styles.moonHalf} />
          </View>
          <Text style={styles.visualizeText}>{reading ? 'reading it first…' : 'visualize'}</Text>
        </Pressable>
      </View>

      {toast && (
        <View pointerEvents="none" style={[styles.toastRow, { bottom: footerBottom + 56 + 16 }]}>
          <Animated.Text
            key={toast.id}
            accessibilityLiveRegion="polite"
            style={[styles.toast, animate(reduceMotion, { animationName: TOAST, animationDuration: TOAST_MS, animationTimingFunction: 'ease' })]}>
            {toast.text}
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

function TopBar({ onBack, onTalk }: { onBack: () => void; onTalk?: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={onBack} style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
        <Svg width={9} height={16} viewBox="0 0 9 16">
          <Path d="M7.5 1.5L1.5 8l6 6.5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      </Pressable>
      {/* Needs the native development build; hidden in Expo Go. */}
      {onTalk && (
        <Pressable accessibilityRole="button" onPress={onTalk} style={({ pressed }) => [styles.talk, pressed && styles.pressed]}>
          <Text style={styles.talkText}>talk it through</Text>
        </Pressable>
      )}
    </View>
  );
}

function SwitchButton({ label, selected, reduceMotion, onPress }: { label: string; selected: boolean; reduceMotion: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={styles.switchButton}>
      <Animated.Text
        style={[
          styles.switchText,
          { color: selected ? '#111' : 'rgba(255,255,255,0.8)' },
          !reduceMotion && { transitionProperty: 'color', transitionDuration: 300, transitionTimingFunction: 'ease' },
        ]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function Tags({ label, tags }: { label: string; tags: string[] }) {
  return (
    <View style={styles.tags}>
      <Text style={styles.tagsLabel}>{label}</Text>
      <View style={styles.tagRow}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  talk: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  talkText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  pressed: {
    opacity: 0.8,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  hero: {
    marginHorizontal: 20,
    minHeight: 168,
    borderRadius: 28,
    padding: 20,
    justifyContent: 'space-between',
    gap: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroDate: {
    flexShrink: 1,
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: '#111',
    opacity: 0.75,
  },
  heroChip: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  heroChipText: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#fff',
  },
  heroTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1.1,
    color: '#111',
  },
  switchRow: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#000',
  },
  switch: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    padding: 4,
  },
  switchPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 21,
    backgroundColor: '#fff',
  },
  switchButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchText: {
    fontFamily: BrandFonts.medium,
    fontSize: 16,
    lineHeight: 19,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  transcript: {
    gap: 28,
  },
  transcriptText: {
    fontFamily: BrandFonts.regular,
    fontSize: 19,
    lineHeight: 29,
    letterSpacing: -0.2,
    color: 'rgba(255,255,255,0.92)',
  },
  tags: {
    gap: 10,
  },
  tagsLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.55)',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  tagText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 28,
    paddingHorizontal: 20,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0), #000 45%)',
  },
  visualize: {
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  visualizePressed: {
    transform: [{ scale: 0.97 }],
  },
  visualizeBusy: {
    opacity: 0.7,
  },
  visualizeText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
    lineHeight: 19,
    color: '#111',
  },
  // The Visualize tab's half-moon, in ink.
  moon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#111',
    overflow: 'hidden',
  },
  moonHalf: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#111',
  },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  statusTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 22,
    lineHeight: 27,
    color: '#fff',
    textAlign: 'center',
  },
  statusText: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  statusButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: BrandColors.lime,
  },
  statusButtonText: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 18,
    color: '#111',
  },
  toastRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#fff',
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
});
