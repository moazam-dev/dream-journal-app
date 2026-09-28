import { Image } from 'expo-image';
import { useEffect, useEffectEvent, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { animate, loop } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { useDreamImage } from '@/hooks/use-dream-image';
import type { Dream } from '@/types/dream';
import { dreamDay, dreamMood, dustWords, seedFor, spokenText, visualizeTiming } from '@/utils/visualize';

import { Shade } from './film';
import { Desaturate, LookTint } from './look-tint';
import { BREATHE, charIn, DEVELOP, DEVELOP_EASE, DEVELOP_MS, dust, dustOut, UNBLUR, up, WASH } from './motion';

/** After the picture starts developing, the header stops saying it's being made. */
const SETTLE_MS = 400;

type DreamPictureProps = {
  dream: Dream;
  /** Applies a change to this dream in the screen's list (the image, once it's painted). */
  onChange: (id: string, change: SetStateAction<Dream | null>) => void;
  /** Goes up by one each time the dream is shown again, replaying the animation. */
  showKey: number;
  /** Skip the words and go straight to the picture (after a repaint). */
  fast: boolean;
  look: number;
  reduceMotion: boolean;
  /** Bottom of the picture, above the tab bar. */
  bottom: number;
  now: Date;
  /** The words are gone and the picture is up (or couldn't be painted). */
  onSettled: () => void;
};

/**
 * One dream on the Visualize screen. Paints its image if it has none yet (on the
 * server, like the dream detail screen does), and meanwhile spells the dream out
 * so there is something to watch. Keyed by the dream, so each dream paints once.
 */
export function DreamPicture({ dream, onChange, showKey, ...scene }: DreamPictureProps) {
  const setDream: Dispatch<SetStateAction<Dream | null>> = (change) => onChange(dream.id, change);
  const image = useDreamImage(dream, setDream);
  const ready = dream.image_status === 'completed' && !!dream.image_url;
  const failed = dream.image_status === 'failed' && !image.generating;

  return (
    <Scene
      key={showKey}
      dream={dream}
      imageUri={ready ? dream.image_url : null}
      failed={failed}
      failMessage={image.error}
      onRetry={image.retry}
      {...scene}
    />
  );
}

type SceneProps = Omit<DreamPictureProps, 'onChange' | 'showKey'> & {
  imageUri: string | null;
  failed: boolean;
  failMessage: string | null;
  onRetry: () => void;
};

/**
 * The animation itself: the dream's words type in quickly, blow away like dust, and
 * the picture fades up where they were, sharp and still, then the title rises in.
 */
function Scene({ dream, imageUri, failed, failMessage, onRetry, fast, look, reduceMotion, bottom, now, onSettled }: SceneProps) {
  const quick = fast || reduceMotion;
  const text = useMemo(() => spokenText(dream.dream_text), [dream.dream_text]);
  const words = useMemo(() => (quick ? [] : dustWords(text, seedFor(dream.id))), [quick, text, dream.id]);
  const developAt = visualizeTiming(quick, text.replace(/ /g, '').length).develop;

  const [wordsDone, setWordsDone] = useState(quick);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (quick) return;
    const timer = setTimeout(() => setWordsDone(true), developAt * 1000);
    return () => clearTimeout(timer);
  }, [quick, developAt]);

  const revealed = wordsDone && loaded && !!imageUri;
  const broken = failed || loadFailed;
  const settled = revealed || (wordsDone && broken);
  const painting = wordsDone && !settled;

  const settle = useEffectEvent(onSettled);
  useEffect(() => {
    if (!settled) return;
    const timer = setTimeout(settle, revealed && !reduceMotion ? SETTLE_MS : 0);
    return () => clearTimeout(timer);
  }, [settled, revealed, reduceMotion]);

  const develop = (name: object) =>
    revealed ? animate(reduceMotion, { animationName: name, animationDuration: DEVELOP_MS, animationTimingFunction: DEVELOP_EASE }) : null;
  const mood = dreamMood(dream);
  const day = dreamDay(new Date(dream.created_at), now);

  function retry() {
    if (loadFailed) {
      setLoadFailed(false);
      setLoaded(false);
      setAttempt((n) => n + 1);
    } else {
      onRetry();
    }
  }

  return (
    <View style={[styles.area, { bottom }]} pointerEvents="box-none">
      {imageUri && !loadFailed && (
        <Animated.View pointerEvents="none" style={[styles.fill, styles.isolated, revealed ? develop(DEVELOP) : styles.hidden]}>
          <View style={[styles.fill, styles.isolated]}>
            <Image
              key={attempt}
              source={{ uri: imageUri }}
              style={styles.fill}
              contentFit="cover"
              accessibilityLabel={dream.title ?? 'your dream, as a picture'}
              onLoad={() => setLoaded(true)}
              onError={() => setLoadFailed(true)}
            />
            <LookTint look={look} />
          </View>
          {revealed && !reduceMotion && (
            <>
              <Animated.View style={[styles.fill, develop(UNBLUR)]}>
                <Image source={{ uri: imageUri }} style={styles.fill} contentFit="cover" blurRadius={24} />
              </Animated.View>
              <Desaturate animation={develop(UNBLUR)} />
              <Animated.View style={[styles.fill, styles.wash, develop(WASH)]} />
            </>
          )}
        </Animated.View>
      )}

      <Shade />

      {words.length > 0 && (
        <View pointerEvents="none" style={styles.wordsBox} accessibilityLabel={text}>
          <View style={styles.words}>
            {words.map((word) => (
              <View key={word.key} style={styles.word}>
                {word.chars.map((c) => (
                  <Letter key={c.key} ch={c.ch} at={c.in} out={c.out} dx={c.dx} dy={c.dy} reduceMotion={reduceMotion} />
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {painting && (
        <View pointerEvents="none" style={styles.center}>
          <Animated.Text style={[styles.painting, loop(reduceMotion, BREATHE, 2400)]}>painting your dream…</Animated.Text>
        </View>
      )}

      {wordsDone && broken && (
        <View style={styles.center} pointerEvents="box-none">
          <Text style={styles.failTitle}>couldn’t paint this one.</Text>
          {!!failMessage && <Text style={styles.failText}>{failMessage}</Text>}
          <Pressable accessibilityRole="button" onPress={retry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
            <Text style={styles.retryText}>try again</Text>
          </Pressable>
        </View>
      )}

      {(revealed || (wordsDone && broken)) && (
        <View pointerEvents="none" style={styles.caption}>
          <Animated.Text style={[styles.meta, up(reduceMotion, revealed ? 450 : 0, 500)]}>{mood ? `${day} · ${mood}` : day}</Animated.Text>
          <Animated.Text style={[styles.title, up(reduceMotion, revealed ? 550 : 80, 500)]} accessibilityRole="header">
            {dream.title ?? 'your dream'}
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

type LetterProps = { ch: string; at: number; out: number; dx: number; dy: number; reduceMotion: boolean };

/** One letter: fades in at `at` seconds, then drifts off as dust at `out`. */
function Letter({ ch, at, out, dx, dy, reduceMotion }: LetterProps) {
  const keyframes = useMemo(() => dust(dx, dy), [dx, dy]);
  // Two views: fading in and blowing away both change the opacity, so each gets its own.
  return (
    <Animated.View style={charIn(reduceMotion, at)}>
      <Animated.Text style={[styles.letter, dustOut(reduceMotion, keyframes, out)]}>{ch}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  area: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  isolated: {
    isolation: 'isolate',
  },
  hidden: {
    opacity: 0,
  },
  wash: {
    backgroundColor: '#fff',
  },
  wordsBox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 32,
    right: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 7,
    rowGap: 4,
  },
  word: {
    flexDirection: 'row',
  },
  letter: {
    fontFamily: BrandFonts.regular,
    fontSize: 22,
    lineHeight: 29,
    color: '#fff',
  },
  center: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 32,
    right: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  painting: {
    fontFamily: BrandFonts.regular,
    fontSize: 16,
    lineHeight: 20,
    color: '#fff',
  },
  failTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#fff',
    textAlign: 'center',
  },
  failText: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  retry: {
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: BrandColors.lime,
  },
  retryText: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 18,
    color: '#111',
  },
  pressed: {
    opacity: 0.8,
  },
  caption: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 110,
    gap: 10,
  },
  meta: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: BrandColors.lime,
  },
  title: {
    fontFamily: BrandFonts.medium,
    fontSize: 36,
    lineHeight: 37,
    letterSpacing: -1.5,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
  },
});
