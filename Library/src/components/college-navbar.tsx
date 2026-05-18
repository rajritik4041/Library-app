import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { LibraryColors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

const NAV_LINKS = [
  { label: 'Home', href: '/' as const },
  { label: 'Library', href: '/welcome' as const },
  { label: 'Books', href: '/(tabs)/books' as const },
  { label: 'About', href: '/(tabs)/about' as const },
];

type CollegeNavbarProps = {
  active?: 'home' | 'library' | 'books' | 'about';
};

export function CollegeNavbar({ active = 'home' }: CollegeNavbarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTeacher, isStudent, teacher, student, logout } = useAuth();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.bar}>
        <Pressable onPress={() => router.replace('/')} style={styles.brand}>
          <ThemedText style={styles.brandTitle}>MCAET</ThemedText>
          <ThemedText style={styles.brandSub}>Akbarpur</ThemedText>
        </Pressable>

        <View style={styles.links}>
          {NAV_LINKS.map((link) => {
            const key = link.label.toLowerCase() as 'home' | 'library' | 'books' | 'about';
            const isActive = active === key;
            return (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href)}
                style={[styles.link, isActive && styles.linkActive]}>
                <ThemedText style={[styles.linkText, isActive && styles.linkTextActive]}>
                  {link.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {isTeacher || isStudent ? (
          <Pressable onPress={logout} style={styles.authBtn}>
            <ThemedText style={styles.authText} numberOfLines={1}>
              {isTeacher ? teacher?.teacherId : student?.userId}
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/welcome')} style={styles.authBtn}>
            <ThemedText style={styles.authText}>Sign in</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: LibraryColors.navy,
    paddingHorizontal: Spacing.three,
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
    flexWrap: 'wrap',
  },
  brand: { marginRight: Spacing.two },
  brandTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  brandSub: { color: LibraryColors.goldLight, fontSize: 11, fontWeight: '600' },
  links: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    justifyContent: 'center',
  },
  link: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  linkActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  linkText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  linkTextActive: { color: '#fff', fontWeight: '800' },
  authBtn: {
    backgroundColor: LibraryColors.gold,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.md,
    maxWidth: 100,
  },
  authText: { color: LibraryColors.navy, fontSize: 12, fontWeight: '800' },
});
