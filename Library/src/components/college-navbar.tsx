import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/theme-toggle';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

const NAV_LINKS = [
  { label: 'Home', href: '/' as const, key: 'home' as const },
  { label: 'Library', href: '/welcome' as const, key: 'library' as const },
  { label: 'Books', href: '/(tabs)/books' as const, key: 'books' as const },
  { label: 'About', href: '/(tabs)/about' as const, key: 'about' as const },
];

type CollegeNavbarProps = {
  active?: 'home' | 'library' | 'books' | 'about';
};

export function CollegeNavbar({ active = 'home' }: CollegeNavbarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 400;
  const { isTeacher, isStudent, teacher, student, logout } = useAuth();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      wrap: {
        backgroundColor: c.navy,
        paddingHorizontal: Spacing.two,
        paddingBottom: Spacing.two,
        ...Platform.select({
          web: { position: 'sticky' as const, top: 0, zIndex: 100 },
        }),
      },
      bar: {
        maxWidth: MaxContentWidth,
        width: '100%',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        minHeight: 48,
      },
      barCompact: {
        flexWrap: 'nowrap',
        gap: Spacing.one,
      },
      brand: {
        flexShrink: 0,
        paddingRight: Spacing.one,
      },
      brandTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
      },
      brandTitleCompact: {
        fontSize: 15,
      },
      brandSub: {
        color: c.goldLight,
        fontSize: 10,
        fontWeight: '600',
      },
      linksScroll: {
        flex: 1,
        minWidth: 0,
      },
      linksContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 2,
      },
      link: {
        paddingHorizontal: Spacing.two,
        paddingVertical: 8,
        borderRadius: Radius.sm,
      },
      linkActive: {
        backgroundColor: 'rgba(255,255,255,0.18)',
      },
      linkText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: '600',
      },
      linkTextActive: {
        color: '#fff',
        fontWeight: '800',
      },
      authBtn: {
        backgroundColor: c.gold,
        paddingHorizontal: Spacing.two,
        paddingVertical: 8,
        borderRadius: Radius.md,
        flexShrink: 0,
        maxWidth: 88,
      },
      authBtnCompact: {
        maxWidth: 72,
        paddingHorizontal: 10,
      },
      authText: {
        color: c.navy,
        fontSize: 11,
        fontWeight: '800',
        textAlign: 'center',
      },
    }),
  );

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + (compact ? Spacing.one : Spacing.two) }]}>
      <View style={[styles.bar, compact && styles.barCompact]}>
        <Pressable onPress={() => router.replace('/')} style={styles.brand}>
          <ThemedText style={[styles.brandTitle, compact && styles.brandTitleCompact]}>
            MCAET
          </ThemedText>
          <ThemedText style={styles.brandSub}>Akbarpur</ThemedText>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.linksScroll}
          contentContainerStyle={styles.linksContent}>
          {NAV_LINKS.map((link) => {
            const isActive = active === link.key;
            return (
              <Pressable
                key={link.key}
                onPress={() => router.push(link.href)}
                style={[styles.link, isActive && styles.linkActive]}>
                <ThemedText style={[styles.linkText, isActive && styles.linkTextActive]}>
                  {link.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <ThemeToggle onDark compact={compact} />

        {isTeacher || isStudent ? (
          <Pressable onPress={logout} style={[styles.authBtn, compact && styles.authBtnCompact]}>
            <ThemedText style={styles.authText} numberOfLines={1}>
              {compact ? 'Logout' : isTeacher ? teacher?.teacherId : student?.userId}
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/welcome')}
            style={[styles.authBtn, compact && styles.authBtnCompact]}>
            <ThemedText style={styles.authText}>Sign in</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}
