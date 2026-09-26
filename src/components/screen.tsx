import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  /**
   * Which sides should avoid the notch / home indicator.
   * Screens with a navigation header don't need 'top' because the header already handles it.
   */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

/** Wrapper used by every screen: safe-area padding, background color and side padding. */
export function Screen({ children, edges = ['bottom', 'left', 'right'], style }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
});
