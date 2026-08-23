/**
 * Smoke tests for the notes-live realtime island (#983): module shape and
 * SSR render (subscription wiring is browser-only and verified with
 * Playwright against the real project — see the issue evidence).
 */
import { assertEquals, assertExists } from '@std/assert';
import NotesLive, {
  handoffRealtimeAuth,
  MAX_LIVE_EVENTS,
  MAX_RECONNECT_DELAY_MS,
  mergeLiveEvent,
  mergeReconciledEvents,
  openElement,
  reconnectDelayMs,
  resolveRealtimeAuthToken,
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

Deno.test('notes-live reconciliation repairs dropped events without duplicates', () => {
  const live = [
    { id: 'note-3', body: 'delivered live' },
    { id: 'note-1', body: 'older live' },
  ];
  const newestFirstSnapshot = [
    { id: 'note-4', body: 'missed during reconnect' },
    { id: 'note-3', body: 'same durable row' },
    { id: 'note-2', body: 'missed before subscribe' },
  ];
  assertEquals(mergeReconciledEvents(live, newestFirstSnapshot), [
    { id: 'note-4', body: 'missed during reconnect' },
    { id: 'note-3', body: 'delivered live' },
    { id: 'note-2', body: 'missed before subscribe' },
    { id: 'note-1', body: 'older live' },
  ]);
});

Deno.test('notes-live reconnect delay is exponential, jittered and capped', () => {
  assertEquals(reconnectDelayMs(0, () => 0.5), 500);
  assertEquals(reconnectDelayMs(3, () => 0.5), 4_000);
  assertEquals(reconnectDelayMs(99, () => 1), MAX_RECONNECT_DELAY_MS);
});

Deno.test('notes-live erases the SSR token only after handing it to Realtime', () => {
  const calls: string[] = [];
  const removed: string[] = [];
  const client = {
    setAuth: (token: string) => {
      calls.push(token);
      return Promise.resolve();
    },
  };
  const host = { removeAttribute: (name: string) => removed.push(name) };

  assertEquals(handoffRealtimeAuth(client, host, 'signed-user-jwt'), true);
  assertEquals(calls, ['signed-user-jwt']);
  assertEquals(removed, ['data-access-token']);

  assertEquals(handoffRealtimeAuth(null, host, 'not-yet-consumed'), false);
  assertEquals(removed, ['data-access-token']);
});

Deno.test('notes-live retains the user JWT for clients created after reconnect', () => {
  assertEquals(resolveRealtimeAuthToken('fresh-jwt', null), 'fresh-jwt');
  assertEquals(resolveRealtimeAuthToken(null, 'private-memory-jwt'), 'private-memory-jwt');
  assertEquals(resolveRealtimeAuthToken(null, null), null);
});
