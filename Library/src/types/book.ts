export type Book = {
  id: string;
  serialNo: number;
  rackNo: string;
  title: string;
  authors: string;
  publisher: string;
  department: string;
  subject: string;
  copies: number;
};

export type CatalogMeta = {
  sourceFile: string;
  sheetName: string;
  updatedAt: string;
  totalBooks: number;
  totalCopies: number;
  checksum: string;
};

export type Catalog = {
  meta: CatalogMeta;
  books: Book[];
};

export type BookFilters = {
  query?: string;
  department?: string;
  subject?: string;
  rack?: string;
};

export type SearchMatchReason = 'title' | 'author' | 'publisher' | 'rack' | 'department' | 'serial';

export type BookSearchResult = {
  book: Book;
  reasons: SearchMatchReason[];
  rackMatch: boolean;
};
