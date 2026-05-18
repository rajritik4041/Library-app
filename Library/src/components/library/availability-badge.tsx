import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LibraryColors, Radius } from '@/constants/theme';
import type { BookStatus } from '@/types/api';

type AvailabilityBadgeProps = {
  status: BookStatus;
  availableCount: number;
  copies: number;
};

export function AvailabilityBadge({ status, availableCount, copies }: AvailabilityBadgeProps) {
  const available = status === 'available';

  return (
    <View style={[styles.badge, available ? styles.available : styles.issued]}>
      <ThemedText style={[styles.text, available ? styles.textAvailable : styles.textIssued]}>
        {available ? `In Library (${availableCount}/${copies})` : 'Not in Library — Issued'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  available: {
    backgroundColor: '#d1fae5',
  },
  issued: {
    backgroundColor: '#fee2e2',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
  textAvailable: {
    color: '#065f46',
  },
  textIssued: {
    color: '#991b1b',
  },
});
