import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { animate, FADE } from '@/components/today/motion';
import { CREAM } from '@/components/visualize/painting';
import { BrandFonts } from '@/constants/theme';
import { useDreamImage } from '@/hooks/use-dream-image';
import { useDream } from '@/hooks/use-dreams';
import { dreamHeadline } from '@/utils/entries';
import { cardMeta } from '@/utils/visualize';

const BREATHE = { from: { opacity: 0.45 }, to: { opacity: 1 } };
/** A slow settle as the picture arrives. */
const SETTLE = { from: { transform: [{ scale: 1.08 }] }, to: { transform: [{ scale: 1 }] } };

/**
 * One dream's picture, full screen ("/painting/<id>"), with its title written over the
 * bottom. Opened from a painting on Visualize, or from "visualize" on a dream's page.
 * Paints the picture first if it has none yet.
 *
 * `?from=dream` means it was opened from the dream's page, so "read the dream" goes back.
 */
export default function PaintingScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { dream, loading, error, reload, setDream } = useDream(id);
  const image = useDreamImage(dream, setDream);

  const ready = dream?.image_status === 'completed' && !!dream.image_url;
  const failed = dream?.image_status === 'failed' && !image.generating;
  const unread = !!dream && dream.analysis_status !== 'completed';

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/visualize');
  }

  function openDream() {
    if (from === 'dream' && router.canGoBack()) router.back();
    else router.push({ pathname: '/dream/[id]', params: { id } });
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {ready ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            animate(reduceMotion, { animationName: SETTLE, animationDuration: 2400, animationTimingFunction: 'ease-out' }),
          ]}>
          <Image source={{ uri: dream.image_url! }} style={StyleSheet.absoluteFill} contentFit="cover" transition={500} accessibilityIgnoresInvertColors />
        </Animated.View>
      ) : (
        <View style={styles.middle}>
          {loading && !dream ? (
            <Animated.Text style={[styles.state, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 300 })]}>
              finding your dream…
            </Animated.Text>
          ) : error && !dream ? (
            <>
              <Text style={styles.state}>couldn’t reach this dream.</Text>
              <Pill label="try again" onPress={reload} />
            </>
          ) : !dream ? (
            <Text style={styles.state}>this dream is gone.</Text>
          ) : unread ? (
            <>
              <Text style={styles.state}>afterdream needs to read this dream before painting it.</Text>
              <Pill label="open the dream" onPress={openDream} />
            </>
          ) : failed ? (
            <>
              <Text style={styles.state}>couldn’t paint it.</Text>
              <Pill label="try again" onPress={image.retry} />
            </>
          ) : (
            <Animated.Text
              accessibilityLiveRegion="polite"
              style={[
                styles.state,
                animate(reduceMotion, {
                  animationName: BREATHE,
                  animationDuration: 1200,
                  animationDirection: 'alternate',
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out',
                }),
              ]}>
              painting your dream…
            </Animated.Text>
          )}
        </View>
      )}

      {/* Darkens the top and bottom of the picture so the close button and the title read. */}
      <View pointerEvents="none" style={[styles.shade, styles.shadeTop]} />
      <View pointerEvents="none" style={[styles.shade, styles.shadeBottom]} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={8}
        onPress={close}
        style={({ pressed }) => [styles.close, { top: insets.top + 8 }, pressed && styles.pressed]}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path d="M2 2l10 10M12 2L2 12" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Pressable>

      {dream && (
        <View style={[styles.caption, { paddingBottom: Math.max(insets.bottom, 16) + 20 }]}>
          <Text style={styles.meta}>{cardMeta(dream)}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {dreamHeadline(dream)}
          </Text>
          <Pressable accessibilityRole="button" onPress={openDream} hitSlop={8} style={({ pressed }) => [styles.readLink, pressed && styles.pressed]}>
            <Text style={styles.readText}>read the dream →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Pill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  middle: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 40,
    paddingBottom: 120,
    backgroundColor: '#111',
  },
  state: {
    fontFamily: BrandFonts.regular,
    fontSize: 17,
    lineHeight: 24,
    color: CREAM,
    textAlign: 'center',
  },
  pill: {
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 21,
    justifyContent: 'center',
    backgroundColor: CREAM,
  },
  pillText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  shadeTop: {
    top: 0,
    height: 140,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0))',
  },
  shadeBottom: {
    bottom: 0,
    height: '50%',
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.85))',
  },
  close: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  pressed: {
    opacity: 0.75,
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    gap: 10,
  },
  meta: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 17,
    color: CREAM,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 8,
  },
  title: {
    fontFamily: BrandFonts.regular,
    fontSize: 44,
    lineHeight: 45,
    letterSpacing: -1.6,
    color: CREAM,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 12,
  },
  readLink: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  readText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.8)',
  },
});
