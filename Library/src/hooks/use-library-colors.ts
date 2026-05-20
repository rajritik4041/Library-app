import { useEffect } from 'react';
import { Platform } from 'react-native';

import {
  getLibraryPalette,
  type LibraryColorScheme,
} from '@/constants/library-palette';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useLibraryColors(): LibraryColorScheme {
  const scheme = useColorScheme();
  const resolved = scheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.dataset.libraryTheme = resolved;
  }, [resolved]);

  return getLibraryPalette(resolved);
}
