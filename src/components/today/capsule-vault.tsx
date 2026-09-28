import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';
import { capsuleUri, type StoredCapsule } from '@/lib/capsules';
import { capsuleRow } from '@/utils/today';

import { overline } from './card-overlay';
import { animate, FADE, LOCK, loop, rise, SPIN, SPRING } from './motion';

/** Shown on top right after a note is sealed. */
export type JustSealed = { lockLabel: string; unlockDate: string };

type CapsuleVaultProps = {
  capsules: StoredCapsule[];
  justSealed: JustSealed | null;
  name: string;
  reduceMotion: boolean;
  bottomInset: number;
  onToast: (text: string) => void;
  onClose: () => void;
};

/** "your time capsule": sealed notes to future you, playable once their day comes. */
export function CapsuleVault({ capsules, justSealed, name, reduceMotion, bottomInset, onToast, onClose }: CapsuleVaultProps) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  function press(capsule: StoredCapsule, locked: boolean) {
    if (locked) {
      onToast('still sealed — patience ✦');
      return;
    }
    if (playingId === capsule.id && status.playing) {
      player.pause();
      return;
    }
    if (playingId === capsule.id) {
      // Paused or finished: carry on, or start again from the top.
      if (status.didJustFinish || status.currentTime >= status.duration - 0.1) player.seekTo(0);
      player.play();
      return;
    }
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    player.replace({ uri: capsuleUri(capsule) });
    player.play();
    setPlayingId(capsule.id);
  }

  return (
    <ScrollView contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 36 }]} showsVerticalScrollIndicator={false}>
      {justSealed ? (
        <View style={styles.sealed}>
          <View style={styles.lockWrap}>
            <Animated.View style={[styles.dashed, loop(reduceMotion, SPIN, 20000), !reduceMotion && { animationTimingFunction: 'linear' }]} />
            <Animated.View
              style={[
                styles.lock,
                animate(reduceMotion, { animationName: LOCK, animationDuration: 700, animationDelay: 300, animationTimingFunction: SPRING }),
              ]}>
              <Text style={styles.lockGlyph}>⧗</Text>
            </Animated.View>
          </View>
          <Animated.Text style={[styles.sealedTitle, rise(reduceMotion, 500)]} accessibilityRole="header">
            sealed for {justSealed.lockLabel}.
          </Animated.Text>
          <Animated.Text style={[styles.sealedText, rise(reduceMotion, 600)]}>
            future {name} gets it on {justSealed.unlockDate}. it’ll be waiting right here.
          </Animated.Text>
        </View>
      ) : (
        <Animated.View style={[styles.intro, rise(reduceMotion, 0)]}>
          <Text style={styles.introTitle} accessibilityRole="header">
            your time capsule
          </Text>
          <Text style={styles.introText}>notes from past you, waiting for the right day.</Text>
        </Animated.View>
      )}

      <Animated.Text style={[overline, styles.overline, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 700, animationTimingFunction: 'ease' })]}>
        capsules
      </Animated.Text>

      {capsules.length === 0 && (
        <Animated.Text style={[styles.empty, rise(reduceMotion, 800, 500)]}>
          nothing sealed yet. record a note on the today screen, pick when it opens, and it waits here for you.
        </Animated.Text>
      )}

      {capsules.map((capsule, i) => {
        const row = capsuleRow(capsule, now);
        const playing = playingId === capsule.id && status.playing;
        return (
          <Animated.View
            key={capsule.id}
            style={[styles.row, { backgroundColor: row.locked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)' }, rise(reduceMotion, 800 + i * 80, 500)]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={row.locked ? `${row.title}, ${row.subtitle}` : playing ? 'Pause' : `Play ${row.title}`}
              onPress={() => press(capsule, row.locked)}
              style={[styles.rowButton, { backgroundColor: row.locked ? 'rgba(255, 255, 255, 0.18)' : '#fff' }]}>
              <Text style={[styles.rowGlyph, { color: row.locked ? '#fff' : '#111' }]}>{row.locked ? '⧗' : playing ? '❚❚' : '▶'}</Text>
            </Pressable>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSub}>{row.subtitle}</Text>
            </View>
            <Text style={styles.rowLen}>{row.length}</Text>
          </Animated.View>
        );
      })}

      <Animated.View style={rise(reduceMotion, 1000)}>
        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backText}>back to today</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 14,
  },
  sealed: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  lockWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  lock: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockGlyph: {
    fontFamily: BrandFonts.medium,
    fontSize: 34,
    lineHeight: 40,
    color: '#2d3d25',
  },
  sealedTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.3,
    color: '#fff',
    textAlign: 'center',
  },
  sealedText: {
    maxWidth: 280,
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: '#fff',
    textAlign: 'center',
  },
  intro: {
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  introTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -1.3,
    color: '#fff',
  },
  introText: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: '#fff',
  },
  overline: {
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  empty: {
    paddingHorizontal: 4,
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderCurve: 'continuous',
  },
  rowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowGlyph: {
    fontFamily: BrandFonts.semibold,
    fontSize: 14,
    lineHeight: 17,
  },
  rowText: {
    flex: 1,
    gap: 5,
  },
  rowTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 17,
    color: '#fff',
  },
  rowSub: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  rowLen: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: '#fff',
  },
  back: {
    marginTop: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: '#111',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
