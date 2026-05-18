import type { ApiBook } from '@/types/api';

/** Match catalog ID or book # (serialNo) from teacher input */
export function resolveBookCatalogId(input: string, books: ApiBook[]): string {
  const raw = input.trim();
  if (!raw) return '';
  if (books.find((b) => String(b.id) === raw)) return raw;
  const bySerial = books.find((b) => String(b.serialNo) === raw);
  if (bySerial) return String(bySerial.id);
  return raw;
}
