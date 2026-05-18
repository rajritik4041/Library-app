import type { Href } from 'expo-router';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { useAuth } from '@/context/auth-context';
import { LibraryColors, MaxContentWidth, Spacing } from '@/constants/theme';

const NAV_ITEMS: { name: string; href: Href; label: string }[] = [
  { name: 'home', href: '/index', label: 'Home' },
  { name: 'books', href: '/books', label: 'Books' },
  { name: 'issued', href: '/issued', label: 'Issued' },
  { name: 'teacher', href: '/teacher', label: 'Teacher' },
  { name: 'about', href: '/about', label: 'About' },
];

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const { isTeacher, teacher, logout } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <ThemedView style={styles.headerInner}>
          <View style={styles.brandBlock}>
            <ThemedText style={styles.brandTitle}>EJ MCAET</ThemedText>
            <ThemedText style={styles.brandSub}>College Library</ThemedText>
          </View>
          {isTeacher ? (
            <Pressable onPress={logout} style={styles.authBtn}>
              <ThemedText style={styles.authBtnText}>{teacher?.teacherId} · Logout</ThemedText>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/login')} style={styles.authBtn}>
              <ThemedText style={styles.authBtnText}>Teacher Login</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </View>

      <Tabs>
        <View style={styles.content}>
          <TabSlot style={styles.tabSlot} />
        </View>
        <TabList asChild>
          <CustomTabList paddingBottom={Math.max(insets.bottom, Spacing.two)}>
            {NAV_ITEMS.map((item) => (
              <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
                <TabButton>{item.label}</TabButton>
              </TabTrigger>
            ))}
          </CustomTabList>
        </TabList>
      </Tabs>
    </View>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.tabButton,
          isFocused ? styles.tabButtonFocused : undefined,
          pressed ? styles.pressed : undefined,
        ])
      }>
      <ThemedText style={isFocused ? styles.tabLabelFocused : styles.tabLabel}>{children}</ThemedText>
    </Pressable>
  );
}

function CustomTabList({
  paddingBottom,
  children,
  ...props
}: TabListProps & { paddingBottom?: number }) {
  return (
    <View {...props} style={StyleSheet.flatten([styles.tabBar, { paddingBottom }])}>
      <View style={styles.tabBarInner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LibraryColors.surface,
    paddingTop: Platform.OS === 'web' ? 0 : undefined,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  headerInner: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: LibraryColors.navy,
    borderRadius: 14,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(10, 35, 66, 0.15)' },
    }),
  },
  brandBlock: { gap: 2 },
  brandTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  brandSub: { color: LibraryColors.goldLight, fontSize: 13, fontWeight: '600' },
  authBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 8,
  },
  authBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  content: { flex: 1, minHeight: 0 },
  tabSlot: { flex: 1, height: '100%' },
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: LibraryColors.border,
    backgroundColor: LibraryColors.card,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  tabBarInner: {
    flexDirection: 'row',
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonFocused: {
    backgroundColor: LibraryColors.accentSoft,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LibraryColors.muted,
    textAlign: 'center',
  },
  tabLabelFocused: {
    fontSize: 11,
    fontWeight: '800',
    color: LibraryColors.accent,
    textAlign: 'center',
  },
  pressed: { opacity: 0.75 },
});
