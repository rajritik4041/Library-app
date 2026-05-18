import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { StatCard } from '@/components/library/stat-card';
import { ThemedText } from '@/components/themed-text';
import { useBooksApi } from '@/context/books-api-context';
import { useLibrary } from '@/context/library-context';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';
import { getUniqueDepartments, getUniqueRacks } from '@/lib/books';
import { useTheme } from '@/hooks/use-theme';

const QUICK_LINKS = [
  { href: '/books' as const, title: 'Search Books', desc: 'Title, author, publisher', emoji: '📚' },
  { href: '/departments' as const, title: 'Departments', desc: 'FMPE, ME, CSE & more', emoji: '🏛️' },
  { href: '/about' as const, title: 'Library Info', desc: 'Rules, timings, contact', emoji: 'ℹ️' },
];

export default function HomeScreen() {
  const { stats, meta } = useLibrary();
  const { books, apiOnline } = useBooksApi();
  const departments = getUniqueDepartments();
  const racks = getUniqueRacks();
  const router = useRouter();
  const theme = useTheme();
  const [rackQuery, setRackQuery] = useState('');

  const searchByRack = () => {
    const q = rackQuery.trim();
    if (!q) {
      return;
    }
    router.push({ pathname: '/books', params: { rack: q } });
  };

  const updatedDate = new Date(meta.updatedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <ScreenShell>
      <LinearGradient
        colors={[LibraryColors.navy, LibraryColors.navyMid, LibraryColors.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroBadge}>
          <ThemedText style={styles.heroBadgeText}>EJ MCAET College</ThemedText>
        </View>
        <ThemedText style={styles.heroTitle}>Central Library</ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          {apiOnline ? books.length : stats.totalTitles} books · Live library status · Rack search
        </ThemedText>
        <ThemedText style={styles.heroMeta}>Data synced {updatedDate}</ThemedText>
      </LinearGradient>

      <View style={styles.rackSearchBox}>
        <ThemedText style={styles.rackSearchTitle}>Quick Rack Search</ThemedText>
        <View style={styles.rackInputRow}>
          <TextInput
            value={rackQuery}
            onChangeText={setRackQuery}
            placeholder="Enter rack no. e.g. 12.2"
            placeholderTextColor={theme.textSecondary}
            style={[styles.rackInput, { color: theme.text }]}
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
        <StatCard label="Book Titles" value={stats.totalTitles} hint="From Excel" accent="navy" />
        <StatCard label="Total Copies" value={stats.totalCopies} accent="gold" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Racks" value={stats.racks} accent="teal" />
        <StatCard label="Departments" value={stats.departments} accent="navy" />
      </View>

      <Pressable style={styles.collegeLink} onPress={() => router.replace('/')}>
        <ThemedText style={styles.collegeLinkText}>← MCAET College Home</ThemedText>
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
              <ThemedText style={styles.deptTagText}>{dept}</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
    shadowColor: LibraryColors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LibraryColors.gold,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  heroBadgeText: {
    color: LibraryColors.navy,
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
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    gap: Spacing.three,
    shadowColor: LibraryColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  rackSearchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: LibraryColors.navy,
  },
  rackInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rackInput: {
    flex: 1,
    backgroundColor: LibraryColors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: LibraryColors.border,
    outlineStyle: 'none',
  } as object,
  rackBtn: {
    backgroundColor: LibraryColors.accent,
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
    backgroundColor: LibraryColors.accentSoft,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  miniRackText: {
    fontSize: 13,
    fontWeight: '700',
    color: LibraryColors.accent,
  },
  collegeLink: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  collegeLinkText: { color: LibraryColors.accent, fontWeight: '700', fontSize: 14 },
  accountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: LibraryColors.navy,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  accountBody: {
    flex: 1,
    gap: 2,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  accountDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  accountArrow: {
    fontSize: 20,
    color: LibraryColors.gold,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  links: {
    gap: Spacing.three,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    shadowColor: LibraryColors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  linkCardPressed: {
    borderColor: LibraryColors.accent,
  },
  linkIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: LibraryColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkEmoji: {
    fontSize: 24,
  },
  linkBody: {
    flex: 1,
    gap: 4,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LibraryColors.navy,
  },
  linkDesc: {
    fontSize: 13,
    color: LibraryColors.muted,
  },
  linkArrow: {
    fontSize: 22,
    color: LibraryColors.accent,
    fontWeight: '700',
  },
  deptPreview: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LibraryColors.navy,
  },
  deptTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  deptTag: {
    backgroundColor: LibraryColors.goldMuted,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: LibraryColors.goldLight,
  },
  deptTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: LibraryColors.navy,
  },
});
