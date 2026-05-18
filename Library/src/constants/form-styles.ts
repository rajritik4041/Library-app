import { Platform, StyleSheet } from 'react-native';

import { LibraryColors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

/** Black text + white inputs for readable forms across the app */
export const FormColors = {
  text: '#000000',
  textMuted: '#333333',
  placeholder: '#666666',
  inputBg: '#ffffff',
  inputBorder: LibraryColors.border,
} as const;

export const FormStyles = StyleSheet.create({
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
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: FormColors.text,
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  label: {
    fontWeight: '700',
    color: FormColors.text,
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: FormColors.inputBorder,
    borderRadius: Radius.md,
    padding: Spacing.three,
    fontSize: 16,
    color: FormColors.text,
    backgroundColor: FormColors.inputBg,
    outlineStyle: 'none',
    ...Platform.select({ web: { outlineWidth: 0 } }),
  } as object,
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: FormColors.textMuted,
  },
  hint: {
    fontSize: 13,
    color: FormColors.textMuted,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 15,
    color: FormColors.text,
    lineHeight: 22,
  },
  metaText: {
    fontSize: 13,
    color: FormColors.textMuted,
  },
});

export function inputStyle(extra?: object) {
  return [FormStyles.input, extra];
}
