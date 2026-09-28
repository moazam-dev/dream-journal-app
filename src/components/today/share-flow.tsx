import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { Linking, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';
import { quoteShareText, type Quote } from '@/utils/today';

import { animate, EASE_OUT, rise, RISE } from './motion';

const LOGO = require('@/assets/images/afterdream-logo.png');

type ShareFlowProps = {
  quote: Quote;
  photo: string;
  reduceMotion: boolean;
  bottomInset: number;
  onToast: (text: string) => void;
};

/** "share today's thought": a story-sized preview of the quote, and where to send it. */
export function ShareFlow({ quote, photo, reduceMotion, bottomInset, onToast }: ShareFlowProps) {
  const message = quoteShareText(quote);

  async function shareSheet() {
    try {
      await Share.share({ message });
    } catch {
      onToast('couldn’t open sharing');
    }
  }

  async function sendMessage() {
    // iOS wants "sms:&body=", Android "sms:?body=".
    const url = `sms:${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
    } catch {
      onToast('couldn’t open messages');
    }
  }

  async function copy() {
    try {
      await Clipboard.setStringAsync(message);
      onToast('copied ✦');
    } catch {
      onToast('couldn’t copy it');
    }
  }

  const targets = [
    { icon: '↗', label: 'share', go: shareSheet },
    { icon: '✉', label: 'message', go: sendMessage },
    { icon: '⧉', label: 'copy', go: copy },
  ];

  return (
    <View style={[styles.flow, { paddingBottom: bottomInset + 40 }]}>
      <Animated.View
        style={[
          styles.story,
          animate(reduceMotion, { animationName: RISE, animationDuration: 600, animationDelay: 200, animationTimingFunction: EASE_OUT }),
        ]}
        accessible
        accessibilityLabel={`${quote.text} — ${quote.by}`}>
        <Image source={{ uri: photo }} style={styles.storyPhoto} contentFit="cover" blurRadius={18} />
        <View style={styles.storyShade} />
        <View style={styles.storyText}>
          <Text style={styles.mark}>“</Text>
          <Text style={styles.quote}>{quote.text}</Text>
          <Text style={styles.by}>— {quote.by}</Text>
        </View>
        <View style={styles.brand}>
          <Image source={LOGO} style={styles.logo} contentFit="contain" tintColor="#fff" />
          <Text style={styles.brandText}>afterdream</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.targets, rise(reduceMotion, 400)]}>
        {targets.map(({ icon, label, go }) => (
          <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={go} style={({ pressed }) => [styles.target, pressed && styles.pressed]}>
            <View style={styles.targetIcon}>
              <Text style={styles.targetGlyph}>{icon}</Text>
            </View>
            <Text style={styles.targetLabel}>{label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    paddingHorizontal: 20,
  },
  story: {
    width: 236,
    height: 420,
    borderRadius: 28,
    borderCurve: 'continuous',
    overflow: 'hidden',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.45)',
  },
  storyPhoto: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
  },
  storyShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  storyText: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 60,
    gap: 14,
  },
  mark: {
    height: 29,
    fontFamily: BrandFonts.medium,
    fontSize: 48,
    lineHeight: 58,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  quote: {
    fontFamily: BrandFonts.medium,
    fontSize: 21,
    lineHeight: 24,
    letterSpacing: -0.6,
    color: '#fff',
  },
  by: {
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: '#fff',
  },
  brand: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 18,
    height: 18,
  },
  brandText: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: '#fff',
  },
  targets: {
    flexDirection: 'row',
    gap: 18,
  },
  target: {
    alignItems: 'center',
    gap: 8,
  },
  targetIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetGlyph: {
    fontFamily: BrandFonts.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#fff',
  },
  targetLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: '#fff',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
