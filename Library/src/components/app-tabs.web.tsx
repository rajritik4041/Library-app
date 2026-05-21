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
import { Platform, Pressable, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/theme-toggle';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { useAuth } from '@/context/auth-context';
import { COLLEGE } from '@/constants/college-branding';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { libraryElevation } from '@/lib/platform-styles';

const NAV_ITEMS: { name: string; href: Href; label: string }[] = [
  { name: 'index', href: '/(tabs)', label: 'Home' },
  { name: 'books', href: '/books', label: 'Books' },
  { name: 'issued', href: '/issued', label: 'Issued' },
  { name: 'dean', href: '/dean', label: 'Dean' },
  { name: 'teacher', href: '/teacher', label: 'Teacher' },
  { name: 'history', href: '/history', label: 'History' },
  { name: 'departments', href: '/departments', label: 'Depts' },
  { name: 'about', href: '/about', label: 'About' },
];

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const { isStaff, isDean, isTeacher, isStudent, teacher, dean, student, logout } = useAuth();
  const navItems = NAV_ITEMS.filter((item) => {
    if (item.name === 'dean') return isDean;
    if (item.name === 'teacher' || item.name === 'history') return isStaff;
    return true;
  });
  const router = useRouter();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      root: {
        flex: 1,
        backgroundColor: c.surface,
        paddingTop: Platform.OS === 'web' ? 0 : undefined,
      },
      header: {
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.two,
        paddingBottom: Spacing.two,
      },
      headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        flexShrink: 0,
      },
      headerInner: {
        maxWidth: MaxContentWidth,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: c.navy,
        borderRadius: 14,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.four,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...libraryElevation(c.shadow, 'header'),
      },
      brandBlock: { gap: 2 },
      brandTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
      brandSub: { color: c.goldLight, fontSize: 13, fontWeight: '600' },
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
        borderTopWidth: 1.5,
        borderTopColor: c.border,
        backgroundColor: c.card,
        paddingTop: Spacing.two,
        paddingHorizontal: Spacing.one,
        ...libraryElevation(c.shadow, 'raised'),
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
        backgroundColor: c.accentSoft,
      },
      tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: c.inkMuted,
        textAlign: 'center',
      },
      tabLabelFocused: {
        fontSize: 11,
        fontWeight: '800',
        color: c.accent,
        textAlign: 'center',
      },
      pressed: { opacity: 0.75 },
    }),
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <ThemedView style={styles.headerInner}>
          <View style={styles.brandBlock}>
            <ThemedText style={styles.brandTitle}>{COLLEGE.shortName}</ThemedText>
            <ThemedText style={styles.brandSub}>{COLLEGE.libraryName}</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <ThemeToggle onDark compact />
            {isStaff || isStudent ? (
              <Pressable onPress={logout} style={styles.authBtn}>
                <ThemedText style={styles.authBtnText}>
                  {isDean
                    ? `${dean?.deanId} · Logout`
                    : isTeacher
                      ? `${teacher?.teacherId} · Logout`
                      : `${student?.userId} · Logout`}
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push('/welcome')} style={styles.authBtn}>
                <ThemedText style={styles.authBtnText}>Sign in</ThemedText>
              </Pressable>
            )}
          </View>
        </ThemedView>
      </View>

      <Tabs>
        <View style={styles.content}>
          <TabSlot style={styles.tabSlot} />
        </View>
        <TabList asChild>
          <CustomTabList styles={styles} paddingBottom={Math.max(insets.bottom, Spacing.two)}>
            {navItems.map((item) => (
              <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
                <TabButton styles={styles}>{item.label}</TabButton>
              </TabTrigger>
            ))}
          </CustomTabList>
        </TabList>
      </Tabs>
    </View>
  );
}

type TabStyles = ReturnType<typeof useThemedStyles<ReturnType<typeof StyleSheet.create>>>;

export function TabButton({
  children,
  isFocused,
  styles,
  ...props
}: TabTriggerSlotProps & { styles: TabStyles }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }): ViewStyle =>
        StyleSheet.flatten([
          styles.tabButton,
          isFocused ? styles.tabButtonFocused : undefined,
          pressed ? styles.pressed : undefined,
        ]) as ViewStyle
      }>
      <ThemedText
        style={(isFocused ? styles.tabLabelFocused : styles.tabLabel) as TextStyle}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

function CustomTabList({
  paddingBottom,
  children,
  styles,
  ...props
}: TabListProps & { paddingBottom?: number; styles: TabStyles }) {
  return (
    <View
      {...props}
      style={StyleSheet.flatten([styles.tabBar, { paddingBottom }]) as ViewStyle}>
      <View style={styles.tabBarInner as ViewStyle}>{children}</View>
    </View>
  );
}
