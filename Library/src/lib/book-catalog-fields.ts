import {
  getBookById,
  getBooks,
  getUniqueRacks,
  normalizeRack,
} from '@/services/catalog-service';
import type { ApiBook } from '@/types/api';

function catalogRow(book: Pick<ApiBook, 'id' | 'serialNo'>) {
  return (
    getBookById(String(book.id)) ??
    getBooks().find((b) => b.serialNo === book.serialNo)
  );
}

/** API/Mongo empty ho to Excel catalog.json se rack */
export function resolveBookRackNo(
  book: Pick<ApiBook, 'id' | 'serialNo' | 'rackNo'>,
): string {
  const direct = String(book.rackNo ?? '').trim();
  if (direct) return normalizeRack(direct);
  const local = catalogRow(book);
  return local?.rackNo ? normalizeRack(local.rackNo) : '';
}

export function resolveBookPublisher(
  book: Pick<ApiBook, 'id' | 'serialNo' | 'publisher'>,
): string {
  const fromApi = String(book.publisher ?? '').trim();
  if (fromApi) return fromApi;
  const local = catalogRow(book);
  return (local?.publisher ?? '').trim();
}

export function resolveBookAuthors(
  book: Pick<ApiBook, 'id' | 'serialNo' | 'authors'>,
): string {
  const fromApi = String(book.authors ?? '').trim();
  if (fromApi) return fromApi;
  const local = catalogRow(book);
  return (local?.authors ?? '').trim();
}

/** Publisher, authors, rack — har screen par sahi data */
export function enrichApiBook(book: ApiBook): ApiBook {
  const rackNo = resolveBookRackNo(book);
  const publisher = resolveBookPublisher(book);
  const authors = resolveBookAuthors(book);
  if (
    rackNo === (book.rackNo ?? '').trim() &&
    publisher === (book.publisher ?? '').trim() &&
    authors === (book.authors ?? '').trim()
  ) {
    return book;
  }
  return { ...book, rackNo, publisher, authors };
}

export function resolveIssueBookRack(
  book: { id: string; rackNo?: string } | null | undefined,
): string {
  if (!book) return '';
  const direct = String(book.rackNo ?? '').trim();
  if (direct) return normalizeRack(direct);
  const local = getBookById(String(book.id));
  return local?.rackNo ? normalizeRack(local.rackNo) : '';
}

/** Rack chips / filters — API empty ho to catalog racks */
export function racksForBooks(books: ApiBook[]): string[] {
  const fromBooks = [
    ...new Set(books.map((b) => resolveBookRackNo(b)).filter(Boolean)),
  ].sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b));
  if (fromBooks.length > 0) return fromBooks;
  return getUniqueRacks();
}
