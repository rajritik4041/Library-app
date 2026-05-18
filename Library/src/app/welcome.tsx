import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CollegeNavbar } from '@/components/college-navbar';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoading, isTeacher, isStudent } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isTeacher) router.replace('/(tabs)/teacher');
    else if (isStudent) router.replace('/(tabs)/issued');
  }, [isLoading, isTeacher, isStudent, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={LibraryColors.navy} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <CollegeNavbar active="library" />
      <ScreenShell scroll={false}>
      <LinearGradient
        colors={[LibraryColors.navy, LibraryColors.navyMid, LibraryColors.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <ThemedText style={styles.heroBadge}>MCAET Central Library</ThemedText>
        <ThemedText style={styles.heroTitle}>Sign in</ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          Choose Student or Teacher to access library services
        </ThemedText>
      </LinearGradient>

      <ThemedText style={styles.prompt}>I am a…</ThemedText>

      <Pressable
        style={({ pressed }) => [styles.roleCard, pressed && styles.roleCardPressed]}
        onPress={() => router.push('/login-student')}>
        <View style={[styles.roleIcon, styles.studentIcon]}>
          <ThemedText style={styles.roleEmoji}>🎓</ThemedText>
        </View>
        <View style={styles.roleBody}>
          <ThemedText style={styles.roleTitle}>Student</ThemedText>
          <ThemedText style={styles.roleDesc}>
            Login with User ID and password from your teacher
          </ThemedText>
        </View>
        <ThemedText style={styles.roleArrow}>→</ThemedText>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.roleCard, pressed && styles.roleCardPressed]}
        onPress={() => router.push('/login-teacher')}>
        <View style={[styles.roleIcon, styles.teacherIcon]}>
          <ThemedText style={styles.roleEmoji}>👩‍🏫</ThemedText>
        </View>
        <View style={styles.roleBody}>
          <ThemedText style={styles.roleTitle}>Teacher</ThemedText>
          <ThemedText style={styles.roleDesc}>
            Manage books, register students, issue and return books
          </ThemedText>
        </View>
        <ThemedText style={styles.roleArrow}>→</ThemedText>
      </Pressable>

      <Pressable style={styles.browseBtn} onPress={() => router.replace('/(tabs)')}>
        <ThemedText style={styles.browseText}>Browse catalog without login</ThemedText>
      </Pressable>

      <Pressable onPress={() => router.replace('/')}>
        <ThemedText style={styles.back}>← Back to college home</ThemedText>
      </Pressable>
      </ScreenShell>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: LibraryColors.surface },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LibraryColors.surface,
  },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LibraryColors.gold,
    color: LibraryColors.navy,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22 },
  prompt: {
    fontSize: 18,
    fontWeight: '800',
    color: LibraryColors.navy,
    marginBottom: Spacing.three,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    marginBottom: Spacing.three,
  },
  roleCardPressed: { borderColor: LibraryColors.accent },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentIcon: { backgroundColor: LibraryColors.accentSoft },
  teacherIcon: { backgroundColor: LibraryColors.goldMuted },
  roleEmoji: { fontSize: 28 },
  roleBody: { flex: 1, gap: 4 },
  roleTitle: { fontSize: 18, fontWeight: '800', color: LibraryColors.navy },
  roleDesc: { fontSize: 13, color: LibraryColors.muted, lineHeight: 18 },
  roleArrow: { fontSize: 22, color: LibraryColors.accent, fontWeight: '700' },
  browseBtn: { marginTop: Spacing.two, alignItems: 'center', padding: Spacing.three },
  browseText: { color: LibraryColors.accent, fontWeight: '600', fontSize: 14 },
  back: {
    color: LibraryColors.muted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});
