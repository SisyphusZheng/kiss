import {
  ATTACHMENT_SCAN_DLQ_NAME,
  ATTACHMENT_SCAN_PERSISTENCE_DLQ_NAME,
  ATTACHMENT_SCAN_QUEUE_NAME,
  PAYMENT_EVENT_DLQ_NAME,
  PAYMENT_EVENT_PERSISTENCE_DLQ_NAME,
  PAYMENT_EVENT_QUEUE_NAME,
} from '../examples/supabase-cloudflare-starter/lib/cloudflare-queues.ts';

interface WranglerConfig {
  name?: string;
  main?: string;
  queues?: unknown;
  services?: unknown;
  triggers?: unknown;
  [key: string]: unknown;
}

export const SCAN_QUEUE = ATTACHMENT_SCAN_QUEUE_NAME;
export const SCAN_DLQ = ATTACHMENT_SCAN_DLQ_NAME;
export const SCAN_PERSISTENCE_DLQ = ATTACHMENT_SCAN_PERSISTENCE_DLQ_NAME;
export const PAYMENT_QUEUE = PAYMENT_EVENT_QUEUE_NAME;
export const PAYMENT_DLQ = PAYMENT_EVENT_DLQ_NAME;
export const PAYMENT_PERSISTENCE_DLQ = PAYMENT_EVENT_PERSISTENCE_DLQ_NAME;

export function withAsyncBindings(
  base: WranglerConfig,
  scannerService: string | null = 'openelement-attachment-scanner',
): WranglerConfig {
  if (base.name !== 'openelement-ref-starter' || base.main !== 'cloudflare-entry.ts') {
    throw new Error('unexpected reference Worker identity or entrypoint');
  }
  if (base.queues !== undefined || base.triggers !== undefined || base.services !== undefined) {
    throw new Error('base Wrangler config must stay provider-safe and async-binding-free');
  }
  // #1070 / ADR-0132: a null scanner service omits the ATTACHMENT_SCANNER
  // service binding entirely. Scan messages then fail closed through Queue
  // retry → DLQ → durable dead letter, and attachments stay pending_scan.
  if (scannerService !== null && !/^[a-z0-9][a-z0-9-]{0,62}$/.test(scannerService)) {
    throw new Error('scanner service must be a valid explicit Worker name');
  }
  return {
    ...base,
    queues: {
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
    },
    triggers: { crons: ['*/5 * * * *'] },
    ...(scannerService === null
      ? {}
      : { services: [{ binding: 'ATTACHMENT_SCANNER', service: scannerService }] }),
    secrets: {
      required: [
        'SUPABASE_SERVICE_ROLE_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_PRICE_ID',
      ],
    },
  };
}

async function main(args: string[]): Promise<void> {
  const omitScanner = args.includes('--omit-scanner');
  const [input, output, scannerService] = args.filter((arg) => arg !== '--omit-scanner');
  if (!input || !output) throw new Error('usage: render-cloudflare-async-config <input> <output>');
  const base = JSON.parse(await Deno.readTextFile(input)) as WranglerConfig;
  const rendered = withAsyncBindings(base, omitScanner ? null : scannerService);
  await Deno.writeTextFile(output, `${JSON.stringify(rendered, null, 2)}\n`);
  console.log(
    omitScanner
      ? `Rendered bounded Queue/DLQ/Cron config without the scanner binding to ${output}`
      : `Rendered bounded Queue/DLQ/Cron config to ${output}`,
  );
}

if (import.meta.main) await main(Deno.args);
