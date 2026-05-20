import { useMemo } from 'react';

import type { LibraryColorScheme } from '@/constants/library-palette';
import { useLibraryColors } from '@/hooks/use-library-colors';

export function useThemedStyles<T>(factory: (colors: LibraryColorScheme) => T): T {
  const colors = useLibraryColors();
  return useMemo(() => factory(colors), [colors]);
}
