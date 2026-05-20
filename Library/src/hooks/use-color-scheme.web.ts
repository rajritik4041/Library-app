import { useEffect, useState } from 'react';

import { useThemePreference } from '@/context/theme-preference-context';

/**
 * Web: wait for hydration, then use user theme preference (not only system).
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { colorScheme } = useThemePreference();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
