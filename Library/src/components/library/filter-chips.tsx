import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getDepartmentLabel } from '@/constants/departments';
import { Radius, Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

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
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      row: { flexDirection: 'row', gap: Spacing.two, paddingVertical: Spacing.one },
      chip: {
        paddingHorizontal: Spacing.three,
        paddingVertical: 10,
        borderRadius: Radius.pill,
        backgroundColor: c.card,
        borderWidth: 1.5,
        borderColor: c.border,
        maxWidth: 220,
      },
      chipActive: { backgroundColor: c.navy, borderColor: c.navy },
      chipText: { fontSize: 13, fontWeight: '700', color: c.ink },
      chipTextActive: { color: '#fff' },
    }),
  );

  const renderChip = (label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <ThemedText style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {renderChip(allLabel, !selected, () => onSelect(undefined))}
      {options.map((option) =>
        renderChip(
          useLabels ? getDepartmentLabel(option) : option,
          selected === option,
          () => onSelect(option),
        ),
      )}
    </ScrollView>
  );
}
