export interface ReaderBook {
  id: string;
  title: string;
  author: string;
  fileName: string;
  pageCount: number;
  summary: string;
  coverColor: string;
}

export interface ReaderProgress {
  bookId: string;
  pageNumber: number;
  updatedAt: string;
}

export interface ReaderNote {
  id: string;
  bookId: string;
  pageNumber: number;
  quote: string;
  note: string;
  createdAt: string;
}

export interface ReaderSettings {
  theme: 'light' | 'dark' | 'sepia';
  fontSize: number;
  lineHeight: number;
  measure: number;
}
