import { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { animate, BUBBLE_IN, EASE_OUT } from '@/components/today/motion';
import { BrandFonts } from '@/constants/theme';

const BUTTON_SIZE = 60;

type AddMenuProps = {
  open: boolean;
  /** Distance from the bottom of the screen to the "+" button. */
  bottom: number;
  reduceMotion: boolean;
  onToggle: () => void;
  onYap: () => void;
  onOldDream: () => void;
};

/**
 * The Visualize screen's "+": opens two small pills above it — yap a new dream on Today,
 * or pick an old dream to paint. The "+" turns into "×" while they're open.
 */
export function AddMenu({ open, bottom, reduceMotion, onToggle, onYap, onOldDream }: AddMenuProps) {
  // Android's back button closes the menu before it leaves the screen.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onToggle();
      return true;
    });
    return () => sub.remove();
  }, [open, onToggle]);

  return (
    <>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.scrim, { opacity: open ? 0.55 : 0 }, !reduceMotion && { transitionProperty: 'opacity', transitionDuration: 250, transitionTimingFunction: 'ease' }]}>
        <Pressable accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={onToggle} />
      </Animated.View>

      {open && (
        <View style={[styles.options, { bottom: bottom + BUTTON_SIZE + 14 }]}>
          <Option label="Visualize Old Dream ✨" delay={60} reduceMotion={reduceMotion} onPress={onOldDream}>
            <MoonIcon />
          </Option>
          <Option label="Yap 🎙️" delay={0} reduceMotion={reduceMotion} onPress={onYap}>
            <WaveIcon />
          </Option>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Close menu' : 'Add a dream'}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={({ pressed }) => [styles.add, { bottom }, pressed && styles.addPressed]}>
        <Animated.View
          style={[
            { transform: [{ rotate: open ? '45deg' : '0deg' }] },
            !reduceMotion && { transitionProperty: 'transform', transitionDuration: 300, transitionTimingFunction: EASE_OUT },
          ]}>
          <Svg width={22} height={22} viewBox="0 0 22 22">
            <Path d="M11 3v16M3 11h16" stroke="#111" strokeWidth={2.6} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </Pressable>
    </>
  );
}

type OptionProps = {
  label: string;
  delay: number;
  reduceMotion: boolean;
  onPress: () => void;
  children: React.ReactNode;
};

function Option({ label, delay, reduceMotion, onPress, children }: OptionProps) {
  return (
    <Animated.View style={animate(reduceMotion, { animationName: BUBBLE_IN, animationDuration: 260, animationDelay: delay, animationTimingFunction: EASE_OUT })}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
        <View style={styles.icon}>{children}</View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Sound wave, as on Today's yap button. */
function WaveIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12h3.2l2.3-4.5 3.2 11L14 3.5l2.9 13.5 1.9-5H22" stroke="#111" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The Visualize tab's half-moon, in ink. */
function MoonIcon() {
  return (
    <View style={styles.moon}>
      <View style={styles.moonHalf} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
    backgroundColor: '#000',
  },
  options: {
    position: 'absolute',
    right: 20,
    zIndex: 4,
    alignItems: 'flex-end',
    gap: 10,
  },
  option: {
    height: 50,
    paddingLeft: 8,
    paddingRight: 18,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EDEDED',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  },
  optionPressed: {
    transform: [{ scale: 0.96 }],
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  label: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 18,
    color: '#111',
  },
  moon: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
  add: {
    position: 'absolute',
    right: 20,
    zIndex: 4,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDEDED',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  },
  addPressed: {
    transform: [{ scale: 0.94 }],
  },
});
