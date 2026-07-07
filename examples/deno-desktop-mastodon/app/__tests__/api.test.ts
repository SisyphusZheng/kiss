import { assertEquals } from '@std/assert';
import { fetchAccount, fetchPublicTimeline, fetchStatus } from '../api.ts';

Deno.test('fetchPublicTimeline returns fixture statuses', async () => {
  const result = await fetchPublicTimeline({ instance: 'mastodon.social', timeline: 'public' });
  assertEquals(result.ok, true);
  if (!result.ok) return;
  assertEquals(Array.isArray(result.data), true);
  assertEquals(result.data.length >= 1, true);
  assertEquals(typeof result.data[0].id, 'string');
});

Deno.test('fetchAccount returns fixture account', async () => {
  const result = await fetchAccount({ instance: 'mastodon.social', acct: 'admin@mastodon.social' });
  assertEquals(result.ok, true);
  if (!result.ok) return;
  assertEquals(result.data.username, 'admin');
});

Deno.test('fetchStatus returns fixture status', async () => {
  const result = await fetchStatus({ instance: 'mastodon.social', id: '111111111111111111' });
  assertEquals(result.ok, true);
  if (!result.ok) return;
  assertEquals(result.data.id, '111111111111111111');
});
