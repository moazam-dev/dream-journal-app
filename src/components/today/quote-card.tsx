import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts } from '@/constants/theme';
import type { Quote } from '@/utils/today';

import { CARD_BACKGROUNDS } from './backgrounds';
import { ShareIcon } from './icons';
import { glass, TodayCard } from './today-card';

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
      base="#050818"
      gradient="radial-gradient(80% 35% at 50% 25%, #164a6b, transparent 70%)"
      photo={CARD_BACKGROUNDS[2]}
      glow={{ left: 120, top: 220, width: 240, height: 240, color: '#4fdcff', opacity: 0.12, drift: 'back', duration: 15000 }}>
      <Text style={styles.date}>today&apos;s thought · {date}</Text>

      {/* Centred in the space between the date and the buttons. */}
      <View style={styles.body} accessible accessibilityLabel={`${quote.text} — ${quote.by}`}>
        <Text style={styles.mark}>“</Text>
        <Text style={styles.quote} numberOfLines={7} adjustsFontSizeToFit minimumFontScale={0.7}>
          {quote.text}
        </Text>
        <Text style={styles.by}>— {quote.by}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onShare} style={({ pressed }) => [styles.share, pressed && styles.pressed]}>
          <ShareIcon size={19} color="#111" />
          <Text style={styles.shareText}>share this</Text>
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
    left: 22,
    right: 22,
    top: 34,
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  body: {
    position: 'absolute',
    left: 26,
    right: 26,
    top: 70,
    // The buttons (56 tall, 22 from the bottom) plus a gap.
    bottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  mark: {
    height: 48,
    textAlign: 'center',
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
    textAlign: 'center',
    color: '#fff',
  },
  by: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 18,
    textAlign: 'center',
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
