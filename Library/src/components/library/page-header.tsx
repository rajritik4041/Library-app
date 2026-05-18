import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FormColors } from '@/constants/form-styles';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
};

export function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <View style={styles.wrapper}>
      {badge ? (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{badge}</ThemedText>
        </View>
      ) : null}
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    width: '100%',
    alignItems: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: LibraryColors.navy,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  badgeText: {
    color: LibraryColors.goldLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: FormColors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: FormColors.textMuted,
    textAlign: 'center',
  },
});
