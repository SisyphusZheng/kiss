interface WranglerConfig {
  name?: string;
  main?: string;
  queues?: unknown;
  services?: unknown;
  triggers?: unknown;
  [key: string]: unknown;
}

export const SCAN_QUEUE = 'openelement-attachment-scan';
export const SCAN_DLQ = 'openelement-attachment-scan-dlq';

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
