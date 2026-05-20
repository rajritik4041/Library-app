/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { getLibraryPalette } from '@/constants/library-palette';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const palette = getLibraryPalette(scheme);
  const base = Colors[scheme];

  return {
    ...base,
    background: palette.surface,
    backgroundElement: palette.surfaceAlt,
    text: palette.ink,
    textSecondary: palette.inkMuted,
  };
}
