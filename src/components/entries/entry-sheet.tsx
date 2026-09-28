import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { EASE_OUT } from '@/components/today/motion';
import { BrandFonts } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import { colorFill, DREAM_COLOR_NAMES, dreamColor, dreamHeadline, rowDate, type DreamColor } from '@/utils/entries';

type EntrySheetProps = {
  /** The dream whose options are shown (kept while the sheet slides away). */
  dream: Dream | null;
  open: boolean;
  bottomInset: number;
  reduceMotion: boolean;
  onClose: () => void;
  onColor: (dream: Dream, color: DreamColor) => void;
  onDelete: (dream: Dream) => void;
};

/** White sheet that rises over the Entries screen when a dream is held: recolour it, or delete it. */
export function EntrySheet({ dream, open, bottomInset, reduceMotion, onClose, onColor, onDelete }: EntrySheetProps) {
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

  const color = dream ? dreamColor(dream) : 'lime';

  return (
    <>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.scrim,
          { opacity: open ? 0.6 : 0 },
          !reduceMotion && { transitionProperty: 'opacity', transitionDuration: 300, transitionTimingFunction: 'ease' },
        ]}>
        <Pressable accessibilityLabel="Close dream options" style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal={open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          { paddingBottom: Math.max(40, bottomInset + 20), transform: [{ translateY: open ? 0 : height * 1.05 }] },
          !reduceMotion && { transitionProperty: 'transform', transitionDuration: 400, transitionTimingFunction: EASE_OUT },
        ]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={onClose} style={styles.grabber} />

        {dream && (
          <>
            <View style={[styles.preview, colorFill(color)]}>
              <Text style={styles.previewDate}>{rowDate(dream)}</Text>
              <Text style={styles.previewHeadline} numberOfLines={2}>
                {dreamHeadline(dream)}
              </Text>
            </View>

            <View style={styles.colours}>
              <Text style={styles.label}>change colour</Text>
              <View style={styles.swatches}>
                {DREAM_COLOR_NAMES.map((name) => {
                  const selected = name === color;
                  return (
                    <Pressable
                      key={name}
                      accessibilityRole="radio"
                      accessibilityLabel={name}
                      accessibilityState={{ selected }}
                      onPress={() => !selected && onColor(dream, name)}
                      style={[
                        styles.swatch,
                        colorFill(name),
                        selected && styles.swatchSelected,
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => onDelete(dream)}
              style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}>
              <Svg width={14} height={16} viewBox="0 0 14 16" fill="none">
                <Path d="M1 3.5h12M5 3.5V1.5h4v2M2.5 3.5l.8 11h7.4l.8-11" stroke={DELETE_RED} strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
              <Text style={styles.deleteText}>delete dream</Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </>
  );
}

const DELETE_RED = '#c2361f';

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
  preview: {
    height: 92,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  previewDate: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#111',
    opacity: 0.75,
  },
  previewHeadline: {
    fontFamily: BrandFonts.medium,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.5,
    color: '#111',
  },
  colours: {
    gap: 12,
  },
  label: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
  swatches: {
    flexDirection: 'row',
    gap: 10,
  },
  swatch: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
  },
  // The design's white gap and dark ring around the picked colour.
  swatchSelected: {
    outlineWidth: 2,
    outlineOffset: 3,
    outlineColor: '#111',
    outlineStyle: 'solid',
  },
  delete: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: '#e6e6e6',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deletePressed: {
    transform: [{ scale: 0.97 }],
  },
  deleteText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 15,
    lineHeight: 18,
    color: DELETE_RED,
  },
});
