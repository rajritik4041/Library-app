import { useThemePreference } from '@/context/theme-preference-context';

/** Resolved light/dark scheme (user preference or system). */
export function useColorScheme(): 'light' | 'dark' {
  return useThemePreference().colorScheme;
}
