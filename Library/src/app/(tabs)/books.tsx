import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { BookCard } from '@/components/library/book-card';
import { FilterChips } from '@/components/library/filter-chips';
import { PageHeader } from '@/components/library/page-header';
import { RackFilter } from '@/components/library/rack-filter';
import { ScreenShell } from '@/components/library/screen-shell';
import { SearchBar } from '@/components/library/search-bar';
import { ThemedText } from '@/components/themed-text';
import { useBooksApi } from '@/context/books-api-context';
import { Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { filterApiBooks, matchesRack } from '@/lib/api-books';
import { resolveBookRackNo } from '@/lib/book-catalog-fields';

export default function BooksScreen() {
  const { department: deptParam, rack: rackParam } = useLocalSearchParams<{
    department?: string;
    rack?: string;
  }>();
  const {
    books,
    racks: rackList,
    apiOnline,
    error,
    refresh,
    loading,
    subjects,
    departments: deptList,
  } = useBooksApi();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      offline: {
        backgroundColor: c.warningBg,
        padding: Spacing.three,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
      },
      offlineText: {
        color: c.warningText,
        fontWeight: '600',
        fontSize: 13,
      },
      filterBlock: { gap: Spacing.one },
      filterLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: c.ink,
      },
      list: { gap: Spacing.three, paddingBottom: Spacing.four },
      empty: {
        alignItems: 'center',
        padding: Spacing.five,
        backgroundColor: c.card,
        borderRadius: 16,
      },
      emptyTitle: { fontSize: 18, fontWeight: '700', color: c.ink },
    }),
  );

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

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const results = useMemo(
    () => filterApiBooks(books, query, department, subject, rack),
    [books, query, department, subject, rack],
  );

  const rackMatchCount = results.filter((b) =>
    matchesRack(query || rack || '', resolveBookRackNo(b)),
  ).length;

  const clearAll = () => {
    setQuery('');
    setDepartment(undefined);
    setSubject(undefined);
    setRack(undefined);
  };

  return (
    <ScreenShell>
      <PageHeader
        badge={apiOnline ? 'MongoDB' : 'Offline'}
        title="Search Books"
        subtitle={`${books.length} books from database · ${loading ? 'Updating…' : 'Green = in library'}`}
      />

      {!apiOnline && error ? (
        <Pressable style={styles.offline} onPress={refresh}>
          <ThemedText style={styles.offlineText}>⚠ {error} · Tap to retry</ThemedText>
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
          racks={rackList}
          selected={rack}
          onSelect={(value) => {
            setRack(value);
            if (value) setQuery(value);
          }}
        />
      </View>

      <View style={styles.filterBlock}>
        <ThemedText style={styles.filterLabel}>Department</ThemedText>
        <FilterChips options={deptList} selected={department} onSelect={setDepartment} />
      </View>

      <View style={styles.filterBlock}>
        <ThemedText style={styles.filterLabel}>Subject</ThemedText>
        <FilterChips options={subjects} selected={subject} onSelect={setSubject} />
      </View>

      {results.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText style={styles.emptyTitle}>No books found</ThemedText>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          initialNumToRender={12}
          maxToRenderPerBatch={16}
          windowSize={5}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              highlightRack={Boolean(
                (query || rack) && matchesRack(query || rack || '', resolveBookRackNo(item)),
              )}
            />
          )}
        />
      )}
    </ScreenShell>
  );
}
