import { matchesRack } from '@/services/catalog-service';
import type { ApiBook } from '@/types/api';

export type LibraryStats = {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  activeIssues: number;
  departments: number;
  subjects: number;
  racks: number;
};

const EMPTY_STATS: LibraryStats = {
  totalTitles: 0,
  totalCopies: 0,
  availableCopies: 0,
  activeIssues: 0,
  departments: 0,
  subjects: 0,
  racks: 0,
};

export function deriveStatsFromBooks(
  books: ApiBook[],
  activeIssues = 0,
): LibraryStats {
  if (!books.length) {
    return { ...EMPTY_STATS, activeIssues };
  }
  const departments = new Set<string>();
  const subjects = new Set<string>();
  const racks = new Set<string>();
  let totalCopies = 0;
  let availableCopies = 0;

  for (const b of books) {
    if (b.department) departments.add(b.department);
    if (b.subject) subjects.add(b.subject);
    if (b.rackNo) racks.add(b.rackNo);
    totalCopies += b.copies || 0;
    availableCopies += b.availableCount ?? Math.max(0, (b.copies || 0) - (b.issuedCount || 0));
  }

  return {
    totalTitles: books.length,
    totalCopies,
    availableCopies,
    activeIssues,
    departments: departments.size,
    subjects: subjects.size,
    racks: racks.size,
  };
}

export function uniqueDepartments(books: ApiBook[]): string[] {
  return [...new Set(books.map((b) => b.department).filter(Boolean))].sort();
}

export function uniqueSubjects(books: ApiBook[]): string[] {
  return [...new Set(books.map((b) => b.subject).filter(Boolean))].sort();
}

export function uniqueRacks(books: ApiBook[]): string[] {
  return [...new Set(books.map((b) => b.rackNo).filter(Boolean))].sort(
    (a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b),
  );
}

export function findApiBookById(books: ApiBook[], id: string): ApiBook | undefined {
  return books.find((b) => String(b.id) === String(id));
}

export function booksInDepartment(books: ApiBook[], department: string): ApiBook[] {
  return books.filter((b) => b.department === department);
}

export function filterApiBooks(
  books: ApiBook[],
  query: string,
  department?: string,
  subject?: string,
  rack?: string,
): ApiBook[] {
  const q = query.trim().toLowerCase();
  return books.filter((book) => {
    if (department && book.department !== department) return false;
    if (subject && book.subject !== subject) return false;
    if (rack && !matchesRack(rack, book.rackNo)) return false;
    if (!q) return true;
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
    return haystack.includes(q) || matchesRack(q, book.rackNo);
  });
}

export { matchesRack };
