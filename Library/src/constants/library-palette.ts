import { Platform } from 'react-native';

/** Semantic library palette — light & dark (system theme). */
export type LibraryColorScheme = {
  navy: string;
  navyMid: string;
  navyLight: string;
  /** Primary text (was often LibraryColors.navy on light cards) */
  ink: string;
  /** Secondary / muted text */
  inkMuted: string;
  accent: string;
  accentSoft: string;
  gold: string;
  goldLight: string;
  goldMuted: string;
  card: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  muted: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warningBg: string;
  warningText: string;
  shadow: string;
  /** Form fields */
  inputBg: string;
  inputText: string;
  inputPlaceholder: string;
  inputDisabledBg: string;
};

export const libraryPaletteLight: LibraryColorScheme = {
  navy: '#0a2342',
  navyMid: '#14325c',
  navyLight: '#1e4a7a',
  ink: '#0a2342',
  inkMuted: '#5a6d82',
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
  successSoft: '#d1fae5',
  danger: '#991b1b',
  dangerSoft: '#fee2e2',
  warningBg: '#fef3c7',
  warningText: '#92400e',
  shadow: 'rgba(10, 35, 66, 0.12)',
  inputBg: '#ffffff',
  inputText: '#000000',
  inputPlaceholder: '#666666',
  inputDisabledBg: '#f0f0f0',
};

export const libraryPaletteDark: LibraryColorScheme = {
  navy: '#0a2342',
  navyMid: '#14325c',
  navyLight: '#1e4a7a',
  ink: '#e8eef4',
  inkMuted: '#94a3b8',
  accent: '#60a5fa',
  accentSoft: '#1e3a5f',
  gold: '#d4a017',
  goldLight: '#f5e6b8',
  goldMuted: '#2a2410',
  card: '#152238',
  surface: '#0a1628',
  surfaceAlt: '#1a2d4a',
  border: '#2a4060',
  muted: '#94a3b8',
  success: '#2dd4bf',
  successSoft: '#134e4a',
  danger: '#fca5a5',
  dangerSoft: '#450a0a',
  warningBg: '#3d2e0a',
  warningText: '#fcd34d',
  shadow: 'rgba(0, 0, 0, 0.35)',
  inputBg: '#1a2d4a',
  inputText: '#f0f4f8',
  inputPlaceholder: '#94a3b8',
  inputDisabledBg: '#152238',
};

/** @deprecated Use useLibraryColors() — kept for gradual migration */
export const LibraryColors = libraryPaletteLight;

/** Desktop/web (Electron) — slightly richer contrast so UI matches Android depth. */
function webPaletteTweaks(base: LibraryColorScheme, scheme: 'light' | 'dark'): LibraryColorScheme {
  if (Platform.OS !== 'web') return base;
  if (scheme === 'dark') {
    return {
      ...base,
      border: '#324d70',
      inkMuted: '#a8b8cc',
      card: '#172a45',
    };
  }
  return {
    ...base,
    border: '#b0c2d8',
    inkMuted: '#4a5d72',
    surface: '#e8eef6',
    surfaceAlt: '#dce6f2',
  };
}

export function getLibraryPalette(scheme: 'light' | 'dark' | null | undefined): LibraryColorScheme {
  const resolved = scheme === 'dark' ? 'dark' : 'light';
  const base = resolved === 'dark' ? libraryPaletteDark : libraryPaletteLight;
  return webPaletteTweaks(base, resolved);
}
