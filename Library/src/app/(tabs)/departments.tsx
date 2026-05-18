import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useLibrary } from '@/context/library-context';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';
import { getBooksByDepartment, getDepartmentLabel, getUniqueDepartments, getUniqueRacks } from '@/lib/books';

export default function DepartmentsScreen() {
  const router = useRouter();
  const { stats, meta } = useLibrary();
  const departments = useMemo(() => getUniqueDepartments(), []);
  const racks = useMemo(() => getUniqueRacks(), []);

  return (
    <ScreenShell>
      <PageHeader
        badge="Browse"
        title="Departments"
        subtitle="Books grouped by academic department — tap to open filtered search."
      />

      <View style={styles.grid}>
        {departments.map((dept) => {
          const books = getBooksByDepartment(dept);
          const copies = books.reduce((sum, b) => sum + b.copies, 0);

          return (
            <Pressable
              key={dept}
              onPress={() => router.push({ pathname: '/books', params: { department: dept } })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={styles.cardTop}>
                  <View style={styles.codeBadge}>
                    <ThemedText style={styles.codeText}>{dept}</ThemedText>
                  </View>
                  <ThemedText style={styles.count}>{books.length} titles</ThemedText>
                </View>
                <ThemedText style={styles.cardTitle}>{getDepartmentLabel(dept)}</ThemedText>
                <ThemedText style={styles.cardMeta}>{copies} copies on shelf</ThemedText>
                <ThemedText style={styles.cardLink}>Search in {dept} →</ThemedText>
              </Pressable>
          );
        })}
      </View>

      <View style={styles.summary}>
        <ThemedText style={styles.summaryTitle}>Collection Overview</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.summaryText}>
          {stats.totalTitles} titles · {stats.totalCopies} copies · {racks.length} rack
          {racks.length === 1 ? '' : 's'} ({racks.join(', ')})
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.summaryText}>
          Auto-synced from {meta.sourceFile}. Last update:{' '}
          {new Date(meta.updatedAt).toLocaleString('en-IN')}
        </ThemedText>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.three,
  },
  card: {
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    gap: Spacing.two,
  },
  cardPressed: {
    borderColor: LibraryColors.accent,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBadge: {
    backgroundColor: LibraryColors.navy,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  codeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  count: {
    fontSize: 13,
    color: LibraryColors.muted,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LibraryColors.navy,
    lineHeight: 24,
  },
  cardMeta: {
    fontSize: 14,
    color: LibraryColors.muted,
  },
  cardLink: {
    fontSize: 14,
    fontWeight: '700',
    color: LibraryColors.accent,
    marginTop: Spacing.one,
  },
  summary: {
    gap: Spacing.two,
    backgroundColor: LibraryColors.goldMuted,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: LibraryColors.goldLight,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: LibraryColors.navy,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
