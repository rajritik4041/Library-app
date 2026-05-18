import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getLocalApiBooks, mergeCatalogWithApi } from '@/lib/catalog-to-api';
import { api } from '@/services/api';
import type { ApiBook } from '@/types/api';

type BooksApiContextValue = {
  books: ApiBook[];
  loading: boolean;
  error: string | null;
  apiOnline: boolean;
  refresh: () => Promise<void>;
};

const BooksApiContext = createContext<BooksApiContextValue | null>(null);

/**
 * Pehle hamesha Excel → catalog.json se list.
 * API online ho to issue counts merge (Mongo / file server).
 */
export function BooksApiProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<ApiBook[]>(() => getLocalApiBooks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState(false);

  const refresh = useCallback(async () => {
    const local = getLocalApiBooks();
    setBooks(local);
    setError(null);

    try {
      await api.health();
      const { books: remote } = await api.getBooks();
      setApiOnline(true);
      if (remote.length > 0) {
        setBooks(mergeCatalogWithApi(local, remote));
      } else {
        setBooks(local);
      }
    } catch (e) {
      setApiOnline(false);
      const msg = e instanceof Error ? e.message : 'API offline';
      setError(
        msg.includes('fetch') || msg.includes('Network')
          ? 'Server band hai — npm run server chalayein. Tabhi teacher login / issue kaam karega. Kitabein Excel se yahin dikhengi.'
          : msg,
      );
      setBooks(local);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [refresh]);

  const value = useMemo(
    () => ({ books, loading, error, apiOnline, refresh }),
    [books, loading, error, apiOnline, refresh],
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
