import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/library/book-card';
import { FilterChips } from '@/components/library/filter-chips';
import { PageHeader } from '@/components/library/page-header';
import { RackFilter } from '@/components/library/rack-filter';
import { ScreenShell } from '@/components/library/screen-shell';
import { SearchBar } from '@/components/library/search-bar';
import { ThemedText } from '@/components/themed-text';
import { useBooksApi } from '@/context/books-api-context';
import { LibraryColors, Spacing } from '@/constants/theme';
import { matchesRack } from '@/lib/books';
import type { ApiBook } from '@/types/api';

function filterBooks(
  books: ApiBook[],
  query: string,
  department?: string,
  subject?: string,
  rack?: string,
) {
  const q = query.trim().toLowerCase();
  return books.filter((book) => {
    if (department && book.department !== department) return false;
    if (subject && book.subject !== subject) return false;
    if (rack && !matchesRack(rack, book.rackNo)) return false;
    if (!q) return true;
    const haystack = [book.title, book.authors, book.publisher, book.department, book.subject, book.rackNo, String(book.serialNo)]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q) || matchesRack(q, book.rackNo);
  });
}

export default function BooksScreen() {
  const { department: deptParam, rack: rackParam } = useLocalSearchParams<{
    department?: string;
    rack?: string;
  }>();
  const { books, apiOnline, error, refresh } = useBooksApi();

  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState<string>();
  const [subject, setSubject] = useState<string>();
  const [rack, setRack] = useState<string>();

  useEffect(() => {
    if (deptParam && typeof deptParam === 'string') setDepartment(deptParam);
  }, [deptParam]);

  useEffect(() => {
    if (rackParam && typeof rackParam === 'string') {
      setRack(rackParam);
      setQuery(rackParam);
    }
  }, [rackParam]);

  const departments = useMemo(
    () => [...new Set(books.map((b) => b.department).filter(Boolean))].sort(),
    [books],
  );
  const subjects = useMemo(
    () => [...new Set(books.map((b) => b.subject).filter(Boolean))].sort(),
    [books],
  );
  const racks = useMemo(
    () => [...new Set(books.map((b) => b.rackNo).filter(Boolean))].sort(),
    [books],
  );

  const results = useMemo(
    () => filterBooks(books, query, department, subject, rack),
    [books, query, department, subject, rack],
  );

  const rackMatchCount = results.filter((b) => matchesRack(query || rack || '', b.rackNo)).length;

  const clearAll = () => {
    setQuery('');
    setDepartment(undefined);
    setSubject(undefined);
    setRack(undefined);
  };

  return (
    <ScreenShell>
      <PageHeader
        badge="Catalog"
        title="Search Books"
        subtitle={`${books.length} books · Green = in library · Red = issued out`}
      />

      {!apiOnline && error ? (
        <Pressable style={styles.offline} onPress={refresh}>
          <ThemedText style={styles.offlineText}>
            ⚠ Server offline — run: npm run server · Tap to retry
          </ThemedText>
        </Pressable>
      ) : null}

      <SearchBar
        value={query}
        onChangeText={setQuery}
        resultCount={results.length}
        rackMatchCount={query || rack ? rackMatchCount : undefined}
        onClear={clearAll}
      />

      <View style={styles.filterBlock}>
        <ThemedText style={styles.filterLabel}>📍 Rack Number</ThemedText>
        <RackFilter
          racks={racks}
          selected={rack}
          onSelect={(value) => {
            setRack(value);
            if (value) setQuery(value);
          }}
        />
      </View>

      <View style={styles.filterBlock}>
        <ThemedText style={styles.filterLabel}>Department</ThemedText>
        <FilterChips options={departments} selected={department} onSelect={setDepartment} />
      </View>

      <View style={styles.filterBlock}>
        <ThemedText style={styles.filterLabel}>Subject</ThemedText>
        <FilterChips options={subjects} selected={subject} onSelect={setSubject} />
      </View>

      <View style={styles.list}>
        {results.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText style={styles.emptyTitle}>No books found</ThemedText>
          </View>
        ) : (
          results.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              highlightRack={Boolean((query || rack) && matchesRack(query || rack || '', book.rackNo))}
            />
          ))
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  offline: {
    backgroundColor: '#fef3c7',
    padding: Spacing.three,
    borderRadius: 12,
  },
  offlineText: {
    color: '#92400e',
    fontWeight: '600',
    fontSize: 13,
  },
  filterBlock: { gap: Spacing.one },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: LibraryColors.navy,
  },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  empty: {
    alignItems: 'center',
    padding: Spacing.five,
    backgroundColor: LibraryColors.card,
    borderRadius: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: LibraryColors.navy },
});
