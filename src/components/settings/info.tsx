import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ABOUT_ROWS, DOCS, SOCIAL_TILES, SOCIALS } from '@/components/settings/content';
import { PillButton, settingsStyles as S, shapeStyle } from '@/components/settings/parts';
import { BrandFonts as F, SettingsColors as C } from '@/constants/theme';

const GHOST = require('@/assets/images/ghost-body.png');
const TILE_GAP = 3;

/** Terms of service or the privacy policy, as short sections. */
export function DocPage({ doc }: { doc: 'terms' | 'privacy' }) {
  return (
    <View style={styles.doc}>
      <Text style={styles.updated}>last updated september 2026</Text>
      {DOCS[doc].map((section) => (
        <View key={section.heading} style={styles.docSection}>
          <Text style={styles.docHeading}>{section.heading}</Text>
          <Text style={S.body}>{section.body}</Text>
        </View>
      ))}
    </View>
  );
}

/** A preview of the Instagram or TikTok page. The button does nothing yet (UI only). */
export function SocialPage({ network }: { network: 'insta' | 'tiktok' }) {
  const social = SOCIALS[network];
  const [gridWidth, setGridWidth] = useState(0);
  const tile = (gridWidth - TILE_GAP * 2) / 3;
  const shape = Math.round(tile * 0.56);

  return (
    <View style={S.stack}>
      <View style={styles.socialCard}>
        <View style={styles.tiles} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
          {gridWidth > 0 &&
            SOCIAL_TILES.map((t, i) => (
              <View key={i} style={[styles.tile, { width: tile, height: tile, backgroundColor: t.background }]}>
                <View style={[{ width: shape, height: shape, backgroundColor: t.color }, shapeStyle(t.shape, shape)]} />
              </View>
            ))}
        </View>
        <View style={styles.socialText}>
          <Text style={styles.handle}>{social.handle}</Text>
          <Text style={[S.body, styles.blurb]}>{social.blurb}</Text>
        </View>
      </View>
      <PillButton title={social.cta} color={C.light} />
    </View>
  );
}

/** Why afterdream exists, and the version and contact details. */
export function AboutPage() {
  return (
    <View style={S.stack}>
      <View style={styles.aboutHero}>
        <View style={styles.arches}>
          <View style={styles.arch} />
          <View style={[styles.arch, styles.archTall]} />
          <View style={styles.arch} />
        </View>
        <View style={styles.logo}>
          <Image source={GHOST} style={styles.logoGhost} contentFit="contain" tintColor="#fff" />
        </View>
      </View>
      <View style={[S.intro, styles.aboutIntro]}>
        <Text style={S.heading}>a journal for the hours you don’t remember</Text>
        <Text style={S.body}>
          afterdream started with a simple frustration: our best dreams disappeared before breakfast. we built a place to catch them fast, see
          them clearly, and slowly understand what they’re telling us.
        </Text>
      </View>
      <View style={styles.aboutRows}>
        {ABOUT_ROWS.map((row) => (
          <View key={row.key} style={styles.aboutRow}>
            <Text style={styles.aboutKey}>{row.key}</Text>
            <Text style={styles.aboutValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  doc: { gap: 22, paddingHorizontal: 22 },
  updated: { fontFamily: F.regular, fontSize: 14, lineHeight: 17, color: C.muted },
  docSection: { gap: 8, paddingTop: 18, borderTopWidth: 1, borderTopColor: C.line },
  docHeading: { fontFamily: F.medium, fontSize: 20, lineHeight: 23, color: C.text },
  socialCard: { borderRadius: 32, overflow: 'hidden', backgroundColor: C.card },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },
  tile: { alignItems: 'center', justifyContent: 'center' },
  socialText: { paddingVertical: 20, paddingHorizontal: 22, gap: 6 },
  handle: { fontFamily: F.medium, fontSize: 24, lineHeight: 28, color: C.text },
  blurb: { color: 'rgba(255, 255, 255, 0.75)' },
  aboutHero: { height: 300, borderRadius: 32, overflow: 'hidden', backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  arches: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 8 },
  arch: { flex: 1, height: 50, borderTopLeftRadius: 50, borderTopRightRadius: 50, backgroundColor: C.orange },
  archTall: { height: 80 },
  logo: { width: 110, height: 110, borderRadius: 32, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 60 },
  logoGhost: { width: 64, height: 64 },
  aboutIntro: { gap: 12 },
  aboutRows: { marginTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  aboutRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  aboutKey: { fontFamily: F.regular, fontSize: 16, lineHeight: 20, color: 'rgba(255, 255, 255, 0.7)' },
  aboutValue: { fontFamily: F.medium, fontSize: 16, lineHeight: 20, color: C.text },
});
