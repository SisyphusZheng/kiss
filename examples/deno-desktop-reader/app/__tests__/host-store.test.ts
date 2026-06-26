import { assert, assertEquals } from '@std/assert';
import {
  addNote,
  addSource,
  exportNotesMarkdown,
  listBooks,
  listSources,
  type ReaderStorePaths,
  saveProgress,
  searchLibrary,
  syncSource,
} from '../host-store.ts';

async function makePaths(): Promise<ReaderStorePaths> {
  const root = await Deno.makeTempDir({ prefix: 'open-reader-test-' });
  const fixturesDir = `${root}/fixtures`;
  await Deno.mkdir(fixturesDir, { recursive: true });
  await Deno.copyFile(
    new URL('../../fixtures/books/metamorphosis.pdf', import.meta.url),
    `${fixturesDir}/sample.pdf`,
  );
  const fixturesJson = new URL(`file://${root}/fixtures.json`);
  await Deno.writeTextFile(
    fixturesJson,
    JSON.stringify([
      {
        id: 'sample',
        title: 'Sample PDF',
        author: 'Reader Test',
        fileName: 'sample.pdf',
        pageCount: 3,
        summary: 'Kafka fixture',
        coverColor: '#375a4f',
      },
    ]),
  );
  return {
    cacheDir: `${root}/cache`,
    booksDir: `${root}/cache/books`,
    fixturesDir,
    fixturesJson,
  };
}

Deno.test('host store loads fixture source and books from clean cache', async () => {
  const paths = await makePaths();
  const sources = listSources(paths);
  const books = listBooks(paths);
  assertEquals(sources[0].id, 'fixtures');
  assertEquals(books.length, 1);
  assertEquals(books[0].sourceId, 'fixtures');
});

Deno.test('host store syncs local source PDFs into library', async () => {
  const paths = await makePaths();
  const localRoot = await Deno.makeTempDir({ prefix: 'open-reader-local-' });
  await Deno.copyFile(
    new URL('../../fixtures/books/heart-of-darkness.pdf', import.meta.url),
    `${localRoot}/alpha-paper.pdf`,
  );
  const source = await addSource(paths, {
    kind: 'local',
    label: 'Local Papers',
    root: localRoot,
  });
  const result = await syncSource(paths, source.id);
  assertEquals(result.books.length, 1);
  assertEquals(result.books[0].title, 'Alpha Paper');
  assert(listBooks(paths).some((book) => book.sourceId === source.id));
});

Deno.test('host store persists progress, notes, and Obsidian-friendly markdown', async () => {
  const paths = await makePaths();
  saveProgress(paths, {
    bookId: 'sample',
    page: 2,
    zoom: 1.2,
    updatedAt: new Date().toISOString(),
  });
  addNote(paths, {
    bookId: 'sample',
    page: 2,
    quote: 'Gregor',
    text: 'Remember this.',
  });
  const markdown = exportNotesMarkdown(paths);
  assert(markdown.includes('tags: [open-reader]'));
  assert(markdown.includes('page: 2'));
  assert(markdown.includes('Remember this.'));
});

Deno.test('host store searches metadata and notes', async () => {
  const paths = await makePaths();
  addNote(paths, {
    bookId: 'sample',
    page: 1,
    text: 'A private marginalia hit',
  });
  const titleHits = searchLibrary(paths, 'sample');
  const noteHits = searchLibrary(paths, 'marginalia');
  assert(titleHits.some((hit) => hit.source === 'book'));
  assert(noteHits.some((hit) => hit.source === 'note'));
});
