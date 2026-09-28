import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

import { BrandColors, BrandFonts } from '@/constants/theme';
import { quoteShareText, type Quote } from '@/utils/today';

import { CopyIcon, ShareIcon } from './icons';
import { animate, EASE_OUT, rise, RISE } from './motion';

const LOGO = require('@/assets/images/afterdream-logo.png');

/** The story picture is 9:16, like a WhatsApp status or an Instagram story. */
const STORY_WIDTH = 252;
const STORY_HEIGHT = 448;

type ShareFlowProps = {
  quote: Quote;
  /** Today, like "sep 27". */
  date: string;
  /** The quote card's background picture. */
  photo: number;
  reduceMotion: boolean;
  bottomInset: number;
  onToast: (text: string) => void;
};

/**
 * "share today's thought": a story-sized picture of the quote with the Afterdream logo.
 * "share" turns it into a PNG and opens the share sheet (WhatsApp, status, stories…);
 * "copy" puts the quote on the clipboard as text.
 */
export function ShareFlow({ quote, date, photo, reduceMotion, bottomInset, onToast }: ShareFlowProps) {
  const story = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  async function shareImage() {
    if (busy) return;
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        onToast('sharing isn’t available here');
        return;
      }
      const uri = await captureRef(story, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'share today’s thought' });
    } catch {
      onToast('couldn’t make the picture');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await Clipboard.setStringAsync(quoteShareText(quote));
      onToast('copied ✦');
    } catch {
      onToast('couldn’t copy it');
    }
  }

  return (
    <View style={[styles.flow, { paddingBottom: bottomInset + 40 }]}>
      <Animated.View
        style={[styles.frame, animate(reduceMotion, { animationName: RISE, animationDuration: 600, animationDelay: 200, animationTimingFunction: EASE_OUT })]}>
        <View style={styles.clip}>
          {/* Everything inside this view is what ends up in the shared picture (square corners). */}
          <View ref={story} collapsable={false} style={styles.story} accessible accessibilityLabel={`${quote.text} — ${quote.by}`}>
            <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.storyShade} />

            <View style={styles.brand}>
              <Image source={LOGO} style={styles.logo} contentFit="contain" tintColor={BrandColors.lime} />
              <Text style={styles.brandText}>afterdream</Text>
            </View>

            <View style={styles.storyText}>
              <Text style={styles.mark}>“</Text>
              <Text style={styles.quote} numberOfLines={8} adjustsFontSizeToFit minimumFontScale={0.7}>
                {quote.text}
              </Text>
              <Text style={styles.by}>— {quote.by}</Text>
            </View>

            <Text style={styles.footer}>today’s thought · {date}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.targets, rise(reduceMotion, 400)]}>
        <Target label={busy ? 'making it…' : 'share'} onPress={shareImage} disabled={busy}>
          <ShareIcon size={22} />
        </Target>
        <Target label="copy text" onPress={copy}>
          <CopyIcon size={22} />
        </Target>
      </Animated.View>
    </View>
  );
}

type TargetProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: ReactNode;
};

/** Round icon button with a label under it. */
function Target({ label, onPress, disabled, children }: TargetProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.target, pressed && styles.pressed, disabled && styles.dim]}>
      <View style={styles.targetIcon}>{children}</View>
      <Text style={styles.targetLabel}>{label}</Text>
    </Pressable>
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
  frame: {
    borderRadius: 28,
    borderCurve: 'continuous',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.45)',
  },
  clip: {
    borderRadius: 28,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  story: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    alignItems: 'center',
    backgroundColor: '#050818',
  },
  storyShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.5))',
  },
  brand: {
    marginTop: 34,
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 0.3,
    color: '#fff',
  },
  storyText: {
    flex: 1,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mark: {
    height: 29,
    fontFamily: BrandFonts.medium,
    fontSize: 48,
    lineHeight: 58,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  quote: {
    fontFamily: BrandFonts.medium,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.6,
    textAlign: 'center',
    color: '#fff',
  },
  by: {
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    color: '#fff',
  },
  footer: {
    marginBottom: 26,
    fontFamily: BrandFonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  targets: {
    flexDirection: 'row',
    gap: 28,
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
  targetLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: '#fff',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  dim: {
    opacity: 0.6,
  },
});
