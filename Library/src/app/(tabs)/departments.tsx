import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useBooksApi } from '@/context/books-api-context';
import { getDepartmentLabel } from '@/constants/departments';
import { Radius, Spacing } from '@/constants/theme';
import { useLibraryColors } from '@/hooks/use-library-colors';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function DepartmentsScreen() {
  const router = useRouter();
  const { departments, booksByDepartment, stats, racks, loading, error, apiOnline, refresh } =
    useBooksApi();
  const colors = useLibraryColors();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.three,
      },
      loadingText: { color: c.inkMuted, fontSize: 15 },
      banner: {
        backgroundColor: '#fef3c7',
        padding: Spacing.three,
        borderRadius: Radius.md,
        marginBottom: Spacing.two,
      },
      bannerText: { color: '#92400e', fontWeight: '600', fontSize: 13 },
      grid: { gap: Spacing.three },
      card: {
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        borderWidth: 1,
        borderColor: c.border,
        gap: Spacing.two,
      },
      cardPressed: { borderColor: c.accent },
      cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      codeBadge: {
        backgroundColor: c.navy,
        paddingHorizontal: Spacing.three,
        paddingVertical: 6,
        borderRadius: Radius.sm,
      },
      codeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
      count: { fontSize: 13, color: c.inkMuted, fontWeight: '600' },
      cardTitle: { fontSize: 18, fontWeight: '700', color: c.ink, lineHeight: 24 },
      cardMeta: { fontSize: 14, color: c.inkMuted },
      cardLink: {
        fontSize: 14,
        fontWeight: '700',
        color: c.accent,
        marginTop: Spacing.one,
      },
      empty: { textAlign: 'center', color: c.inkMuted, padding: Spacing.four },
      summary: {
        gap: Spacing.two,
        backgroundColor: c.goldMuted,
        padding: Spacing.four,
        borderRadius: Radius.lg,
        marginBottom: Spacing.four,
        borderWidth: 1,
        borderColor: c.goldLight,
      },
      summaryTitle: { fontSize: 16, fontWeight: '800', color: c.ink },
      summaryText: { fontSize: 14, lineHeight: 22 },
    }),
  );

  if (loading && departments.length === 0) {
    return (
      <ScreenShell scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <ThemedText style={styles.loadingText}>Departments MongoDB se load…</ThemedText>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <PageHeader
        badge={apiOnline ? 'MongoDB' : 'Offline'}
        title="Departments"
        subtitle="Books grouped by academic department — tap to open filtered search."
      />

      {error ? (
        <Pressable style={styles.banner} onPress={refresh}>
          <ThemedText style={styles.bannerText}>⚠ {error} · Retry</ThemedText>
        </Pressable>
      ) : null}

      <View style={styles.grid}>
        {departments.map((dept) => {
          const deptBooks = booksByDepartment(dept);
          const copies = deptBooks.reduce((sum, b) => sum + b.copies, 0);
          const available = deptBooks.reduce((sum, b) => sum + b.availableCount, 0);

          return (
            <Pressable
              key={dept}
              onPress={() => router.push({ pathname: '/books', params: { department: dept } })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <View style={styles.cardTop}>
                <View style={styles.codeBadge}>
                  <ThemedText style={styles.codeText}>{dept}</ThemedText>
                </View>
                <ThemedText style={styles.count}>{deptBooks.length} titles</ThemedText>
              </View>
              <ThemedText style={styles.cardTitle}>{getDepartmentLabel(dept)}</ThemedText>
              <ThemedText style={styles.cardMeta}>
                {copies} copies · {available} in library now
              </ThemedText>
              <ThemedText style={styles.cardLink}>Search in {dept} →</ThemedText>
            </Pressable>
          );
        })}
      </View>

      {departments.length === 0 ? (
        <ThemedText style={styles.empty}>No departments in database yet.</ThemedText>
      ) : null}

      <View style={styles.summary}>
        <ThemedText style={styles.summaryTitle}>Collection Overview (MongoDB)</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.summaryText}>
          {stats.totalTitles} titles · {stats.totalCopies} copies · {stats.availableCopies} available
          · {stats.activeIssues} issued
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.summaryText}>
          {racks.length} rack{racks.length === 1 ? '' : 's'}
          {racks.length > 0 && racks.length <= 8 ? ` (${racks.join(', ')})` : ''}
        </ThemedText>
      </View>
    </ScreenShell>
  );
}
