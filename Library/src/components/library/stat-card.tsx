import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLibraryColors } from '@/hooks/use-library-colors';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'navy' | 'gold' | 'teal';
};

export function StatCard({ label, value, hint, accent = 'navy' }: StatCardProps) {
  const colors = useLibraryColors();
  const accentBar =
    accent === 'gold' ? colors.gold : accent === 'teal' ? colors.success : colors.accent;

  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      card: {
        flex: 1,
        minWidth: 140,
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.three,
        paddingTop: Spacing.two,
        borderWidth: 1,
        borderColor: c.border,
        gap: 4,
        overflow: 'hidden',
        shadowColor: c.navy,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      },
      accentBar: {
        height: 4,
        borderRadius: Radius.pill,
        marginBottom: Spacing.one,
        width: 40,
      },
      value: { fontSize: 30, fontWeight: '800', color: c.ink, letterSpacing: -0.5 },
      label: { fontSize: 13, fontWeight: '700', color: c.ink },
      hint: { fontSize: 11, color: c.inkMuted, marginTop: 2 },
    }),
  );

  return (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: accentBar }]} />
      <ThemedText style={styles.value}>{value}</ThemedText>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
    </View>
  );
}
