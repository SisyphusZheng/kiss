import { assertArrayIncludes, assertEquals } from '@std/assert';

import {
  deleteNote,
  loadNotes,
  loadProgress,
  loadSettings,
  saveNote,
  saveProgress,
  saveSettings,
  searchNotes,
} from '../storage.ts';
import type { ReaderNote } from '../types.ts';

function makeNote(overrides: Partial<ReaderNote> = {}): ReaderNote {
  return {
    id: crypto.randomUUID(),
    bookId: 'book-1',
    pageNumber: 10,
    quote: 'Hello world',
    note: 'A note',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function resetStorage() {
  localStorage.clear();
}

Deno.test('loadSettings returns defaults on first load', () => {
  resetStorage();
  const s = loadSettings();
  assertEquals(s.theme, 'light');
  assertEquals(s.fontSize, 16);
  assertEquals(s.lineHeight, 1.6);
  assertEquals(s.measure, 65);
});

Deno.test('saveSettings persists and merges with defaults', () => {
  resetStorage();
  saveSettings({ theme: 'dark' });
  const s = loadSettings();
  assertEquals(s.theme, 'dark');
  assertEquals(s.fontSize, 16);
  assertEquals(s.lineHeight, 1.6);
  assertEquals(s.measure, 65);
});

Deno.test('saveSettings partial update preserves other custom fields', () => {
  resetStorage();
  saveSettings({ theme: 'dark', fontSize: 20 });
  saveSettings({ theme: 'sepia' });
  const s = loadSettings();
  assertEquals(s.theme, 'sepia');
  assertEquals(s.fontSize, 20);
  assertEquals(s.lineHeight, 1.6);
  assertEquals(s.measure, 65);
});

Deno.test('corrupt JSON in settings returns defaults', () => {
  resetStorage();
  localStorage.setItem('reader:settings', '{invalid json');
  const s = loadSettings();
  assertEquals(s.theme, 'light');
  assertEquals(s.fontSize, 16);
});

Deno.test('loadProgress returns null on first call', () => {
  resetStorage();
  assertEquals(loadProgress('book-1'), null);
});

Deno.test('saveProgress/loadProgress round-trip', () => {
  resetStorage();
  saveProgress('book-1', 42);
  const p = loadProgress('book-1');
  assertEquals(p?.bookId, 'book-1');
  assertEquals(p?.pageNumber, 42);
  assertEquals(typeof p?.updatedAt, 'string');
});

Deno.test('saveProgress updates existing progress', () => {
  resetStorage();
  saveProgress('book-1', 10);
  saveProgress('book-1', 99);
  assertEquals(loadProgress('book-1')?.pageNumber, 99);
});

Deno.test('loadProgress for different book returns null', () => {
  resetStorage();
  saveProgress('book-1', 42);
  assertEquals(loadProgress('book-other'), null);
});

Deno.test('saveNote persists and loadNotes includes it', () => {
  resetStorage();
  const note = makeNote();
  saveNote(note);
  const notes = loadNotes();
  assertEquals(notes.length, 1);
  assertEquals(notes[0].id, note.id);
  assertEquals(notes[0].quote, note.quote);
});

Deno.test('loadNotes filters by bookId', () => {
  resetStorage();
  const note1 = makeNote({ bookId: 'book-a', id: 'n1' });
  const note2 = makeNote({ bookId: 'book-b', id: 'n2' });
  saveNote(note1);
  saveNote(note2);
  assertEquals(loadNotes('book-a').length, 1);
  assertEquals(loadNotes('book-a')[0].id, 'n1');
  assertEquals(loadNotes('book-b')[0].id, 'n2');
  assertEquals(loadNotes().length, 2);
});

Deno.test('deleteNote removes the correct note', () => {
  resetStorage();
  const note1 = makeNote({ id: 'n1' });
  const note2 = makeNote({ id: 'n2' });
  saveNote(note1);
  saveNote(note2);

  deleteNote('n1');
  const notes = loadNotes();
  assertEquals(notes.length, 1);
  assertEquals(notes[0].id, 'n2');
});

Deno.test('deleteNote on nonexistent id is a no-op', () => {
  resetStorage();
  const note = makeNote();
  saveNote(note);
  deleteNote('nonexistent');
  assertEquals(loadNotes().length, 1);
  assertEquals(loadNotes()[0].id, note.id);
});

Deno.test('corrupt JSON in notes returns empty array', () => {
  resetStorage();
  localStorage.setItem('reader:notes', 'bad json');
  assertEquals(loadNotes().length, 0);
});

Deno.test('corrupt JSON in progress returns null', () => {
  resetStorage();
  localStorage.setItem('reader:progress', 'bad data');
  assertEquals(loadProgress('book-1'), null);
});

Deno.test('searchNotes matches by quote and note content (case-insensitive)', () => {
  resetStorage();
  saveNote(
    makeNote({ id: 'n1', quote: 'Kafka says hello', note: 'deep thought' }),
  );
  saveNote(makeNote({ id: 'n2', quote: 'foo bar', note: 'baz' }));
  saveNote(makeNote({ id: 'n3', quote: 'lorem', note: 'Hello Kafka' }));

  // Match by quote
  const r1 = searchNotes('kafka');
  assertEquals(r1.length, 2);
  const ids = r1.map((n) => n.id);
  assertArrayIncludes(ids, ['n1', 'n3']);

  // Match by note content
  const r2 = searchNotes('deep');
  assertEquals(r2.length, 1);
  assertEquals(r2[0].id, 'n1');

  // No match
  assertEquals(searchNotes('zzznotfound').length, 0);

  // Empty query
  assertEquals(searchNotes('').length, 0);
});
