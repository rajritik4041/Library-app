import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { LibraryColors, MaxContentWidth, Spacing } from '@/constants/theme';

const TAB_ICONS = {
  index: require('@/assets/images/tabIcons/home.png'),
  books: require('@/assets/images/tabIcons/explore.png'),
  issued: require('@/assets/images/tabIcons/explore.png'),
  teacher: require('@/assets/images/tabIcons/home.png'),
  history: require('@/assets/images/tabIcons/explore.png'),
  about: require('@/assets/images/tabIcons/home.png'),
} as const;

function TabIcon({ name, focused }: { name: keyof typeof TAB_ICONS; focused: boolean }) {
  return (
    <Image
      source={TAB_ICONS[name]}
      style={{
        width: 22,
        height: 22,
        tintColor: focused ? LibraryColors.accent : LibraryColors.muted,
      }}
      resizeMode="contain"
    />
  );
}

function TabHeader() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const { isTeacher, isStudent, teacher, student, logout } = useAuth();
  const router = useRouter();

  return (
    <View style={[styles.headerWrap, { paddingTop: insets.top + Spacing.one }]}>
      <View style={[styles.headerBar, compact && styles.headerBarCompact]}>
        <Pressable onPress={() => router.replace('/')} style={styles.brandBlock}>
          <ThemedText style={[styles.brandTitle, compact && styles.brandTitleCompact]}>
            EJ MCAET
          </ThemedText>
          <ThemedText style={styles.brandSub}>College Library</ThemedText>
        </Pressable>

        <View style={styles.headerActions}>
          {isTeacher || isStudent ? (
            <Pressable onPress={logout} style={styles.authBtn}>
              <ThemedText style={styles.authBtnText} numberOfLines={1}>
                {compact ? 'Out' : isTeacher ? `${teacher?.teacherId} · Logout` : `${student?.userId} · Logout`}
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/welcome')} style={styles.authBtn}>
              <ThemedText style={styles.authBtnText}>Sign in</ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const { isTeacher } = useAuth();
  const tabBarHeight = 56 + Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6);

  return (
    <Tabs
      screenOptions={{
        header: () => <TabHeader />,
        tabBarActiveTintColor: LibraryColors.accent,
        tabBarInactiveTintColor: LibraryColors.muted,
        tabBarStyle: {
          backgroundColor: LibraryColors.card,
          borderTopColor: LibraryColors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        lazy: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="books"
        options={{
          title: 'Books',
          tabBarIcon: ({ focused }) => <TabIcon name="books" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="issued"
        options={{
          title: 'Issued',
          tabBarIcon: ({ focused }) => <TabIcon name="issued" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="teacher"
        options={{
          title: 'Teacher',
          href: isTeacher ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="teacher" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          href: isTeacher ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="history" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="departments"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ focused }) => <TabIcon name="about" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    backgroundColor: LibraryColors.surface,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerBar: {
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
    gap: Spacing.two,
    elevation: 4,
    shadowColor: LibraryColors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerBarCompact: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  brandBlock: {
    flexShrink: 1,
    gap: 2,
  },
  brandTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  brandTitleCompact: {
    fontSize: 16,
  },
  brandSub: {
    color: LibraryColors.goldLight,
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexShrink: 0,
  },
  authBtn: {
    backgroundColor: LibraryColors.gold,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 10,
    maxWidth: 160,
  },
  authBtnText: {
    color: LibraryColors.navy,
    fontSize: 11,
    fontWeight: '800',
  },
});
