import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts } from '@/constants/theme';
import type { Quote } from '@/utils/today';

import { CardPill, glass, TodayCard } from './today-card';

type QuoteCardProps = {
  height: number;
  active: boolean;
  reduceMotion: boolean;
  quote: Quote;
  /** Today, like "sep 27". */
  date: string;
  saved: boolean;
  onShare: () => void;
  onToggleSave: () => void;
};

/** Card 3: a dream quote that changes every day, to share or keep. */
export function QuoteCard({ height, active, reduceMotion, quote, date, saved, onShare, onToggleSave }: QuoteCardProps) {
  return (
    <TodayCard
      height={height}
      active={active}
      reduceMotion={reduceMotion}
      label="today's thought"
      base="#8a3c16"
      gradient="radial-gradient(70% 40% at 30% 22%, #e59a55, transparent 70%), radial-gradient(60% 40% at 78% 58%, #f2bf8a, transparent 70%)"
      photo="https://picsum.photos/id/1016/600/900"
      glow={{ left: 120, top: 220, width: 240, height: 240, color: '#f7d2a0', opacity: 0.5, drift: 'back', duration: 15000 }}>
      <CardPill label="✦ today's thought" />
      <Text style={styles.date}>{date}</Text>

      <View style={[styles.body, { top: `${(150 / 610) * 100}%` }]} accessible accessibilityLabel={`${quote.text} — ${quote.by}`}>
        <Text style={styles.mark}>“</Text>
        <Text style={styles.quote}>{quote.text}</Text>
        <Text style={styles.by}>— {quote.by}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onShare} style={({ pressed }) => [styles.share, pressed && styles.pressed]}>
          <Text style={styles.shareText}>share this</Text>
          <Text style={styles.shareText}>↗</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved thoughts' : 'Save this thought'}
          accessibilityState={{ selected: saved }}
          onPress={onToggleSave}
          style={({ pressed }) => [styles.save, glass(0.18), pressed && styles.pressed]}>
          <Text style={styles.saveGlyph}>{saved ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
    </TodayCard>
  );
}

const styles = StyleSheet.create({
  date: {
    position: 'absolute',
    right: 22,
    top: 36,
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  body: {
    position: 'absolute',
    left: 26,
    right: 26,
    gap: 22,
  },
  mark: {
    height: 48,
    fontFamily: BrandFonts.medium,
    fontSize: 80,
    lineHeight: 96,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  quote: {
    fontFamily: BrandFonts.medium,
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: -1,
    color: '#fff',
  },
  by: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 18,
    color: '#fff',
  },
  actions: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 22,
    flexDirection: 'row',
    gap: 10,
  },
  share: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: '#111',
  },
  save: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveGlyph: {
    fontFamily: BrandFonts.regular,
    fontSize: 20,
    lineHeight: 24,
    color: '#fff',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
