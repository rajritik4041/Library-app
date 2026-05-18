import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'navy' | 'gold' | 'teal';
};

export function StatCard({ label, value, hint, accent = 'navy' }: StatCardProps) {
  const accentBar =
    accent === 'gold' ? LibraryColors.gold : accent === 'teal' ? LibraryColors.success : LibraryColors.accent;

  return (
    <View style={styles.card}>
      <View style={StyleSheet.flatten([styles.accentBar, { backgroundColor: accentBar }])} />
      <ThemedText style={styles.value}>{value}</ThemedText>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    paddingTop: Spacing.two,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    gap: 4,
    overflow: 'hidden',
    shadowColor: LibraryColors.navy,
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
  value: {
    fontSize: 30,
    fontWeight: '800',
    color: LibraryColors.navy,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: LibraryColors.navy,
  },
  hint: {
    fontSize: 11,
    color: LibraryColors.muted,
    marginTop: 2,
  },
});
