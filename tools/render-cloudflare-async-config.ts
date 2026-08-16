import {
  ATTACHMENT_SCAN_DLQ_NAME,
  ATTACHMENT_SCAN_PERSISTENCE_DLQ_NAME,
  ATTACHMENT_SCAN_QUEUE_NAME,
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

export function withAsyncBindings(
  base: WranglerConfig,
  scannerService = 'openelement-attachment-scanner',
): WranglerConfig {
  if (base.name !== 'openelement-ref-starter' || base.main !== 'cloudflare-entry.ts') {
    throw new Error('unexpected reference Worker identity or entrypoint');
  }
  if (base.queues !== undefined || base.triggers !== undefined || base.services !== undefined) {
    throw new Error('base Wrangler config must stay provider-safe and async-binding-free');
  }
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(scannerService)) {
    throw new Error('scanner service must be a valid explicit Worker name');
  }
  return {
    ...base,
    queues: {
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
    },
    triggers: { crons: ['*/5 * * * *'] },
    services: [{ binding: 'ATTACHMENT_SCANNER', service: scannerService }],
    secrets: { required: ['SUPABASE_SERVICE_ROLE_KEY'] },
  };
}

async function main(args: string[]): Promise<void> {
  const [input, output, scannerService] = args;
  if (!input || !output) throw new Error('usage: render-cloudflare-async-config <input> <output>');
  const base = JSON.parse(await Deno.readTextFile(input)) as WranglerConfig;
  const rendered = withAsyncBindings(base, scannerService);
  await Deno.writeTextFile(output, `${JSON.stringify(rendered, null, 2)}\n`);
  console.log(`Rendered bounded Queue/DLQ/Cron config to ${output}`);
}

if (import.meta.main) await main(Deno.args);
