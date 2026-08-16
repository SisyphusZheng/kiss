import { assertEquals, assertThrows } from '@std/assert';
import {
  SCAN_DLQ,
  SCAN_PERSISTENCE_DLQ,
  SCAN_QUEUE,
  withAsyncBindings,
} from './render-cloudflare-async-config.ts';

Deno.test('async overlay preserves the single entry and adds bounded Queue/DLQ/Cron', () => {
  const rendered = withAsyncBindings({
    name: 'openelement-ref-starter',
    main: 'cloudflare-entry.ts',
    compatibility_date: '2026-08-16',
  });
  assertEquals(rendered.main, 'cloudflare-entry.ts');
  assertEquals(rendered.queues, {
    producers: [{ binding: 'ATTACHMENT_SCAN_QUEUE', queue: SCAN_QUEUE }],
    consumers: [{
      queue: SCAN_QUEUE,
      max_batch_size: 10,
      max_batch_timeout: 5,
      max_retries: 3,
      retry_delay: 30,
      dead_letter_queue: SCAN_DLQ,
    }, {
      queue: SCAN_DLQ,
      max_batch_size: 10,
      max_batch_timeout: 5,
      max_retries: 10,
      retry_delay: 60,
      dead_letter_queue: SCAN_PERSISTENCE_DLQ,
    }],
  });
  assertEquals(rendered.triggers, { crons: ['*/5 * * * *'] });
  assertEquals(rendered.services, [{
    binding: 'ATTACHMENT_SCANNER',
    service: 'openelement-attachment-scanner',
  }]);
  assertEquals(rendered.secrets, { required: ['SUPABASE_SERVICE_ROLE_KEY'] });
});

Deno.test('async overlay rejects a second provider config or entrypoint', () => {
  assertThrows(() =>
    withAsyncBindings({
      name: 'openelement-ref-starter',
      main: 'other.ts',
    })
  );
  assertThrows(() =>
    withAsyncBindings({
      name: 'openelement-ref-starter',
      main: 'cloudflare-entry.ts',
    }, '../invalid')
  );
  assertThrows(() =>
    withAsyncBindings({
      name: 'openelement-ref-starter',
      main: 'cloudflare-entry.ts',
      queues: {},
    })
  );
});
