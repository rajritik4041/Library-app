import { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';

import type { LibraryColorScheme } from '@/constants/library-palette';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useLibraryColors } from '@/hooks/use-library-colors';

function createFormStyles(c: LibraryColorScheme) {
  return StyleSheet.create({
    page: {
      flexGrow: 1,
      width: '100%',
      maxWidth: MaxContentWidth,
      alignSelf: 'center',
      padding: Spacing.four,
      paddingBottom: 120,
      gap: Spacing.four,
      alignItems: 'stretch',
    },
    pageCentered: {
      flexGrow: 1,
      width: '100%',
      maxWidth: MaxContentWidth,
      alignSelf: 'center',
      padding: Spacing.four,
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.three,
    },
    card: {
      width: '100%',
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      padding: Spacing.four,
      gap: Spacing.two,
      borderWidth: 1,
      borderColor: c.border,
      alignSelf: 'center',
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: c.ink,
      marginBottom: Spacing.one,
      textAlign: 'center',
    },
    label: {
      fontWeight: '700',
      color: c.ink,
      fontSize: 14,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.md,
      padding: Spacing.three,
      fontSize: 16,
      color: c.inputText,
      backgroundColor: c.inputBg,
      outlineStyle: 'none',
      ...Platform.select({ web: { outlineWidth: 0 } }),
    } as object,
    inputDisabled: {
      backgroundColor: c.inputDisabledBg,
      color: c.inkMuted,
    },
    hint: {
      fontSize: 13,
      color: c.inkMuted,
      textAlign: 'center',
    },
    bodyText: {
      fontSize: 15,
      color: c.ink,
      lineHeight: 22,
    },
    metaText: {
      fontSize: 13,
      color: c.inkMuted,
    },
  });
}

export function useFormStyles() {
  const colors = useLibraryColors();
  const styles = useMemo(() => createFormStyles(colors), [colors]);
  return { styles, colors };
}

export function useInputStyle(extra?: object) {
  const { styles } = useFormStyles();
  return [styles.input, extra];
}
