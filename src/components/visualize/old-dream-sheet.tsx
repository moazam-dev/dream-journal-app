import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { EASE_OUT } from '@/components/today/motion';
import { BrandFonts } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import { colorFill, dreamColor, dreamHeadline, rowDate } from '@/utils/entries';

type OldDreamSheetProps = {
  /** Dreams not painted yet, newest first. */
  dreams: readonly Dream[];
  open: boolean;
  /** Tallest the list gets before it scrolls. */
  maxListHeight: number;
  bottomInset: number;
  reduceMotion: boolean;
  onClose: () => void;
  onPick: (dream: Dream) => void;
};

/** White sheet over Visualize listing the dreams still to be painted: tap one to paint it. */
export function OldDreamSheet({ dreams, open, maxListHeight, bottomInset, reduceMotion, onClose, onPick }: OldDreamSheetProps) {
  // Until the sheet is measured, park it well below the screen.
  const [height, setHeight] = useState(800);

  // Android's back button closes the sheet before it leaves the screen.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  return (
    <>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.scrim, { opacity: open ? 0.6 : 0 }, !reduceMotion && { transitionProperty: 'opacity', transitionDuration: 300, transitionTimingFunction: 'ease' }]}>
        <Pressable accessibilityLabel="Close the list" style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal={open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          { paddingBottom: Math.max(32, bottomInset + 16), transform: [{ translateY: open ? 0 : height * 1.05 }] },
          !reduceMotion && { transitionProperty: 'transform', transitionDuration: 400, transitionTimingFunction: EASE_OUT },
        ]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={onClose} style={styles.grabber} />

        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">
            visualize an old dream
          </Text>
          <Text style={styles.note}>
            {dreams.length === 0
              ? 'every dream you’ve told is already painted ✦'
              : `${dreams.length} dream${dreams.length === 1 ? '' : 's'} still waiting for a picture.`}
          </Text>
        </View>

        {dreams.length > 0 && (
          <ScrollView style={{ maxHeight: maxListHeight }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {dreams.map((dream) => (
              <Pressable
                key={dream.id}
                accessibilityRole="button"
                accessibilityHint="Paints this dream"
                onPress={() => onPick(dream)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <View style={[styles.swatch, colorFill(dreamColor(dream))]} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {dreamHeadline(dream)}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {rowDate(dream)}
                    {dream.analysis_status === 'completed' ? '' : ' · not read yet'}
                  </Text>
                </View>
                <Svg width={8} height={14} viewBox="0 0 8 14">
                  <Path d="M1.5 1.5L6.5 7l-5 5.5" stroke="#111" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.4} />
                </Svg>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    zIndex: 8,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: '#fff',
    paddingTop: 14,
    paddingHorizontal: 20,
    gap: 18,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d4d4d4',
  },
  head: {
    gap: 6,
  },
  title: {
    fontFamily: BrandFonts.medium,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: '#111',
  },
  note: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(0,0,0,0.55)',
  },
  list: {
    gap: 8,
  },
  row: {
    minHeight: 64,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F2F2F2',
  },
  rowPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#E8E8E8',
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 16,
    lineHeight: 20,
    color: '#111',
  },
  rowMeta: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(0,0,0,0.5)',
  },
});
