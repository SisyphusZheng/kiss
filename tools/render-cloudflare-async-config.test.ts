import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  ATTACHMENT_SCAN_DLQ_NAME,
  ATTACHMENT_SCAN_PERSISTENCE_DLQ_NAME,
  ATTACHMENT_SCAN_QUEUE_NAME,
  PAYMENT_EVENT_DLQ_NAME,
  PAYMENT_EVENT_PERSISTENCE_DLQ_NAME,
  PAYMENT_EVENT_QUEUE_NAME,
} from '../examples/supabase-cloudflare-starter/lib/cloudflare-queues.ts';
import {
  PAYMENT_DLQ,
  PAYMENT_PERSISTENCE_DLQ,
  PAYMENT_QUEUE,
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
    producers: [
      { binding: 'ATTACHMENT_SCAN_QUEUE', queue: SCAN_QUEUE },
      { binding: 'PAYMENT_EVENT_QUEUE', queue: PAYMENT_QUEUE },
    ],
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
    }, {
      queue: PAYMENT_QUEUE,
      max_batch_size: 10,
      max_batch_timeout: 5,
      max_retries: 3,
      retry_delay: 30,
      dead_letter_queue: PAYMENT_DLQ,
    }, {
      queue: PAYMENT_DLQ,
      max_batch_size: 10,
      max_batch_timeout: 5,
      max_retries: 10,
      retry_delay: 60,
      dead_letter_queue: PAYMENT_PERSISTENCE_DLQ,
    }],
  });
  assertEquals(rendered.triggers, { crons: ['*/5 * * * *'] });
  assertEquals(rendered.services, [{
    binding: 'ATTACHMENT_SCANNER',
    service: 'openelement-attachment-scanner',
  }]);
  assertEquals(rendered.secrets, {
    required: [
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_ID',
    ],
  });
});

Deno.test('async overlay omits the scanner binding when the engine is deferred (#1070)', () => {
  const rendered = withAsyncBindings({
    name: 'openelement-ref-starter',
    main: 'cloudflare-entry.ts',
    compatibility_date: '2026-08-16',
  }, null);
  assertEquals(rendered.services, undefined);
  // Queue/DLQ/Cron and the payment secret surface are unchanged: only the
  // scanner service binding is conditional.
  assertEquals(rendered.triggers, { crons: ['*/5 * * * *'] });
  assertEquals((rendered.queues as { consumers: unknown[] }).consumers.length, 4);
  assertEquals(rendered.secrets, {
    required: [
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_ID',
    ],
  });
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

Deno.test('deploy smoke workflow provisions exactly the canonical queue names', async () => {
  // fullstack-deploy-smoke.yml hardcodes the queue names in its provisioning
  // loop and verification step; both must match the canonical constants.
  const workflow = await Deno.readTextFile('.github/workflows/fullstack-deploy-smoke.yml');
  for (
    const name of [
      ATTACHMENT_SCAN_QUEUE_NAME,
      ATTACHMENT_SCAN_DLQ_NAME,
      ATTACHMENT_SCAN_PERSISTENCE_DLQ_NAME,
      PAYMENT_EVENT_QUEUE_NAME,
      PAYMENT_EVENT_DLQ_NAME,
      PAYMENT_EVENT_PERSISTENCE_DLQ_NAME,
    ]
  ) {
    assertStringIncludes(workflow, name);
  }
});
