import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvailabilityBadge } from '@/components/library/availability-badge';
import { ThemedText } from '@/components/themed-text';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';
import { getDepartmentLabel } from '@/lib/books';
import type { ApiBook } from '@/types/api';

type BookCardProps = {
  book: ApiBook;
  highlightRack?: boolean;
};

export function BookCard({ book, highlightRack }: BookCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}
      style={({ pressed }) => [
        styles.card,
        highlightRack && styles.cardRackMatch,
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.topRow}>
        <View style={styles.leftBadges}>
          <View style={styles.serialBadge}>
            <ThemedText style={styles.serialText}>#{book.serialNo}</ThemedText>
          </View>
          <View style={[styles.rackBadge, highlightRack && styles.rackBadgeHighlight]}>
            <ThemedText style={[styles.rackLabel, highlightRack && styles.rackLabelHighlight]}>
              Rack
            </ThemedText>
            <ThemedText style={[styles.rackValue, highlightRack && styles.rackValueHighlight]}>
              {book.rackNo || '—'}
            </ThemedText>
          </View>
        </View>
      </View>

      <AvailabilityBadge
        status={book.status}
        availableCount={book.availableCount}
        copies={book.copies}
      />

      <ThemedText style={styles.title} numberOfLines={2}>
        {book.title}
      </ThemedText>

      {book.authors ? (
        <ThemedText style={styles.authors} numberOfLines={1}>
          {book.authors}
        </ThemedText>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.deptTag}>
          <ThemedText style={styles.deptText}>{book.department}</ThemedText>
        </View>
        <ThemedText style={styles.subject} numberOfLines={1}>
          {getDepartmentLabel(book.subject)}
        </ThemedText>
        <ThemedText style={styles.viewLink}>View details →</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    gap: Spacing.two,
    shadowColor: LibraryColors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardRackMatch: {
    borderColor: LibraryColors.accent,
    borderWidth: 2,
  },
  cardPressed: {
    opacity: 0.92,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  serialBadge: {
    backgroundColor: LibraryColors.navy,
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  serialText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  rackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: LibraryColors.surfaceAlt,
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: LibraryColors.border,
  },
  rackBadgeHighlight: {
    backgroundColor: LibraryColors.accent,
    borderColor: LibraryColors.accent,
  },
  rackLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: LibraryColors.muted,
    textTransform: 'uppercase',
  },
  rackLabelHighlight: {
    color: 'rgba(255,255,255,0.85)',
  },
  rackValue: {
    fontSize: 14,
    fontWeight: '800',
    color: LibraryColors.navy,
  },
  rackValueHighlight: {
    color: '#fff',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: LibraryColors.navy,
    lineHeight: 24,
  },
  authors: {
    fontSize: 14,
    color: LibraryColors.muted,
  },
  footer: {
    gap: Spacing.two,
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: LibraryColors.border,
  },
  deptTag: {
    alignSelf: 'flex-start',
    backgroundColor: LibraryColors.goldLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  deptText: {
    color: LibraryColors.navy,
    fontSize: 11,
    fontWeight: '800',
  },
  subject: {
    fontSize: 12,
    color: LibraryColors.muted,
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '700',
    color: LibraryColors.accent,
  },
});
