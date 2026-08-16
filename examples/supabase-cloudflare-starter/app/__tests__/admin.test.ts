import { assert, assertEquals, assertRejects } from '@std/assert';
import { isActionFailure, isOpenElementRedirect } from '@openelement/app';

if (!('customElements' in globalThis)) {
  (globalThis as { customElements?: unknown }).customElements = {
    define: () => {},
    get: () => undefined,
  };
}

const { createAdminLoader, createReplayAction } = await import('../routes/admin.tsx');

const ADMIN = { id: 'admin-1', email: 'admin@example.com', app_metadata: { role: 'admin' } };
const ID = '123e4567-e89b-42d3-a456-426614174000';

function client(options: {
  user?: typeof ADMIN | null;
  deadLetters?: unknown[];
  replayError?: { message: string } | null;
  calls?: { name: string; body?: Record<string, string> }[];
} = {}) {
  const { user = ADMIN, deadLetters = [], replayError = null, calls = [] } = options;
  return () => ({
    auth: { getUser: () => Promise.resolve({ data: { user } }) },
    from: () => ({
      select: () => Promise.resolve({ count: 2, error: null }),
    }),
    rpc: (name: string, body?: Record<string, string>) => {
      calls.push({ name, body });
      if (name === 'list_attachment_scan_dead_letters') {
        return Promise.resolve({ data: deadLetters, error: null });
      }
      return Promise.resolve({ data: null, error: replayError });
    },
  });
}

const ctx = () => ({
  request: new Request('http://localhost/admin'),
  env: {},
  responseHeaders: new Headers(),
});

Deno.test('admin loader lists durable scan dead letters', async () => {
  const deadLetters = [{
    id: ID,
    object_key: 'user/object',
    state: 'dead_letter',
    delivery_count: 1,
    first_failed_at: '2026-08-17T00:00:00Z',
  }];
  const data = await createAdminLoader(client({ deadLetters }) as never)(ctx());
  assertEquals(data.noteCount, 2);
  assertEquals(data.deadLetters, deadLetters);
});

Deno.test('admin loader conceals the queue console from non-admin users', async () => {
  const error = await assertRejects(() =>
    createAdminLoader(client({
      user: { ...ADMIN, app_metadata: { role: 'member' } },
    }) as never)(ctx())
  );
  assert(error instanceof Response);
  assertEquals((error as Response).status, 404);
});

Deno.test('replay action validates id and requests one durable replay', async () => {
  const action = createReplayAction(client() as never);
  const invalid = new FormData();
  invalid.set('id', 'not-a-uuid');
  const result = await action({ ...ctx(), formData: invalid });
  assert(isActionFailure(result));
  assertEquals(result.status, 422);

  const calls: { name: string; body?: Record<string, string> }[] = [];
  const valid = new FormData();
  valid.set('id', ID);
  const error = await assertRejects(() =>
    createReplayAction(client({ calls }) as never)({ ...ctx(), formData: valid })
  );
  assert(isOpenElementRedirect(error));
  assertEquals(calls, [{
    name: 'request_attachment_scan_replay',
    body: { dead_letter_id: ID },
  }]);
});
