import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';

type RackFilterProps = {
  racks: string[];
  selected?: string;
  onSelect: (rack?: string) => void;
};

export function RackFilter({ racks, selected, onSelect }: RackFilterProps) {
  if (racks.length === 0) {
    return null;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <RackChip label="All Racks" active={!selected} onPress={() => onSelect(undefined)} />
      {racks.map((rack) => (
        <RackChip
          key={rack}
          label={`Rack ${rack}`}
          active={selected === rack}
          onPress={() => onSelect(rack)}
        />
      ))}
    </ScrollView>
  );
}

function RackChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <ThemedText style={styles.chipIcon}>📍</ThemedText>
      <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: LibraryColors.card,
    borderWidth: 1.5,
    borderColor: LibraryColors.border,
  },
  chipActive: {
    backgroundColor: LibraryColors.accent,
    borderColor: LibraryColors.accent,
  },
  chipIcon: {
    fontSize: 12,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: LibraryColors.navy,
  },
  chipTextActive: {
    color: '#fff',
  },
});
