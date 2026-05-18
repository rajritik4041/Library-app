import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LibraryColors, Spacing } from '@/constants/theme';

type DetailRowProps = {
  label: string;
  value: string;
};

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 4,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: LibraryColors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: LibraryColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 15,
    color: LibraryColors.navy,
    lineHeight: 22,
  },
});
