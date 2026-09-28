import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandColors, BrandFonts } from '@/constants/theme';

import { BREATHE, forever, OUT, SPIN, SPIN_BACK, up } from './motion';
import { Pill, PhotoCard, Swirl } from './photo-card';

const RING = 300;
const ORBIT_COLORS = ['#E2EB98', '#A8D8F0', '#C9B8F2', '#F2B8A0', '#B8E6C4', '#F2A8C4'];
const ORBIT = ORBIT_COLORS.map((color, i) => {
  const angle = (i / ORBIT_COLORS.length) * Math.PI * 2;
  return { color, x: RING / 2 + Math.cos(angle) * (RING / 2), y: RING / 2 + Math.sin(angle) * (RING / 2) };
});

type MonthHeroProps = {
  /** Dreams told this month (already counting up). */
  count: number;
  /** The theme that comes up most, if there is one. */
  theme: string | null;
  photo: string | null;
  reduceMotion: boolean;
  onDeep: () => void;
};

/** "✦ your month in dreams": the month's count inside an orbit of light, and the main theme. */
export function MonthHero({ count, theme, photo, reduceMotion, onDeep }: MonthHeroProps) {
  return (
    <PhotoCard
      photo={photo}
      base="#12201a"
      radius={40}
      zoom
      blur={28}
      shade="linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.55))"
      reduceMotion={reduceMotion}
      style={[styles.card, up(reduceMotion, 0, 700, OUT)]}>
      <Pill label="✦ your month in dreams" style={styles.pill} />

      <View pointerEvents="none" style={styles.orbitArea}>
        <View style={styles.centered}>
          <View style={{ opacity: 0.85 }}>
            <Swirl size={240} duration={12000} reduceMotion={reduceMotion} />
          </View>
        </View>
        <Animated.View style={[styles.centered, styles.dashed, forever(reduceMotion, SPIN_BACK, 60000)]} />
        <Animated.View style={[styles.centered, styles.ring, forever(reduceMotion, SPIN, 40000)]}>
          {ORBIT.map((dot) => (
            <View key={dot.color} style={[styles.dot, { left: dot.x - 5, top: dot.y - 5, backgroundColor: dot.color }]} />
          ))}
        </Animated.View>
        <Animated.View style={[styles.core, forever(reduceMotion, BREATHE, 6000, 'ease-in-out')]}>
          <Text style={styles.count} accessibilityLabel={`${count} dreams this month`}>
            {count}
          </Text>
          <Text style={styles.countLabel}>dreams this month</Text>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.headline} accessibilityRole="header">
          {theme ? (
            <>
              lately, your dreams keep circling <Text style={styles.accent}>{theme}.</Text>
            </>
          ) : (
            <>
              your patterns start to show <Text style={styles.accent}>after a few dreams.</Text>
            </>
          )}
        </Text>
        <Pressable accessibilityRole="button" onPress={onDeep} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>read your full pattern</Text>
          <Text style={styles.buttonText}>→</Text>
        </Pressable>
      </View>
    </PhotoCard>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 520,
  },
  pill: {
    position: 'absolute',
    left: 22,
    top: 22,
  },
  orbitArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 210 - RING / 2,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashed: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ring: {
    width: RING,
    height: RING,
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    boxShadow: '0 0 12px 2px rgba(255,255,255,0.6)',
  },
  core: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(10,14,12,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  count: {
    fontFamily: BrandFonts.semibold,
    fontSize: 64,
    lineHeight: 66,
    letterSpacing: -3,
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  countLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: BrandColors.lime,
  },
  bottom: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 22,
    gap: 16,
  },
  headline: {
    fontFamily: BrandFonts.medium,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -1.1,
    color: '#fff',
  },
  accent: {
    color: BrandColors.lime,
  },
  button: {
    alignSelf: 'flex-start',
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 23,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 15,
    lineHeight: 18,
    color: '#111',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
