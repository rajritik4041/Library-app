import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, InteractionManager, type AppStateStatus } from 'react-native';

import { API_URL } from '@/config/api';
import { getLocalApiBooks } from '@/lib/catalog-to-api';
import {
  deriveStatsFromBooks,
  findApiBookById,
  uniqueDepartments,
  uniqueRacks,
  uniqueSubjects,
  booksInDepartment,
  type LibraryStats,
} from '@/lib/api-books';
import { enrichApiBook } from '@/lib/book-catalog-fields';
import { api } from '@/services/api';
import type { ApiBook } from '@/types/api';

type BooksApiContextValue = {
  books: ApiBook[];
  loading: boolean;
  error: string | null;
  apiOnline: boolean;
  apiMode: 'mongodb' | 'file' | null;
  stats: LibraryStats;
  departments: string[];
  racks: string[];
  subjects: string[];
  dataSource: 'mongodb' | 'offline-cache' | 'none';
  getBookById: (id: string) => ApiBook | undefined;
  booksByDepartment: (department: string) => ApiBook[];
  refresh: () => Promise<void>;
};

const BooksApiContext = createContext<BooksApiContextValue | null>(null);

const EMPTY_STATS = deriveStatsFromBooks([]);

/**
 * Primary data source: MongoDB via Library API.
 * Excel/catalog.json sirf offline fallback.
 */
export function BooksApiProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [apiMode, setApiMode] = useState<'mongodb' | 'file' | null>(null);
  const [dataSource, setDataSource] = useState<'mongodb' | 'offline-cache' | 'none'>('none');
  const [activeIssues, setActiveIssues] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => resolve());
    });

    try {
      const health = await api.health();
      const mode = health.mode === 'mongodb' ? 'mongodb' : 'file';
      setApiMode(mode);

      if (!health.ok) {
        setApiOnline(false);
        const hint =
          health.mongo?.error ||
          health.hint ||
          health.warning ||
          'cd Library && npm run setup && npm run server';
        setError(`API offline (${API_URL}). ${hint}`);
        const cached = getLocalApiBooks().map(enrichApiBook);
        if (cached.length > 0) {
          setBooks(cached);
          setDataSource('offline-cache');
        } else {
          setBooks([]);
          setDataSource('none');
        }
        return;
      }

      const [{ books: remote }, statsRes] = await Promise.all([
        api.getBooks(),
        api.getStats().catch(() => null),
      ]);

      setBooks(remote.map(enrichApiBook));
      setApiOnline(mode === 'mongodb');
      setDataSource(mode === 'mongodb' ? 'mongodb' : 'offline-cache');
      setError(
        mode === 'file'
          ? health.warning ||
              health.hint ||
              'FILE mode — run npm run setup (server/.env MONGODB_URI), then npm run server'
          : null,
      );
      setActiveIssues(statsRes?.activeIssues ?? 0);
    } catch (e) {
      setApiOnline(false);
      setApiMode(null);
      const msg = e instanceof Error ? e.message : 'API offline';
      const isNetwork =
        msg.includes('fetch') ||
        msg.includes('Network') ||
        msg.includes('Failed to fetch') ||
        msg.includes('Aborted');
      setError(
        isNetwork
          ? `API server is offline (${API_URL}). Terminal: cd Library && npm run dev  (or run npm run server separately)`
          : msg,
      );
      const cached = getLocalApiBooks().map(enrichApiBook);
      if (cached.length > 0) {
        setBooks(cached);
        setDataSource('offline-cache');
      } else {
        setBooks([]);
        setDataSource('none');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 12_000);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void refresh();
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [refresh]);

  const stats = useMemo(
    () => deriveStatsFromBooks(books, activeIssues),
    [books, activeIssues],
  );

  const departments = useMemo(() => uniqueDepartments(books), [books]);
  const racks = useMemo(() => uniqueRacks(books), [books]);
  const subjects = useMemo(() => uniqueSubjects(books), [books]);

  const getBookById = useCallback((id: string) => findApiBookById(books, id), [books]);

  const booksByDepartment = useCallback(
    (department: string) => booksInDepartment(books, department),
    [books],
  );

  const value = useMemo(
    () => ({
      books,
      loading,
      error,
      apiOnline,
      apiMode,
      stats,
      departments,
      racks,
      subjects,
      dataSource,
      getBookById,
      booksByDepartment,
      refresh,
    }),
    [
      books,
      loading,
      error,
      apiOnline,
      apiMode,
      stats,
      departments,
      racks,
      subjects,
      dataSource,
      getBookById,
      booksByDepartment,
      refresh,
    ],
  );

  return <BooksApiContext.Provider value={value}>{children}</BooksApiContext.Provider>;
}

export function useBooksApi() {
  const ctx = useContext(BooksApiContext);
  if (!ctx) {
    throw new Error('useBooksApi must be used within BooksApiProvider');
  }
  return ctx;
}

/** @deprecated use useBooksApi — MongoDB is the single source when online */
export function useLibraryStats() {
  const { stats, apiOnline, dataSource, loading, error, refresh } = useBooksApi();
  return { stats, apiOnline, dataSource, loading, error, refresh };
}
