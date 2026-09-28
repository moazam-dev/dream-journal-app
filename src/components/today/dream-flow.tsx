import { Image } from 'expo-image';
import { useEffect, useEffectEvent, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AUDIO_BAR_HEIGHT, AudioBar } from '@/components/audio-bar';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { analyzeDream, composeDreamFromFragments, createDream, updateDreamDetails } from '@/services/dreams';
import type { Dream } from '@/types/dream';
import { getErrorMessage } from '@/utils/errors';
import {
  addTag,
  fragmentTurns,
  LOADING_LINES,
  MOOD_OPTIONS,
  resultDate,
  sameTags,
  SOURCE_LABELS,
  type DreamSource,
  type Fragment,
  type Turn,
} from '@/utils/today';

import { DARK, overline } from './card-overlay';
import { animate, ease, loop, ORB, rise, RING } from './motion';

/** The loading orb stays at least this long, so it reads as a moment rather than a flicker. */
const MIN_LOADING_MS = 1800;
const LINE_MS = 900;
const LOGO = require('@/assets/images/afterdream-logo.png');

export type DreamTab = 'transcript' | 'analysis';

type DreamFlowProps = {
  source: DreamSource;
  /** What they wrote or said. */
  text?: string;
  /** Or, from the talk card: the questions and answers, pieced into a dream first. */
  fragments?: Fragment[];
  tab: DreamTab;
  reduceMotion: boolean;
  bottomInset: number;
  /** Called once the reading is ready (the tabs appear then). */
  onReady: () => void;
  /** Opens the saved dream on the visualize screen, which paints its picture. */
  onVisualize: (dreamId: string) => void;
  onDone: (saved: boolean) => void;
  onToast: (text: string) => void;
};

type Stage = { name: 'loading' } | { name: 'failed'; message: string } | { name: 'done' };

/**
 * What happens after a dream is written, said or talked through: it is saved to entries
 * straight away, read by the AI (a glowing orb while that happens), then shown in two tabs:
 * the transcript of how it was told, and the analysis, where they can add their own details.
 * A white audio bar stays at the bottom of both, playing the reading aloud.
 */
export function DreamFlow({ source, text, fragments, tab, reduceMotion, bottomInset, onReady, onVisualize, onDone, onToast }: DreamFlowProps) {
  const [dream, setDream] = useState<Dream | null>(null);
  const [stage, setStage] = useState<Stage>({ name: 'loading' });
  const [attempt, setAttempt] = useState(0);
  // The saved dream, kept outside state so a retry reuses it instead of saving it twice.
  const saved = useRef<Dream | null>(null);
  // Not a reason to restart the reading when the parent passes a new callback.
  const markReady = useEffectEvent(onReady);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    async function run() {
      try {
        if (!saved.current) {
          const dreamText = text ?? (await composeDreamFromFragments(fragments ?? []));
          saved.current = await createDream(dreamText);
        }
        const analyzed = await analyzeDream(saved.current.id);
        const wait = MIN_LOADING_MS - (Date.now() - started);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        if (cancelled) return;
        setDream(analyzed);
        setStage({ name: 'done' });
        markReady();
      } catch (error) {
        if (cancelled) return;
        const message = saved.current
          ? `your dream is saved in entries, but the reflection didn’t come through. ${getErrorMessage(error)}`
          : getErrorMessage(error);
        setStage({ name: 'failed', message });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [text, fragments, attempt]);

  if (stage.name === 'loading') return <Loading reduceMotion={reduceMotion} piecing={!!fragments} />;

  if (stage.name === 'failed' || !dream) {
    const message = stage.name === 'failed' ? stage.message : '';
    return (
      <View style={[styles.center, { paddingBottom: bottomInset + 40 }]}>
        <Text style={styles.failTitle}>the dream slipped for a second.</Text>
        <Text style={styles.failText}>{message}</Text>
        <View style={styles.failActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setStage({ name: 'loading' });
              setAttempt((n) => n + 1);
            }}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>try again</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onDone(!!saved.current)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>back to today</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const footerBottom = Math.max(bottomInset, 16);

  return (
    <View style={styles.flow}>
      <ScrollView
        key={tab}
        contentContainerStyle={[styles.page, { paddingBottom: footerBottom + AUDIO_BAR_HEIGHT + 36 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        {tab === 'analysis' ? (
          <Analysis dream={dream} setDream={setDream} reduceMotion={reduceMotion} onToast={onToast} />
        ) : (
          <Transcript source={source} fragments={fragments} dream={dream} reduceMotion={reduceMotion} />
        )}
        <Animated.View style={[styles.actions, rise(reduceMotion, 480)]}>
          <Pressable accessibilityRole="button" onPress={() => onVisualize(dream.id)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>see it visualized</Text>
            <Text style={styles.primaryText}>→</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onDone(true)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>back to today</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
      <Animated.View pointerEvents="box-none" style={[styles.footer, { paddingBottom: footerBottom }, rise(reduceMotion, 320)]}>
        <AudioBar dream={dream} setDream={setDream} reduceMotion={reduceMotion} />
      </Animated.View>
    </View>
  );
}

type DreamTabsProps = {
  tab: DreamTab;
  onChange: (tab: DreamTab) => void;
};

/** The two buttons at the top of the reading: transcript and analysis. */
export function DreamTabs({ tab, onChange }: DreamTabsProps) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {(['transcript', 'analysis'] as const).map((name) => {
        const selected = tab === name;
        return (
          <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(name)} style={[styles.tab, selected && styles.tabOn]}>
            <Text style={[styles.tabText, selected && styles.tabTextOn]}>{name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type AnalysisProps = {
  dream: Dream;
  setDream: Dispatch<SetStateAction<Dream | null>>;
  reduceMotion: boolean;
  onToast: (text: string) => void;
};

/** The reading itself, and a place to add what they know about the dream. */
function Analysis({ dream, setDream, reduceMotion, onToast }: AnalysisProps) {
  return (
    <>
      <Animated.View style={[styles.head, rise(reduceMotion, 0)]}>
        <Text style={styles.date}>{resultDate(new Date(dream.created_at))}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {dream.title ?? 'your dream'}
        </Text>
        <View style={styles.chips}>
          {dream.mood && <Text style={[styles.tag, styles.moodTag]}>{dream.mood.toLowerCase()}</Text>}
          {(dream.themes ?? []).map((theme) => (
            <Text key={theme} style={[styles.tag, styles.themeTag]}>
              {theme.toLowerCase()}
            </Text>
          ))}
        </View>
      </Animated.View>

      {(dream.summary || dream.reflection) && (
        <Animated.View style={[styles.panel, styles.reading, rise(reduceMotion, 160)]}>
          {dream.summary && (
            <View style={styles.section}>
              <Text style={overline}>in short</Text>
              <Text style={styles.paragraph}>{dream.summary}</Text>
            </View>
          )}
          {dream.summary && dream.reflection && <View style={styles.rule} />}
          {dream.reflection && (
            <View style={styles.section}>
              <Text style={overline}>what it might mean</Text>
              <Text style={styles.paragraph}>{dream.reflection}</Text>
            </View>
          )}
        </Animated.View>
      )}

      <Animated.View style={rise(reduceMotion, 240)}>
        <Details dream={dream} setDream={setDream} reduceMotion={reduceMotion} onToast={onToast} />
      </Animated.View>
    </>
  );
}

/** "your side of it": their own mood, who was there, and where it happened. */
function Details({ dream, setDream, reduceMotion, onToast }: AnalysisProps) {
  const [mood, setMood] = useState<string | null>(dream.user_mood ?? null);
  const [people, setPeople] = useState<string[]>(dream.people ?? []);
  const [places, setPlaces] = useState<string[]>(dream.places ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = mood !== (dream.user_mood ?? null) || !sameTags(people, dream.people ?? []) || !sameTags(places, dream.places ?? []);
  const hasAny = !!dream.user_mood || (dream.people ?? []).length > 0 || (dream.places ?? []).length > 0;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      setDream(await updateDreamDetails(dream.id, { user_mood: mood, people, places }));
      onToast('dream updated ✦');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  let buttonText = 'update dream';
  if (saving) buttonText = 'updating…';
  else if (!changed) buttonText = hasAny ? 'dream updated ✓' : 'add a detail to update';
  const off = !changed || saving;

  return (
    <View style={[styles.panel, styles.details]}>
      <View style={styles.detailsHead}>
        <Text style={overline}>your side of it</Text>
        <Text style={styles.detailsNote}>you know this dream best. add what the reading missed.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>how did it feel?</Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {MOOD_OPTIONS.map((option) => {
            const picked = mood === option;
            return (
              <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: picked }} onPress={() => setMood(picked ? null : option)}>
                <Animated.View style={[styles.choice, picked && styles.choiceOn, ease(reduceMotion, ['backgroundColor', 'borderColor'], 200)]}>
                  <Text style={[styles.choiceText, picked && styles.choiceTextOn]}>{option}</Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TagField label="who was there?" placeholder="add a person" tags={people} onChange={setPeople} />
      <TagField label="where were you?" placeholder="add a place" tags={places} onChange={setPlaces} />

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: off }}
        disabled={off}
        onPress={save}
        style={({ pressed }) => [styles.update, off && styles.updateOff, pressed && styles.pressed]}>
        <Text style={[styles.updateText, off && styles.updateTextOff]}>{buttonText}</Text>
      </Pressable>
    </View>
  );
}

type TagFieldProps = {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
};

/** A list of names as chips (tap one to remove it) with a box to type another. */
function TagField({ label, placeholder, tags, onChange }: TagFieldProps) {
  const [draft, setDraft] = useState('');
  const canAdd = draft.trim().length > 0;

  function add() {
    onChange(addTag(tags, draft));
    setDraft('');
  }

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {tags.length > 0 && (
        <View style={styles.chips}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${tag}`}
              onPress={() => onChange(tags.filter((item) => item !== tag))}
              style={styles.person}>
              <Text style={styles.personText}>{tag}</Text>
              <Text style={styles.personX}>×</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.35)"
          selectionColor={BrandColors.lime}
          cursorColor={BrandColors.lime}
          maxLength={40}
          style={styles.addInput}
          accessibilityLabel={placeholder}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={placeholder}
          accessibilityState={{ disabled: !canAdd }}
          disabled={!canAdd}
          onPress={add}
          style={[styles.addButton, !canAdd && styles.addButtonOff]}>
          <Text style={[styles.addGlyph, !canAdd && styles.addGlyphOff]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

type TranscriptProps = {
  source: DreamSource;
  fragments?: Fragment[];
  dream: Dream;
  reduceMotion: boolean;
};

/**
 * How the dream was told, as a chat: their words (or Afterdream's questions and their answers,
 * then the dream pieced together from them), followed by the reading.
 */
function Transcript({ source, fragments, dream, reduceMotion }: TranscriptProps) {
  const turns: Turn[] = fragments
    ? [...fragmentTurns(fragments), { from: 'afterdream', text: `here’s how i pieced it together: “${dream.dream_text}”` }]
    : [{ from: 'you', text: dream.dream_text }];
  const replies: Turn[] = [];
  if (dream.summary) replies.push({ from: 'afterdream', text: `here’s what i picked up: ${dream.summary}` });
  if (dream.reflection) replies.push({ from: 'afterdream', text: dream.reflection });
  const lines = [...turns, ...replies];

  return (
    <View style={styles.chat}>
      <Animated.View style={[styles.chatHead, rise(reduceMotion, 0)]}>
        <Text style={overline}>{SOURCE_LABELS[source]}</Text>
        <Text style={styles.chatDate}>{resultDate(new Date(dream.created_at))}</Text>
      </Animated.View>
      {lines.map((turn, i) =>
        turn.from === 'you' ? (
          <Animated.View key={i} style={[styles.youRow, rise(reduceMotion, 60 + i * 60, 450)]}>
            <Text style={styles.youBubble}>{turn.text}</Text>
          </Animated.View>
        ) : (
          <Animated.View key={i} style={[styles.aiRow, rise(reduceMotion, 60 + i * 60, 450)]}>
            <View style={styles.avatar}>
              <Image source={LOGO} style={styles.avatarLogo} contentFit="contain" tintColor={BrandColors.ink} />
            </View>
            <Text style={styles.aiBubble}>{turn.text}</Text>
          </Animated.View>
        )
      )}
    </View>
  );
}

/** The glowing orb, two rings rippling out, and a line that changes every moment. */
function Loading({ reduceMotion, piecing }: { reduceMotion: boolean; piecing: boolean }) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setLine((n) => (n + 1) % LOADING_LINES.length), LINE_MS);
    return () => clearInterval(timer);
  }, []);

  const ring = (delay: number) =>
    animate(reduceMotion, { animationName: RING, animationDuration: 2000, animationDelay: delay, animationTimingFunction: 'ease-out', animationIterationCount: 'infinite' });

  return (
    <View style={styles.loading}>
      <View style={styles.orbWrap}>
        {!reduceMotion && <Animated.View style={[styles.ring, ring(0)]} />}
        {!reduceMotion && <Animated.View style={[styles.ring, ring(1000)]} />}
        <Animated.View style={[styles.orb, loop(reduceMotion, ORB, 2400)]} />
      </View>
      <Text style={styles.loadingText} accessibilityLiveRegion="polite">
        {/* While the talk answers are being joined, say so first. */}
        {piecing && line === 0 ? 'piecing your fragments together…' : LOADING_LINES[line]}
      </Text>
    </View>
  );
}

const SURFACE = 'rgba(255, 255, 255, 0.06)';
const LINE = 'rgba(255, 255, 255, 0.09)';

const styles = StyleSheet.create({
  flow: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 28,
    paddingHorizontal: 18,
    experimental_backgroundImage: `linear-gradient(180deg, rgba(11, 11, 11, 0), ${DARK} 45%)`,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 34,
    // Centred on the whole phone, not the space under the close button.
    marginTop: -58,
  },
  orbWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  orb: {
    width: 70,
    height: 70,
    borderRadius: 35,
    experimental_backgroundImage: `radial-gradient(circle at 35% 30%, #fff, ${BrandColors.lime} 60%, #b9c46a)`,
    boxShadow: '0 0 60px 10px rgba(226, 235, 152, 0.35)',
  },
  loadingText: {
    paddingHorizontal: 40,
    textAlign: 'center',
    fontFamily: BrandFonts.medium,
    fontSize: 18,
    lineHeight: 23,
    color: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  failTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1.2,
    color: '#fff',
  },
  failText: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  failActions: {
    marginTop: 18,
    gap: 10,
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
  },
  tab: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabTextOn: {
    color: '#111',
  },
  page: {
    paddingTop: 12,
    paddingHorizontal: 18,
    gap: 12,
  },
  head: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 12,
  },
  date: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: BrandColors.lime,
  },
  title: {
    fontFamily: BrandFonts.medium,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.5,
    color: '#fff',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    overflow: 'hidden',
    fontSize: 13,
    lineHeight: 28,
  },
  moodTag: {
    backgroundColor: BrandColors.lime,
    fontFamily: BrandFonts.semibold,
    color: '#111',
  },
  themeTag: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    fontFamily: BrandFonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  panel: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
  },
  reading: {
    gap: 18,
  },
  section: {
    gap: 10,
  },
  rule: {
    height: 1,
    backgroundColor: LINE,
  },
  paragraph: {
    fontFamily: BrandFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  details: {
    gap: 20,
  },
  detailsHead: {
    gap: 8,
  },
  detailsNote: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  field: {
    gap: 10,
  },
  fieldLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 16,
    lineHeight: 20,
    color: '#fff',
  },
  choice: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  choiceOn: {
    backgroundColor: BrandColors.lime,
    borderColor: BrandColors.lime,
  },
  choiceText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
  },
  choiceTextOn: {
    color: '#111',
  },
  person: {
    height: 36,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  personText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
  },
  personX: {
    fontFamily: BrandFonts.regular,
    fontSize: 16,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: LINE,
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    color: '#fff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  addGlyph: {
    fontFamily: BrandFonts.medium,
    fontSize: 22,
    lineHeight: 26,
    color: '#111',
  },
  addGlyphOff: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  error: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 19,
    color: '#F2A8A0',
  },
  update: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  updateText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 15,
    lineHeight: 19,
    color: '#111',
  },
  updateTextOff: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  chat: {
    gap: 12,
  },
  chatHead: {
    paddingHorizontal: 4,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatDate: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  youRow: {
    alignItems: 'flex-end',
  },
  youBubble: {
    maxWidth: '85%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 20,
    backgroundColor: BrandColors.lime,
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: '#111',
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLogo: {
    width: 15,
    height: 15,
  },
  aiBubble: {
    flexShrink: 1,
    maxWidth: '85%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
  primary: {
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: '#111',
  },
  secondary: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 19,
    color: '#fff',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
