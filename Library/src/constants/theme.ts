/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const LibraryColors = {
  navy: '#0a2342',
  navyMid: '#14325c',
  navyLight: '#1e4a7a',
  accent: '#2563eb',
  accentSoft: '#dbeafe',
  gold: '#d4a017',
  goldLight: '#f5e6b8',
  goldMuted: '#faf3e0',
  card: '#ffffff',
  surface: '#eef3f9',
  surfaceAlt: '#e2eaf4',
  border: '#c5d4e8',
  muted: '#5a6d82',
  success: '#0d9488',
  shadow: 'rgba(10, 35, 66, 0.12)',
} as const;

export const Shadows = {
  card: {
    shadowColor: LibraryColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  hero: {
    shadowColor: LibraryColors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const Colors = {
  light: {
    text: LibraryColors.navy,
    background: LibraryColors.surface,
    backgroundElement: '#e8eef6',
    backgroundSelected: '#d4e0f0',
    textSecondary: LibraryColors.muted,
  },
  dark: {
    text: '#f0f4f8',
    background: '#0a1628',
    backgroundElement: '#152238',
    backgroundSelected: '#1e3354',
    textSecondary: '#9aa8b8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 0 }) ?? 0;
export const WebHeaderInset = Platform.select({ web: 88, default: 0 }) ?? 0;
export const MaxContentWidth = 800;
