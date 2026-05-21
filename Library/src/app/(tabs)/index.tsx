import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { StatCard } from '@/components/library/stat-card';
import { ThemedText } from '@/components/themed-text';
import { useBooksApi } from '@/context/books-api-context';
import { COLLEGE } from '@/constants/college-branding';
import { getDepartmentLabel } from '@/constants/departments';
import { Radius, Spacing } from '@/constants/theme';
import { useLibraryColors } from '@/hooks/use-library-colors';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { cardBorder, libraryElevation, webTypography } from '@/lib/platform-styles';

const QUICK_LINKS = [
  { href: '/books' as const, title: 'Search Books', desc: 'Title, author, publisher', emoji: '📚' },
  { href: '/departments' as const, title: 'Departments', desc: 'FMPE, ME, CSE & more', emoji: '🏛️' },
  { href: '/about' as const, title: 'Library Info', desc: 'Rules, timings, contact', emoji: 'ℹ️' },
];

export default function HomeScreen() {
  const {
    books,
    loading,
    error,
    apiOnline,
    dataSource,
    stats,
    departments,
    racks,
    refresh,
  } = useBooksApi();
  const router = useRouter();
  const colors = useLibraryColors();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.three,
        padding: Spacing.five,
      },
      loadingText: {
        color: c.inkMuted,
        fontSize: 15,
        textAlign: 'center',
      },
      banner: {
        backgroundColor: c.warningBg,
        padding: Spacing.three,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: c.border,
      },
      bannerText: {
        color: c.warningText,
        fontWeight: '600',
        fontSize: 13,
      },
      hero: {
        borderRadius: Radius.xl,
        padding: Spacing.four,
        gap: Spacing.two,
        ...libraryElevation(c.shadow, 'hero'),
      },
      heroBadge: {
        alignSelf: 'flex-start',
        backgroundColor: c.gold,
        paddingHorizontal: Spacing.three,
        paddingVertical: 6,
        borderRadius: Radius.pill,
      },
      heroBadgeText: {
        color: c.navy,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
      },
      heroTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 36,
      },
      heroSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        lineHeight: 22,
      },
      heroMeta: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
        marginTop: Spacing.one,
      },
      rackSearchBox: {
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        ...cardBorder(c.border),
        gap: Spacing.three,
        ...libraryElevation(c.shadow, 'card'),
      },
      rackSearchTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: c.ink,
      },
      rackInputRow: {
        flexDirection: 'row',
        gap: Spacing.two,
      },
      rackInput: {
        flex: 1,
        backgroundColor: c.inputBg,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.three,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: c.border,
        color: c.inputText,
        outlineStyle: 'none',
        ...webTypography,
      } as object,
      rackBtn: {
        backgroundColor: c.accent,
        paddingHorizontal: Spacing.four,
        borderRadius: Radius.md,
        justifyContent: 'center',
      },
      rackBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
      },
      rackChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
      },
      miniRackChip: {
        backgroundColor: c.accentSoft,
        paddingHorizontal: Spacing.three,
        paddingVertical: 8,
        borderRadius: Radius.pill,
      },
      miniRackText: {
        fontSize: 13,
        fontWeight: '700',
        color: c.accent,
      },
      collegeLink: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
      collegeLinkText: { color: c.accent, fontWeight: '700', fontSize: 14 },
      accountBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        backgroundColor: c.navy,
        borderRadius: Radius.lg,
        padding: Spacing.four,
      },
      accountBody: { flex: 1, gap: 2 },
      accountTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
      accountDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
      accountArrow: { fontSize: 20, color: c.gold, fontWeight: '800' },
      statsRow: { flexDirection: 'row', gap: Spacing.three, flexWrap: 'wrap' },
      links: { gap: Spacing.three },
      linkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.three,
        ...cardBorder(c.border),
        ...libraryElevation(c.shadow, 'raised'),
      },
      linkCardPressed: { borderColor: c.accent },
      linkIconWrap: {
        width: 48,
        height: 48,
        borderRadius: Radius.md,
        backgroundColor: c.surface,
        alignItems: 'center',
        justifyContent: 'center',
      },
      linkEmoji: { fontSize: 24 },
      linkBody: { flex: 1, gap: 4 },
      linkTitle: { fontSize: 16, fontWeight: '700', color: c.ink },
      linkDesc: { fontSize: 13, color: c.inkMuted },
      linkArrow: { fontSize: 22, color: c.accent, fontWeight: '700' },
      deptPreview: { gap: Spacing.two, paddingBottom: Spacing.four },
      sectionTitle: { fontSize: 18, fontWeight: '700', color: c.ink },
      deptTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
      deptTag: {
        backgroundColor: c.goldMuted,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: c.goldLight,
      },
      deptTagText: { fontSize: 12, fontWeight: '700', color: c.ink },
    }),
  );
  const [rackQuery, setRackQuery] = useState('');

  const searchByRack = () => {
    const q = rackQuery.trim();
    if (!q) return;
    router.push({ pathname: '/books', params: { rack: q } });
  };

  const sourceLabel =
    dataSource === 'mongodb'
      ? 'MongoDB · Live'
      : dataSource === 'offline-cache'
        ? 'Offline cache'
        : 'No data';

  if (loading && books.length === 0) {
    return (
      <ScreenShell scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <ThemedText style={styles.loadingText}>MongoDB se library load ho rahi hai…</ThemedText>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      {error ? (
        <Pressable style={styles.banner} onPress={refresh}>
          <ThemedText style={styles.bannerText}>⚠ {error} · Tap to retry</ThemedText>
        </Pressable>
      ) : null}

      <LinearGradient
        colors={[colors.navy, colors.navyMid, colors.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        {/* <View style={styles.heroBadge}>
          <ThemedText style={styles.heroBadgeText}>{sourceLabel}</ThemedText>
        </View> */}
        <ThemedText style={styles.heroTitle}>{COLLEGE.libraryName}</ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          {stats.totalTitles} books · {stats.availableCopies} copies in library · Rack search
        </ThemedText>
        <ThemedText style={styles.heroMeta}>
          {apiOnline ? 'Connected to college database' : 'Showing cached data — connect for live updates'}
        </ThemedText>
      </LinearGradient>

      <View style={styles.rackSearchBox}>
        <ThemedText style={styles.rackSearchTitle}>Quick Rack Search</ThemedText>
        <View style={styles.rackInputRow}>
          <TextInput
            value={rackQuery}
            onChangeText={setRackQuery}
            placeholder="Enter rack no. e.g. 12.2"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.rackInput}
            keyboardType="decimal-pad"
            onSubmitEditing={searchByRack}
          />
          <Pressable style={styles.rackBtn} onPress={searchByRack}>
            <ThemedText style={styles.rackBtnText}>Find</ThemedText>
          </Pressable>
        </View>
        <View style={styles.rackChips}>
          {racks.slice(0, 5).map((r) => (
            <Pressable
              key={r}
              style={styles.miniRackChip}
              onPress={() => router.push({ pathname: '/books', params: { rack: r } })}>
              <ThemedText style={styles.miniRackText}>Rack {r}</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Book Titles" value={stats.totalTitles} hint="MongoDB" accent="navy" />
        <StatCard label="Total Copies" value={stats.totalCopies} accent="gold" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="In Library" value={stats.availableCopies} accent="teal" />
        <StatCard label="Issued Now" value={stats.activeIssues} accent="navy" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Racks" value={stats.racks} accent="teal" />
        <StatCard label="Departments" value={stats.departments} accent="navy" />
      </View>

      <Pressable style={styles.collegeLink} onPress={() => router.replace('/')}>
        <ThemedText style={styles.collegeLinkText}>← {COLLEGE.shortName} College Home</ThemedText>
      </Pressable>

      <Pressable style={styles.accountBar} onPress={() => router.push('/welcome')}>
        <View style={styles.accountBody}>
          <ThemedText style={styles.accountTitle}>Library sign in</ThemedText>
          <ThemedText style={styles.accountDesc}>Student or Teacher · Issue & manage books</ThemedText>
        </View>
        <ThemedText style={styles.accountArrow}>→</ThemedText>
      </Pressable>

      <PageHeader title="Quick Access" subtitle="Library management at your fingertips" />

      <View style={styles.links}>
        {QUICK_LINKS.map((item) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}>
            <View style={styles.linkIconWrap}>
              <ThemedText style={styles.linkEmoji}>{item.emoji}</ThemedText>
            </View>
            <View style={styles.linkBody}>
              <ThemedText style={styles.linkTitle}>{item.title}</ThemedText>
              <ThemedText style={styles.linkDesc}>{item.desc}</ThemedText>
            </View>
            <ThemedText style={styles.linkArrow}>→</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.deptPreview}>
        <ThemedText style={styles.sectionTitle}>Departments</ThemedText>
        <View style={styles.deptTags}>
          {departments.map((dept) => (
            <Pressable
              key={dept}
              style={styles.deptTag}
              onPress={() => router.push({ pathname: '/books', params: { department: dept } })}>
              <ThemedText style={styles.deptTagText}>
                {dept} · {getDepartmentLabel(dept)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenShell>
  );
}
