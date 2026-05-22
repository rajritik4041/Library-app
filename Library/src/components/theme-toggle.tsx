import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-preference-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type ThemeToggleProps = {
  /** Light text on dark navbar */
  onDark?: boolean;
  compact?: boolean;
};

export function ThemeToggle({ onDark = false, compact = false }: ThemeToggleProps) {
  const { colorScheme, toggleTheme } = useThemePreference();
  const isDark = colorScheme === 'dark';
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: compact ? 10 : Spacing.two,
        paddingVertical: 8,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: onDark ? 'rgba(255,255,255,0.25)' : c.border,
        backgroundColor: onDark ? 'rgba(255,255,255,0.12)' : c.surfaceAlt,
        flexShrink: 0,
      },
      pressed: { opacity: 0.85 },
      icon: { fontSize: compact ? 16 : 18 },
      label: {
        fontSize: 11,
        fontWeight: '700',
        color: onDark ? '#fff' : c.ink,
      },
    }),
  );

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <ThemedText style={styles.icon}>{isDark ? '☀️' : '🌙'} </ThemedText>
      {!compact ? (
        <ThemedText style={styles.label}>{isDark ? 'Light' : 'Dark'}</ThemedText>
      ) : null}
    </Pressable>
  );
}
