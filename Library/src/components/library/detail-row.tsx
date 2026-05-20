import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type DetailRowProps = {
  label: string;
  value: string;
};

export function DetailRow({ label, value }: DetailRowProps) {
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      row: {
        gap: 4,
        paddingVertical: Spacing.two,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      },
      label: {
        fontSize: 12,
        fontWeight: '700',
        color: c.inkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      },
      value: { fontSize: 15, color: c.ink, lineHeight: 22 },
    }),
  );

  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
    </View>
  );
}
