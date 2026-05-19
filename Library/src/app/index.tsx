import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CollegeNavbar } from '@/components/college-navbar';
import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';

const HIGHLIGHTS = [
  { emoji: '🏛️', title: 'Government College', desc: 'Constituent college under ANDUAT, Ayodhya' },
  { emoji: '🌾', title: 'Agricultural Engineering', desc: 'B.Tech & M.Tech in agri-engineering disciplines' },
  { emoji: '⭐', title: 'NAAC A++', desc: 'Recognized for quality education & infrastructure' },
  { emoji: '📚', title: 'Central Library', desc: 'Digital catalog, rack search & book management' },
];

export default function CollegeHomeScreen() {
  const router = useRouter();
  const { isTeacher, isStudent, teacher, student } = useAuth();

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
        colors={[LibraryColors.navy, LibraryColors.navyMid, LibraryColors.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <ThemedText style={styles.heroBadge}>Government of Uttar Pradesh</ThemedText>
        <ThemedText style={styles.heroTitle}>
          Mahamaya College of Agricultural Engineering & Technology
        </ThemedText>
        <ThemedText style={styles.heroShort}>MCAET · Akbarpur, Ambedkar Nagar</ThemedText>
        <ThemedText style={styles.heroPin}>Uttar Pradesh — 224122</ThemedText>
      </LinearGradient>

      <View style={styles.aboutCard}>
        <PageHeader
          title="About MCAET"
          subtitle="Excellence in agricultural engineering education since 2002"
        />
        <ThemedText style={styles.paragraph}>
          Mahamaya College of Agricultural Engineering & Technology (MCAET) is a government
          engineering college located at Akbarpur, Ambedkar Nagar, Uttar Pradesh. Established in
          2002, it is a constituent college of Acharya Narendra Deva University of Agriculture &
          Technology (ANDUAT), Kumarganj, Ayodhya.
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          The college was initially started at Kumarganj in 2003–04 and was relocated to Ambedkar
          Nagar in 2005. MCAET offers undergraduate programmes in Agricultural Engineering,
          Computer Science & Engineering, and Mechanical Engineering, along with postgraduate
          programmes in Soil & Water Conservation, Irrigation & Drainage, Farm Machinery & Power,
          Process & Food Engineering, and Renewable Energy Engineering.
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          MCAET is affiliated with the Indian Council of Agricultural Research (ICAR), approved by
          AICTE, and has earned NAAC A++ accreditation. The institution is committed to producing
          skilled engineers who serve the farming community and rural development of Uttar Pradesh.
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {HIGHLIGHTS.map((item) => (
          <View key={item.title} style={styles.highlightCard}>
            <ThemedText style={styles.highlightEmoji}>{item.emoji}</ThemedText>
            <ThemedText style={styles.highlightTitle}>{item.title}</ThemedText>
            <ThemedText style={styles.highlightDesc}>{item.desc}</ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.contactCard}>
        <ThemedText style={styles.contactTitle}>Campus</ThemedText>
        <ThemedText style={styles.contactLine}>
          Near Shiv Baba, Faizabad Marg, Akbarpur, Ambedkar Nagar, U.P.
        </ThemedText>
        <Pressable onPress={() => Linking.openURL('tel:+919076611211')}>
          <ThemedText style={styles.contactLink}>Phone: +91 90766 11211</ThemedText>
        </Pressable>
        <Pressable onPress={() => Linking.openURL('https://mcaet.vercel.app')}>
          <ThemedText style={styles.contactLink}>Website: mcaet.vercel.app</ThemedText>
        </Pressable>
      </View>

      <Pressable style={styles.libraryBtn} onPress={openLibrary}>
        <ThemedText style={styles.libraryBtnText}>
          {isTeacher
            ? `Open Library Panel (${teacher?.teacherId})`
            : isStudent
              ? `My Library (${student?.userId ?? student?.studentId})`
              : 'Enter Central Library'}
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: LibraryColors.surface },

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
    color: LibraryColors.goldLight,
  },
  heroPin: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: Spacing.one,
  },
  aboutCard: {
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#000000',
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
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    gap: 4,
  },
  highlightEmoji: { fontSize: 24 },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: LibraryColors.navy,
  },
  highlightDesc: {
    fontSize: 12,
    color: LibraryColors.muted,
    lineHeight: 16,
  },
  contactCard: {
    backgroundColor: LibraryColors.goldMuted,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: LibraryColors.goldLight,
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: LibraryColors.navy,
  },
  contactLine: {
    fontSize: 14,
    color: LibraryColors.navy,
    lineHeight: 20,
  },
  contactLink: {
    fontSize: 14,
    color: LibraryColors.accent,
    fontWeight: '600',
  },
  libraryBtn: {
    backgroundColor: LibraryColors.navy,
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
    color: LibraryColors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
});
