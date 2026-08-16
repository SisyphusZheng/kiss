interface ScannerEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  METADEFENDER_CORE_URL: string;
  METADEFENDER_API_KEY: string;
}

interface ScanRequest {
  type: 'attachment.scan';
  reservationId: string;
  objectKey: string;
}

interface AuthorizedAttachment {
  object_key: string;
  byte_size: number;
  content_type: string;
}

const BUCKET = 'notes-attachments';
const MAX_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 20_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function configuration(env: ScannerEnv): { supabase: URL; metadefender: URL } {
  const supabase = new URL(env.SUPABASE_URL);
  const metadefender = new URL(env.METADEFENDER_CORE_URL);
  if (
    supabase.protocol !== 'https:' || metadefender.protocol !== 'https:' ||
    metadefender.username || metadefender.password ||
    !env.SUPABASE_SERVICE_ROLE_KEY || !env.METADEFENDER_API_KEY
  ) throw new Error('scanner configuration unavailable');
  return { supabase, metadefender };
}

async function boundedBytes(response: Response, expected: number): Promise<Uint8Array> {
  if (!response.body || expected < 1 || expected > MAX_BYTES) {
    throw new Error('invalid object size');
  }
  const declared = Number(response.headers.get('content-length') ?? expected);
  if (!Number.isSafeInteger(declared) || declared !== expected || declared > MAX_BYTES) {
    throw new Error('object size mismatch');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > expected || total > MAX_BYTES) {
      await reader.cancel('attachment exceeds authorized size');
      throw new Error('object exceeds authorized size');
    }
    chunks.push(value);
  }
  if (total !== expected) throw new Error('object size mismatch');
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function storagePath(origin: URL, objectKey: string): string {
  const encoded = objectKey.split('/').map(encodeURIComponent).join('/');
  return new URL(`/storage/v1/object/authenticated/${BUCKET}/${encoded}`, origin).href;
}

export function createScannerWorker(
  fetchImpl: typeof fetch = fetch,
  options: { timeoutMs?: number } = {},
) {
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  return {
    async fetch(request: Request, env: ScannerEnv): Promise<Response> {
      const correlationId = crypto.randomUUID();
      try {
        if (request.method !== 'POST' || new URL(request.url).pathname !== '/scan') {
          return new Response('Not Found', { status: 404 });
        }
        const config = configuration(env);
        const body = await request.json() as Partial<ScanRequest>;
        if (
          body.type !== 'attachment.scan' || !UUID.test(body.reservationId ?? '') ||
          typeof body.objectKey !== 'string' || body.objectKey.length > 512
        ) return Response.json({ error: 'invalid scan request' }, { status: 400 });

        const authorization = await fetchImpl(
          new URL('/rest/v1/rpc/authorize_attachment_scan', config.supabase),
          {
            method: 'POST',
            headers: {
              apikey: env.SUPABASE_SERVICE_ROLE_KEY,
              authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              target_reservation_id: body.reservationId,
              target_object_key: body.objectKey,
            }),
            signal: AbortSignal.timeout(timeoutMs),
          },
        );
        if (!authorization.ok) throw new Error(`authorization failed (${authorization.status})`);
        const attachment = await authorization.json() as AuthorizedAttachment;
        if (attachment.object_key !== body.objectKey) {
          throw new Error('object substitution rejected');
        }

        const object = await fetchImpl(storagePath(config.supabase, attachment.object_key), {
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!object.ok) throw new Error(`object download failed (${object.status})`);
        const bytes = await boundedBytes(object, Number(attachment.byte_size));

        const scanEndpoint = new URL('/file/sync', config.metadefender);
        const scan = await fetchImpl(scanEndpoint, {
          method: 'POST',
          headers: {
            apikey: env.METADEFENDER_API_KEY,
            'content-type': attachment.content_type,
            filename: 'attachment',
            rule: 'File scan',
          },
          body: Uint8Array.from(bytes).buffer,
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!scan.ok) throw new Error(`provider failed (${scan.status})`);
        const result = await scan.json() as {
          process_info?: { progress_percentage?: number; result?: string };
          scan_results?: { progress_percentage?: number; scan_all_result_i?: number };
        };
        const complete = result.process_info?.progress_percentage === 100;
        const disposition = result.process_info?.result;
        const code = result.scan_results?.scan_all_result_i;
        if (!complete || !Number.isInteger(code)) throw new Error('provider response incomplete');
        if (code === 0 && disposition === 'Allowed') return Response.json({ verdict: 'clean' });
        if ([1, 2, 8].includes(code!) && disposition === 'Blocked') {
          return Response.json({ verdict: 'quarantined' });
        }
        throw new Error(`provider returned non-verdict code ${code}`);
      } catch (error) {
        console.error(JSON.stringify({
          event: 'attachment_scan_failed',
          correlationId,
          reason: error instanceof Error ? error.message : 'unknown failure',
        }));
        return Response.json({ error: 'scan unavailable', correlationId }, { status: 503 });
      }
    },
  };
}

export default createScannerWorker();
