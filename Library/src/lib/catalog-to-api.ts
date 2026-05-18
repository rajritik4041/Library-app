import { getBooks } from '@/services/catalog-service';
import type { ApiBook } from '@/types/api';
import type { Book } from '@/types/book';

/** Excel → catalog.json se list (API ke bina bhi kaam kare) */
export function booksToApiBooks(books: Book[]): ApiBook[] {
  return books.map((b) => ({
    id: b.id,
    mongoId: 'local',
    serialNo: b.serialNo,
    rackNo: b.rackNo,
    title: b.title,
    authors: b.authors,
    publisher: b.publisher,
    department: b.department,
    subject: b.subject,
    copies: b.copies,
    issuedCount: 0,
    availableCount: b.copies,
    status: 'available' as const,
  }));
}

export function bookToApi(b: Book): ApiBook {
  return booksToApiBooks([b])[0];
}

export function getLocalApiBooks(): ApiBook[] {
  return booksToApiBooks(getBooks());
}

/** API se aayi list ko Excel order + IDs par merge — sirf counts update */
export function mergeCatalogWithApi(local: ApiBook[], fromApi: ApiBook[]): ApiBook[] {
  if (!fromApi.length) {
    return local;
  }
  const byId = new Map(fromApi.map((b) => [b.id, b]));
  const merged = local.map((lb) => byId.get(lb.id) ?? lb);
  const localIds = new Set(local.map((b) => b.id));
  for (const ab of fromApi) {
    if (!localIds.has(ab.id)) {
      merged.push(ab);
    }
  }
  return merged;
}
