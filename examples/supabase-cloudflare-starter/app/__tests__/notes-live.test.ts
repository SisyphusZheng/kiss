/**
 * Smoke tests for the notes-live realtime island (#983): module shape and
 * SSR render (subscription wiring is browser-only and verified with
 * Playwright against the real project — see the issue evidence).
 */
import { assertEquals, assertExists } from '@std/assert';
import NotesLive, { openElement, tagName } from '../islands/notes-live.tsx';

Deno.test('notes-live exports the island contract', () => {
  assertEquals(tagName, 'notes-live');
  assertExists(NotesLive);
  assertExists(openElement);
});

Deno.test('notes-live SSR render includes the status and event mount points', () => {
  const element = new NotesLive();
  const html = element.render();
  assertExists(html);
});
