import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';
import { getDepartmentLabel } from '@/constants/departments';

type FilterChipsProps = {
  options: string[];
  selected?: string;
  onSelect: (value?: string) => void;
  allLabel?: string;
  useLabels?: boolean;
};

export function FilterChips({
  options,
  selected,
  onSelect,
  allLabel = 'All',
  useLabels = false,
}: FilterChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Chip label={allLabel} active={!selected} onPress={() => onSelect(undefined)} />
      {options.map((option) => (
        <Chip
          key={option}
          label={useLabels ? getDepartmentLabel(option) : option}
          active={selected === option}
          onPress={() => onSelect(option)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
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
      <ThemedText style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </ThemedText>
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
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: LibraryColors.card,
    borderWidth: 1.5,
    borderColor: LibraryColors.border,
    maxWidth: 220,
  },
  chipActive: {
    backgroundColor: LibraryColors.navy,
    borderColor: LibraryColors.navy,
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
