import { assertEquals } from '@std/assert';
import {
  consumeAttachmentScans,
  reconcileAttachments,
  type WorkerEnv,
} from '../../lib/cloudflare-lifecycle.ts';

function env(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test',
    ATTACHMENT_SCANNER: { fetch: () => Promise.resolve(Response.json({ verdict: 'clean' })) },
    ATTACHMENT_SCAN_QUEUE: { send: () => Promise.resolve() },
    ...overrides,
  };
}

Deno.test('queue scan acknowledges only after scanner verdict and atomic RPC', async () => {
  const originalFetch = globalThis.fetch;
  const rpcBodies: unknown[] = [];
  globalThis.fetch = (_input, init) => {
    rpcBodies.push(JSON.parse(String(init?.body)));
    return Promise.resolve(new Response(null, { status: 204 }));
  };
  let acked = 0;
  let retried = 0;
  try {
    await consumeAttachmentScans({
      messages: [{
        body: { type: 'attachment.scan', reservationId: 'r1', objectKey: 'u/o' },
        ack: () => acked++,
        retry: () => retried++,
      }],
    }, env());
  } finally {
    globalThis.fetch = originalFetch;
  }
  assertEquals(acked, 1);
  assertEquals(retried, 0);
  assertEquals(rpcBodies, [{ reservation_id: 'r1', target_key: 'u/o', verdict: 'clean' }]);
});

Deno.test('queue scan retries invalid scanner responses without acknowledging', async () => {
  let acked = 0;
  let retried = 0;
  await consumeAttachmentScans(
    {
      messages: [{
        body: { type: 'attachment.scan', reservationId: 'r1', objectKey: 'u/o' },
        ack: () => acked++,
        retry: () => retried++,
      }],
    },
    env({
      ATTACHMENT_SCANNER: { fetch: () => Promise.resolve(Response.json({ verdict: 'unknown' })) },
    }),
  );
  assertEquals(acked, 0);
  assertEquals(retried, 1);
});

Deno.test('Cron removes stale objects before releasing quota and requeues pending scans', async () => {
  const originalFetch = globalThis.fetch;
  const operations: string[] = [];
  const queued: unknown[] = [];
  globalThis.fetch = (input, init) => {
    const url = String(input);
    if (url.endsWith('/rpc/list_stale_attachment_reservations')) {
      return Promise.resolve(Response.json([{ id: 'stale-1', object_key: 'u/stale' }]));
    }
    if (url.includes('/storage/v1/object/')) {
      operations.push(`storage:${init?.method}`);
      return Promise.resolve(Response.json({}));
    }
    if (url.endsWith('/rpc/release_stale_attachment')) {
      operations.push('release');
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (url.endsWith('/rpc/list_pending_attachment_scans')) {
      return Promise.resolve(Response.json([{ id: 'pending-1', object_key: 'u/pending' }]));
    }
    throw new Error(`unexpected request: ${url}`);
  };
  try {
    await reconcileAttachments(env({
      ATTACHMENT_SCAN_QUEUE: {
        send: (message) => {
          queued.push(message);
          return Promise.resolve();
        },
      },
    }));
  } finally {
    globalThis.fetch = originalFetch;
  }
  assertEquals(operations, ['storage:DELETE', 'release']);
  assertEquals(queued, [{
    type: 'attachment.scan',
    reservationId: 'pending-1',
    objectKey: 'u/pending',
  }]);
});

Deno.test('Cron isolates one enqueue failure so later pending scans still run', async () => {
  const originalFetch = globalThis.fetch;
  const queued: string[] = [];
  globalThis.fetch = (input) => {
    const url = String(input);
    if (url.endsWith('/rpc/list_stale_attachment_reservations')) {
      return Promise.resolve(Response.json([]));
    }
    if (url.endsWith('/rpc/list_pending_attachment_scans')) {
      return Promise.resolve(Response.json([
        { id: 'bad', object_key: 'u/bad' },
        { id: 'good', object_key: 'u/good' },
      ]));
    }
    throw new Error(`unexpected request: ${url}`);
  };
  try {
    await reconcileAttachments(env({
      ATTACHMENT_SCAN_QUEUE: {
        send: (message) => {
          if (message.reservationId === 'bad') {
            return Promise.reject(new Error('queue unavailable'));
          }
          queued.push(message.reservationId);
          return Promise.resolve();
        },
      },
    }));
  } finally {
    globalThis.fetch = originalFetch;
  }
  assertEquals(queued, ['good']);
});
