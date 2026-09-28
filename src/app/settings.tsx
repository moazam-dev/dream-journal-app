import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PAGE_TITLES, type SettingsPage } from '@/components/settings/content';
import { DeleteAccountPage, ExportPage } from '@/components/settings/data';
import { FeedbackPage } from '@/components/settings/feedback';
import { BackIcon } from '@/components/settings/icons';
import { AboutPage, DocPage, SocialPage } from '@/components/settings/info';
import { FaceIdPage, PasscodePage } from '@/components/settings/lock';
import { MainList } from '@/components/settings/main-list';
import { RemindersPage, type ReminderSettings } from '@/components/settings/reminders';
import { animate, FADE, TOAST } from '@/components/today/motion';
import { BrandFonts as F, SettingsColors as C } from '@/constants/theme';

const TOAST_MS = 1800;

/**
 * Settings ("/settings"), from the Afterdream Settings design, opened from the cog on
 * Patterns. Each row opens its page in place; the back button returns to the list.
 * UI only for now: nothing here is saved, sent, exported or deleted.
 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState<SettingsPage>('main');
  const [passcode, setPasscode] = useState(false);
  const [faceId, setFaceId] = useState(false);
  const [reminders, setReminders] = useState<ReminderSettings>({ on: true, time: '7:30am', days: Array(7).fill(true), bedtime: true });
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroll = useRef<ScrollView>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const open = useCallback((next: SettingsPage) => {
    setPage(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, []);

  // Android's back button returns to the list from a page instead of leaving settings.
  useFocusEffect(
    useCallback(() => {
      if (page === 'main') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        open('main');
        return true;
      });
      return () => sub.remove();
    }, [page, open])
  );

  function back() {
    if (page !== 'main') open('main');
    else if (router.canGoBack()) router.back();
    else router.replace('/patterns');
  }

  function flash(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((current) => ({ id: (current?.id ?? 0) + 1, text }));
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  function togglePasscode() {
    if (!passcode) return open('passcode');
    setPasscode(false);
    flash('passcode off');
  }

  function toggleFaceId() {
    if (!faceId) return open('face');
    setFaceId(false);
    flash('Face ID off');
  }

  function renderPage() {
    switch (page) {
      case 'main':
        return (
          <MainList
            reminderSummary={reminders.on ? reminders.time : 'off'}
            passcode={passcode}
            faceId={faceId}
            onTogglePasscode={togglePasscode}
            onToggleFaceId={toggleFaceId}
            onOpen={open}
          />
        );
      case 'reminders':
        return <RemindersPage value={reminders} onChange={setReminders} />;
      case 'passcode':
        return (
          <PasscodePage
            onSet={() => {
              setPasscode(true);
              open('main');
              flash('passcode on');
            }}
          />
        );
      case 'face':
        return (
          <FaceIdPage
            on={faceId}
            onToggle={() => {
              setFaceId(!faceId);
              if (!faceId) {
                open('main');
                flash('Face ID on');
              }
            }}
          />
        );
      case 'export':
        return <ExportPage onSave={() => flash('saved to files')} />;
      case 'delete':
        return (
          <DeleteAccountPage
            onExport={() => open('export')}
            onDelete={() => {
              open('main');
              flash('account scheduled for deletion');
            }}
          />
        );
      case 'feedback':
        return <FeedbackPage />;
      case 'terms':
      case 'privacy':
        return <DocPage doc={page} />;
      case 'insta':
      case 'tiktok':
        return <SocialPage network={page} />;
      case 'about':
        return <AboutPage />;
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        ref={scroll}
        style={{ marginTop: insets.top }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="back"
            onPress={back}
            hitSlop={4}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <BackIcon />
          </Pressable>
        </View>
        <Animated.View key={page} style={animate(reduceMotion, { animationName: FADE, animationDuration: 250 })}>
          <Text style={styles.title} accessibilityRole="header">
            {PAGE_TITLES[page]}
          </Text>
          {renderPage()}
        </Animated.View>
      </ScrollView>

      {toast && (
        <Animated.View
          key={toast.id}
          pointerEvents="none"
          style={[
            styles.toast,
            { bottom: insets.bottom + 40 },
            animate(reduceMotion, { animationName: TOAST, animationDuration: TOAST_MS, animationTimingFunction: 'ease' }),
          ]}
          accessibilityLiveRegion="polite">
          <Text style={styles.toastText}>{toast.text}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  top: { paddingTop: 14, paddingHorizontal: 20 },
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.button, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  title: { marginTop: 28, marginBottom: 26, marginHorizontal: 22, fontFamily: F.medium, fontSize: 54, lineHeight: 58, letterSpacing: -2.4, color: C.text },
  toast: { position: 'absolute', alignSelf: 'center', height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: C.lime, justifyContent: 'center' },
  toastText: { fontFamily: F.semibold, fontSize: 14, lineHeight: 17, color: C.ink },
});
