import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CollegeNavbar } from '@/components/college-navbar';
import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import {
  COLLEGE,
  COLLEGE_ABOUT,
  COLLEGE_HIGHLIGHTS,
} from '@/constants/college-branding';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useLibraryColors } from '@/hooks/use-library-colors';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function CollegeHomeScreen() {
  const router = useRouter();
  const { isTeacher, isStudent, teacher, student } = useAuth();
  const colors = useLibraryColors();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      page: { flex: 1, backgroundColor: c.surface },
      hero: {
        borderRadius: Radius.xl,
        padding: Spacing.five,
        gap: Spacing.two,
        marginBottom: Spacing.four,
      },
      heroBadge: {
        alignSelf: 'flex-start',
        backgroundColor: c.gold,
        color: c.navy,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4,
        paddingHorizontal: Spacing.three,
        paddingVertical: 6,
        borderRadius: Radius.pill,
        overflow: 'hidden',
      },
      heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 28,
      },
      heroShort: {
        fontSize: 16,
        fontWeight: '700',
        color: c.goldLight,
      },
      heroUni: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 18,
        marginTop: Spacing.one,
      },
      heroPin: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
      },
      aboutCard: {
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        borderWidth: 1,
        borderColor: c.border,
        marginBottom: Spacing.four,
        gap: Spacing.two,
      },
      paragraph: {
        fontSize: 14,
        lineHeight: 22,
        color: c.ink,
      },
      grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.three,
        marginBottom: Spacing.four,
      },
      highlightCard: {
        width: '47%',
        flexGrow: 1,
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.three,
        borderWidth: 1,
        borderColor: c.border,
        gap: 4,
      },
      highlightEmoji: { fontSize: 24 },
      highlightTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: c.ink,
      },
      highlightDesc: {
        fontSize: 12,
        color: c.inkMuted,
        lineHeight: 16,
      },
      contactCard: {
        backgroundColor: c.goldMuted,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        borderWidth: 1,
        borderColor: c.goldLight,
        gap: Spacing.two,
        marginBottom: Spacing.four,
      },
      contactTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: c.ink,
      },
      contactLine: {
        fontSize: 14,
        color: c.ink,
        lineHeight: 20,
      },
      contactLink: {
        fontSize: 14,
        color: c.accent,
        fontWeight: '600',
      },
      libraryBtn: {
        backgroundColor: c.navy,
        padding: Spacing.four,
        borderRadius: Radius.lg,
        alignItems: 'center',
      },
      libraryBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
      },
      secondaryBtn: {
        marginTop: Spacing.three,
        alignItems: 'center',
        padding: Spacing.two,
      },
      secondaryBtnText: {
        color: c.accent,
        fontWeight: '600',
        fontSize: 14,
      },
    }),
  );

  const openLibrary = () => {
    if (isTeacher) {
      router.replace('/(tabs)/teacher');
      return;
    }
    if (isStudent) {
      router.replace('/(tabs)/issued');
      return;
    }
    router.push('/welcome');
  };

  return (
    <View style={styles.page}>
      <CollegeNavbar active="home" />
      <ScreenShell>
      <LinearGradient
        colors={[colors.navy, colors.navyMid, colors.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <ThemedText style={styles.heroBadge}>{COLLEGE.governmentBadge}</ThemedText>
        <ThemedText style={styles.heroTitle}>{COLLEGE.fullName}</ThemedText>
        <ThemedText style={styles.heroShort}>
          {COLLEGE.shortName} · {COLLEGE.tagline}
        </ThemedText>
        <ThemedText style={styles.heroUni}>
          {COLLEGE.university} ({COLLEGE.universityShort}), {COLLEGE.universityLocation}
        </ThemedText>
        <ThemedText style={styles.heroPin}>
          {COLLEGE.state} — {COLLEGE.pincode}
        </ThemedText>
      </LinearGradient>

      <View style={styles.aboutCard}>
        <PageHeader
          title={`About ${COLLEGE.shortName}`}
          subtitle={`Excellence  in agricultural engineering education since ${COLLEGE.established}`}
        />
        {COLLEGE_ABOUT.map((para) => (
          <ThemedText key={para.slice(0, 40)} style={styles.paragraph}>
            {para}
          </ThemedText>
        ))}
      </View>

      <View style={styles.grid}>
        {COLLEGE_HIGHLIGHTS.map((item) => (
          <View key={item.title} style={styles.highlightCard}>
            <ThemedText style={styles.highlightEmoji}>{item.emoji}</ThemedText>
            <ThemedText style={styles.highlightTitle}>{item.title}</ThemedText>
            <ThemedText style={styles.highlightDesc}>{item.desc}</ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.contactCard}>
        <ThemedText style={styles.contactTitle}>Campus</ThemedText>
        <ThemedText style={styles.contactLine}>{COLLEGE.addressLine}</ThemedText>
        <Pressable onPress={() => Linking.openURL(COLLEGE.phoneTel)}>
          <ThemedText style={styles.contactLink}>Phone: {COLLEGE.phone}</ThemedText>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(COLLEGE.emailMailto)}>
          <ThemedText style={styles.contactLink}>Email: {COLLEGE.email}</ThemedText>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(COLLEGE.website)}>
          <ThemedText style={styles.contactLink}>Website: {COLLEGE.websiteDisplay}</ThemedText>
        </Pressable>
      </View>

      <Pressable style={styles.libraryBtn} onPress={openLibrary}>
        <ThemedText style={styles.libraryBtnText}>
          {isTeacher
            ? `Open Library Panel (${teacher?.teacherId})`
            : isStudent
              ? `My Library (${student?.userId ?? student?.studentId})`
              : `Enter ${COLLEGE.libraryName}`}
        </ThemedText>
      </Pressable>

      {!isTeacher && !isStudent ? (
        <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')}>
          <ThemedText style={styles.secondaryBtnText}>Browse books without login</ThemedText>
        </Pressable>
      ) : null}
      </ScreenShell>
    </View>
  );
}
