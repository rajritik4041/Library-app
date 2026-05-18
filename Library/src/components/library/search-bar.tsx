import React from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LibraryColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  resultCount?: number;
  rackMatchCount?: number;
  onClear?: () => void;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Title, author, publisher, rack no. (e.g. 12.2)...',
  resultCount,
  rackMatchCount,
  onClear,
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <View style={styles.searchIconWrap}>
          <ThemedText style={styles.icon}>🔍</ThemedText>
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {value.length > 0 && onClear ? (
          <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
            <ThemedText style={styles.clearText}>✕</ThemedText>
          </Pressable>
        ) : null}
      </View>
      {resultCount !== undefined ? (
        <View style={styles.resultRow}>
          <ThemedText themeColor="textSecondary" style={styles.resultText}>
            {resultCount} book{resultCount === 1 ? '' : 's'} found
          </ThemedText>
          {rackMatchCount !== undefined && rackMatchCount > 0 ? (
            <View style={styles.rackHint}>
              <ThemedText style={styles.rackHintText}>
                📍 {rackMatchCount} on matching rack
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: LibraryColors.border,
    overflow: 'hidden',
  },
  searchIconWrap: {
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
  },
  icon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.select({ web: 14, default: Spacing.three }),
    paddingRight: Spacing.two,
    outlineStyle: 'none',
  } as object,
  clearBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  clearText: {
    fontSize: 14,
    color: LibraryColors.muted,
    fontWeight: '700',
  },
  resultRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  resultText: {
    fontSize: 13,
    fontWeight: '500',
  },
  rackHint: {
    backgroundColor: LibraryColors.accentSoft,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  rackHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: LibraryColors.accent,
  },
});
