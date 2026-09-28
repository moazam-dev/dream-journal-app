import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SettingsPage } from '@/components/settings/content';
import {
  BellIcon,
  DeleteIcon,
  DownloadIcon,
  ExportIcon,
  FaceIdIcon,
  FeedbackIcon,
  InstagramIcon,
  PasscodeIcon,
  PrivacyIcon,
  TermsIcon,
  TikTokIcon,
} from '@/components/settings/icons';
import { Toggle } from '@/components/settings/parts';
import { BrandFonts as F, SettingsColors as C } from '@/constants/theme';

const GHOST = require('@/assets/images/ghost-body.png');

type MainListProps = {
  reminderSummary: string;
  passcode: boolean;
  faceId: boolean;
  onTogglePasscode: () => void;
  onToggleFaceId: () => void;
  onOpen: (page: SettingsPage) => void;
};

/** The settings list: reminders and locks, your data, the fine print, and where to find us. */
export function MainList({ reminderSummary, passcode, faceId, onTogglePasscode, onToggleFaceId, onOpen }: MainListProps) {
  return (
    <View>
      <Section>
        <Row icon={<BellIcon />} title="reminders" onPress={() => onOpen('reminders')} trailing={<Text style={styles.summary}>{reminderSummary}</Text>} />
        <Row icon={<PasscodeIcon />} title="lock with passcode" trailing={<Toggle on={passcode} onPress={onTogglePasscode} label="lock with passcode" />} />
        <Row icon={<FaceIdIcon />} title="lock with Face ID" trailing={<Toggle on={faceId} onPress={onToggleFaceId} label="lock with Face ID" />} />
      </Section>

      <Section>
        <Row
          icon={<ExportIcon />}
          title="export entries"
          onPress={() => onOpen('export')}
          trailing={
            <View style={styles.download}>
              <DownloadIcon />
            </View>
          }
        />
        <Row icon={<DeleteIcon />} title="delete account" onPress={() => onOpen('delete')} />
        <Row icon={<FeedbackIcon />} title="give feedback" onPress={() => onOpen('feedback')} />
      </Section>

      <Section>
        <Row icon={<TermsIcon />} title="terms of service" onPress={() => onOpen('terms')} />
        <Row icon={<PrivacyIcon />} title="privacy policy" onPress={() => onOpen('privacy')} />
      </Section>

      <Section>
        <Row icon={<InstagramIcon />} title="connect on Instagram" onPress={() => onOpen('insta')} />
        <Row icon={<TikTokIcon />} title="follow us on TikTok" onPress={() => onOpen('tiktok')} />
        <Row icon={<Image source={GHOST} style={styles.ghost} contentFit="contain" tintColor="#fff" />} title="about us" onPress={() => onOpen('about')} />
      </Section>
    </View>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

type RowProps = { icon: ReactNode; title: string; trailing?: ReactNode; onPress?: () => void };

/** One settings row. Rows with `onPress` open a page; the others hold a switch. */
function Row({ icon, title, trailing, onPress }: RowProps) {
  const content = (
    <>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {trailing}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 14 },
  row: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 22 },
  pressed: { opacity: 0.6 },
  icon: { width: 26, alignItems: 'center' },
  title: { flex: 1, fontFamily: F.medium, fontSize: 21, lineHeight: 25, color: C.text },
  summary: { fontFamily: F.regular, fontSize: 15, lineHeight: 18, color: C.muted },
  download: { width: 56, height: 32, borderRadius: 16, backgroundColor: C.light, alignItems: 'center', justifyContent: 'center' },
  ghost: { width: 24, height: 24 },
});
