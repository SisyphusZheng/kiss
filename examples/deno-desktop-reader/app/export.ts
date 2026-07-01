import type { ReaderBook, ReaderNote } from './types.ts';

export function exportNotesToMarkdown(
  notes: ReaderNote[],
  books: ReaderBook[],
): string {
  const bookMap = new Map(books.map((b) => [b.id, b]));
  const parts: string[] = [];

  for (const note of notes) {
    const book = bookMap.get(note.bookId);
    if (!book) continue;

    parts.push('---');
    parts.push(`bookId: ${note.bookId}`);
    parts.push(`bookTitle: ${book.title}`);
    if (book.author) parts.push(`author: ${book.author}`);
    if (note.page) parts.push(`page: ${note.page}`);
    parts.push(`createdAt: ${note.createdAt}`);
    parts.push('tags: [reader-import]');
    parts.push('---');
    parts.push('');

    if (note.quote) {
      const quoted = note.quote.split('\n').map((l) => `> ${l}`).join('\n');
      parts.push(quoted);
      parts.push('');
    }

    parts.push(note.text);
    parts.push('');
    parts.push(
      `[Back to reader](open-reader://books/${note.bookId}${
        note.page ? `?page=${note.page}` : ''
      })`,
    );
    parts.push('');
  }

  return parts.join('\n');
}
