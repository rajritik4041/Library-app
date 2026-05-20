import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
};

export function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      wrapper: {
        gap: Spacing.two,
        paddingBottom: Spacing.two,
        width: '100%',
        alignItems: 'center',
      },
      badge: {
        alignSelf: 'flex-start',
        backgroundColor: c.navy,
        paddingHorizontal: Spacing.three,
        paddingVertical: 6,
        borderRadius: Radius.pill,
      },
      badgeText: {
        color: c.goldLight,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
      },
      title: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '800',
        color: c.ink,
        textAlign: 'center',
      },
      subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: c.inkMuted,
        textAlign: 'center',
      },
    }),
  );

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
