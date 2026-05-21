import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const isWeb = Platform.OS === 'web';

/** Segoe UI / system stack on web & Electron — matches global.css --font-display. */
export const webTypography = Platform.select({
  web: {
    fontFamily:
      "'Segoe UI', Inter, ui-sans-serif, system-ui, sans-serif",
  },
  default: {},
}) as TextStyle;

export type AppFontWeight = '500' | '600' | '700' | '800' | '900';

/** Web/desktop fonts render lighter than Android — bump one step. */
export function fw(weight: AppFontWeight): TextStyle['fontWeight'] {
  if (!isWeb) return weight;
  const map: Record<AppFontWeight, AppFontWeight> = {
    '500': '600',
    '600': '700',
    '700': '800',
    '800': '900',
    '900': '900',
  };
  return map[weight];
}

export type ElevationLevel = 'card' | 'raised' | 'hero' | 'modal' | 'header';

/** Native shadow + web box-shadow so cards look crisp on Windows/Mac/Electron. */
export function libraryElevation(
  shadowColor: string,
  level: ElevationLevel = 'card',
): ViewStyle {
  const navy = '#0a2342';

  const web: Record<ElevationLevel, ViewStyle> = {
    card: {
      boxShadow: `0 4px 16px ${shadowColor}, 0 2px 6px rgba(10, 35, 66, 0.08)`,
    },
    raised: {
      boxShadow: `0 2px 10px ${shadowColor}, 0 1px 3px rgba(10, 35, 66, 0.06)`,
    },
    hero: {
      boxShadow: `0 10px 32px rgba(10, 35, 66, 0.28), 0 4px 14px rgba(10, 35, 66, 0.14)`,
    },
    modal: {
      boxShadow: `0 12px 40px rgba(0, 0, 0, 0.22), 0 4px 12px ${shadowColor}`,
    },
    header: {
      boxShadow: '0 4px 20px rgba(10, 35, 66, 0.18)',
    },
  };

  const native: Record<ElevationLevel, ViewStyle> = {
    card: {
      shadowColor: navy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    raised: {
      shadowColor: navy,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    hero: {
      shadowColor: navy,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 20,
      elevation: 8,
    },
    modal: {
      shadowColor: navy,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 10,
    },
    header: {
      shadowColor: navy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
  };

  return Platform.select({
    web: web[level],
    default: native[level],
  }) as ViewStyle;
}

/** Slightly stronger borders on web where elevation is simulated with shadow. */
export function cardBorder(borderColor: string): Pick<ViewStyle, 'borderWidth' | 'borderColor'> {
  return {
    borderWidth: isWeb ? 1.5 : 1,
    borderColor,
  };
}
