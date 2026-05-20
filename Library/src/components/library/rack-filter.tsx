import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type RackFilterProps = {
  racks: string[];
  selected?: string;
  onSelect: (rack?: string) => void;
};

export function RackFilter({ racks, selected, onSelect }: RackFilterProps) {
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      row: { flexDirection: 'row', gap: Spacing.two, paddingVertical: Spacing.one },
      chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Radius.pill,
        backgroundColor: c.card,
        borderWidth: 1.5,
        borderColor: c.border,
      },
      chipActive: { backgroundColor: c.accent, borderColor: c.accent },
      chipIcon: { fontSize: 12 },
      chipText: { fontSize: 13, fontWeight: '700', color: c.ink },
      chipTextActive: { color: '#fff' },
    }),
  );

  if (racks.length === 0) {
    return null;
  }

  const renderChip = (label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <ThemedText style={styles.chipIcon}>📍</ThemedText>
      <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>{label}</ThemedText>
    </Pressable>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {renderChip('All Racks', !selected, () => onSelect(undefined))}
      {racks.map((rack) => renderChip(`Rack ${rack}`, selected === rack, () => onSelect(rack)))}
    </ScrollView>
  );
}
