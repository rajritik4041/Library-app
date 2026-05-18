import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LibraryColors } from '@/constants/theme';
import {
  getCatalogMeta,
  getLibraryStats,
  refreshCatalog,
  searchBooksDetailed,
} from '@/services/catalog-service';
import type { BookFilters, BookSearchResult, CatalogMeta } from '@/types/book';

type LibraryContextValue = {
  meta: CatalogMeta;
  stats: ReturnType<typeof getLibraryStats>;
  search: (filters: BookFilters) => BookSearchResult[];
  refreshKey: number;
  refresh: () => Promise<void>;
  isReady: boolean;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const load = useCallback(async () => {
    await refreshCatalog();
    setRefreshKey((k) => k + 1);
    setIsReady(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    const interval = setInterval(() => {
      load();
    }, 8000);
    return () => clearInterval(interval);
  }, [load]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      meta: getCatalogMeta(),
      stats: getLibraryStats(),
      search: (filters) => searchBooksDetailed(filters),
      refreshKey,
      refresh: load,
      isReady,
    }),
    [refreshKey, isReady, load],
  );

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={LibraryColors.accent} />
        <ThemedText style={styles.loadingText}>Loading library catalog…</ThemedText>
      </View>
    );
  }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: LibraryColors.surface,
  },
  loadingText: {
    color: LibraryColors.muted,
    fontSize: 15,
  },
});
