import React from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLibraryColors } from '@/hooks/use-library-colors';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { cardBorder, libraryElevation, webTextInputProps, webTypography } from '@/lib/platform-styles';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  resultCount?: number;
  resultUnit?: string;
  rackMatchCount?: number;
  onClear?: () => void;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Title, author, publisher, rack no. (e.g. 12.2)...',
  resultCount,
  resultUnit = 'book',
  rackMatchCount,
  onClear,
}: SearchBarProps) {
  const colors = useLibraryColors();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      wrapper: { gap: Spacing.two },
      inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.inputBg,
        borderRadius: Radius.lg,
        ...cardBorder(c.border),
        overflow: 'hidden',
        ...libraryElevation(c.shadow, 'raised'),
      },
      searchIconWrap: { paddingLeft: Spacing.three, paddingRight: Spacing.one },
      icon: { fontSize: 18 },
      input: {
        flex: 1,
        fontSize: 16,
        color: c.inputText,
        backgroundColor: c.inputBg,
        paddingVertical: Platform.select({ web: 14, default: Spacing.three }),
        paddingRight: Spacing.two,
        outlineStyle: 'none',
        ...webTypography,
        ...Platform.select({ web: { outlineWidth: 0 } }),
      } as object,
      clearBtn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
      clearText: { fontSize: 14, color: c.inkMuted, fontWeight: '700' },
      resultRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
      resultText: { fontSize: 13, fontWeight: '500', color: c.inkMuted },
      rackHint: {
        backgroundColor: c.accentSoft,
        paddingHorizontal: Spacing.two,
        paddingVertical: 4,
        borderRadius: Radius.pill,
      },
      rackHintText: { fontSize: 12, fontWeight: '600', color: c.accent },
    }),
  );

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
          placeholderTextColor={colors.inputPlaceholder}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          {...webTextInputProps}
        />
        {value.length > 0 && onClear ? (
          <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
            <ThemedText style={styles.clearText}>✕</ThemedText>
          </Pressable>
        ) : null}
      </View>
      {resultCount !== undefined ? (
        <View style={styles.resultRow}>
          <ThemedText style={styles.resultText}>
            {resultCount} {resultUnit}
            {resultCount === 1 ? '' : 's'} found
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
