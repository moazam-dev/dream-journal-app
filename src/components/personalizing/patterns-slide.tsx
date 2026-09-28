import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { BrandColors, BrandFonts } from '@/constants/theme';

import { animate, BLINK, CENTER_IN, EASE_OUT, FADE, morph, useFitScale } from './motion';
import { SlideTitle } from './slide-title';

type PatternsSlideProps = {
  reduceMotion: boolean;
};

/** The design's card size; the side cards were drawn smaller and are scaled up to match. */
const CARD_WIDTH = 260;
const CARD_HEIGHT = 350;
const SIDE_WIDTH = 210;
const SIDE_SCALE = CARD_WIDTH / SIDE_WIDTH;
/** Room for the cards, their shadow and the dots below. */
const ART_HEIGHT = 440;
/** Gap between cards while scrolling. */
const CARD_GAP = 16;
/** How the cards either side of the middle one look: smaller, tilted, pulled in to peek. */
const SIDE_CARD_SCALE = 0.86;
const SIDE_CARD_TILT = 7;
const SIDE_CARD_PULL = 28;
/** The explorer card shows first, with themes to its left and people to its right. */
const START_INDEX = 1;

const CREAM = '#F4EEDC';
const ORANGE = '#FF8A1F';
const PINK = '#F2A8E0';
const MOSS = '#1F3316';
const LILAC = '#C9B8F2';

// The side cards slide out from behind the middle one.
const LEFT_IN = {
  from: { opacity: 0, transform: [{ translateX: 80 }] },
  to: { opacity: 1, transform: [{ translateX: 0 }] },
};
const RIGHT_IN = {
  from: { opacity: 0, transform: [{ translateX: -80 }] },
  to: { opacity: 1, transform: [{ translateX: 0 }] },
};
const PEOPLE_MORPH = morph(220, 220);
const EXPLORER_MORPH = morph(140, 130);

const STREAKS = [
  { left: -30, top: 22, width: 200, height: 26 },
  { left: 10, top: 58, width: 180, height: 22 },
  { left: -10, bottom: 30, width: 200, height: 26 },
];
const PETALS = [
  { left: -26, top: -26, rotate: '-35deg' },
  { right: -26, top: -26, rotate: '35deg' },
  { left: -26, bottom: -26, rotate: '35deg' },
  { right: -26, bottom: -26, rotate: '-35deg' },
];

/**
 * Slide 3: "unlock your patterns." Themes, their dream type and people as three cards
 * they can swipe left and right through. The middle card stands upright; the ones
 * either side are smaller, tilted away and peek in from the edges.
 */
export const PatternsSlide = memo(function PatternsSlide({ reduceMotion }: PatternsSlideProps) {
  const { width } = useWindowDimensions();
  const { scale, onLayout } = useFitScale(ART_HEIGHT);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const cardWidth = CARD_WIDTH * scale;
  const cardHeight = CARD_HEIGHT * scale;
  const step = cardWidth + CARD_GAP;
  const sidePadding = (width - cardWidth) / 2;
  const scrollX = useSharedValue(step * START_INDEX);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.set(event.contentOffset.x);
  });

  // Start on the explorer card. `contentOffset` isn't honoured everywhere, so scroll there too.
  function showFirstCard() {
    scrollRef.current?.scrollTo({ x: step * START_INDEX, animated: false });
  }

  const cards = [
    { key: 'themes', entrance: LEFT_IN, duration: 800, delay: 700, content: <ThemesCard /> },
    { key: 'explorer', entrance: CENTER_IN, duration: 900, delay: 500, content: <ExplorerCard reduceMotion={reduceMotion} /> },
    { key: 'people', entrance: RIGHT_IN, duration: 800, delay: 700, content: <PeopleCard reduceMotion={reduceMotion} /> },
  ];

  return (
    <View style={styles.slide}>
      <SlideTitle
        words={['unlock', 'your', 'patterns.']}
        subtitle="log 3 dreams to see what your nights are saying."
        subtitleDelay={500}
        reduceMotion={reduceMotion}
      />

      <View style={styles.art} onLayout={onLayout}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={step}
          decelerationRate="fast"
          disableIntervalMomentum
          contentOffset={{ x: step * START_INDEX, y: 0 }}
          onLayout={showFirstCard}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.scroller}
          contentContainerStyle={[styles.track, { paddingHorizontal: sidePadding, paddingTop: 24 * scale }]}>
          {cards.map((card, index) => (
            <Animated.View
              key={card.key}
              style={[
                { width: cardWidth, height: cardHeight },
                animate(reduceMotion, {
                  animationName: card.entrance,
                  animationDuration: card.duration,
                  animationDelay: card.delay,
                  animationTimingFunction: EASE_OUT,
                }),
              ]}>
              <CardFrame index={index} step={step} scrollX={scrollX}>
                <View style={[styles.cardArtwork, { transform: [{ scale }] }]}>{card.content}</View>
              </CardFrame>
            </Animated.View>
          ))}
        </Animated.ScrollView>

        <Animated.View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={[styles.dots, animate(reduceMotion, { animationName: FADE, animationDuration: 500, animationDelay: 1400, animationTimingFunction: 'ease' })]}>
          {cards.map((card, index) => (
            <Dot key={card.key} index={index} step={step} scrollX={scrollX} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
});

type ScrollLinked = {
  index: number;
  /** Distance from one card to the next (pt). */
  step: number;
  scrollX: SharedValue<number>;
};

/** How far a card is from the middle: 0 = centred, 1 = one to the left, -1 = one to the right. */
function useDistance({ index, step, scrollX }: ScrollLinked) {
  return useDerivedValue(() => scrollX.get() / step - index);
}

/** Shrinks, tilts and pulls in a card the further it is from the middle. */
function CardFrame({ children, ...linked }: ScrollLinked & { children: ReactNode }) {
  const distance = useDistance(linked);
  const style = useAnimatedStyle(() => {
    const d = Math.max(-1, Math.min(1, distance.get()));
    return {
      zIndex: Math.round(10 - Math.abs(d) * 10),
      transform: [
        { translateX: SIDE_CARD_PULL * d },
        { scale: interpolate(Math.abs(d), [0, 1], [1, SIDE_CARD_SCALE]) },
        { rotate: `${-SIDE_CARD_TILT * d}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.frame, style]}>{children}</Animated.View>;
}

/** Page dot: stretches into a bright pill while its card is in the middle. */
function Dot(linked: ScrollLinked) {
  const distance = useDistance(linked);
  const style = useAnimatedStyle(() => {
    const near = 1 - Math.min(1, Math.abs(distance.get()));
    return {
      width: interpolate(near, [0, 1], [8, 24]),
      opacity: interpolate(near, [0, 1], [0.4, 1]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

/** Cream card with orange streaks. */
function ThemesCard() {
  return (
    <View accessible accessibilityLabel="themes: what your mind keeps coming back to." style={[styles.card, { backgroundColor: CREAM }]}>
      <View style={styles.sideArtwork}>
        {STREAKS.map((s) => (
          <View key={s.left} style={[styles.streak, s, { borderRadius: s.height / 2 }]} />
        ))}
        <View style={[styles.sideText, { top: 130 }]}>
          <Text style={styles.sideTitle}>themes</Text>
          <Text style={styles.sideHint}>what your mind keeps coming back to.</Text>
        </View>
      </View>
    </View>
  );
}

/** Pink card with a wobbling moss blob that has two eyes. */
function PeopleCard({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <View accessible accessibilityLabel="people: who keeps visiting your nights." style={[styles.card, { backgroundColor: PINK }]}>
      <View style={styles.sideArtwork}>
        <Animated.View
          style={[
            styles.peopleBlob,
            animate(reduceMotion, {
              animationName: PEOPLE_MORPH,
              animationDuration: 9000,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }),
          ]}
        />
        <View style={[styles.peopleEye, { left: 30 }]} />
        <View style={[styles.peopleEye, { left: 70 }]} />
        <View style={[styles.sideText, { top: 150 }]}>
          <Text style={[styles.sideTitle, { color: PINK }]}>people</Text>
          <Text style={[styles.sideHint, { color: PINK }]}>who keeps visiting your nights.</Text>
        </View>
      </View>
    </View>
  );
}

/** Lilac card with lime petals and a blinking one-eyed blob. */
function ExplorerCard({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <View
      accessible
      accessibilityLabel="the explorer: your dream type, revealed after 3 nights."
      style={[styles.card, { backgroundColor: LILAC }]}>
      {PETALS.map(({ rotate, ...spot }) => (
        <View key={rotate + Object.keys(spot).join()} style={[styles.petal, spot, { transform: [{ rotate }] }]} />
      ))}
      <Animated.View
        style={[
          styles.explorerBlob,
          animate(reduceMotion, {
            animationName: EXPLORER_MORPH,
            animationDuration: 8000,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }),
        ]}
      />
      <Animated.View
        style={[
          styles.explorerEye,
          animate(reduceMotion, {
            animationName: BLINK,
            animationDuration: 4000,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }),
        ]}>
        <View style={styles.pupil} />
      </Animated.View>
      <View style={styles.centerText}>
        <Text style={styles.centerTitle}>the explorer</Text>
        <Text style={styles.centerHint}>your dream type, revealed after 3 nights.</Text>
        <Text style={styles.centerLink}>see how</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  art: {
    flex: 1,
    justifyContent: 'center',
  },
  scroller: {
    flexGrow: 0,
  },
  track: {
    alignItems: 'flex-start',
    gap: CARD_GAP,
    // Room below the cards for their shadow.
    paddingBottom: 48,
  },
  // The shadow sits outside the clipped card so it isn't cut off.
  frame: {
    flex: 1,
    borderRadius: 30,
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)',
  },
  /** Every card is drawn at the design's size, then scaled to fit shorter phones. */
  cardArtwork: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    transformOrigin: [0, 0, 0],
  },
  card: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
  },
  /** The side cards' artwork was drawn on a 210 pt card; scale it up to fill. */
  sideArtwork: {
    width: SIDE_WIDTH,
    height: CARD_HEIGHT / SIDE_SCALE,
    transform: [{ scale: SIDE_SCALE }],
    transformOrigin: [0, 0, 0],
  },
  streak: {
    position: 'absolute',
    backgroundColor: ORANGE,
    transform: [{ rotate: '-8deg' }],
  },
  sideText: {
    position: 'absolute',
    left: 18,
    right: 18,
    gap: 8,
  },
  sideTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.6,
    color: BrandColors.ink,
  },
  sideHint: {
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: BrandColors.ink,
  },
  peopleBlob: {
    position: 'absolute',
    left: -20,
    top: 40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: MOSS,
  },
  peopleEye: {
    position: 'absolute',
    top: 90,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PINK,
  },
  petal: {
    position: 'absolute',
    width: 90,
    height: 54,
    borderRadius: 27,
    backgroundColor: BrandColors.lime,
  },
  explorerBlob: {
    position: 'absolute',
    left: (CARD_WIDTH - 140) / 2,
    top: 42,
    width: 140,
    height: 130,
    borderRadius: 65,
    backgroundColor: BrandColors.ink,
  },
  explorerEye: {
    position: 'absolute',
    left: (CARD_WIDTH - 54) / 2,
    top: 92,
    width: 54,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LILAC,
  },
  pupil: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BrandColors.ink,
  },
  centerText: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 196,
    alignItems: 'center',
    gap: 8,
  },
  centerTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.8,
    textAlign: 'center',
    color: BrandColors.ink,
  },
  centerHint: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: BrandColors.ink,
  },
  centerLink: {
    marginTop: 4,
    fontFamily: BrandFonts.semibold,
    fontSize: 13,
    lineHeight: 15,
    color: BrandColors.ink,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
