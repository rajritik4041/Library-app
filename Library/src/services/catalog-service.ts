import { Platform } from 'react-native';

import bundledCatalog from '@/data/catalog.json';
import type { Book, BookFilters, BookSearchResult, Catalog, CatalogMeta, SearchMatchReason } from '@/types/book';

let catalog: Catalog = bundledCatalog as Catalog;

export const DEPARTMENT_LABELS: Record<string, string> = {
  FMPE: 'Fluid Mechanics & Power Engineering',
  PFE: 'Production & Industrial Engineering',
  SWCE: 'Soil & Water Conservation Engineering',
  IDE: 'Instrumentation & Data Engineering',
  REE: 'Renewable Energy Engineering',
  BEAS: 'Biological & Agricultural Sciences',
  ME: 'Mechanical Engineering',
  CSE: 'Computer Science & Engineering',
  CE: 'Civil Engineering',
  CHEM: 'Chemistry',
  MISC: 'Miscellaneous',
};

export function setCatalog(next: Catalog): void {
  catalog = next;
}

export function getCatalog(): Catalog {
  return catalog;
}

export function getCatalogMeta(): CatalogMeta {
  return catalog.meta;
}

export function getBooks(): Book[] {
  return catalog.books;
}

export function getBOOKS(): Book[] {
  return catalog.books;
}

export function getDepartmentLabel(code: string): string {
  return DEPARTMENT_LABELS[code] ?? code;
}

export function getBookById(id: string): Book | undefined {
  return catalog.books.find((book) => book.id === id);
}

export function normalizeRack(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

export function rackKey(value: string): string {
  return normalizeRack(value).replace(/\./g, '');
}

export function matchesRack(query: string, rackNo: string): boolean {
  const q = normalizeRack(query);
  if (!q) {
    return true;
  }
  if (!rackNo) {
    return false;
  }

  const r = normalizeRack(rackNo);
  if (r === q || r.includes(q) || q.includes(r)) {
    return true;
  }

  const qKey = rackKey(query);
  const rKey = rackKey(rackNo);
  return qKey.length > 0 && (rKey === qKey || rKey.includes(qKey) || qKey.includes(rKey));
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function matchBook(book: Book, filters: BookFilters): BookSearchResult | null {
  if (filters.department && book.department !== filters.department) {
    return null;
  }
  if (filters.subject && book.subject !== filters.subject) {
    return null;
  }
  if (filters.rack && !matchesRack(filters.rack, book.rackNo)) {
    return null;
  }

  const query = filters.query?.trim() ?? '';
  if (!query) {
    return { book, reasons: [], rackMatch: false };
  }

  const reasons: SearchMatchReason[] = [];
  const tokens = tokenize(query);
  const fullQuery = query.toLowerCase();

  if (matchesRack(query, book.rackNo)) {
    reasons.push('rack');
  }
  if (String(book.serialNo) === query.replace(/\D/g, '') && query.replace(/\D/g, '')) {
    reasons.push('serial');
  }
  if (book.title.toLowerCase().includes(fullQuery)) {
    reasons.push('title');
  }
  if (book.authors.toLowerCase().includes(fullQuery)) {
    reasons.push('author');
  }
  if (book.publisher.toLowerCase().includes(fullQuery)) {
    reasons.push('publisher');
  }
  if (
    book.department.toLowerCase().includes(fullQuery) ||
    book.subject.toLowerCase().includes(fullQuery)
  ) {
    reasons.push('department');
  }

  const tokenMatch = tokens.every((token) => {
    const haystack = [
      book.title,
      book.authors,
      book.publisher,
      book.department,
      book.subject,
      book.rackNo,
      String(book.serialNo),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(token) || matchesRack(token, book.rackNo);
  });

  if (reasons.length === 0 && !tokenMatch) {
    return null;
  }

  if (tokenMatch && reasons.length === 0) {
    if (tokens.some((t) => matchesRack(t, book.rackNo))) {
      reasons.push('rack');
    } else {
      reasons.push('title');
    }
  }

  return {
    book,
    reasons: [...new Set(reasons)],
    rackMatch: reasons.includes('rack') || tokens.some((t) => matchesRack(t, book.rackNo)),
  };
}

export function searchBooks(filters: BookFilters = {}): Book[] {
  return searchBooksDetailed(filters).map((r) => r.book);
}

export function searchBooksDetailed(filters: BookFilters = {}): BookSearchResult[] {
  return catalog.books
    .map((book) => matchBook(book, filters))
    .filter((result): result is BookSearchResult => result !== null)
    .sort((a, b) => {
      if (a.rackMatch !== b.rackMatch) {
        return a.rackMatch ? -1 : 1;
      }
      return a.book.serialNo - b.book.serialNo;
    });
}

export function getUniqueDepartments(): string[] {
  return [...new Set(catalog.books.map((b) => b.department).filter(Boolean))].sort();
}

export function getUniqueSubjects(): string[] {
  return [...new Set(catalog.books.map((b) => b.subject).filter(Boolean))].sort();
}

export function getUniqueRacks(): string[] {
  return [...new Set(catalog.books.map((b) => b.rackNo).filter(Boolean))].sort(
    (a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b),
  );
}

export function getLibraryStats() {
  return {
    totalTitles: catalog.meta.totalBooks,
    totalCopies: catalog.meta.totalCopies,
    departments: getUniqueDepartments().length,
    subjects: getUniqueSubjects().length,
    racks: getUniqueRacks().length,
    lastUpdated: catalog.meta.updatedAt,
  };
}

export function getBooksByDepartment(department: string): Book[] {
  return catalog.books.filter((book) => book.department === department);
}

export function getBooksByRack(rack: string): Book[] {
  return catalog.books.filter((book) => matchesRack(rack, book.rackNo));
}

/** Load latest catalog.json (web: public folder; always checks bundled after fetch) */
export async function refreshCatalog(): Promise<Catalog> {
  if (Platform.OS === 'web') {
    try {
      const response = await fetch(`/catalog.json?ts=${Date.now()}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = (await response.json()) as Catalog;
        if (data?.books?.length) {
          setCatalog(data);
          return data;
        }
      }
    } catch {
      // use bundled catalog
    }
  }
  return catalog;
}
