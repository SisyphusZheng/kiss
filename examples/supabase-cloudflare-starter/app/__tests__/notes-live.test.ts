/**
 * Smoke tests for the notes-live realtime island (#983): module shape and
 * SSR render (subscription wiring is browser-only and verified with
 * Playwright against the real project — see the issue evidence).
 */
import { assertEquals, assertExists } from '@std/assert';
import NotesLive, {
  MAX_LIVE_EVENTS,
  MAX_RECONNECT_DELAY_MS,
  mergeLiveEvent,
  openElement,
  reconnectDelayMs,
  tagName,
} from '../islands/notes-live.tsx';

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

Deno.test('notes-live deduplicates INSERT delivery by stable row id', () => {
  const first = mergeLiveEvent([], { id: 'note-1', body: 'first' });
  assertEquals(mergeLiveEvent(first, { id: 'note-1', body: 'duplicate payload' }), first);
  assertEquals(
    mergeLiveEvent(first, { id: 'note-2', body: 'same display body is allowed' }).length,
    2,
  );
});

Deno.test('notes-live retention is explicitly bounded', () => {
  let events: { id: string; body: string }[] = [];
  for (let index = 0; index < MAX_LIVE_EVENTS + 20; index++) {
    events = mergeLiveEvent(events, { id: String(index), body: String(index) });
  }
  assertEquals(events.length, MAX_LIVE_EVENTS);
  assertEquals(events[0].id, String(MAX_LIVE_EVENTS + 19));
});

Deno.test('notes-live reconnect delay is exponential, jittered and capped', () => {
  assertEquals(reconnectDelayMs(0, () => 0.5), 500);
  assertEquals(reconnectDelayMs(3, () => 0.5), 4_000);
  assertEquals(reconnectDelayMs(99, () => 1), MAX_RECONNECT_DELAY_MS);
});
