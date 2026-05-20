import React, { type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, WebHeaderInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenShellProps = {
  children: ReactNode;
  scroll?: boolean;
  /** Center content vertically (welcome / login). */
  centered?: boolean;
};

export function ScreenShell({ children, scroll = true, centered = false }: ScreenShellProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const bottomPad = insets.bottom + BottomTabInset + Spacing.three;
  const topPad = Platform.OS === 'web' ? WebHeaderInset + Spacing.two : insets.top + Spacing.three;

  const content = (
    <ThemedView
      style={[
        styles.inner,
        { paddingTop: topPad, paddingBottom: bottomPad },
        centered && styles.innerCentered,
      ]}>
      {children}
    </ThemedView>
  );

  if (!scroll) {
    return (
      <ThemedView style={[styles.root, styles.rootCentered, { backgroundColor: theme.background }]}>
        {content}
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.scrollContent, centered && styles.scrollCentered]}
      keyboardShouldPersistTaps="handled">
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootCentered: {
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  scrollCentered: {
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    flexGrow: 1,
    ...Platform.select({
      web: {
        paddingTop: Spacing.five,
      },
    }),
  },
  innerCentered: {
    justifyContent: 'center',
    flexGrow: 1,
  },
});
