import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CollegeNavbar } from '@/components/college-navbar';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { COLLEGE } from '@/constants/college-branding';
import { Radius, Spacing } from '@/constants/theme';
import { useLibraryColors } from '@/hooks/use-library-colors';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoading, isTeacher, isDean, isStudent } = useAuth();
  const colors = useLibraryColors();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      page: { flex: 1, backgroundColor: c.surface },
      loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.surface,
      },
      content: {
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
      },
      hero: {
        borderRadius: Radius.xl,
        padding: Spacing.five,
        gap: Spacing.two,
        marginBottom: Spacing.four,
        alignItems: 'center',
      },
      heroBadge: {
        alignSelf: 'center',
        backgroundColor: c.gold,
        color: c.navy,
        fontSize: 11,
        fontWeight: '800',
        paddingHorizontal: Spacing.three,
        paddingVertical: 6,
        borderRadius: Radius.pill,
        overflow: 'hidden',
      },
      heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
      },
      heroSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
      },
      prompt: {
        fontSize: 18,
        fontWeight: '800',
        color: c.ink,
        marginBottom: Spacing.three,
        textAlign: 'center',
      },
      roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        borderWidth: 1,
        borderColor: c.border,
        marginBottom: Spacing.three,
      },
      roleCardPressed: { borderColor: c.accent },
      roleIcon: {
        width: 56,
        height: 56,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
      },
      studentIcon: { backgroundColor: c.accentSoft },
      teacherIcon: { backgroundColor: c.goldMuted },
      deanIcon: { backgroundColor: '#e0e7ff' },
      roleEmoji: { fontSize: 28 },
      roleBody: { flex: 1, gap: 4 },
      roleTitle: { fontSize: 18, fontWeight: '800', color: c.ink },
      roleDesc: { fontSize: 13, color: c.inkMuted, lineHeight: 18 },
      roleArrow: { fontSize: 22, color: c.accent, fontWeight: '700' },
      browseBtn: { marginTop: Spacing.two, alignItems: 'center', padding: Spacing.three },
      browseText: { color: c.accent, fontWeight: '600', fontSize: 14 },
      back: {
        color: c.inkMuted,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.three,
      },
    }),
  );

  useEffect(() => {
    if (isLoading) return;
    if (isDean) router.replace('/(tabs)/dean');
    else if (isTeacher) router.replace('/(tabs)/teacher');
    else if (isStudent) router.replace('/(tabs)/issued');
  }, [isLoading, isDean, isTeacher, isStudent, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <CollegeNavbar active="library" />
      <ScreenShell scroll={false} centered>
      <View style={styles.content}>
      <LinearGradient
        colors={[colors.navy, colors.navyMid, colors.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <ThemedText style={styles.heroBadge}>{COLLEGE.libraryName}</ThemedText>
        <ThemedText style={styles.heroTitle}>Sign in</ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          Student, Teacher, ya Dean — apna role choose karein
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
            Books issue/return, students register — apni profile khud edit nahi
          </ThemedText>
        </View>
        <ThemedText style={styles.roleArrow}>→</ThemedText>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.roleCard, pressed && styles.roleCardPressed]}
        onPress={() => router.push('/login-dean')}>
        <View style={[styles.roleIcon, styles.deanIcon]}>
          <ThemedText style={styles.roleEmoji}>🎓</ThemedText>
        </View>
        <View style={styles.roleBody}>
          <ThemedText style={styles.roleTitle}>Dean</ThemedText>
          <ThemedText style={styles.roleDesc}>
            Teacher IDs banayein, poori library par full access
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
      </View>
      </ScreenShell>
    </View>
  );
}
