import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BookStatus } from '@/types/api';

type AvailabilityBadgeProps = {
  status: BookStatus;
  availableCount: number;
  copies: number;
};

export function AvailabilityBadge({ status, availableCount, copies }: AvailabilityBadgeProps) {
  const available = status === 'available';
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radius.pill,
      },
      available: {
        backgroundColor: c.successSoft,
      },
      issued: {
        backgroundColor: c.dangerSoft,
      },
      text: {
        fontSize: 12,
        fontWeight: '800',
      },
      textAvailable: {
        color: c.success,
      },
      textIssued: {
        color: c.danger,
      },
    }),
  );

  return (
    <View style={[styles.badge, available ? styles.available : styles.issued]}>
      <ThemedText style={[styles.text, available ? styles.textAvailable : styles.textIssued]}>
        {available ? `In Library (${availableCount}/${copies})` : 'Not in Library — Issued'}
      </ThemedText>
    </View>
  );
}
