import { assertEquals, assertStringIncludes } from '@std/assert';
import { exportNotesToMarkdown } from '../export.ts';
import type { ReaderBook, ReaderNote } from '../types.ts';

const sampleBooks: ReaderBook[] = [{
  id: 'kafka',
  sourceId: 'fixtures',
  title: 'The Metamorphosis',
  author: 'Franz Kafka',
  fileName: 'kafka.pdf',
  path: '/fixtures/kafka.pdf',
  pageCount: 44,
  summary: 'A novella',
  coverColor: '#2d5a27',
}];

const sampleNote: ReaderNote = {
  id: 'note-1',
  bookId: 'kafka',
  page: 42,
  quote: 'As Gregor Samsa awoke...',
  text: 'The opening line is iconic.',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

Deno.test('exportNotesToMarkdown generates valid YAML frontmatter', () => {
  const result = exportNotesToMarkdown([sampleNote], sampleBooks);
  assertStringIncludes(result, 'bookId: kafka');
  assertStringIncludes(result, 'bookTitle: The Metamorphosis');
  assertStringIncludes(result, 'author: Franz Kafka');
  assertStringIncludes(result, 'page: 42');
  assertStringIncludes(result, 'createdAt: 2026-01-01T00:00:00Z');
  assertStringIncludes(result, 'tags: [reader-import]');
});

Deno.test('exportNotesToMarkdown includes quote as blockquote', () => {
  const result = exportNotesToMarkdown([sampleNote], sampleBooks);
  assertStringIncludes(result, '> As Gregor Samsa awoke...');
});

Deno.test('exportNotesToMarkdown includes user note text', () => {
  const result = exportNotesToMarkdown([sampleNote], sampleBooks);
  assertStringIncludes(result, 'The opening line is iconic.');
});

Deno.test('exportNotesToMarkdown includes open-reader backlink', () => {
  const result = exportNotesToMarkdown([sampleNote], sampleBooks);
  assertStringIncludes(result, 'open-reader://books/kafka?page=42');
});

Deno.test('exportNotesToMarkdown handles unknown book gracefully', () => {
  const result = exportNotesToMarkdown([sampleNote], []);
  assertEquals(result, '');
});

Deno.test('exportNotesToMarkdown returns empty string for empty notes', () => {
  const result = exportNotesToMarkdown([], []);
  assertEquals(result, '');
});
