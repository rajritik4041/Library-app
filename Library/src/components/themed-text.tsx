import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const webTextBase = Platform.select({
  web: { fontFamily: Fonts.sans as string },
  default: {},
});

const styles = StyleSheet.create({
  small: {
    ...webTextBase,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: Platform.select({ web: 600, default: 500 }),
  },
  smallBold: {
    ...webTextBase,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: Platform.select({ web: 800, default: 700 }),
  },
  default: {
    ...webTextBase,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: Platform.select({ web: 600, default: 500 }),
  },
  title: {
    ...webTextBase,
    fontSize: 48,
    fontWeight: Platform.select({ web: 700, default: 600 }),
    lineHeight: 52,
  },
  subtitle: {
    ...webTextBase,
    fontSize: 32,
    lineHeight: 44,
    fontWeight: Platform.select({ web: 700, default: 600 }),
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
